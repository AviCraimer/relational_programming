export type Multiset<T> = Map<T, number>;

function mkMultiset<T>(items: T[]): Map<T, number> {
    const multiset = new Map<T, number>();
    for (const item of items) {
        const prevCount = multiset.get(item) ?? 0;

        multiset.set(item, prevCount + 1);
    }
    return multiset;
}

function unionMultisets<A, B>(multisetA: Multiset<A>, multisetB: Multiset<B>): Multiset<A | B> {
    // We only need a shallow copy since this works with literal values.
    const result: Multiset<A | B> = new Map(multisetA);
    for (const [item, countB] of multisetB) {
        const countA = result.get(item) ?? 0;
        result.set(item, countA + countB);
    }
    return result;
}

export const Multiset = {
    mk: mkMultiset,
    union: unionMultisets,
};
