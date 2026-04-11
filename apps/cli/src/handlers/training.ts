import fs from "node:fs";
import path from "node:path";
import {
  BaseVocabSize,
  encodeWordPiece,
  train,
  trainWordPiece,
} from "@tokenizer/models";
import { bpeSlot, currentTokenizer, rl, wordPieceSlot } from "../state";

export async function handleTrain(text: string) {
  const defaultVocabSize = currentTokenizer === "bpe" ? 320 : 64;
  const minVocabSize = currentTokenizer === "bpe" ? 257 : 1;
  const vocabStr = await rl.question(
    `Target vocabulary size (default ${defaultVocabSize}, min ${minVocabSize}): `
  );

  let vocabSize = Number.parseInt(vocabStr, 10);
  if (Number.isNaN(vocabSize)) {
    vocabSize = defaultVocabSize;
  }
  if (vocabSize < minVocabSize) {
    vocabSize = minVocabSize;
  }

  console.log(
    `\nTraining ${currentTokenizer.toUpperCase()} on ${text.length} characters (vocab size: ${vocabSize})...`
  );

  const start = performance.now();
  const originalBytes = Buffer.from(text, "utf-8").length;

  const buildCompressionStats = (finalTokens: number) => {
    if (originalBytes === 0 || finalTokens === 0) {
      return {
        ratio: "0.00",
        spaceSaved: "0.0",
      };
    }

    return {
      ratio: (originalBytes / finalTokens).toFixed(2),
      spaceSaved: (
        ((originalBytes - finalTokens) / originalBytes) *
        100
      ).toFixed(1),
    };
  };

  if (currentTokenizer === "bpe") {
    const { mergeTable, tokens } = train(
      text,
      vocabSize,
      bpeSlot.normalizationConfig
    );
    const timeMs = (performance.now() - start).toFixed(2);
    const finalTokens = tokens.length;
    const finalVocabSize = BaseVocabSize + mergeTable.length;
    const compressionStats = buildCompressionStats(finalTokens);

    bpeSlot.mergeTable = mergeTable;
    bpeSlot.trainingStats = {
      tokenizer: "bpe",
      timeMs,
      learnedUnits: mergeTable.length,
      finalVocabSize,
      originalBytes,
      finalTokens,
      ratio: compressionStats.ratio,
      spaceSaved: compressionStats.spaceSaved,
    };

    console.log(
      `✅ Training complete in ${timeMs} ms. Learned ${mergeTable.length} merges (final vocab: ${finalVocabSize}).`
    );
    return;
  }

  const model = trainWordPiece(
    text,
    vocabSize,
    wordPieceSlot.normalizationConfig
  );
  const encoded = encodeWordPiece(
    text,
    model,
    wordPieceSlot.normalizationConfig
  );
  const timeMs = (performance.now() - start).toFixed(2);
  const finalTokens = encoded.length;
  const finalVocabSize = model.idToToken.length;
  const compressionStats = buildCompressionStats(finalTokens);

  wordPieceSlot.model = model;
  wordPieceSlot.trainingStats = {
    tokenizer: "wordpiece",
    timeMs,
    learnedUnits: finalVocabSize,
    finalVocabSize,
    originalBytes,
    finalTokens,
    ratio: compressionStats.ratio,
    spaceSaved: compressionStats.spaceSaved,
  };

  console.log(
    `✅ Training complete in ${timeMs} ms. Built WordPiece vocab with ${model.idToToken.length} tokens.`
  );
}

export async function handleTrainText() {
  const text = await rl.question("Enter text to train on: ");
  if (!text) {
    console.log("❌ Empty text.");
    return;
  }
  await handleTrain(text);
}

export async function handleTrainFile() {
  const repoRoot = path.resolve(import.meta.dir, "../../../..");
  const dataPath = path.resolve(repoRoot, "examples", "data", "corpus.txt");

  if (!fs.existsSync(dataPath)) {
    console.log(`❌ Could not find file: ${dataPath}`);
    return;
  }
  const text = fs.readFileSync(dataPath, "utf-8");
  await handleTrain(text);
}
