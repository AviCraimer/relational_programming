import { RMCVarSym, RMCFuncSym } from "./symbols";
import { TupleLength, Tuple } from "@shared-generic";
import _ from "lodash";
import deepDash from "deepdash";
const findValueDeep = deepDash(_).findDeep;
export type Variable = {
    type: RMCVarSym;
    name: string;
    local?: true;
};

export const isVariable = (arg: unknown): arg is Variable => {
    return !!arg && typeof arg === "object" && "type" in arg && arg.type === RMCVarSym;
};

export type Term<T> =
    | Variable
    | {
          type: RMCFuncSym;
          arity: TupleLength;
          arguments: Term<T>[];
          runtime: (...args: T[]) => T;
      };

export type RMCFuncTerm<T> = Exclude<Term<T>, Variable>;

export const isRMCFunc = <T>(arg: Term<T>): arg is RMCFuncTerm<T> => {
    return !!arg && typeof arg === "object" && "type" in arg && arg.type === RMCFuncSym;
};

// Checks deeply that there are no variables in a term. This ensures that a function term doesn't have variables in nested arguments.
export type RMCConstantFuncTerm<T> = Omit<RMCFuncTerm<T>, "arguments"> & { arguments: RMCConstantFuncTerm<T>[] };
export const isConstantFuncTerm = <T>(term: Term<T>): term is RMCConstantFuncTerm<T> => {
    const result = findValueDeep(term, (varSym) => varSym === RMCVarSym);
    return result === undefined;
};

// Allows narrowing the function term type by arity.
export type RMCFuncTermNarrow<T, Ar extends TupleLength> = RMCFuncTerm<T> & { type: RMCFuncSym; arity: Ar; arguments: Tuple<Term<T>, Ar>; computedArguments?: Tuple<T, Ar>; runtime: (...args: Tuple<T, Ar>) => T };

export type RMCRuntime<T, Ar extends TupleLength> = RMCFuncTermNarrow<T, Ar>["runtime"];

export const computeFnValue = <T>(constFn: RMCConstantFuncTerm<T>): T => {
    if (constFn.arity !== constFn.arguments.length) {
        throw new Error("RMC Function arguments do not match the function arity.");
    }

    if (constFn.arity === 0) {
        return constFn.runtime();
    } else {
        const computedArguments: T[] = constFn.arguments.map((argTerm) => computeFnValue(argTerm));
        return constFn.runtime(...computedArguments);
    }
};
