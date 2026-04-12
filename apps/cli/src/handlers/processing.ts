import { decode, encode, type MergeTable } from "@tokenizer/models/bpe";
import {
  decode as decodeWordPiece,
  encode as encodeWordPiece,
} from "@tokenizer/models/wordpiece";
import type { WordPieceModel } from "@tokenizer/models/wordpiece/types";
import { bpeSlot, currentTokenizer, rl, wordPieceSlot } from "../state";

const WORD_REGEX = /\w+/g;
export async function handleEncode() {
  if (currentTokenizer === "bpe" && !bpeSlot.mergeTable) {
    console.log("❌ You must train the tokenizer first! (Option 2 or 3)");
    return;
  }
  if (currentTokenizer === "wordpiece" && !wordPieceSlot.model) {
    console.log("❌ You must train the tokenizer first! (Option 2 or 3)");
    return;
  }
  const text = await rl.question("Enter text to encode: ");

  const start = performance.now();
  const tokens =
    currentTokenizer === "bpe"
      ? encode(
          text,
          bpeSlot.mergeTable as MergeTable,
          bpeSlot.normalizationConfig
        )
      : encodeWordPiece(
          text,
          wordPieceSlot.model as WordPieceModel,
          wordPieceSlot.normalizationConfig
        );
  const timeMs = (performance.now() - start).toFixed(3);

  console.log(`\nEncoded Tokens: [${tokens.join(", ")}]`);
  console.log(
    `Compression: ${Buffer.from(text).length} bytes → ${tokens.length} tokens`
  );
  console.log(`Encode time: ${timeMs} ms`);
}

export async function handleDecode() {
  if (currentTokenizer === "bpe" && !bpeSlot.mergeTable) {
    console.log("❌ You must train the tokenizer first! (Option 2 or 3)");
    return;
  }
  if (currentTokenizer === "wordpiece" && !wordPieceSlot.model) {
    console.log("❌ You must train the tokenizer first! (Option 2 or 3)");
    return;
  }
  const tokenStr = await rl.question(
    "Enter comma-separated token IDs (e.g. 104, 256, 111): "
  );
  try {
    const cleanStr = tokenStr.replace(/['"[\]]/g, "");
    const parts = cleanStr.split(",").map((s) => s.trim());
    if (
      parts.length === 0 ||
      parts.some((p) => p === "" || !WORD_REGEX.test(p))
    ) {
      console.log("❌ Invalid token format.");
      return;
    }

    const tokens = parts.map((p) => Number.parseInt(p, 10));

    const start = performance.now();
    const text =
      currentTokenizer === "bpe"
        ? decode(tokens, bpeSlot.mergeTable as MergeTable)
        : decodeWordPiece(tokens, wordPieceSlot.model as WordPieceModel);
    const timeMs = (performance.now() - start).toFixed(3);

    console.log(`\nDecoded Text: "${text}"`);
    console.log(`Decode time: ${timeMs} ms`);
  } catch (_err) {
    console.log("❌ Invalid token format.");
  }
}
