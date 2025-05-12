import React, { useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { z } from "zod";
import { toast } from "react-toastify";
import axios, { AxiosError } from "axios";
import { Button } from "../app/components/shared/Button";
import { Input } from "../app/components/shared/Input";
import { Header } from "../app/components/shared/Header";

// Validation schema
const reactivationSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

export default function RequestReactivationPage() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const validData = reactivationSchema.parse({ email });

      const response = await axios.post("/api/users/request-reactivation", {
        email: validData.email,
      });

      setSubmitted(true);
      toast.success(
        response.data.message || "Reactivation request submitted successfully"
      );
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
      } else if (error instanceof AxiosError && error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error("An error occurred. Please try again later.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Head>
        <title>Request Account Reactivation | SnapTrace</title>
        <meta
          name="description"
          content="Request reactivation for your deactivated SnapTrace account"
        />
      </Head>

      <div className="min-h-screen flex flex-col">
        <Header />

        <main className="flex-grow flex items-center justify-center p-4">
          <div className="w-full max-w-md">
            <div className="bg-white dark:bg-slate-800 shadow-md rounded-lg p-8">
              <div className="text-center mb-6">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Account Reactivation
                </h1>
                {!submitted ? (
                  <p className="mt-2 text-gray-600 dark:text-gray-300">
                    Your account has been deactivated. Please fill out the form
                    below to request reactivation.
                  </p>
                ) : (
                  <p className="mt-2 text-gray-600 dark:text-gray-300">
                    Your reactivation request has been submitted. You will be
                    notified once an administrator reviews your request.
                  </p>
                )}
              </div>

              {!submitted ? (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <Input
                      id="email"
                      type="email"
                      label="Email Address"
                      placeholder="Enter your email address"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      autoComplete="email"
                      className="w-full"
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full mt-4"
                    isLoading={isSubmitting}
                    disabled={isSubmitting}
                  >
                    Request Reactivation
                  </Button>
                </form>
              ) : (
                <div className="text-center mt-8">
                  <div className="flex justify-center mb-6">
                    <div className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-8 w-8 text-green-600"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                  </div>
                  <Link href="/" className="inline-block w-full">
                    <Button className="w-full">Return to Home</Button>
                  </Link>
                </div>
              )}

              <div className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
                <Link
                  href="/login"
                  className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                >
                  Back to Login
                </Link>
              </div>
            </div>
          </div>
        </main>

        <footer className="py-6 bg-white dark:bg-slate-800 border-t border-gray-200 dark:border-gray-700">
          <div className="container mx-auto px-4 text-center text-sm text-gray-500 dark:text-gray-400">
            <p>© {new Date().getFullYear()} SnapTrace. All rights reserved.</p>
          </div>
        </footer>
      </div>
    </>
  );
}
