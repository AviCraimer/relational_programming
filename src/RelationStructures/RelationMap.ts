import { clone } from "lodash";

// RelationMap mirrors the interface of a JS Map, but it maps a type A to the powerset of a type B, and also tracks the reverse relation from B to power-set A.

import { fMapSet } from "../../internalUtils/fp";
import { getPairSort, getOptionalSort } from "../../internalUtils/sorting";

const lookupSymbol = Symbol("RelationMap Lookup Key");

export type RelationPair<A, B> = [A | undefined, B | undefined];

type RelationMapType<A, B> = Map<A, Set<B>> & RelationMapExtra<A, B>;

export type RelationMapExtra<A, B> = {
    get sizeReverse(): number;

    getSecond(value: B): Set<A> | undefined;
    hasSecond(second: B): boolean;
    hasPair(first: A, second: B): boolean;
    addFirst(first: A): boolean;
    addSecond(second: B): boolean;
    addPair(first: A, second: B): RelationMap<A, B>;
    addFromArray(pairs: RelationPair<A, B>[]): RelationMap<A, B>;
    deletePair(first: A, second: B): boolean;
    deleteSecond(second: B): boolean;
    deleteFromArray(pairs: RelationPair<A, B>[]): boolean;
    map<C, D>(firstMap: (first: A) => C, secondMap: (second: B) => D): RelationMapType<C, D>;
    toPairs(): RelationPair<A, B>[];
    clone(): RelationMap<A, B>;
};

// Optional argument to add ordering to pairs. This ensures the extensional uniqueness of RelationMap and allows for more meaningful equality comparisons.
export type MapOrdering<A, B> = { first: (a1: A, a2: A) => number; second: (b1: B, b2: B) => number };

// TODO: Code created with help of Claude 3 Opus. Needs human review and testing.
export class RelationMap<A, B> implements RelationMapType<A, B> {
    private [lookupSymbol]: [forwards: Map<A, Set<B>>, reverse: Map<B, Set<A>>];
    readonly pairSort: ReturnType<typeof getPairSort<A | undefined, B | undefined>> | undefined = undefined;

    constructor(init: RelationMap<A, B> | RelationPair<A, B>[] = [], ordering?: MapOrdering<A, B>) {
        // TODO: use the init argument to initialize the maps.
        this[lookupSymbol] = [new Map(), new Map()];

        if (ordering) {
            // If the ordering functions were provided, we turn them into a sorting on pairs which may include undefined values.
            const { first, second } = ordering;
            this.pairSort = getPairSort(getOptionalSort(first), getOptionalSort(second));
        }

        if (Array.isArray(init)) {
            this.addFromArray(init);
        } else {
            // A relation map is passed in we always copy the copy the pairs. If an ordering was not provided in the constructor we copy the pairSort from the relation map as well.
            this.addFromArray(init.toPairs());
            this.pairSort = this.pairSort ?? init.pairSort;
        }
    }

    // *** Relation Map Extra Methods Implementation ***

    get sizeReverse(): number {
        return this[lookupSymbol][1].size;
    }

    getSecond(second: B): Set<A> | undefined {
        return this[lookupSymbol][1].get(second);
    }

    hasSecond(second: B): boolean {
        return this[lookupSymbol][1].has(second);
    }

    // Check if a pair (a, b) is in the relation
    hasPair(first: A, second: B): boolean {
        const BSet = this.get(first) ?? new Set();
        return BSet.has(second);
    }

    // Add a first element without adding any relation pairs
    addFirst(first: A): boolean {
        const [forwardMap] = this[lookupSymbol];
        if (this.has(first)) {
            return false;
        } else {
            forwardMap.set(first, new Set());
            return true;
        }
    }

    // Add a second element without adding any relation pairs
    addSecond(second: B): boolean {
        const [_, reverseMap] = this[lookupSymbol];
        if (this.hasSecond(second)) {
            return false;
        } else {
            reverseMap.set(second, new Set());
            return true;
        }
    }

    // Add a single pair to the relation.
    addPair(first: A, second: B): this {
        // We add the elements first to initialize an empty set if none is present. This will not change anything if the element is already present.
        this.addFirst(first);
        this.addSecond(second);

        // Since we initialized on the first and second we can safely use ! assertion.
        const bSet = this.get(first)!;
        const aSet = this.getSecond(second)!;

        // Add the elements in each direction.
        bSet.add(second);
        aSet.add(first);

        return this;
    }

    // Add elements from an array of pairs where one side of the other may be undefined.
    addFromArray(pairs: RelationPair<A, B>[]) {
        pairs.forEach(([a, b]) => {
            if (a !== undefined && b !== undefined) {
                this.addPair(a, b);
            } else if (a !== undefined) {
                this.addFirst(a);
            } else if (b !== undefined) {
                this.addSecond(b);
            }
        });
        return this;
    }

