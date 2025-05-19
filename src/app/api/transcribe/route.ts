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

    console.log("Sending transcription request with language: en");

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
    return NextResponse.json(transcription);
  } catch (error) {
    console.error("Error transcribing audio:", error);
    return NextResponse.json(
      { error: "Failed to transcribe audio" },
      { status: 500 }
    );
  }
}
