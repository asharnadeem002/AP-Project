import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Input } from "../shared/Input";
import { Button } from "../shared/Button";
import { Loader } from "../shared/Loader";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "../shared/Card";
import { useAuth } from "../../lib/AuthContext";
import { toast } from "react-toastify";

// Validation schema
const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

const verifySchema = z.object({
  code: z
    .string()
    .min(6, "Please enter the 6-digit code")
    .max(6, "Please enter the 6-digit code"),
});

type LoginFormValues = z.infer<typeof loginSchema>;
type VerifyFormValues = z.infer<typeof verifySchema>;

export function LoginForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [verificationNeeded, setVerificationNeeded] = useState(false);
  const [email, setEmail] = useState("");
  const router = useRouter();
  const { login, verifyLogin } = useAuth();

  // Get redirect URL from query params
  const getRedirectPath = () => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      return urlParams.get("redirect_to") || "/dashboard";
    }
    return "/dashboard";
  };

  const {
    register: registerLogin,
    handleSubmit: handleLoginSubmit,
    formState: { errors: loginErrors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const {
    register: registerVerify,
    handleSubmit: handleVerifySubmit,
    reset: resetVerifyForm,
    formState: { errors: verifyErrors },
  } = useForm<VerifyFormValues>({
    resolver: zodResolver(verifySchema),
  });

  const onLoginSubmit = async (data: LoginFormValues) => {
    try {
      setIsLoading(true);
      const result = await login(data.email, data.password);

      if (result.success) {
        setEmail(data.email);
        setVerificationNeeded(true);
        toast.success(result.message || "Verification code sent to your email");
      } else {
        toast.error(result.message || "Login failed");
      }
    } catch (error: unknown) {
      console.error("Login error:", error);
      toast.error("An error occurred. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  const onVerifySubmit = async (data: VerifyFormValues) => {
    try {
      setIsLoading(true);
      const result = await verifyLogin(email, data.code);

      if (result.success) {
        toast.success("Login successful");

        // Handle role-based redirects
        if (result.user && result.user.role === "ADMIN") {
          router.push("/dashboard/admin");
        } else {
          // Use the redirect path or fallback to dashboard
          router.push(getRedirectPath());
        }
      } else {
        toast.error(result.message || "Verification failed");
      }
    } catch (error: unknown) {
      console.error("Verification error:", error);
      toast.error("An error occurred. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    try {
      setResendLoading(true);
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, resend: true }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success("Verification code has been resent to your email");
        resetVerifyForm();
      } else {
        toast.error(result.message || "Failed to resend verification code");
      }
    } catch (error) {
      console.error("Resend code error:", error);
      toast.error("An error occurred while resending the code");
    } finally {
      setResendLoading(false);
    }
  };

  const handleBackToLogin = () => {
    setVerificationNeeded(false);
    setEmail("");
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Sign In</CardTitle>
        <CardDescription>
          {verificationNeeded
            ? "Enter the verification code sent to your email"
            : "Enter your credentials to access your account"}
        </CardDescription>
      </CardHeader>

      <CardContent>
        {verificationNeeded ? (
          <form onSubmit={handleVerifySubmit(onVerifySubmit)}>
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-4">
                We&apos;ve sent a verification code to <strong>{email}</strong>
              </p>

              <Input
                label="Verification Code"
                id="code"
                type="text"
                error={verifyErrors.code?.message}
                {...registerVerify("code")}
              />
            </div>

            <Button type="submit" fullWidth isLoading={isLoading}>
              Verify and Login
            </Button>

            <div className="mt-4 flex items-center justify-between">
              <button
                type="button"
                onClick={handleBackToLogin}
                className="text-sm text-gray-600 hover:text-gray-800"
              >
                &larr; Back to login
              </button>

              <button
                type="button"
                onClick={handleResendCode}
                disabled={resendLoading}
                className="text-sm text-blue-600 hover:text-blue-800 disabled:opacity-50"
              >
                {resendLoading ? (
                  <span className="flex items-center">
                    <Loader size="xs" className="mr-2" /> Sending...
                  </span>
                ) : (
                  "Resend code"
                )}
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleLoginSubmit(onLoginSubmit)}>
            <div className="space-y-4">
              <Input
                label="Email"
                id="email"
                type="email"
                error={loginErrors.email?.message}
                {...registerLogin("email")}
              />

              <Input
                label="Password"
                id="password"
                type="password"
                error={loginErrors.password?.message}
                {...registerLogin("password")}
              />
            </div>

            <div className="flex justify-end mt-2">
              <Link
                href="/forgot-password"
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                Forgot password?
              </Link>
            </div>

            <Button
              type="submit"
              fullWidth
              className="mt-6"
              isLoading={isLoading}
            >
              Sign In
            </Button>
          </form>
        )}
      </CardContent>

      <CardFooter className="flex justify-center">
        <p className="text-sm text-gray-600">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="text-blue-600 hover:text-blue-800">
            Sign up
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}
