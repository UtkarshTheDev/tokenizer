import type { NormalizationConfig } from "@tokenizer/core";
import type { MergeTable, WordPieceModel } from "@tokenizer/models";
import {
  deserializeBpeModel,
  deserializeWordpieceModel,
  serializeBpeModel,
  serializeWordpieceModel,
} from "@tokenizer/models";
import {
  isBpeSerializedModel,
  isWordPieceSerializedModel,
  writeJsonFile,
} from "./model-files";

export const saveWordPieceModel = (
  baseDir: string,
  location: string,
  model: WordPieceModel,
  normalizationConfig: NormalizationConfig
): void => {
  // Runtime models often contain Maps or derived lookups. The serializer turns
  // that in-memory shape into plain JSON data that can be written to disk.
  const content = serializeWordpieceModel(model, normalizationConfig);
  writeJsonFile(baseDir, location, content);
};

export const saveBpeModel = (
  baseDir: string,
  location: string,
  model: MergeTable,
  normalizationConfig: NormalizationConfig
): void => {
  const content = serializeBpeModel(model, normalizationConfig);
  writeJsonFile(baseDir, location, content);
};

export const loadBpeModel = (
  content: unknown
): { mergeTable: MergeTable; normalizationConfig: NormalizationConfig } => {
  // Loading is the reverse direction: validate the raw JSON first, then rebuild
  // the runtime model shape the tokenizer functions actually use.
  if (!isBpeSerializedModel(content)) {
    throw new Error(
      "Parsed JSON is not a valid Byte Pair Encoding (BPE) model."
    );
  }

  return deserializeBpeModel(content);
};

export const loadWordPieceModel = (
  content: unknown
): { model: WordPieceModel; normalizationConfig: NormalizationConfig } => {
  if (!isWordPieceSerializedModel(content)) {
    throw new Error("Parsed JSON is not a valid WordPiece model.");
  }

  return deserializeWordpieceModel(content);
};
