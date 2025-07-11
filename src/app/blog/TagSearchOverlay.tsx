"use client";
import { useEffect, useRef, useState } from "react";

export default function TagSearchOverlay({ onSearch }: { onSearch: (term: string) => void }) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!open && e.key === "/") {
        e.preventDefault();
        setOpen(true);
        setTimeout(() => inputRef.current?.focus(), 10);
      } else if (open && e.key === "Escape") {
        setOpen(false);
        setValue("");
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (value.trim()) {
      onSearch(value.trim());
      setOpen(false);
      setValue("");
    }
  }

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center">
      <form onSubmit={handleSubmit} className="bg-white rounded shadow-lg p-6 w-full max-w-md flex flex-col gap-4">
        <label className="text-lg font-semibold">Search by tag or ticker</label>
        <input
          ref={inputRef}
          className="border p-2 rounded text-lg"
          placeholder="Type a tag or ticker (e.g. MVST, Stock Investing)"
          value={value}
          onChange={e => setValue(e.target.value)}
        />
        <button type="submit" className="bg-blue-600 text-white py-2 rounded hover:bg-blue-700">Search</button>
        <span className="text-xs text-gray-500">Press Esc to close</span>
      </form>
    </div>
  );
}
