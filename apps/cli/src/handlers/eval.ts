import { compareTokenizer } from "@tokenizer/evaluation";
import { DEFAULT_TEXT } from "@tokenizer/evaluation/default-text";
import type { TokenizerStats } from "@tokenizer/evaluation/metrics";
import {
  bpeSlot,
  type NormalizationConfig,
  rl,
  type TrainingStats,
  wordPieceSlot,
} from "../state";

export function formatNumber(value: number, decimals = 2): string {
  return value.toFixed(decimals);
}

function printMetricRow(
  label: string,
  bpeValue: string | number,
  wordPieceValue: string | number
) {
  console.log(
    `  ${label.padEnd(22)} ${String(bpeValue).padStart(14)} ${String(wordPieceValue).padStart(14)}`
  );
}

function printComparisonReport(
  text: string,
  bpeStats: TokenizerStats,
  wordPieceStats: TokenizerStats
) {
  console.log("\n╔══════════════════════════════════════════════════════╗");
  console.log("║              TOKENIZER COMPARISON REPORT             ║");
  console.log("╚══════════════════════════════════════════════════════╝\n");

  console.log("── Input ──────────────────────────────────────────────");
  console.log(`  Characters            : ${text.length}`);
  console.log(`  UTF-8 bytes           : ${Buffer.from(text, "utf-8").length}`);

  console.log("\n── Results ────────────────────────────────────────────");
  console.log(
    `  ${"Metric".padEnd(22)} ${"BPE".padStart(14)} ${"WordPiece".padStart(14)}`
  );
  console.log(`  ${"-".repeat(22)} ${"-".repeat(14)} ${"-".repeat(14)}`);
  printMetricRow("Vocab size", bpeStats.vocabSize, wordPieceStats.vocabSize);
  printMetricRow("Token count", bpeStats.tokenCount, wordPieceStats.tokenCount);
  printMetricRow(
    "Unique tokens",
    bpeStats.uniqueTokenCount,
    wordPieceStats.uniqueTokenCount
  );
  printMetricRow(
    "Compression",
    `${formatNumber(bpeStats.compressionRatio)}x`,
    `${formatNumber(wordPieceStats.compressionRatio)}x`
  );
  printMetricRow(
    "Reduction",
    `${formatNumber(bpeStats.reductionPercent)}%`,
    `${formatNumber(wordPieceStats.reductionPercent)}%`
  );
  printMetricRow(
    "Avg chars/token",
    formatNumber(bpeStats.avgCharsPerToken),
    formatNumber(wordPieceStats.avgCharsPerToken)
  );
  printMetricRow(
    "Encode time",
    `${formatNumber(bpeStats.encodeTime, 3)}ms`,
    `${formatNumber(wordPieceStats.encodeTime, 3)}ms`
  );
  printMetricRow(
    "Decode time",
    `${formatNumber(bpeStats.decodeTime, 3)}ms`,
    `${formatNumber(wordPieceStats.decodeTime, 3)}ms`
  );
  printMetricRow(
    "Unknown tokens",
    bpeStats.unknownTokenCount,
    wordPieceStats.unknownTokenCount
  );
  printMetricRow(
    "Unknown rate",
    `${formatNumber(bpeStats.unknownTokenRate * 100)}%`,
    `${formatNumber(wordPieceStats.unknownTokenRate * 100)}%`
  );

  console.log(
    "\nNote: compression is measured as original UTF-8 bytes per produced token."
  );
}

function printTrainingStats(stats: TrainingStats) {
  console.log("\n╔══════════════════════════════════════════╗");
  console.log(
    `║   ${stats.tokenizer.toUpperCase().padEnd(16)} TOKENIZER — SUMMARY   ║`
  );
  console.log("╚══════════════════════════════════════════╝\n");

  console.log("── Training ────────────────────────────────");
  console.log(`  Training time       : ${stats.timeMs} ms`);
  if (stats.tokenizer === "bpe") {
    console.log(`  Learned merges      : ${stats.learnedUnits}`);
    console.log(`  Final vocab size    : ${stats.finalVocabSize}`);
  } else {
    console.log(`  Trained vocab size  : ${stats.learnedUnits}`);
  }

  console.log("\n── Compression ─────────────────────────────");
  console.log(`  Original bytes      : ${stats.originalBytes} (raw bytes)`);
  console.log(
    `  After ${stats.tokenizer.padEnd(9).toUpperCase()} : ${stats.finalTokens} tokens`
  );
  console.log(`  Compression ratio   : ${stats.ratio}x`);
  console.log(`  Space saved         : ${stats.spaceSaved}%`);
}

function getNormalizationConfigDifferences(
  bpeConfig: NormalizationConfig,
  wordPieceConfig: NormalizationConfig
): string[] {
  const fields: Array<keyof NormalizationConfig> = [
    "unicodeForm",
    "stripAccents",
    "lowercase",
    "collapseWhitespace",
    "trimWhitespace",
  ];

  return fields
    .filter((field) => bpeConfig[field] !== wordPieceConfig[field])
    .map(
      (field) =>
        `${field}: BPE=${String(bpeConfig[field])}, WordPiece=${String(wordPieceConfig[field])}`
    );
}

function warnIfNormalizationConfigsDiffer() {
  const differences = getNormalizationConfigDifferences(
    bpeSlot.normalizationConfig,
    wordPieceSlot.normalizationConfig
  );

  if (differences.length === 0) {
    return;
  }

  console.log("\n⚠️  Normalization configs differ between tokenizers.");
  console.log(
    `   Token counts, compression, and WordPiece ${wordPieceSlot.model?.unkToken ?? "[UNK]"} rate may be affected by preprocessing differences.`
  );
  for (const difference of differences) {
    console.log(`   - ${difference}`);
  }
}

export function handleStats() {
  const availableStats = [
    bpeSlot.trainingStats,
    wordPieceSlot.trainingStats,
  ].filter((stats): stats is TrainingStats => stats !== null);

  if (availableStats.length === 0) {
    console.log("❌ No training data available yet.");
    return;
  }

  for (const stats of availableStats) {
    printTrainingStats(stats);
  }
}

export async function handleCompare() {
  if (bpeSlot.mergeTable === null || wordPieceSlot.model === null) {
    console.log(
      "❌ Train or load both BPE and WordPiece models before comparing."
    );
    return;
  }

  const rawText = await rl.question(
    "Enter text to compare (press Enter for default evaluation text): "
  );
  const text = rawText.length === 0 ? DEFAULT_TEXT : rawText;
  warnIfNormalizationConfigsDiffer();

  const comparison = compareTokenizer(
    text,
    {
      mergeTable: bpeSlot.mergeTable,
      normalizationConfig: bpeSlot.normalizationConfig,
    },
    {
      model: wordPieceSlot.model,
      normalizationConfig: wordPieceSlot.normalizationConfig,
    }
  );

  printComparisonReport(text, comparison.bpe, comparison.wordpiece);
}
