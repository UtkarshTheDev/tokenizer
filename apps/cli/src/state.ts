import { stdin as input, stdout as output } from "node:process";
import readline from "node:readline/promises";
import {
  DEFAULT_NORMALIZATION_CONFIG,
  type NormalizationConfig,
} from "@tokenizer/core";
import type { MergeTable } from "@tokenizer/models/bpe";
import type { WordPieceModel } from "@tokenizer/models/wordpiece/types";

// Type definitions moved from index.ts
export type TokenizerKind = "bpe" | "wordpiece";

export interface TrainingStats {
  finalTokens: number;
  finalVocabSize: number;
  learnedUnits: number;
  originalBytes: number;
  ratio: string;
  spaceSaved: string;
  timeMs: string;
  tokenizer: TokenizerKind;
}

export interface BpeSlot {
  mergeTable: MergeTable | null;
  normalizationConfig: NormalizationConfig;
  trainingStats: TrainingStats | null;
}

export interface WordPieceSlot {
  model: WordPieceModel | null;
  normalizationConfig: NormalizationConfig;
  trainingStats: TrainingStats | null;
}

// Global state instances
export const rl = readline.createInterface({ input, output });

export const bpeSlot: BpeSlot = {
  mergeTable: null,
  normalizationConfig: { ...DEFAULT_NORMALIZATION_CONFIG },
  trainingStats: null,
};

export const wordPieceSlot: WordPieceSlot = {
  model: null,
  normalizationConfig: { ...DEFAULT_NORMALIZATION_CONFIG },
  trainingStats: null,
};

export let currentTokenizer: TokenizerKind = "bpe";

export function setCurrentTokenizer(kind: TokenizerKind) {
  currentTokenizer = kind;
}
