import React, { useEffect, useRef, useState } from "react";

export interface ComboboxOption {
  value: string;
  label: string;
}

type Props = {
  options: ComboboxOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  error?: boolean;
  className?: string;
  /** When set, typing a value that doesn't match any option shows an
   * "+ Add “...”" row; picking it calls this instead of onChange. */
  onAddCustom?: (value: string) => void;
};

export function Combobox({
  options,
  value,
  onChange,
  placeholder,
  required,
  disabled,
  error,
  className = "",
  onAddCustom,
}: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [highlighted, setHighlighted] = useState(0);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const selectedLabel = options.find((o) => o.value === value)?.label ?? "";

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    }
    if (open) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const filtered = query.trim()
    ? options.filter((o) => o.label.toLowerCase().includes(query.trim().toLowerCase()))
    : options;

  const trimmedQuery = query.trim();
  const hasExactMatch = options.some((o) => o.label.toLowerCase() === trimmedQuery.toLowerCase());
  const showAddRow = !!onAddCustom && trimmedQuery.length > 0 && !hasExactMatch;

  const rowCount = filtered.length + (showAddRow ? 1 : 0);

  function selectOption(option: ComboboxOption) {
    onChange(option.value);
    setOpen(false);
    setQuery("");
  }

  function selectAddRow() {
    if (!onAddCustom || !trimmedQuery) return;
    onAddCustom(trimmedQuery);
    setOpen(false);
    setQuery("");
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open) {
      if (e.key === "ArrowDown" || e.key === "Enter") {
        e.preventDefault();
        setOpen(true);
        setHighlighted(0);
      }
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlighted((i) => Math.min(i + 1, rowCount - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlighted((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (highlighted < filtered.length) {
        const opt = filtered[highlighted];
        if (opt) selectOption(opt);
      } else if (showAddRow) {
        selectAddRow();
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      setOpen(false);
      setQuery("");
    }
  }

  return (
    <div ref={wrapperRef} className="relative">
      <input
        type="text"
        disabled={disabled}
        required={required}
        placeholder={placeholder}
        value={open ? query : selectedLabel}
        onFocus={() => {
          setOpen(true);
          setQuery("");
          setHighlighted(0);
        }}
        onChange={(e) => {
          setQuery(e.target.value);
          setHighlighted(0);
          if (!open) setOpen(true);
        }}
        onKeyDown={handleKeyDown}
        className={[
          "w-full rounded-md border px-3 py-2 text-sm shadow-sm outline-none transition-colors",
          "focus:ring-2 focus:ring-green-500 focus:border-green-500",
          error ? "border-red-400 bg-red-50" : "border-gray-300 bg-white",
          disabled ? "cursor-not-allowed bg-gray-50 text-gray-400" : "",
          className,
        ].join(" ")}
      />
      {open && (
        <ul className="absolute z-10 mt-1 max-h-56 w-full overflow-auto rounded-md border border-gray-200 bg-white py-1 text-sm shadow-lg">
          {filtered.length === 0 && !showAddRow && (
            <li className="px-3 py-2 text-gray-400">No matches</li>
          )}
          {filtered.map((opt, i) => (
            <li
              key={opt.value}
              onMouseDown={(e) => {
                e.preventDefault();
                selectOption(opt);
              }}
              onMouseEnter={() => setHighlighted(i)}
              className={[
                "cursor-pointer px-3 py-2",
                i === highlighted ? "bg-green-50 text-green-700" : "text-gray-700",
              ].join(" ")}
            >
              {opt.label}
            </li>
          ))}
          {showAddRow && (
            <li
              onMouseDown={(e) => {
                e.preventDefault();
                selectAddRow();
              }}
              onMouseEnter={() => setHighlighted(filtered.length)}
              className={[
                "cursor-pointer border-t border-gray-100 px-3 py-2 font-medium",
                filtered.length === highlighted ? "bg-green-50 text-green-700" : "text-green-600",
              ].join(" ")}
            >
              + Add “{trimmedQuery}”
            </li>
          )}
        </ul>
      )}
    </div>
  );
}
