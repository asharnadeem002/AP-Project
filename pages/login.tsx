import React from "react";
import Head from "next/head";
import { AuthLayout } from "../app/components/auth/AuthLayout";
import { LoginForm } from "../app/components/auth/LoginForm";
import { GetStaticProps } from "next";

export const getStaticProps: GetStaticProps = async () => {
  return {
    props: {},
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
