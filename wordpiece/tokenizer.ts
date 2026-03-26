import type { WordPieceModel } from "./data";
import { PUNCTUATIONS } from "./manualPreTokenizer";
import preTokenize from "./preTokenizer";

const encodeWord = (word: string, model: WordPieceModel): string[] => {
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

    if (model.tokenToId.has(candidate)) {
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
      return [model.unkToken];
    }
  }
  return words;
};

export const encode = (text: string, model: WordPieceModel): number[] => {
  const chunks = preTokenize(text);
  const tokens: string[] = [];
  const tokensID: number[] = [];
  for (const chunk of chunks) {
    if (PUNCTUATIONS.has(chunk) && model.tokenToId.has(chunk)) {
      tokens.push(chunk);
    } else if (PUNCTUATIONS.has(chunk)) {
      tokens.push(model.unkToken);
    } else {
      const token = encodeWord(chunk, model);
      tokens.push(...token);
    }
  }
  for (const token of tokens) {
    const tokenId = model.tokenToId.get(token);
    if (tokenId === undefined) {
      const unkTokenID = model.tokenToId.get(model.unkToken);
      if (unkTokenID === undefined) break;
      tokensID.push(unkTokenID);
    } else {
      tokensID.push(tokenId);
    }
  }
  return tokensID;
};

export const decode = (tokens: number[], model: WordPieceModel): string => {
  const chunks: string[] = [];

  for (const token of tokens) {
    const chunk = model.idToToken[token];
    if (chunk === undefined) chunks.push(model.unkToken);
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
