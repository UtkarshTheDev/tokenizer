import {
  BaseVocabSize,
  decode as decodeBPE,
  encode as encodeBPE,
  type MergeTable,
} from "../bpe/tokenizer";
import {
  DEFAULT_NORMALIZATION_CONFIG,
  type NormalizationConfig,
} from "../Normalizer";
import type { WordPieceModel } from "../wordpiece/types";
import {
  encode as encodeWordPiece,
  decode as decodeWordPiece,
} from "../wordpiece/tokenizer";
import { DEFAULT_TEXT } from "./defaultText";

export interface TokenizerStats {
  vocabSize: number;
  originalBytes: number;
  tokenCount: number;
  encodeTime: number;
  decodeTime: number;
  compressionRatio: number;
  reductionPercent: number;
  unknownTokenCount: number;
  unknownTokenRate: number;
  uniqueTokenCount: number;
  avgCharsPerToken: number;
}

/**
 * Measure how a trained BPE model behaves on one piece of text.
 *
 * This function intentionally does not compare BPE with any other tokenizer.
 * It only answers: "given this BPE merge table and this text, what happened?"
 * `compare.ts` is responsible for putting multiple tokenizer results side by side.
 */
export const getBPEMetrics = (
  mergeTable: MergeTable,
  text: string = DEFAULT_TEXT,
  normalizationConfig: NormalizationConfig = DEFAULT_NORMALIZATION_CONFIG,
): TokenizerStats => {
  const unknownTokenCount = 0;
  const unknownTokenRate = 0;

  let compressionRatio = 0;
  let reductionPercent = 0;
  let avgCharsPerToken = 0;
  let uniqueTokenCount = 0;

  // BPE starts with 256 byte tokens, then adds one vocabulary entry per merge.
  const vocabSize = BaseVocabSize + mergeTable.length;

  // Time encode and decode separately because tokenizers can be asymmetric:
  // encoding may do search/merge work, while decoding may mostly reverse IDs.
  const encodeStart = performance.now();
  const tokens = encodeBPE(text, mergeTable, normalizationConfig);
  const encodeEnd = performance.now();
  const encodeTime = encodeEnd - encodeStart;

  const decodeStart = performance.now();
  decodeBPE(tokens, mergeTable);
  const decodeEnd = performance.now();
  const decodeTime = decodeEnd - decodeStart;

  const tokenCount = tokens.length;
  // Use UTF-8 bytes instead of string length for compression-style metrics.
  // JavaScript string length counts UTF-16 code units, which can be misleading
  // for Unicode text.
  const bytesCount = Buffer.from(text, "utf-8").length;

  if (tokenCount !== 0 && bytesCount !== 0) {
    // In this project, "compression ratio" means bytes represented per token.
    // Higher usually means the tokenizer produced fewer tokens for the input.
    compressionRatio = bytesCount / tokenCount;
    reductionPercent = ((bytesCount - tokenCount) / bytesCount) * 100;
    avgCharsPerToken = text.length / tokenCount;

    // Unique token count shows how many distinct token IDs were used.
    // It is tokenizer-agnostic, so the same logic works for BPE and WordPiece.
    const tokenSet = new Set(tokens);
    uniqueTokenCount = tokenSet.size;
  }
  const stats = {
    vocabSize,
    originalBytes: bytesCount,
    encodeTime,
    decodeTime,
    tokenCount,
    compressionRatio,
    reductionPercent,
    unknownTokenCount,
    unknownTokenRate,
    uniqueTokenCount,
    avgCharsPerToken,
  };
  return stats;
};

/**
 * Measure how a trained WordPiece model behaves on one piece of text.
 *
 * WordPiece has an extra quality signal: `[UNK]`. A high unknown-token rate
 * usually means the vocabulary cannot represent the input well.
 */
export const getWordPieceMetrics = (
  model: WordPieceModel,
  text: string = DEFAULT_TEXT,
  normalizationConfig: NormalizationConfig = DEFAULT_NORMALIZATION_CONFIG,
): TokenizerStats => {
  let compressionRatio = 0;
  let reductionPercent = 0;
  let avgCharsPerToken = 0;
  let uniqueTokenCount = 0;
  let unknownTokenRate = 0;
  let unknownTokenCount = 0;

  const vocabSize = model.idToToken.length;

  const encodeStart = performance.now();
  const tokens = encodeWordPiece(text, model, normalizationConfig);
  const encodeEnd = performance.now();
  const encodeTime = encodeEnd - encodeStart;

  const decodeStart = performance.now();
  decodeWordPiece(tokens, model);
  const decodeEnd = performance.now();
  const decodeTime = decodeEnd - decodeStart;

  const tokenCount = tokens.length;
  const bytesCount = Buffer.from(text, "utf-8").length;

  if (tokenCount !== 0 && bytesCount !== 0) {
    compressionRatio = bytesCount / tokenCount;
    reductionPercent = ((bytesCount - tokenCount) / bytesCount) * 100;
    avgCharsPerToken = text.length / tokenCount;

    const tokenSet = new Set(tokens);
    uniqueTokenCount = tokenSet.size;
    // Do not assume `[UNK]` is always ID 0. The model owns that mapping.
    const unkTokenID = model.tokenToId.get(model.unkToken);
    unknownTokenCount = 0;
    for (const token of tokens) {
      if (token === unkTokenID) unknownTokenCount++;
    }
    unknownTokenRate = unknownTokenCount / tokenCount;
  }

  const stats = {
    vocabSize,
    originalBytes: bytesCount,
    encodeTime,
    decodeTime,
    tokenCount,
    compressionRatio,
    reductionPercent,
    unknownTokenCount,
    unknownTokenRate,
    uniqueTokenCount,
    avgCharsPerToken,
  };
  return stats;
};
