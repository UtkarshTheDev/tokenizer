import {
  DEFAULT_NORMALIZATION_CONFIG,
  type NormalizationConfig,
} from "../Normalizer";
import { BaseVocabSize, type MergeTable } from "./tokenizer";

// The saved BPE file stores the learned merge table plus a little metadata that
// helps a beginner understand what kind of model the file contains.
export interface BpeSerializedModel {
  type: "bpe";
  description?: string;
  version: number;
  baseVocabSize: number;
  mergeCount?: number;
  normalization?: NormalizationConfig;
  trainedVocabSize?: number;
  mergeTable: MergeTable;
  notes?: string;
}

export const serializeBpeModel = (
  mergeTable: MergeTable,
  normalizationConfig: NormalizationConfig = DEFAULT_NORMALIZATION_CONFIG,
): BpeSerializedModel => {
  const mergeCount = mergeTable.length;

  // In this implementation BPE always starts from raw UTF-8 bytes, so the
  // base vocabulary size is fixed at 256. The merge table is the real learned artifact.
  const bpeJSON: BpeSerializedModel = {
    type: "bpe",
    description: "Byte Pair Encoding Model",
    version: 1,
    baseVocabSize: BaseVocabSize,
    mergeCount: mergeCount,
    trainedVocabSize: BaseVocabSize + mergeCount,
    mergeTable: mergeTable,
    normalization: normalizationConfig,
  };

  return bpeJSON;
};

export const deserializeBpeModel = (
  bpeJSON: BpeSerializedModel,
): { mergeTable: MergeTable; normalizationConfig: NormalizationConfig } => {
  if (bpeJSON.type !== "bpe") {
    throw new Error(`Invalid Model Type: ${bpeJSON.type}`);
  }
  let normalizationConfig = bpeJSON.normalization;
  if (normalizationConfig === undefined) {
    normalizationConfig = DEFAULT_NORMALIZATION_CONFIG;
  }
  // BPE runtime code only needs the merge table. The extra JSON metadata is
  // useful for inspection, but encode/decode replay the learned merges directly.
  return {
    mergeTable: bpeJSON.mergeTable,
    normalizationConfig: normalizationConfig,
  };
};
