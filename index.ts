import fs from "node:fs";
import path from "node:path";

const getPairStats = (data: number[]) => {
    const stats = new Map<number, number>();
    let maxPair: number = 0;
    let maxCount: number = 0;
    for (let i = 0; i + 1 < data.length; i++) {
        const num1 = data[i];
        const num2 = data[i + 1];

        if (num1 === undefined || num2 === undefined) continue;

        const pair = (num1 << 16) | num2;
        const count = (stats.get(pair) ?? 0) + 1;

        if (count > maxCount) {
            maxPair = pair;
            maxCount = count;
        }
        stats.set(pair, count);
    }
    //     console.log("=========== Stats Logs =========== \n");
    //     console.log(stats);
    //     console.log("=========== Stats Logs End =========== \n");

    return [maxCount, maxPair];
};

const data = fs.readFileSync(path.resolve(__dirname, "data.txt"), "utf-8");

const bytes = [...Buffer.from(data, "utf-8")];

console.log(getPairStats(bytes));
