import React from "react";
import Head from "next/head";
import { AuthLayout } from "../app/components/auth/AuthLayout";
import { ForgotPasswordForm } from "../app/components/auth/ForgotPasswordForm";
import { GetStaticProps } from "next";

/**
 * Static Site Generation (SSG) with Incremental Static Regeneration (ISR)
 * This strategy is ideal for auth pages that don't need user-specific data
 * but should be available quickly to users.
 */
export const getStaticProps: GetStaticProps = async () => {
  return {
    props: {
      pageTitle: "Forgot Password | SnapTrace",
      pageDescription: "Reset your SnapTrace account password",
    },
    // Enable ISR with a revalidation period
    revalidate: 60,
  };
};

export default function ForgotPasswordPage({
  pageTitle,
  pageDescription,
}: {
  pageTitle: string;
  pageDescription: string;
}) {
  return (
    <>
      <Head>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
      </Head>

      <AuthLayout
        title="Reset your password"
        subtitle="We'll send you a verification code to reset your password"
      >
        <ForgotPasswordForm />
      </AuthLayout>
    </>
  );
}
