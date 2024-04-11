import { sortCBs } from "../../internalUtils/sorting";
import { MapOrdering, RelationMap, RelationPair } from "./RelationMap";

describe("RelationMap", () => {
    // Test data
    const stringNumberPairs: RelationPair<string, number>[] = [
        ["a", undefined],
        [undefined, 4],
        ["a", 1],
        ["a", 2],
        ["b", undefined],
        ["c", 2],
        ["c", 3],
        ["c", 2],
        ["b", undefined],
        ["d", undefined],

        [undefined, 5],
    ];

    const stringNumberSortedExpected = [
        ["a", 1],
        ["a", 2],
        ["b", undefined],
        ["c", 2],
        ["c", 3],
        ["d", undefined],
        [undefined, 4],
        [undefined, 5],
    ];

    const stringNumberOrdering: MapOrdering<string, number> = { first: sortCBs.string, second: sortCBs.number };

    const booleanStringPairs: RelationPair<boolean, string>[] = [
        [true, "x"],
        [true, "y"],
        [false, "y"],
        [false, "z"],
    ];

    const booleanStringOrdering: MapOrdering<boolean, string> = { first: sortCBs.boolean, second: sortCBs.string };

    test("initialize empty", () => {
        const relationMap = new RelationMap();
        expect(relationMap.size).toBe(0);
        expect(relationMap.sizeReverse).toBe(0);
    });

    test("initialize from pairs", () => {
        const relationMap = new RelationMap(stringNumberPairs, stringNumberOrdering);

        const expectedSize = new Set(stringNumberPairs.map(([first]) => first).filter(Boolean)).size;
        const expectedSizeReverse = new Set(stringNumberPairs.map(([_, second]) => second).filter(Boolean)).size;

        expect(relationMap.size).toBe(expectedSize);
        expect(relationMap.sizeReverse).toBe(expectedSizeReverse);
        expect(relationMap.toPairs()).toEqual(stringNumberSortedExpected);
    });

    test("initialize from another RelationMap", () => {
        const original = new RelationMap(stringNumberPairs, stringNumberOrdering);
        const copy = new RelationMap(original);
        expect(copy.toPairs()).toEqual(stringNumberSortedExpected);
    });

    test("get, getSecond, has, hasSecond, hasPair", () => {
        const relationMap = new RelationMap(stringNumberPairs, stringNumberOrdering);
        expect(relationMap.get("a")).toEqual(new Set([1, 2]));
        expect(relationMap.getSecond(2)).toEqual(new Set(["a", "c"]));
        expect(relationMap.has("b")).toBe(true);
        expect(relationMap.has("e")).toBe(false);
        expect(relationMap.hasSecond(3)).toBe(true);
        expect(relationMap.hasSecond(5)).toBe(true);
        expect(relationMap.hasSecond(527)).toBe(false);
        expect(relationMap.hasPair("a", 1)).toBe(true);
        expect(relationMap.hasPair("a", 3)).toBe(false);
        expect(relationMap.hasPair("b", undefined as any)).toBe(false);
    });

    test("addFirst, addSecond, addPair, addFromArray", () => {
        const relationMap = new RelationMap<string, number>([], stringNumberOrdering);

        relationMap.addFirst("a");
        expect(relationMap.size).toBe(1);
        expect(relationMap.sizeReverse).toBe(0);
        expect(relationMap.toPairs()).toEqual([["a", undefined]]);

        relationMap.addSecond(1);
        expect(relationMap.size).toBe(1);
        expect(relationMap.sizeReverse).toBe(1);
        expect(relationMap.toPairs()).toEqual([
            ["a", undefined],
            [undefined, 1],
        ]);

        relationMap.addPair("a", 1);
        expect(relationMap.hasPair("a", 1)).toBe(true);
        expect(relationMap.toPairs()).toEqual([["a", 1]]);

        relationMap.addFromArray([
            [undefined, 3],
            ["c", undefined],
            ["b", 2],
        ]);
        expect(relationMap.toPairs()).toEqual([
            ["a", 1],
            ["b", 2],
            ["c", undefined],
            [undefined, 3],
        ]);
    });

    test("initialization relation map from array and from relation map to be equal", () => {
        const relationMap1 = new RelationMap([], stringNumberOrdering);
        relationMap1.addFromArray(stringNumberPairs);

        const relationMap2 = new RelationMap(stringNumberPairs, stringNumberOrdering);
        // Note: the relation map instances are not equal because the pairSort is regenerated in the constructor so it is a different function by reference.
        expect(relationMap1.toPairs()).toEqual(relationMap2.toPairs());

        const relationMap3 = new RelationMap(relationMap1);

        expect(relationMap3.pairSort).toBe(relationMap1.pairSort);
        expect(relationMap1.toPairs()).toEqual(relationMap3.toPairs());
    });

    test("deletePair, deleteSecond, deleteFromArray, delete, clear", () => {
        const relationMap = new RelationMap(stringNumberPairs);

        expect(relationMap.deletePair("a", 2)).toBe(true);
        expect(relationMap.deletePair("zz", 3)).toBe(false);
        expect(relationMap.deletePair("a", 88)).toBe(false);
        expect(relationMap.hasPair("a", 2)).toBe(false);
        expect(relationMap.hasPair("a", 1)).toBe(true);
        expect(relationMap.getSecond(1)).toEqual(new Set("a"));
        expect(relationMap.hasPair("b", 2)).toBe(false);
        expect(relationMap.hasPair("c", 3)).toBe(true);

        relationMap.deleteSecond(2);
        expect(relationMap.hasSecond(2)).toBe(false);
        expect(relationMap.hasPair("b", 2)).toBe(false);

        // If we delete anything it should return true. Need to test for when it ends with a non-deletion.
        expect(
            relationMap.deleteFromArray([
                ["zz", 33], // no delete
                ["c", 3],
                ["xyz", undefined], // no delete
                ["e", undefined],
                [undefined, 5],
                [undefined, 3434], // no delete
            ])
        ).toBe(true);

        // "c" has no pairs but is still in the domain set
        expect(relationMap.hasPair("c", 3)).toBe(false);
        expect(relationMap.get("c")).toEqual(new Set());

        // "e" and 5 are not longer in the domain or codomain sets.
        expect(relationMap.get("e")).toEqual(undefined);
        expect(relationMap.getSecond(5)).toEqual(undefined);
        expect(relationMap.hasPair("zz", 1)).toBe(false);
        expect(relationMap.hasSecond(353)).toBe(false);

        // Should return false when trying to delete pairs or elements that are not present.
        expect(
            relationMap.deleteFromArray([
                ["zz", 1],
                [undefined, 353],
                ["xyz", undefined],
            ])
        ).toBe(false);

        expect(relationMap.hasSecond(1)).toBe(true);

        expect(relationMap.getSecond(3)).toEqual(new Set());
        relationMap.delete("a");
        expect(relationMap.has("a")).toBe(false);

        relationMap.clear();
        expect(relationMap.size).toBe(0);
        expect(relationMap.sizeReverse).toBe(0);
        expect(relationMap.toPairs()).toEqual([]);
    });

    test("map", () => {
        const relationMap = new RelationMap(booleanStringPairs, booleanStringOrdering);

        // TODO: I need to consider whether mapping must be monotone. In otherwords, since we have an ordering, does the new relation need an ordering and does the ordering need to be preserved under the mapping?
        // I would say, that yes, the new mapping needs an ordering if the original map had one, but no, the new mapping does not need to preserve the order of the old mapping (although maybe this could be an option in the future.).
        // The rationale for this is that the ordering of elements is not part of the mathematical structure of a relation, it is just an implementation detail to ensure extensionality for equality comparisons. Thus, any ordering will do as long as if it applied consistently for same to same comparisons.
        // On the other hand, think of what it does to identity? If we use identity functions for mapping, this should preseve the identity of the RelationMap but if the ordering is changed it might not when doing equality checking. Boy what a headache. Maybe I should rethink letting the user pass in a ordering. Perhaps there is a library that gives an cannonical ordering to any javascript value.
        const mapped = relationMap.map(
            (bool) => (bool ? 1 : 0),
            (str) => str.toUpperCase() + "*"
        );

        expect(mapped.toPairs()).toEqual([
            [1, "X*"],
            [1, "Y*"],
            [0, "Y*"],
            [0, "Z*"],
        ]);
    });

    test("clone", () => {
        const original = new RelationMap(stringNumberPairs);
        const clone = original.clone();
        expect(clone).not.toBe(original);

        expect(clone.toPairs()).toEqual(original.toPairs());
        expect(clone.size).toBe(original.size);
        expect(clone.sizeReverse).toBe(original.sizeReverse);

        // TODO: This might be unexpected since a clone should not have properties that are referentially equal. I will solve this when I solve the sort issues.
        expect(clone.pairSort).toBe(original.pairSort);
    });

    // TODO: Consider getting rid of these, why have them just for the sake of maintaining the map interface. It would be better for the user to have the iteration types fit the relational data structure better.
    test.skip("iterators", () => {
        const relationMap = new RelationMap(stringNumberPairs);
        expect([...relationMap.entries()]).toEqual([
            ["a", new Set([1, 2])],
            ["b", new Set()],
            ["c", new Set([2, 3])],
            ["d", new Set()],
        ]);
        expect([...relationMap.keys()]).toEqual(["a", "b", "c", "d"]);
        expect([...relationMap.values()]).toEqual([new Set([1, 2]), new Set([2]), new Set([3]), new Set()]);
        expect([...relationMap]).toEqual([...relationMap.entries()]);
    });

    test.skip("forEach", () => {
        const relationMap = new RelationMap(stringNumberPairs);
        const mockCallback = jest.fn();
        relationMap.forEach(mockCallback);
        expect(mockCallback.mock.calls).toEqual([
            [new Set([1, 2]), "a", relationMap],
            [new Set([2]), "b", relationMap],
            [new Set([3]), "c", relationMap],
            [new Set(), "d", relationMap],
        ]);
    });

    test("set", () => {
        const relationMap = new RelationMap(stringNumberPairs);
        relationMap.set("a", new Set([3, 4]));
        expect(relationMap.get("a")).toEqual(new Set([3, 4]));
        relationMap.set("e", new Set([5]));
        expect(relationMap.get("e")).toEqual(new Set([5]));
    });

    test("Symbol.toStringTag", () => {
        const relationMap = new RelationMap();
        expect(relationMap[Symbol.toStringTag]).toBe("RelationMap");
    });

    test("initialize from empty array", () => {
        const relationMap = new RelationMap([]);
        expect(relationMap.size).toBe(0);
        expect(relationMap.sizeReverse).toBe(0);
    });

    test("delete non-existent key returns false", () => {
        const relationMap = new RelationMap(stringNumberPairs);
        expect(relationMap.delete("zz")).toBe(false);
        expect(relationMap.deleteSecond(3434)).toBe(false);
    });

    test("clear empty RelationMap", () => {
        const relationMap = new RelationMap(stringNumberPairs);
        expect(relationMap.size).toBe(4);
        expect(relationMap.sizeReverse).toBe(5);
        relationMap.clear();
        expect(relationMap.size).toBe(0);
        expect(relationMap.sizeReverse).toBe(0);
        expect(relationMap.toPairs()).toEqual([]);
    });
});
