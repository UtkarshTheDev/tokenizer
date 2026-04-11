import type { MergeTable } from "../bpe/tokenizer";
import {
  DEFAULT_NORMALIZATION_CONFIG,
  type NormalizationConfig,
} from "../Normalizer";
import type { WordPieceModel } from "../wordpiece/types";
import {
  getBPEMetrics,
  getWordPieceMetrics,
  type TokenizerStats,
} from "./metrics";

export interface CompareStats {
  bpe: TokenizerStats;
  wordpiece: TokenizerStats;
}

// The comparison layer receives already-trained models.
// It should not train, save, load, or print. That keeps it reusable from the
// CLI today and from a future API layer later.
interface BpeInput {
  mergeTable: MergeTable;
  normalizationConfig?: NormalizationConfig;
}

interface WordpieceInput {
  model: WordPieceModel;
  normalizationConfig?: NormalizationConfig;
}

export const compareTokenizer = (
  text: string,
  bpe: BpeInput,
  wordpiece: WordpieceInput,
): CompareStats => {
  // Each tokenizer can have its own normalization settings. Keeping these
  // separate avoids the bug where loading/evaluating one tokenizer accidentally
  // changes the behavior of the other.
  const bpeNormalizationConfig =
    bpe.normalizationConfig ?? DEFAULT_NORMALIZATION_CONFIG;
  const wordPieceNormalizationConfig =
    wordpiece.normalizationConfig ?? DEFAULT_NORMALIZATION_CONFIG;

  const bpeStats = getBPEMetrics(
    bpe.mergeTable,
    text,
    bpeNormalizationConfig,
  );
  const wordpieceStats = getWordPieceMetrics(
    wordpiece.model,
    text,
    wordPieceNormalizationConfig,
  );

  return { bpe: bpeStats, wordpiece: wordpieceStats };
};
