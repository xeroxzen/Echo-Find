"use client";

import { useEffect, useRef, useState } from "react";
import WaveSurfer from "wavesurfer.js";
import RegionsPlugin from "wavesurfer.js/dist/plugins/regions";

interface AudioPlayerProps {
  audioUrl: string;
  highlights?: Array<{
    start: number;
    end: number;
    text: string;
  }>;
  currentSearch?: string;
}

export default function AudioPlayer({
  audioUrl,
  highlights = [],
  currentSearch = "",
}: AudioPlayerProps) {
  const waveformRef = useRef<HTMLDivElement>(null);
  const wavesurferRef = useRef<WaveSurfer | null>(null);
  const regionsRef = useRef<any>(null);
  const isMountedRef = useRef<boolean>(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  // Set mounted ref on mount/unmount
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Initialize WaveSurfer
  useEffect(() => {
    if (!waveformRef.current || !audioUrl) return;

    let wavesurfer: WaveSurfer | null = null;

    // Create WaveSurfer instance
    try {
      wavesurfer = WaveSurfer.create({
        container: waveformRef.current,
        waveColor: "#4F46E5",
        progressColor: "#818CF8",
        cursorColor: "#4F46E5",
        barWidth: 2,
        barGap: 1,
        height: 80,
        barRadius: 3,
      });

      // Initialize regions plugin
      const regions = wavesurfer.registerPlugin(RegionsPlugin.create());
      regionsRef.current = regions;

      // Set event handlers
      wavesurfer.on("ready", () => {
        if (isMountedRef.current) {
          wavesurferRef.current = wavesurfer;
          setDuration(wavesurfer?.getDuration() || 0);
        }
      });

      wavesurfer.on("play", () => {
        if (isMountedRef.current) {
          setIsPlaying(true);
        }
      });

      wavesurfer.on("pause", () => {
        if (isMountedRef.current) {
          setIsPlaying(false);
        }
      });

      wavesurfer.on("timeupdate", (time) => {
        if (isMountedRef.current) {
          setCurrentTime(time);
        }
      });

      // Load audio
      wavesurfer.load(audioUrl);

      // Store reference
      wavesurferRef.current = wavesurfer;
    } catch (error) {
      console.error("Error initializing WaveSurfer:", error);
    }

    // Clean up on unmount or when audioUrl changes
    return () => {
      try {
        // First, cancel any pending loads or operations
        if (wavesurfer) {
          // Remove all event listeners to prevent callbacks during destruction
          wavesurfer.unAll();

          // Defensively destroy the wavesurfer instance
          if (!(wavesurfer as any).isDestroyed) {
            wavesurfer.destroy();
          }
        }

        // Clear the references
        wavesurferRef.current = null;
        regionsRef.current = null;
      } catch (error) {
        console.error("Error during wavesurfer cleanup:", error);
      }
    };
  }, [audioUrl]);

  // Update regions when highlights change
  useEffect(() => {
    if (
      !wavesurferRef.current ||
      !regionsRef.current ||
      !highlights.length ||
      !isMountedRef.current
    )
      return;

    try {
      // Clear existing regions
      regionsRef.current.clearRegions();

      // Add new regions based on highlights
      highlights.forEach((highlight, index) => {
        regionsRef.current.addRegion({
          start: highlight.start,
          end: highlight.end,
          content: highlight.text,
          color: "rgba(79, 70, 229, 0.3)",
          id: `region-${index}`,
        });
      });
    } catch (error) {
      console.error("Error updating regions:", error);
    }
  }, [highlights, currentSearch]);

  // Play/pause control
  const togglePlayPause = () => {
    if (!wavesurferRef.current) return;
    try {
      wavesurferRef.current.playPause();
    } catch (error) {
      console.error("Error toggling play/pause:", error);
    }
  };

  // Jump to timestamp
  const jumpToTimestamp = (time: number) => {
    if (!wavesurferRef.current) return;
    try {
      wavesurferRef.current.setTime(time);
      wavesurferRef.current.play();
    } catch (error) {
      console.error("Error jumping to timestamp:", error);
    }
  };

  // Format time (seconds to MM:SS)
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="w-full space-y-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <div ref={waveformRef} className="w-full" />

      <div className="flex items-center justify-between">
        <button
          onClick={togglePlayPause}
          className="rounded-full bg-indigo-600 p-2 text-white hover:bg-indigo-700"
        >
          {isPlaying ? (
            <svg
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
              <rect x="6" y="4" width="4" height="16" />
              <rect x="14" y="4" width="4" height="16" />
            </svg>
          ) : (
            <svg
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
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
          )}
        </button>

        <div className="text-sm font-medium text-gray-700">
          {formatTime(currentTime)} / {formatTime(duration)}
        </div>
      </div>

      {highlights.length > 0 && (
        <div className="mt-4 space-y-2 rounded-lg bg-gray-50 p-3">
          <h3 className="font-medium text-gray-900">
            Found matches for:{" "}
            <span className="text-indigo-600">{currentSearch}</span>
          </h3>
          <ul className="max-h-40 space-y-1 overflow-y-auto text-sm">
            {highlights.map((highlight, idx) => (
              <li
                key={idx}
                className="flex items-center justify-between rounded px-2 py-1 hover:bg-gray-100"
              >
                <span className="mr-2 flex-1">{highlight.text}</span>
                <button
                  onClick={() => jumpToTimestamp(highlight.start)}
                  className="flex items-center rounded-md bg-indigo-50 px-2 py-1 text-xs font-medium text-indigo-700 hover:bg-indigo-100"
                >
                  {formatTime(highlight.start)}
                  <svg
                    className="ml-1 h-3 w-3"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polygon points="5 3 19 12 5 21 5 3" />
                  </svg>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
