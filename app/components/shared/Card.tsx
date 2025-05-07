import React from "react";

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

export function Card({ children, className }: CardProps) {
  return (
    <div
      className={`bg-white dark:bg-slate-800 rounded-lg shadow-md overflow-hidden ${
        className || ""
      }`}
    >
      {children}
    </div>
  );
}

interface CardHeaderProps {
  children: React.ReactNode;
  className?: string;
}

export function CardHeader({ children, className }: CardHeaderProps) {
  return (
    <div
      className={`p-6 border-b border-slate-200 dark:border-slate-700 ${
        className || ""
      }`}
    >
      {children}
    </div>
  );
}

interface CardTitleProps {
  children: React.ReactNode;
  className?: string;
}

export function CardTitle({ children, className }: CardTitleProps) {
  return (
    <h3
      className={`text-xl font-bold text-slate-900 dark:text-slate-100 ${
        className || ""
      }`}
    >
      {children}
    </h3>
  );
}

interface CardDescriptionProps {
  children: React.ReactNode;
  className?: string;
}

export function CardDescription({ children, className }: CardDescriptionProps) {
  return (
    <p
      className={`text-sm text-slate-500 dark:text-slate-400 mt-1 ${
        className || ""
      }`}
    >
      {children}
    </p>
  );
}

interface CardContentProps {
  children: React.ReactNode;
  className?: string;
}

export function CardContent({ children, className }: CardContentProps) {
  return <div className={`p-6 ${className || ""}`}>{children}</div>;
}

interface CardFooterProps {
  children: React.ReactNode;
  className?: string;
}

export function CardFooter({ children, className }: CardFooterProps) {
  return (
    <div
      className={`p-6 border-t border-slate-200 dark:border-slate-700 ${
        className || ""
      }`}
    >
      {children}
    </div>
  );
}
