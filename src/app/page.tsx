"use client";

import { useState } from "react";
import AudioUploader from "@/components/AudioUploader";
import AudioPlayer from "@/components/AudioPlayer";
import SearchBar from "@/components/SearchBar";
import { searchTranscription, HighlightResult } from "@/lib/search";

interface TranscriptionResult {
  text: string;
  words: Array<{
    word: string;
    start: number;
    end: number;
  }>;
}

export default function Home() {
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioUrl, setAudioUrl] = useState<string>("");
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcription, setTranscription] =
    useState<TranscriptionResult | null>(null);
  const [highlights, setHighlights] = useState<HighlightResult[]>([]);
  const [currentSearch, setCurrentSearch] = useState<string>("");
  const [error, setError] = useState<string>("");

  const handleUpload = async (file: File, url: string) => {
    setAudioFile(file);
    setAudioUrl(url);
    setIsTranscribing(true);
    setError("");
    setHighlights([]);
    setCurrentSearch("");

    try {
      const formData = new FormData();
      formData.append("audio", file);

      const response = await fetch("/api/transcribe", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to transcribe audio");
      }

      const data = await response.json();
      setTranscription(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unknown error occurred"
      );
      console.error("Error transcribing audio:", err);
    } finally {
      setIsTranscribing(false);
    }
  };

  const handleSearch = (query: string) => {
    if (!transcription || !query) return;

    setCurrentSearch(query);
    const results = searchTranscription(transcription, query);
    setHighlights(results);
  };

  return (
    <main className="flex min-h-screen flex-col items-center p-4 md:p-8">
      <header className="mb-8 text-center">
        <h1 className="mb-2 text-3xl font-bold text-gray-900 md:text-4xl">
          EchoFind
        </h1>
        <p className="text-lg text-gray-600">
          Upload audio, search for words, and jump to precise moments
        </p>
      </header>

      <div className="w-full max-w-4xl space-y-6">
        {!audioFile && (
          <AudioUploader onUpload={handleUpload} isLoading={isTranscribing} />
        )}

        {audioFile && (
          <>
            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <h2 className="mb-3 text-xl font-semibold text-gray-900">
                  Search Audio
                </h2>
                <SearchBar
                  onSearch={handleSearch}
                  disabled={isTranscribing || !transcription}
                />

                {transcription && (
                  <div className="mt-4 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                    <h3 className="mb-2 font-medium text-gray-900">
                      Transcription
                    </h3>
                    <div className="max-h-60 overflow-y-auto rounded-md bg-gray-50 p-3 text-sm text-gray-800">
                      {transcription.text}
                    </div>
                  </div>
                )}
              </div>

              <div>
                <h2 className="mb-3 text-xl font-semibold text-gray-900">
                  Audio Player
                </h2>
                <AudioPlayer
                  audioUrl={audioUrl}
                  highlights={highlights}
                  currentSearch={currentSearch}
                />

                {highlights.length === 0 && currentSearch && (
                  <p className="mt-2 text-sm text-amber-600">
                    No matches found for &quot;{currentSearch}&quot;
                  </p>
                )}

                {error && (
                  <div className="mt-4 rounded-md bg-red-50 p-3 text-sm text-red-700">
                    <p>Error: {error}</p>
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={() => {
                setAudioFile(null);
                setAudioUrl("");
                setTranscription(null);
                setHighlights([]);
                setCurrentSearch("");
                setError("");
              }}
              className="mt-6 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
            >
              <svg
                className="mr-2 -ml-1 h-4 w-4"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
              Upload different audio
            </button>
          </>
        )}
      </div>
    </main>
  );
}
