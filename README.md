# Tokenizer 101 - For Begginers

A beginner-friendly TypeScript project for learning how modern tokenizers work by building them yourself.

GitHub repository: [UtkarshTheDev/tokenizer](https://github.com/UtkarshTheDev/tokenizer)

This repository currently contains **two tokenizer families**:

- **Byte-Pair Encoding (BPE)** in [bpe/README.md](https://github.com/UtkarshTheDev/tokenizer/blob/main/bpe/README.md)
- **WordPiece** in [wordpiece/README.md](https://github.com/UtkarshTheDev/tokenizer/blob/main/wordpiece/README.md)

The goal of this project is not just to run tokenizers.  
The goal is to help a beginner understand:

- why tokenization is needed
- how different subword algorithms think
- how training, encoding, and decoding fit together
- how to experiment with those ideas from a CLI

---

## What This Project Teaches

If you are new to tokenization, this repo helps you move through the topic in a practical order.

You will learn:

1. why large language models need tokenization
2. how **BPE** learns merge rules
3. how **WordPiece** learns a vocabulary and uses greedy longest matching
4. how text becomes token IDs
5. how token IDs become text again
6. how training data affects the pieces a tokenizer learns

This project is built in a way that encourages reading the code, not just running it.

---

## Which Tokenizer Should You Study First?

If you are a complete beginner, use this order:

### 1. Start with BPE

Read [bpe/README.md](https://github.com/UtkarshTheDev/tokenizer/blob/main/bpe/README.md) first.

Why?

- BPE is easier to visualize
- it is easier to see repeated pair counting and merging
- it builds intuition for subword tokenization

### 2. Then move to WordPiece

After BPE, read [wordpiece/README.md](https://github.com/UtkarshTheDev/tokenizer/blob/main/wordpiece/README.md).

Why second?

- WordPiece is similar enough to compare with BPE
- but different enough to teach a new way of thinking
- it introduces ideas like `##` continuation pieces and greedy longest-match encoding

### Short comparison

| Method | Main idea | Best beginner mental model |
|---|---|---|
| **BPE** | Learn merge rules | "Keep merging the most frequent adjacent pair." |
| **WordPiece** | Learn a vocabulary of valid pieces | "At each position, take the longest valid piece from the vocabulary." |

---

## Repository Tour

```txt
.
├── bpe/
│   ├── README.md
│   ├── preTokenizer.ts
│   └── tokenizer.ts
├── wordpiece/
│   ├── README.md
│   ├── manualPreTokenizer.ts
│   ├── preTokenizer.ts
│   ├── tokenizer.ts
│   ├── trainHelpers.ts
│   ├── tokenizer.test.ts
│   ├── types.ts
│   ├── wordpiece.excalidraw
│   └── wordpiece.png
├── data/
│   └── data.txt
├── eval/
│   ├── defaultText.ts
│   ├── metrics.ts
│   └── compare.ts
├── index.ts
├── package.json
└── tsconfig.json
```

### What each area is for

**`bpe/`**
- contains the BPE implementation
- contains the detailed BPE teaching guide

**`wordpiece/`**
- contains the WordPiece implementation
- contains the WordPiece teaching guide
- includes both a practical pre-tokenizer and a manual learning version
- includes tests and visual diagram assets

**`data/data.txt`**
- sample corpus used for training from the CLI

**`eval/`**
- contains tokenizer evaluation helpers
- computes metrics like token count, compression ratio, encode/decode time, and unknown-token rate
- compares BPE and WordPiece on the same input text

**`index.ts`**
- the interactive CLI entry point
- the easiest place to experiment with the project

---

## Best Study Path for a Beginner

If you want to learn this repo properly, follow this order.

### Step 1: Read the root README

This file gives you the map of the whole project.

### Step 2: Read the BPE guide

Go to:

- [bpe/README.md](https://github.com/UtkarshTheDev/tokenizer/blob/main/bpe/README.md)

Focus on:

- what a token is
- why BPE starts from bytes
- how merge rules are learned
- how encoding and decoding work

### Step 3: Read the BPE code

Start with:

- [bpe/tokenizer.ts](https://github.com/UtkarshTheDev/tokenizer/blob/main/bpe/tokenizer.ts)

Then:

- [bpe/preTokenizer.ts](https://github.com/UtkarshTheDev/tokenizer/blob/main/bpe/preTokenizer.ts)

### Step 4: Read the WordPiece guide

Go to:

- [wordpiece/README.md](https://github.com/UtkarshTheDev/tokenizer/blob/main/wordpiece/README.md)

Focus on:

- what makes WordPiece different from BPE
- why `##` exists
- how greedy longest-match encoding works
- how WordPiece training builds a vocabulary

### Step 5: Read the WordPiece code

Recommended order:

1. [wordpiece/manualPreTokenizer.ts](https://github.com/UtkarshTheDev/tokenizer/blob/main/wordpiece/manualPreTokenizer.ts)
2. [wordpiece/preTokenizer.ts](https://github.com/UtkarshTheDev/tokenizer/blob/main/wordpiece/preTokenizer.ts)
3. [wordpiece/types.ts](https://github.com/UtkarshTheDev/tokenizer/blob/main/wordpiece/types.ts)
4. [wordpiece/tokenizer.ts](https://github.com/UtkarshTheDev/tokenizer/blob/main/wordpiece/tokenizer.ts)
5. [wordpiece/trainHelpers.ts](https://github.com/UtkarshTheDev/tokenizer/blob/main/wordpiece/trainHelpers.ts)
6. [wordpiece/tokenizer.test.ts](https://github.com/UtkarshTheDev/tokenizer/blob/main/wordpiece/tokenizer.test.ts)

### Step 6: Use the CLI and experiment

Once the mental model is clear, run the CLI and try:

- training on your own text
- training on `data/data.txt`
- encoding known and unknown words
- decoding tokens back into text
- comparing BPE and WordPiece on the same input

---

## Getting Started

This project uses [Bun](https://bun.sh/) as its runtime.

### Install dependencies

```bash
bun install
```

### Run the interactive CLI

```bash
bun run index.ts
```

This opens the project’s main interactive interface.

---

## How To Use the CLI

The CLI supports both **BPE** and **WordPiece**.

When you run it, you can use either:

- the numbered menu
- or direct commands like `bpe`, `wordpiece`, `train`, `encode`, `decode`, `save`, `load`

### Main actions

| Action | What it does |
|---|---|
| `select` or `1` | Choose BPE or WordPiece |
| `train` or `2` | Train on text you type directly |
| `data` or `3` | Train on `data/data.txt` |
| `encode` or `4` | Convert text into token IDs |
| `decode` or `5` | Convert token IDs back into text |
| `save` or `6` | Save the currently active tokenizer model to `models/` |
| `load` or `7` | Load a tokenizer model from `models/` into memory |
| `stats` or `8` | Show training stats |
| `compare` / `eval` or `9` | Compare BPE and WordPiece on the same text |
| `clear` | Clear the terminal |
| `exit` or `quit` | Exit the CLI |
| `bpe` | Switch directly to BPE |
| `wordpiece` / `wp` | Switch directly to WordPiece |

### Typical beginner workflow

#### Explore BPE

```txt
1. Run CLI
2. Type: bpe
3. Type: train
4. Enter some text
5. Choose a vocabulary size
6. Type: encode
7. Try a sentence
8. Type: decode
9. Paste token ids back in
```

#### Explore WordPiece

```txt
1. Run CLI
2. Type: wordpiece
3. Type: data
4. Let it train on data/data.txt
5. Type: encode
6. Try words like:
   - playing
   - player
   - tokenizer
   - playful
7. Type: decode
8. Observe how ## continuation pieces become normal words again
```

### Important CLI note

You must train the currently selected tokenizer before `encode` or `decode` will work.

That means:

- if you switch to BPE, train BPE first
- if you switch to WordPiece, train WordPiece first

Each tokenizer keeps its own learned state in memory while the CLI session is running.

### Save and load models

The CLI can now save and load both tokenizer families.

- `save` writes the **currently active tokenizer** to the `models/` folder
- `load` reads a saved tokenizer file back into memory
- pressing Enter uses the default file name for the active tokenizer:
  - `models/bpe.json`
  - `models/wordpiece.json`

One important design choice in this project:

- loading a model does **not** automatically switch the active tokenizer
- instead, it fills that tokenizer's in-memory slot
- this means you can keep a BPE model and a WordPiece model loaded at the same time during one CLI session

Example:

```txt
1. Active tokenizer is WordPiece
2. Type: load
3. Load a saved BPE model
4. BPE becomes available in memory
5. WordPiece stays active until you switch to BPE yourself
```

This makes experimentation easier because you do not lose the model that is already loaded for the other tokenizer.

### Save and load command examples

#### Save the active tokenizer

```txt
1. Train or load a tokenizer first
2. Type: save
3. Press Enter to use the default file:
   - bpe -> models/bpe.json
   - wordpiece -> models/wordpiece.json
4. Or type a custom name like:
   - my-bpe-model
   - lesson-1-wordpiece.json
```

#### Load a tokenizer model

```txt
1. Type: load
2. Press Enter to load the default file for the active tokenizer
3. Or type a saved file name from models/
4. The CLI loads that tokenizer into memory
5. If it is different from the active tokenizer, the active tokenizer stays unchanged
```

### Compare BPE and WordPiece

The CLI can compare both tokenizer families on the same input text.

Use:

```txt
compare
```

or:

```txt
9
```

Before comparing, you need both tokenizer slots to be ready:

- train or load a BPE model
- train or load a WordPiece model

Then the comparison command asks for text.

- if you type text, the CLI evaluates that text
- if you press Enter, the CLI uses a built-in default evaluation text

The report shows:

- vocabulary size
- token count
- unique token count
- compression ratio
- reduction percentage
- average characters per token
- encode and decode time
- unknown-token count and rate

The comparison uses each tokenizer's own normalization settings. This matters
because a BPE model and a WordPiece model can be trained or loaded with different
normalization configs.

Beginner mental model:

```txt
same text -> BPE metrics
same text -> WordPiece metrics
compare the numbers side by side
```

---

## Programmatic Usage

You can also use the tokenizers directly in code.

### Shared normalization layer

Before either tokenizer starts matching tokens, this project can normalize the
input text into a more predictable form.

The shared normalization pipeline currently supports:

- Unicode normalization with `NFC` or `NFKC`
- optional accent stripping
- lowercasing
- collapsing repeated whitespace
- trimming leading and trailing whitespace

This means the full text flow is now:

```txt
raw text -> normalize -> pre-tokenize -> tokenize
```

Why this matters:

- training and encode can now see the same cleaned text form
- equivalent text can behave more consistently
- the tokenizer code is closer to a real preprocessing pipeline

Example:

```txt
"  Café   WORLD  "
-> normalize
-> "café world"
```

And if accent stripping is enabled:

```txt
"  Café   WORLD  "
-> normalize
-> "cafe world"
```

### BPE usage

```ts
import { decode, encode, train } from "./bpe/tokenizer";

const text = "hello world! hello world!";
const { mergeTable } = train(text, 300);

const encoded = encode("hello world", mergeTable);
const decoded = decode(encoded, mergeTable);
```

### WordPiece usage

```ts
import { decode, encode, train } from "./wordpiece/tokenizer";

const model = train("play playing player played", 18);

const encoded = encode("playing played", model);
const decoded = decode(encoded, model);
```

---

## What Makes This Project Good for Learning

This project is built in a learning-friendly way:

- the BPE code is heavily commented
- the WordPiece code now has beginner-friendly explanations
- both methods have dedicated README guides
- there is a CLI for hands-on exploration
- there is comparison tooling for measuring tokenizer behavior
- WordPiece has tests that act like small executable examples

This means you can learn in three different ways:

1. read the guides
2. read the code
3. run the tokenizer yourself

That combination is what makes the project useful.

---

## Suggested Learning Exercises

If you want to study actively instead of only reading, try these exercises.

### Exercise 1: Compare BPE and WordPiece mentally

Take the word:

```txt
playing
```

Ask:

- how would BPE learn this over time?
- how would WordPiece segment this using a vocabulary?

### Exercise 2: Train on a tiny corpus

Use text like:

```txt
play playing player played
```

Then compare what each tokenizer learns.

### Exercise 3: Try unknown words

In WordPiece, test:

```txt
playful
```

Observe how `[UNK]` appears when the vocabulary cannot fully segment the word.

### Exercise 4: Read the tests

Open:

- [wordpiece/tokenizer.test.ts](https://github.com/UtkarshTheDev/tokenizer/blob/main/wordpiece/tokenizer.test.ts)

and treat each test as a behavior example.

### Exercise 5: Compare both tokenizers

Train or load both BPE and WordPiece, then run:

```txt
compare
```

Try the default evaluation text first. Then try your own text with:

- repeated words
- unknown-looking words
- punctuation
- mixed uppercase/lowercase
- accented words

Watch how token count, compression ratio, and WordPiece unknown rate change.

---

## Where To Go Next

Once you understand this repo, good next topics are:

- WordPiece scoring strategies in more depth
- Unigram tokenization
- SentencePiece
- Unicode-aware tokenization
- vocabulary serialization and loading
- production tokenization performance

But first, make sure you really understand:

- what a token is
- how BPE learns merges
- how WordPiece learns a vocabulary
- why encoding and decoding are different

Those ideas are the foundation.

---

## Quick Links

- BPE guide: [bpe/README.md](https://github.com/UtkarshTheDev/tokenizer/blob/main/bpe/README.md)
- WordPiece guide: [wordpiece/README.md](https://github.com/UtkarshTheDev/tokenizer/blob/main/wordpiece/README.md)
- CLI entry point: [index.ts](https://github.com/UtkarshTheDev/tokenizer/blob/main/index.ts)
- sample corpus: [data/data.txt](https://github.com/UtkarshTheDev/tokenizer/blob/main/data/data.txt)
- contributing guide: [CONTRIBUTING.md](https://github.com/UtkarshTheDev/tokenizer/blob/main/CONTRIBUTING.md)
- license: [LICENSE](https://github.com/UtkarshTheDev/tokenizer/blob/main/LICENSE)

---

<p align="center">
  <b>Best way to use this repo:</b> read a guide, open the matching code, then try it in the CLI.
</p>

<p align="center">
  Made with love by <b>Utkarsh</b>. Contributions are welcome.
</p>
