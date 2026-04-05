export interface NormalizationConfig {
  lowercase: boolean;
  collapseWhitespace: boolean;
}

export const DEFAULT_NORMALIZATION_CONFIG: NormalizationConfig = {
  lowercase: true,
  collapseWhitespace: true,
};

export const normalizeText = (
  text: string,
  config: NormalizationConfig = DEFAULT_NORMALIZATION_CONFIG,
): string => {
  if (config.lowercase === true) {
    text = text.toLowerCase();
  }
  if (config.collapseWhitespace === true) {
    text = text.replace(/\s+/g, " ").trim();
  }
  return text;
};
