import { PUNCTUATIONS } from "./manual-pre-tokenizer";
import preTokenize from "./pre-tokenizer";
import type { WordPieceModel } from "./types";

/**
 * Training helper 1: count how often each word appears in the corpus.
 *
 * Why start here?
 * WordPiece training should care more about frequent words than rare words.
 * If `"play"` appears 500 times and `"playful"` appears once, the training
 * process should spend more attention on the patterns inside `"play"`.
 */
export const wordFreq = (text: string): Map<string, number> => {
  const chunks = preTokenize(text);
  const freq = new Map<string, number>();

  for (const chunk of chunks) {
    // Punctuation is not treated as a trainable "word" in this simple trainer.
    if (!PUNCTUATIONS.has(chunk)) {
      freq.set(chunk.toLowerCase(), (freq.get(chunk.toLowerCase()) || 0) + 1);
    }
  }

  return freq;
};

/**
 * Training helper 2: build the smallest possible WordPiece vocabulary.
 *
 * The base idea is:
 * - the first character of a word becomes a normal token
 * - later characters become continuation tokens with `##`
 *
 * For example:
 *   "play" -> "p", "##l", "##a", "##y"
 *
 * This guarantees that the tokenizer can at least spell words one character at
 * a time before it learns larger and more useful subwords.
 */
export const buildInitialVocabulary = (
  freq: Map<string, number>
): Set<string> => {
  const vocab = new Set<string>();
  vocab.add("[UNK]");
  for (const key of Array.from(freq.keys())) {
    const chunks = key.split("");
    const firstChar = chunks[0];
    if (firstChar === undefined) {
      continue;
    }

    // The first character of a word is allowed without the `##` prefix.
    if (!vocab.has(firstChar)) {
      vocab.add(firstChar);
    }

    // Every later character is a continuation piece.
    for (let i = 1; i < chunks.length; i++) {
      const chunk = chunks[i];
      if (chunk === undefined) {
        continue;
      }
      const element = `##${chunk}`;
      if (!vocab.has(element)) {
        vocab.add(element);
      }
    }
  }
  return vocab;
};

/**
 * Training helper 3: generate larger candidate subwords that might be useful.
 *
 * We inspect every training word, generate every substring, and convert it into
 * WordPiece form:
 * - if the substring starts at index 0, keep it plain
 * - otherwise prefix it with `##`
 *
 * We skip candidates already in the vocabulary, because this step is only
 * trying to propose *new* tokens to learn next.
 */
/**
 * Helper to update candidate frequencies while respecting the current vocabulary.
 */
function updateCandidateFreq(
  subWords: Map<string, number>,
  candidate: string,
  freq: number,
  vocab: Set<string>
): void {
  if (!vocab.has(candidate)) {
    subWords.set(candidate, (subWords.get(candidate) ?? 0) + freq);
  }
}

export const collectCandidateSubwords = (
  freq: Map<string, number>,
  vocab: Set<string>
): Map<string, number> => {
  const subWords = new Map<string, number>();
  for (const [key, value] of Array.from(freq.entries())) {
    // The word frequency becomes the weight added to every candidate found in
    // this word. A word that appears many times should influence training more.
    const keyFreq = value;

    for (let start = 0; start < key.length; start++) {
      for (let end = start + 1; end < key.length + 1; end++) {
        const slice = key.slice(start, end);
        const candidate = start === 0 ? slice : `##${slice}`;
        updateCandidateFreq(subWords, candidate, keyFreq, vocab);
      }
    }
  }
  return subWords;
};

/**
 * Tie-breaking should compare the actual subword length, not the literal token
 * string length. For example:
 *   "play"  -> normalized length 4
 *   "##lay" -> normalized length 3
 *
 * If we counted the `##` prefix as real content, continuation pieces would win
 * ties too often for the wrong reason.
 */
const CONTINUATIONPATTERN = /^##/;
const normalizedLength = (str: string): number => {
  return str.replace(CONTINUATIONPATTERN, "").length;
};

/**
 * Training helper 4: pick the single best candidate to add next.
 *
 * Rule order:
 * 1. higher score wins
 * 2. if scores tie, longer normalized subword wins
 * 3. if that also ties, lexicographically smaller token wins
 *
 * This gives us a deterministic training process, which is useful for
 * debugging, testing, and learning.
 */
export const getBestCandidate = (
  candidates: Map<string, number>
): string | null => {
  let bestScore = -1;
  let bestCandidate: string | null = null;

  for (const [key, value] of Array.from(candidates.entries())) {
    if (value > bestScore) {
      bestScore = value;
      bestCandidate = key;
    } else if (value === bestScore) {
      if (bestCandidate === null) {
        break;
      }
      if (normalizedLength(key) > normalizedLength(bestCandidate)) {
        bestCandidate = key;
      } else if (
        normalizedLength(key) === normalizedLength(bestCandidate) &&
        key < bestCandidate
      ) {
        bestCandidate = key;
      }
    }
  }
  return bestCandidate;
};

/**
 * Training helper 5: repeatedly grow the vocabulary until we hit the target
 * size or run out of useful candidates.
 *
 * This is the "learning loop" of the trainer:
 * - start from character-level pieces
 * - score possible larger pieces
 * - add the best one
 * - repeat
 */
export const trainVocabulary = (
  freq: Map<string, number>,
  targetVocabSize: number
): Set<string> => {
  const vocab = buildInitialVocabulary(freq);

  while (vocab.size < targetVocabSize) {
    const candidates = collectCandidateSubwords(freq, vocab);

    const bestCandidate = getBestCandidate(candidates);
    if (bestCandidate === null) {
      break;
    }

    // Each iteration adds exactly one newly learned subword.
    vocab.add(bestCandidate);
  }
  return vocab;
};

/**
 * Training helper 6: turn the final vocabulary set into a real tokenizer model.
 *
 * We keep `[UNK]` at index 0 on purpose because unknown-token fallback should
 * be easy and stable. The rest of the tokens are sorted so model building stays
 * deterministic from run to run.
 */
export const buildModelFromVocabulary = (
  vocab: Set<string>
): WordPieceModel => {
  let tokens = Array.from(vocab).filter((token) => token !== "[UNK]");
  tokens.sort((a: string, b: string) => a.localeCompare(b));
  tokens = ["[UNK]", ...tokens];

  const idToToken = tokens;
  const tokenToId = reverseIdToToken(idToToken);

  const model = {
    idToToken,
    tokenToId,
    unkToken: "[UNK]",
  };

  return model;
};

export const reverseIdToToken = (idToToken: string[]): Map<string, number> => {
  const tokenToId = new Map<string, number>();
  for (let index = 0; index < idToToken.length; index++) {
    const token = idToToken[index];
    if (token === undefined) {
      break;
    }
    tokenToId.set(token, index);
  }
  return tokenToId;
};
