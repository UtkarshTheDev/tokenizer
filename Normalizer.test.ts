import { describe, expect, test } from "bun:test";
import {
  DEFAULT_NORMALIZATION_CONFIG,
  normalizeText,
  type NormalizationConfig,
} from "./Normalizer";

describe("normalizeText", () => {
  test("uses the default normalization config", () => {
    expect(normalizeText("  HELLO   WORLD  ")).toBe("hello world");
  });

  test("can collapse whitespace without trimming when trimWhitespace is off", () => {
    const config: NormalizationConfig = {
      lowercase: false,
      collapseWhitespace: true,
      trimWhitespace: false,
    };

    expect(normalizeText("  hello   world  ", config)).toBe(" hello world ");
  });

  test("can trim whitespace without collapsing internal whitespace", () => {
    const config: NormalizationConfig = {
      lowercase: false,
      collapseWhitespace: false,
      trimWhitespace: true,
    };

    expect(normalizeText("  hello   world  ", config)).toBe("hello   world");
  });

  test("normalizes equivalent unicode forms the same way with NFC", () => {
    const config: NormalizationConfig = {
      ...DEFAULT_NORMALIZATION_CONFIG,
      unicodeForm: "NFC",
    };

    const composed = "caf\u00E9";
    const decomposed = "cafe\u0301";

    expect(normalizeText(composed, config)).toBe(
      normalizeText(decomposed, config),
    );
  });

  test("can strip accents when the option is enabled", () => {
    const config: NormalizationConfig = {
      unicodeForm: "NFC",
      stripAccents: true,
      lowercase: false,
      collapseWhitespace: false,
      trimWhitespace: false,
    };

    expect(normalizeText("café naïve résumé", config)).toBe(
      "cafe naive resume",
    );
  });

  test("keeps accents when stripAccents is disabled", () => {
    const config: NormalizationConfig = {
      unicodeForm: "NFC",
      stripAccents: false,
      lowercase: false,
      collapseWhitespace: false,
      trimWhitespace: false,
    };

    expect(normalizeText("café naïve résumé", config)).toBe(
      "café naïve résumé",
    );
  });
});
