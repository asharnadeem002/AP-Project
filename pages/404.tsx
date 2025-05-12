import React from "react";
import Head from "next/head";
import Link from "next/link";
import { Button } from "../app/components/shared/Button";

export default function Custom404() {
  return (
    <>
      <Head>
        <title>Page Not Found | SnapTrace</title>
        <meta
          name="description"
          content="The page you're looking for doesn't exist"
        />
      </Head>

      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
        <div className="text-center">
          <h1 className="text-6xl font-bold text-blue-600 dark:text-blue-400 mb-4">
            404
          </h1>
          <h2 className="text-3xl font-semibold text-gray-800 dark:text-gray-200 mb-6">
            Page Not Found
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-md mx-auto mb-8">
            The page you&apos;re looking for doesn&apos;t exist or has been
            moved.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/">
              <Button size="lg">Return Home</Button>
            </Link>
            <Button
              variant="notFound"
              size="lg"
              onClick={() => window.history.back()}
            >
              Go Back
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
