/**
 * Shared normalization settings used by both tokenizer families.
 *
 * These options describe text cleanup that happens *before* pre-tokenization
 * and token matching. Keeping the config in one place helps training, encode,
 * save, and load stay consistent.
 */
export interface NormalizationConfig {
  unicodeForm?: "NFC" | "NFKC";
  stripAccents?: boolean;
  lowercase?: boolean;
  collapseWhitespace?: boolean;
  trimWhitespace?: boolean;
}

// These defaults aim for predictable, beginner-friendly behavior.
// They intentionally normalize text into a stable lowercase form, collapse
// repeated whitespace, and trim the edges of the final string.
export const DEFAULT_NORMALIZATION_CONFIG: NormalizationConfig = {
  unicodeForm: "NFC",
  stripAccents: false,
  lowercase: true,
  collapseWhitespace: true,
  trimWhitespace: true,
};

/**
 * Normalize raw text before tokenization.
 *
 * Order matters:
 * 1. Unicode normalization makes equivalent text forms consistent
 * 2. Accent stripping optionally removes combining accent marks
 * 3. Lowercasing makes matching more stable for lowercase vocabularies
 * 4. Whitespace cleanup makes spacing predictable
 */
export const normalizeText = (
  text: string,
  config: NormalizationConfig = DEFAULT_NORMALIZATION_CONFIG,
): string => {
  if (config.unicodeForm) {
    text = text.normalize(config.unicodeForm);
  }
  if (config.stripAccents) {
    // NFD decomposes characters like "é" into "e" + a combining accent mark.
    // We then remove the combining marks to keep only the base characters.
    const unicodeForm = config.unicodeForm ?? DEFAULT_NORMALIZATION_CONFIG.unicodeForm;
    text = text
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .normalize(unicodeForm);
  }
  if (config.lowercase === true) {
    text = text.toLowerCase();
  }
  if (config.collapseWhitespace === true) {
    text = text.replace(/\s+/g, " ");
  }
  if (config.trimWhitespace === true) {
    text = text.trim();
  }
  return text;
};
