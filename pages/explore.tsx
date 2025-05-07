import React, { useState } from "react";
import Head from "next/head";
import { GetStaticProps } from "next";
import useSWR from "swr";
import { Button } from "../app/components/shared/Button";
import { DashboardLayout } from "../app/components/dashboard/DashboardLayout";
import { Loader } from "../app/components/shared/Loader";
import { useRouter } from "next/router";

// Types
interface Tag {
  id: string;
  name: string;
  count: number;
}

interface Photo {
  id: string;
  title: string;
  thumbnail: string;
  tags: string[];
  createdAt: string;
}

interface ExplorePageProps {
  initialTags: Tag[];
}

// SWR fetcher function
const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error("Failed to fetch data");
  }
  return res.json();
};

/**
 * Static Site Generation (SSG) with Incremental Static Regeneration (ISR)
 * Used to provide initial data before client-side fetching takes over
 */
export const getStaticProps: GetStaticProps<ExplorePageProps> = async () => {
  // Initial tags statically generated at build time
  // In a real app, this would be fetched from an API
  const initialTags: Tag[] = [
    { id: "tag-1", name: "nature", count: 24 },
    { id: "tag-2", name: "travel", count: 18 },
    { id: "tag-3", name: "portrait", count: 15 },
    { id: "tag-4", name: "architecture", count: 12 },
    { id: "tag-5", name: "food", count: 9 },
    { id: "tag-6", name: "street", count: 7 },
  ];

  return {
    props: {
      initialTags,
    },
    // Enable ISR - revalidate every hour
    revalidate: 60 * 60,
  };
};

/**
 * The Explore page component
 * Demonstrates:
 * 1. SSG with ISR for initial data
 * 2. Client-side data fetching with SWR
 * 3. Search and filtering functionality
 */
