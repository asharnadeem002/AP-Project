import React, { forwardRef } from "react";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, id, error, ...props }, ref) => {
    return (
      <div className="w-full max-w-md mb-4">
        <div className="form-floating">
          <input
            className={`input-field ${
              error ? "border-red-500" : ""
            } ${className}`}
            id={id}
            ref={ref}
            placeholder=" "
            {...props}
          />
          <label htmlFor={id} className="input-label">
            {label}
          </label>
        </div>
        {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
      </div>
    );
  }
);

Input.displayName = "Input";

export { Input };
