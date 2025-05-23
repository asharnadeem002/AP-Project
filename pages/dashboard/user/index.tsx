import React, { useEffect, useState } from "react";
import Head from "next/head";
import { DashboardLayout } from "../../../app/components/dashboard/DashboardLayout";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../../app/components/shared/Card";
import { useAuth } from "../../../app/lib/AuthContext";
import { useRouter } from "next/router";
import { LoadingPage } from "../../../app/components/shared/Loader";
import { GetServerSideProps } from "next";
import { verifyJwt } from "../../../app/lib/jwt";
import prisma from "../../../app/lib/db";

interface UserDashboardProps {
  initialData: {
    galleryItems: number;
    favoriteItems: number;
    subscriptionStatus: string;
    subscriptionPlan: string;
  };
  recentActivity: Array<{
    action: string;
    timestamp: string;
    details: string;
  }>;
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
      return {
        redirect: {
          destination: "/login",
          permanent: false,
        },
      };
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.userId as string },
    });

    if (user && user.role === "ADMIN") {
      return {
        redirect: {
          destination: "/dashboard/admin",
          permanent: false,
        },
      };
    }

    if (!user || user.role !== "USER") {
      return {
        redirect: {
          destination: "/login",
          permanent: false,
        },
      };
    }

    const galleryItemsCount = await prisma.galleryItem.count({
      where: { userId: user.id },
    });

    const favoriteItemsCount = await prisma.galleryItem.count({
      where: {
        userId: user.id,
        isFavorite: true,
      },
    });

    const subscription = await prisma.subscription.findFirst({
      where: {
        userId: user.id,
        status: "ACTIVE",
      },
    });

    const recentActivity = [
      {
        action: "Uploaded photo",
        timestamp: new Date().toISOString(),
        details: "You uploaded a new photo to your gallery",
      },
      {
        action: "Marked favorite",
        timestamp: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
        details: "You marked a photo as favorite",
      },
      {
        action: "Login",
        timestamp: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
        details: "You logged in to your account",
      },
    ];

    return {
      props: {
        initialData: {
          galleryItems: galleryItemsCount,
          favoriteItems: favoriteItemsCount,
          subscriptionStatus: subscription
            ? "Active"
            : "No active subscription",
          subscriptionPlan: subscription?.plan || "FREE",
        },
        recentActivity,
      },
    };
  } catch (error) {
    console.error("User dashboard auth error:", error);
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

export default function UserDashboardPage({
  initialData,
  recentActivity,
}: UserDashboardProps) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [dashboardData, setDashboardData] = useState(initialData);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login");
    }
  }, [isLoading, user, router]);

  useEffect(() => {
    setDashboardData(initialData);
  }, [initialData]);

  if (isLoading) {
    return <LoadingPage message="Loading your dashboard..." />;
  }

  if (!user) {
    return null;
  }

  return (
    <>
      <Head>
        <title>User Dashboard | SnapTrace</title>
        <meta name="description" content="SnapTrace user dashboard" />
      </Head>

      <DashboardLayout>
        <div className="space-y-6 p-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              My Dashboard
            </h1>
            <p className="text-gray-500 dark:text-gray-400">
              Welcome back, {user?.username}!
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>My Gallery</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {dashboardData.galleryItems}
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  Photos in your collection
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Favorites</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {dashboardData.favoriteItems}
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  Photos marked as favorites
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Subscription</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {dashboardData.subscriptionPlan}
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  {dashboardData.subscriptionStatus}
                </p>
              </CardContent>
            </Card>
          </div>
          <div className="grid grid-cols-1 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentActivity.map((activity, index) => (
                    <div
                      key={index}
                      className="flex items-center p-2 bg-gray-50 dark:bg-slate-800 rounded"
                    >
                      <div className="ml-4">
                        <p className="text-sm font-medium">{activity.action}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(activity.timestamp).toLocaleDateString()} -{" "}
                          {activity.details}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>{" "}
          <div className="flex justify-center">
            <button
              className="px-5 py-3 font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
              onClick={() => (window.location.href = "user/gallery")}
            >
              Upload New Photos
            </button>
          </div>
        </div>
      </DashboardLayout>
    </>
  );
}
