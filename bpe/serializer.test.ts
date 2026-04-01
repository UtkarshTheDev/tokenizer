import { describe, expect, it } from "bun:test";
import { decode, encode, train } from "./tokenizer";
import { deserializeBpeModel, serializeBpeModel } from "./serializer";

describe("bpe serialization round-trip", () => {
  it("preserves merge table structure after serialize and deserialize", () => {
    const { mergeTable } = train("banana bandana banana", 270);
    const serialized = serializeBpeModel(mergeTable);
    const loaded = deserializeBpeModel(serialized);

    expect(loaded).toEqual(mergeTable);
  });

  it("preserves encode and decode behavior after round-trip", () => {
    const { mergeTable } = train("banana bandana banana", 270);
    const serialized = serializeBpeModel(mergeTable);
    const loaded = deserializeBpeModel(serialized);
    const text = "banana bandana";

    expect(encode(text, loaded)).toEqual(encode(text, mergeTable));
    expect(decode(encode(text, loaded), loaded)).toBe(text);
  });
});
