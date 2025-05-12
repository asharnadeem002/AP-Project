import React from "react";
import Head from "next/head";
import { AuthLayout } from "../app/components/auth/AuthLayout";
import { SignupForm } from "../app/components/auth/SignupForm";
import { GetStaticProps } from "next";

export const getStaticProps: GetStaticProps = async () => {
  return {
    props: {
      pageTitle: "Create an Account | SnapTrace",
      pageDescription: "Create a new SnapTrace account",
    },
    revalidate: 60,
  };
};

export default function SignupPage({
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
        title="Create a new account"
        subtitle="Fill in your details to get started with SnapTrace"
      >
        <SignupForm />
      </AuthLayout>
    </>
  );
}
