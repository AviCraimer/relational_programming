import { TypeEq } from "../../sharedTypes/utils";
import { CoproductSet, ProductSet, SetExpression, SingletonSet } from "../AbstractSet/types";

export type RelationExpression<A extends SetExpression, B extends SetExpression> =
    | AtomicRelation<A, B>
    | EmptyRelation<A, B>
    | ComplementRelation<A, B>
    | ConverseRelation<A, B>
    | ComposedRelation<A, B>
    | SetRelation<A, B>
    | FullRelation<A, B>

    // Relations with restricted domains/codomains
    // SingletonSet
    | TypeEq<A, B> extends true
    ? A extends SingletonSet
        ? SingletonRelation<A>
        : never
    : never | A extends ProductSet
    ? B extends ProductSet
        ? ProductRelation<A, B>
        : never
    : never | A extends CoproductSet
    ? B extends CoproductSet
        ? PlusRelation<A, B>
        : never
    : never;

const relationSyntaxLabels = ["AtomicRelation", "SingletonRelation", "FullRelation", "EmptyRelation", "ComplementRelation", "ConverseRelation", "ComposedRelation", "ProductRelation", "PlusRelation", "SetRelation"] as const;

type RelationSyntaxLabel = (typeof relationSyntaxLabels)[number];

type RelationExpressionCommon = {
    type: "RelationExpression";
    syntax: RelationSyntaxLabel;
    domain: SetExpression;
    codomain: SetExpression;
    children: RelationExpressionCommon[] | never[];
};

type AtomicRelation<A extends SetExpression, B extends SetExpression> = RelationExpressionCommon & {
    type: "RelationExpression";
    syntax: "AtomicRelation";
    relationName: string;
    domain: A;
    codomain: B;
    children: never[];
};

// Lift any value a:A to a relation {a} x {a}
type SingletonRelation<A extends SingletonSet> = RelationExpressionCommon & {
    syntax: "SingletonRelation";
    domain: A;
    codomain: A;
    children: never[];
};

// For types A and B the full relation has all pairs. If fixedSets are specified for either domain or codomain, then the full relation is restricted to the provided set. No RelationMap is needed since it would be pointless to use memory to store everything.
type FullRelation<A extends SetExpression, B extends SetExpression> = RelationExpressionCommon & {
    syntax: "FullRelation";
    domain: A;
    codomain: B;
    children: never[];
};

// Similar to full, but with no pairs. Essentially, this just stores the domain and codomain.
type EmptyRelation<A extends SetExpression, B extends SetExpression> = RelationExpressionCommon & {
    syntax: "EmptyRelation";
    domain: A;
    codomain: B;
    children: never[];
};

// For all R subset A x B, take all pairs (a, b) of A x B which are not in R.
type ComplementRelation<A extends SetExpression, B extends SetExpression> = RelationExpressionCommon & {
    syntax: "ComplementRelation";
    children: [RelationExpression<A, B>];
    domain: A;
    codomain: B;
};

// For R subset A x B, take the reversed pairs (b, a) to form a relation subset B x A.
type ConverseRelation<B extends SetExpression, A extends SetExpression> = RelationExpressionCommon & {
    syntax: "ConverseRelation";
    domain: B;
    codomain: A;
    children: [RelationExpression<A, B>];
};

// The compatibility of the middle codomain/domain will be enforced at runtime.
// If we have two relations A-R->B C-S->D, they are composable if B is a subset of C or C is a subset of B.
// This is a slight generalization from the normal rule.
// We could simplify this by saying that any relations can be composed, but if the middle set is disjoint the resulting composed relation will be empty (this follows from the definition of composition since there is no thread running from beggining to end)
type ComposedRelation<A extends SetExpression, C extends SetExpression> = RelationExpressionCommon & {
    syntax: "ComposedRelation";
    children: [RelationExpression<A, any>, RelationExpression<any, C>];
    domain: A;
    codomain: C;
};

type ProductRelation<A extends ProductSet, B extends ProductSet> = RelationExpressionCommon & {
    syntax: "ProductRelation";
    children: RelationExpression<SetExpression, SetExpression>[];
    domain: A;
    codomain: B;
};

type PlusRelation<A extends CoproductSet, B extends CoproductSet> = RelationExpressionCommon & {
    syntax: "PlusRelation";
    children: RelationExpression<SetExpression, SetExpression>[];
    domain: A;
    codomain: B;
};

