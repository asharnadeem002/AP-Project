import React from "react";
import Head from "next/head";
import { AuthLayout } from "../app/components/auth/AuthLayout";
import { LoginForm } from "../app/components/auth/LoginForm";
import { GetStaticProps } from "next";

//check commit github desktop

// This function gets called at build time
export const getStaticProps: GetStaticProps = async () => {
  return {
    props: {}, // will be passed to the page component as props
    // Enable ISR - page will be regenerated when requested (at most once every 60 seconds)
    revalidate: 60,
  };
};

export default function LoginPage() {
  return (
    <>
      <Head>
        <title>Sign In | SnapTrace</title>
        <meta name="description" content="Sign in to your SnapTrace account" />
      </Head>

      <AuthLayout
        title="Sign in to your account"
        subtitle="Enter your credentials to access your account"
      >
        <LoginForm />
      </AuthLayout>
    </>
  );
}
