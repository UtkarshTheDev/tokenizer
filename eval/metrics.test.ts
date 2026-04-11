import { describe, expect, it } from "bun:test";
import { DEFAULT_NORMALIZATION_CONFIG } from "../Normalizer";
import { BaseVocabSize, encode as encodeBPE, train } from "../bpe/tokenizer";
import { encode as encodeWordPiece } from "../wordpiece/tokenizer";
import { model } from "../wordpiece/types";
import { getBPEMetrics, getWordPieceMetrics } from "./metrics";

describe("evaluation metrics", () => {
  it("computes BPE metrics from encoded token output", () => {
    const text = "banana bandana";
    const { mergeTable } = train(text, 270, DEFAULT_NORMALIZATION_CONFIG);
    const tokens = encodeBPE(text, mergeTable, DEFAULT_NORMALIZATION_CONFIG);
    const originalBytes = Buffer.from(text, "utf-8").length;

    const stats = getBPEMetrics(mergeTable, text, DEFAULT_NORMALIZATION_CONFIG);

    expect(stats.vocabSize).toBe(BaseVocabSize + mergeTable.length);
    expect(stats.originalBytes).toBe(originalBytes);
    expect(stats.tokenCount).toBe(tokens.length);
    expect(stats.compressionRatio).toBeCloseTo(
      originalBytes / tokens.length,
    );
    expect(stats.reductionPercent).toBeCloseTo(
      ((originalBytes - tokens.length) / originalBytes) * 100,
    );
    expect(stats.uniqueTokenCount).toBe(new Set(tokens).size);
    expect(stats.unknownTokenCount).toBe(0);
    expect(stats.unknownTokenRate).toBe(0);
    expect(stats.encodeTime).toBeGreaterThanOrEqual(0);
    expect(stats.decodeTime).toBeGreaterThanOrEqual(0);
  });

  it("computes WordPiece unknown-token metrics from the model unk token", () => {
    const text = "hello unknown world";
    const tokens = encodeWordPiece(text, model, DEFAULT_NORMALIZATION_CONFIG);
    const unkTokenId = model.tokenToId.get(model.unkToken);
    const unknownTokenCount = tokens.filter((token) => token === unkTokenId).length;

    const stats = getWordPieceMetrics(
      model,
      text,
      DEFAULT_NORMALIZATION_CONFIG,
    );

    expect(stats.vocabSize).toBe(model.idToToken.length);
    expect(stats.tokenCount).toBe(tokens.length);
    expect(stats.uniqueTokenCount).toBe(new Set(tokens).size);
    expect(stats.unknownTokenCount).toBe(unknownTokenCount);
    expect(stats.unknownTokenRate).toBeCloseTo(
      unknownTokenCount / tokens.length,
    );
  });

  it("returns zero ratios for empty input instead of NaN or Infinity", () => {
    const bpeStats = getBPEMetrics([], "");
    const wordPieceStats = getWordPieceMetrics(model, "");

    expect(bpeStats.tokenCount).toBe(0);
    expect(bpeStats.compressionRatio).toBe(0);
    expect(bpeStats.reductionPercent).toBe(0);
    expect(bpeStats.avgCharsPerToken).toBe(0);

    expect(wordPieceStats.tokenCount).toBe(0);
    expect(wordPieceStats.compressionRatio).toBe(0);
    expect(wordPieceStats.reductionPercent).toBe(0);
    expect(wordPieceStats.avgCharsPerToken).toBe(0);
  });
});
