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
import { Button } from "../../../app/components/shared/Button";
import { useAuth } from "../../../app/lib/AuthContext";

type PendingUser = {
  id: string;
  email: string;
  username: string;
  phoneNumber?: string;
  gender?: string;
  createdAt: string;
};

type PaginationInfo = {
  total: number;
  pages: number;
  currentPage: number;
  perPage: number;
};

export default function PendingUsersPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>({
    total: 0,
    pages: 1,
    currentPage: 1,
    perPage: 10,
  });
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [approvingUser, setApprovingUser] = useState<string | null>(null);

  const fetchPendingUsers = useCallback(
    async (page: number) => {
      if (!user) return;

      try {
        setLoadingUsers(true);
        const response = await axios.get(
          `/api/admin/pending-users?page=${page}`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("authToken")}`,
            },
          }
        );

        if (response.data.success) {
          setPendingUsers(response.data.users);
          setPagination(response.data.pagination);
        } else {
          toast.error("Failed to fetch pending users");
        }
      } catch (error) {
        console.error("Error fetching pending users:", error);
        toast.error("An error occurred while fetching pending users");
      } finally {
        setLoadingUsers(false);
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

    fetchPendingUsers(1);
  }, [user, isLoading, router, fetchPendingUsers]);

  const approveUser = async (userId: string) => {
    if (!user) return;

    try {
      setApprovingUser(userId);
      const response = await axios.post(
        "/api/admin/approve-user",
        { userId },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("authToken")}`,
          },
        }
      );

      if (response.data.success) {
        toast.success("User approved successfully");
        setPendingUsers(pendingUsers.filter((user) => user.id !== userId));
        setPagination((prev) => ({
          ...prev,
          total: prev.total - 1,
        }));
      } else {
        toast.error(response.data.message || "Failed to approve user");
      }
    } catch (error) {
      console.error("Error approving user:", error);
      toast.error("An error occurred while approving the user");
    } finally {
      setApprovingUser(null);
    }
  };

  const handlePageChange = (page: number) => {
    fetchPendingUsers(page);
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
        <title>Pending Users | Admin Dashboard | SnapTrace</title>
        <meta name="description" content="Manage pending user approvals" />
      </Head>

      <DashboardLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Pending User Approvals
            </h1>
            <p className="text-gray-500 dark:text-gray-400">
              Approve new users who have verified their email
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Users Awaiting Approval</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingUsers ? (
                <div className="flex justify-center p-6">
                  <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
                </div>
              ) : pendingUsers.length === 0 ? (
                <div className="text-center p-6">
                  <p className="text-gray-500">No pending users to approve</p>
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
                          Contact
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                        >
                          Date Registered
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                        >
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-slate-900 divide-y divide-gray-200 dark:divide-gray-700">
                      {pendingUsers.map((pendingUser) => (
                        <tr key={pendingUser.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900 dark:text-white">
                                  {pendingUser.username}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {pendingUser.email}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900 dark:text-white">
                              {pendingUser.phoneNumber || "N/A"}
                            </div>
                            <div className="text-sm text-gray-500">
                              {pendingUser.gender || "Not specified"}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-500">
                              {new Date(
                                pendingUser.createdAt
                              ).toLocaleDateString()}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => approveUser(pendingUser.id)}
                              isLoading={approvingUser === pendingUser.id}
                              disabled={approvingUser !== null}
                            >
                              Approve
                            </Button>
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
    </>
  );
}
