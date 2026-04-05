export interface NormalizationConfig {
  unicodeForm?: "NFC" | "NFKC";
  lowercase?: boolean;
  collapseWhitespace?: boolean;
  trimWhitespace?: boolean;
}

export const DEFAULT_NORMALIZATION_CONFIG: NormalizationConfig = {
  lowercase: true,
  collapseWhitespace: true,
  unicodeForm: "NFC",
  trimWhitespace: true,
};

export const normalizeText = (
  text: string,
  config: NormalizationConfig = DEFAULT_NORMALIZATION_CONFIG,
): string => {
  if (config.unicodeForm) {
    text = text.normalize(config.unicodeForm);
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
