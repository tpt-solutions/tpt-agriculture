import React from "react";

type Props = React.InputHTMLAttributes<HTMLInputElement> & {
  error?: boolean;
};

export function Input({ error, className = "", ...props }: Props) {
  return (
    <input
      {...props}
      className={[
        "rounded-md border px-3 py-2 text-sm shadow-sm outline-none transition-colors",
        "focus:ring-2 focus:ring-green-500 focus:border-green-500",
        error ? "border-red-400 bg-red-50" : "border-gray-300 bg-white",
        className,
      ].join(" ")}
    />
  );
}
