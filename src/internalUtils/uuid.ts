// Types and Util functions for generating UUIDs
import { nanoid } from "nanoid";
import { startsWithRegex } from "./regex";
const uuidBrand = Symbol("uuid brand");
const elementBrand = Symbol("is an basic element");
const nullBrand = Symbol("is null element");
const collectionBrand = Symbol("is a collection of elements");
const unorderedUUIDsBrand = Symbol("A string encoding an unordered collection of UUIDs");
const orderedUUIDsBrand = Symbol("A string encoding an ordered collection of UUIDs");

console.log(nanoid());

export const uuidTypesAndPrefixes = {
    basicElement: "basic_element|",
    collection: "collection|",
    nullElement: "null|",
    // An ordered comma-separated sequence of multiple UUIDs. Corresponds to an array of UUIDs when parsed.
    orderedPlural: "orderedPlural|",

    // An unordered (sorted) comma-separated sequence of multiple UUIDs. Corresponds to a Set of UUIDs when parsed.
    unorderedPlural: "unorderedPlural:",
} as const;

// Matches Plural UUIDs
const pluralUUIDsRegex = startsWithRegex([uuidTypesAndPrefixes["orderedPlural"], uuidTypesAndPrefixes["unorderedPlural"]]);

export type UUIDType = keyof typeof uuidTypesAndPrefixes;

// Strings that are at the start of the UUID string to indicate the UUID type.
type UUIDPrefixes = (typeof uuidTypesAndPrefixes)[UUIDType];

export type BrandedUUID = `${UUIDPrefixes}${string}` & {
    [uuidBrand]: true;
};

export type BasicElementUUID = BrandedUUID & {
    [elementBrand]: true;
};
export const basicElementUUID = () => `basic_element|${nanoid()}` as ElementUUID;

export type NullElementUUID = BrandedUUID & {
    [nullBrand]: true;
};

export type CollectionUUID = BrandedUUID & {
    [collectionBrand]: true;
};

export type OrderedPluralUUID = BrandedUUID & {
    [orderedUUIDsBrand]: true;
};

export type UnorderedPluralUUID = BrandedUUID & {
    [unorderedUUIDsBrand]: true;
};

export const collectionUUID = () => `collection|${nanoid()}` as CollectionUUID;

export type ElementUUID = BasicElementUUID | NullElementUUID;

// We generated a single UUID for the null element. This means every collection has a null element with an identical UUID.
const nullUUIDPregenerated = "Y0DkJzE66fWbgta05nCbO";

// Note: this is a constant function. It has the form of a function to make it have the same interface as the other UUID generators.
export const nullUUID = () => `null|${nullUUIDPregenerated}` as NullElementUUID;

type WithUUID = {
    uuid: string;
};

export const sortByUUID = <T extends WithUUID[]>(things: T) => {
    const sorted = [...things].sort((a, b) => {
        return a.uuid > b.uuid ? 1 : -1;
    });
    return sorted;
};

// Returns a single value T for non-collections or for singleton collections. Otherwise, acts as identity.
function normalizeSingleton<T>(arg: T | Set<T> | Array<T>) {
    // Note T should not be an Array or Set type
    if (Array.isArray(arg) && arg.length === 1) {
        return arg[0];
    } else if (arg instanceof Set && arg.size === 1) {
        return [...arg.values()][0];
    } else {
        return arg;
    }
}

// Uses normalize singleton and returns nullUUID for empty arrays and sets. Note that if a singleton array or set containing the nullUUID is passed, this will be extracted with normalizeSingleton. So NullUUID is returned both for empty sets and arrays as well as for singleton sets and arrays containing nullUUID.
export function normalizeUUIDs<T extends string>(arg: T | Set<T> | Array<T>) {
    // Note T should not be an Array or Set type
    const value = normalizeSingleton(arg);
    if (Array.isArray(value) && value.length === 0) {
        return nullUUID();
    } else if (arg instanceof Set && arg.size === 0) {
        return nullUUID();
    } else {
        return value;
    }
}

export function stringifyUUIDs(uuidOrUUIDs: BrandedUUID | Array<BrandedUUID> | Set<BrandedUUID>): BrandedUUID {
    const value = normalizeUUIDs(uuidOrUUIDs);
    const joinChar = ",";

    if (Array.isArray(value)) {
        if (value.length < 2) {
            throw new Error("Bug: Normalize is not working properly on arrays.");
        }

        return (uuidTypesAndPrefixes["orderedPlural"] + value.join(joinChar)) as OrderedPluralUUID;
    } else if (value instanceof Set) {
        if (value.size < 2) {
            throw new Error("Bug: Normalize is not working properly on sets.");
        }

        // Convert the set to an array, sort it, and then join the elements into a string
        // Note although the UUIDs are sorted, this string represents an unordered collection since the initial order in the parameter does not matter to the output.
        return (uuidTypesAndPrefixes["unorderedPlural"] + [...value].sort().join(joinChar)) as UnorderedPluralUUID;
    } else {
        return value;
    }
}

export function parseUUID(uuid: BrandedUUID): BrandedUUID | BrandedUUID[] | Set<BrandedUUID> {
    // Check if the UUID starts with the ordered plural prefix
    if (uuid.startsWith(uuidTypesAndPrefixes["orderedPlural"])) {
        // Remove the prefix from the UUID string
        const uuidWithoutPrefix = uuid.slice(uuidTypesAndPrefixes["orderedPlural"].length);
        // Split the UUID string into an array of individual UUIDs
        const uuids = uuidWithoutPrefix.split(",") as BrandedUUID[];
        return uuids;
    }
    // Check if the UUID starts with the unordered plural prefix
    else if (uuid.startsWith(uuidTypesAndPrefixes["unorderedPlural"])) {
        // Remove the prefix from the UUID string
        const uuidWithoutPrefix = uuid.slice(uuidTypesAndPrefixes["unorderedPlural"].length);
        // Split the UUID string into an array of individual UUIDs
        const uuids = uuidWithoutPrefix.split(",") as BrandedUUID[];
        // Convert the array of UUIDs into a Set
        return new Set(uuids);
    }
    // If the UUID doesn't start with any of the plural prefixes, return it as is
    else {
        return uuid;
    }
}

export function UUIDType(uuid: BrandedUUID): UUIDType {
    // Iterate over each entry in the uuidTypesAndPrefixes object
    for (const [type, prefix] of Object.entries(uuidTypesAndPrefixes)) {
        // Check if the UUID starts with the current prefix
        if (uuid.startsWith(prefix)) {
            // If a match is found, return the corresponding type key
            return type as UUIDType;
        }
    }

    // If no matching prefix is found, throw an error
    throw new Error(`Invalid UUID: ${uuid}`);
}
