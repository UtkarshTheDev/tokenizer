const URLPATTERN = /https?:\/\/[^\s]+/;
const EMAILPATTERN = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
const CONTRACTIONSPATTERN = /'[sSmMdD](?=\s|$)|n't|'re|'ve|'ll|'d/;
const NUMBERSPATTERN = /\d+\.\d+/;
const INTEGERSPATTERN = /\d+/;
const PUNCTUATIONSPATTERN = /[.,;:!?"'()[\]{}]+/;
const WORDPATTERN = /\w+(?:-\w+)*/;
const WHITESPACEPATTERN = /[\s\S]/;
const SINGLECHARPATTERN = /./;

export default function preTokenize(str: string): number[] {
  const patterns = [
    // 1. URLs
    URLPATTERN,
    // 2. Email
    EMAILPATTERN,
    // 3. Contractions
    CONTRACTIONSPATTERN,
    // 4. Numbers (with decimals)
    NUMBERSPATTERN,
    // 5. Numbers (integers)
    INTEGERSPATTERN,
    // 6. Punctuation (sequences)
    PUNCTUATIONSPATTERN,
    // 7. Words (with hyphens)
    WORDPATTERN,
    // 8. Whitespace
    WHITESPACEPATTERN,
    // 9. Everything else (single char)
    SINGLECHARPATTERN,
  ];

  // Combine into one regex
  const regex = new RegExp(patterns.map((p) => p.source).join("|"), "gu");

  const tokens = str.match(regex)?.filter((t) => t.length > 0) ?? [];
  const bytes: number[] = [];
  for (let i = 0; i < tokens.length; i++) {
    const chunk = tokens[i];
    if (chunk === undefined) {
      break;
    }

    const byte = Array.from(Buffer.from(chunk, "utf-8"));

    if (i < tokens.length - 1) {
      byte.push(-1);
    }

    bytes.push(...byte);
  }
  return bytes;
}
