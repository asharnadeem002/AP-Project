import React from "react";
import { cva, type VariantProps } from "class-variance-authority";

const loaderVariants = cva(
  "inline-block animate-spin rounded-full border-t-transparent",
  {
    variants: {
      size: {
        xs: "h-4 w-4 border-2",
        sm: "h-6 w-6 border-2",
        md: "h-8 w-8 border-2",
        lg: "h-12 w-12 border-3",
        xl: "h-16 w-16 border-4",
      },
      color: {
        primary: "border-blue-600 border-t-transparent",
        secondary: "border-gray-300 border-t-transparent",
        white: "border-white border-t-transparent",
      },
    },
    defaultVariants: {
      size: "md",
      color: "primary",
    },
  }
);

export interface LoaderProps extends VariantProps<typeof loaderVariants> {
  className?: string;
}

export const Loader: React.FC<LoaderProps> = ({ size, color, className }) => {
  return (
    <div
      className={loaderVariants({ size, color, className })}
      role="status"
      aria-label="Loading"
    />
  );
};

export const LoadingPage: React.FC<{ message?: string }> = ({
  message = "Loading...",
}) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <Loader size="xl" />
      {message && (
        <p className="mt-4 text-lg text-gray-700 dark:text-gray-300">
          {message}
        </p>
      )}
    </div>
  );
};

export const LoadingOverlay: React.FC<{
  message?: string;
  isTransparent?: boolean;
}> = ({ message, isTransparent = false }) => {
  return (
    <div
      className={`absolute inset-0 flex flex-col items-center justify-center z-50 ${
        isTransparent
          ? "bg-white/70 dark:bg-gray-900/70"
          : "bg-white dark:bg-gray-900"
      }`}
    >
      <Loader size="lg" />
      {message && (
        <p className="mt-3 text-sm text-gray-600 dark:text-gray-400">
          {message}
        </p>
      )}
    </div>
  );
};
