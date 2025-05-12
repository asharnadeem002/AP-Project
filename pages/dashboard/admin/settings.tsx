import React, { useState } from "react";
import Head from "next/head";
import { GetServerSideProps } from "next";
import { DashboardLayout } from "../../../app/components/dashboard/DashboardLayout";
import { Button } from "../../../app/components/shared/Button";
import { Input } from "../../../app/components/shared/Input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../../app/components/shared/Card";
import { useAuth } from "../../../app/lib/AuthContext";
import { verifyJwt, JWTPayload } from "../../../app/lib/jwt";
import prisma from "../../../app/lib/db";
import { LoadingPage } from "../../../app/components/shared/Loader";
import { toast } from "react-toastify";
import { Switch } from "../../../app/components/shared/Switch";
import { Role } from "@prisma/client";

type NotificationSettings = {
  emailNotifications: boolean;
  smsNotifications: boolean;
  appNotifications: boolean;
};

interface SettingsPageProps {
  userData: {
    id: string;
    email: string;
    username: string;
    role: string;
    notifications: NotificationSettings;
  };
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const token = context.req.cookies.authToken;

  if (!token) {
    return {
      redirect: {
        destination: "/login",
        permanent: false,
      },
    };
  }

  try {
    const payload = await verifyJwt(token);

    if (!payload || typeof payload !== "object" || !("userId" in payload)) {
      throw new Error("Invalid token");
    }

    const typedPayload = payload as JWTPayload;
    const userId = typedPayload.userId;

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new Error("User not found");
    }

    if (user.role !== Role.ADMIN) {
      return {
        redirect: {
          destination: "/dashboard/user/settings",
          permanent: false,
        },
      };
    }

    const defaultNotifications: NotificationSettings = {
      emailNotifications: true,
      smsNotifications: false,
      appNotifications: true,
    };

    let notifications = defaultNotifications;

    const rawResult = (await prisma.$queryRaw`
      SELECT notifications FROM User WHERE id = ${userId}
    `) as Array<{ notifications: unknown }>;

    if (rawResult?.[0]?.notifications) {
      try {
        const rawData = rawResult[0].notifications;
        let parsedData;

        if (typeof rawData === "string") {
          try {
            parsedData = JSON.parse(rawData);
          } catch (e) {
            console.error("Failed to parse notifications string:", e);
            parsedData = null;
          }
        } else {
          parsedData = rawData;
        }

        if (parsedData && typeof parsedData === "object") {
          notifications = {
            emailNotifications: Boolean(
              parsedData.emailNotifications ??
                defaultNotifications.emailNotifications
            ),
            smsNotifications: Boolean(
              parsedData.smsNotifications ??
                defaultNotifications.smsNotifications
            ),
            appNotifications: Boolean(
              parsedData.appNotifications ??
                defaultNotifications.appNotifications
            ),
          };
        }
      } catch (e) {
        console.error("Error processing notifications:", e);
      }
    }

    return {
      props: {
        userData: {
          id: user.id,
          email: user.email,
          username: user.username,
          role: user.role,
          notifications,
        },
      },
    };
  } catch (error) {
    console.error("Admin settings page error:", error);

    return {
      redirect: {
        destination: "/login",
        permanent: false,
      },
    };
  } finally {
    await prisma.$disconnect();
  }
};

