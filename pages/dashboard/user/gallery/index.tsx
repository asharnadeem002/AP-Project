import React, { useState } from "react";
import { GetServerSideProps } from "next";
import { DashboardLayout } from "../../../../app/components/dashboard/DashboardLayout";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../../../app/components/shared/Card";
import Image from "next/image";
import { verifyJwt } from "../../../../app/lib/jwt";
import prisma from "../../../../app/lib/db";
import { toast } from "react-toastify";

type MediaType = "IMAGE" | "VIDEO";

interface GalleryItem {
  id: string;
  title: string;
  description: string | null;
  fileUrl: string;
  mediaType: MediaType;
  isFavorite: boolean;
  createdAt: string;
}

interface GalleryPageProps {
  initialItems: GalleryItem[];
  totalItems: number;
}

export default function GalleryPage({
  initialItems,
  totalItems,
}: GalleryPageProps) {
  const [activeTab, setActiveTab] = useState<"upload" | "show">("show");
  const [items, setItems] = useState<GalleryItem[]>(initialItems);
  const [currentPage, setCurrentPage] = useState(1);
  const [isUploading, setIsUploading] = useState(false);
  const itemsPerPage = 10;
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    const formData = new FormData();
    const file = files[0];

    if (!file.type.startsWith("image/") && !file.type.startsWith("video/")) {
      toast.error("Please upload only images or videos");
      setIsUploading(false);
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error("File size should be less than 10MB");
      setIsUploading(false);
      return;
    }

    formData.append("file", file);
    formData.append("title", file.name);
    formData.append("description", "");
    formData.append(
      "mediaType",
      file.type.startsWith("image/") ? "IMAGE" : "VIDEO"
    );

    try {
      const token = localStorage.getItem("authToken");
      if (!token) {
        throw new Error("No authentication token found");
      }

      const response = await fetch("/api/gallery/upload", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Upload failed");
      }

      const data = await response.json();
      toast.success("Media uploaded successfully!");
      setItems((prev) => [data.item, ...prev]);

      event.target.value = "";
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to upload media"
      );
      console.error("Upload error:", error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const token = localStorage.getItem("authToken");
      const response = await fetch(`/api/gallery/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error("Delete failed");

      setItems((prev) => prev.filter((item) => item.id !== id));
      toast.success("Media deleted successfully!");
    } catch (error) {
      toast.error("Failed to delete media");
      console.error("Delete error:", error);
    }
  };

  const handleFavorite = async (id: string, currentStatus: boolean) => {
    try {
      const token = localStorage.getItem("authToken");
      const response = await fetch(`/api/gallery/${id}/favorite`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ isFavorite: !currentStatus }),
      });

      if (!response.ok) throw new Error("Update failed");

      setItems((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, isFavorite: !currentStatus } : item
        )
      );
      toast.success(
        currentStatus ? "Removed from favorites" : "Added to favorites"
      );
    } catch (error) {
      toast.error("Failed to update favorite status");
      console.error("Favorite update error:", error);
    }
  };

  const handlePageChange = async (page: number) => {
    try {
      const response = await fetch(
        `/api/gallery?page=${page}&limit=${itemsPerPage}`
      );
      if (!response.ok) throw new Error("Failed to fetch items");

      const data = await response.json();
      setItems(data.items);
      setCurrentPage(page);
    } catch (error) {
      toast.error("Failed to load more items");
      console.error("Pagination error:", error);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 p-4">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Gallery
          </h1>
          <div className="flex space-x-4">
            <button
              onClick={() => setActiveTab("upload")}
              className={`px-4 py-2 rounded-md ${
                activeTab === "upload"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 text-gray-700"
              }`}
            >
              Upload Media
            </button>
            <button
              onClick={() => setActiveTab("show")}
              className={`px-4 py-2 rounded-md ${
                activeTab === "show"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 text-gray-700"
              }`}
            >
              Show Media
            </button>
          </div>
        </div>

        {activeTab === "upload" ? (
          <Card>
            <CardHeader>
              <CardTitle>Upload New Media</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <input
                    type="file"
                    accept="image/*,video/*"
                    onChange={handleFileUpload}
                    disabled={isUploading}
                    className="hidden"
                    id="file-upload"
                  />
                  <label
                    htmlFor="file-upload"
                    className="cursor-pointer inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                  >
                    {isUploading ? "Uploading..." : "Choose File"}
                  </label>
                  <p className="mt-2 text-sm text-gray-500">
                    Upload images or videos (max 10MB)
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {items.map((item) => (
                <Card key={item.id}>
                  <CardContent className="p-4">
                    {item.mediaType === "IMAGE" ? (
                      <div className="relative h-48 w-full mb-4 flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden">
                        <Image
                          src={item.fileUrl}
                          alt={item.title}
                          width={400}
                          height={300}
                          className="max-w-full max-h-full object-contain"
                          priority={false}
                          unoptimized
                          onError={() => {
                            // Fallback to default image on error
                            const imgElement = document.querySelector(
                              `[alt="${item.title}"]`
                            ) as HTMLImageElement;
                            if (imgElement) {
                              imgElement.src = "/file.svg";
                            }
                          }}
                        />
                      </div>
                    ) : (
                      <video
                        src={item.fileUrl}
                        controls
                        className="w-full h-48 mb-4 rounded-lg"
                      />
                    )}
                    <div className="space-y-2">
                      <h3 className="font-semibold text-lg">{item.title}</h3>
                      {item.description && (
                        <p className="text-gray-600 dark:text-gray-300">
                          {item.description}
                        </p>
                      )}
                      <div className="flex justify-between items-center">
                        <button
                          onClick={() =>
                            handleFavorite(item.id, item.isFavorite)
                          }
                          className={`text-sm px-3 py-1 rounded ${
                            item.isFavorite
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {item.isFavorite ? "Favorited" : "Add to Favorites"}
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="text-sm px-3 py-1 rounded bg-red-100 text-red-800"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {totalPages > 1 && (
              <div className="flex justify-center space-x-2 mt-6">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-4 py-2 border rounded-md disabled:opacity-50"
                >
                  Previous
                </button>
                <span className="px-4 py-2">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 border rounded-md disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
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

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: payload.userId as string },
    });

    // If user is admin, redirect to admin dashboard
    if (user && user.role === "ADMIN") {
      return {
        redirect: {
          destination: "/dashboard/admin",
          permanent: false,
        },
      };
    }

    // If user not found or not a regular user
    if (!user || user.role !== "USER") {
      return {
        redirect: {
          destination: "/login",
          permanent: false,
        },
      };
    }

    const itemsPerPage = 10;
    const page = 1;

    const [items, totalItems] = await Promise.all([
      prisma.galleryItem.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
        take: itemsPerPage,
        skip: (page - 1) * itemsPerPage,
      }),
      prisma.galleryItem.count({
        where: { userId: user.id },
      }),
    ]);

    return {
      props: {
        initialItems: JSON.parse(JSON.stringify(items)),
        totalItems,
      },
    };
  } catch (error) {
    console.error("Gallery page error:", error);
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
