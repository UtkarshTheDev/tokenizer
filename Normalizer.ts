export interface NormalizationConfig {
  lowercase: boolean;
  collapseWhitespace: boolean;
  unicodeForm?: "NFC" | "NKFC";
}

export const DEFAULT_NORMALIZATION_CONFIG: NormalizationConfig = {
  lowercase: true,
  collapseWhitespace: true,
  unicodeForm: "NFC",
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
    text = text.replace(/\s+/g, " ").trim();
  }
  return text;
};
