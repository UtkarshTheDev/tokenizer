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

const tokenToId = new Map([
  ["[UNK]", 0],
  ["play", 1],
  ["##ing", 2],
  ["##er", 3],
  ["##ed", 4],
  ["hello", 5],
  ["world", 6],
  ["!", 7],
  [",", 8],
  [".", 9],
  ["token", 10],
  ["##s", 11],
  ["##ize", 12],
  ["##izer", 13],
]);

const idToToken = [
  "[UNK]",
  "play",
  "##ing",
  "##er",
  "##ed",
  "hello",
  "world",
  "!",
  ",",
  ".",
  "token",
  "##s",
  "##ize",
  "##izer",
];

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

export const encode = (text: string, vocab: Set<string>): number[] => {
  const chunks = preTokenize(text);
  const tokens: string[] = [];
  const tokensID: number[] = [];
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
  for (const token of tokens) {
    const tokenId = tokenToId.get(token);
    if (tokenId === undefined) tokensID.push(0);
    else {
      tokensID.push(tokenId);
    }
  }
  return tokensID;
};

export const decode = (tokens: number[]): string => {
  const chunks: string[] = [];

  for (const token of tokens) {
    const chunk = idToToken[token];
    if (chunk === undefined) chunks.push("[UNK]");
    else {
      chunks.push(chunk);
    }
  }

  let string = "";
  for (const chunk of chunks) {
    if (chunk.slice(0, 2) === "##") {
      string += chunk.slice(2, chunk.length);
    } else if (PUNCTUATIONS.has(chunk)) {
      string += chunk;
    } else {
      if (string.length === 0) {
        string = chunk;
      } else {
        string += ` ${chunk}`;
      }
    }
  }
  return string;
};
