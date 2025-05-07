import React, { useEffect, useState } from "react";
import Head from "next/head";
import { DashboardLayout } from "../../app/components/dashboard/DashboardLayout";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../app/components/shared/Card";
import { useAuth } from "../../app/lib/AuthContext";
import { useRouter } from "next/router";
import { LoadingPage, Loader } from "../../app/components/shared/Loader";
import { GetServerSideProps } from "next";

// Use GetServerSideProps for protected routes
export const getServerSideProps: GetServerSideProps = async (context) => {
  // This will always be up-to-date when requested
  return {
    props: {},
  };
};

export default function DashboardPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState({
    galleryItems: 0,
    favoriteItems: 0,
    subscription: "Free",
  });
  const [loadingStats, setLoadingStats] = useState(false);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login");
      return;
    }

    // In a real application, you would fetch this data from an API
    const fetchDashboardData = async () => {
      try {
        setLoadingStats(true);
        // Simulate API call with a delay
        await new Promise((resolve) => setTimeout(resolve, 500));

        // Mocked data for now
        setStats({
          galleryItems: 12,
          favoriteItems: 3,
          subscription: user?.role === "ADMIN" ? "Admin" : "Free",
        });
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
      } finally {
        setLoadingStats(false);
      }
    };

    if (user) {
      fetchDashboardData();
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return <LoadingPage message="Loading dashboard..." />;
  }

  return (
    <>
      <Head>
        <title>Dashboard | SnapTrace</title>
        <meta name="description" content="SnapTrace user dashboard" />
      </Head>

      <DashboardLayout>
        <div className="space-y-6 p-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Dashboard
            </h1>
            <p className="text-gray-500 dark:text-gray-400">
              Welcome back, {user?.username}!
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {loadingStats ? (
              // Show skeleton loaders during loading
              Array(3)
                .fill(0)
                .map((_, index) => (
                  <Card key={index}>
                    <CardHeader>
                      <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-1/2"></div>
                    </CardHeader>
                    <CardContent>
                      <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-1/4 mb-2"></div>
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-3/4"></div>
                    </CardContent>
                  </Card>
                ))
            ) : (
              // Show actual content when loaded
              <>
                <Card>
                  <CardHeader>
                    <CardTitle>Gallery Items</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">
                      {stats.galleryItems}
                    </div>
                    <p className="text-sm text-gray-500 mt-2">
                      Total items in your gallery
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Favorites</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">
                      {stats.favoriteItems}
                    </div>
                    <p className="text-sm text-gray-500 mt-2">
                      Items marked as favorites
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Subscription</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">
                      {stats.subscription}
                    </div>
                    <p className="text-sm text-gray-500 mt-2">
                      Current subscription plan
                    </p>
                  </CardContent>
                </Card>
              </>
            )}
          </div>

          <div className="grid grid-cols-1 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                {loadingStats ? (
                  <div className="space-y-4">
                    {Array(3)
                      .fill(0)
                      .map((_, index) => (
                        <div
                          key={index}
                          className="flex items-center p-2 bg-gray-50 dark:bg-slate-800 rounded"
                        >
                          <div className="w-full">
                            <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-3/4 mb-2"></div>
                            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-1/3"></div>
                          </div>
                        </div>
                      ))}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center p-2 bg-gray-50 dark:bg-slate-800 rounded">
                      <div className="ml-4">
                        <p className="text-sm font-medium">
                          You uploaded a new image
                        </p>
                        <p className="text-xs text-gray-500">2 hours ago</p>
                      </div>
                    </div>
                    <div className="flex items-center p-2 bg-gray-50 dark:bg-slate-800 rounded">
                      <div className="ml-4">
                        <p className="text-sm font-medium">
                          You marked an item as favorite
                        </p>
                        <p className="text-xs text-gray-500">Yesterday</p>
                      </div>
                    </div>
                    <div className="flex items-center p-2 bg-gray-50 dark:bg-slate-800 rounded">
                      <div className="ml-4">
                        <p className="text-sm font-medium">
                          Your account was created
                        </p>
                        <p className="text-xs text-gray-500">1 week ago</p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </DashboardLayout>
    </>
  );
}
