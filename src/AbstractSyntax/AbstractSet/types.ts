// Define a data structure to be used for abstract syntax set.

const setsSubtypesRelations = [
    ["Number", "Integer"],
    ["Number", "Natural"],
    ["String", "String"],
    ["{uuid:String}", "{uuid:String}"], // An object with a uuid field (not excluding additional properties)
    // TODO: Consider if I should add support for these:
    // ["{id:String}", "{id:String}"], // Use for id strings which are unique within a collection but not universally unique
    // ["{id:Number}", "{id:Number}"], // Use for id integers which are unique within a collection but not universally unique
] as const;

type PredefinedSetTypeLabel = (typeof setsSubtypesRelations)[number][0] | (typeof setsSubtypesRelations)[number][1];

type FiniteSetLabel<T extends PredefinedSetTypeLabel> = `FiniteSet<${T}>`;

type PredefinedSetType<T extends PredefinedSetTypeLabel> = T extends "Number" | "Natural" | "Integer" ? Number : never | T extends "String" ? String : never | T extends "{uuid:String}" ? { uuid: String } : never;

type SetTypeLabel = PredefinedSetTypeLabel | FiniteSetLabel<PredefinedSetTypeLabel>;

type SetFiniteType<T extends PredefinedSetTypeLabel> = Set<PredefinedSetType<T>>;

type AbstractSet<T> = T extends PredefinedSetTypeLabel ? SetFinite<T> : never | SetComplement<T> | T extends [infer A, infer B] ? SetProduct<[A, B]> : never;

export type SetPredefined<A extends PredefinedSetTypeLabel> = {
    type: "SetExpression";
    syntax: "SetPredefined";
    setType: A;
};

export type SetFinite<A extends PredefinedSetTypeLabel> = {
    // A should be constrained to be a valid type for the set expression.
    type: "SetExpression";
    syntax: "FiniteSet";
    setType: FiniteSetLabel<A>;
    value: Set<A>;
};

export type SetComplement<A extends PredefinedSetTypeLabel> = {
    type: "SetExpression";
    syntax: "SetComplement";
    children: [Set<A>];
};

export type SetProduct<Pair extends [unknown, unknown]> = Pair extends [infer A, infer B]
    ? {
          type: "SetExpression";
          syntax: "SetProduct";
          children: [A, B];
      }
    : never;

export type SetInjection<T, I extends 0 | 1> = 0 | 1 extends I
    ? never // This ensures we don't have both 0 and 1
    : {
          type: "SetFunctionExpression";
          syntax: "CoproductInjection";
          side: I;
          value: T;
      };

export type SetCoproduct<Pair extends [unknown, unknown]> = Pair extends [infer A, infer B]
    ? {
          type: "SetExpression";
          syntax: "Coproduct";
          injection: SetInjection<A, 0> | SetInjection<B, 1>;
      }
    : never;
