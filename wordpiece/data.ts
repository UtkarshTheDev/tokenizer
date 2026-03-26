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

export interface WordPieceModel {
  tokenToId: Map<string, number>;
  idToToken: string[];
  unkToken: string;
}

export const model: WordPieceModel = {
  tokenToId,
  idToToken,
  unkToken: "[UNK]",
};
