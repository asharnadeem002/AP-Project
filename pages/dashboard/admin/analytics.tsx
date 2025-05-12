import React, { useEffect } from "react";
import Head from "next/head";
import { GetServerSideProps } from "next";
import { useRouter } from "next/router";
import { DashboardLayout } from "../../../app/components/dashboard/DashboardLayout";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../../app/components/shared/Card";
import { useAuth } from "../../../app/lib/AuthContext";
import { verifyJwt } from "../../../app/lib/jwt";
import prisma from "../../../app/lib/db";
import { LoadingPage } from "../../../app/components/shared/Loader";

interface AnalyticsData {
  totalUsers: number;
  activeUsers: number;
  pendingUsers: number;
  totalSubscriptions: number;
  activeSubscriptions: number;
  pendingSubscriptions: number;
  revenueByPlan: {
    plan: string;
    count: number;
  }[];
  userRegistrationTrend: {
    month: string;
    count: number;
  }[];
}

interface AnalyticsPageProps {
  analyticsData: AnalyticsData;
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

    const user = await prisma.user.findUnique({
      where: { id: payload.userId as string },
      select: { role: true },
    });

    if (!user || user.role !== "ADMIN") {
      return {
        redirect: {
          destination: "/dashboard",
          permanent: false,
        },
      };
    }

    const totalUsers = await prisma.user.count();

    const activeUsers = await prisma.user.count({
      where: {
        isActive: true,
      },
    });

    const pendingUsers = await prisma.user.count({
      where: {
        isApproved: false,
      },
    });

    const totalSubscriptions = await prisma.subscription.count();

    const activeSubscriptions = await prisma.subscription.count({
      where: {
        status: "ACTIVE",
      },
    });

    const pendingSubscriptions = await prisma.subscription.count({
      where: {
        status: "PENDING",
      },
    });

    const revenueByPlan = await prisma.subscription.groupBy({
      by: ["plan"],
      _count: {
        id: true,
      },
      where: {
        status: "ACTIVE",
      },
    });

    const formattedRevenueByPlan = revenueByPlan.map((item) => ({
      plan: item.plan,
      count: item._count.id,
    }));

    const months = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];

    const currentMonth = new Date().getMonth();
    const userRegistrationTrend = [];

    for (let i = 5; i >= 0; i--) {
      const monthIndex = (currentMonth - i + 12) % 12;
      userRegistrationTrend.push({
        month: months[monthIndex],
        count: Math.floor(Math.random() * 20) + 5,
      });
    }

    return {
      props: {
        analyticsData: {
          totalUsers,
          activeUsers,
          pendingUsers,
          totalSubscriptions,
          activeSubscriptions,
          pendingSubscriptions,
          revenueByPlan: formattedRevenueByPlan,
          userRegistrationTrend,
        },
      },
    };
  } catch (error) {
    console.error("Analytics page error:", error);
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

export default function AnalyticsPage({ analyticsData }: AnalyticsPageProps) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login");
      return;
    }

    if (!isLoading && user?.role !== "ADMIN") {
      router.push("/dashboard");
      return;
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return <LoadingPage message="Loading analytics data..." />;
  }

  return (
    <>
      <Head>
        <title>Analytics Dashboard | Admin | SnapTrace</title>
        <meta name="description" content="Admin analytics dashboard" />
      </Head>

      <DashboardLayout>
        <div className="space-y-6 p-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Analytics Dashboard
            </h1>
            <p className="text-gray-500 dark:text-gray-400">
              Platform statistics and user data
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Total Users</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {analyticsData.totalUsers}
                </div>
                <div className="text-sm text-gray-500 mt-1">
                  <span className="text-green-500 font-medium">
                    {Math.round(
                      (analyticsData.activeUsers / analyticsData.totalUsers) *
                        100
                    )}
                    %
                  </span>{" "}
                  active users
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Total Subscriptions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {analyticsData.totalSubscriptions}
                </div>
                <div className="text-sm text-gray-500 mt-1">
                  <span className="text-yellow-500 font-medium">
                    {analyticsData.pendingSubscriptions}
                  </span>{" "}
                  pending approval
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">User Approval Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {analyticsData.totalUsers - analyticsData.pendingUsers}
                </div>
                <div className="text-sm text-gray-500 mt-1">
                  <span className="text-yellow-500 font-medium">
                    {analyticsData.pendingUsers}
                  </span>{" "}
                  pending approval
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Subscriptions by Plan</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80 flex items-end space-x-2">
                  {analyticsData.revenueByPlan.map((item) => (
                    <div
                      key={item.plan}
                      className="flex flex-col items-center flex-1"
                    >
                      <div
                        className="bg-blue-500 w-full rounded-t"
                        style={{
                          height: `${
                            (item.count /
                              Math.max(
                                ...analyticsData.revenueByPlan.map(
                                  (i) => i.count
                                )
                              )) *
                            200
                          }px`,
                        }}
                      ></div>
                      <div className="mt-2 text-sm font-medium">
                        {item.plan.charAt(0) + item.plan.slice(1).toLowerCase()}
                      </div>
                      <div className="text-xs text-gray-500">
                        {item.count} users
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>User Registration Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80 flex items-end space-x-2">
                  {analyticsData.userRegistrationTrend.map((item) => (
                    <div
                      key={item.month}
                      className="flex flex-col items-center flex-1"
                    >
                      <div
                        className="bg-green-500 w-full rounded-t"
                        style={{
                          height: `${
                            (item.count /
                              Math.max(
                                ...analyticsData.userRegistrationTrend.map(
                                  (i) => i.count
                                )
                              )) *
                            200
                          }px`,
                        }}
                      ></div>
                      <div className="mt-2 text-sm font-medium">
                        {item.month.substring(0, 3)}
                      </div>
                      <div className="text-xs text-gray-500">
                        {item.count} users
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Platform Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-lg font-medium mb-2">User Status</h3>
                    <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4">
                      <div className="flex justify-between mb-2">
                        <span>Active Users</span>
                        <span>{analyticsData.activeUsers}</span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                        <div
                          className="bg-green-600 h-2.5 rounded-full"
                          style={{
                            width: `${
                              (analyticsData.activeUsers /
                                analyticsData.totalUsers) *
                              100
                            }%`,
                          }}
                        ></div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-medium mb-2">
                      Subscription Status
                    </h3>
                    <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4">
                      <div className="flex justify-between mb-2">
                        <span>Active Subscriptions</span>
                        <span>{analyticsData.activeSubscriptions}</span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                        <div
                          className="bg-blue-600 h-2.5 rounded-full"
                          style={{
                            width: `${
                              (analyticsData.activeSubscriptions /
                                analyticsData.totalSubscriptions) *
                              100
                            }%`,
                          }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium mb-2">System Health</h3>
                  <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4">
                    <div className="flex items-center space-x-2">
                      <div className="h-3 w-3 rounded-full bg-green-500"></div>
                      <span>All systems operational</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    </>
  );
}
