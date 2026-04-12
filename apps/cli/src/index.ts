#!/usr/bin/env node

import { handleCompare, handleStats } from "./handlers/eval";
import { handleLoad, handleSave } from "./handlers/io";
import { handleDecode, handleEncode } from "./handlers/processing";
import { handleTrainFile, handleTrainText } from "./handlers/training";
import {
  bpeSlot,
  currentTokenizer,
  rl,
  setCurrentTokenizer,
  wordPieceSlot,
} from "./state";

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
    `\n🔤 Tokenizer CLI (Current: ${currentTokenizer.toUpperCase()})`
  );
  console.log("================================");
  console.log(
    `Loaded models -> BPE: ${bpeSlot.mergeTable === null ? "empty" : "ready"}, WordPiece: ${wordPieceSlot.model === null ? "empty" : "ready"}`
  );
  console.log("1. Select tokenizer (BPE / WordPiece)");
  console.log("2. Train on text (type directly)");
  console.log("3. Train on file (examples/data/corpus.txt)");
  console.log("4. Encode text");
  console.log("5. Decode tokens");
  console.log("6. Save Tokenizer ");
  console.log("7. Load Tokenizer ");
  console.log("8. Show training stats");
  console.log("9. Compare BPE vs WordPiece");
  console.log("clear -> clear screen");
  console.log("exit -> exit\n");
  console.log(
    "Commands: bpe, wordpiece, train, data, encode, decode, stats, save, load, compare, clear, exit\n"
  );
};

export async function handleSelectTokenizer() {
  const tokenizerChoice = await rl.question(
    "Choose tokenizer (`1`/`bpe` or `2`/`wordpiece`): "
  );
  const tokenizerCommand = tokenizerChoice.trim().toLowerCase();
  if (tokenizerCommand === "1" || tokenizerCommand === "bpe") {
    setCurrentTokenizer("bpe");
    console.log("Switched to BPE.");
  } else if (
    tokenizerCommand === "2" ||
    tokenizerCommand === "wordpiece" ||
    tokenizerCommand === "wp"
  ) {
    setCurrentTokenizer("wordpiece");
    console.log("Switched to WordPiece.");
  } else {
    console.log("❌ Invalid tokenizer option.");
  }
}

/**
 * Runs the interactive CLI loop for training, encoding, decoding, saving, loading, and viewing stats for BPE and WordPiece tokenizers.
 */
async function main() {
  while (true) {
    printMenu();
    const choice = await rl.question("Select an option or command: ");
    const action = getAction(choice);

    switch (action) {
      case "switch_bpe":
        setCurrentTokenizer("bpe");
        console.log("Switched to BPE.");
        break;
      case "switch_wordpiece":
        setCurrentTokenizer("wordpiece");
        console.log("Switched to WordPiece.");
        break;
      case "select":
        await handleSelectTokenizer();
        break;
      case "train_text":
        await handleTrainText();
        break;
      case "train_file":
        await handleTrainFile();
        break;
      case "encode":
        await handleEncode();
        break;
      case "decode":
        await handleDecode();
        break;
      case "stats":
        await handleStats();
        break;
      case "compare":
        await handleCompare();
        break;
      case "save_tokenizer":
        await handleSave();
        break;
      case "load_tokenizer":
        await handleLoad();
        break;
      case "clear":
        console.clear();
        break;
      case "exit":
        console.log("Goodbye! 👋");
        rl.close();
        process.exit(0);
        return; // Fixed fallthrough and ensured termination
      default:
        console.log("❌ Invalid option.");
        break;
    }
  }
}

// Start the CLI
main().catch((error) => {
  console.error("Fatal CLI error:", error);
  rl.close();
  process.exit(1);
});
