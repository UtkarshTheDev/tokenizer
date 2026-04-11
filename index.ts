import * as readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import * as fs from "node:fs";
import * as path from "node:path";
import {
  buildModelLocation,
  getModelFilePrompt,
  parseModelType,
  readJsonFile,
  type ModelFileAction,
  type TokenizerKind,
} from "./cli/modelFiles";
import {
  loadBpeModel,
  loadWordPieceModel,
  saveBpeModel,
  saveWordPieceModel,
} from "./cli/modelPersistence";
import {
  train,
  encode,
  decode,
  type MergeTable,
  BaseVocabSize,
} from "./bpe/tokenizer";
import {
  train as trainWordPiece,
  encode as encodeWordPiece,
  decode as decodeWordPiece,
} from "./wordpiece/tokenizer";
import type { WordPieceModel } from "./wordpiece/types";
import {
  DEFAULT_NORMALIZATION_CONFIG,
  type NormalizationConfig,
} from "./Normalizer";
import { compareTokenizer } from "./eval/compare";
import { DEFAULT_TEXT } from "./eval/defaultText";
import type { TokenizerStats } from "./eval/metrics";

// Readline interface for interactive CLI
const rl = readline.createInterface({ input, output });

type TrainingStats = {
  tokenizer: TokenizerKind;
  timeMs: string;
  learnedUnits: number;
  finalVocabSize: number;
  originalBytes: number;
  finalTokens: number;
  ratio: string;
  spaceSaved: string;
};

// The CLI keeps one "slot" for each tokenizer type.
// This lets a learner load or train BPE and WordPiece models in the same session
// without throwing the other one away. `currentTokenizer` only tells us which
// slot encode/decode/train commands should use right now.
type BpeSlot = {
  mergeTable: MergeTable | null;
  normalizationConfig: NormalizationConfig;
  trainingStats: TrainingStats | null;
};

type WordPieceSlot = {
  model: WordPieceModel | null;
  normalizationConfig: NormalizationConfig;
  trainingStats: TrainingStats | null;
};

const bpeSlot: BpeSlot = {
  mergeTable: null,
  normalizationConfig: DEFAULT_NORMALIZATION_CONFIG,
  trainingStats: null,
};

const wordPieceSlot: WordPieceSlot = {
  model: null,
  normalizationConfig: DEFAULT_NORMALIZATION_CONFIG,
  trainingStats: null,
};

let currentTokenizer: TokenizerKind = "bpe";

const getAction = (input: string) => {
  const command = input.trim().toLowerCase();

  switch (command) {
    case "1":
    case "select":
    case "tokenizer":
      return "select";
    case "2":
    case "train":
      return "train_text";
    case "3":
    case "file":
    case "data":
    case "trainfile":
      return "train_file";
    case "4":
    case "encode":
      return "encode";
    case "5":
    case "decode":
      return "decode";
    case "6":
    case "save":
      return "save_tokenizer";
    case "7":
    case "load":
      return "load_tokenizer";
    case "8":
    case "stats":
      return "stats";
    case "9":
    case "compare":
    case "eval":
    case "evaluate":
      return "compare";
    case "clear":
      return "clear";
    case "exit":
    case "quit":
      return "exit";
    case "bpe":
      return "switch_bpe";
    case "wordpiece":
    case "wp":
      return "switch_wordpiece";
    default:
      return null;
  }
};

const printMenu = () => {
  console.log(
    `\n🔤 Tokenizer CLI (Current: ${currentTokenizer.toUpperCase()})`,
  );
  console.log(`================================`);
  console.log(
    `Loaded models -> BPE: ${bpeSlot.mergeTable === null ? "empty" : "ready"}, WordPiece: ${wordPieceSlot.model === null ? "empty" : "ready"}`,
  );
  console.log(`1. Select tokenizer (BPE / WordPiece)`);
  console.log(`2. Train on text (type directly)`);
  console.log(`3. Train on file (data/data.txt)`);
  console.log(`4. Encode text`);
  console.log(`5. Decode tokens`);
  console.log(`6. Save Tokenizer `);
  console.log(`7. Load Tokenizer `);
  console.log(`8. Show training stats`);
  console.log(`9. Compare BPE vs WordPiece`);
  console.log(`clear -> clear screen`);
  console.log(`exit -> exit\n`);
  console.log(
    `Commands: bpe, wordpiece, train, data, encode, decode, stats, save, load, compare, clear, exit\n`,
  );
};

