# Contributing to Tokenizer 101 - For Begginers

Thank you for wanting to contribute.

This project is built first for learning, clarity, and experimentation. The best contributions are the ones that make the repository easier to understand, easier to run, or more useful for beginners.

---

## What Kind of Contributions Are Welcome?

Contributions are welcome in areas like:

- clearer documentation
- better beginner-friendly explanations
- bug fixes
- more tests
- CLI improvements
- tokenizer improvements that keep the code readable
- new learning material, examples, or diagrams

If you are changing the behavior of a tokenizer, try to keep the explanation quality as high as the code quality.

---

## Before You Start

1. Read the main [README.md](https://github.com/UtkarshTheDev/tokenizer/blob/main/README.md)
2. Read the tokenizer-specific guide you are working on:
   - [bpe/README.md](https://github.com/UtkarshTheDev/tokenizer/blob/main/bpe/README.md)
   - [wordpiece/README.md](https://github.com/UtkarshTheDev/tokenizer/blob/main/wordpiece/README.md)
3. Prefer small, focused pull requests instead of large mixed changes

---

## Project Priorities

When contributing, prefer these priorities:

1. correctness
2. readability
3. beginner-friendly explanations
4. consistency with the existing teaching style
5. performance improvements only when they do not damage clarity

This is not a production tokenizer library first.  
It is a learning project first.

---

## Development Setup

Install dependencies:

```bash
bun install
```

Run the CLI:

```bash
bun run index.ts
```

Run the WordPiece tests:

```bash
bun test wordpiece/tokenizer.test.ts
```

Run a TypeScript check for the WordPiece area:

```bash
bunx tsc --noEmit wordpiece/types.ts wordpiece/trainHelpers.ts wordpiece/tokenizer.ts wordpiece/tokenizer.test.ts wordpiece/preTokenizer.ts wordpiece/manualPreTokenizer.ts
```

If you change BPE behavior, run the relevant checks for BPE too.

---

## Style Guidelines

Please follow these project rules:

- write code that a beginner can read
- prefer simple and direct logic over clever code
- explain important ideas with comments when they are not obvious
- keep documentation aligned with the actual code
- do not add large abstractions unless they clearly improve the project

For documentation:

- write as if you are teaching a beginner
- explain *why* something exists, not only *what* it does
- prefer concrete examples over vague statements

---

## Pull Request Guidelines

A good pull request for this project should:

- have one clear purpose
- explain what changed
- explain why the change helps
- mention any tests you ran

Examples of good PR scopes:

- add a clearer README section
- improve WordPiece training comments
- fix a tokenizer bug and add a test
- improve CLI help text

Examples of bad PR scopes:

- mix refactors, new features, and unrelated docs in one PR
- rewrite everything just for style
- add complexity without improving learning value

---

## Documentation Contributions

Documentation is a first-class part of this project.

If you improve:

- README files
- code comments
- diagrams
- examples

that is a valuable contribution.

Please make sure documentation changes stay:

- accurate
- clear
- consistent with the code

---

## Questions and Discussion

If you are unsure whether a change fits the project, open an issue or a small PR with a clear explanation of the idea.

Small, thoughtful improvements are better than oversized changes.

---

Thanks for contributing to **Tokenizer 101 - For Begginers**.
