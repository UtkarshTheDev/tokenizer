import {
  decode,
  decodeWordPiece,
  encode,
  encodeWordPiece,
  type MergeTable,
  type WordPieceModel,
} from "@tokenizer/models";
import { bpeSlot, currentTokenizer, rl, wordPieceSlot } from "../state";

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
    const tokens = cleanStr
      .split(",")
      .map((s) => Number.parseInt(s.trim(), 10))
      .filter((n) => !Number.isNaN(n));

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
