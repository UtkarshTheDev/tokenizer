import { BaseVocabSize, type MergeTable } from "./tokenizer";

export interface BpeSerializedModel {
  type: "bpe";
  description?: string;
  version: number;
  baseVocabSize: number;
  mergeCount?: number;
  trainedVocabSize?: number;
  mergeTable: MergeTable;
  notes?: string;
}

export const serializeBpeModel = (
  mergeTable: MergeTable,
): BpeSerializedModel => {
  const mergeCount = mergeTable.length;
  const bpeJSON: BpeSerializedModel = {
    type: "bpe",
    description: "Byte Pair Encoding Model",
    version: 1,
    baseVocabSize: BaseVocabSize,
    mergeCount: mergeCount,
    trainedVocabSize: BaseVocabSize + mergeCount,
    mergeTable: mergeTable,
  };

  return bpeJSON;
};

export const deserializeBpeModel = (
  bpeJSON: BpeSerializedModel,
): MergeTable => {
  if (bpeJSON.type !== "bpe") {
    throw new Error(`Invalid Model Type: ${bpeJSON.type}`);
  }

  return bpeJSON.mergeTable;
};
