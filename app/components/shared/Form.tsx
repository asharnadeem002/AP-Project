import React from "react";
import {
  useForm,
  FormProvider,
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

export function useFormContext<T extends FieldValues>() {
  return useForm<T>();
}

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

interface FormErrorProps {
  message?: string;
}

export function FormError({ message }: FormErrorProps) {
  if (!message) return null;

  return <p className="text-red-500 text-sm mt-1">{message}</p>;
}

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
