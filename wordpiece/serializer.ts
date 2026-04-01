import { reverseIdToToken } from "./trainHelpers";
import { type WordPieceModel, type WordPieceSerializedModel } from "./types";

export const serializeWordpieceModel = (
  model: WordPieceModel,
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
    normalization: { lowercase: true },
  };

  return wordPieceJSON;
};

export const deserializeWordpieceModel = (
  wordPieceJSON: WordPieceSerializedModel,
): WordPieceModel => {
  if (wordPieceJSON.type !== "wordpiece")
    throw new Error(`Invalid Model Type: ${wordPieceJSON.type}`);

  if (wordPieceJSON.continuationPrefix !== "##")
    throw new Error("Invalid Continuation Prefix");

  // When loading, we reconstruct the fast token -> id lookup map that encode()
  // needs at runtime. That map is convenient in memory, but not necessary in JSON.
  const tokenToId = reverseIdToToken(wordPieceJSON.idToToken);

  const model = {
    tokenToId,
    idToToken: wordPieceJSON.idToToken,
    unkToken: wordPieceJSON.unkToken,
  };

  return model;
};
