import React, { useEffect, useState } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import { DashboardLayout } from "../app/components/dashboard/DashboardLayout";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "../app/components/shared/Card";
import { Button } from "../app/components/shared/Button";
import { useAuth } from "../app/lib/AuthContext";
import { toast } from "react-toastify";
import axios, { AxiosError } from "axios";
import { LoadingPage, Loader } from "../app/components/shared/Loader";

type SubscriptionPlan = {
  id: string;
  name: "FREE" | "BASIC" | "PREMIUM" | "ENTERPRISE";
  displayName: string;
  price: number;
  period: string;
  features: string[];
  description: string;
};

type UserSubscription = {
  id: string;
  plan: "FREE" | "BASIC" | "PREMIUM" | "ENTERPRISE";
  status: "PENDING" | "ACTIVE" | "CANCELED" | "EXPIRED";
  startDate: string | null;
  endDate: string | null;
  paymentMethod: "CASH" | "STRIPE" | "PAYPAL";
};

export const getStaticProps = async () => {
  return {
    props: {},
    revalidate: 60,
  };
};

export default function SubscriptionPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [userSubscription, setUserSubscription] =
    useState<UserSubscription | null>(null);
  const [loadingSubscription, setLoadingSubscription] = useState(false);
  const [processingPlan, setProcessingPlan] = useState<string | null>(null);

  const subscriptionPlans: SubscriptionPlan[] = [
    {
      id: "free",
      name: "FREE",
      displayName: "Free",
      price: 0,
      period: "",
      description: "Basic features for personal use",
      features: [
        "Upload up to 100 photos",
        "Basic gallery features",
        "Mobile access",
        "1 GB storage",
      ],
    },
    {
      id: "basic",
      name: "BASIC",
      displayName: "Basic",
      price: 9.99,
      period: "/month",
      description: "Everything in Free, plus more storage and features",
      features: [
        "Upload up to 1,000 photos",
        "Upload videos up to 5 minutes",
        "Advanced organization tools",
        "10 GB storage",
        "Priority support",
      ],
    },
    {
      id: "premium",
      name: "PREMIUM",
      displayName: "Premium",
      price: 19.99,
      period: "/month",
      description: "Advanced features for professionals",
      features: [
        "Unlimited photo uploads",
        "Upload videos up to 15 minutes",
        "AI-powered organization",
        "100 GB storage",
        "Premium support",
        "Custom domain",
      ],
    },
    {
      id: "enterprise",
      name: "ENTERPRISE",
      displayName: "Enterprise",
      price: 49.99,
      period: "/month",
      description: "Full featured solution for businesses",
      features: [
        "Unlimited photo and video uploads",
        "No video length restrictions",
        "Advanced AI features",
        "1 TB storage",
        "24/7 dedicated support",
        "Custom branding",
        "Team collaboration tools",
      ],
    },
  ];

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login");
      return;
    }

    const fetchUserSubscription = async () => {
      if (!user) return;

      try {
        setLoadingSubscription(true);
        const response = await axios.get("/api/subscriptions/current", {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("authToken")}`,
          },
        });

        if (response.data.success) {
          setUserSubscription(response.data.subscription);
        }
      } catch (error) {
        console.error("Error fetching subscription:", error);
      } finally {
        setLoadingSubscription(false);
      }
    };

    fetchUserSubscription();
  }, [user, isLoading, router]);

  const subscribeToPlan = async (planId: string) => {
    if (!user) {
      router.push("/login");
      return;
    }

    const plan = subscriptionPlans.find((p) => p.id === planId);
    if (!plan) return;

    try {
      setProcessingPlan(planId);

      const response = await axios.post(
        "/api/subscriptions/subscribe",
        {
          plan: plan.name,
          paymentMethod: "CASH",
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("authToken")}`,
          },
        }
      );

      if (response.data.success) {
        toast.success(
          `Successfully subscribed to the ${plan.displayName} plan!`
        );
        setUserSubscription(response.data.subscription);
      } else {
        toast.error(response.data.message || "Subscription failed");
      }
    } catch (error: unknown) {
      const axiosError = error as AxiosError<{ message: string }>;
      toast.error(
        axiosError.response?.data?.message ||
          "An error occurred while processing your subscription"
      );
    } finally {
      setProcessingPlan(null);
    }
  };

  const cancelSubscription = async () => {
    if (!userSubscription) return;

    try {
      const response = await axios.post(
        "/api/subscriptions/cancel",
        {},
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("authToken")}`,
          },
        }
      );

      if (response.data.success) {
        toast.success("Subscription canceled successfully");
        setUserSubscription(response.data.subscription);
      } else {
        toast.error(response.data.message || "Failed to cancel subscription");
      }
    } catch (error: unknown) {
      const axiosError = error as AxiosError<{ message: string }>;
      toast.error(
        axiosError.response?.data?.message ||
          "An error occurred while canceling your subscription"
      );
    }
  };

  if (isLoading) {
    return <LoadingPage message="Loading subscription information..." />;
  }

  return (
    <>
      <Head>
        <title>Subscription Plans | SnapTrace</title>
        <meta
          name="description"
          content="Choose a subscription plan that works for you"
        />
      </Head>

      <DashboardLayout>
        <div className="container mx-auto py-8 px-4">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Subscription Plans
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mt-2">
              Choose a plan that works best for your needs
            </p>
          </div>

          {loadingSubscription ? (
            <div className="flex justify-center py-10">
              <div className="text-center">
                <Loader size="lg" />
                <p className="mt-4 text-gray-600 dark:text-gray-400">
                  Loading your subscription...
                </p>
              </div>
            </div>
          ) : userSubscription ? (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6 mb-8">
              <h2 className="text-xl font-semibold text-blue-800 dark:text-blue-300 mb-3">
                Your Current Subscription
              </h2>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <p className="text-gray-700 dark:text-gray-300">
                    <span className="font-medium">Plan:</span>{" "}
                    {subscriptionPlans.find(
                      (p) => p.name === userSubscription.plan
                    )?.displayName || userSubscription.plan}
                  </p>
                  <p className="text-gray-700 dark:text-gray-300 mt-2">
                    <span className="font-medium">Status:</span>{" "}
                    <span
                      className={`${
                        userSubscription.status === "ACTIVE"
                          ? "text-green-600 dark:text-green-400"
                          : userSubscription.status === "CANCELED"
                          ? "text-red-600 dark:text-red-400"
                          : "text-yellow-600 dark:text-yellow-400"
                      }`}
                    >
                      {userSubscription.status.charAt(0) +
                        userSubscription.status.slice(1).toLowerCase()}
                    </span>
                  </p>
                </div>
                <div>
                  {userSubscription.startDate && (
                    <p className="text-gray-700 dark:text-gray-300">
                      <span className="font-medium">Start Date:</span>{" "}
                      {new Date(
                        userSubscription.startDate
                      ).toLocaleDateString()}
                    </p>
                  )}
                  {userSubscription.endDate && (
                    <p className="text-gray-700 dark:text-gray-300 mt-2">
                      <span className="font-medium">End Date:</span>{" "}
                      {new Date(userSubscription.endDate).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>

              {userSubscription.status === "ACTIVE" && (
                <div className="mt-4">
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={cancelSubscription}
                    isLoading={processingPlan === "cancel"}
                  >
                    Cancel Subscription
                  </Button>
                </div>
              )}
            </div>
          ) : null}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {subscriptionPlans.map((plan) => (
              <Card key={plan.id} className="flex flex-col h-full">
                <CardHeader>
                  <CardTitle>{plan.displayName}</CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                </CardHeader>
                <CardContent className="flex-grow">
                  <div className="mb-4">
                    <span className="text-3xl font-bold">
                      ${plan.price.toFixed(2)}
                    </span>
                    <span className="text-gray-500 dark:text-gray-400">
                      {plan.period}
                    </span>
                  </div>
                  <ul className="space-y-2">
                    {plan.features.map((feature, index) => (
                      <li
                        key={index}
                        className="flex items-start text-sm text-gray-700 dark:text-gray-300"
                      >
                        <span className="mr-2 mt-0.5 text-green-500">✓</span>
                        {feature}
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter>
                  <Button
                    fullWidth
                    variant={
                      userSubscription?.plan === plan.name
                        ? "subtle"
                        : "default"
                    }
                    disabled={
                      userSubscription?.plan === plan.name &&
                      userSubscription.status === "ACTIVE"
                    }
                    onClick={() => subscribeToPlan(plan.id)}
                    isLoading={processingPlan === plan.id}
                  >
                    {userSubscription?.plan === plan.name &&
                    userSubscription.status === "ACTIVE"
                      ? "Current Plan"
                      : userSubscription?.plan === plan.name &&
                        userSubscription.status === "CANCELED"
                      ? "Reactivate"
                      : "Subscribe"}
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      </DashboardLayout>
    </>
  );
}