const askModelLocation = async (action: ModelFileAction): Promise<string> => {
  const raw = await rl.question(getModelFilePrompt(currentTokenizer, action));
  return buildModelLocation(currentTokenizer, raw);
};

const handleTrain = async (text: string) => {
  const defaultVocabSize = currentTokenizer === "bpe" ? 320 : 64;
  const minVocabSize = currentTokenizer === "bpe" ? 257 : 1;
  const vocabStr = await rl.question(
    `Target vocabulary size (default ${defaultVocabSize}, min ${minVocabSize}): `,
  );

  let vocabSize = parseInt(vocabStr, 10);
  if (Number.isNaN(vocabSize)) vocabSize = defaultVocabSize;
  if (vocabSize < minVocabSize) vocabSize = minVocabSize;

  console.log(
    `\nTraining ${currentTokenizer.toUpperCase()} on ${text.length} characters (vocab size: ${vocabSize})...`,
  );

  const start = performance.now();
  const originalBytes = Buffer.from(text, "utf-8").length;

  if (currentTokenizer === "bpe") {
    const { mergeTable, tokens } = train(
      text,
      vocabSize,
      bpeSlot.normalizationConfig,
    );
    const timeMs = (performance.now() - start).toFixed(2);
    const finalTokens = tokens.length;
    const finalVocabSize = BaseVocabSize + mergeTable.length;

    bpeSlot.mergeTable = mergeTable;
    bpeSlot.trainingStats = {
      tokenizer: "bpe",
      timeMs,
      learnedUnits: mergeTable.length,
      finalVocabSize,
      originalBytes,
      finalTokens,
      ratio: (originalBytes / finalTokens).toFixed(2),
      spaceSaved: (
        ((originalBytes - finalTokens) / originalBytes) *
        100
      ).toFixed(1),
    };

    console.log(
      `✅ Training complete in ${timeMs} ms. Learned ${mergeTable.length} merges (final vocab: ${finalVocabSize}).`,
    );
    return;
  }

  const model = trainWordPiece(
    text,
    vocabSize,
    wordPieceSlot.normalizationConfig,
  );
  const encoded = encodeWordPiece(
    text,
    model,
    wordPieceSlot.normalizationConfig,
  );
  const timeMs = (performance.now() - start).toFixed(2);
  const finalTokens = encoded.length;
  const finalVocabSize = model.idToToken.length;

  wordPieceSlot.model = model;
  wordPieceSlot.trainingStats = {
    tokenizer: "wordpiece",
    timeMs,
    learnedUnits: finalVocabSize,
    finalVocabSize,
    originalBytes,
    finalTokens,
    ratio: (originalBytes / finalTokens).toFixed(2),
    spaceSaved: (((originalBytes - finalTokens) / originalBytes) * 100).toFixed(
      1,
    ),
  };

  console.log(
    `✅ Training complete in ${timeMs} ms. Built WordPiece vocab with ${model.idToToken.length} tokens.`,
  );
};

const formatNumber = (value: number, decimals = 2): string =>
  value.toFixed(decimals);

const printMetricRow = (
  label: string,
  bpeValue: string | number,
  wordPieceValue: string | number,
) => {
  // Keep table formatting local to the CLI. The eval module returns data only;
  // this function decides how that data should look in a terminal.
  console.log(
    `  ${label.padEnd(22)} ${String(bpeValue).padStart(14)} ${String(wordPieceValue).padStart(14)}`,
  );
};

