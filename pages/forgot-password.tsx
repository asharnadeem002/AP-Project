import React from "react";
import Head from "next/head";
import { AuthLayout } from "../app/components/auth/AuthLayout";
import { ForgotPasswordForm } from "../app/components/auth/ForgotPasswordForm";
import { GetStaticProps } from "next";

export const getStaticProps: GetStaticProps = async () => {
  return {
    props: {
      pageTitle: "Forgot Password | SnapTrace",
      pageDescription: "Reset your SnapTrace account password",
    },
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
