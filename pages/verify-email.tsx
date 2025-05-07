import React, { useState, useEffect } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "react-toastify";
import { AuthLayout } from "../app/components/auth/AuthLayout";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription,
} from "../app/components/shared/Card";
import { Input } from "../app/components/shared/Input";
import { Button } from "../app/components/shared/Button";
import { useAuth } from "../app/lib/AuthContext";
import { LoadingPage, LoadingOverlay } from "../app/components/shared/Loader";
import { GetStaticProps } from "next";

// Validation schema
const verificationSchema = z.object({
  code: z
    .string()
    .min(6, "Please enter the 6-digit code")
    .max(6, "Please enter the 6-digit code"),
});

type VerificationFormValues = z.infer<typeof verificationSchema>;

// This function gets called at build time
export const getStaticProps: GetStaticProps = async () => {
  return {
    props: {}, // will be passed to the page component as props
    // Enable ISR - page will be regenerated when requested (at most once every 60 seconds)
    revalidate: 60,
  };
};

export default function VerifyEmailPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [resendLoading, setResendLoading] = useState(false);
  const router = useRouter();
  const { email } = router.query;
  const { verifyEmail, resendVerificationEmail } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<VerificationFormValues>({
    resolver: zodResolver(verificationSchema),
  });

  useEffect(() => {
    // If code is provided in the URL query params, pre-fill it
    if (router.query.code) {
      setValue("code", String(router.query.code));
    }

    // Check if email is available
    if (router.isReady) {
      setInitialLoading(false);
      if (!email) {
        toast.error("Email is missing. Please return to the signup page.");
        router.push("/signup");
      }
    }
  }, [router.query.code, setValue, router.isReady, email, router]);

  const onSubmit = async (data: VerificationFormValues) => {
    if (!email) {
      toast.error(
        "Email is missing. Please return to the signup page and try again."
      );
      return;
    }

    try {
      setIsLoading(true);
      const result = await verifyEmail(String(email), data.code);

      if (result.success) {
        toast.success(result.message);
        router.push("/login");
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error("Verification error:", error);
      toast.error("An error occurred. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email) {
      toast.error("Email is missing. Please return to the signup page.");
      return;
    }

    try {
      setResendLoading(true);
      const result = await resendVerificationEmail(String(email));

      if (result.success) {
        toast.success("Verification code has been resent to your email");
      } else {
        toast.error(result.message || "Failed to resend verification code");
      }
    } catch (error) {
      console.error("Resend error:", error);
      toast.error("An error occurred while resending the code");
    } finally {
      setResendLoading(false);
    }
  };

  // Show loading state if the page is not yet ready or router isn't ready
  if (initialLoading || !router.isReady) {
    return <LoadingPage message="Preparing verification..." />;
  }

  return (
    <>
      <Head>
        <title>Verify Email | SnapTrace</title>
        <meta
          name="description"
          content="Verify your email address for SnapTrace"
        />
      </Head>

      <AuthLayout
        title="Verify your email"
        subtitle={`We've sent a verification code to ${email || "your email"}`}
      >
        <Card>
          <CardHeader>
            <CardTitle>Enter verification code</CardTitle>
            <CardDescription>
              Please check your inbox and enter the 6-digit code below
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)}>
              <Input
                label="Verification Code"
                id="code"
                type="text"
                error={errors.code?.message}
                {...register("code")}
              />

              <Button
                type="submit"
                fullWidth
                className="mt-6"
                isLoading={isLoading}
              >
                Verify Email
              </Button>
            </form>
          </CardContent>

          <CardFooter className="flex justify-center">
            <p className="text-sm text-gray-500">
              Didn&apos;t receive the code?{" "}
              <button
                type="button"
                className="text-blue-600 hover:text-blue-800 font-medium disabled:opacity-50"
                onClick={handleResend}
                disabled={resendLoading}
              >
                {resendLoading ? "Sending..." : "Request again"}
              </button>
            </p>
          </CardFooter>
        </Card>
      </AuthLayout>
    </>
  );
}
