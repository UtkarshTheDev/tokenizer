import { describe, expect, it } from "bun:test";
import { DEFAULT_NORMALIZATION_CONFIG } from "@tokenizer/core";
import { sampleWordPieceModel, train } from "@tokenizer/models";
import { compareTokenizer } from "./compare";
import {
  getBPEMetrics,
  getWordPieceMetrics,
  type TokenizerStats,
} from "./metrics";

const stableStats = (stats: TokenizerStats) => ({
  vocabSize: stats.vocabSize,
  originalBytes: stats.originalBytes,
  tokenCount: stats.tokenCount,
  compressionRatio: stats.compressionRatio,
  reductionPercent: stats.reductionPercent,
  unknownTokenCount: stats.unknownTokenCount,
  unknownTokenRate: stats.unknownTokenRate,
  uniqueTokenCount: stats.uniqueTokenCount,
  avgCharsPerToken: stats.avgCharsPerToken,
});

describe("compareTokenizer", () => {
  it("returns BPE and WordPiece stats for the same input text", () => {
    const text = "Hello tokenizers!";
    const bpeConfig = {
      ...DEFAULT_NORMALIZATION_CONFIG,
      lowercase: true,
    };
    const wordPieceConfig = {
      ...DEFAULT_NORMALIZATION_CONFIG,
      lowercase: false,
    };
    const { mergeTable } = train(text, 270, bpeConfig);

    const comparison = compareTokenizer(
      text,
      { mergeTable, normalizationConfig: bpeConfig },
      { model: sampleWordPieceModel, normalizationConfig: wordPieceConfig }
    );

    expect(stableStats(comparison.bpe)).toEqual(
      stableStats(getBPEMetrics(mergeTable, text, bpeConfig))
    );
    expect(stableStats(comparison.wordpiece)).toEqual(
      stableStats(
        getWordPieceMetrics(sampleWordPieceModel, text, wordPieceConfig)
      )
    );
  });

  it("uses default normalization without mutating input objects", () => {
    const text = "hello world";
    const { mergeTable } = train(text, 270);
    const bpeInput = { mergeTable };
    const wordPieceInput = { model: sampleWordPieceModel };

    const defaultComparison = compareTokenizer(text, bpeInput, wordPieceInput);
    const explicitDefaultComparison = compareTokenizer(
      text,
      { mergeTable, normalizationConfig: DEFAULT_NORMALIZATION_CONFIG },
      {
        model: sampleWordPieceModel,
        normalizationConfig: DEFAULT_NORMALIZATION_CONFIG,
      }
    );

    expect("normalizationConfig" in bpeInput).toBe(false);
    expect("normalizationConfig" in wordPieceInput).toBe(false);
    expect(stableStats(defaultComparison.bpe)).toEqual(
      stableStats(explicitDefaultComparison.bpe)
    );
    expect(stableStats(defaultComparison.wordpiece)).toEqual(
      stableStats(explicitDefaultComparison.wordpiece)
    );
  });
});
