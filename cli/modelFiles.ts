import * as fs from "node:fs";
import * as path from "node:path";
import type { WordPieceSerializedModel } from "../wordpiece/types";
import type { BpeSerializedModel } from "../bpe/serializer";

export type TokenizerKind = "bpe" | "wordpiece";
export type ModelFileAction = "save" | "load";

const MODELS_DIR = "models";

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === "object" && value !== null;
};

export const buildModelLocation = (
  tokenizer: TokenizerKind | null,
  rawInput: string,
): string => {
  if (tokenizer === null) {
    throw new Error(
      "Enter the file name to load tokenizer. Empty file names are not allowed.",
    );
  }

  let fileName = rawInput.trim();

  if (fileName === "") {
    fileName = `${tokenizer}.json`;
  }

  if (!fileName.endsWith(".json")) {
    fileName = `${fileName}.json`;
  }

  const hasPathTraversal = fileName.includes("..");
  const hasDirectorySeparators =
    fileName.includes("/") || fileName.includes("\\");

  if (hasPathTraversal) {
    throw new Error(
      "Path traversal is not allowed. Please use a simple file name.",
    );
  }

  if (hasDirectorySeparators) {
    throw new Error(
      "Please use only a file name like wordpiece.json, not directories.",
    );
  }

  return path.join(MODELS_DIR, fileName);
};

export const getModelFilePrompt = (
  tokenizer: TokenizerKind,
  action: ModelFileAction,
): string => {
  if (action === "load") {
    return `Enter the filename of tokenizer to ${action} (inside: models/): `;
  }
  return `Enter the filename for ${tokenizer} to ${action} (default: ${tokenizer}.json): `;
};

export const parseJsonFile = (filePath: string): unknown | null => {
  try {
    const fileContents = fs.readFileSync(filePath, "utf8");
    return JSON.parse(fileContents);
  } catch {
    return null;
  }
};

export const writeJsonFile = (
  baseDir: string,
  location: string,
  data: unknown,
): string => {
  const filePath = path.resolve(baseDir, location);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf8");
  return filePath;
};

export const readJsonFile = (
  baseDir: string,
  location: string,
): unknown | null => {
  const filePath = path.resolve(baseDir, location);
  return parseJsonFile(filePath);
};

export const isWordPieceSerializedModel = (
  value: unknown,
): value is WordPieceSerializedModel => {
  if (!isRecord(value)) return false;

  return (
    value["type"] === "wordpiece" &&
    Array.isArray(value["idToToken"]) &&
    value["idToToken"].every((item) => typeof item === "string") &&
    value["continuationPrefix"] === "##" &&
    typeof value["unkToken"] === "string"
  );
};

export const isBpeSerializedModel = (
  value: unknown,
): value is BpeSerializedModel => {
  if (!isRecord(value)) return false;

  return (
    value["type"] === "bpe" &&
    Array.isArray(value["mergeTable"]) &&
    value["mergeTable"].every(
      (item) =>
        Array.isArray(item) &&
        item.length === 2 &&
        item.every((num) => typeof num === "number"),
    ) &&
    value["baseVocabSize"] === 256 &&
    typeof value["version"] === "number"
  );
};

export const parseModelType = (value: unknown): TokenizerKind | undefined => {
  if (!isRecord(value)) return undefined;

  if (value["type"] === "bpe") {
    return "bpe";
  } else if (value["type"] === "wordpiece") {
    return "wordpiece";
  }
  return undefined;
};
