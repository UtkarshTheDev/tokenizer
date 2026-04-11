import { describe, expect, it } from "bun:test";
import { DEFAULT_NORMALIZATION_CONFIG } from "@tokenizer/core";
import {
  BaseVocabSize,
  encode as encodeBPE,
  encodeWordPiece,
  sampleWordPieceModel,
  train,
  type WordPieceModel,
} from "@tokenizer/models";
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
    expect(stats.compressionRatio).toBeCloseTo(originalBytes / tokens.length);
    expect(stats.reductionPercent).toBeCloseTo(
      ((originalBytes - tokens.length) / originalBytes) * 100
    );
    expect(stats.uniqueTokenCount).toBe(new Set(tokens).size);
    expect(stats.unknownTokenCount).toBe(0);
    expect(stats.unknownTokenRate).toBe(0);
    expect(stats.encodeTime).toBeGreaterThanOrEqual(0);
    expect(stats.decodeTime).toBeGreaterThanOrEqual(0);
  });

  it("computes WordPiece unknown-token metrics from the model unk token", () => {
    const text = "hello unknown world";
    const tokens = encodeWordPiece(
      text,
      sampleWordPieceModel,
      DEFAULT_NORMALIZATION_CONFIG
    );
    const unkTokenId = sampleWordPieceModel.tokenToId.get(
      sampleWordPieceModel.unkToken
    );
    const unknownTokenCount = tokens.filter(
      (token) => token === unkTokenId
    ).length;

    const stats = getWordPieceMetrics(
      sampleWordPieceModel,
      text,
      DEFAULT_NORMALIZATION_CONFIG
    );

    expect(stats.vocabSize).toBe(sampleWordPieceModel.idToToken.length);
    expect(stats.tokenCount).toBe(tokens.length);
    expect(stats.uniqueTokenCount).toBe(new Set(tokens).size);
    expect(stats.unknownTokenCount).toBe(unknownTokenCount);
    expect(stats.unknownTokenRate).toBeCloseTo(
      unknownTokenCount / tokens.length
    );
  });

  it("returns zero ratios for empty input instead of NaN or Infinity", () => {
    const bpeStats = getBPEMetrics([], "");
    const wordPieceStats = getWordPieceMetrics(sampleWordPieceModel, "");

    expect(bpeStats.tokenCount).toBe(0);
    expect(bpeStats.compressionRatio).toBe(0);
    expect(bpeStats.reductionPercent).toBe(0);
    expect(bpeStats.avgCharsPerToken).toBe(0);

    expect(wordPieceStats.tokenCount).toBe(0);
    expect(wordPieceStats.compressionRatio).toBe(0);
    expect(wordPieceStats.reductionPercent).toBe(0);
    expect(wordPieceStats.avgCharsPerToken).toBe(0);
  });

  it("throws when the WordPiece unk token is missing from the vocabulary map", () => {
    const brokenModel: WordPieceModel = {
      tokenToId: new Map([["hello", 1]]),
      idToToken: ["[UNK]", "hello"],
      unkToken: "[UNK]",
    };

    expect(() => getWordPieceMetrics(brokenModel, "hello")).toThrow(
      'Invalid WordPiece model: unkToken "[UNK]" is missing from tokenToId vocabulary.'
    );
  });
});
