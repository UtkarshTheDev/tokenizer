const WHITESPACEPATTERN = /\s/;
export const PUNCTUATIONS = new Set([
  ".",
  ",",
  "!",
  "?",
  ";",
  ":",
  "'",
  '"',
  "(",
  ")",
  "[",
  "]",
  "{",
  "}",
  "-",
  "_",
  "/",
  "\\",
  "@",
  "#",
  "$",
  "%",
  "^",
  "&",
  "*",
  "+",
  "=",
  "<",
  ">",
  "|",
  "~",
  "`",
]);

/**
 * Educational pre-tokenizer.
 *
 * This version keeps the manual pointer-based approach in the codebase so the
 * token boundary logic stays easy to study.
 *
 * Think of this function as a "slow but readable" teaching version:
 * - we move through the string one character at a time
 * - we remember where the current word started
 * - we cut a token whenever we hit punctuation or whitespace
 *
 * It is not the main implementation used by the tokenizer. The regex-based
 * `preTokenizer.ts` file is the practical version. This file exists so a
 * beginner can clearly see how boundaries are detected.
 */
export default function manualPreTokenize(str: string): string[] {
  // `start = -1` means "we are not currently inside a word".
  let start = -1;
  let i = 0;
  const tokens: string[] = [];

  while (i < str.length) {
    const char = str[i];
    if (char === undefined) {
      break;
    }

    if (PUNCTUATIONS.has(char)) {
      // If punctuation appears right after a word, finish the word first.
      if (start !== -1) {
        tokens.push(str.slice(start, i));
        start = -1;
      }

      // Punctuation becomes its own token.
      tokens.push(char);
    } else if (WHITESPACEPATTERN.test(char)) {
      // Whitespace ends the current word, but whitespace itself is ignored.
      if (start !== -1) {
        tokens.push(str.slice(start, i));
        start = -1;
      }
    } else if (start === -1) {
      // We just found the first character of a new word.
      start = i;
    }

    i++;
  }

  // If the string ended while we were still inside a word, flush that word now.
  if (start !== -1) {
    tokens.push(str.slice(start, i));
  }

  return tokens;
}
