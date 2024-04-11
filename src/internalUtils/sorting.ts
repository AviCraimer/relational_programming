export type SortCallback<T> = Exclude<Parameters<T[]["sort"]>[0], undefined>;

export const getPairSort = <A, B>(firstSort: SortCallback<A>, secondSort: SortCallback<B>): SortCallback<[A, B]> => {
    const pairSort: SortCallback<[A, B]> = (pair1, pair2) => {
        const [a1, b1] = pair1;
        const [a2, b2] = pair2;

        let result: number = 0;
        const firstResult = firstSort(a1, a2);

        if (firstResult === 0) {
            result = secondSort(b1, b2);
        } else {
            result = firstResult;
        }
        return result;
    };

    return pairSort;
};

const sortCBsBase = {
    // Sort strings A to Z alphabetical order
    literal: (a: string | number | boolean, b: string | number | boolean): number => {
        if (a > b) {
            return 1;
        } else if (b > a) {
            return -1;
        } else {
            return 0;
        }
    },
    date: (a: Date, b: Date): number => b.valueOf() - a.valueOf(),
};

export function getOptionalSort<T, E extends null | undefined>(origSort: SortCallback<T>, emptyValue?: E) {
    return (a: T | E, b: T | E) => {
        if (a === emptyValue && b === emptyValue) {
            return 0;
        } else if (a === emptyValue) {
            return 1;
        } else if (b === emptyValue) {
            return -1;
        } else {
            return origSort(a as T, b as T);
        }
    };
}

const sortCBsDerived = {
    string: sortCBsBase.literal as (a: string, b: string) => number,
    number: sortCBsBase.literal as (a: number, b: number) => number,
    boolean: sortCBsBase.literal as (a: boolean, b: boolean) => number,
    optional: {
        literal: getOptionalSort(sortCBsBase.literal),
        string: getOptionalSort(sortCBsBase.literal as (a: string, b: string) => number),
        number: getOptionalSort(sortCBsBase.literal as (a: number, b: number) => number),
    },
};

export const sortCBs = { ...sortCBsBase, ...sortCBsDerived, getPairSort };
