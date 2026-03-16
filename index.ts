import * as readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import fs from "node:fs";
import path from "node:path";
import { train, encode, decode, type MergeTable, type TrainingResult } from "./bpe/tokenizer";

// Readline interface for interactive CLI
const rl = readline.createInterface({ input, output });

let currentMergeTable: MergeTable | null = null;
let currentVocabSize = 256;
let currentTrainingStats: { 
    timeMs: string, 
    merges: number, 
    originalBytes: number, 
    finalTokens: number, 
    ratio: string, 
    spaceSaved: string 
} | null = null;

const printMenu = () => {
    console.log(`\n🔤 Tokenizer CLI (Current: BPE)`);
    console.log(`================================`);
    console.log(`1. Train on text (type directly)`);
    console.log(`2. Train on file (data/data.txt)`);
    console.log(`3. Encode text`);
    console.log(`4. Decode tokens`);
    console.log(`5. Show training stats`);
    console.log(`6. Exit\n`);
};

const handleTrain = async (text: string) => {
    const vocabStr = await rl.question("Total target vocabulary size (default 320, min 257): ");
    
    // Parse vocab, default to 320, clamp minimum to 257
    let vocabSize = parseInt(vocabStr, 10);
    if (isNaN(vocabSize)) vocabSize = 320;
    if (vocabSize <= 256) vocabSize = 257; 

    console.log(`\nTraining BPE on ${text.length} characters (vocab size: ${vocabSize})...`);
    
    // Measure performance
    const start = performance.now();
    
    // Run the actual training loop from our clean tokenizer module
    const { mergeTable, tokens } = train(text, vocabSize);
    
    const timeMs = (performance.now() - start).toFixed(2);
    
    const originalBytes = Buffer.from(text, "utf-8").length;
    const finalTokens = tokens.length;
    
    currentMergeTable = mergeTable;
    currentVocabSize = 256 + mergeTable.length;
    
    currentTrainingStats = {
        timeMs,
        merges: mergeTable.length,
        originalBytes,
        finalTokens,
        ratio: (originalBytes / finalTokens).toFixed(2),
        spaceSaved: (((originalBytes - finalTokens) / originalBytes) * 100).toFixed(1)
    };

    console.log(`✅ Training complete in ${timeMs} ms. Learned ${mergeTable.length} merges (final vocab: ${currentVocabSize}).`);
};

async function main() {
    while (true) {
        printMenu();
        const choice = await rl.question("Select an option (1-6): ");

        switch (choice.trim()) {
            case "1": {
                const text = await rl.question("Enter text to train on: ");
                if (!text) {
                    console.log("❌ Empty text.");
                    break;
                }
                await handleTrain(text);
                break;
            }
            case "2": {
                const dataPath = path.resolve(__dirname, "data", "data.txt");
                if (!fs.existsSync(dataPath)) {
                    console.log(`❌ Could not find file: ${dataPath}`);
                    break;
                }
                const text = fs.readFileSync(dataPath, "utf-8");
                await handleTrain(text);
                break;
            }
            case "3": {
                if (!currentMergeTable) {
                    console.log("❌ You must train the tokenizer first! (Option 1 or 2)");
                    break;
                }
                const text = await rl.question("Enter text to encode: ");
                
                const start = performance.now();
                const tokens = encode(text, currentMergeTable);
                const timeMs = (performance.now() - start).toFixed(3);
                
                console.log(`\nEncoded Tokens: [${tokens.join(", ")}]`);
                console.log(`Compression: ${Buffer.from(text).length} bytes → ${tokens.length} tokens`);
                console.log(`Encode time: ${timeMs} ms`);
                break;
            }
            case "4": {
                if (!currentMergeTable) {
                    console.log("❌ You must train the tokenizer first! (Option 1 or 2)");
                    break;
                }
                const tokenStr = await rl.question("Enter comma-separated token IDs (e.g. 104, 256, 111): ");
                try {
                    const cleanStr = tokenStr.replace(/['"\[\]]/g, "");
                    const tokens = cleanStr.split(",").map(s => parseInt(s.trim(), 10)).filter(n => !isNaN(n));
                    
                    const start = performance.now();
                    const text = decode(tokens, currentMergeTable);
                    const timeMs = (performance.now() - start).toFixed(3);
                    
                    console.log(`\nDecoded Text: "${text}"`);
                    console.log(`Decode time: ${timeMs} ms`);
                } catch (err) {
                    console.log("❌ Invalid token format.");
                }
                break;
            }
            case "5": {
                if (!currentMergeTable || !currentTrainingStats) {
                    console.log("❌ No training data available yet.");
                    break;
                }
                
                console.log("\n╔══════════════════════════════════════════╗");
                console.log("║         BPE TOKENIZER — SUMMARY          ║");
                console.log("╚══════════════════════════════════════════╝\n");

                console.log("── Training ────────────────────────────────");
                console.log(`  Training time       : ${currentTrainingStats.timeMs} ms`);
                console.log(`  Learned merges      : ${currentTrainingStats.merges}`);
                console.log(`  Final vocab size    : ${currentVocabSize}`);

                console.log("\n── Compression ─────────────────────────────");
                console.log(`  Original tokens     : ${currentTrainingStats.originalBytes} (raw bytes)`);
                console.log(`  After BPE           : ${currentTrainingStats.finalTokens} tokens`);
                console.log(`  Compression ratio   : ${currentTrainingStats.ratio}x`);
                console.log(`  Space saved         : ${currentTrainingStats.spaceSaved}%`);
                break;
            }
            case "6": {
                console.log("Goodbye! 👋");
                rl.close();
                process.exit(0);
            }
            default: {
                console.log("❌ Invalid option.");
                break;
            }
        }
    }
}

// Start the CLI
main().catch(console.error);
