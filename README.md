# EchoFind 🎵

[![Next.js](https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
[![OpenAI](https://img.shields.io/badge/OpenAI-Whisper-412991?style=for-the-badge&logo=openai)](https://openai.com/)
[![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)

<div align="center">
  <img src="src/app/favicon.ico" alt="EchoFind Logo" width="200"/>
  
  <p><em>Find your words in audio, instantly.</em></p>
</div>

## ✨ Features

- 🎧 Upload audio files (MP3, WAV, etc.)
- 🎯 Transcribe audio using OpenAI's Whisper model
- 🔍 Search for words or phrases within the transcription
- ⏱️ View highlighted matches with timestamps
- 🎯 Jump directly to specific moments in the audio
- 📊 Visual waveform display with highlighted regions

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm
- An OpenAI API key (for transcription service)

### Installation

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

```env
OPENAI_API_KEY=your_openai_api_key_here
```

4. Start the development server:

```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

## 📖 Usage Guide

1. **Upload Audio**

   - Drag and drop your audio file
   - Or click the upload area to select a file

2. **Transcription**

   - Wait for the transcription to complete (typically 5 seconds)
   - View the complete transcription text below the search bar

3. **Search & Navigate**
   - Enter your search term in the search bar
   - Click on matched results to jump to that timestamp
   - Use the waveform visualization to navigate

## 🛠️ Tech Stack

- **Frontend Framework:** [Next.js 14](https://nextjs.org/)
- **Language:** [TypeScript](https://www.typescriptlang.org/)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/)
- **Audio Processing:** [WaveSurfer.js](https://wavesurfer-js.org/)
- **Transcription:** [OpenAI Whisper API](https://openai.com/research/whisper)

## 🔐 Authentication

To use EchoFind, you'll need to set up authentication with your OpenAI API key:

1. Sign up for an OpenAI account at [https://platform.openai.com](https://platform.openai.com)
2. Generate an API key from your dashboard
3. Add the API key to your `.env.local` file:
   ```env
   OPENAI_API_KEY=your_openai_api_key_here
   ```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

<div align="center">
  Made with ❤️ by Andile
</div>
