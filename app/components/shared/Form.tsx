import React from "react";
import {
  useForm,
  FormProvider,
  UseFormReturn,
  FieldValues,
  DefaultValues,
  SubmitHandler,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

interface FormProps<T extends FieldValues> {
  children: React.ReactNode;
  onSubmit: SubmitHandler<T>;
  defaultValues?: DefaultValues<T>;
  schema?: z.ZodSchema<T>;
  className?: string;
  resetOnSubmit?: boolean;
}

// Create a form component that provides access to form context
export function Form<T extends FieldValues>({
  children,
  onSubmit,
  defaultValues,
  schema,
  className,
  resetOnSubmit = false,
}: FormProps<T>) {
  const methods = useForm<T>({
    defaultValues,
    resolver: schema ? zodResolver(schema) : undefined,
  });

  const handleSubmit = async (data: T) => {
    await onSubmit(data);
    if (resetOnSubmit) {
      methods.reset();
    }
  };

  return (
    <FormProvider {...methods}>
      <form
        onSubmit={methods.handleSubmit(handleSubmit)}
        className={className}
        noValidate
      >
        {children}
      </form>
    </FormProvider>
  );
}

// Helper component to access form context in child components
export function useFormContext<T extends FieldValues>() {
  return useForm<T>();
}

// Export a basic form field component
interface FormFieldProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function FormField({ children, className, ...props }: FormFieldProps) {
  return (
    <div className={`mb-4 ${className || ""}`} {...props}>
      {children}
    </div>
  );
}

// Export form error message component
interface FormErrorProps {
  message?: string;
}

export function FormError({ message }: FormErrorProps) {
  if (!message) return null;

  return <p className="text-red-500 text-sm mt-1">{message}</p>;
}

// Export form submit button wrapping component
interface FormSubmitProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function FormSubmit({ children, className, ...props }: FormSubmitProps) {
  return (
    <div className={`mt-6 ${className || ""}`} {...props}>
      {children}
    </div>
  );
}
