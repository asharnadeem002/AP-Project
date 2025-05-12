import React, { useEffect, useState } from "react";
import Head from "next/head";
import { GetServerSideProps } from "next";
import { DashboardLayout } from "../../../app/components/dashboard/DashboardLayout";
import { Button } from "../../../app/components/shared/Button";
import { useAuth } from "../../../app/lib/AuthContext";
import { useRouter } from "next/router";
import { LoadingPage, Loader } from "../../../app/components/shared/Loader";
import { verifyJwt } from "../../../app/lib/jwt";
import { toast } from "react-toastify";
import prisma from "../../../app/lib/db";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../../app/components/shared/Card";
import { Input } from "../../../app/components/shared/Input";
import { Prisma } from "@prisma/client";

// Types for our data
interface User {
  id: string;
  email: string;
  username: string;
  phoneNumber?: string;
  role: string;
  isVerified: boolean;
  isApproved: boolean;
  createdAt: string;
  isActive?: boolean;
}

interface UsersPageProps {
  initialUsers: User[];
  totalUsers: number;
  currentPage: number;
  totalPages: number;
}

/**
 * Server-Side Rendering (SSR) for the admin users page
 * Benefits:
 * 1. Real-time data from the database
 * 2. Authentication check on the server
 * 3. Pre-rendering with user data for SEO and performance
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

    if (!payload || typeof payload !== "object" || !("userId" in payload)) {
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

    // Parse query parameters
    const page = parseInt(context.query.page as string) || 1;
    const limit = 10;
    const skip = (page - 1) * limit;
    const search = (context.query.search as string) || "";
    const status = (context.query.status as string) || "";

    // Build query filter
    const where: Prisma.UserWhereInput = {};

    if (search) {
      where.OR = [
        { email: { contains: search } },
        { username: { contains: search } },
      ];
    }

    if (status === "verified") {
      where.isVerified = true;
    } else if (status === "unverified") {
      where.isVerified = false;
    } else if (status === "approved") {
      where.isApproved = true;
    } else if (status === "unapproved") {
      where.isApproved = false;
    }

    // Count total users
    const totalUsers = await prisma.user.count({ where });

    // Fetch users with pagination
    const users = await prisma.user.findMany({
      where,
      skip,
      take: limit,
      orderBy: {
        createdAt: "desc",
      },
    });

    // Format users for the client
    const formattedUsers = users.map((user) => ({
      id: user.id,
      email: user.email,
      username: user.username,
      phoneNumber: user.phoneNumber,
      role: user.role,
      isVerified: user.isVerified,
      isApproved: user.isApproved,
      createdAt: user.createdAt.toISOString(),
      isActive: user.isActive ?? true, // Use nullish coalescing for backward compatibility
    }));

    // Calculate total pages
    const totalPages = Math.ceil(totalUsers / limit);

    return {
      props: {
        initialUsers: formattedUsers,
        totalUsers,
        currentPage: page,
        totalPages,
      },
    };
  } catch (error) {
    console.error("Admin users page error:", error);
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

export default function UsersPage({
  initialUsers,
  totalUsers,
  currentPage,
  totalPages,
}: UsersPageProps) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [page, setPage] = useState(currentPage);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [deactivationReason, setDeactivationReason] = useState("");

  useEffect(() => {
    // Client-side auth check as a backup
    if (!isLoading && !user) {
      router.push("/login");
      return;
    }

    if (!isLoading && user?.role !== "ADMIN") {
      router.push("/dashboard");
      return;
    }

    // Update users from props
    setUsers(initialUsers);
  }, [user, isLoading, router, initialUsers]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    router.push(
      {
        pathname: "/dashboard/admin/users",
        query: {
          ...(searchTerm && { search: searchTerm }),
          ...(statusFilter && { status: statusFilter }),
          page: 1,
        },
      },
      undefined
    );
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    router.push(
      {
        pathname: "/dashboard/admin/users",
        query: {
          ...(searchTerm && { search: searchTerm }),
          ...(statusFilter && { status: statusFilter }),
          page: newPage,
        },
      },
      undefined
    );
  };

  const handleApproveUser = async (userId: string) => {
    try {
      setIsRefreshing(true);

      const token = localStorage.getItem("authToken");
      const response = await fetch("/api/admin/approve-user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ userId }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success("User approved successfully");

        // Update the local user list
        setUsers(
          users.map((u) => (u.id === userId ? { ...u, isApproved: true } : u))
        );
      } else {
        toast.error(result.message || "Failed to approve user");
      }
    } catch (error) {
      console.error("Approve user error:", error);
      toast.error("An error occurred while approving the user");
    } finally {
      setIsRefreshing(false);
    }
  };

  const openDeactivateModal = (user: User) => {
    if (user.role === "ADMIN") return; // Extra safety check
    setSelectedUser(user);
    setDeactivationReason("");
    setShowDeactivateModal(true);
  };

  const closeDeactivateModal = () => {
    setShowDeactivateModal(false);
    setSelectedUser(null);
    setDeactivationReason("");
  };

  const handleDeactivateUser = async () => {
    if (!selectedUser) return;

    try {
      setIsRefreshing(true);

      const token = localStorage.getItem("authToken");
      const response = await fetch("/api/admin/deactivate-user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          userId: selectedUser.id,
          deactivationReason,
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success("User deactivated successfully");

        // Update the local user list
        setUsers(
          users.map((u) =>
            u.id === selectedUser.id ? { ...u, isActive: false } : u
          )
        );
        closeDeactivateModal();
      } else {
        toast.error(result.message || "Failed to deactivate user");
      }
    } catch (error) {
      console.error("Deactivate user error:", error);
      toast.error("An error occurred while deactivating the user");
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleReactivateUser = async (userId: string) => {
    try {
      setIsRefreshing(true);

      const token = localStorage.getItem("authToken");
      const response = await fetch("/api/admin/reactivate-user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ userId }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success("User reactivated successfully");

        // Update the local user list
        setUsers(
          users.map((u) => (u.id === userId ? { ...u, isActive: true } : u))
        );
      } else {
        toast.error(result.message || "Failed to reactivate user");
      }
    } catch (error) {
      console.error("Reactivate user error:", error);
      toast.error("An error occurred while reactivating the user");
    } finally {
      setIsRefreshing(false);
    }
  };

  if (isLoading) {
    return <LoadingPage message="Loading users data..." />;
  }

  return (
    <>
      <Head>
        <title>Manage Users | Admin Dashboard | SnapTrace</title>
        <meta name="description" content="Admin user management dashboard" />
      </Head>

      <DashboardLayout>
        <div className="space-y-6 p-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Manage Users
              </h1>
              <p className="text-gray-500 dark:text-gray-400">
                View and manage all users on the platform
              </p>
            </div>

            <div className="flex items-center">
              {isRefreshing && (
                <div className="flex items-center mr-4">
                  <Loader size="sm" />
                  <span className="ml-2 text-sm text-gray-500">
                    Refreshing...
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle>Search & Filter</CardTitle>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={handleSearch}
                className="flex flex-col md:flex-row gap-4"
              >
                <div className="flex-grow">
                  <Input
                    label="Search"
                    id="search"
                    type="text"
                    placeholder="Search by email or username"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Status
                  </label>
                  <select
                    className="w-full p-2.5 border border-gray-300 rounded-md dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <option value="">All</option>
                    <option value="verified">Verified</option>
                    <option value="unverified">Unverified</option>
                    <option value="approved">Approved</option>
                    <option value="unapproved">Unapproved</option>
                  </select>
                </div>

                <div className="self-end">
                  <Button type="submit">Search</Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* User Table */}
          <Card>
            <CardHeader>
              <CardTitle>Users ({totalUsers})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th className="px-4 py-3 text-left">Username</th>
                      <th className="px-4 py-3 text-left">Email</th>
                      <th className="px-4 py-3 text-left">Role</th>
                      <th className="px-4 py-3 text-left">Verified</th>
                      <th className="px-4 py-3 text-left">Approved</th>
                      <th className="px-4 py-3 text-left">Joined</th>
                      <th className="px-4 py-3 text-left">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {users.map((user) => (
                      <tr key={user.id}>
                        <td className="px-4 py-3">{user.username}</td>
                        <td className="px-4 py-3">{user.email}</td>
                        <td className="px-4 py-3 capitalize">
                          {user.role.toLowerCase()}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`px-2 py-1 text-xs rounded-full ${
                              user.isVerified
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {user.isVerified ? "Yes" : "No"}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`px-2 py-1 text-xs rounded-full ${
                              user.isApproved
                                ? "bg-green-100 text-green-800"
                                : "bg-yellow-100 text-yellow-800"
                            }`}
                          >
                            {user.isApproved ? "Yes" : "No"}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {new Date(user.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex justify-end space-x-2">
                            {!user.isApproved && (
                              <Button
                                size="sm"
                                variant="default"
                                onClick={() => handleApproveUser(user.id)}
                                isLoading={isRefreshing}
                                disabled={isRefreshing}
                              >
                                Approve
                              </Button>
                            )}
                            {user.isActive ? (
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => openDeactivateModal(user)}
                                disabled={isRefreshing || user.role === "ADMIN"}
                                title={
                                  user.role === "ADMIN"
                                    ? "Cannot deactivate admin users"
                                    : ""
                                }
                              >
                                Deactivate
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                variant="default"
                                onClick={() => handleReactivateUser(user.id)}
                                isLoading={isRefreshing}
                                disabled={isRefreshing}
                              >
                                Reactivate
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {users.length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-gray-500">No users found</p>
                  </div>
                )}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center mt-6">
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(page - 1)}
                      disabled={page === 1}
                    >
                      Previous
                    </Button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                      (pageNum) => (
                        <Button
                          key={pageNum}
                          variant={pageNum === page ? "default" : "outline"}
                          size="sm"
                          onClick={() => handlePageChange(pageNum)}
                        >
                          {pageNum}
                        </Button>
                      )
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(page + 1)}
                      disabled={page === totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>

      {showDeactivateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">
              Deactivate User Account
            </h3>
            <p className="mb-4">
              Are you sure you want to deactivate the account for user{" "}
              {selectedUser?.username}? The user will not be able to log in
              until reactivated.
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">
                Reason for deactivation (optional):
              </label>
              <textarea
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-slate-700"
                rows={3}
                value={deactivationReason}
                onChange={(e) => setDeactivationReason(e.target.value)}
                placeholder="Provide a reason for deactivation (will be shared with the user)"
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={closeDeactivateModal}
                disabled={isRefreshing}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeactivateUser}
                isLoading={isRefreshing}
                disabled={isRefreshing}
              >
                Deactivate User
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
