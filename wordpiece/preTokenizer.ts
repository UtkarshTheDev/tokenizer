/**
 * This file contains the "practical" WordPiece pre-tokenizer.
 *
 * Why keep a separate practical version?
 * The manual pointer-based version in `manualPreTokenizer.ts` is easier to
 * learn from, but a regex is shorter and more convenient for the real pipeline.
 *
 * The pattern below recognizes a few common chunk types:
 * 1. URLs
 * 2. Email addresses
 * 3. Decimal numbers
 * 4. Integers
 * 5. Plain words
 * 6. Standalone punctuation
 *
 * The order matters. For example, a URL must be matched before punctuation,
 * otherwise `https://example.com` would be split into many small pieces.
 */
const URL_PATTERN = String.raw`https?:\/\/[^\s]*[^\s.,!?;:'"()[\]{}]`;
const EMAIL_PATTERN =
  String.raw`[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}`;
const DECIMAL_PATTERN = String.raw`\d+\.\d+`;
const INTEGER_PATTERN = String.raw`\d+`;
const WORD_PATTERN = String.raw`[A-Za-z]+`;
// This uses a normal string instead of a template literal so the backtick can
// safely appear inside the punctuation character class.
const PUNCTUATION_PATTERN =
  "[.,!?;:'\"()[\\]{}\\-_/\\\\@#$%^&*+=<>|~`]";

const TOKEN_PATTERN = new RegExp(
  [
    URL_PATTERN,
    EMAIL_PATTERN,
    DECIMAL_PATTERN,
    INTEGER_PATTERN,
    WORD_PATTERN,
    PUNCTUATION_PATTERN,
  ].join("|"),
  "g",
);

/**
 * Main WordPiece pre-tokenizer.
 *
 * This is the practical implementation that splits text into word-like chunks
 * and standalone punctuation tokens. Whitespace is skipped.
 *
 * For the pointer-based learning version, see `manualPreTokenizer.ts`.
 */
export default function preTokenize(str: string): string[] {
  return str.match(TOKEN_PATTERN) ?? [];
}
