interface TranscriptionWord {
  word: string;
  start: number;
  end: number;
}

interface TranscriptionResponse {
  text: string;
  words: TranscriptionWord[];
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
  if (
    !transcription ||
    !searchTerm ||
    !transcription.words ||
    transcription.words.length === 0
  ) {
    return [];
  }

  const searchTermLower = searchTerm.toLowerCase();
  const matches: HighlightResult[] = [];
  const { words } = transcription;

  // Search for individual words
  if (!searchTermLower.includes(" ")) {
    for (let i = 0; i < words.length; i++) {
      const wordObj = words[i];
      const normalizedWord = wordObj.word
        .toLowerCase()
        .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "");

      if (
        normalizedWord === searchTermLower ||
        normalizedWord.includes(searchTermLower)
      ) {
        matches.push({
          text: wordObj.word,
          start: wordObj.start,
          end: wordObj.end,
        });
      }
    }
    return matches;
  }

  // Search for multi-word phrases
  const searchWords = searchTermLower.split(" ");

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
      matches.push({
        text: completePhrase,
        start: startTime,
        end: endTime,
      });
    }
  }

  return matches;
}

export function getContextAroundMatch(
  transcription: TranscriptionResponse,
  match: HighlightResult,
  contextWords: number = 5
): string {
  if (
    !transcription ||
    !transcription.words ||
    transcription.words.length === 0
  ) {
    return match.text;
  }

  const { words } = transcription;
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
