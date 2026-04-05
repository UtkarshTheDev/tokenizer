import { describe, expect, it } from "bun:test";
import { DEFAULT_NORMALIZATION_CONFIG } from "../Normalizer";
import { decode, encode, train } from "./tokenizer";
import { deserializeBpeModel, serializeBpeModel } from "./serializer";

describe("bpe serialization round-trip", () => {
  it("preserves merge table structure after serialize and deserialize", () => {
    const normalizationConfig = {
      ...DEFAULT_NORMALIZATION_CONFIG,
      trimWhitespace: false,
    };
    const { mergeTable } = train(
      "banana bandana banana",
      270,
      normalizationConfig,
    );
    const serialized = serializeBpeModel(mergeTable, normalizationConfig);
    const loaded = deserializeBpeModel(serialized);

    expect(loaded.mergeTable).toEqual(mergeTable);
    expect(loaded.normalizationConfig).toEqual(
      serialized.normalization ?? DEFAULT_NORMALIZATION_CONFIG,
    );
  });

  it("preserves encode and decode behavior after round-trip", () => {
    const normalizationConfig = {
      ...DEFAULT_NORMALIZATION_CONFIG,
      collapseWhitespace: false,
    };
    const { mergeTable } = train(
      "banana bandana banana",
      270,
      normalizationConfig,
    );
    const serialized = serializeBpeModel(mergeTable, normalizationConfig);
    const loaded = deserializeBpeModel(serialized);
    const text = "banana bandana";

    expect(
      encode(text, loaded.mergeTable, loaded.normalizationConfig),
    ).toEqual(encode(text, mergeTable, normalizationConfig));
    expect(
      decode(
        encode(text, loaded.mergeTable, loaded.normalizationConfig),
        loaded.mergeTable,
      ),
    ).toBe(
      text,
    );
  });
});