export default function ExplorePage({ initialTags }: ExplorePageProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  // Get query parameters
  const { query } = router;
  const page = parseInt(query.page as string) || 1;

  // Construct API URL with params
  const apiUrl = `/api/photos?page=${page}${
    selectedTag ? `&tag=${selectedTag}` : ""
  }${searchQuery ? `&search=${encodeURIComponent(searchQuery)}` : ""}`;

  // Client-side data fetching with SWR
  const { data, error, isLoading, isValidating } = useSWR(apiUrl, fetcher, {
    // Fallback data for when the request isn't yet complete
    fallbackData: {
      photos: Array.from({ length: 9 }, (_, i) => ({
        id: `photo-${i + 1}`,
        title: `Sample Photo ${i + 1}`,
        thumbnail: `https://source.unsplash.com/featured/300x200?photo,${
          i + 1
        }`,
        tags: ["sample", i % 2 === 0 ? "featured" : "new"],
        createdAt: new Date().toISOString(),
      })),
      totalPages: 5,
      currentPage: page,
    },
    // Revalidate data every 30 seconds
    refreshInterval: 30000,
  });

  // Handle search submission
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Update query parameters
    router.push(
      {
        pathname: "/explore",
        query: {
          ...(selectedTag && { tag: selectedTag }),
          ...(searchQuery && { search: searchQuery }),
          page: 1, // Reset to page 1 when searching
        },
      },
      undefined,
      { shallow: true }
    );
  };

  // Handle tag selection
  const handleTagClick = (tagName: string) => {
    if (selectedTag === tagName) {
      // Deselect if already selected
      setSelectedTag(null);

      // Update URL without the tag parameter
      router.push(
        {
          pathname: "/explore",
          query: {
            ...(searchQuery && { search: searchQuery }),
            page: 1,
          },
        },
        undefined,
        { shallow: true }
      );
    } else {
      // Select new tag
      setSelectedTag(tagName);

      // Update URL with the new tag
      router.push(
        {
          pathname: "/explore",
          query: {
            tag: tagName,
            ...(searchQuery && { search: searchQuery }),
            page: 1, // Reset to page 1 when changing tag
          },
        },
        undefined,
        { shallow: true }
      );
    }
  };

  // Handle pagination
  const handlePageChange = (newPage: number) => {
    router.push(
      {
        pathname: "/explore",
        query: {
          ...(selectedTag && { tag: selectedTag }),
          ...(searchQuery && { search: searchQuery }),
          page: newPage,
        },
      },
      undefined,
      { shallow: true }
    );
  };

  return (
    <>
      <Head>
        <title>Explore Photos | SnapTrace</title>
        <meta
          name="description"
          content="Explore photos and videos shared on SnapTrace"
        />
      </Head>

      <DashboardLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Explore Photos
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              Discover beautiful photos shared by the SnapTrace community
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Sidebar with filters */}
            <div className="lg:col-span-1">
              <div className="sticky top-8">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
                  <h2 className="text-lg font-semibold mb-4">Search</h2>
                  <form onSubmit={handleSearchSubmit}>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Search photos..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full p-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
                      />
                      <button
                        type="submit"
                        className="absolute right-2 top-2 text-gray-500 dark:text-gray-400"
                      >
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                          />
                        </svg>
                      </button>
                    </div>
                  </form>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                  <h2 className="text-lg font-semibold mb-4">Popular Tags</h2>
                  <div className="flex flex-wrap gap-2">
                    {initialTags.map((tag) => (
                      <button
                        key={tag.id}
                        onClick={() => handleTagClick(tag.name)}
                        className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                          selectedTag === tag.name
                            ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                            : "bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                        }`}
                      >
                        #{tag.name}
                        <span className="ml-1 text-xs opacity-75">
                          ({tag.count})
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Main content - photo grid */}
            <div className="lg:col-span-3">
              {/* Filter information */}
              {(selectedTag || searchQuery) && (
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-lg p-4 mb-6 flex items-center justify-between">
                  <div>
                    <p className="text-blue-800 dark:text-blue-200">
                      {selectedTag && (
                        <span className="font-medium">Tag: #{selectedTag}</span>
                      )}
                      {selectedTag && searchQuery && (
                        <span className="mx-2">•</span>
                      )}
                      {searchQuery && (
                        <span className="font-medium">
                          Search: &quot;{searchQuery}&quot;
                        </span>
                      )}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedTag(null);
                      setSearchQuery("");
                      router.push("/explore", undefined, { shallow: true });
                    }}
                    className="text-blue-600 dark:text-blue-300 hover:text-blue-800 dark:hover:text-blue-100 text-sm"
                  >
                    Clear filters
                  </button>
                </div>
              )}

              {/* Loading state */}
              {isLoading && !data && (
                <div className="flex justify-center py-20">
                  <Loader size="lg" />
                </div>
              )}

              {/* Error state */}
              {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-lg p-6 text-center">
                  <p className="text-red-800 dark:text-red-200 mb-4">
                    Failed to load photos
                  </p>
                  <Button
                    onClick={() => window.location.reload()}
                    variant="outline"
                  >
                    Retry
                  </Button>
                </div>
              )}

              {/* Results */}
              {data && (
                <>
                  {/* Photos grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                    {data.photos.map((photo: Photo) => (
                      <div
                        key={photo.id}
                        className="overflow-hidden rounded-lg shadow-lg hover:shadow-xl transition-shadow bg-white dark:bg-gray-800"
                      >
                        <div className="relative pb-[66.666%]">
                          <img
                            src={photo.thumbnail}
                            alt={photo.title}
                            className="absolute h-full w-full object-cover"
                          />
                        </div>
                        <div className="p-4">
                          <h3 className="font-medium mb-2 dark:text-white">
                            {photo.title}
                          </h3>
                          <div className="flex flex-wrap gap-2 mb-3">
                            {photo.tags.map((tag) => (
                              <button
                                key={`${photo.id}-${tag}`}
                                onClick={() => handleTagClick(tag)}
                                className={`text-xs px-2 py-1 rounded ${
                                  selectedTag === tag
                                    ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                                    : "bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                                }`}
                              >
                                #{tag}
                              </button>
                            ))}
                          </div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {new Date(photo.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Refresh indicator */}
                  {isValidating && data && (
                    <div className="flex justify-center mb-6">
                      <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                        <Loader size="xs" className="mr-2" />
                        Refreshing data...
                      </div>
                    </div>
                  )}

                  {/* Pagination */}
                  {data.totalPages > 1 && (
                    <div className="flex justify-center mt-8">
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePageChange(page - 1)}
                          disabled={page === 1}
                        >
                          Previous
                        </Button>
                        {Array.from(
                          { length: data.totalPages },
                          (_, i) => i + 1
                        ).map((pageNum) => (
                          <Button
                            key={pageNum}
                            variant={pageNum === page ? "default" : "outline"}
                            size="sm"
                            onClick={() => handlePageChange(pageNum)}
                          >
                            {pageNum}
                          </Button>
                        ))}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePageChange(page + 1)}
                          disabled={page === data.totalPages}
                        >
                          Next
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </DashboardLayout>
    </>
  );
}
