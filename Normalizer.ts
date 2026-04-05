export interface NormalizationConfig {
  lowercase: boolean;
}

export const DEFAULT_NORMALIZATION_CONFIG: NormalizationConfig = {
  lowercase: true,
};

export const normalizeText = (
  text: string,
  config: NormalizationConfig = DEFAULT_NORMALIZATION_CONFIG,
): string => {
  if (config.lowercase === true) {
    text = text.toLowerCase();
  }
  return text;
};
