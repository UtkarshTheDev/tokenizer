/**
 * This is the model object used by the WordPiece tokenizer.
 *
 * We keep both directions of lookup because encode and decode need opposite
 * operations:
 * - `tokenToId` lets us turn token strings like `"##ing"` into integers
 * - `idToToken` lets us turn integers back into token strings
 *
 * `unkToken` stores the special token used when a word cannot be segmented
 * with the current vocabulary.
 */
export interface WordPieceModel {
  tokenToId: Map<string, number>;
  idToToken: string[];
  unkToken: string;
}

// This sample model is intentionally tiny. It exists for learning, examples,
// and tests. A real trained model would usually have a much larger vocabulary.
const tokenToId = new Map([
  ["[UNK]", 0],
  ["play", 1],
  ["##ing", 2],
  ["##er", 3],
  ["##ed", 4],
  ["hello", 5],
  ["world", 6],
  ["!", 7],
  [",", 8],
  [".", 9],
  ["token", 10],
  ["##s", 11],
  ["##ize", 12],
  ["##izer", 13],
]);

const idToToken = [
  "[UNK]",
  "play",
  "##ing",
  "##er",
  "##ed",
  "hello",
  "world",
  "!",
  ",",
  ".",
  "token",
  "##s",
  "##ize",
  "##izer",
];

export const model: WordPieceModel = {
  tokenToId,
  idToToken,
  unkToken: "[UNK]",
};

interface NormalizationConfig {
  lowercase: boolean;
}

export interface WordPieceSerializedModel {
  type: "wordpiece";
  description?: string;
  version: number;
  normalization?: NormalizationConfig;
  continuationPrefix: string;
  unkToken: string;
  vocabSize?: number;
  idToToken: string[];
  notes?: string;
}
