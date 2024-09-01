import objectHash from "object-hash";

export type Hashable = string | number | boolean | null | Set<Hashable> | Map<Hashable, Hashable> | Hashable[] | { [key: string]: Hashable };

// Exclude gives an array of strings
export const hash = (value: Hashable, exclude: string[] = []): string => {
    // Note: Although there is no option for unordered map objects, I checked and the hashes are the same for Map objects with values inserted in different orders.
    return objectHash(value, { algorithm: "sha1", unorderedSets: true, excludeKeys: (key) => exclude.includes(key) });
};

//Tests
// Example usage
// const term1 = { foo: 5, bar: 3 };
// const term2 = { bar: 3, foo: 5 };
const term1: Map<any, any> = new Map();

const term2: Map<any, any> = new Map();

term1.set("foo", 4);
term1.set("bar", 5);

term2.set("bar", 5);
term2.set("foo", 4);

console.log("Test equality with JSON.stringify (expect false)");
// console.log(JSON.stringify(term1));
console.log(JSON.stringify(term1) === JSON.stringify(term2));

console.log("Test equality with object hash (expect true)");

console.log(hash(term1) === hash(term2)); // Outputs the hash value using SHA-1
