import fs from "node:fs";
import path from "node:path";

const getPairStats = (data: number[]) => {
    const stats = new Map<number, number>();
    let maxPair: number = 0;
    let maxCount: number = 0;
    for (let i = 0; i + 1 < data.length; i++) {
        const num1 = data[i];
        const num2 = data[i + 1];

        if (num1 === undefined || num2 === undefined) break;

        const pair = (num1 << 16) | num2;
        const count = (stats.get(pair) ?? 0) + 1;

        if (count > maxCount) {
            maxPair = pair;
            maxCount = count;
        }
        stats.set(pair, count);
    }
    // console.log("=========== Stats Logs =========== \n");
    // console.log(stats);
    // console.log("=========== Stats Logs End =========== \n");

    return [maxCount, maxPair] as [number, number];
};

const tokenSwapping = ({
    tokens,
    pair,
    newToken,
}: {
    tokens: number[];
    pair: number;
    newToken: number;
}): number[] => {
    const tokensArray: number[] = [];
    const pair1 = pair >> 16;
    const pair2 = pair & 0xffff;

    let i = 0;
    const length = tokens.length;

    while (i < length) {
        const num1 = tokens[i];
        const num2 = tokens[i + 1];

        if (num1 === undefined) break;

        if (num1 === pair1 && num2 === pair2) {
            tokensArray.push(newToken);
            i += 2;
        } else {
            tokensArray.push(num1);
            i++;
        }
    }

    return tokensArray;
};

const tokenize = () => {
    const data = fs.readFileSync(path.resolve(__dirname, "data.txt"), "utf-8");

    const bytes = [...Buffer.from(data, "utf-8")];

    const sizeOfVocab = 320;

    const iterations = sizeOfVocab - 256;

    let tokens = [...bytes];

    const DictArr: [number, number][] = [];

    for (let i = 0; i < iterations; i++) {
        const [maxCount, pairKey] = getPairStats(tokens);

        if (maxCount < 2) break;
        const newToken = i + 256;

        tokens = tokenSwapping({
            tokens: tokens,
            pair: pairKey,
            newToken: newToken,
        });

        DictArr.push([pairKey, newToken]);
    }

    const RevDict = new Map<number, [number, number]>();

    for (let i = 0; i < DictArr.length; i++) {
        const item = DictArr[i];

        if (item === undefined) break;

        const key = item[1];
        const pairKey = item[0];
        const pair1 = pairKey >> 16;
        const pair2 = pairKey & 0xffff;

        const value: [number, number] = [pair1, pair2];

        RevDict.set(key, value);
    }

    console.log("Original: ", bytes.length);
    console.log("After Training: ", tokens.length);
    console.log("After Training: ", DictArr);

    const encode = (str: string) => {
        let tokens = [...Buffer.from(str, "utf-8")];

        for (let i = 0; i < DictArr.length; i++) {
            const item = DictArr[i];
            if (item === undefined) break;

            const key = item[0];
            const newToken = item[1];

            tokens = tokenSwapping({
                tokens: tokens,
                pair: key,
                newToken: newToken,
            });
        }

        return tokens;
    };

    const decode = (tokens: number[]) => {
        const bytes = [...tokens];

        for (let i = 0; i < bytes.length; i++) {
            const item = bytes[i];
            if (item === undefined) break;

            const lookup = RevDict.get(item);

            if (lookup != null) {
                bytes[i] = lookup[0];
                bytes.splice(i + 1, 0, lookup[1]);
                i--;
            }
        }

        return Buffer.from(bytes).toString("utf-8");
    };
};

tokenize();
