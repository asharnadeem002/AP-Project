import React from "react";
import Head from "next/head";
import Link from "next/link";
import { GetStaticProps } from "next";
import { Header } from "../../app/components/shared/Header";

// Define blog post list item type
interface BlogPostListItem {
  slug: string;
  title: string;
  description: string;
  date: string;
  author: string;
}

interface BlogIndexPageProps {
  posts: BlogPostListItem[];
}

/**
 * Static Site Generation (SSG) with Incremental Static Regeneration (ISR)
 * This generates the blog index page at build time and can regenerate it
 * on-demand after deployment without rebuilding the site.
 */
export const getStaticProps: GetStaticProps<BlogIndexPageProps> = async () => {
  // In a real app, you'd fetch this from an API or database
  const posts: BlogPostListItem[] = [
    {
      slug: "introducing-snaptrace",
      title: "Introducing SnapTrace: The Future of Photo Management",
      description:
        "Learn about our new platform for managing your photos and videos",
      date: "December 1, 2023",
      author: "SnapTrace Team",
    },
    {
      slug: "photo-management-tips",
      title: "5 Essential Tips for Managing Your Photo Collection",
      description:
        "Practical tips to keep your photos organized and accessible",
      date: "December 15, 2023",
      author: "Photo Expert",
    },
    {
      slug: "security-best-practices",
      title: "Security Best Practices for Your Digital Memories",
      description: "How to keep your photos and videos safe from threats",
      date: "January 5, 2024",
      author: "Security Specialist",
    },
  ];

  return {
    props: {
      posts,
    },
    // Enable ISR with a revalidation period
    revalidate: 60 * 5, // Revalidate once every 5 minutes
  };
};

/**
 * The BlogIndex page component
 * Displays a list of all blog posts with links to the full articles
 */
export default function BlogIndexPage({ posts }: BlogIndexPageProps) {
  return (
    <>
      <Head>
        <title>Blog | SnapTrace</title>
        <meta
          name="description"
          content="Articles and guides about photo management, security, and more"
        />
      </Head>

      <div className="min-h-screen flex flex-col">
        <Header />

        <main className="flex-grow">
          <div className="max-w-5xl mx-auto px-4 py-12">
            <div className="mb-12 text-center">
              <h1 className="text-4xl font-bold mb-4">SnapTrace Blog</h1>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Articles, tutorials, and updates from the SnapTrace team
              </p>
            </div>

            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {posts.map((post) => (
                <div
                  key={post.slug}
                  className="border rounded-lg overflow-hidden hover:shadow-md transition-shadow"
                >
                  <div className="p-6">
                    <h2 className="text-xl font-bold mb-2">
                      <Link
                        href={`/blog/${post.slug}`}
                        className="text-blue-600 hover:underline"
                      >
                        {post.title}
                      </Link>
                    </h2>
                    <p className="text-gray-600 text-sm mb-2">{post.date}</p>
                    <p className="text-gray-700 mb-4">{post.description}</p>
                    <p className="text-sm text-gray-500">By {post.author}</p>
                  </div>
                </div>
              ))}
            </div>
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
