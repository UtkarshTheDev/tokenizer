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
 * token boundary logic stays easy to study. It is not the main implementation.
 */
export default function manualPreTokenize(str: string): string[] {
  let start = -1;
  let i = 0;
  const tokens: string[] = [];

  while (i < str.length) {
    const char = str[i];
    if (char === undefined) break;

    if (PUNCTUATIONS.has(char)) {
      if (start !== -1) {
        tokens.push(str.slice(start, i));
        start = -1;
      }
      tokens.push(char);
    } else if (/\s/.test(char)) {
      if (start !== -1) {
        tokens.push(str.slice(start, i));
        start = -1;
      }
    } else if (start === -1) {
      start = i;
    }

    i++;
  }

  if (start !== -1) {
    tokens.push(str.slice(start, i));
  }

  return tokens;
}
