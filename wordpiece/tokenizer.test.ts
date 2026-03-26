import { describe, expect, test } from "bun:test";
import { model } from "./types";
import preTokenize from "./preTokenizer";
import { decode, encode } from "./tokenizer";

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
