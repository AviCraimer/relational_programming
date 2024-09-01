type TupleLength = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

export type Tuple<T, L extends TupleLength> = L extends 0
    ? never[]
    : L extends 1
    ? [T]
    : L extends 2
    ? [T, T]
    : L extends 3
    ? [T, T, T]
    : L extends 4
    ? [T, T, T, T]
    : L extends 5
    ? [T, T, T, T, T]
    : L extends 6
    ? [T, T, T, T, T, T]
    : L extends 7
    ? [T, T, T, T, T, T, T]
    : L extends 8
    ? [T, T, T, T, T, T, T, T]
    : L extends 9
    ? [T, T, T, T, T, T, T, T, T]
    : L extends 10
    ? [T, T, T, T, T, T, T, T, T, T]
    : never;

// export type Tail<T extends any[] | Readonly<any[]>> = T extends [infer Head, ...infer Rest] ? Rest : never;

export type Tail<T extends readonly any[]> = T extends readonly [any, ...infer R] ? R : never;

export type Prepend<E, T extends readonly any[]> = [E, ...T];

export type Head<T extends readonly any[]> = T extends [infer Head, ...infer Rest] ? Head : never;

type Predecessor<L extends TupleLength> = Tail<Tuple<any, L>>["length"];

export type TupleUpTo<T, L extends TupleLength = 10> = L extends TupleLength ? Tuple<T, L> | TupleUpTo<T, Predecessor<L>> : never;

export type StringTuple = TupleUpTo<string>;
export type NumberTuple = TupleUpTo<number>;