    // Removes a single pair. This does not remove an element from the first or second sets (i.e., will leave empty sets in place).
    deletePair(first: A, second: B): boolean {
        if (this.hasPair(first, second)) {
            this.get(first)!.delete(second);
            this.getSecond(second)!.delete(first);
            return true;
        } else {
            return false;
        }
    }

    // Deletes from an array of pairs with optional first and second elements.
    deleteFromArray(pairs: RelationPair<A, B>[]): boolean {
        let deletionDetected = false;
        let deleted = false;
        pairs.forEach(([a, b]) => {
            if (a !== undefined && b !== undefined) {
                deletionDetected = this.deletePair(a, b);
            } else if (a !== undefined) {
                deletionDetected = this.delete(a);
            } else if (b !== undefined) {
                deletionDetected = this.deleteSecond(b);
            }

            // Note: This ensures that the deleted value does not revert to false if a failed deletion occurs after a successful deletion.
            if (deletionDetected && !deleted) {
                deleted = true;
            }
        });
        return deleted;
    }

    deleteSecond(second: B): boolean {
        const [_, reverseMap] = this[lookupSymbol];

        if (!this.hasSecond(second)) {
            return false;
        }

        const aSet = this.getSecond(second) ?? new Set();

        // This removes the reverse links
        aSet.forEach((a) => {
            this.deletePair(a, second);
        });

        // Remove second element from the forward map.
        reverseMap.delete(second);

        return true;
    }

    clone() {
        return new RelationMap(this);
    }

    toPairs(): RelationPair<A, B>[] {
        const [forwardMap, reverseMap] = this[lookupSymbol];
        const pairs: RelationPair<A, B>[] = [];
        forwardMap.forEach((bSet, a) => {
            if (bSet.size > 0) {
                bSet.forEach((b) => {
                    pairs.push([a, b]);
                });
            } else {
                pairs.push([a, undefined]);
            }
        });

        reverseMap.forEach((aSet, b) => {
            if (aSet.size === 0) {
                pairs.push([undefined, b]);
            }
        });

        if (this.pairSort) {
            pairs.sort(this.pairSort);
        }

        return pairs;
    }

    map<C, D>(firstCB: (first: A) => C, secondCB: (second: B) => D): RelationMapType<C, D> {
        const [forwardMap, reverseMap] = this[lookupSymbol];

        const mappedRelation: RelationMap<C, D> = new RelationMap();

        // Uses the callbacks to transform the elements of the original relation map into elements of the new relation map. It maintains the relational pairs for corresponding elements in the new map.
        forwardMap.forEach((bSet, a) => {
            const c = firstCB(a);

            // fMapSet applies the callback to all items in the set and returns a new set.
            const dSet = fMapSet(secondCB)(bSet);
            mappedRelation.set(c, dSet);
        });

        // Add any elements to the second set that have no pairs (these will be missed in the forward pass)
        reverseMap.forEach((_, b) => {
            if (this.hasSecond(b) && this.getSecond(b)!.size === 0) {
                mappedRelation.addSecond(secondCB(b));
            }
        });
        return mappedRelation;
    }

    // *** JS MAP Methods Implementation ***

    get size(): number {
        return this[lookupSymbol][0].size;
    }

    get(first: A): Set<B> | undefined {
        return this[lookupSymbol][0].get(first);
    }

    has(first: A): boolean {
        return this[lookupSymbol][0].has(first);
    }

    // Sets all the pairs for a given first element
    set(first: A, bSet: Set<B>): this {
        this.delete(first);
        bSet.forEach((b) => this.addPair(first, b));
        return this;
    }

    // Deletes a first element
    delete(first: A): boolean {
        const [forwardMap] = this[lookupSymbol];

        if (!this.has(first)) {
            return false;
        }

        const bSet = this.get(first) ?? new Set();

        // This removes the reverse links
        bSet.forEach((b) => {
            this.deletePair(first, b);
        });

        // Remove first element from the forward map.
        forwardMap.delete(first);

        return true;
    }

    clear(): void {
        const [forwardMap, reverseMap] = this[lookupSymbol];
        forwardMap.clear();
        reverseMap.clear();
    }

    forEach(callbackfn: (bSet: Set<B>, first: A, map: Map<A, Set<B>>) => void, thisArg?: any): void {
        const [forwardMap] = this[lookupSymbol];
        forwardMap.forEach(callbackfn, thisArg);
    }

    *entries(): IterableIterator<[A, Set<B>]> {
        const [forwardMap] = this[lookupSymbol];
        yield* forwardMap.entries();
    }

    *keys(): IterableIterator<A> {
        const [forwardMap] = this[lookupSymbol];
        yield* forwardMap.keys();
    }

    *values(): IterableIterator<Set<B>> {
        const [forwardMap] = this[lookupSymbol];
        yield* forwardMap.values();
    }

    [Symbol.iterator](): IterableIterator<[A, Set<B>]> {
        return this.entries();
    }

    get [Symbol.toStringTag](): string {
        return "RelationMap";
    }
}
