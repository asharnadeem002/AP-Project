import React from "react";
import Head from "next/head";
import Link from "next/link";
import { GetStaticProps, GetStaticPaths } from "next";
import { Header } from "../../app/components/shared/Header";
import { parseISO, format } from "date-fns";

// Define blog post type
interface BlogPost {
  slug: string;
  title: string;
  description: string;
  date: string;
  author: string;
  content: string;
}

/**
 * This demonstrates Static Site Generation (SSG) with dynamic routes
 * getStaticPaths defines which paths will be pre-rendered at build time
 */
export const getStaticPaths: GetStaticPaths = async () => {
  // In a real app, you'd fetch this from an API or database
  const posts: BlogPost[] = [
    {
      slug: "introducing-snaptrace",
      title: "Introducing SnapTrace: The Future of Photo Management",
      description:
        "Learn about our new platform for managing your photos and videos",
      date: "2023-12-01",
      author: "SnapTrace Team",
      content:
        "SnapTrace is a revolutionary new platform designed to help you organize, store, and share your photos and videos with unparalleled security and ease. Our platform offers a range of features including smart organization, cloud sync, and mobile access.",
    },
    {
      slug: "photo-management-tips",
      title: "5 Essential Tips for Managing Your Photo Collection",
      description:
        "Practical tips to keep your photos organized and accessible",
      date: "2023-12-15",
      author: "Photo Expert",
      content:
        "Managing a large photo collection can be challenging, but with these 5 essential tips, you'll be able to keep your memories organized and accessible. 1. Use consistent folder structures. 2. Add metadata to your photos. 3. Regular backups are essential. 4. Implement a tagging system. 5. Use cloud storage for accessibility.",
    },
    {
      slug: "security-best-practices",
      title: "Security Best Practices for Your Digital Memories",
      description: "How to keep your photos and videos safe from threats",
      date: "2024-01-05",
      author: "Security Specialist",
      content:
        "Your digital memories are precious, and keeping them secure should be a priority. This post covers essential security best practices including using strong, unique passwords, enabling two-factor authentication, encrypting sensitive content, and being careful about sharing permissions.",
    },
  ];

  // Generate paths from the blog posts
  const paths = posts.map((post) => ({
    params: { slug: post.slug },
  }));

  return {
    paths,
    // If a page is requested that doesn't exist yet, Next.js will render a 404 page
    // If set to 'blocking', Next.js will server-render the page on-demand (ISR)
    fallback: false,
  };
};

/**
 * getStaticProps fetches data needed to render the page with the given params
 * This runs at build time and in the background when fallback is enabled
 */
export const getStaticProps: GetStaticProps = async ({ params }) => {
  // In a real app, you'd fetch this post data from an API or database
  const posts: BlogPost[] = [
    {
      slug: "introducing-snaptrace",
      title: "Introducing SnapTrace: The Future of Photo Management",
      description:
        "Learn about our new platform for managing your photos and videos",
      date: "2023-12-01",
      author: "SnapTrace Team",
      content:
        "SnapTrace is a revolutionary new platform designed to help you organize, store, and share your photos and videos with unparalleled security and ease. Our platform offers a range of features including smart organization, cloud sync, and mobile access.",
    },
    {
      slug: "photo-management-tips",
      title: "5 Essential Tips for Managing Your Photo Collection",
      description:
        "Practical tips to keep your photos organized and accessible",
      date: "2023-12-15",
      author: "Photo Expert",
      content:
        "Managing a large photo collection can be challenging, but with these 5 essential tips, you'll be able to keep your memories organized and accessible. 1. Use consistent folder structures. 2. Add metadata to your photos. 3. Regular backups are essential. 4. Implement a tagging system. 5. Use cloud storage for accessibility.",
    },
    {
      slug: "security-best-practices",
      title: "Security Best Practices for Your Digital Memories",
      description: "How to keep your photos and videos safe from threats",
      date: "2024-01-05",
      author: "Security Specialist",
      content:
        "Your digital memories are precious, and keeping them secure should be a priority. This post covers essential security best practices including using strong, unique passwords, enabling two-factor authentication, encrypting sensitive content, and being careful about sharing permissions.",
    },
  ];

  // Find the post with matching slug
  const post = posts.find((p) => p.slug === params?.slug);

  // If no matching post is found, return 404
  if (!post) {
    return {
      notFound: true,
    };
  }

  // Parse and format the date
  const date = format(parseISO(post.date), "MMMM dd, yyyy");

  // Get related posts
  const relatedPosts = posts
    .filter((p) => p.slug !== post.slug)
    .slice(0, 2)
    .map((p) => ({
      slug: p.slug,
      title: p.title,
      description: p.description,
      date: format(parseISO(p.date), "MMMM dd, yyyy"),
    }));

  return {
    props: {
      post: {
        ...post,
        date,
      },
      relatedPosts,
    },
    // Enable ISR with a revalidation period
    revalidate: 60 * 60, // Revalidate once per hour
  };
};

interface BlogPageProps {
  post: BlogPost & { date: string };
  relatedPosts: Array<{
    slug: string;
    title: string;
    description: string;
    date: string;
  }>;
}

/**
 * The BlogPost page component
 * Uses the data fetched by getStaticProps
 */
export default function BlogPostPage({ post, relatedPosts }: BlogPageProps) {
  return (
    <>
      <Head>
        <title>{post.title} | SnapTrace Blog</title>
        <meta name="description" content={post.description} />
      </Head>

      <div className="min-h-screen flex flex-col">
        <Header />

        <main className="flex-grow">
          <article className="max-w-3xl mx-auto px-4 py-12">
            <div className="mb-8">
              <Link href="/blog" className="text-blue-600 hover:underline">
                ← Back to all posts
              </Link>
            </div>

            <header className="mb-8">
              <h1 className="text-3xl md:text-4xl font-bold mb-2">
                {post.title}
              </h1>
              <p className="text-gray-600 mb-2">{post.date}</p>
              <p className="text-gray-700">By {post.author}</p>
            </header>

            <div className="prose max-w-none">
              {post.content.split("\n").map((paragraph, index) => (
                <p key={index} className="mb-4">
                  {paragraph}
                </p>
              ))}
            </div>
          </article>

          {relatedPosts.length > 0 && (
            <div className="max-w-3xl mx-auto px-4 py-12">
              <h2 className="text-2xl font-bold mb-6">Related Posts</h2>
              <div className="grid gap-8 md:grid-cols-2">
                {relatedPosts.map((related) => (
                  <div
                    key={related.slug}
                    className="border rounded-lg overflow-hidden"
                  >
                    <div className="p-6">
                      <h3 className="text-xl font-bold mb-2">
                        <Link
                          href={`/blog/${related.slug}`}
                          className="text-blue-600 hover:underline"
                        >
                          {related.title}
                        </Link>
                      </h3>
                      <p className="text-gray-600 text-sm mb-2">
                        {related.date}
                      </p>
                      <p className="text-gray-700">{related.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
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
