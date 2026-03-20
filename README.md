# 🔤 Byte-Pair Encoding (BPE) Tokenizer

A clean, well-documented implementation of the **Byte-Pair Encoding** algorithm in TypeScript — built for learning, exploring, and understanding how modern AI tokenizers work under the hood.

> **Who is this for?** If you've ever wondered how ChatGPT, LLaMA, or any large language model turns your text into something a neural network can process — this project walks you through it, one merge at a time.

---

## Table of Contents

- [The Problem: Why Do We Need Tokenization?](#the-problem-why-do-we-need-tokenization)
- [What is Byte-Pair Encoding?](#what-is-byte-pair-encoding)
- [How BPE Works — Step by Step](#how-bpe-works--step-by-step)
  - [Step 0: Start With Bytes](#step-0-start-with-bytes)
  - [Step 1: Count Every Adjacent Pair](#step-1-count-every-adjacent-pair)
  - [Step 2: Merge the Most Frequent Pair](#step-2-merge-the-most-frequent-pair)
  - [Step 3: Repeat Until Done](#step-3-repeat-until-done)
- [A Complete Walkthrough Example](#a-complete-walkthrough-example)
- [Visual Merge Tree](#visual-merge-tree)
  - [How Token 258 Is Built](#how-token-258-is-built)
  - [Bottom-Up: Watching the Merges Happen](#bottom-up-watching-the-merges-happen)
  - [Full Sequence Expansion](#full-sequence-expansion)
- [Pre-Tokenization: Splitting Before Merging](#pre-tokenization-splitting-before-merging)
- [Encoding: Compressing New Text](#encoding-compressing-new-text)
- [Decoding: Reconstructing the Original Text](#decoding-reconstructing-the-original-text)
- [Under the Hood: Bit-Packing Optimization](#under-the-hood-bit-packing-optimization)
- [The Merge Table — BPE's Brain](#the-merge-table--bpes-brain)
- [How This Relates to Real LLMs](#how-this-relates-to-real-llms)
- [Getting Started](#getting-started)
  - [Interactive CLI](#interactive-cli)
  - [Programmatic Usage](#programmatic-usage)
- [Project Structure](#project-structure)
- [Key Concepts Glossary](#key-concepts-glossary)

---

## The Problem: Why Do We Need Tokenization?

Neural networks don't understand text. They understand **numbers**. Before any language model can process your sentence, it must be converted into a sequence of integers called **tokens**.

But how do you split text into tokens? There are a few obvious strategies, and each has a fatal flaw:

| Strategy | Example (`"hello world"`) | Problem |
|---|---|---|
| **One token per character** | `[h, e, l, l, o, " ", w, o, r, l, d]` → 11 tokens | Sequences become extremely long. The model has to process many tokens for simple sentences, which is slow and expensive. |
| **One token per word** | `[hello, world]` → 2 tokens | The vocabulary would need to contain *every possible word* — including misspellings, slang, code, every language on earth, etc. That's impossible. |
| **One token per byte** | `[104, 101, 108, 108, 111, 32, 119, 111, 114, 108, 100]` → 11 tokens | Same problem as characters — sequences are too long, and the model can't learn higher-level patterns efficiently. |

We need something **in between** — a method that:
- Keeps the vocabulary **small and manageable** (thousands of tokens, not millions)
- Keeps sequences **short** (fewer tokens to process = faster inference)
- Can handle **any text** — including rare words, code, and multilingual content

That's exactly what **Byte-Pair Encoding** does.

---

## What is Byte-Pair Encoding?

Byte-Pair Encoding (BPE) is a **compression algorithm** originally invented for data compression, later adopted by the NLP community as the go-to tokenization strategy for large language models.

The core idea is beautifully simple:

> **Start with individual bytes. Repeatedly find the most common adjacent pair. Merge them into a single new token. Repeat.**

Over many iterations, BPE builds up a vocabulary of tokens that range from single characters to common words and subwords. Frequent patterns like `"th"`, `"ing"`, `"tion"` become single tokens, while rare combinations stay as individual bytes.

This is the tokenization method used by:
- **GPT-2, GPT-3, GPT-4** (OpenAI)
- **LLaMA** (Meta)
- **Many other modern language models**

---

## How BPE Works — Step by Step

### Step 0: Start With Bytes

Every string in a computer is stored as a sequence of **bytes** — numbers between 0 and 255. This is the UTF-8 encoding standard.

For example, the string `"hi"` is stored as:

```
"hi"  →  [104, 105]
         │     │
         h     i
```

These raw bytes (0–255) form our **initial vocabulary** of 256 tokens. Every possible byte already has a token ID — we don't need to define them.

### Step 1: Count Every Adjacent Pair

We scan through our entire sequence of tokens and count how many times each **pair of adjacent tokens** appears.

For the text `"aaabab"`:

```
Tokens:  [97, 97, 97, 98, 97, 98]
          a   a   a   b   a   b

Pairs and their counts:
  (97, 97) → "aa" → appears 2 times  ← MOST FREQUENT
  (97, 98) → "ab" → appears 2 times
  (98, 97) → "ba" → appears 1 time
```

### Step 2: Merge the Most Frequent Pair

We take the most frequent pair — `(97, 97)` in this case — and replace **every occurrence** of it in our token sequence with a brand new token ID.

Since IDs 0–255 are taken by raw bytes, new tokens start at **256**:

```
Before:  [97, 97, 97, 98, 97, 98]    (6 tokens)
                                       
Merge:   (97, 97) → 256               "aa" becomes token 256

After:   [256, 97, 98, 97, 98]        (5 tokens)
```

Notice: the sequence got **shorter**. That's compression happening in real time.

### Step 3: Repeat Until Done

We keep repeating Steps 1 and 2 — counting pairs, finding the most frequent, merging — until we've reached our **target vocabulary size**.

Each iteration:
1. Finds the most frequent pair in the current token sequence
2. Creates a new token ID for that pair
3. Replaces all occurrences of the pair with the new token
4. Records the merge rule in a **merge table**

The algorithm stops when either:
- We've reached the target vocabulary size, or
- No pair appears more than once (nothing left to compress)

---

## A Complete Walkthrough Example

Let's walk through BPE on the text `"aaabdaaabac"` with a target vocabulary size of **259** (256 base bytes + 3 new merges).

**Initial state:**
```
Tokens: [97, 97, 97, 98, 100, 97, 97, 97, 98, 97, 99]
         a   a   a   b   d    a   a   a   b   a   c

Length: 11 tokens
```

---

**Iteration 1** — Count pairs:
```
(97,97)  → 4 times  ← WINNER
(97,98)  → 2 times
(98,100) → 1 time
(100,97) → 1 time
(98,97)  → 1 time
(97,99)  → 1 time
```

Merge `(97, 97)` → new token **256** (represents `"aa"`):
```
Tokens: [256, 97, 98, 100, 256, 97, 98, 97, 99]
         aa   a   b   d    aa   a   b   a   c

Length: 9 tokens (was 11)
```

---

**Iteration 2** — Count pairs:
```
(256,97) → 2 times  ← WINNER
(97,98)  → 2 times
(98,100) → 1 time
(100,256)→ 1 time
(98,97)  → 1 time
(97,99)  → 1 time
```

Merge `(256, 97)` → new token **257** (represents `"aaa"`, since 256 = `"aa"`):
```
Tokens: [257, 98, 100, 257, 98, 97, 99]
         aaa  b   d    aaa  b   a   c

Length: 7 tokens (was 9)
```

---

**Iteration 3** — Count pairs:
```
(257,98) → 2 times  ← WINNER
(98,100) → 1 time
(100,257)→ 1 time
(98,97)  → 1 time
(97,99)  → 1 time
```

Merge `(257, 98)` → new token **258** (represents `"aaab"`):
```
Tokens: [258, 100, 258, 97, 99]
         aaab  d    aaab  a   c

Length: 5 tokens (was 7)
```

**Final result:** We compressed 11 tokens down to **5 tokens** using just 3 merge operations.

**The merge table (BPE's learned rules):**
```
Merge 1: (97, 97)  → 256   "a" + "a"   = "aa"
Merge 2: (256, 97) → 257   "aa" + "a"  = "aaa"
Merge 3: (257, 98) → 258   "aaa" + "b" = "aaab"
```

This merge table is all we need to encode and decode any text.

---

## Visual Merge Tree

The merge table above can be visualized as a **binary tree**, where each merged token is built from exactly two children. This makes it easy to see how complex tokens are composed from simpler ones.

### How Token 258 Is Built

Token **258** (`"aaab"`) is the most complex token we learned. Here's its full merge tree — every non-leaf node was created by merging its two children:

```
                  258
                "aaab"
             ┌────┴────┐
           257          98
          "aaa"        "b"
        ┌───┴───┐
      256       97
      "aa"     "a"
    ┌───┴───┐
   97       97
   "a"      "a"
```

Reading this tree:
- **Leaves** (bottom) are raw bytes — the characters `"a"` (97) and `"b"` (98)
- **Each parent** is a merged token formed by concatenating its left child + right child
- **The root** (top) is the final merged token that represents the full substring `"aaab"`

### Bottom-Up: Watching the Merges Happen

Here's another way to see it — watching the token sequence **compress** step by step as each merge is applied:

```
 ─── Original bytes ──────────────────────────────────────────────

  97   97   97   98  100   97   97   97   98   97   99
  "a"  "a"  "a"  "b"  "d"  "a"  "a"  "a"  "b"  "a"  "c"     11 tokens
  └─┬──┘         │    │    └─┬──┘         │    │    │
    │            │    │      │            │    │    │
 ─── Merge 1: (97,97) → 256 "aa" ────────────────────────────────

  256   97   98  100  256   97   98   97   99
  "aa"  "a"  "b"  "d" "aa"  "a"  "b"  "a"  "c"               9 tokens
  └──┬──┘    │    │   └──┬──┘    │    │    │
     │       │    │      │       │    │    │
 ─── Merge 2: (256,97) → 257 "aaa" ──────────────────────────────

  257   98  100  257   98   97   99
  "aaa" "b"  "d" "aaa" "b"  "a"  "c"                          7 tokens
  └──┬──┘    │   └──┬──┘    │    │
     │       │      │       │    │
 ─── Merge 3: (257,98) → 258 "aaab" ─────────────────────────────

  258  100  258   97   99
 "aaab" "d" "aaab" "a"  "c"                                   5 tokens
```

Each horizontal line marks a merge iteration. Brackets (`└─┬─┘`) show which adjacent tokens are being merged. Notice how the sequence **shrinks** from 11 tokens to 5 — that's a **2.2× compression**.

### Full Sequence Expansion

Decoding works in reverse — start from the final token IDs and recursively expand each merged token back down to raw bytes:

```
 Encoded token IDs:         [258]       [100]       [258]       [97]  [99]
                           "aaab"        "d"       "aaab"        "a"   "c"
                             │            │          │            │     │
  expand 258 ──────►    ┌────┴───┐        │     ┌────┴───┐        │     │
                      [257]    [98]       │   [257]    [98]       │     │
                      "aaa"    "b"        │   "aaa"    "b"        │     │
                        │       │         │     │       │         │     │
  expand 257 ──────►  ┌─┴──┐    │         │   ┌─┴──┐    │         │     │
                   [256] [97]   │         │ [256] [97]  │         │     │
                   "aa"   "a"   │         │ "aa"   "a"  │         │     │
                     │     │    │         │   │     │   │         │     │
  expand 256 ──────►┌┴─┐   │    │         │  ┌┴─┐   │   │         │     │
                  [97][97] │    │         │[97][97] │   │         │     │
                   "a" "a" │    │         │ "a" "a" │   │         │     │
                    │   │  │    │         │  │   │  │   │         │     │
  all base bytes:   ▼   ▼  ▼    ▼         ▼  ▼   ▼  ▼   ▼         ▼     ▼
                    a   a  a    b         d  a   a  a   b         a     c
                    ╰───────────────────────────────────────────────────╯
                                      "aaabdaaabac"
```

This tree-expansion process is exactly what the `decode()` function does — it walks each token, checks if it's a merged token (ID ≥ 256), and if so, looks up its two children in the merge table and expands them recursively until only raw bytes remain.

---

## Pre-Tokenization: Splitting Before Merging

Before BPE does its merging, there's an important preprocessing step called **pre-tokenization**. This is handled by `bpe/preTokenizer.ts`.

### Why Pre-Tokenize?

Without pre-tokenization, BPE might merge bytes **across word boundaries**. For example, the space at the end of `"the "` could merge with the `"a"` at the start of `"apple"`, creating a meaningless token `" a"` that spans two words. This produces poor-quality tokens.

Pre-tokenization prevents this by splitting the text into **chunks** first, and then inserting a **boundary marker** (`-1`) between chunks. During BPE training, the algorithm skips over these boundaries — it never counts or merges pairs across them.

### How It Works

The pre-tokenizer uses regex patterns to split text into meaningful chunks:

```
Input:  "Hello, world! 123"

Chunks: ["Hello", ",", " ", "world", "!", " ", "123"]
```

It recognizes these pattern types (in priority order):
1. **URLs** — `https://example.com`
2. **Emails** — `user@example.com`
3. **Contractions** — `'s`, `n't`, `'re`, `'ve`, `'ll`, `'d`
4. **Decimal numbers** — `3.14`
5. **Integers** — `42`
6. **Punctuation sequences** — `...`, `?!`
7. **Words** (including hyphenated) — `state-of-the-art`
8. **Whitespace** — spaces, tabs, newlines
9. **Any remaining character**

Each chunk is converted to its UTF-8 bytes, and a `-1` separator is inserted between chunks:

```
"Hi there"  →  ["Hi", " ", "there"]
            →  [72, 105, -1, 32, -1, 116, 104, 101, 114, 101]
                H   i   SEP  " "  SEP  t    h    e    r    e
```

The BPE algorithm sees `-1` and knows: **do not merge across this boundary**.

---

## Encoding: Compressing New Text

Once you've trained BPE and have a merge table, you can **encode** any new text into tokens — even text the tokenizer has never seen before.

The encoding process is straightforward:

1. Convert the input text to raw UTF-8 bytes
2. **Replay** every merge rule from the merge table, in the exact order they were learned
3. Return the resulting token sequence

```
Merge Table:
  (97, 97)  → 256
  (256, 97) → 257
  (257, 98) → 258

Encoding "aaab":

  Start:       [97, 97, 97, 98]      "a a a b"
  Apply merge 1: [256, 97, 98]       "aa a b"     (97,97 → 256)
  Apply merge 2: [257, 98]           "aaa b"      (256,97 → 257)
  Apply merge 3: [258]               "aaab"       (257,98 → 258)

  Result: [258]
```

The order matters! Merges must be applied in the **same order** they were learned during training. This ensures consistent tokenization.

---

## Decoding: Reconstructing the Original Text

Decoding reverses the process — it takes token IDs and produces the original string.

The algorithm builds a **reverse lookup table** from the merge table:

```
Reverse Table:
  258 → (257, 98)
  257 → (256, 97)
  256 → (97, 97)
```

Then it walks through the tokens and **recursively expands** any token with an ID ≥ 256:

```
Decoding [258, 100]:

  Step 1: [258, 100]                    258 is merged → expand
  Step 2: [257, 98, 100]                257 is merged → expand
  Step 3: [256, 97, 98, 100]            256 is merged → expand
  Step 4: [97, 97, 97, 98, 100]         all are base bytes ✓

  Convert bytes to string: "aaabd"
```

Every merged token is unpacked back into its two children, and those children are checked again — this continues until everything is a base byte (0–255). Then the bytes are converted back to a UTF-8 string.

---

## Under the Hood: Bit-Packing Optimization

This implementation uses a clever trick called **bit-packing** to store token pairs efficiently.

Instead of representing a pair like `(97, 98)` as a string `"97-98"` or an array `[97, 98]`, we pack both numbers into a **single 32-bit integer**:

```
pair = (firstToken << 16) | secondToken
```

### How It Works

A 32-bit integer has 32 binary digits. We use the **upper 16 bits** for the first token and the **lower 16 bits** for the second:

```
firstToken  = 97   →  0000000001100001 (16 bits)
secondToken = 98   →  0000000001100010 (16 bits)

pairKey = (97 << 16) | 98
        = 00000000011000010000000001100010  (32 bits)
        = 6,356,066 (as a decimal number)
```

To unpack:
```
firstToken  = pairKey >> 16        →  97
secondToken = pairKey & 0xFFFF     →  98
```

### Why Do This?

Using a single integer as a Map key is **significantly faster** than using strings or arrays:
- Integer comparison is a single CPU operation
- No string concatenation or parsing overhead
- No garbage collection pressure from creating temporary objects
- `Map<number, number>` is much faster than `Map<string, number>`

This optimization matters because BPE counts pairs **millions of times** during training on large texts.

---

## The Merge Table — BPE's Brain

The merge table is the single most important output of BPE training. It's an ordered list of merge rules:

```typescript
type Merge = [pairKey: number, newTokenId: number];
type MergeTable = Merge[];
```

Each entry says: *"When you see this pair of tokens next to each other, replace them with this new token ID."*

```
Merge Table:
  Index 0: [(97 << 16) | 97,  256]    →  "a" + "a"  becomes token 256
  Index 1: [(256 << 16) | 97,  257]    →  "aa" + "a" becomes token 257
  Index 2: [(257 << 16) | 98,  258]    →  "aaa" + "b" becomes token 258
```

The merge table is:
- **Learned during training** — by analyzing which pairs are most frequent
- **Used during encoding** — replayed in order to compress new text
- **Used during decoding** — reversed to expand tokens back to bytes
- **Ordered** — the order of merges matters and must be preserved

---

## How This Relates to Real LLMs

In a real large language model pipeline, tokenization is the **first step** before any AI processing happens:

```
┌──────────┐     ┌────────────┐     ┌────────────────┐     ┌──────────┐
│ Raw Text │ ──► │ Tokenizer  │ ──► │ Neural Network │ ──► │  Output  │
│ "Hello!" │     │ BPE Encode │     │ (Transformer)  │     │  Tokens  │
└──────────┘     └────────────┘     └────────────────┘     └──────────┘
                  │                                          │
                  |─|> [15496, 0]                            │  [8332, 995, ...]
                                                             │
                                                       ┌────────────┐
                                                       │ Tokenizer  │
                                                       │ BPE Decode │
                                                       └────────────┘
                                                             │
                                                       "I'm doing well!"
```

The tokenizer in this project implements the same fundamental algorithm. Real-world tokenizers like OpenAI's `tiktoken` or HuggingFace's `tokenizers` add additional features (special tokens, regex-based splitting, handling of unknown tokens), but the BPE core is identical to what you see in `bpe/tokenizer.ts`.

### Vocabulary Size in Practice

| Model | Vocab Size | Tokenizer |
|---|---|---|
| GPT-2 | 50,257 | BPE |
| GPT-4 | ~100,000 | BPE (cl100k_base) |
| LLaMA 2 | 32,000 | BPE (SentencePiece) |
| This project (default) | 320 | BPE |

The larger the vocabulary, the more merges were learned, the shorter the token sequences, but the larger the model's embedding table.

---

## Getting Started

This project uses [Bun](https://bun.sh/) as its TypeScript runtime.

### Install Dependencies

```bash
bun install
```

### Interactive CLI

Launch the interactive CLI to experiment with BPE:

```bash
bun run index.ts
```

You'll see a menu with these options:

| Option | What It Does |
|---|---|
| **1. Train on text** | Type any text and train a BPE tokenizer on it |
| **2. Train on file** | Train on the provided `data/data.txt` sample |
| **3. Encode text** | Convert text into BPE token IDs |
| **4. Decode tokens** | Convert token IDs back into readable text |
| **5. Show stats** | View compression ratio, training time, and more |
| **6. Exit** | Quit the CLI |

> **Note:** You must train (option 1 or 2) before you can encode or decode.

### Programmatic Usage

Use the tokenizer directly in your own TypeScript code:

```typescript
import { train, encode, decode } from "./bpe/tokenizer";

// Step 1: Train on your text data
const text = "hello world! programming is fun. hello hello world.";
const { mergeTable, tokens } = train(text, 300); // 256 base + 44 merges

// Step 2: Encode new text using the learned merge rules
const encoded = encode("hello world", mergeTable);
console.log(encoded); // e.g. [256, 259, 32, 119, 111, ...]

// Step 3: Decode tokens back to the original string
const decoded = decode(encoded, mergeTable);
console.log(decoded); // "hello world"
```

---

## Project Structure

```
.
├── bpe/
│   ├── tokenizer.ts       # Core BPE algorithm — train, encode, decode
│   └── preTokenizer.ts    # Regex-based text splitting before BPE
├── data/
│   └── data.txt           # Sample training text
├── index.ts               # Interactive CLI application
├── package.json
├── tsconfig.json
└── README.md              # You are here
```

### File Breakdown

**`bpe/tokenizer.ts`** — The heart of the project. Contains four key pieces:
- `findMostFrequentPair()` — Scans tokens to find the most common adjacent pair
- `replacePair()` — Replaces all occurrences of a pair with a new token ID
- `train()` — The main BPE training loop that learns merge rules
- `encode()` / `decode()` — Apply and reverse merge rules on new text

**`bpe/preTokenizer.ts`** — Splits raw text into chunks (words, numbers, punctuation, whitespace) using regex patterns and inserts `-1` boundary markers between them to prevent cross-boundary merges.

**`index.ts`** — A full interactive CLI built with Node's `readline` module that lets you train, encode, decode, and inspect statistics without writing code.

---

## Key Concepts Glossary

| Term | Definition |
|---|---|
| **Token** | A unit of text represented as an integer. Can be a single byte (0–255) or a merged sequence (256+). |
| **Vocabulary** | The full set of all known tokens. Starts at 256 (one per byte) and grows with each merge. |
| **Merge** | The operation of replacing two adjacent tokens with a single new token. |
| **Merge Table** | An ordered list of all merge rules learned during training. This is what gets saved and reused. |
| **Pair** | Two tokens that appear next to each other in the sequence. |
| **Bit-Packing** | Storing two 16-bit numbers in a single 32-bit integer for performance. |
| **Pre-Tokenization** | Splitting text into chunks before BPE to prevent merges across word boundaries. |
| **Compression Ratio** | How much shorter the token sequence is compared to the original bytes. Higher is better. |
| **Target Vocab Size** | The desired total number of tokens (256 base + N merges). Controls how many merges to learn. |
| **UTF-8** | The standard encoding that represents text as bytes (0–255). Every string starts as UTF-8 bytes in BPE. |

---

<p align="center">
  <b>Built for learning.</b> Read the code, run the CLI, and experiment. That's the best way to understand BPE.
</p>
