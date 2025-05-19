"use client";

import { useState, useRef, ChangeEvent, DragEvent } from "react";

interface AudioUploaderProps {
  onUpload: (file: File, url: string) => void;
  isLoading: boolean;
}

export default function AudioUploader({
  onUpload,
  isLoading,
}: AudioUploaderProps) {
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();

    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
  };

  const processFile = (file: File) => {
    if (!file.type.includes("audio/")) {
      alert("Please upload an audio file.");
      return;
    }

    const url = URL.createObjectURL(file);
    onUpload(file, url);
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div
      className={`flex w-full flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 transition-colors ${
        dragActive
          ? "border-indigo-500 bg-indigo-50"
          : "border-gray-300 bg-gray-50"
      }`}
      onDragEnter={handleDrag}
      onDragOver={handleDrag}
      onDragLeave={handleDrag}
      onDrop={handleDrop}
    >
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        accept="audio/*"
        onChange={handleFileChange}
        aria-label="Upload audio file"
      />

      <div className="flex flex-col items-center text-center">
        <svg
          className="mb-4 h-12 w-12 text-gray-400"
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M9 18V5l12-2v13" />
          <circle cx="6" cy="18" r="3" />
          <circle cx="18" cy="16" r="3" />
        </svg>

        <h3 className="mb-2 text-lg font-semibold text-gray-900">
          {isLoading ? "Processing..." : "Upload an audio file"}
        </h3>

        <p className="mb-4 text-sm text-gray-500">
          {isLoading
            ? "Please wait while we transcribe your audio"
            : "Drag and drop or click to upload an MP3, WAV, or other audio file"}
        </p>

        {!isLoading && (
          <button
            onClick={handleButtonClick}
            className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            Select File
          </button>
        )}

        {isLoading && (
          <div className="flex items-center space-x-2 text-indigo-600">
            <svg
              className="h-5 w-5 animate-spin"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            <span>Transcribing...</span>
          </div>
        )}
      </div>
    </div>
  );
}
