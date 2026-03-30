import * as readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import * as fs from "node:fs";
import * as path from "node:path";
import {
  buildModelLocation,
  getModelFilePrompt,
  type ModelFileAction,
  type TokenizerKind,
} from "./cli/modelFiles";
import {
  loadWordPieceModel,
  saveWordPieceModel,
} from "./cli/wordpiecePersistence";
import { train, encode, decode, type MergeTable } from "./bpe/tokenizer";
import {
  train as trainWordPiece,
  encode as encodeWordPiece,
  decode as decodeWordPiece,
} from "./wordpiece/tokenizer";
import type { WordPieceModel } from "./wordpiece/types";

// Readline interface for interactive CLI
const rl = readline.createInterface({ input, output });

let currentMergeTable: MergeTable | null = null;
let currentWordPieceModel: WordPieceModel | null = null;
let currentTokenizer: TokenizerKind = "bpe";
let currentVocabSize = 256;
let currentTrainingStats: {
  tokenizer: TokenizerKind;
  timeMs: string;
  learnedUnits: number;
  originalBytes: number;
  finalTokens: number;
  ratio: string;
  spaceSaved: string;
} | null = null;

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
  console.log(`1. Select tokenizer (BPE / WordPiece)`);
  console.log(`2. Train on text (type directly)`);
  console.log(`3. Train on file (data/data.txt)`);
  console.log(`4. Encode text`);
  console.log(`5. Decode tokens`);
  console.log(`6. Save Tokenizer `);
  console.log(`7. Load Tokenizer `);
  console.log(`8. Show training stats`);
  console.log(`clear -> clear screen`);
  console.log(`exit -> exit\n`);
  console.log(
    `Commands: bpe, wordpiece, train, data, encode, decode, stats,save,load clear, exit\n`,
  );
};

const askModelLocation = async (action: ModelFileAction): Promise<string> => {
  const raw = await rl.question(getModelFilePrompt(currentTokenizer, action));
  return buildModelLocation(currentTokenizer, raw);
};

const requiresWordPiecePersistence = (): boolean => {
  if (currentTokenizer === "wordpiece") {
    return true;
  }

  console.log("❌ BPE save/load is not implemented yet.");
  return false;
};