export default function AdminSettingsPage({ userData }: SettingsPageProps) {
  const { isLoading } = useAuth();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [isResetting, setIsResetting] = useState(false);
  const [isUpdatingNotifications, setIsUpdatingNotifications] = useState(false);
  const [notifications, setNotifications] = useState<NotificationSettings>(
    userData.notifications
  );

  const validatePassword = () => {
    if (!currentPassword) {
      setPasswordError("Current password is required");
      return false;
    }

    if (!newPassword) {
      setPasswordError("New password is required");
      return false;
    }

    if (newPassword.length < 8) {
      setPasswordError("Password must be at least 8 characters");
      return false;
    }

    const hasUpperCase = /[A-Z]/.test(newPassword);
    const hasLowerCase = /[a-z]/.test(newPassword);
    const hasNumber = /[0-9]/.test(newPassword);
    const hasSpecial = /[^A-Za-z0-9]/.test(newPassword);

    if (!hasUpperCase || !hasLowerCase || !hasNumber || !hasSpecial) {
      setPasswordError(
        "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character"
      );
      return false;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("Passwords do not match");
      return false;
    }

    setPasswordError("");
    return true;
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validatePassword()) {
      return;
    }

    setIsResetting(true);
    try {
      const response = await fetch("/api/users/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Password changed successfully");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        toast.error(data.message || "Failed to change password");
      }
    } catch (error) {
      console.error("Password reset error:", error);
      toast.error("An error occurred. Please try again.");
    } finally {
      setIsResetting(false);
    }
  };

  const handleNotificationChange = (name: string, checked: boolean) => {
    setNotifications({
      ...notifications,
      [name]: checked,
    });
  };

  const updateNotificationSettings = async () => {
    setIsUpdatingNotifications(true);
    try {
      const response = await fetch("/api/users/update-notifications", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ notifications }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Notification settings updated");
      } else {
        toast.error(data.message || "Failed to update notification settings");
      }
    } catch (error) {
      console.error("Update notification settings error:", error);
      toast.error("An error occurred. Please try again.");
    } finally {
      setIsUpdatingNotifications(false);
    }
  };

  if (isLoading) {
    return <LoadingPage message="Loading settings..." />;
  }

  return (
    <>
      <Head>
        <title>Admin Settings | SnapTrace</title>
        <meta name="description" content="Manage your account settings" />
      </Head>

      <DashboardLayout>
        <div className="space-y-6 p-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Admin Settings
            </h1>
            <p className="text-gray-500 dark:text-gray-400">
              Manage your admin account settings and preferences
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Change Password</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleResetPassword} className="space-y-4">
                  <Input
                    label="Current Password"
                    id="currentPassword"
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                  />

                  <Input
                    label="New Password"
                    id="newPassword"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                  />

                  <Input
                    label="Confirm New Password"
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />

                  {passwordError && (
                    <p className="text-red-500 text-sm">{passwordError}</p>
                  )}

                  <Button
                    type="submit"
                    isLoading={isResetting}
                    disabled={isResetting}
                  >
                    Change Password
                  </Button>
                </form>
              </CardContent>
            </Card>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Notification Settings</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-md font-medium">
                          Email Notifications
                        </h3>
                        <p className="text-sm text-gray-500">
                          Receive notifications about system activity via email
                        </p>
                      </div>
                      <Switch
                        checked={notifications.emailNotifications}
                        onChange={(checked) =>
                          handleNotificationChange(
                            "emailNotifications",
                            checked
                          )
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-md font-medium">
                          SMS Notifications
                        </h3>
                        <p className="text-sm text-gray-500">
                          Receive time-sensitive notifications via SMS
                        </p>
                      </div>
                      <Switch
                        checked={notifications.smsNotifications}
                        onChange={(checked) =>
                          handleNotificationChange("smsNotifications", checked)
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-md font-medium">
                          App Notifications
                        </h3>
                        <p className="text-sm text-gray-500">
                          Receive notifications in the application dashboard
                        </p>
                      </div>
                      <Switch
                        checked={notifications.appNotifications}
                        onChange={(checked) =>
                          handleNotificationChange("appNotifications", checked)
                        }
                      />
                    </div>

                    <Button
                      type="button"
                      isLoading={isUpdatingNotifications}
                      disabled={isUpdatingNotifications}
                      onClick={updateNotificationSettings}
                      className="mt-4"
                    >
                      Save Notification Settings
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Administrator Account</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm font-medium text-gray-500">
                        Username
                      </p>
                      <p className="mt-1">{userData.username}</p>
                    </div>

                    <div>
                      <p className="text-sm font-medium text-gray-500">Email</p>
                      <p className="mt-1">{userData.email}</p>
                    </div>

                    <div>
                      <p className="text-sm font-medium text-gray-500">
                        Account Type
                      </p>
                      <p className="mt-1 capitalize">
                        {userData.role.toLowerCase()}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </>
  );
}
