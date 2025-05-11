import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Input } from "../shared/Input";
import { Button } from "../shared/Button";
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

// Validation schemas
const forgotPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

const resetPasswordSchema = z
  .object({
    token: z
      .string()
      .min(6, "Please enter the 6-digit code")
      .max(6, "Please enter the 6-digit code"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[a-z]/, "Password must contain at least one lowercase letter")
      .regex(/[0-9]/, "Password must contain at least one number")
      .regex(
        /[^A-Za-z0-9]/,
        "Password must contain at least one special character"
      ),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;
type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

export function ForgotPasswordForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [resetRequested, setResetRequested] = useState(false);
  const router = useRouter();
  const { forgotPassword, resetPassword } = useAuth();

  const {
    register: registerForgot,
    handleSubmit: handleForgotSubmit,
    formState: { errors: forgotErrors },
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const {
    register: registerReset,
    handleSubmit: handleResetSubmit,
    formState: { errors: resetErrors },
  } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const onForgotSubmit = async (data: ForgotPasswordFormValues) => {
    try {
      setIsLoading(true);
      const result = await forgotPassword(data.email);

      if (result.success) {
        setResetRequested(true);
        toast.success(
          result.message || "Reset instructions sent to your email"
        );
      } else {
        toast.error(result.message || "Request failed");
      }
    } catch {
      toast.error("An error occurred. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  const onResetSubmit = async (data: ResetPasswordFormValues) => {
    try {
      setIsLoading(true);
      const result = await resetPassword(data.token, data.password);

      if (result.success) {
        toast.success("Password reset successful");
        router.push("/login");
      } else {
        toast.error(result.message || "Reset failed");
      }
    } catch {
      toast.error("An error occurred. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>
          {resetRequested ? "Reset Password" : "Forgot Password"}
        </CardTitle>
        <CardDescription>
          {resetRequested
            ? "Enter the verification code sent to your email and your new password"
            : "Enter your email to receive a password reset link"}
        </CardDescription>
      </CardHeader>

      <CardContent>
        {resetRequested ? (
          <form onSubmit={handleResetSubmit(onResetSubmit)}>
            <div className="space-y-4">
              <Input
                label="Verification Code"
                id="token"
                type="text"
                error={resetErrors.token?.message}
                {...registerReset("token")}
              />

              <Input
                label="New Password"
                id="password"
                type="password"
                error={resetErrors.password?.message}
                {...registerReset("password")}
              />

              <Input
                label="Confirm New Password"
                id="confirmPassword"
                type="password"
                error={resetErrors.confirmPassword?.message}
                {...registerReset("confirmPassword")}
              />
            </div>

            <Button
              type="submit"
              fullWidth
              className="mt-6"
              isLoading={isLoading}
            >
              Reset Password
            </Button>
          </form>
        ) : (
          <form onSubmit={handleForgotSubmit(onForgotSubmit)}>
            <Input
              label="Email"
              id="email"
              type="email"
              error={forgotErrors.email?.message}
              {...registerForgot("email")}
            />

            <Button
              type="submit"
              fullWidth
              className="mt-6"
              isLoading={isLoading}
            >
              Send Reset Instructions
            </Button>
          </form>
        )}
      </CardContent>

      <CardFooter className="flex justify-center">
        <p className="text-sm text-gray-600">
          Remember your password?{" "}
          <Link href="/login" className="text-blue-600 hover:text-blue-800">
            Back to login
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}
