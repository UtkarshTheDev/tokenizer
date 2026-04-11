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

  const vocabSize = BaseVocabSize + mergeTable.length;

  const encodeStart = performance.now();
  const tokens = encodeBPE(text, mergeTable, normalizationConfig);
  const encodeEnd = performance.now();
  const encodeTime = encodeEnd - encodeStart;

  const decodeStart = performance.now();
  decodeBPE(tokens, mergeTable);
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
