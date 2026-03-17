# Tokenizer Deep Dive - Research Document

## Table of Contents
1. [Why Subword Tokenization?](#why-subword-tokenization)
2. [BPE: Byte-Pair Encoding](#bpe-byte-pair-encoding)
3. [WordPiece](#wordpiece)
4. [Unigram Language Model](#unigram-language-model)
5. [SentencePiece](#sentencepiece)
6. [Pre-tokenization: The Secret Sauce](#pre-tokenization-the-secret-sauce)
7. [Special Tokens](#special-tokens)
8. [Byte-Level BPE](#byte-level-bpe)
9. [Industry Implementations](#industry-implementations)

---

## Why Subword Tokenization?

### The Problem

| Level | Pros | Cons |
|-------|------|------|
| **Word** | Semantic meaning | Massive vocabulary (millions), OOV words |
| **Character** | Small vocab (26 letters) | Very long sequences, no semantic meaning |
| **Subword** | Balance! | ✅ Reasonable vocab, handles OOV, shorter sequences |

### Key Insight
Subword tokenization finds the **optimal vocabulary** that:
- Keeps common words intact ("the", "is", "hello")
- Breaks rare words into meaningful pieces ("tokenization" → "token" + "ization")
- Never has "unknown" tokens (every word can be decomposed)

---

## BPE: Byte-Pair Encoding

### History
- Originated as a **data compression algorithm** (1994)
- Adopted for NLP by Sennrich et al. (2016)
- Used by: **GPT-2, GPT-3, GPT-4, Llama, Mistral, Qwen**

### Algorithm

```
1. START: Tokenize text into individual characters
2. COUNT: Count frequency of all adjacent pairs
3. MERGE: Replace most frequent pair with single token
4. REPEAT: Until vocabulary reaches target size
```

### Example

```
Text: "aaabdaaabac"

Step 1 - Character tokenization:
a a a b d a a b a c
(4 "aa" pairs, 2 "ab", 2 "aa", 1 "bd", 1 "ac")

Step 2 - Most frequent pair: "aa" (4 times)
Merge "aa" → "Z"
Tokenization: Z Z b d Z Z b a c

Step 3 - Continue merging...
Final: Vocabulary includes "Z", "b", "d", "c"
```

### Your Current Implementation
✅ You have a working BPE!
- Starts with 256 UTF-8 bytes
- Merges frequent pairs
- Creates new token IDs (256, 257, 258...)

---

## WordPiece

### Used By
- **BERT**, **Electra**, **DevBERT**, etc.

### Key Difference from BPE

| BPE | WordPiece |
|-----|-----------|
| Merges most **frequent** pair | Merges pair that **maximizes likelihood** |
| Greedy: takes top pair | Probabilistic: considers what improves language model |

### Algorithm

```
1. Start with all characters in vocabulary
2. For each possible pair, compute:
   Score = log P(word) - log P(pair)
   
   Where P(word) = probability from language model
3. Merge pair with highest score
4. Repeat
```

### Why It Works
WordPiece prefers merges that:
- Form complete words ("unning" > "un" + "ning")
- Improve language model likelihood
- Handle rare words gracefully

---

## Unigram Language Model

### Used By
- **T5**, **ALBERT**, **mBART**, **Japanese models**

### Different Approach (Reverse of BPE!)

```
BPE: Start small → Add merges → Target vocab
Unigram: Start large → Remove tokens → Target vocab
```

### Algorithm

```
1. Start with large vocabulary (all substrings)
2. Compute loss for each token
3. Remove tokens that increase loss the least
4. Repeat until target vocab size
```

### Advantage
- Better at removing redundant tokens
- More optimal vocabulary selection
- Used for languages with complex morphology

---

## SentencePiece

### What It Is
**NOT** a tokenization algorithm - it's a **framework/wrapper**!

### Key Features
1. **Language-agnostic**: No language-specific preprocessing
2. **Treats whitespace as a character**: "hello world" → "hello▁world"
3. **Direct training on raw text**: No pre-tokenization needed
4. **Supports BPE or Unigram**: You choose the algorithm

### Why It Matters
- Works for any language (Japanese, Chinese, Arabic)
- No need for tokenizers trained per language
- Used by: **T5, mBART, XLNet, MarianMT**

---

## Pre-tokenization: The Secret Sauce

### What Is It?
Before BPE/WordPiece runs, text is **pre-split** into chunks.

### Why Needed?
1. Prevent tokens from crossing word boundaries
2. Handle punctuation correctly
3. Keep numbers, URLs, code as units

### GPT-2 Pre-tokenizer Example

```python
from transformers import AutoTokenizer
tok = AutoTokenizer.from_pretrained("gpt2")

tok.pre_tokenize_str("Hello, world! It's 2024.")
# Results:
# [('Hello', (0, 5)), 
#  (',', (5, 6)), 
#  ('▁world', (6, 12)),  # Note: leading space!
#  ('!', (12, 13)), 
#  ("▁It's", (14, 18)), 
#  ('▁2024', (19, 23)), 
#  ('.', (23, 24))]
```

### Common Patterns

| Pattern | Example Input | Pre-tokenized |
|---------|---------------|---------------|
| Whitespace | "hello world" | ["hello", "world"] |
| Punctuation | "hello, world!" | ["hello", ",", "world", "!"] |
| Contractions | "don't" | ["don", "'", "t"] |
| Numbers | "123.456" | ["123.456"] or ["123", ".", "456"] |

### The Regex Patterns (GPT-4 / cl100k_base)

```python
# Simplified version of GPT-4 pre-tokenizer
pattern = r"""'[sSmMdD]| (?=[!'"(),.:;?])|
(?<!'[0-9])[0-9]+|
 ?[^\s!'"(),.:;?]+|
\s+(?!$)|
\s+"""

# What it captures:
# - Contractions: 's, 'm, 'd
# - Whitespace before punctuation
# - Numbers
# - Regular words
# - Multiple spaces
```

---

## Special Tokens

### Why Special Tokens?

| Token | Purpose | Example |
|-------|---------|---------|
| `<pad>` | Padding sequences to same length | Batch processing |
| `<bos>` / `<s>` | Beginning of sequence | Tell model where input starts |
| `<eos>` / `</s>` | End of sequence | Tell model where output ends |
| `<unk>` | Unknown token | Handle OOV words |
| `<|im_start|>` | Chat format (OpenAI) | Assistant messages |
| `<|im_end|>` | Chat format (OpenAI) | End of message |
| `<|file_separator|>` | Document separators | Multiple documents |
| `<\|fim_prefix\|>` | Fill-in-the-middle | Code completion |
| `<\|fim_middle\|>` | Fill-in-the-middle | Code completion |
| `<\|fim_suffix\|>` | Fill-in-the-middle | Code completion |

### GPT-4 Chat Format Example

```
<|im_start|>system
You are a helpful assistant.<|im_end|>
<|im_start|>user
Hello!<|im_end|>
<|im_start|>assistant
Hi! How can I help you?<|im_end|>
```

### Claude Chat Format Example

```
\n\nHuman: Hello\n\n
Assistant: Hi! How can I help you?\n\n
```

### How to Handle During Training

1. **Add to vocabulary** during training
2. **Reserve token IDs** at known positions
3. **Never split** special tokens in pre-tokenization

---

## Byte-Level BPE

### The Innovation
Instead of characters (a, b, c), work with **UTF-8 bytes** (0-255).

### Why Byte-Level?

| Approach | Unknown Tokens? |
|----------|----------------|
| Word-level BPE | YES - words not in vocab |
| Character-level BPE | NO - all chars known |
| **Byte-level BPE** | **NO** - all bytes known! |

### How It Works

```
Text: "hello 🌍"
UTF-8 bytes: [104, 101, 108, 108, 111, 32, 240, 159, 140, 141]

# Emoji "🌍" = 4 bytes in UTF-8!
# Can be split if needed: "240,159,140,141" → mergeable
```

### Advantage
- **Zero unknown tokens** - every possible text can be tokenized
- Works for **any language** - Chinese, Arabic, Hindi, emoji
- **Multilingual** - same tokenizer works everywhere

### Used By
- **GPT-4** (cl100k_base encoding)
- **GPT-3.5** (r50k_base)
- **Llama 3** (new BPE with expanded vocab)
- **Mistral** (BPE)

---

## Industry Implementations

### tiktoken (OpenAI)
```
- Language: Python + Rust
- Stars: 17,500+
- Used by: GPT-4, GPT-3.5, CodeChat
- Supports: Training + Inference
- Special: Optimized regex pre-tokenization
```

### HuggingFace tokenizers
```
- Language: Rust (core) + Python
- Stars: 9,700+
- Used by: Most HuggingFace models
- Supports: BPE, WordPiece, Unigram
- Special: Very fast, production-ready
```

### minbpe (Karpathy)
```
- Language: Python
- Author: Andrej Karpathy
- Focus: Clean, educational code
- Supports: Training + Inference
- Special: Very readable implementation
```

### rustbpe (Karpathy)
```
- Language: Rust + Python bindings
- Focus: Fast training (what tiktoken lacks)
- Special: Direct export to tiktoken format
- New: Released Jan 2026
```

### Tokenizers.io
```
- Web-based tokenizer playground
- Supports: Claude, GPT-4, Gemini, Llama
- Free to use
```

---

## Quick Reference: Which Tokenizer Uses What?

| Model | Tokenizer | Algorithm | Vocab Size |
|-------|-----------|-----------|------------|
| GPT-2 | gpt2 | BPE | 50,257 |
| GPT-3 | r50k_base | BPE | 50,257 |
| GPT-4 | cl100k_base | BPE | 200,000 |
| GPT-4o | o200k_base | BPE | ~200,000 |
| Claude 2.1 | proprietary | Unknown | ~100k |
| Llama 2 | llama | BPE | 32,000 |
| Llama 3 | llama3 | BPE | 128,000 |
| BERT | bert-base | WordPiece | 30,522 |
| T5 | t5 | Unigram | 32,100 |
| Mistral | mistral | BPE | 32,000 |

---

## Next Steps for Learning

1. **Implement WordPiece** - Compare to your BPE
2. **Add pre-tokenization** - Make it more like GPT-2
3. **Add special tokens** - Handle BOS, EOS, PAD
4. **Implement byte-level** - Handle any text

---

## References

- [HuggingFace Tokenizer Docs](https://huggingface.co/docs/transformers/tokenizer_summary)
- [OpenAI tiktoken](https://github.com/openai/tiktoken)
- [Karpathy minbpe](https://github.com/karpathy/minbpe)
- [SentencePiece](https://github.com/google/sentencepiece)
- [BPE Paper (Sennrich 2016)](https://arxiv.org/abs/1508.07909)
