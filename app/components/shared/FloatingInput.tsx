import React from "react";

interface FloatingInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

export const FloatingInput: React.FC<FloatingInputProps> = ({
  label,
  id,
  ...props
}) => {
  return (
    <div className="form-floating relative w-full max-w-full">
      <input
        id={id}
        className="peer w-full p-2.5 border border-gray-300 rounded-md text-base outline-none transition-colors focus:border-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
        placeholder=" "
        {...props}
      />
      <label
        htmlFor={id}
        className="absolute top-1/2 left-2.5 -translate-y-1/2 bg-white dark:bg-gray-700 px-1 text-gray-500 dark:text-gray-400 text-base transition-all pointer-events-none peer-focus:top-0 peer-focus:left-2 peer-focus:text-xs peer-focus:text-blue-500 peer-[:not(:placeholder-shown)]:top-0 peer-[:not(:placeholder-shown)]:left-2 peer-[:not(:placeholder-shown)]:text-xs"
      >
        {label}
      </label>
    </div>
  );
};
