import { NextResponse } from "next/server";
import OpenAI from "openai";
import fs from "fs";
import { writeFile } from "fs/promises";
import { join } from "path";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "",
});

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const audioFile = formData.get("audio") as File;

    if (!audioFile) {
      return NextResponse.json(
        { error: "No audio file provided" },
        { status: 400 }
      );
    }

    // Create a temporary file path
    const fileName = audioFile.name || `audio-${Date.now()}.wav`;
    const tempFilePath = join("/tmp", fileName);

    // Write the file to disk
    const bytes = await audioFile.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(tempFilePath, buffer);

    // Create a ReadStream from the file
    const fileStream = fs.createReadStream(tempFilePath);

    // Create the form data for OpenAI
    const form = new FormData();
    form.append("file", new Blob([buffer], { type: audioFile.type }), fileName);
    form.append("model", "whisper-1");
    form.append("response_format", "verbose_json");
    form.append("language", "en");
    form.append(
      "prompt",
      "This is an English audio recording. Please transcribe it accurately in English."
    );
    form.append("timestamp_granularities", "word"); // Explicitly request word-level timestamps

    console.log(
      "Sending transcription request with language: en and word-level timestamps"
    );

    // Use fetch directly to call OpenAI API
    const response = await fetch(
      "https://api.openai.com/v1/audio/transcriptions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: form,
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(JSON.stringify(errorData));
    }

    const transcription = await response.json();

    // Log the structure of the response
    console.log("Transcription response keys:", Object.keys(transcription));

    if (transcription.segments) {
      console.log(`Got ${transcription.segments.length} segments`);
      if (transcription.segments.length > 0) {
        const firstSegment = transcription.segments[0];
        console.log("First segment keys:", Object.keys(firstSegment));

        if (firstSegment.words) {
          console.log(`First segment has ${firstSegment.words.length} words`);
          if (firstSegment.words.length > 0) {
            console.log(
              "Sample word format:",
              JSON.stringify(firstSegment.words[0])
            );
          }
        } else {
          console.log("No words array in segments!");
        }
      }
    } else if (transcription.words) {
      console.log(`Got ${transcription.words.length} words at top level`);
    } else {
      console.log("No word-level timing information found in response");
    }

    return NextResponse.json(transcription);
  } catch (error) {
    console.error("Error transcribing audio:", error);
    return NextResponse.json(
      { error: "Failed to transcribe audio" },
      { status: 500 }
    );
  }
}
