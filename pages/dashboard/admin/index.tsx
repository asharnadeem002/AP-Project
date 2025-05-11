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

// Define types for our server-side props
interface AdminDashboardProps {
  initialStats: {
    totalUsers: number;
    pendingApprovals: number;
    activeSubscriptions: number;
    totalRevenue: number;
  };
  recentUsers: Array<{
    email: string;
    registeredAt: string;
    status: string;
  }>;
  recentSubscriptions: Array<{
    planName: string;
    username: string;
    amount: number;
    date: string;
  }>;
}

/**
 * Server-Side Rendering (SSR)
 * This function runs on every request, allowing us to:
 * 1. Check authentication on the server
 * 2. Fetch real-time data from the database
 * 3. Redirect if not authorized
 * 4. Pre-render the page with the latest data
 */
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

    if (!payload || typeof payload !== 'object' || !('userId' in payload)) {
      throw new Error("Invalid token");
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: payload.userId as string },
    });

    // Check if user is admin
    if (!user || user.role !== "ADMIN") {
      return {
        redirect: {
          destination: "/dashboard",
          permanent: false,
        },
      };
    }

    // Get dashboard stats from database
    const totalUsers = await prisma.user.count();
    const pendingApprovals = await prisma.user.count({
      where: { isApproved: false },
    });
    const activeSubscriptions = await prisma.subscription.count({
      where: { status: "ACTIVE" },
    });

    const subscriptions = await prisma.subscription.findMany({
      where: { status: "ACTIVE" },
    });

    const totalRevenue = subscriptions.reduce((total, sub) => {
      let price = 0;
      switch (sub.plan) {
        case "BASIC":
          price = 9.99;
          break;
        case "PREMIUM":
          price = 19.99;
          break;
        case "ENTERPRISE":
          price = 49.99;
          break;
        default:
          price = 0;
      }
      return total + price;
    }, 0);

    // Get recent users
    const recentUsersData = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      take: 3,
      select: {
        email: true,
        createdAt: true,
        isApproved: true,
      },
    });

    const recentUsers = recentUsersData.map((user) => ({
      email: user.email,
      registeredAt: user.createdAt.toISOString(),
      status: user.isApproved ? "Approved" : "Pending",
    }));

    // Get recent subscriptions
    const recentSubscriptionsData = await prisma.subscription.findMany({
      orderBy: { createdAt: "desc" },
      take: 3,
      include: {
        user: true,
      },
    });

    const recentSubscriptions = recentSubscriptionsData.map((sub) => {
      let amount = 0;
      switch (sub.plan) {
        case "BASIC":
          amount = 9.99;
          break;
        case "PREMIUM":
          amount = 19.99;
          break;
        case "ENTERPRISE":
          amount = 49.99;
          break;
        default:
          amount = 0;
      }

      return {
        planName: sub.plan,
        username: sub.user?.username || "Unknown User",
        amount: amount,
        date: sub.createdAt.toISOString(),
      };
    });

    return {
      props: {
        initialStats: {
          totalUsers,
          pendingApprovals,
          activeSubscriptions,
          totalRevenue,
        },
        recentUsers,
        recentSubscriptions,
      },
    };
  } catch (error) {
    console.error("Admin dashboard auth error:", error);
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

export default function AdminDashboardPage({
  initialStats,
  recentUsers,
  recentSubscriptions,
}: AdminDashboardProps) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState(initialStats);
  useEffect(() => {
    // Client-side auth check as a backup
    if (!isLoading && !user) {
      window.location.href = "/login";
      return;
    }

    if (!isLoading && user?.role !== "ADMIN") {
      window.location.href = "/dashboard";
      return;
    }

    // Update stats from props
    setStats(initialStats);
  }, [user, isLoading, router, initialStats]);

  if (isLoading) {
    return <LoadingPage message="Loading admin dashboard..." />;
  }

  return (
    <>
      <Head>
        <title>Admin Dashboard | SnapTrace</title>
        <meta name="description" content="SnapTrace admin dashboard" />
      </Head>

      <DashboardLayout>
        <div className="space-y-6 p-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Admin Dashboard
            </h1>
            <p className="text-gray-500 dark:text-gray-400">
              Welcome, Admin {user?.username}!
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Total Users</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats.totalUsers}</div>
                <p className="text-sm text-gray-500 mt-2">Registered users</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Pending Approvals</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {stats.pendingApprovals}
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  Users awaiting approval
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Active Subscriptions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {stats.activeSubscriptions}
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  Current active subscriptions
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Total Revenue</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  ${stats.totalRevenue.toFixed(2)}
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  In subscription revenue
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Recent User Registrations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentUsers.map((user, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-2 bg-gray-50 dark:bg-slate-800 rounded"
                    >
                      <div>
                        <p className="text-sm font-medium">{user.email}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(user.registeredAt).toLocaleString()}
                        </p>
                      </div>
                      <span
                        className={`px-2 py-1 text-xs ${
                          user.status === "Approved"
                            ? "bg-green-100 text-green-800"
                            : "bg-yellow-100 text-yellow-800"
                        } rounded-full`}
                      >
                        {user.status}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Subscription Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentSubscriptions.map((sub, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-2 bg-gray-50 dark:bg-slate-800 rounded"
                    >
                      <div>
                        <p className="text-sm font-medium">
                          {sub.planName} Subscription
                        </p>
                        <p className="text-xs text-gray-500">
                          By {sub.username} -{" "}
                          {new Date(sub.date).toLocaleDateString()}
                        </p>
                      </div>
                      <span className="text-sm font-bold">
                        ${sub.amount.toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </DashboardLayout>
    </>
  );
}
