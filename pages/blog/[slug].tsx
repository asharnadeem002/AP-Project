import React from "react";
import Head from "next/head";
import Link from "next/link";
import { GetStaticProps, GetStaticPaths } from "next";
import { Header } from "../../app/components/shared/Header";
import { format } from "date-fns";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

interface BlogPost {
  slug: string;
  title: string;
  description: string;
  content: string;
  createdAt: string;
  author: {
    username: string;
  };
}

export const getStaticPaths: GetStaticPaths = async () => {
  try {
    const posts = await prisma.blogPost.findMany({
      where: { published: true },
      select: { slug: true },
    });

    const paths = posts.map((post) => ({
      params: { slug: post.slug },
    }));

    return {
      paths,
      fallback: "blocking",
    };
  } catch (error) {
    console.error("Error fetching blog posts:", error);
    return {
      paths: [],
      fallback: "blocking",
    };
  }
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  try {
    const post = await prisma.blogPost.findFirst({
      where: {
        slug: String(params?.slug),
        published: true,
      },
      select: {
        slug: true,
        title: true,
        description: true,
        content: true,
        createdAt: true,
        author: {
          select: {
            username: true,
          },
        },
      },
    });

    if (!post) {
      return { notFound: true };
    }

    return {
      props: {
        post: {
          ...post,
          createdAt: format(new Date(post.createdAt), "MMMM d, yyyy"),
        },
      },
      revalidate: 60 * 60,
    };
  } catch (error) {
    console.error("Error fetching blog post:", error);
    return { notFound: true };
  }
};

interface BlogPostPageProps {
  post: BlogPost;
}

export default function BlogPostPage({ post }: BlogPostPageProps) {
  return (
    <>
      <Head>
        <title>{`${post.title} | SnapTrace Blog`}</title>
        <meta name="description" content={post.description} />
      </Head>

      <div className="min-h-screen flex flex-col bg-gray-50">
        <Header />

        <main className="flex-grow">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
            <div className="max-w-4xl mx-auto px-4 py-16">
              <div className="mb-8">
                <Link
                  href="/blog"
                  className="inline-flex items-center text-blue-100 hover:text-white transition-colors"
                >
                  <svg
                    className="w-5 h-5 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 19l-7-7 7-7"
                    />
                  </svg>
                  Back to all posts
                </Link>
              </div>

              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
                {post.title}
              </h1>

              <div className="flex items-center text-blue-100">
                <div className="h-10 w-10 rounded-full bg-white/10 flex items-center justify-center backdrop-blur-sm">
                  <span className="text-lg font-semibold">
                    {post.author.username.charAt(0)}
                  </span>
                </div>
                <div className="ml-3">
                  <p className="font-medium">By {post.author.username}</p>
                  <p className="text-sm opacity-80">{post.createdAt}</p>
                </div>
              </div>
            </div>
          </div>

          <article className="max-w-3xl mx-auto px-4 py-12">
            <div className="bg-white rounded-xl shadow-sm p-6 md:p-8 lg:p-10">
              <div className="prose prose-lg max-w-none prose-headings:text-gray-900 prose-p:text-gray-700">
                <p className="text-xl text-gray-600 mb-8 font-medium">
                  {post.description}
                </p>

                {post.content.split("\n").map((paragraph, index) => (
                  <p key={index} className="mb-4">
                    {paragraph}
                  </p>
                ))}
              </div>
            </div>

            <div className="mt-8 text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Share this article
              </h3>
              <div className="flex justify-center space-x-4">
                <button className="p-2 rounded-full bg-blue-100 text-blue-600 hover:bg-blue-200 transition-colors">
                  <svg
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                </button>
                <button className="p-2 rounded-full bg-blue-100 text-blue-600 hover:bg-blue-200 transition-colors">
                  <svg
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
                  </svg>
                </button>
                <button className="p-2 rounded-full bg-blue-100 text-blue-600 hover:bg-blue-200 transition-colors">
                  <svg
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                  </svg>
                </button>
              </div>
            </div>
          </article>
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
