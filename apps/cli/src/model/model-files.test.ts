import { describe, expect, it } from "bun:test";
import {
  buildModelLocation,
  parseModelType,
  writeJsonFile,
} from "./model-files";

describe("model file helpers", () => {
  it("uses the active tokenizer default file on empty input", () => {
    expect(buildModelLocation("wordpiece", "")).toBe("models/wordpiece.json");
    expect(buildModelLocation("bpe", "")).toBe("models/bpe.json");
  });

  it("adds a json extension when missing", () => {
    expect(buildModelLocation("wordpiece", "custom-model")).toBe(
      "models/custom-model.json"
    );
  });

  it("rejects path traversal and nested paths", () => {
    expect(() => buildModelLocation("wordpiece", "../secret")).toThrow();
    expect(() => buildModelLocation("wordpiece", "..\\secret")).toThrow();
    expect(() => buildModelLocation("wordpiece", "nested/model")).toThrow();
    expect(() => buildModelLocation("wordpiece", "nested\\model")).toThrow();
  });

  it("parses supported model types from JSON-like values", () => {
    expect(parseModelType({ type: "bpe" })).toBe("bpe");
    expect(parseModelType({ type: "wordpiece" })).toBe("wordpiece");
    expect(parseModelType({ type: "other" })).toBeUndefined();
    expect(parseModelType(null)).toBeUndefined();
  });

  it("rejects absolute paths when writing JSON files", () => {
    expect(() =>
      writeJsonFile("/tmp", "/tmp/escape.json", { ok: true })
    ).toThrow("relative");
  });
});
