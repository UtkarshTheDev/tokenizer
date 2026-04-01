/**
 * Byte-Pair Encoding (BPE) Tokenizer
 *
 * What is BPE?
 * Instead of treating every word as a token (which creates a massive vocabulary) or
 * every character as a token (which makes sequences too long), BPE finds a middle ground.
 * It starts with characters (bytes) and repeatedly merges the most frequently occurring
 * adjacent pair into a new, single token.
 *
 * Beginner's Guide to this implementation:
 * 1. Tokens: We represent tokens as numbers. 0-255 are standard UTF-8 bytes.
 * 2. Pairs: We need to count pairs of tokens (e.g., token 65 next to token 32).
 * 3. Bit-packing: To efficiently store pairs like [65, 32], we pack them into a single 32-bit integer:
 *    `(65 << 16) | 32`. This is much faster than using strings like "65-32".
 * 4. Merging: We find the most frequent pair, coin a new token ID (e.g., BaseVocabSize), and replace
 *    all occurrences of the pair with the new ID.
 */

import preTokenize from "./preTokenizer";

// A tuple representing [pairKey, new_token_id]
export type Merge = [number, number];
export type MergeTable = Merge[];
export const BaseVocabSize = 256;

export interface TrainingResult {
  mergeTable: MergeTable;
  tokens: number[];
}

/**
 * Finds the most frequently occurring adjacent pair of tokens in an array.
 *
 * @param tokens - Array of current tokens
 * @returns A tuple of [maxCount, pairKey], where pairKey is the bit-packed representation of the pair.
 */
function findMostFrequentPair(tokens: number[]): [number, number] {
  const stats = new Map<number, number>();
  let maxPair: number = 0;
  let maxCount: number = 0;

  // We iterate up to the second-to-last element because we're looking at pairs (i, i+1)
  for (let i = 0; i + 1 < tokens.length; i++) {
    const num1 = tokens[i];
    const num2 = tokens[i + 1];

    // If we hit undefined, we've reached the end of valid data in the array.
    if (num1 === undefined || num2 === undefined) break;
    if (num1 === -1 || num2 === -1) continue;

    // Bit-pack the two 16-bit tokens into a single 32-bit number for fast Map lookup.
    // Example: num1 = 65, num2 = 32 ==> pair = (65 << 16) | 32
    const pair = (num1 << 16) | num2;

    // Increment the count for this pair
    const count = (stats.get(pair) ?? 0) + 1;

    // Keep track of the absolute maximum we've seen so far
    if (count > maxCount) {
      maxPair = pair;
      maxCount = count;
    }

    stats.set(pair, count);
  }

  return [maxCount, maxPair];
}

/**
 * Sweeps through the tokens array and replaces all non-overlapping occurrences of the target pair
 * with the new token ID.
 *
 * @param tokens - The array of current tokens
 * @param pairKey - The bit-packed representation of the pair to replace
 * @param newToken - The new token ID to insert
 * @returns A new array of tokens with the replacements made
 */
function replacePair(
  tokens: number[],
  pairKey: number,
  newToken: number,
): number[] {
  const newTokens: number[] = [];

  // Unpack the 32-bit integer back into the original two tokens
  const pair1 = pairKey >> 16;
  const pair2 = pairKey & 0xffff; // 0xffff masks out the upper 16 bits, leaving only the lower 16 bits

  let i = 0;
  const length = tokens.length;

  while (i < length) {
    const num1 = tokens[i];
    const num2 = tokens[i + 1];

    if (num1 === undefined) break;

    // If we find our target pair, replace it with the new token and skip ahead by 2
    if (num1 === pair1 && num2 === pair2) {
      newTokens.push(newToken);
      i += 2;
    } else if (num1 === -1 || num2 === -1) {
      newTokens.push(num1);
      i += 1;
    } else {
      // Otherwise, keep the current token and move ahead by 1
      newTokens.push(num1);
      i += 1;
    }
  }

  return newTokens;
}

