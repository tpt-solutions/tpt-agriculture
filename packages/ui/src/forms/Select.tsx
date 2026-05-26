import React from "react";

type Props = React.SelectHTMLAttributes<HTMLSelectElement> & {
  error?: boolean;
  options: { value: string; label: string }[];
  placeholder?: string;
};

export function Select({ error, options, placeholder, className = "", ...props }: Props) {
  return (
    <select
      {...props}
      className={[
        "rounded-md border px-3 py-2 text-sm shadow-sm outline-none transition-colors",
        "focus:ring-2 focus:ring-green-500 focus:border-green-500",
        error ? "border-red-400 bg-red-50" : "border-gray-300 bg-white",
        className,
      ].join(" ")}
    >
      {placeholder && (
        <option value="" disabled>
          {placeholder}
        </option>
      )}
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}
