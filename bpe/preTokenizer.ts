export default function preTokenize(str: string) {
    const patterns = [
        // 1. URLs
        /https?:\/\/[^\s]+/,
        // 2. Email
        /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/,
        // 3. Contractions
        /'[sSmMdD](?=\s|$)|n't|'re|'ve|'ll|'d/,
        // 4. Numbers (with decimals)
        /\d+\.\d+/,
        // 5. Numbers (integers)
        /\d+/,
        // 6. Punctuation (sequences)
        /[.,;:!?"'()[\]{}]+/,
        // 7. Words (with hyphens)
        /\w+(?:-\w+)*/,
        // 8. Whitespace
        /\s+/,
        // 9. Everything else (single char)
        /./,
    ];

    // Combine into one regex
    const regex = new RegExp(patterns.map((p) => p.source).join("|"), "g");

    const tokens = str.match(regex)?.filter((t) => t.length > 0) ?? [];
    const bytes: number[] = [];
    for (let i = 0; i < tokens.length; i++) {
        const chunk = tokens[i];
        if (chunk === undefined) break;

        const byte = Array.from(Buffer.from(chunk, "utf-8"));

        if (i < tokens.length - 1) {
            byte.push(-1);
        }

        bytes.push(...byte);
    }
    return bytes;
}
