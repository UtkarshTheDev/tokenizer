import { describe, expect, test } from "bun:test";
import { model } from "./types";
import preTokenize from "./preTokenizer";
import { decode, encode } from "./tokenizer";
import {
  deserializeWordpieceModel,
  serializeWordpieceModel,
} from "./serializer";

// These tests are intentionally small and concrete.
// They are not only checking correctness; they also act as executable examples
// of how the current WordPiece implementation is expected to behave.

describe("wordpiece pre-tokenizer", () => {
  test("splits words and punctuation", () => {
    expect(preTokenize("playing, tokenizers!")).toEqual([
      "playing",
      ",",
      "tokenizers",
      "!",
    ]);
  });

  test("keeps trailing punctuation separate from urls", () => {
    expect(preTokenize("http://example.com!")).toEqual([
      "http://example.com",
      "!",
    ]);
  });
});

describe("wordpiece encode", () => {
  test("encodes known text to ids", () => {
    expect(encode("playing!", model)).toEqual([1, 2, 7]);
  });

  test("normalizes uppercase input before encoding", () => {
    expect(encode("Playing!", model)).toEqual([1, 2, 7]);
  });

  test("encodes unknown text as [UNK]", () => {
    expect(encode("playful!", model)).toEqual([0, 7]);
  });

  test("encodes multi-piece words", () => {
    expect(encode("tokenizers", model)).toEqual([10, 13, 11]);
  });
});

describe("wordpiece decode", () => {
  test("decodes token ids back into text", () => {
    expect(decode([1, 2, 7], model)).toBe("playing!");
  });

  test("decodes multi-piece ids into one word", () => {
    expect(decode([10, 13, 11], model)).toBe("tokenizers");
  });
});

describe("wordpiece round-trip", () => {
  test("round-trips mixed punctuation text", () => {
    const encoded = encode("playing, tokenizers!", model);

    expect(decode(encoded, model)).toBe("playing, tokenizers!");
  });

  test("round-trips unknown words as [UNK]", () => {
    const encoded = encode("playful!", model);

    expect(decode(encoded, model)).toBe("[UNK]!");
  });
});

describe("wordpiece serialization round-trip", () => {
  test("preserves important model structure after serialize and deserialize", () => {
    const serialized = serializeWordpieceModel(model);
    const loaded = deserializeWordpieceModel(serialized);
    const loadedModel = loaded.model;

    expect(loadedModel.unkToken).toBe(model.unkToken);
    expect(loadedModel.idToToken).toEqual(model.idToToken);
    expect(loadedModel.idToToken[0]).toBe("[UNK]");
    expect(loadedModel.tokenToId.get("play")).toBe(model.tokenToId.get("play"));
    expect(loadedModel.tokenToId.get("##ing")).toBe(
      model.tokenToId.get("##ing"),
    );
    expect(loaded.normalizationConfig).toEqual(
      serialized.normalization ?? { lowercase: true },
    );
  });

  test("preserves encode behavior after serialize and deserialize", () => {
    const serialized = serializeWordpieceModel(model);
    const loadedModel = deserializeWordpieceModel(serialized).model;

    expect(encode("playing, tokenizers!", loadedModel)).toEqual(
      encode("playing, tokenizers!", model),
    );
    expect(encode("playful!", loadedModel)).toEqual(
      encode("playful!", model),
    );
  });

  test("preserves decode behavior after serialize and deserialize", () => {
    const serialized = serializeWordpieceModel(model);
    const loadedModel = deserializeWordpieceModel(serialized).model;
    const tokenIds = [1, 2, 8, 10, 13, 11, 7];

    expect(decode(tokenIds, loadedModel)).toBe(decode(tokenIds, model));
  });

  test("rejects duplicate tokens in idToToken during deserialize", () => {
    const serialized = serializeWordpieceModel(model);

    expect(() =>
      deserializeWordpieceModel({
        ...serialized,
        idToToken: ["[UNK]", "play", "play"],
      }),
    ).toThrow("idToToken");
  });

  test("rejects unkToken values that are missing from idToToken", () => {
    const serialized = serializeWordpieceModel(model);

    expect(() =>
      deserializeWordpieceModel({
        ...serialized,
        unkToken: "[MISSING]",
      }),
    ).toThrow("unkToken");
  });
});
