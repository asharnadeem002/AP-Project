import React, { useState } from "react";
import { GetServerSideProps } from "next";
import { DashboardLayout } from "../../../../../app/components/dashboard/DashboardLayout";
import { Card, CardContent } from "../../../../../app/components/shared/Card";
import Image from "next/image";
import { verifyJwt } from "../../../../../app/lib/jwt";
import prisma from "../../../../../app/lib/db";
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

interface FavoritesPageProps {
  initialItems: GalleryItem[];
  totalItems: number;
}

export default function FavoritesPage({
  initialItems,
  totalItems,
}: FavoritesPageProps) {
  const [items, setItems] = useState<GalleryItem[]>(initialItems);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const totalPages = Math.ceil(totalItems / itemsPerPage);

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

  const handleUnfavorite = async (id: string) => {
    try {
      const token = localStorage.getItem("authToken");
      const response = await fetch(`/api/gallery/${id}/favorite`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ isFavorite: false }),
      });

      if (!response.ok) throw new Error("Update failed");

      setItems((prev) => prev.filter((item) => item.id !== id));
      toast.success("Removed from favorites");
    } catch (error) {
      toast.error("Failed to update favorite status");
      console.error("Favorite update error:", error);
    }
  };

  const handlePageChange = async (page: number) => {
    try {
      const response = await fetch(
        `/api/gallery/favorites?page=${page}&limit=${itemsPerPage}`
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
            Favorite Media
          </h1>
        </div>

        {items.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-gray-500">
                No favorite items found. Add some items to your favorites from
                the gallery.
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {items.map((item) => (
                <Card key={item.id}>
                  <CardContent className="p-4">
                    {item.mediaType === "IMAGE" ? (
                      <Image
                        src={item.fileUrl}
                        alt={item.title}
                        width={400}
                        height={300}
                        className="w-full h-48 object-cover rounded-lg"
                      />
                    ) : (
                      <video
                        src={item.fileUrl}
                        controls
                        className="w-full h-48 object-cover rounded-lg"
                      />
                    )}
                    <div className="mt-4">
                      <h3 className="font-semibold">{item.title}</h3>
                      <p className="text-sm text-gray-500">
                        {item.description}
                      </p>
                      <div className="mt-2 flex justify-between items-center">
                        <button
                          onClick={() => handleUnfavorite(item.id)}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          Remove from Favorites
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="text-red-600 hover:text-red-800"
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
        where: {
          userId: user.id,
          isFavorite: true,
        },
        orderBy: { createdAt: "desc" },
        take: itemsPerPage,
        skip: (page - 1) * itemsPerPage,
      }),
      prisma.galleryItem.count({
        where: {
          userId: user.id,
          isFavorite: true,
        },
      }),
    ]);

    return {
      props: {
        initialItems: JSON.parse(JSON.stringify(items)),
        totalItems,
      },
    };
  } catch (error) {
    console.error("Favorites page error:", error);
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
