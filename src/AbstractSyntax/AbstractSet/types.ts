import { IndividualVariable } from "../AbstractIndividual/types";

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
    relationExpression: RelationExpression<unknown, unknown>;
    children: never[];
};
export type BooleanSet = SetExpressionCommon & {
    syntax: "BooleanSet";
    children: never[];
};

export type ImageSet = SetExpressionCommon & {
    syntax: "ImageSet";
    relationExpression: RelationExpression<unknown, unknown>;
    children: never[];
};
