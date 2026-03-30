import { reverseIdToToken } from "./trainHelpers";
import { type WordPieceModel, type WordPieceSerializedModel } from "./types";

export const serializeWordpieceModel = (
  model: WordPieceModel,
): WordPieceSerializedModel => {
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

  const tokenToId = reverseIdToToken(wordPieceJSON.idToToken);

  const model = {
    tokenToId,
    idToToken: wordPieceJSON.idToToken,
    unkToken: wordPieceJSON.unkToken,
  };

  return model;
};
