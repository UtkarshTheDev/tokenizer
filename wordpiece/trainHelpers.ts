import preTokenize from "./preTokenizer";
import { PUNCTUATIONS } from "./manualPreTokenizer";
import type { WordPieceModel } from "./types";

export const wordFreq = (text: string) => {
  const chunks = preTokenize(text);
  const freq = new Map<string, number>();

  for (const chunk of chunks) {
    if (!PUNCTUATIONS.has(chunk)) {
      freq.set(chunk.toLowerCase(), (freq.get(chunk.toLowerCase()) || 0) + 1);
    }
  }

  return freq;
};

export const buildInitialVocabulary = (
  freq: Map<string, number>,
): Set<string> => {
  const vocab = new Set<string>();
  vocab.add("[UNK]");
  for (const key of Array.from(freq.keys())) {
    const chunks = key.split("");
    const firstChar = chunks[0];
    if (firstChar === undefined) continue;
    if (!vocab.has(firstChar)) {
      vocab.add(firstChar);
    }
    for (let i = 1; i < chunks.length; i++) {
      const chunk = chunks[i];
      if (chunk === undefined) continue;
      const element = `##${chunk}`;
      if (!vocab.has(element)) {
        vocab.add(element);
      }
    }
  }
  return vocab;
};

export const collectCandidateSubwords = (
  freq: Map<string, number>,
  vocab: Set<string>,
): Map<string, number> => {
  const subWords = new Map<string, number>();
  for (const [key, value] of Array.from(freq.entries())) {
    const keyFreq = value;

    for (let start = 0; start < key.length; start++) {
      for (let end = start + 1; end < key.length + 1; end++) {
        if (start === 0) {
          const candidate = key.slice(start, end);
          if (!vocab.has(candidate)) {
            subWords.set(candidate, (subWords.get(candidate) ?? 0) + keyFreq);
          }
        } else {
          const candidate = `##${key.slice(start, end)}`;
          if (!vocab.has(candidate)) {
            subWords.set(candidate, (subWords.get(candidate) ?? 0) + keyFreq);
          }
        }
      }
    }
  }
  return subWords;
};

const normalizedLength = (str: string): number => {
  return str.replace(/^##/, "").length;
};

export const getBestCandidate = (
  candidates: Map<string, number>,
): string | null => {
  let bestScore = -1;
  let bestCandidate = null;

  for (const [key, value] of Array.from(candidates.entries())) {
    if (value > bestScore) {
      bestScore = value;
      bestCandidate = key;
    } else if (value === bestScore) {
      if (bestCandidate === null) break;
      if (normalizedLength(key) > normalizedLength(bestCandidate)) {
        bestCandidate = key;
      } else if (normalizedLength(key) === normalizedLength(bestCandidate)) {
        if (key < bestCandidate) {
          bestCandidate = key;
        }
      }
    }
  }
  return bestCandidate;
};

export const trainVocabulary = (
  freq: Map<string, number>,
  targetVocabSize: number,
): Set<string> => {
  const vocab = buildInitialVocabulary(freq);

  while (vocab.size < targetVocabSize) {
    const candidates = collectCandidateSubwords(freq, vocab);

    const bestCandidate = getBestCandidate(candidates);
    if (bestCandidate === null) break;

    vocab.add(bestCandidate);
  }
  return vocab;
};

export const buildModelFromVocabulary = (
  vocab: Set<string>,
): WordPieceModel => {
  let tokens = Array.from(vocab).filter((token) => token !== "[UNK]");
  tokens.sort((a: string, b: string) => a.localeCompare(b));
  tokens = ["[UNK]", ...tokens];

  const idToToken = tokens;
  const tokenToId = new Map<string, number>();
  for (let index = 0; index < tokens.length; index++) {
    const token = tokens[index];
    if (token === undefined) break;
    tokenToId.set(token, index);
  }

  const model = {
    idToToken,
    tokenToId,
    unkToken: "[UNK]",
  };

  return model;
};
