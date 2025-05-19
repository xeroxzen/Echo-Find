"use client";

import { useState, FormEvent } from "react";

interface SearchBarProps {
  onSearch: (query: string) => void;
  disabled: boolean;
}

export default function SearchBar({ onSearch, disabled }: SearchBarProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      onSearch(searchQuery.trim());
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="relative">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search for words or phrases..."
          disabled={disabled}
          className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 pr-10 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:opacity-70"
        />

        <button
          type="submit"
          disabled={disabled || !searchQuery.trim()}
          aria-label="Search"
          title="Search"
          className="absolute inset-y-0 right-0 flex items-center rounded-r-lg bg-indigo-600 px-3 text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-gray-400"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </button>
      </div>

      {disabled && (
        <p className="mt-2 text-sm text-gray-500">
          Upload and transcribe an audio file to search through it
        </p>
      )}
    </form>
  );
}
