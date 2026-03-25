const vocab = new Set([
  "[UNK]",
  "play",
  "work",
  "hello",
  "world",
  "token",
  "##ing",
  "##er",
  "##ed",
  "##s",
  "##ize",
  "##izer",
  "!",
  ",",
  ".",
]);

const encodeWord = (word: string, vocab: Set<string>): string[] => {
  let start = 0;
  let end = word.length;
  let candidate: string;
  const words: string[] = [];
  let isMatched = false;

  while (end > start) {
    if (start === 0) {
      candidate = word.slice(start, end);
    } else {
      candidate = `##${word.slice(start, end)}`;
    }

    if (vocab.has(candidate)) {
      start = end;
      end = word.length + 1;
      isMatched = true;
      words.push(candidate);
    } else {
      isMatched = false;
    }

    end--;
    if (start === end && isMatched === false) {
      return ["[UNK]"];
    }
  }
  return words;
};

const result = encodeWord("playing", vocab);
console.log(result);
