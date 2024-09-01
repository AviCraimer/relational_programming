import { TupleUpTo, Tail, Head } from "../internalUtils/TupleTypes";
import {ResolveType, UnionToTuple} from "../sharedTypes/utils"

// Give a tuple of strings

// Cannot be empty array
type SyntaxTypes = Readonly<Exclude<TupleUpTo<string, 10>, never[] | []>>;

// type Children<T extends SyntaxTypes> = TupleUpTo<T[number],10>

type Defs<T extends SyntaxTypes> =  {
        [K in T[number]]: {
            syntax: K,
            children: TupleUpTo<T[number], 10>,
            data: unknown
        }
}

type DefsUnion<T extends SyntaxTypes, D extends Defs<T>> = D[keyof D]

type DefsTuple<T extends SyntaxTypes, D extends Defs<T>> =  UnionToTuple<DefsUnion<T, D>>

const arithSyntax = ["number", "times", "plus"] as const

type ArithSyntaxUnion = typeof arithSyntax[number]

type ArithDefs =  {
    "number": {
        syntax: "number"
        data: number,
        children: never[],
    },
    "times": {
        syntax: "times"
        data: undefined,
        children: [ArithSyntaxUnion, ArithSyntaxUnion],
    },
    "plus": {
        syntax: "plus"
        data: undefined,
        children: [ArithSyntaxUnion, ArithSyntaxUnion],
    },
}

type TargetArithMkType = {
    number: (children: never[] , data: number ) => Readonly<{
     type: "Arithmetic"; // The provided "type" argument to mkInductive
     syntax: "number";
     children: never[];
     data: number
}>;
 plus: (children: [ArithSyntaxUnion, ArithSyntaxUnion], data: undefined) => Readonly<{
        type: "Arithmetic"
        syntax: "plus"
        data: undefined,
        children: [ArithSyntaxUnion, ArithSyntaxUnion],
    }>;
     times: (children: [ArithSyntaxUnion, ArithSyntaxUnion], data: undefined) => Readonly<{
        type: "Arithmetic"
        syntax: "times"
        data: undefined,
        children: [ArithSyntaxUnion, ArithSyntaxUnion],
    }>
}

type sdd = ArithDefs[keyof ArithDefs]

type ArithDefsUnion = DefsUnion<typeof arithSyntax, ArithDefs>
type ArithDefsTuple = DefsTuple<typeof arithSyntax, ArithDefs>

// const mkInductive = <T extends SyntaxTypes, D extends Defs<T>>(type: string, syntax: T) => {
//     type MkFunctionsRecursive<Keys extends Readonly<unknown[] | never[]>> = Keys extends [infer Key, ...infer Rest]
//         ? Key extends T[number]
//             ? { [K in Key]: (children: D[K]["children"], data: D[K]["data"]) => Readonly<{
//                 type: typeof type;
//                 syntax: K;
//                 children: D[K]["children"];
//                 data: D[K]["data"];
//             }> } & MkFunctionsRecursive<Rest>
//             : never
//         : {};

//     type MkFunctions = MkFunctionsRecursive<T>;

//     const result = {} as MkFunctions;

//     for (const key of syntax) {

//         result[key as keyof MkFunctions] = (children, data) => {
//             return {
//                 type,
//                 syntax: key,
//                 children,
//                 data
//             } as const;
//         };
//     }

//     return result;
// };


        type SyntaxObject<T extends SyntaxTypes, D extends Defs<T>, K extends keyof Defs<T>> = Readonly<{
                type: string;
                syntax: K;
                children:  D[K]["children"]; // ATTN!!! This needs to be turned into the objects recursively
                data: D[K]["data"];
            }>

        // Gets a union of syntax objects form a union syntax types.
        type SyntaxObjects<T extends SyntaxTypes, D extends Defs<T>, Union extends keyof Defs<T>> = {
            [K in Union]:  SyntaxObject<T, D, K>
        }[Union]

        type testSyntaxObjects = SyntaxObjects<typeof arithSyntax,  ArithDefs, "number"|"plus">
        // I need to keep them from distributing


        type MkFunction<T extends SyntaxTypes, D extends Defs<T>, K extends keyof Defs<T>> = {
            (children: D[K]["children"], data: D[K]["data"]): SyntaxObject<T, D, K>;
            syntax: K
        }


        type MkFunctionHead<T extends SyntaxTypes, D extends Defs<T>> =  MkFunction<T,D, T[0]>

        type MkFunctions<T extends SyntaxTypes, D extends Defs<T>> = {
            [K in T[number]]: MkFunction<T, D, K>
        }



