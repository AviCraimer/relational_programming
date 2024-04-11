export const fMapSet =
    <A, B>(cb: (a: A) => B) =>
    (aSet: Set<A>) => {
        return new Set([...aSet].map(cb));
    };
