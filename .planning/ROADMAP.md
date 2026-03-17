# Tokenizer Project Roadmap

## Phase 1: Foundation (COMPLETE ✅)
- Basic BPE implementation in TypeScript
- Interactive CLI
- Core train/encode/decode functions

## Phase 2: Deep Understanding (IN PROGRESS 🔄)

### Goal
Build deep understanding of tokenization algorithms used in modern AI systems.

### Plans

#### 2-01: Subword Tokenization Algorithms
- [ ] Research BPE, WordPiece, SentencePiece, Unigram
- [ ] Implement and compare each algorithm
- [ ] Understand tradeoffs between approaches
**Plans:** 1 plan
- [ ] 02-01-PLAN.md — Implement WordPiece + Unigram + Comparison

#### 2-02: Pre-tokenization & Text Normalization
- [ ] Learn how real tokenizers preprocess text
- [ ] Implement regex-based pre-tokenization
- [ ] Handle special characters, unicode, whitespace

**Plans:** 1 plan
- [ ] 02-02-PLAN.md — Pre-tokenizer + Text Normalization

#### 2-03: Special Tokens System
- [ ] Understand BOS, EOS, PAD, UNK, FIM tokens
- [ ] Implement special token handling
- [ ] Study model-specific token schemes (GPT-4, Llama, Claude)

**Plans:** 1 plan
- [ ] 02-03-PLAN.md — Special Tokens + Chat Formats

#### 2-04: Byte-Level BPE
- [ ] Understand byte-level vs word-level BPE
- [ ] Implement byte-level approach
- [ ] Understand why AI companies use this

**Plans:** 1 plan
- [ ] 02-04-PLAN.md — Byte-Level BPE + GPT-2 Compatibility

## Phase 3: Production Features

### Goals
Add production-grade features to make tokenizer useful for real AI applications.

### Plans (To be defined after Phase 2)
- Streaming & large file support
- Vocabulary serialization (JSON export/import)
- Standard encoding compatibility (GPT-2, cl100k_base)
- Performance optimization

---

## Key Learnings Summary

### Why Subword Tokenization?
1. **Word-level**: Too large vocab, can't handle OOV
2. **Char-level**: Too long sequences, no semantic meaning
3. **Subword**: Balance - reasonable vocab, handles OOV, shorter sequences

### Major Algorithms

| Algorithm | Used By | Approach |
|-----------|---------|----------|
| **BPE** | GPT-2/3/4, Llama, Mistral | Merge frequent pairs |
| **WordPiece** | BERT, Electra | Maximize likelihood |
| **Unigram** | T5, Albert | Prune unlikely tokens |
| **SentencePiece** | Many (wrapper) | Language-agnostic |

### What Makes Production Tokenizers Different
1. **Pre-tokenization**: Regex splits before BPE merges
2. **Special tokens**: Model-specific control tokens
3. **Byte-level**: Never have unknown tokens
4. **Normalization**: Unicode, case, whitespace handling
5. **Performance**: Rust/C++ implementations
