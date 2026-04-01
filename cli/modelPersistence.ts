import { isBpeSerializedModel, writeJsonFile } from "./modelFiles";
import {
  deserializeWordpieceModel,
  serializeWordpieceModel,
} from "../wordpiece/serializer";
import type { WordPieceModel } from "../wordpiece/types";
import { isWordPieceSerializedModel } from "./modelFiles";
import { deserializeBpeModel, serializeBpeModel } from "../bpe/serializer";
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

export const loadBpeModel = (content: unknown): MergeTable => {
  if (!isBpeSerializedModel(content)) {
    throw new Error(
      "Parsed JSON is not a valid Byte Pair Encoding (BPE) model.",
    );
  }

  return deserializeBpeModel(content);
};

export const loadWordPieceModel = (content: unknown): WordPieceModel => {
  if (!isWordPieceSerializedModel(content)) {
    throw new Error("Parsed JSON is not a valid WordPiece model.");
  }

  return deserializeWordpieceModel(content);
};