const printComparisonReport = (
  text: string,
  bpeStats: TokenizerStats,
  wordPieceStats: TokenizerStats,
) => {
  // This report is intentionally compact: enough numbers to compare behavior,
  // but not so much output that a beginner cannot tell what matters.
  console.log("\n╔══════════════════════════════════════════════════════╗");
  console.log("║              TOKENIZER COMPARISON REPORT             ║");
  console.log("╚══════════════════════════════════════════════════════╝\n");

  console.log("── Input ──────────────────────────────────────────────");
  console.log(`  Characters            : ${text.length}`);
  console.log(`  UTF-8 bytes           : ${Buffer.from(text, "utf-8").length}`);

  console.log("\n── Results ────────────────────────────────────────────");
  console.log(
    `  ${"Metric".padEnd(22)} ${"BPE".padStart(14)} ${"WordPiece".padStart(14)}`,
  );
  console.log(`  ${"-".repeat(22)} ${"-".repeat(14)} ${"-".repeat(14)}`);
  printMetricRow("Vocab size", bpeStats.vocabSize, wordPieceStats.vocabSize);
  printMetricRow("Token count", bpeStats.tokenCount, wordPieceStats.tokenCount);
  printMetricRow(
    "Unique tokens",
    bpeStats.uniqueTokenCount,
    wordPieceStats.uniqueTokenCount,
  );
  printMetricRow(
    "Compression",
    `${formatNumber(bpeStats.compressionRatio)}x`,
    `${formatNumber(wordPieceStats.compressionRatio)}x`,
  );
  printMetricRow(
    "Reduction",
    `${formatNumber(bpeStats.reductionPercent)}%`,
    `${formatNumber(wordPieceStats.reductionPercent)}%`,
  );
  printMetricRow(
    "Avg chars/token",
    formatNumber(bpeStats.avgCharsPerToken),
    formatNumber(wordPieceStats.avgCharsPerToken),
  );
  printMetricRow(
    "Encode time",
    `${formatNumber(bpeStats.encodeTime, 3)}ms`,
    `${formatNumber(wordPieceStats.encodeTime, 3)}ms`,
  );
  printMetricRow(
    "Decode time",
    `${formatNumber(bpeStats.decodeTime, 3)}ms`,
    `${formatNumber(wordPieceStats.decodeTime, 3)}ms`,
  );
  printMetricRow(
    "Unknown tokens",
    bpeStats.unknownTokenCount,
    wordPieceStats.unknownTokenCount,
  );
  printMetricRow(
    "Unknown rate",
    `${formatNumber(bpeStats.unknownTokenRate * 100)}%`,
    `${formatNumber(wordPieceStats.unknownTokenRate * 100)}%`,
  );

  console.log(
    "\nNote: compression is measured as original UTF-8 bytes per produced token.",
  );
};

const printTrainingStats = (stats: TrainingStats) => {
  console.log("\n╔══════════════════════════════════════════╗");
  console.log(
    `║   ${stats.tokenizer.toUpperCase().padEnd(11)} TOKENIZER — SUMMARY   ║`,
  );
  console.log("╚══════════════════════════════════════════╝\n");

  console.log("── Training ────────────────────────────────");
  console.log(`  Training time       : ${stats.timeMs} ms`);
  if (stats.tokenizer === "bpe") {
    console.log(`  Learned merges      : ${stats.learnedUnits}`);
    console.log(`  Final vocab size    : ${stats.finalVocabSize}`);
  } else {
    console.log(`  Trained vocab size  : ${stats.learnedUnits}`);
  }

  console.log("\n── Compression ─────────────────────────────");
  console.log(`  Original tokens     : ${stats.originalBytes} (raw bytes)`);
  console.log(
    `  After ${stats.tokenizer.toUpperCase()}    : ${stats.finalTokens} tokens`,
  );
  console.log(`  Compression ratio   : ${stats.ratio}x`);
  console.log(`  Space saved         : ${stats.spaceSaved}%`);
};

const getNormalizationConfigDifferences = (
  bpeConfig: NormalizationConfig,
  wordPieceConfig: NormalizationConfig,
): string[] => {
  const fields: Array<keyof NormalizationConfig> = [
    "unicodeForm",
    "stripAccents",
    "lowercase",
    "collapseWhitespace",
    "trimWhitespace",
  ];

  return fields
    .filter((field) => bpeConfig[field] !== wordPieceConfig[field])
    .map(
      (field) =>
        `${field}: BPE=${String(bpeConfig[field])}, WordPiece=${String(wordPieceConfig[field])}`,
    );
};

const warnIfNormalizationConfigsDiffer = () => {
  const differences = getNormalizationConfigDifferences(
    bpeSlot.normalizationConfig,
    wordPieceSlot.normalizationConfig,
  );

  if (differences.length === 0) return;

  console.log("\n⚠️  Normalization configs differ between tokenizers.");
  console.log(
    `   Token counts, compression, and WordPiece ${wordPieceSlot.model?.unkToken ?? "[UNK]"} rate may be affected by preprocessing differences.`,
  );
  for (const difference of differences) {
    console.log(`   - ${difference}`);
  }
};

