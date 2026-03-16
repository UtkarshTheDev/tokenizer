# BPE Tokenizer

A fast, clean, and beginner-friendly implementation of the Byte-Pair Encoding (BPE) algorithm in TypeScript.

## What is BPE?

Byte-Pair Encoding (BPE) is a data compression technique widely used in modern Large Language Models (LLMs) like GPT-4 or Llama to tokenize text.

Instead of treating every single character as a token (which makes sequences too long) or every full word as a token (which requires an impossibly large vocabulary to cover every variation), BPE finds the perfect middle ground. 

**How it works:**
1. It starts by treating every individual byte (0-255) as its own token.
2. It scans the text to find the most frequently occurring adjacent pair of tokens (e.g., `e` and `r`).
3. It creates a brand new token ID to represent that pair (e.g., `er`).
4. It repeats this process until it reaches a target vocabulary size.

## Features

- **Beginner-Friendly:** The core module (`bpe/tokenizer.ts`) is heavily commented and uses clear naming conventions to explain the math and logic behind BPE.
- **Interactive CLI:** Comes with a built-in CLI tool to experiment with training, encoding, and decoding without writing any extra code.
- **Optimized:** Uses bit-packing and `Uint16Array` logic under the hood to ensure fast training times and minimal memory allocations.

## Getting Started

This project uses [Bun](https://bun.sh/) as its runtime.

### Running the Interactive CLI

To start the CLI, run:
```bash
bun run index.ts
```

You will be greeted with a menu:
- **Option 1 & 2 (Train):** You must run one of these first. You can train on a short snippet you type, or on the provided `data/data.txt` file.
- **Option 3 (Encode):** Type normal text and watch it get compressed into token IDs.
- **Option 4 (Decode):** Paste an array of token IDs (e.g., `104, 256, 111`) and watch it perfectly reconstruct the original string.
- **Option 5 (Stats):** View metrics like your compression ratio, how much space was saved, and how fast the training took.

### Using the Module in Code

If you want to use the tokenizer programmatically in another file:

```typescript
import { train, encode, decode } from "./bpe/tokenizer.ts";

const trainingData = "hello world! programming is fun.";
const targetVocabSize = 300; // 256 base bytes + 44 new tokens

// 1. Train to learn the merge rules
const { mergeTable, tokens } = train(trainingData, targetVocabSize);

// 2. Encode a new string using the learned rules
const encoded = encode("hello", mergeTable);
console.log("Encoded:", encoded);

// 3. Decode the tokens back into a string
const decoded = decode(encoded, mergeTable);
console.log("Decoded:", decoded); // "hello"
```

## Directory Structure

- `bpe/tokenizer.ts`: The core logic. Start here if you want to read the code and learn how it works.
- `index.ts`: The code for the interactive CLI menu.
- `data/data.txt`: Sample text provided for testing the tokenizer on larger inputs.