// Turn a set of pairs into a relation.
type SetRelation<A extends SetExpression, B extends SetExpression> = RelationExpressionCommon & {
    syntax: "SetRelation";
    // This must be a product with
    setExpression: ProductSet & { children: [A, B] };
    children: never[];
    domain: A;
    codomain: B;
};

/*
    Notes/Ideas:

Okay, I just had an idea. There should be an operator that turns any image of a Cartesian product into a relation.

A -R-> B x C

Then you have the image of R as a set, but you also have it as a relation.

This allows us to go back and forth between relations as as morphisms and relations as objects.

We can allow relations to be domains and codomains because they can be regarded as sets. We can also allow sets of pairs to be changed back into relations.

If we use the image of a relation that has a relation as codomain, we are defining a subrelation of that relation.

A -S-> R

RelImage(S) is a sub relation of R.

It might be important to keep track of these subrelation relationships.


---
compose:
  -- Middle terms don't have to match. We don't actually need to define the set for the middle term of the composition. Just check if the thread goes through or not.

both(R:A->B, S:C->D): AxC ->BxD

atLeastOne(R:A->B, S:C->D): AxC ->BxD

switch(R:A->B, S:C->D): A+C -> B+D

with(R:A->B, S:C->D): A+C -> B+D
-- I'm not sure what this really means. Got to think more about how it is useful in programming.

pipe(R:A->B, S:C->D):R;S: A -> D

reverse(R:A->B): B -> A

not(R:A->B): A -> B

anti(R)= reverse(not(R))

full(a or A, b or B)

empty(a or A, b or B)

copy - A -> AxA
uncopy AxA -> A
-- Can use composition to implement contration/pairing

contract -- If the sets on either end of the relation are the same in a Cartesian product, it reduces them to a single set.

E.g,
contract(A x A -RxS-> B x C)  =  A -[RxS]-> B x C
-- Here a, relates to (b, c) if a relates to b by R and to c by S.
-- It can work the same if A x A is in the codomain, unlike with functions. Just take the converse, then do the same thing, and then converse again.

- This works just the same as the version with the Cartesian product input, but removes the duplication. Note that this only works because A and A are the same.

- Although, with a relation, it could work even if The two sides of the Cartesian product are subsets in one direction or the other. Interesting, this is similar to composition. But this could actually be really practical.

- This is really important for expressing certain conceptual things. When you want to say that two relations hold of the same thing. This is how you can do it.


# SET OPERATIONS
imageSet(R) - yields set of image
  -- We can combine image with reverse and not to get 4 sets for every relation. domain-image, codomain-image, domain-anti-image, codomain-anti-image
  -- Using composition and complement we can easily filter and subtract from the image (see below)
  -- How do we add to the image using composition? Well we can form disjoint unions.

unifySet(S) - takes a set which may be a disjoint union, and if it is performs set theoretic union on each of the disjoint parts. This is useful when extracting sets from additive composites.

relationSet(R) - this gives the set of relation pairs that may be used as domain and codomain to define a relation. This allows for higher order relations. The relation is not thrown away, the set is just a syntactic wrapper for the relation. The algebra is preserved.




# IDEAS FOR PROGRAMMING

- Filtering

##  Get fibers for subset of domain or codomain:
    --  R;full(S) where S subset codomain(R)
    -- full(S);R where S subset domain(R)

## Difference of relations.
R and S have the same domain an codomain. We want to include pairs of R only if they are not in S.

R;not(S)

- We compose R with the complement of S. This means not(S) is full except for S's pairs so any pairs in R will be preserved except those that are pairs of S. Interestingly, we can do the same if we pre-compose.

not(S);R

Does that mean in general not(S);R = R;not(S)? That would be a nice thing to prove. Is composition commutative in for relations? Hmm... that would be good to know. I guess it might well be.



Okay, I just had an idea. There should be an operator that turns any image of a Cartesian product into a relation.

A -R-> B x C

Then you have the image of R as a set, but you also have it as a relation.

This allows us to go back and forth between relations as as morphisms and relations as objects.

We can allow relations to be domains and codomains because they can be regarded as sets. We can also allow sets of pairs to be changed back into relations.

If we use the image of a relation that has a relation as codomain, we are defining a subrelation of that relation.

A -S-> R

RelImage(S) is a sub relation of R.

It might be important to keep track of these subrelation relationships.






    */
