import path from "node:path";
import {
  buildModelLocation,
  getModelFilePrompt,
  parseModelType,
  readJsonFile,
} from "../model/model-files";
import {
  loadBpeModel,
  loadWordPieceModel,
  saveBpeModel,
  saveWordPieceModel,
} from "../model/model-persistance";
import { bpeSlot, currentTokenizer, rl, wordPieceSlot } from "../state";

export async function askModelLocation(
  action: "save" | "load"
): Promise<string> {
  const raw = await rl.question(getModelFilePrompt(currentTokenizer, action));
  return buildModelLocation(currentTokenizer, raw);
}

export async function handleSave() {
  try {
    const location = await askModelLocation("save");
    const repoRoot = path.resolve(import.meta.dir, "../../../..");

    if (currentTokenizer === "wordpiece") {
      if (wordPieceSlot.model === null) {
        console.log("❌ Train or load a WordPiece model first.");
        return;
      }
      saveWordPieceModel(
        repoRoot,
        location,
        wordPieceSlot.model,
        wordPieceSlot.normalizationConfig
      );
    } else if (currentTokenizer === "bpe") {
      if (bpeSlot.mergeTable === null) {
        console.log("❌ Train or load a Byte Pair Encoding (BPE) model first.");
        return;
      }
      saveBpeModel(
        repoRoot,
        location,
        bpeSlot.mergeTable,
        bpeSlot.normalizationConfig
      );
    }
    console.log(`Saved ${currentTokenizer} tokenizer model to ${location}`);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to save model.";
    console.log(`❌ ${message}`);
  }
}

export async function handleLoad() {
  try {
    const location = await askModelLocation("load");
    const repoRoot = path.resolve(import.meta.dir, "../../../..");
    const parse = readJsonFile(repoRoot, location);
    if (parse === null) {
      throw new Error("Failed to load or parse the JSON file.");
    }

    const type = parseModelType(parse);
    if (type === undefined) {
      throw new Error("Failed to parse the type of Model from JSON file.");
    }

    if (type === "bpe") {
      const loadedModel = loadBpeModel(parse);
      bpeSlot.normalizationConfig = loadedModel.normalizationConfig;
      bpeSlot.mergeTable = loadedModel.mergeTable;
      bpeSlot.trainingStats = null;
    } else if (type === "wordpiece") {
      const loadedModel = loadWordPieceModel(parse);
      wordPieceSlot.normalizationConfig = loadedModel.normalizationConfig;
      wordPieceSlot.model = loadedModel.model;
      wordPieceSlot.trainingStats = null;
    }

    if (type === currentTokenizer) {
      console.log(`Loaded ${type.toUpperCase()} model from ${location}`);
    } else {
      console.log(
        `Loaded ${type.toUpperCase()} model from ${location}. Active tokenizer is still ${currentTokenizer.toUpperCase()}.`
      );
    }
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load model.";
    console.log(`❌ ${message}`);
  }
}
