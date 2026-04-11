import {
  DEFAULT_NORMALIZATION_CONFIG,
  type NormalizationConfig,
} from "@tokenizer/core";
import {
  BaseVocabSize,
  decode as decodeBPE,
  decodeWordPiece,
  encode as encodeBPE,
  encodeWordPiece,
  type MergeTable,
  type WordPieceModel,
} from "@tokenizer/models";
import { DEFAULT_TEXT } from "./default-text";

export interface TokenizerStats {
  avgCharsPerToken: number;
  compressionRatio: number;
  decodeTime: number;
  encodeTime: number;
  originalBytes: number;
  reductionPercent: number;
  tokenCount: number;
  uniqueTokenCount: number;
  unknownTokenCount: number;
  unknownTokenRate: number;
  vocabSize: number;
}

interface DerivedMetrics {
  avgCharsPerToken: number;
  compressionRatio: number;
  reductionPercent: number;
  uniqueTokenCount: number;
}

const computeDerivedMetrics = (
  text: string,
  tokens: number[]
): DerivedMetrics => {
  const tokenCount = tokens.length;
  const originalBytes = Buffer.from(text, "utf-8").length;

  if (tokenCount === 0 || originalBytes === 0) {
    return {
      compressionRatio: 0,
      reductionPercent: 0,
      uniqueTokenCount: 0,
      avgCharsPerToken: 0,
    };
  }

  return {
    compressionRatio: originalBytes / tokenCount,
    reductionPercent: ((originalBytes - tokenCount) / originalBytes) * 100,
    uniqueTokenCount: new Set(tokens).size,
    avgCharsPerToken: text.length / tokenCount,
  };
};

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
  normalizationConfig: NormalizationConfig = DEFAULT_NORMALIZATION_CONFIG
): TokenizerStats => {
  const unknownTokenCount = 0;
  const unknownTokenRate = 0;

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
  const {
    compressionRatio,
    reductionPercent,
    uniqueTokenCount,
    avgCharsPerToken,
  } = computeDerivedMetrics(text, tokens);
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
  normalizationConfig: NormalizationConfig = DEFAULT_NORMALIZATION_CONFIG
): TokenizerStats => {
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
  const {
    compressionRatio,
    reductionPercent,
    uniqueTokenCount,
    avgCharsPerToken,
  } = computeDerivedMetrics(text, tokens);

  // Do not assume `[UNK]` is always ID 0. The model owns that mapping.
  const unkTokenID = model.tokenToId.get(model.unkToken);
  if (unkTokenID === undefined) {
    throw new Error(
      `Invalid WordPiece model: unkToken "${model.unkToken}" is missing from tokenToId vocabulary.`
    );
  }

  if (tokenCount !== 0) {
    for (const token of tokens) {
      if (token === unkTokenID) {
        unknownTokenCount++;
      }
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
