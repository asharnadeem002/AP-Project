import React, { useState } from "react";
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
import { verifyJwt } from "../app/lib/jwt";
import prisma from "../app/lib/db";
import { LoadingPage } from "../app/components/shared/Loader";
import { toast } from "react-toastify";

// Type for user profile data
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

/**
 * Server-Side Rendering (SSR) for the profile page
 * Benefits of using getServerSideProps here:
 * 1. Always has up-to-date user data on each request
 * 2. Protects private user data since it loads server-side
 * 3. SEO isn't important for a private profile page
 * 4. Contains user-specific information that shouldn't be cached
 */
export const getServerSideProps: GetServerSideProps = async (context) => {
  // Get auth token from cookies
  const token = context.req.cookies.authToken;

  // If no token, redirect to login
  if (!token) {
    return {
      redirect: {
        destination: "/login",
        permanent: false,
      },
    };
  }

  try {
    // Verify token
    const payload = verifyJwt(token);

    if (!payload || !payload.userId) {
      throw new Error("Invalid token");
    }

    // Get user data from database
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
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

    // If token verification fails, redirect to login
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

/**
 * The Profile page component
 * This page is server-side rendered with the user's profile data
 */
export default function ProfilePage({ userProfile }: ProfilePageProps) {
  const { user, updateProfile, isLoading } = useAuth();
  const [formData, setFormData] = useState({
    username: userProfile.username,
    phoneNumber: userProfile.phoneNumber || "",
    gender: userProfile.gender || "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
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
                      className="block text-sm font-medium text-gray-700 mb-1"
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
                      className="w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
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
