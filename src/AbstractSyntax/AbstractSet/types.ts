import { IndividualVariable } from "../AbstractIndividual/types";
import { RelationExpression } from "../RelationExpression/types";

export type SetExpression = AtomicSet | ProductSet | CoproductSet | UnionSet | IntersectionSet | SingletonSet | EmptySet | BooleanSet | RelationSet | ImageSet;

const setSyntaxLabels = ["AtomicSet", "ProductSet", "CoproductSet", "UnionSet", "IntersectionSet", "SingletonSet", "EmptySet", "RelationSet", "BooleanSet", "ImageSet"] as const;

export type SetSyntaxLabel = (typeof setSyntaxLabels)[number];

export type SetExpressionCommon = {
    type: "SetExpression";
    syntax: SetSyntaxLabel;
    children: SetExpressionCommon[] | never[];
};

export type AtomicSet = SetExpressionCommon & {
    syntax: "AtomicSet";
    children: never[];
    setVariable: string;
};
export type ProductSet = SetExpressionCommon & {
    syntax: "ProductSet";
    children: SetExpression[];
};

export type CoproductSet = SetExpressionCommon & {
    syntax: "CoproductSet";
    children: SetExpression[];
};

export type UnionSet = SetExpressionCommon & {
    syntax: "UnionSet";
    children: SetExpression[];
};
export type IntersectionSet = SetExpressionCommon & {
    syntax: "IntersectionSet";
    children: SetExpression[];
};
export type SingletonSet = SetExpressionCommon & {
    syntax: "SingletonSet";
    individualVariable: IndividualVariable;
    children: [];
};
export type EmptySet = SetExpressionCommon & {
    syntax: "EmptySet";
    children: never[];
};
export type RelationSet = SetExpressionCommon & {
    syntax: "RelationSet";
    relationExpression: RelationExpression<any, any>;
    children: never[];
};
export type BooleanSet = SetExpressionCommon & {
    syntax: "BooleanSet";
    children: never[];
};

// We are using a default argument here instead of a generic constraint to get around the circularity of the mutual type definition. Take care sure not to pass in an incorrect type.
export type ImageSet<R = RelationExpression<any, any>> = SetExpressionCommon & {
    syntax: "ImageSet";
    relationExpression: R;
    children: never[];
};
