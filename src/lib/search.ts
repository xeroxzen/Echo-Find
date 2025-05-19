interface TranscriptionWord {
  word: string;
  start: number;
  end: number;
}

interface TranscriptionResponse {
  text: string;
  words: TranscriptionWord[];
  // Add fallback properties from OpenAI's response
  segments?: Array<{
    start: number;
    end: number;
    text: string;
    words: TranscriptionWord[];
  }>;
}

export interface HighlightResult {
  text: string;
  start: number;
  end: number;
}

export function searchTranscription(
  transcription: TranscriptionResponse,
  searchTerm: string
): HighlightResult[] {
  console.log("Search Term:", searchTerm);

  if (!transcription || !searchTerm) {
    console.log("Early return: Missing transcription or search term");
    return [];
  }

  // Extract words from the response structure
  let words: TranscriptionWord[] = [];

  // Check for direct words array
  if (transcription.words && transcription.words.length > 0) {
    words = transcription.words;
  }
  // Check for nested words inside segments (Whisper API format)
  else if (transcription.segments && transcription.segments.length > 0) {
    // Collect words from all segments
    transcription.segments.forEach((segment) => {
      if (segment.words && segment.words.length > 0) {
        words = words.concat(segment.words);
      }
    });
  }

  console.log("Words array length:", words.length);
  if (words.length === 0) {
    // Last resort: create fake word boundaries based on the full text
    if (transcription.text) {
      console.log("Creating words from full text");
      const textWords = transcription.text.split(/\s+/);
      const avgDuration = 0.5; // Estimate 0.5 seconds per word

      words = textWords.map((word, index) => ({
        word,
        start: index * avgDuration,
        end: (index + 1) * avgDuration,
      }));
    } else {
      console.log("No words found in transcription");
      return [];
    }
  }

  const searchTermLower = searchTerm.toLowerCase();
  const matches: HighlightResult[] = [];

  // Sample the first few words to debug format
  if (words.length > 0) {
    console.log("Sample words format:", JSON.stringify(words.slice(0, 3)));
  }

  // Search for individual words
  if (!searchTermLower.includes(" ")) {
    console.log("Searching for single word:", searchTermLower);
    for (let i = 0; i < words.length; i++) {
      const wordObj = words[i];
      const normalizedWord = wordObj.word
        .toLowerCase()
        .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "");

      if (i % 10 === 0) {
        console.log(
          `Word ${i}: Original = "${wordObj.word}", Normalized = "${normalizedWord}"`
        );
      }

      if (
        normalizedWord === searchTermLower ||
        normalizedWord.includes(searchTermLower)
      ) {
        console.log("Match found:", wordObj.word, "at", wordObj.start);
        matches.push({
          text: wordObj.word,
          start: wordObj.start,
          end: wordObj.end,
        });
      }
    }
    console.log("Single word search results:", matches.length);
    return matches;
  }

  // Search for multi-word phrases
  console.log("Searching for phrase:", searchTermLower);
  const searchWords = searchTermLower.split(" ");
  console.log("Search words:", searchWords);

  for (let i = 0; i <= words.length - searchWords.length; i++) {
    let match = true;
    let completePhrase = "";
    let startTime = 0;
    let endTime = 0;

    for (let j = 0; j < searchWords.length; j++) {
      const currentWordIndex = i + j;
      if (currentWordIndex >= words.length) {
        match = false;
        break;
      }

      const currentWord = words[currentWordIndex].word
        .toLowerCase()
        .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "");
      const searchWord = searchWords[j];

      if (i % 20 === 0 && j === 0) {
        console.log(
          `Checking phrase at index ${i}: "${currentWord}" includes "${searchWord}"?`
        );
      }

      if (!currentWord.includes(searchWord)) {
        match = false;
        break;
      }

      if (j === 0) {
        startTime = words[currentWordIndex].start;
      }

      completePhrase += (j > 0 ? " " : "") + words[currentWordIndex].word;
      endTime = words[currentWordIndex].end;
    }

    if (match) {
      console.log("Phrase match found:", completePhrase, "at", startTime);
      matches.push({
        text: completePhrase,
        start: startTime,
        end: endTime,
      });
    }
  }

  console.log("Phrase search results:", matches.length);
  return matches;
}

export function getContextAroundMatch(
  transcription: TranscriptionResponse,
  match: HighlightResult,
  contextWords: number = 5
): string {
  // Extract words using the same logic as in searchTranscription
  let words: TranscriptionWord[] = [];

  if (transcription.words && transcription.words.length > 0) {
    words = transcription.words;
  } else if (transcription.segments && transcription.segments.length > 0) {
    transcription.segments.forEach((segment) => {
      if (segment.words && segment.words.length > 0) {
        words = words.concat(segment.words);
      }
    });
  }

  if (words.length === 0) {
    return match.text;
  }

  let startWordIndex = -1;

  // Find the starting word index
  for (let i = 0; i < words.length; i++) {
    if (Math.abs(words[i].start - match.start) < 0.1) {
      startWordIndex = i;
      break;
    }
  }

  if (startWordIndex === -1) {
    return match.text;
  }

  // Calculate the context window
  const contextStartIndex = Math.max(0, startWordIndex - contextWords);
  const contextEndIndex = Math.min(
    words.length - 1,
    startWordIndex + match.text.split(" ").length + contextWords - 1
  );

  // Build the context string
  let contextString = "";
  for (let i = contextStartIndex; i <= contextEndIndex; i++) {
    const word = words[i].word;
    contextString += (i > contextStartIndex ? " " : "") + word;
  }

  return contextString;
}
