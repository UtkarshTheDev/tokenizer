export interface NormalizationConfig {
  unicodeForm?: "NFC" | "NFKC";
  stripAccents?: boolean;
  lowercase?: boolean;
  collapseWhitespace?: boolean;
  trimWhitespace?: boolean;
}

export const DEFAULT_NORMALIZATION_CONFIG: NormalizationConfig = {
  unicodeForm: "NFC",
  stripAccents: false,
  lowercase: true,
  collapseWhitespace: true,
  trimWhitespace: true,
};

export const normalizeText = (
  text: string,
  config: NormalizationConfig = DEFAULT_NORMALIZATION_CONFIG,
): string => {
  if (config.unicodeForm) {
    text = text.normalize(config.unicodeForm);
  }
  if (config.stripAccents) {
    text = text.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
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