const handleTrain = async (text: string) => {
  const defaultVocabSize = currentTokenizer === "bpe" ? 320 : 64;
  const minVocabSize = currentTokenizer === "bpe" ? 257 : 1;
  const vocabStr = await rl.question(
    `Target vocabulary size (default ${defaultVocabSize}, min ${minVocabSize}): `,
  );

  let vocabSize = parseInt(vocabStr, 10);
  if (isNaN(vocabSize)) vocabSize = defaultVocabSize;
  if (vocabSize < minVocabSize) vocabSize = minVocabSize;

  console.log(
    `\nTraining ${currentTokenizer.toUpperCase()} on ${text.length} characters (vocab size: ${vocabSize})...`,
  );

  const start = performance.now();
  const originalBytes = Buffer.from(text, "utf-8").length;

  if (currentTokenizer === "bpe") {
    const { mergeTable, tokens } = train(text, vocabSize);
    const timeMs = (performance.now() - start).toFixed(2);
    const finalTokens = tokens.length;

    currentMergeTable = mergeTable;
    currentWordPieceModel = null;
    currentVocabSize = 256 + mergeTable.length;
    currentTrainingStats = {
      tokenizer: "bpe",
      timeMs,
      learnedUnits: mergeTable.length,
      originalBytes,
      finalTokens,
      ratio: (originalBytes / finalTokens).toFixed(2),
      spaceSaved: (
        ((originalBytes - finalTokens) / originalBytes) *
        100
      ).toFixed(1),
    };

    console.log(
      `✅ Training complete in ${timeMs} ms. Learned ${mergeTable.length} merges (final vocab: ${currentVocabSize}).`,
    );
    return;
  }

  const model = trainWordPiece(text, vocabSize);
  const encoded = encodeWordPiece(text, model);
  const timeMs = (performance.now() - start).toFixed(2);
  const finalTokens = encoded.length;

  currentWordPieceModel = model;
  currentMergeTable = null;
  currentVocabSize = model.idToToken.length;
  currentTrainingStats = {
    tokenizer: "wordpiece",
    timeMs,
    learnedUnits: model.idToToken.length,
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
        if (currentTokenizer === "bpe" && !currentMergeTable) {
          console.log("❌ You must train the tokenizer first! (Option 2 or 3)");
          break;
        }
        if (currentTokenizer === "wordpiece" && !currentWordPieceModel) {
          console.log("❌ You must train the tokenizer first! (Option 2 or 3)");
          break;
        }
        const text = await rl.question("Enter text to encode: ");

        const start = performance.now();
        const tokens =
          currentTokenizer === "bpe"
            ? encode(text, currentMergeTable as MergeTable)
            : encodeWordPiece(text, currentWordPieceModel as WordPieceModel);
        const timeMs = (performance.now() - start).toFixed(3);

        console.log(`\nEncoded Tokens: [${tokens.join(", ")}]`);
        console.log(
          `Compression: ${Buffer.from(text).length} bytes → ${tokens.length} tokens`,
        );
        console.log(`Encode time: ${timeMs} ms`);
        break;
      }
      case "decode": {
        if (currentTokenizer === "bpe" && !currentMergeTable) {
          console.log("❌ You must train the tokenizer first! (Option 2 or 3)");
          break;
        }
        if (currentTokenizer === "wordpiece" && !currentWordPieceModel) {
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
            .filter((n) => !isNaN(n));

          const start = performance.now();
          const text =
            currentTokenizer === "bpe"
              ? decode(tokens, currentMergeTable as MergeTable)
              : decodeWordPiece(
                  tokens,
                  currentWordPieceModel as WordPieceModel,
                );
          const timeMs = (performance.now() - start).toFixed(3);

          console.log(`\nDecoded Text: "${text}"`);
          console.log(`Decode time: ${timeMs} ms`);
        } catch (err) {
          console.log("❌ Invalid token format.");
        }
        break;
      }
      case "stats": {
        if (!currentTrainingStats) {
          console.log("❌ No training data available yet.");
          break;
        }

        console.log("\n╔══════════════════════════════════════════╗");
        console.log(
          `║   ${currentTrainingStats.tokenizer.toUpperCase().padEnd(11)} TOKENIZER — SUMMARY   ║`,
        );
        console.log("╚══════════════════════════════════════════╝\n");

        console.log("── Training ────────────────────────────────");
        console.log(
          `  Training time       : ${currentTrainingStats.timeMs} ms`,
        );
        if (currentTrainingStats.tokenizer === "bpe") {
          console.log(
            `  Learned merges      : ${currentTrainingStats.learnedUnits}`,
          );
        } else {
          console.log(
            `  Final vocab size    : ${currentTrainingStats.learnedUnits}`,
          );
        }
        console.log(`  Final vocab size    : ${currentVocabSize}`);

        console.log("\n── Compression ─────────────────────────────");
        console.log(
          `  Original tokens     : ${currentTrainingStats.originalBytes} (raw bytes)`,
        );
        console.log(
          `  After ${currentTrainingStats.tokenizer.toUpperCase()}    : ${currentTrainingStats.finalTokens} tokens`,
        );
        console.log(`  Compression ratio   : ${currentTrainingStats.ratio}x`);
        console.log(
          `  Space saved         : ${currentTrainingStats.spaceSaved}%`,
        );
        break;
      }
      case "save_tokenizer": {
        if (!requiresWordPiecePersistence()) {
          break;
        }

        if (currentWordPieceModel === null) {
          console.log("❌ Train or load a WordPiece model first.");
          break;
        }

        try {
          const location = await askModelLocation("save");
          saveWordPieceModel(__dirname, location, currentWordPieceModel);
          console.log(`Saved ${currentTokenizer} tokenizer model to ${location}`);
        } catch (error) {
          const message =
            error instanceof Error ? error.message : "Failed to save model.";
          console.log(`❌ ${message}`);
        }
        break;
      }
      case "load_tokenizer": {
        if (!requiresWordPiecePersistence()) {
          break;
        }

        try {
          const location = await askModelLocation("load");
          const loadedModel = loadWordPieceModel(__dirname, location);

          currentTokenizer = "wordpiece";
          currentWordPieceModel = loadedModel;
          currentMergeTable = null;
          currentVocabSize = loadedModel.idToToken.length;
          currentTrainingStats = null;
          console.log(`Loaded ${currentTokenizer} model from ${location}`);
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
