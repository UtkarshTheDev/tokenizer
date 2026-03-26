import { PUNCTUATIONS } from "./manualPreTokenizer";
import preTokenize from "./preTokenizer";

const vocab = new Set([
  "[UNK]",
  "play",
  "work",
  "hello",
  "world",
  "token",
  "##ing",
  "##er",
  "##ed",
  "##s",
  "##ize",
  "##izer",
  "!",
  ",",
  ".",
]);

const encodeWord = (word: string, vocab: Set<string>): string[] => {
  let start = 0;
  let end = word.length;
  let candidate: string;
  const words: string[] = [];
  let isMatched = false;

  while (end > start) {
    if (start === 0) {
      candidate = word.slice(start, end);
    } else {
      candidate = `##${word.slice(start, end)}`;
    }

    if (vocab.has(candidate)) {
      start = end;
      // Reset to the full word so the next pass can shrink from the end again.
      end = word.length + 1;
      isMatched = true;
      words.push(candidate);
    } else {
      isMatched = false;
    }

    end--;
    // If no substring matched for the current segment, the whole word is unknown.
    if (start === end && isMatched === false) {
      return ["[UNK]"];
    }
  }
  return words;
};

export const encode = (text: string, vocab: Set<string>): string[] => {
  const chunks = preTokenize(text);
  const tokens: string[] = [];

  for (const chunk of chunks) {
    if (PUNCTUATIONS.has(chunk) && vocab.has(chunk)) {
      tokens.push(chunk);
    } else if (PUNCTUATIONS.has(chunk)) {
      tokens.push("[UNK]");
    } else {
      const token = encodeWord(chunk, vocab);
      tokens.push(...token);
    }
  }
  return tokens;
};

export const decode = (tokens: string[]): string => {
  let string = "";
  for (const token of tokens) {
    if (token.slice(0, 2) === "##") {
      string += token.slice(2, token.length);
    } else if (PUNCTUATIONS.has(token)) {
      string += token;
    } else {
      if (string.length === 0) {
        string = token;
      } else {
        string += ` ${token}`;
      }
    }
  }
  return string;
};
