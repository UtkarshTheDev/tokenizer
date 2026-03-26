const TOKEN_PATTERN =
  /https?:\/\/[^\s]+|[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}|\d+\.\d+|\d+|[A-Za-z]+|[.,!?;:'"()[\]{}\-_/\\@#$%^&*+=<>|~`]/g;

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
