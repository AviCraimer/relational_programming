import { RelationMap, RelationMapExtra, RelationPair } from "./RelationMap";

const lookupSymbol = Symbol("Relation lookup symbol");

type Size = { minSize: number; maxSize: number };

type RelationInitializer<A, B> = Relation<A, B> | RelationMap<A, B> | RelationPair<A, B>[];

type RelationTypeExtras<A, B> = RelationMapExtra<A, B> & {
    // Add algebraic composition once the basics are working.
    // The idea is that we don't have to copy or transform the RelationMap, we simple change how it is used by the Relation. This will be performant because we aren't iterating over the data many times or storing it in memory multiple times.
    // ? If I update the map in a base relation R, does this update it in all relations composed from it. It should right. But this sort of violates the principles of non-mutation. [shrug emoji]
    // reverse(): Relation<B, A>;
    // complement(): Relation<A, B>;
    // compose<C>(then: Relation<B, C>): Relation<A, C>;
    // composeAfter<T>(before: Relation<T, A>): Relation<T, B>;
    // coproduct?, product?
};

type RelationType<A, B> = RelationTypeExtras<A, B> & RelationMapExtra<A, B>;

type RelationOptions<A, B> = {
    // If fixedSets are provided, then all elements will be maintained on both sides without the ability to add or remove elements (but you can still add or remove relational pairs).
    fixedSets?: [Set<A>, Set<B>];

    // Note if the provided relation map is missing elements from the fixed sets, they will be added. If RelationMap has elements that are absent in fixedSets they will be deleted.
    init: RelationInitializer<A, B>;

    // Not able to add or remove elements or pairs.
    immutable: boolean;

    // For each A element, place limits on the size of Set<B>
    size: Size;

    // For each B element, place limits on the size of Set<A>
    sizeConverse: Size;

    // A symmetric relation has a pair (a, b) iff it has a pair (b,a)
    symmetric: boolean;
};

const getDefaultOptions = <A, B>(): RelationOptions<A, B> => {
    return {
        init: [],
        immutable: false,
        size: { minSize: 0, maxSize: Infinity },
        sizeConverse: { minSize: 0, maxSize: Infinity },
        symmetric: false,
    };
};

const getRelationMap = <A, B>(init: RelationInitializer<A, B>) => {
    let relMap: RelationMap<A, B>;

    if (init instanceof Relation) {
    } else {
        relMap = new RelationMap(init);
    }
};

class Relation<A, B> {
    private [lookupSymbol]: RelationMap<A, B> = new RelationMap();

    private options: RelationOptions<A, B>;

    constructor(options: Partial<RelationOptions<A, B>>) {
        const defaultOptions = getDefaultOptions<A, B>();
        this.options = { ...defaultOptions, ...options };
    }

    toRelMap(): RelationMap<A, B> {
        return this[lookupSymbol].clone();
    }
}
