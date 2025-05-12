import React from "react";
import Head from "next/head";
import Link from "next/link";
import { GetStaticProps } from "next";
import { Header } from "../../app/components/shared/Header";
import { format } from "date-fns";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

interface BlogPost {
  slug: string;
  title: string;
  description: string;
  createdAt: string;
  author: {
    username: string;
  };
}

interface BlogIndexPageProps {
  posts: BlogPost[];
}

export const getStaticProps: GetStaticProps<BlogIndexPageProps> = async () => {
  try {
    const posts = await prisma.blogPost.findMany({
      where: { published: true },
      orderBy: { createdAt: "desc" },
      select: {
        slug: true,
        title: true,
        description: true,
        createdAt: true,
        author: {
          select: {
            username: true,
          },
        },
      },
    });

    return {
      props: {
        posts: posts.map((post) => ({
          ...post,
          createdAt: format(new Date(post.createdAt), "MMMM d, yyyy"),
        })),
      },
      revalidate: 60 * 5,
    };
  } catch (error) {
    console.error("Error fetching blog posts:", error);
    return {
      props: { posts: [] },
      revalidate: 60 * 5,
    };
  }
};

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

      <div className="min-h-screen flex flex-col bg-gray-50">
        <Header />

        <main className="flex-grow">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
            <div className="max-w-5xl mx-auto px-4 py-16">
              <div className="text-center">
                <h1 className="text-4xl md:text-5xl font-bold mb-4 animate-fade-in">
                  SnapTrace Blog
                </h1>
                <p className="text-xl md:text-2xl text-blue-100 max-w-3xl mx-auto">
                  Discover insights, tutorials, and updates from the SnapTrace
                  team
                </p>
              </div>
            </div>
          </div>

          <div className="max-w-6xl mx-auto px-4 py-12">
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {posts.map((post) => (
                <div
                  key={post.slug}
                  className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200 transform hover:-translate-y-1"
                >
                  <div className="p-6">
                    <div className="flex items-center mb-4">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-semibold text-lg">
                        {post.title.charAt(0)}
                      </div>
                      <div className="ml-3">
                        <p className="text-sm text-gray-600">
                          {post.createdAt}
                        </p>
                        <p className="text-sm font-medium">
                          By {post.author.username}
                        </p>
                      </div>
                    </div>
                    <h2 className="text-xl font-bold mb-3 text-gray-900 line-clamp-2">
                      <Link
                        href={`/blog/${post.slug}`}
                        className="hover:text-blue-600 transition-colors"
                      >
                        {post.title}
                      </Link>
                    </h2>
                    <p className="text-gray-600 mb-4 line-clamp-3">
                      {post.description}
                    </p>
                    <Link
                      href={`/blog/${post.slug}`}
                      className="inline-flex items-center text-blue-600 hover:text-blue-700 font-medium"
                    >
                      Read more
                      <svg
                        className="ml-2 w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </main>

        <footer className="bg-gray-900 text-white py-12">
          <div className="max-w-5xl mx-auto px-4 text-center">
            <div className="mb-4">
              <h2 className="text-2xl font-bold">SnapTrace</h2>
              <p className="text-gray-400">
                Your photos, your memories, your way
              </p>
            </div>
            <p className="text-gray-500">
              &copy; {new Date().getFullYear()} SnapTrace. All rights reserved.
            </p>
          </div>
        </footer>
      </div>
    </>
  );
}
