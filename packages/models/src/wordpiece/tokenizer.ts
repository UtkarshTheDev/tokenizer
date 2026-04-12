import {
  DEFAULT_NORMALIZATION_CONFIG,
  type NormalizationConfig,
  normalizeText,
} from "@tokenizer/core";
import { PUNCTUATIONS } from "./manual-pre-tokenizer";
import preTokenize from "./pre-tokenizer";
import {
  buildModelFromVocabulary,
  trainVocabulary,
  wordFreq,
} from "./train-helpers";
import type { WordPieceModel } from "./types";

/**
 * WordPiece Tokenizer
 *
 * This file contains the full runtime pipeline:
 * - `encodeWord()` handles one word with greedy longest-match search
 * - `encode()` handles full text and converts pieces to token IDs
 * - `decode()` rebuilds text from token IDs
 * - `train()` connects the training helpers into one top-level function
 *
 * The most important idea in this file is:
 * WordPiece does not replay merge rules like BPE. Instead, it looks at the
 * current word and greedily chooses the longest vocabulary piece that fits.
 */

/**
 * Encode one word into WordPiece token strings.
 *
 * Example:
 *   "playing" -> ["play", "##ing"]
 *
 * This function uses a two-pointer style search:
 * - `start` marks where the current piece begins
 * - `end` shrinks backward until a matching vocabulary piece is found
 *
 * If `start === 0`, the candidate is checked as a normal token.
 * If `start > 0`, the candidate is checked as a continuation token by adding
 * the `##` prefix.
 */
const encodeWord = (word: string, model: WordPieceModel): string[] => {
  let start = 0;
  let end = word.length;
  const words: string[] = [];
  let isMatched = false;

  while (end > start) {
    let candidate: string;

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

/**
 * Encode a full text string into token IDs.
 *
 * Flow:
 * 1. normalize the text
 * 2. pre-tokenize it into chunks like words and punctuation
 * 3. encode each word chunk with WordPiece
 * 4. convert the token strings into numeric IDs
 *
 * The normalization step is shared with training so the WordPiece vocabulary
 * sees the same cleaned text form during both learning and inference.
 */
export const encode = (
  rawText: string,
  model: WordPieceModel,
  normalizationConfig: NormalizationConfig = DEFAULT_NORMALIZATION_CONFIG
): number[] => {
  // WordPiece matching is string-based, so normalization consistency matters a lot.
  const text = normalizeText(rawText, normalizationConfig);
  const chunks = preTokenize(text);
  const tokens: string[] = [];
  const tokensID: number[] = [];
  for (const chunk of chunks) {
    // Known punctuation can go straight through as a single token.
    if (PUNCTUATIONS.has(chunk) && model.tokenToId.has(chunk)) {
      tokens.push(chunk);
    } else if (PUNCTUATIONS.has(chunk)) {
      // Unknown punctuation falls back to the unknown token.
      tokens.push(model.unkToken);
    } else {
      const token = encodeWord(chunk, model);
      tokens.push(...token);
    }
  }

  // Convert token strings into ids. This is the final representation that the
  // rest of the system works with.
  for (const token of tokens) {
    const tokenId = model.tokenToId.get(token);
    if (tokenId === undefined) {
      const unkTokenID = model.tokenToId.get(model.unkToken);
      if (unkTokenID === undefined) {
        break;
      }
      tokensID.push(unkTokenID);
    } else {
      tokensID.push(tokenId);
    }
  }
  return tokensID;
};

/**
 * Decode token IDs back into readable text.
 *
 * The important spacing rules are:
 * - continuation tokens (`##...`) attach to the previous word
 * - punctuation attaches without a leading space
 * - normal tokens start a new word
 */
export const decode = (tokens: number[], model: WordPieceModel): string => {
  const chunks: string[] = [];

  for (const token of tokens) {
    const chunk = model.idToToken[token];
    if (chunk === undefined) {
      chunks.push(model.unkToken);
    } else {
      chunks.push(chunk);
    }
  }

  let string = "";
  for (const chunk of chunks) {
    // Remove the continuation prefix and glue the piece onto the previous word.
    if (chunk.slice(0, 2) === "##") {
      string += chunk.slice(2, chunk.length);
    } else if (PUNCTUATIONS.has(chunk)) {
      // Punctuation is attached directly to the text built so far.
      string += chunk;
    } else if (string.length === 0) {
      // A normal token starts a new word unless it is the first token.
      string = chunk;
    } else {
      string += ` ${chunk}`;
    }
  }
  return string;
};

/**
 * Train a WordPiece model from raw corpus text.
 *
 * This top-level function stays intentionally small. It wires together the
 * training helpers in the same order you would explain them to a beginner:
 * - normalize the corpus
 * - count words
 * - grow a vocabulary
 * - turn that vocabulary into a model
 */
export const train = (
  rawCorpus: string,
  size: number,
  normalizationConfig: NormalizationConfig = DEFAULT_NORMALIZATION_CONFIG
): WordPieceModel => {
  // The same normalization rules should be used for both training and encode().
  const corpus = normalizeText(rawCorpus, normalizationConfig);
  const freq = wordFreq(corpus);

  const vocab = trainVocabulary(freq, size);

  const model = buildModelFromVocabulary(vocab);

  return model;
};
