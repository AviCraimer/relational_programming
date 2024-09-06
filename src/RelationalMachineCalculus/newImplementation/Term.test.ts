import { RMCVarSym, RMCFuncSym } from "./symbols";
import { Variable, RMCFuncTerm, RMCConstantFuncTerm } from "./Term";

// Variables
const x: Variable = { type: RMCVarSym, name: "x" };
const y: Variable = { type: RMCVarSym, name: "y" };

// Simple functions
const add: RMCFuncTerm<number> = {
    type: RMCFuncSym,
    arity: 2,
    arguments: [x, y],
    runtime: (a: number, b: number) => a + b,
};

const concat: RMCFuncTerm<string> = {
    type: RMCFuncSym,
    arity: 2,
    arguments: [x, y],
    runtime: (a: string, b: string) => a + b,
};

// Nested constant function
const nestedFunc: RMCConstantFuncTerm<number | string> = {
    type: RMCFuncSym,
    arity: 2,
    arguments: [
        {
            type: RMCFuncSym,
            arity: 1,
            arguments: [{ type: RMCFuncSym, arity: 0, arguments: [], runtime: () => 5 }],
            runtime: (a: number|string) => a * 2,
        },
        {
            type: RMCFuncSym,
            arity: 1,
            arguments: [{ type: RMCFuncSym, arity: 0, arguments: [], runtime: () => 3 }],
            runtime: (a: number|string):(number|string) => typeof a === 'string' ? return a : a + 1,
        },
    ],
    runtime: (a: number, b: number) => a + b,
};

export const TermExamples = {
    x,
    y,
    add,
    concat,
    nestedFunc,
};
