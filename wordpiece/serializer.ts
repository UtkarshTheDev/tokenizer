import {
  DEFAULT_NORMALIZATION_CONFIG,
  type NormalizationConfig,
} from "../Normalizer";
import { reverseIdToToken } from "./trainHelpers";
import { type WordPieceModel, type WordPieceSerializedModel } from "./types";

export const serializeWordpieceModel = (
  model: WordPieceModel,
  normalizationConfig: NormalizationConfig = DEFAULT_NORMALIZATION_CONFIG,
): WordPieceSerializedModel => {
  // We save the vocabulary order (`idToToken`) because it is the canonical
  // source of truth. `tokenToId` can be rebuilt from it later.
  const wordPieceJSON: WordPieceSerializedModel = {
    type: "wordpiece",
    description: "Wordpiece tokenizer trained JSON data",
    version: 1,
    idToToken: model.idToToken,
    continuationPrefix: "##",
    unkToken: model.unkToken,
    vocabSize: model.idToToken.length,
    normalization: normalizationConfig,
  };

  return wordPieceJSON;
};

export const deserializeWordpieceModel = (
  wordPieceJSON: WordPieceSerializedModel,
): { model: WordPieceModel; normalizationConfig: NormalizationConfig } => {
  if (wordPieceJSON.type !== "wordpiece")
    throw new Error(`Invalid Model Type: ${wordPieceJSON.type}`);

  if (wordPieceJSON.continuationPrefix !== "##")
    throw new Error("Invalid Continuation Prefix");

  const uniqueTokens = new Set(wordPieceJSON.idToToken);
  if (uniqueTokens.size !== wordPieceJSON.idToToken.length) {
    throw new Error(
      "Invalid idToToken: duplicate token values are not allowed.",
    );
  }

  if (!wordPieceJSON.idToToken.includes(wordPieceJSON.unkToken)) {
    throw new Error(
      "Invalid unkToken: unkToken must exist in idToToken before loading.",
    );
  }

  // When loading, we reconstruct the fast token -> id lookup map that encode()
  // needs at runtime. That map is convenient in memory, but not necessary in JSON.
  const tokenToId = reverseIdToToken(wordPieceJSON.idToToken);

  const model = {
    tokenToId,
    idToToken: wordPieceJSON.idToToken,
    unkToken: wordPieceJSON.unkToken,
  };
  let normalizationConfig = wordPieceJSON.normalization;
  if (normalizationConfig === undefined) {
    normalizationConfig = DEFAULT_NORMALIZATION_CONFIG;
  }

  return { model, normalizationConfig };
};
