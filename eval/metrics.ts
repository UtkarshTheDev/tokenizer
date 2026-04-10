import { decode, encode, type MergeTable } from "../bpe/tokenizer";
import {
  DEFAULT_NORMALIZATION_CONFIG,
  type NormalizationConfig,
} from "../Normalizer";

export interface TOKENIZERSTATS {
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

export const DEFAULT_TEXT = `Hello, world! Tokenizers should handle repeated words, punctuation, and spacing well.

 I was playing, replaying, and tokenizing text on April 10, 2026 at 10:30 AM.
 Email-like text: test.user+demo@example.com
 URL-like text: https://example.com/tokenizer-demo

 Numbers: 42, 3.14159, 1,000,000
 Mixed case: HELLO hello HeLLo
 Unicode: café, naïve, résumé
 Whitespace:   this    line	has extra spaces.

 Unknown-ish words: xqztr, neurotokenization, hyper-efficient`;

export const getBPEMetrics = (
  mergeTable: MergeTable,
  text: string = DEFAULT_TEXT,
  normalizationConfig: NormalizationConfig = DEFAULT_NORMALIZATION_CONFIG,
): TOKENIZERSTATS => {
  const unknownTokenCount = 0;
  const unknownTokenRate = 0;
  const vocabSize = mergeTable.length;
  const encodeStart = performance.now();
  const tokens = encode(text, mergeTable, normalizationConfig);
  const encodeEnd = performance.now();
  const encodeTime = encodeEnd - encodeStart;
  const decodeStart = performance.now();
  decode(tokens, mergeTable);
  const decodeEnd = performance.now();
  const decodeTime = decodeEnd - decodeStart;
  const tokenCount = tokens.length;
  const bytesCount = Buffer.from(text, "utf-8").length;
  const compressionRatio = bytesCount / tokenCount;
  const reductionPercent = ((bytesCount - tokenCount) / bytesCount) * 100;
  const avgCharsPerToken = text.length / tokenCount;
  const uniqueTokenCount = tokens.filter(
    (item, index) => tokens.indexOf(item) === index,
  ).length;

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
