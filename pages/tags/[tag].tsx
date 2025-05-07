import React from "react";
import Head from "next/head";
import Link from "next/link";
import { GetStaticProps, GetStaticPaths } from "next";
import { Header } from "../../app/components/shared/Header";
import { useRouter } from "next/router";
import { LoadingPage } from "../../app/components/shared/Loader";

// Sample data types
interface Photo {
  id: string;
  title: string;
  thumbnail: string;
  tags: string[];
}

interface TagPageProps {
  tag: string;
  photos: Photo[];
}

/**
 * This demonstrates getStaticPaths with fallback: true for ISR
 * Only pre-renders some paths at build time and generates the rest on-demand
 */
export const getStaticPaths: GetStaticPaths = async () => {
  // In a real app, you would fetch the most popular tags from your API/DB
  const popularTags = ["nature", "city", "people"];

  // Generate paths for popular tags
  const paths = popularTags.map((tag) => ({
    params: { tag },
  }));

  return {
    paths,
    // fallback: true enables ISR - Next.js will generate new pages on-demand
    // and cache them for future requests
    fallback: true,
  };
};

/**
 * getStaticProps for tag pages
 * Pre-renders at build time for paths from getStaticPaths
 * Renders on-demand for new paths when fallback: true
 */
export const getStaticProps: GetStaticProps<TagPageProps> = async ({
  params,
}) => {
  // Safety check - this shouldn't happen with fallback: true
  if (!params?.tag) {
    return {
      notFound: true,
    };
  }

  const tag = params.tag as string;

  try {
    // In a real app, you'd fetch tag data from an API/database
    // For demo purposes, we'll generate mock data

    // Simulate API call with a 1 second delay
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Generate some mock photos based on the tag
    const photos: Photo[] = Array.from({ length: 9 }, (_, i) => ({
      id: `photo-${i + 1}`,
      title: `${tag.charAt(0).toUpperCase() + tag.slice(1)} Photo ${i + 1}`,
      thumbnail: `https://source.unsplash.com/featured/300x200?${tag},${i + 1}`,
      tags: [
        tag,
        ...(i % 3 === 0 ? ["featured"] : []),
        ...(i % 2 === 0 ? ["popular"] : []),
      ],
    }));

    // Check if the tag exists in our "database"
    // In this example, we'll allow any tag, but you could implement logic here
    // to return notFound: true for invalid tags

    return {
      props: {
        tag,
        photos,
      },
      // Revalidate every 10 minutes
      revalidate: 60 * 10,
    };
  } catch (error) {
    console.error(`Error fetching data for tag ${tag}:`, error);

    // Return not found for errors
    return {
      notFound: true,
    };
  }
};

/**
 * The Tag page component
 * Shows photos with a specific tag
 * Demonstrates ISR with fallback
 */
export default function TagPage({ tag, photos }: TagPageProps) {
  const router = useRouter();

  // If the page is still generating, show a loading state
  if (router.isFallback) {
    return <LoadingPage message={`Loading ${router.query.tag} photos...`} />;
  }

  return (
    <>
      <Head>
        <title>
          {tag.charAt(0).toUpperCase() + tag.slice(1)} Photos | SnapTrace
        </title>
        <meta
          name="description"
          content={`Browse photos tagged with ${tag} on SnapTrace`}
        />
      </Head>

      <div className="min-h-screen flex flex-col">
        <Header />

        <main className="flex-grow">
          <div className="max-w-7xl mx-auto px-4 py-12">
            <div className="mb-8">
              <Link
                href="/explore"
                className="text-blue-600 hover:underline inline-flex items-center"
              >
                <svg
                  className="w-4 h-4 mr-2"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
                    clipRule="evenodd"
                  />
                </svg>
                Back to Explore
              </Link>
            </div>

            <div className="mb-8">
              <h1 className="text-3xl font-bold mb-2">#{tag.toLowerCase()}</h1>
              <p className="text-gray-600">
                Browse {photos.length} photos tagged with #{tag.toLowerCase()}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {photos.map((photo) => (
                <div
                  key={photo.id}
                  className="overflow-hidden rounded-lg shadow-lg hover:shadow-xl transition-shadow"
                >
                  <div className="relative pb-[66.666%]">
                    <img
                      src={photo.thumbnail}
                      alt={photo.title}
                      className="absolute h-full w-full object-cover"
                    />
                  </div>
                  <div className="p-4">
                    <h3 className="font-medium mb-2">{photo.title}</h3>
                    <div className="flex flex-wrap gap-2">
                      {photo.tags.map((photoTag) => (
                        <Link
                          key={photoTag}
                          href={`/tags/${photoTag}`}
                          className={`text-xs px-2 py-1 rounded ${
                            photoTag === tag
                              ? "bg-blue-100 text-blue-800"
                              : "bg-gray-100 text-gray-800 hover:bg-gray-200"
                          }`}
                        >
                          #{photoTag}
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {photos.length === 0 && (
              <div className="text-center py-12">
                <p className="text-xl text-gray-600">
                  No photos found with the tag #{tag.toLowerCase()}
                </p>
                <Link
                  href="/explore"
                  className="mt-4 inline-block text-blue-600 hover:underline"
                >
                  Explore other photos
                </Link>
              </div>
            )}
          </div>
        </main>

        <footer className="bg-gray-100 py-8">
          <div className="max-w-5xl mx-auto px-4 text-center">
            <p className="text-gray-600">
              &copy; {new Date().getFullYear()} SnapTrace. All rights reserved.
            </p>
          </div>
        </footer>
      </div>
    </>
  );
}
