import { basicElementUUID, nullUUID, stringifyUUIDs, parseUUID, UUIDType, uuidTypesAndPrefixes, collectionUUID } from "./uuid";

describe("UUID Utils", () => {
    test("stringifyUUIDs", () => {
        const uuid1 = basicElementUUID();
        const uuid2 = basicElementUUID();
        const uuid3 = basicElementUUID();
        const testArrNoDuplicates = [uuid1, uuid2, uuid3];
        const testArrDuplicates = [uuid1, uuid2, uuid1, uuid3, uuid3];
        const joinChar = ",";
        const arrayPrefix = uuidTypesAndPrefixes["orderedPlural"];
        const setPrefix = uuidTypesAndPrefixes["unorderedPlural"];

        expect(stringifyUUIDs(testArrNoDuplicates)).toBe(arrayPrefix + testArrNoDuplicates.join(joinChar));
        expect(stringifyUUIDs(testArrDuplicates)).toBe(arrayPrefix + testArrDuplicates.join(joinChar));

        // Stringified set is the same as stringifying the sorted array with no duplicates
        expect(stringifyUUIDs(new Set(testArrNoDuplicates))).toBe(setPrefix + testArrNoDuplicates.sort().join(joinChar));

        // With duplicates is the same as no duplicates.
        expect(stringifyUUIDs(new Set(testArrDuplicates))).toBe(stringifyUUIDs(new Set(testArrNoDuplicates)));
    });

    test("parseUUID", () => {
        const uuid1 = basicElementUUID();
        const uuid2 = basicElementUUID();
        const uuid3 = basicElementUUID();
        const testArr = [uuid1, uuid2, uuid3, uuid2];
        const testSet = new Set(testArr);

        expect(parseUUID(stringifyUUIDs(testArr))).toEqual(testArr);
        expect(parseUUID(stringifyUUIDs(testSet))).toEqual(testSet);

        expect(parseUUID(uuid1)).toBe(uuid1);
    });

    test("UUIDType function and tests for stringify  edge cases with empty and singleton sets and arrays", () => {
        expect(UUIDType(collectionUUID())).toBe("collection");
        expect(UUIDType(basicElementUUID())).toBe("basicElement");
        expect(UUIDType(nullUUID())).toBe("nullElement");
        expect(UUIDType(stringifyUUIDs([basicElementUUID(), basicElementUUID()]))).toBe("orderedPlural");
        expect(UUIDType(stringifyUUIDs(new Set([basicElementUUID(), basicElementUUID()])))).toBe("unorderedPlural");

        // Empty array/set edge cases
        expect(UUIDType(stringifyUUIDs([]))).toBe("nullElement");
        expect(UUIDType(stringifyUUIDs(new Set()))).toBe("nullElement");

        // Singleton array/set edge cases
        expect(UUIDType(stringifyUUIDs([nullUUID()]))).toBe("nullElement");
        expect(UUIDType(stringifyUUIDs(new Set([nullUUID()])))).toBe("nullElement");
        expect(UUIDType(stringifyUUIDs([basicElementUUID()]))).toBe("basicElement");
        expect(UUIDType(stringifyUUIDs(new Set([basicElementUUID()])))).toBe("basicElement");
    });
});