/**
 * Runs the interactive CLI loop for training, encoding, decoding, saving, loading, and viewing stats for BPE and WordPiece tokenizers.
 *
 * This function presents the menu, prompts for user commands, executes the selected actions (switching tokenizers, training from text or file, encoding/decoding, saving/loading models, showing stats, clearing, and exiting), and continues until the user chooses to exit. It updates the module-level tokenizer state and prints results and error messages to the console.
 */
async function main() {
  while (true) {
    printMenu();
    const choice = await rl.question("Select an option or command: ");
    const action = getAction(choice);

    switch (action) {
      case "switch_bpe": {
        currentTokenizer = "bpe";
        console.log("Switched to BPE.");
        break;
      }
      case "switch_wordpiece": {
        currentTokenizer = "wordpiece";
        console.log("Switched to WordPiece.");
        break;
      }
      case "select": {
        const tokenizerChoice = await rl.question(
          "Choose tokenizer (`1`/`bpe` or `2`/`wordpiece`): ",
        );
        const tokenizerCommand = tokenizerChoice.trim().toLowerCase();
        if (tokenizerCommand === "1" || tokenizerCommand === "bpe") {
          currentTokenizer = "bpe";
          console.log("Switched to BPE.");
        } else if (
          tokenizerCommand === "2" ||
          tokenizerCommand === "wordpiece" ||
          tokenizerCommand === "wp"
        ) {
          currentTokenizer = "wordpiece";
          console.log("Switched to WordPiece.");
        } else {
          console.log("❌ Invalid tokenizer option.");
        }
        break;
      }
      case "train_text": {
        const text = await rl.question("Enter text to train on: ");
        if (!text) {
          console.log("❌ Empty text.");
          break;
        }
        await handleTrain(text);
        break;
      }
      case "train_file": {
        const dataPath = path.resolve(__dirname, "data", "data.txt");
        if (!fs.existsSync(dataPath)) {
          console.log(`❌ Could not find file: ${dataPath}`);
          break;
        }
        const text = fs.readFileSync(dataPath, "utf-8");
        await handleTrain(text);
        break;
      }
      case "encode": {
        if (currentTokenizer === "bpe" && !bpeSlot.mergeTable) {
          console.log("❌ You must train the tokenizer first! (Option 2 or 3)");
          break;
        }
        if (currentTokenizer === "wordpiece" && !wordPieceSlot.model) {
          console.log("❌ You must train the tokenizer first! (Option 2 or 3)");
          break;
        }
        const text = await rl.question("Enter text to encode: ");

        const start = performance.now();
        const tokens =
          currentTokenizer === "bpe"
            ? encode(
                text,
                bpeSlot.mergeTable as MergeTable,
                bpeSlot.normalizationConfig,
              )
            : encodeWordPiece(
                text,
                wordPieceSlot.model as WordPieceModel,
                wordPieceSlot.normalizationConfig,
              );
        const timeMs = (performance.now() - start).toFixed(3);

        console.log(`\nEncoded Tokens: [${tokens.join(", ")}]`);
        console.log(
          `Compression: ${Buffer.from(text).length} bytes → ${tokens.length} tokens`,
        );
        console.log(`Encode time: ${timeMs} ms`);
        break;
      }
      case "decode": {
        if (currentTokenizer === "bpe" && !bpeSlot.mergeTable) {
          console.log("❌ You must train the tokenizer first! (Option 2 or 3)");
          break;
        }
        if (currentTokenizer === "wordpiece" && !wordPieceSlot.model) {
          console.log("❌ You must train the tokenizer first! (Option 2 or 3)");
          break;
        }
        const tokenStr = await rl.question(
          "Enter comma-separated token IDs (e.g. 104, 256, 111): ",
        );
        try {
          const cleanStr = tokenStr.replace(/['"\[\]]/g, "");
          const tokens = cleanStr
            .split(",")
            .map((s) => parseInt(s.trim(), 10))
            .filter((n) => !Number.isNaN(n));

          const start = performance.now();
          const text =
            currentTokenizer === "bpe"
              ? decode(tokens, bpeSlot.mergeTable as MergeTable)
              : decodeWordPiece(tokens, wordPieceSlot.model as WordPieceModel);
          const timeMs = (performance.now() - start).toFixed(3);

          console.log(`\nDecoded Text: "${text}"`);
          console.log(`Decode time: ${timeMs} ms`);
        } catch (err) {
          console.log("❌ Invalid token format.");
        }
        break;
      }
      case "stats": {
        const availableStats = [
          bpeSlot.trainingStats,
          wordPieceSlot.trainingStats,
        ].filter((stats): stats is TrainingStats => stats !== null);

        if (availableStats.length === 0) {
          console.log("❌ No training data available yet.");
          break;
        }

        for (const stats of availableStats) {
          printTrainingStats(stats);
        }
        break;
      }
      case "compare": {
        // Comparison needs both models because it evaluates the same text
        // against BPE and WordPiece side by side.
        if (bpeSlot.mergeTable === null || wordPieceSlot.model === null) {
          console.log(
            "❌ Train or load both BPE and WordPiece models before comparing.",
          );
          break;
        }

        const rawText = await rl.question(
          "Enter text to compare (press Enter for default evaluation text): ",
        );
        const text = rawText.length === 0 ? DEFAULT_TEXT : rawText;
        warnIfNormalizationConfigsDiffer();
        // compareTokenizer is the pure evaluation layer. The CLI passes each
        // tokenizer slot's own normalization config so the comparison reflects
        // how that model was trained or loaded.
        const comparison = compareTokenizer(
          text,
          {
            mergeTable: bpeSlot.mergeTable,
            normalizationConfig: bpeSlot.normalizationConfig,
          },
          {
            model: wordPieceSlot.model,
            normalizationConfig: wordPieceSlot.normalizationConfig,
          },
        );

        printComparisonReport(text, comparison.bpe, comparison.wordpiece);
        break;
      }
      case "save_tokenizer": {
        try {
          const location = await askModelLocation("save");

          // Save whichever tokenizer is currently active. The persistence helpers
          // convert our runtime model into a JSON-friendly file format.
          if (currentTokenizer === "wordpiece") {
            if (wordPieceSlot.model === null) {
              console.log("❌ Train or load a WordPiece model first.");
              break;
            }
            saveWordPieceModel(
              __dirname,
              location,
              wordPieceSlot.model,
              wordPieceSlot.normalizationConfig,
            );
          } else if (currentTokenizer === "bpe") {
            if (bpeSlot.mergeTable === null) {
              console.log(
                "❌ Train or load a Byte Pair Encoding(BPE) model first.",
              );
              break;
            }
            saveBpeModel(
              __dirname,
              location,
              bpeSlot.mergeTable,
              bpeSlot.normalizationConfig,
            );
          }
          console.log(
            `Saved ${currentTokenizer} tokenizer model to ${location}`,
          );
        } catch (error) {
          const message =
            error instanceof Error ? error.message : "Failed to save model.";
          console.log(`❌ ${message}`);
        }
        break;
      }
      case "load_tokenizer": {
        try {
          const location = await askModelLocation("load");
          const parse = readJsonFile(__dirname, location);
          if (parse === null) {
            throw new Error("Failed to load or parse the JSON file.");
          }

          // We look at the saved JSON first to learn which tokenizer family it
          // belongs to. Only after that do we call the matching loader.
          const type = parseModelType(parse);
          if (type === undefined) {
            throw new Error(
              "Failed to parse the type of Model from JSON file.",
            );
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

          // Important UX choice: loading a model fills that tokenizer's slot,
          // but it does not switch the active tokenizer automatically.
          if (type === currentTokenizer) {
            console.log(`Loaded ${type.toUpperCase()} model from ${location}`);
          } else {
            console.log(
              `Loaded ${type.toUpperCase()} model from ${location}. Active tokenizer is still ${currentTokenizer.toUpperCase()}.`,
            );
          }
        } catch (error) {
          const message =
            error instanceof Error ? error.message : "Failed to load model.";
          console.log(`❌ ${message}`);
        }
        break;
      }
      case "clear": {
        console.clear();
        break;
      }
      case "exit": {
        console.log("Goodbye! 👋");
        rl.close();
        process.exit(0);
      }
      default: {
        console.log("❌ Invalid option.");
        break;
      }
    }
  }
}

// Start the CLI
main().catch(console.error);
