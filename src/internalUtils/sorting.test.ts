import { SortCallback, sortCBs } from "./sorting";

describe("sorting", () => {
    test("get pair sort", () => {
        const pairSort1 = sortCBs.getPairSort(sortCBs.optional.string, sortCBs.optional.number);

        const stringNumberPairs: [string | undefined, number | undefined][] = [
            ["a", 1],
            ["d", undefined],
            ["a", 2],
            ["b", 2],
            ["e", 5],
            ["c", 3],
            ["a", undefined],
            [undefined, 4],
            [undefined, 5],
        ];

        expect(stringNumberPairs.sort(pairSort1)).toEqual([
            ["a", 1],
            ["a", 2],
            ["a", undefined],
            ["b", 2],
            ["c", 3],
            ["d", undefined],
            ["e", 5],
            [undefined, 4],
            [undefined, 5],
        ]);
    });
});
