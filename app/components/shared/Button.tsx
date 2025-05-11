import React from "react";
import { cva, type VariantProps } from "class-variance-authority";

// Define button variants using CVA
const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none",
  {
    variants: {
      variant: {
        default: "bg-blue-600 text-black hover:bg-blue-700 hover:text-white",
        destructive: "bg-red-600 text-black hover:bg-red-700 hover:text-white",
        outline:
          "bg-transparent border border-slate-200 text-black hover:bg-slate-100 hover:text-white dark:border-slate-700 dark:hover:bg-slate-800",
        subtle:
          "bg-slate-100 text-black hover:bg-slate-200 hover:text-white dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700",
        ghost:
          "bg-transparent text-black hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 dark:text-slate-100",
        link: "bg-transparent underline-offset-4 text-black hover:text-white hover:underline hover:bg-transparent dark:text-slate-100",
      },
      size: {
        default: "h-10 py-2 px-4",
        sm: "h-9 px-2 rounded-md",
        lg: "h-11 px-8 rounded-md",
        xl: "h-14 px-8 rounded-md text-lg",
        icon: "h-10 w-10",
      },
      fullWidth: {
        true: "w-full",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      fullWidth: false,
    },
  }
);

// Define button props including all HTML button props
export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  isLoading?: boolean;
}

// Create Button component
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { className, children, variant, size, fullWidth, isLoading, ...props },
    ref
  ) => {
    return (
      <button
        className={buttonVariants({ variant, size, fullWidth, className })}
        ref={ref}
        disabled={isLoading || props.disabled}
        {...props}
      >
        {isLoading ? (
          <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-slate-200 border-t-slate-800" />
        ) : null}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";

export { Button, buttonVariants };