/**
 * Trains a BPE tokenizer on the given UTF-8 text.
 *
 * @param text - The raw text to train on
 * @param targetVocabSize - The desired total vocabulary size (must be >= BaseVocabSize)
 * @returns An object containing the learned merge table and the final compressed tokens
 */
export function train(text: string, targetVocabSize: number): TrainingResult {
  if (targetVocabSize < BaseVocabSize) {
    throw new Error(
      "Target vocabulary size must be at least BaseVocabSize (base UTF-8 size).",
    );
  }

  // Concept: A string is just a sequence of bytes. In JS, Buffer.from converts a string
  // into its raw UTF-8 byte representation (0-255). We start with these raw bytes as our initial tokens.

  const iterations = targetVocabSize - BaseVocabSize;
  const mergeTable: MergeTable = [];
  let tokens: number[] = preTokenize(text);

  // The core BPE loop
  for (let i = 0; i < iterations; i++) {
    // Step 1: Find the most frequent pair
    const [maxCount, pairKey] = findMostFrequentPair(tokens);

    // If no pair occurs more than once, we cannot compress further. Stop early.
    if (maxCount < 2) break;

    // Step 2: Mint a new token ID. Since 0-255 are taken, we start at BaseVocabSize.
    const newToken = i + BaseVocabSize;

    // Step 3: Replace all occurrences of the pair with the new ID
    tokens = replacePair(tokens, pairKey, newToken);

    // Step 4: Record this merge rule so we can use it to encode/decode later
    mergeTable.push([pairKey, newToken]);
  }

  return { mergeTable, tokens };
}

/**
 * Encodes a string into an array of BPE tokens using a previously learned merge table.
 *
 * @param text - The input string to encode
 * @param mergeTable - The learned merge rules from the `train` step
 * @returns Array of token IDs
 */
export function encode(text: string, mergeTable: MergeTable): number[] {
  // Start with raw UTF-8 bytes
  let tokens = Array.from(Buffer.from(text, "utf-8"));

  // We must apply the merges in the exact same order they were learned during training.
  for (let i = 0; i < mergeTable.length; i++) {
    const item = mergeTable[i];
    if (item === undefined) break;

    const pairKey = item[0];
    const newToken = item[1];

    tokens = replacePair(tokens, pairKey, newToken);
  }

  return tokens;
}

/**
 * Decodes an array of BPE tokens back into a standard string using the merge table.
 *
 * @param tokens - The array of token IDs to decode
 * @param mergeTable - The learned merge rules from the `train` step
 * @returns The original string
 */
export function decode(tokens: number[], mergeTable: MergeTable): string {
  // To decode, we construct a reverse lookup map.
  // We want to map `newToken` -> `[pair1, pair2]`
  const reverseDict = new Map<number, [number, number]>();

  for (let i = 0; i < mergeTable.length; i++) {
    const item = mergeTable[i];
    if (item === undefined) break;

    const pairKey = item[0];
    const newToken = item[1];

    // Unpack the key
    const pair1 = pairKey >> 16;
    const pair2 = pairKey & 0xffff;

    reverseDict.set(newToken, [pair1, pair2]);
  }

  // We mutate a copy of the tokens array to expand high token IDs back to base bytes
  const bytes = [...tokens];

  // We iterate through the array. Whenever we see a token ID >= BaseVocabSize, we look it up
  // in the reverse dictionary and replace it with its constituent parts.
  for (let i = 0; i < bytes.length; i++) {
    const item = bytes[i];
    if (item === undefined) break;

    const lookup = reverseDict.get(item);

    if (lookup != null) {
      // Replace the merged token with its first child
      bytes[i] = lookup[0];
      // Insert its second child right after it
      bytes.splice(i + 1, 0, lookup[1]);

      // Crucial step: We decrement `i` so that on the next iteration of the loop,
      // we process the *first child* we just inserted. This child might ITSELF be
      // a merged token that needs further unpacking! (Recursive unpacking trick)
      i--;
    }
  }

  // Now `bytes` contains only values 0-255. We convert it back to a UTF-8 string.
  return Buffer.from(bytes).toString("utf-8");
}