function mkInductiveOnce  <T extends SyntaxTypes, D extends Defs<T>>(type: string, syntax: T) {

        const key : T[0] = syntax[0]
        const mk  =  ((children: D[T[0]]["children"], data: D[T[0]]["data"]) => ({
                type: type,
                syntax: key,
                children,
                data: data
        })) as MkFunctionHead<T,D>
        mk.syntax = key

        const [, ...rest] = syntax

        const result : [MkFunctionHead<T,D>, Tail<T>] =  [mk, rest as Tail<T>]
        return result
}

const mkInductive = <T extends SyntaxTypes, D extends Defs<T>>(type: string, syntax: T):MkFunctions<T,D>  => {

    // We intentionally avoid shadowing the T and D variables so we can use them to define current independent of the recursion
    const inner = <T2 extends SyntaxTypes, D2 extends Defs<T>>(type: string, syntax: T2, current: Partial<MkFunctions<T, D>> = {}) => {
        const [partialMkObject, rest] = mkInductiveOnce(type, syntax)

        if (rest.length === 0) {
            // When rest is lenth zero, we've recursed through all the syntax types.
            return current
        } else {
            const partial  = {
                [partialMkObject.syntax]: partialMkObject
            } as Partial<MkFunctions<T, D>>

            const newCurrent = {...current, ...partial}

            return inner(type, rest, newCurrent)
        }
    }

    const mkFunctions = inner<T,D>(type, syntax) as MkFunctions<T,D>

    return mkFunctions
}

const testArith = mkInductive<typeof arithSyntax, ArithDefs>("Arithmetic", arithSyntax)


const testFour = testArith.number([], 4)
const testFive = testArith.number([], 5)
const testFourPlusFive = testArith.plus([testFour, testFive], undefined)


    // const mkInductive = <T extends SyntaxTypes, D extends Defs<T>>(type: string, syntax: T) => {

    //     type SyntaxTuple = UnionToTuple<T>
    //     type SyntaxHead = SyntaxTuple[0]

    //     const mkPairs = syntax.map((key: T[number]) => {

    //         type Def = D[keyof D] & {syntax: key}

    //         const mk = (children: D[typeof key]["children"], data: D[typeof key]["data"]) => {
    //            return  {
    //             type,
    //             syntax: key,
    //             children,
    //             data
    //         } as const
    //         }
    //         return [key, mk] as const
    //     } )

    //     type MkFunc = (typeof mkPairs)[number][1]

    //     const constructors  =  Object.fromEntries(mkPairs) as {[K in T[number]]: MkFunc }

    //     return {
    //         type: `mk_${type}`,
    //         ...constructors
    //     }
    // }

    // const mkInductive = <T extends SyntaxTypes, D extends Defs<T>>(type: string, syntax: T) => {
    //     type MkFunctions = {
    //         [K in T[number]]: (children: D[K]["children"], data: D[K]["data"]) => Readonly<{
    //             type: typeof type;
    //             syntax: K;
    //             children: D[K]["children"];
    //             data: D[K]["data"];
    //         }>;
    //     };

    //     const result = {} as MkFunctions;

    //     for (const key of syntax) {
    //         result[key as T[number]] = (children: D[typeof key]["children"], data: D[typeof key]["data"]) => {
    //             return {
    //                 type,
    //                 syntax: key,
    //                 children,
    //                 data
    //             } as const;
    //         };
    //     }

    //     return result;
    // };

    type MkInductive<T extends SyntaxTypes, D extends Defs<T>> = ReturnType<typeof mkInductive<T, D>>[keyof D];

    // Gets a union of the expression object types for the inductive type
    type InductiveUnion<T extends SyntaxTypes, D extends Defs<T>> = ReturnType<MkInductive<T, D>>;

    type EvalFunction<T extends SyntaxTypes, D extends Defs<T>, R> = (expression: InductiveUnion<T, D>) => R;

    // We define a recursive evaluator assuming the evaluate function is passed in as an argument.
    type EvalDef<T extends SyntaxTypes, D extends Defs<T>, R> = {
        [K in keyof D]: (evaluate: EvalFunction<T, D, R>) => (expression: { syntax: K } & InductiveUnion<T, D>) => R;
    };

    const getEval = <T extends SyntaxTypes, D extends Defs<T>, R, ED extends EvalDef<T, D, R>>(evalDef: ED): EvalFunction<T, D, R> => {
        const fn: EvalFunction<T, D, R> = (expression) => {
            expression.syntax;
        };
    };

    // eval.

    // Equality / rewrites

    // const helper1 = <T extends SyntaxTypes>(syntaxTypes: T) => {
    //     type Keys = T[number]
    //     type syntaxTypes = {
    //         [K in Keys]: {
    //             syntax: K,
    //             children: Children<T>
    //         }
    //     }

    //     return (childrenDefs: ) =>
};
// Specify children
