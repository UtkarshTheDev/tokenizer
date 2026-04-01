import { readJsonFile, writeJsonFile } from "./modelFiles";
import {
  deserializeWordpieceModel,
  serializeWordpieceModel,
} from "../wordpiece/serializer";
import type { WordPieceModel } from "../wordpiece/types";
import { isWordPieceSerializedModel } from "./modelFiles";
import { serializeBpeModel } from "../bpe/serializer";
import type { MergeTable } from "../bpe/tokenizer";

export const saveWordPieceModel = (
  baseDir: string,
  location: string,
  model: WordPieceModel,
): void => {
  const content = serializeWordpieceModel(model);
  writeJsonFile(baseDir, location, content);
};

export const saveBpeModel = (
  baseDir: string,
  location: string,
  model: MergeTable,
): void => {
  const content = serializeBpeModel(model);
  writeJsonFile(baseDir, location, content);
};

export const loadWordPieceModel = (
  baseDir: string,
  location: string,
): WordPieceModel => {
  const parsed = readJsonFile(baseDir, location);

  if (parsed === null) {
    throw new Error("Failed to load or parse the JSON file.");
  }

  if (!isWordPieceSerializedModel(parsed)) {
    throw new Error("Parsed JSON is not a valid WordPiece model.");
  }

  return deserializeWordpieceModel(parsed);
};
