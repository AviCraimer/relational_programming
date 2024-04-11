import { collectionUUID } from "./../../internalUtils/uuid";
import { basicElementUUID } from "../../internalUtils/uuid";
import { ElementType, isNullElement } from "../../networkStructure/NetworkElement";
import { ElementCollection, ElementCollectionType } from "./ElementCollection";

describe("ElementCollection", () => {
    type TestElement = ElementType<"TestElement", { value: number }>;

    const createTestElement = (value: number): TestElement => ({
        uuid: basicElementUUID(),
        type: "KNetElement",
        elementType: "TestElement",
        data: { value },
    });

    test("should create an ElementCollection with elements and a null element", () => {
        const elements: TestElement[] = [createTestElement(1), createTestElement(2)];
        const collection = new ElementCollection(elements, "Test Collection");

        expect(collection.size).toBe(3); // 2 elements + 1 null element
        expect(collection.has(elements[0])).toBe(true);
        expect(collection.has(elements[1])).toBe(true);
        expect(collection.has(collection.null)).toBe(true);
        expect(collection.displayName).toBe("Test Collection");
        expect(collection.uuid).toContain("collection");
    });

    test("should add and delete elements from the collection", () => {
        const elements: TestElement[] = [createTestElement(1), createTestElement(2)];
        const collection = new ElementCollection(elements, "Test Collection");
        const newElement = createTestElement(3);

        collection.add(newElement);
        expect(collection.size).toBe(4);
        expect(collection.has(newElement)).toBe(true);

        collection.delete(newElement);
        expect(collection.size).toBe(3);
        expect(collection.has(newElement)).toBe(false);

        // Does not delete null
        collection.delete(collection.null as unknown as TestElement);
        expect(collection.size).toBe(3);
        expect(collection.has(collection.null)).toBe(true);
    });

    test("should clear the collection", () => {
        const elements: TestElement[] = [createTestElement(1), createTestElement(2)];
        const collection = new ElementCollection(elements, "Test Collection");

        collection.clear();
        expect(collection.size).toBe(1); // Only the null element remains
        expect(collection.has(elements[0])).toBe(false);
        expect(collection.has(elements[1])).toBe(false);
        expect(collection.has(collection.null)).toBe(true);
    });

    test("should iterate over elements using forEach", () => {
        const elements: TestElement[] = [createTestElement(1), createTestElement(2)];
        const collection = new ElementCollection(elements, "Test Collection");
        const visitedElements: TestElement[] = [];

        collection.forEach((element) => {
            if (element.elementType !== "NullElement") {
                visitedElements.push(element);
            }
        });

        expect(visitedElements).toEqual(elements);
    });

    test("Map method lifts a function between elements to a function between ElementCollections", () => {
        const el1 = createTestElement(1);
        const el2 = createTestElement(2);

        const elements: TestElement[] = [el1, el2];
        const collection = new ElementCollection(elements, "Test Collection");

        // Map each element independently
        let callbackDouble: Parameters<ElementCollectionType<TestElement>["map"]>[0] = (element): TestElement => {
            return {
                ...element,
                data: { value: element.data.value * 2 },
            };
        };

        // Transforms element based on the whole collection
        let callbackDifference: Parameters<ElementCollectionType<TestElement>["map"]>[0] = (element, collection): TestElement => {
            const total = [...collection.values()].reduce((a, b) => {
                if (!isNullElement(b)) {
                    return a + b.data.value;
                } else {
                    return a;
                }
            }, 0);

            return {
                ...element,
                data: { value: total - element.data.value },
            };
        };

        // They should match except for the uuid. I should create some equals comparison functions.
        const { uuid: _, ...restMappedCollection } = collection.map(callbackDouble, "");
        const { uuid: __, ...restDoubleCollection } = new ElementCollection([
            { ...el1, data: { value: 2 } },
            { ...el2, data: { value: 4 } },
        ]);
        expect(restMappedCollection).toEqual(restDoubleCollection);

        // Checking access to collection argument in the callback works.
        const { uuid: ___, ...restMappedDifferenceCollection } = collection.map(callbackDifference, "");
        const { uuid: ____, ...restDifferenceCollection } = new ElementCollection([
            { ...el1, data: { value: 3 - 1 } },
            { ...el2, data: { value: 3 - 2 } },
        ]);
        expect(restMappedDifferenceCollection).toEqual(restDifferenceCollection);
    });
});
