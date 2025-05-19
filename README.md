# EchoFind

EchoFind is a lightweight web application that allows users to upload an audio file and search for specific words or phrases within it. The app transcribes the audio, identifies where the searched terms appear, and highlights the exact timestamps, enabling users to jump directly to those moments in the playback.

## Features

- Upload audio files (MP3, WAV, etc.)
- Transcribe audio using OpenAI's Whisper model
- Search for words or phrases within the transcription
- View highlighted matches with timestamps
- Jump directly to specific moments in the audio
- Visual waveform display with highlighted regions

## Prerequisites

- Node.js 18+ and npm
- An OpenAI API key (for transcription service)

## Getting Started

1. Clone the repository:

```bash
git clone git@github.com:xeroxzen/Echo-Find.git
cd Echo-Find
```

2. Install dependencies:

```bash
npm install
```

3. Create a `.env.local` file in the root directory with your OpenAI API key:

```
OPENAI_API_KEY=your_openai_api_key_here
```

4. Run the development server:

```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

## Usage

1. Upload an audio file by dragging and dropping or clicking the upload area
2. Wait for the transcription to complete, it takes 5 seconds
3. Search for specific words or phrases using the search bar
4. Click on any of the matched results to jump to that part of the audio
5. View the complete transcription text below the search bar

## Technologies Used

- Next.js 14
- TypeScript
- Tailwind CSS
- OpenAI Whisper API for transcription
- WaveSurfer.js for audio visualization

## License

MIT
