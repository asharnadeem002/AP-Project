import Image from "next/image";
import React, { useState, useRef, ChangeEvent } from "react";
import Head from "next/head";
import { GetServerSideProps } from "next";
import { DashboardLayout } from "../app/components/dashboard/DashboardLayout";
import { Button } from "../app/components/shared/Button";
import { Input } from "../app/components/shared/Input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../app/components/shared/Card";
import { useAuth } from "../app/lib/AuthContext";
import { verifyJwt, JWTPayload } from "../app/lib/jwt";
import prisma from "../app/lib/db";
import { LoadingPage } from "../app/components/shared/Loader";
import { toast } from "react-toastify";

interface UserProfile {
  id: string;
  email: string;
  username: string;
  phoneNumber?: string;
  gender?: string;
  profilePicture?: string;
  role: string;
  isVerified: boolean;
  isApproved: boolean;
  createdAt: string;
}

interface ProfilePageProps {
  userProfile: UserProfile;
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

    const user = await prisma.user.findUnique({
      where: { id: typedPayload.userId },
      select: {
        id: true,
        email: true,
        username: true,
        phoneNumber: true,
        gender: true,
        profilePicture: true,
        role: true,
        isVerified: true,
        isApproved: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new Error("User not found");
    }

    return {
      props: {
        userProfile: {
          ...user,
          createdAt: user.createdAt.toISOString(),
        },
      },
    };
  } catch (error) {
    console.error("Profile page error:", error);

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

export default function ProfilePage({ userProfile }: ProfilePageProps) {
  const { updateProfile, uploadProfilePicture, isLoading } = useAuth();
  const [formData, setFormData] = useState({
    username: userProfile.username,
    phoneNumber: userProfile.phoneNumber || "",
    gender: userProfile.gender || "",
  });
  const [profileImg, setProfileImg] = useState<string>(
    userProfile.profilePicture || ""
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size should be less than 5MB");
      return;
    }

    setIsUploading(true);
    try {
      const result = await uploadProfilePicture(file);
      if (result.success && result.profilePicture) {
        setProfileImg(result.profilePicture);
        toast.success("Profile picture uploaded successfully");
      } else {
        toast.error(result.message || "Failed to upload profile picture");
      }
    } catch (error) {
      console.error("Profile picture upload error:", error);
      toast.error("An error occurred while uploading your profile picture");
    } finally {
      setIsUploading(false);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSuccess(false);

    try {
      const result = await updateProfile(formData);

      if (result.success) {
        setSuccess(true);
        toast.success("Profile updated successfully");
      } else {
        toast.error(result.message || "Failed to update profile");
      }
    } catch (error) {
      console.error("Profile update error:", error);
      toast.error("An error occurred while updating your profile");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <LoadingPage message="Loading profile..." />;
  }

  return (
    <>
      <Head>
        <title>Your Profile | SnapTrace</title>
        <meta name="description" content="Manage your SnapTrace profile" />
      </Head>

      <DashboardLayout>
        <div className="space-y-6 p-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Your Profile
            </h1>
            <p className="text-gray-500 dark:text-gray-400">
              Manage your account information
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Account Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="mb-6 flex flex-col items-center">
                  <div className="relative w-24 h-24 mb-3">
                    <div className="w-full h-full rounded-full overflow-hidden border-2 border-gray-300 bg-gray-200 flex items-center justify-center">
                      {profileImg ? (
                        <Image
                          src={profileImg}
                          alt="Profile"
                          className="w-full h-full object-cover"
                          width={96}
                          height={96}
                        />
                      ) : (
                        <svg
                          className="w-12 h-12 text-gray-500"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                            clipRule="evenodd"
                          />
                        </svg>
                      )}
                    </div>
                    <button
                      type="button"
                      className="absolute bottom-0 right-0 bg-blue-600 text-white p-1 rounded-full hover:bg-blue-700 focus:outline-none"
                      onClick={triggerFileInput}
                      disabled={isUploading}
                    >
                      {isUploading ? (
                        <svg
                          className="animate-spin h-5 w-5"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                      ) : (
                        <svg
                          className="h-5 w-5"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M4 5a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V7a2 2 0 00-2-2h-1.586a1 1 0 01-.707-.293l-1.121-1.121A2 2 0 0011.172 3H8.828a2 2 0 00-1.414.586L6.293 4.707A1 1 0 015.586 5H4zm6 9a3 3 0 100-6 3 3 0 000 6z"
                            clipRule="evenodd"
                          />
                        </svg>
                      )}
                    </button>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                    disabled={isUploading}
                  />
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Click the camera icon to change your profile picture
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <Input
                    label="Email"
                    id="email"
                    type="email"
                    value={userProfile.email}
                    disabled
                    className="bg-gray-100"
                  />

                  <Input
                    label="Username"
                    id="username"
                    name="username"
                    type="text"
                    value={formData.username}
                    onChange={handleChange}
                    required
                  />

                  <Input
                    label="Phone Number"
                    id="phoneNumber"
                    name="phoneNumber"
                    type="tel"
                    value={formData.phoneNumber}
                    onChange={handleChange}
                  />

                  <div className="mb-4">
                    <label
                      htmlFor="gender"
                      className="block text-sm font-medium text-white mb-1"
                    >
                      Gender
                    </label>
                    <select
                      id="gender"
                      name="gender"
                      value={formData.gender}
                      onChange={(e) =>
                        setFormData({ ...formData, gender: e.target.value })
                      }
                      className="w-full bg-gray-700 p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Prefer not to say</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <Button
                    type="submit"
                    isLoading={isSubmitting}
                    disabled={isSubmitting}
                  >
                    Save Changes
                  </Button>

                  {success && (
                    <p className="text-green-600 mt-2">
                      Profile updated successfully!
                    </p>
                  )}
                </form>
              </CardContent>
            </Card>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Account Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm font-medium text-gray-500">
                        Email Verification
                      </p>
                      <p className="mt-1 flex items-center">
                        {userProfile.isVerified ? (
                          <span className="text-green-600 flex items-center">
                            <svg
                              className="w-5 h-5 mr-1"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                clipRule="evenodd"
                              />
                            </svg>
                            Verified
                          </span>
                        ) : (
                          <span className="text-red-600">Not Verified</span>
                        )}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm font-medium text-gray-500">
                        Admin Approval
                      </p>
                      <p className="mt-1 flex items-center">
                        {userProfile.isApproved ? (
                          <span className="text-green-600 flex items-center">
                            <svg
                              className="w-5 h-5 mr-1"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                clipRule="evenodd"
                              />
                            </svg>
                            Approved
                          </span>
                        ) : (
                          <span className="text-yellow-600">
                            Pending Approval
                          </span>
                        )}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm font-medium text-gray-500">
                        User Role
                      </p>
                      <p className="mt-1 capitalize">
                        {userProfile.role.toLowerCase()}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm font-medium text-gray-500">
                        Member Since
                      </p>
                      <p className="mt-1">
                        {new Date(userProfile.createdAt).toLocaleDateString()}
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
