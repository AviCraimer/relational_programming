export type Assert<T extends true> = T;

export type TypeEq<A, B> = [A, B] extends [B, A] ? true : false;

export type ResolveType<T> = T extends object ? { [K in keyof T]: ResolveType<T[K]> } : T;

export type ResolveShallow<T> = T extends object ? { [K in keyof T]: T[K] } : T;

export type NoInstance<T> = T & { __notInstantiated__: never };

//Not needed so far. Has issues when applied to arrays.
export type WithInstance<T> = DistributiveOmit<T, "__notInstantiated__">;

export type DistributiveOmit<T, K extends keyof any> = T extends any ? Omit<T, K> : never;

export type Merge<A, B> = {
    [K in keyof A & keyof B]: A[K] | B[K];
} & Omit<A, keyof A & keyof B> &
    Omit<B, keyof A & keyof B>;

type teste222 = ResolveType<Merge<{ foo: 3 }, { bar: 4; foo: { baz: 4 } }>>;

export type ShallowDistributeUnion<U> = ResolveShallow<
    U extends [infer Head, ...infer Rest] ? (Rest extends any[] ? Merge<Head extends any ? { [K in keyof Head]: Head[K] } : never, ShallowDistributeUnion<Rest>> : never) : {}
>;

type Foo1 = { foo: 1; obj: { bar: 1 } };
type Foo2 = { foo: 2; obj: { bar: { baz: 2 } } };

type Result = ShallowDistributeUnion<UnionToTuple<Foo1 | Foo2>>;

type Union = "a" | "b" | "c";

// type DistributeUnionShallow<T> = {
//     [K in KnownKeys<UnionToIntersection<T>>]: T extends infer U
//         ? U extends any
//             ? K extends keyof U
//                 ? U[K]
//                 : never
//             : never
//         : never;
// };

// type test = DistributeUnionShallow<
//     { foo: "a" | "b"; bar: { baz: 2 } } | { foo: "a" | "c"; bar: { baz: 3 } }
// >;

// type test = {
//     foo: "a" | "b" | "c";
//     bar:
//         | {
//               baz: 2;
//           }
//         | {
//               baz: 3;
//           };
// };

// type Foo1 = { foo: 1; obj: { bar: 1 } };
// type Foo2 = {
//     foo: 2;
//     obj: { bar: { baz: 2 } };
// };

// type test2 = DistributeUnionShallow<
//   | {
//       foo: 1;
//       obj: { bar: 1 } }
//   | {
//       foo: 2;
//       obj: { bar: { baz: 2 } };
//      }
// >
// ;
