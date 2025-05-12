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

const signupSchema = z
  .object({
    username: z
      .string()
      .min(3, "Username must be at least 3 characters")
      .max(30, "Username must be at most 30 characters")
      .regex(
        /^[a-zA-Z0-9_]+$/,
        "Username can only contain letters, numbers, and underscores"
      ),
    email: z.string().email("Please enter a valid email address"),
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
    phoneNumber: z
      .string()
      .regex(/^\+?[0-9]{10,15}$/, "Please enter a valid phone number"),
    gender: z.enum(["male", "female", "other", "prefer_not_to_say"]),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type SignupFormValues = z.infer<typeof signupSchema>;

export function SignupForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const router = useRouter();
  const { signup, verifyEmail } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
  });

  const onSubmit = async (data: SignupFormValues) => {
    try {
      setIsLoading(true);
      const result = await signup(data);

      if (result.success) {
        setVerificationSent(true);
        setVerificationEmail(data.email);
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error("Sign up error:", error);
      toast.error("An error occurred. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyEmail = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!verificationCode) {
      toast.error("Please enter the verification code");
      return;
    }

    try {
      setIsLoading(true);
      const result = await verifyEmail(verificationEmail, verificationCode);

      if (result.success) {
        toast.success(result.message);
        router.push("/login");
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error("Sign up error:", error);
      toast.error("An error occurred. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Create an account</CardTitle>
        <CardDescription>
          {verificationSent
            ? "Enter the verification code sent to your email"
            : "Fill in your details to create a new account"}
        </CardDescription>
      </CardHeader>

      <CardContent>
        {verificationSent ? (
          <form onSubmit={handleVerifyEmail}>
            <div className="mb-4">
              <Input
                label="Verification Code"
                id="verificationCode"
                type="text"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                className="w-full"
              />
            </div>

            <Button type="submit" fullWidth isLoading={isLoading}>
              Verify Email
            </Button>
          </form>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="space-y-4">
              <Input
                label="Username"
                id="username"
                type="text"
                error={errors.username?.message}
                {...register("username")}
              />

              <Input
                label="Email"
                id="email"
                type="email"
                error={errors.email?.message}
                {...register("email")}
              />

              <Input
                label="Password"
                id="password"
                type="password"
                error={errors.password?.message}
                {...register("password")}
              />

              <Input
                label="Confirm Password"
                id="confirmPassword"
                type="password"
                error={errors.confirmPassword?.message}
                {...register("confirmPassword")}
              />

              <Input
                label="Phone Number"
                id="phoneNumber"
                type="tel"
                error={errors.phoneNumber?.message}
                {...register("phoneNumber")}
              />

              <div className="w-full mb-4">
                <label
                  htmlFor="gender"
                  className="block text-sm font-medium text-white mb-1"
                >
                  Gender
                </label>
                <select
                  id="gender"
                  className="w-full text-white bg-gray-700 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  {...register("gender")}
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                  <option value="prefer_not_to_say">Prefer not to say</option>
                </select>
                {errors.gender && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.gender.message}
                  </p>
                )}
              </div>
            </div>

            <Button
              type="submit"
              fullWidth
              className="mt-6"
              isLoading={isLoading}
            >
              Sign Up
            </Button>
          </form>
        )}
      </CardContent>

      <CardFooter className="flex justify-center">
        <p className="text-sm text-gray-600">
          Already have an account?{" "}
          <Link href="/login" className="text-blue-600 hover:text-blue-800">
            Log in
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}
