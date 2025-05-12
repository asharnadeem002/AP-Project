import React, { useEffect, useState, useCallback } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import axios from "axios";
import { toast } from "react-toastify";
import { DashboardLayout } from "../../../app/components/dashboard/DashboardLayout";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../../app/components/shared/Card";
import { useAuth } from "../../../app/lib/AuthContext";
import { Button } from "@/app/components/shared/Button";

// Types
type Subscription = {
  id: string;
  userId: string;
  plan: "FREE" | "BASIC" | "PREMIUM" | "ENTERPRISE";
  status: "PENDING" | "ACTIVE" | "CANCELED" | "EXPIRED";
  paymentMethod: "CASH" | "STRIPE" | "PAYPAL";
  startDate: string | null;
  endDate: string | null;
  createdAt: string;
  updatedAt: string;
  user: {
    email: string;
    username: string;
  };
};

type PaginationInfo = {
  total: number;
  pages: number;
  currentPage: number;
  perPage: number;
};

export default function ManageSubscriptionsPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>({
    total: 0,
    pages: 1,
    currentPage: 1,
    perPage: 10,
  });
  const [loadingSubscriptions, setLoadingSubscriptions] = useState(false);
  const [approvingSubscription, setApprovingSubscription] = useState<
    string | null
  >(null);
  const [rejectingSubscription, setRejectingSubscription] = useState<
    string | null
  >(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [showRejectionModal, setShowRejectionModal] = useState(false);
  const [selectedSubscription, setSelectedSubscription] =
    useState<Subscription | null>(null);

  const fetchSubscriptions = useCallback(
    async (page: number) => {
      if (!user) return;

      try {
        setLoadingSubscriptions(true);
        const response = await axios.get(
          `/api/admin/subscriptions?page=${page}`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("authToken")}`,
            },
          }
        );

        if (response.data.success) {
          setSubscriptions(response.data.subscriptions);
          setPagination(response.data.pagination);
        } else {
          toast.error("Failed to fetch subscriptions");
        }
      } catch (error) {
        console.error("Error fetching subscriptions:", error);
        toast.error("An error occurred while fetching subscriptions");
      } finally {
        setLoadingSubscriptions(false);
      }
    },
    [user]
  );

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login");
      return;
    }

    if (!isLoading && user?.role !== "ADMIN") {
      router.push("/dashboard");
      return;
    }

    fetchSubscriptions(1);
  }, [user, isLoading, router, fetchSubscriptions]);

  const handlePageChange = (page: number) => {
    fetchSubscriptions(page);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return "bg-green-100 text-green-800";
      case "PENDING":
        return "bg-yellow-100 text-yellow-800";
      case "CANCELED":
        return "bg-red-100 text-red-800";
      case "EXPIRED":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const handleApproveSubscription = async (subscriptionId: string) => {
    if (!user) return;

    try {
      setApprovingSubscription(subscriptionId);
      const response = await axios.post(
        "/api/admin/approve-subscription",
        { subscriptionId },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("authToken")}`,
          },
        }
      );

      if (response.data.success) {
        toast.success("Subscription approved successfully");
        setSubscriptions(
          subscriptions.map((sub) =>
            sub.id === subscriptionId ? { ...sub, status: "ACTIVE" } : sub
          )
        );
      } else {
        toast.error(response.data.message || "Failed to approve subscription");
      }
    } catch (error) {
      console.error("Error approving subscription:", error);
      toast.error("An error occurred while approving the subscription");
    } finally {
      setApprovingSubscription(null);
    }
  };

  const openRejectionModal = (subscription: Subscription) => {
    setSelectedSubscription(subscription);
    setRejectionReason("");
    setShowRejectionModal(true);
  };

  const closeRejectionModal = () => {
    setShowRejectionModal(false);
    setSelectedSubscription(null);
    setRejectionReason("");
  };

  const handleRejectSubscription = async () => {
    if (!user || !selectedSubscription) return;

    try {
      setRejectingSubscription(selectedSubscription.id);
      const response = await axios.post(
        "/api/admin/reject-subscription",
        {
          subscriptionId: selectedSubscription.id,
          rejectionReason: rejectionReason || undefined,
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("authToken")}`,
          },
        }
      );

      if (response.data.success) {
        toast.success("Subscription rejected successfully");
        setSubscriptions(
          subscriptions.map((sub) =>
            sub.id === selectedSubscription.id
              ? { ...sub, status: "CANCELED" }
              : sub
          )
        );
        closeRejectionModal();
      } else {
        toast.error(response.data.message || "Failed to reject subscription");
      }
    } catch (error) {
      console.error("Error rejecting subscription:", error);
      toast.error("An error occurred while rejecting the subscription");
    } finally {
      setRejectingSubscription(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Manage Subscriptions | Admin Dashboard | SnapTrace</title>
        <meta name="description" content="Manage user subscriptions" />
      </Head>

      <DashboardLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Manage Subscriptions
            </h1>
            <p className="text-gray-500 dark:text-gray-400">
              View and manage all user subscriptions
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>All Subscriptions</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingSubscriptions ? (
                <div className="flex justify-center p-6">
                  <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
                </div>
              ) : subscriptions.length === 0 ? (
                <div className="text-center p-6">
                  <p className="text-gray-500">No subscriptions found</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-slate-800">
                      <tr>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                        >
                          User
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                        >
                          Plan
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                        >
                          Status
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                        >
                          Created
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                        >
                          Expires
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                        >
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-slate-900 divide-y divide-gray-200 dark:divide-gray-700">
                      {subscriptions.map((subscription) => (
                        <tr key={subscription.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900 dark:text-white">
                                  {subscription.user.username}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {subscription.user.email}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900 dark:text-white">
                              {subscription.plan}
                            </div>
                            <div className="text-sm text-gray-500">
                              {subscription.paymentMethod}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(
                                subscription.status
                              )}`}
                            >
                              {subscription.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(
                              subscription.createdAt
                            ).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {subscription.endDate
                              ? new Date(
                                  subscription.endDate
                                ).toLocaleDateString()
                              : "Never"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            {subscription.status === "PENDING" ? (
                              <div className="flex space-x-2">
                                <Button
                                  size="sm"
                                  variant="default"
                                  onClick={() =>
                                    handleApproveSubscription(subscription.id)
                                  }
                                  isLoading={
                                    approvingSubscription === subscription.id
                                  }
                                  disabled={
                                    approvingSubscription !== null ||
                                    rejectingSubscription !== null
                                  }
                                >
                                  Approve
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() =>
                                    openRejectionModal(subscription)
                                  }
                                  disabled={
                                    approvingSubscription !== null ||
                                    rejectingSubscription !== null
                                  }
                                >
                                  Reject
                                </Button>
                              </div>
                            ) : null}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {pagination.pages > 1 && (
                <div className="flex justify-center mt-6">
                  <nav className="flex items-center">
                    <button
                      onClick={() =>
                        handlePageChange(pagination.currentPage - 1)
                      }
                      disabled={pagination.currentPage === 1}
                      className="px-3 py-1 rounded-md mr-2 bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-300 disabled:opacity-50"
                    >
                      Previous
                    </button>

                    <div className="flex space-x-1">
                      {Array.from(
                        { length: pagination.pages },
                        (_, i) => i + 1
                      ).map((page) => (
                        <button
                          key={page}
                          onClick={() => handlePageChange(page)}
                          className={`px-3 py-1 rounded-md ${
                            page === pagination.currentPage
                              ? "bg-blue-600 text-white"
                              : "bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-300"
                          }`}
                        >
                          {page}
                        </button>
                      ))}
                    </div>

                    <button
                      onClick={() =>
                        handlePageChange(pagination.currentPage + 1)
                      }
                      disabled={pagination.currentPage === pagination.pages}
                      className="px-3 py-1 rounded-md ml-2 bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-300 disabled:opacity-50"
                    >
                      Next
                    </button>
                  </nav>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>

      {showRejectionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">
              Reject Subscription Request
            </h3>
            <p className="mb-4">
              Are you sure you want to reject the subscription request for{" "}
              <span className="font-medium">{selectedSubscription?.plan}</span>{" "}
              by user{" "}
              <span className="font-medium">
                {selectedSubscription?.user.username}
              </span>
              ?
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">
                Reason for rejection (optional):
              </label>
              <textarea
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-slate-700"
                rows={3}
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Provide a reason for rejection (will be shared with the user)"
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={closeRejectionModal}
                disabled={rejectingSubscription !== null}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleRejectSubscription}
                isLoading={rejectingSubscription === selectedSubscription?.id}
                disabled={rejectingSubscription !== null}
              >
                Reject Subscription
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
