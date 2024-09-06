import { UnionToTuple } from "shared-generic";
// Demonstration of Push-Pop Calculus from section 1.2 of the paper.
// Paper: https://arxiv.org/abs/2405.10801

import { isEqual } from "lodash";
import { UnionToTuple } from "@shared-generic";

// SYMBOLS
const RMCVar = Symbol("RMC Variable");
const RMCFail = Symbol("RMC Failure");
const starUnit = "★";
const failUnit = "𝟎"; // This is a unicode symbol, unlikely to be used as a string value. Use this instead of the symbol RMCFail.

// TYPE ALIASES
type Variable = {
    type: typeof RMCVar;
    varName: string;
};

type Location = string;

// Expressions
type Pop<L extends Location> = {
    type: "pop";
    location: L;
    varName: string;
};

type Push<L extends Location> = {
    type: "push";
    location: L;
    varName: string;
};

type Sum<L extends Location> = {
    type: "sum";
    left: RMCExpr<L>;
    right: RMCExpr<L>;
};

// Does nothing, and can be used to represent successful computation
type Skip = {
    type: "skip";
};

type Step<L extends Location> = Push<L> | Pop<L> | Sum<L> | Skip;

type StepNames = Step<Location>["type"];

// L is the set of stack locations
type RMCExpr<L extends Location> = {
    type: "RMCExpr";
    sequence: Step<L>[];
};

// Memory is a set of stacks indexed by location. Here we use strings for location names.
type RMCMemory<T, L extends string> = {
    [K in L]: RMCStack<T>;
};

// An RMCState is a memory (set of stacks) together with a substitution map
type iRMCState<T, L extends string> = {
    memory: RMCMemory<T, L>;
    substitutionMap: Map<string, Variable | T>;
};

// The input or outputs for an RMC machine is a multiset of RMCStates
type RMCInputOutput<T, L extends string> = Map<RMCState<T, L>, number>;

type RMCMachine = <T, L extends string>(program: RMCExpr<L>, initial: RMCInputOutput<T, L>) => RMCInputOutput<T, L>;

// The string is the variable name. Which is mapped to a value T or a variable. If a variable is undefined, it's name will not be in the keys.
type SubstitutionMap<T> = Map<string, T | Variable>;

// CLASS DATA STRUCTURES
class Substitutions<T> {
    private substitutionMap: SubstitutionMap<T> = new Map();
    applySubstitution(varName: string): T | Variable {
        const hasDef = this.substitutionMap.has(varName);

        if (hasDef) {
            const definition = this.substitutionMap.get(varName) as Variable | T;

            if (isVariable(definition)) {
                // Go to the end of the chain of variables defined as variables. This will terminate in a variable that is undefined (in which case the variable itself is returned) or defined as a non-variable value.
                return this.applySubstitution(definition.varName);
            } else {
                return definition;
            }
        } else {
            const self: Variable = {
                type: RMCVar,
                varName,
            };
            return self;
        }
    }
    update(varName: string, definition: Variable | T): typeof this {
        if (this.substitutionMap.has(varName)) {
            throw new Error("variable is already defined, cannot be changed.");
        }

        this.substitutionMap.set(varName, definition);
        return this;
    }

    // Check equality of substitutions by value.
    eq(substitutionsB: Substitutions<unknown>) {
        return isEqual(substitutionsB.substitutionMap, this.substitutionMap);
    }
}

class RMCStack<T> {
    private items: (T | Variable)[] = [];
    private multisetCount: number = 1;
    substitutionMap: SubstitutionMap<T> = new Map();

    increment() {
        this.multisetCount = this.multisetCount + 1;
    }
    get count(): number {
        return this.multisetCount;
    }
    push(item: T | Variable): RMCStack<T> {
        this.items.push(item);
        return this;
    }

    pop(): T | Variable | typeof RMCFail {
        return this.items.pop() ?? RMCFail;
    }

    peek(): T | Variable | typeof RMCFail {
        return this.items[this.items.length - 1] ?? RMCFail;
    }

    length(): number {
        return this.items.length;
    }

    toString(): string {
        return this.items.join(" ");
    }
    clone(): RMCStack<T> {
        const copy = new RMCStack<T>();
        copy.items = [...this.items];
        return copy;
    }
    eq(stackB: RMCStack<T>) {
        if (this.items.length !== stackB.items.length) {
            return false;
        } else {
            return this.items.every((item, i) => isEqual(item, stackB.items[i]));
        }
    }
}

// Takes a set of a locations and a type and returns a memory.
const initMemory = <T, L extends Location>(locations: L[]) => {
    const memory: { [x: string]: RMCStack<T> } = {};
    locations.forEach((l: L) => {
        memory[l] = new RMCStack<T>();
    });
    return memory as RMCMemory<T, L>;
};

const test1 = initMemory(["cat", "dog"]);

class RMCState<T, L extends Location> implements iRMCState<T, L> {
    memory: RMCMemory<T, L> = new Map();
    substitutionMap: Map<string, Variable | T> = new Map();

    eq;
}

{
    // Each stack has a substitution map associated with it as well as a multiset count.
    stacks: RMCStack < T > [];
    program: RMCExpr;
}

const stepToString = <L extends Location>(step: Step<L>): string => {
    switch (step.type) {
        case "pop":
            return `${step.location}<${step.varName}>`;
        case "push":
            return `[${step.varName}]${step.location}`;
        case "sum":
            return `(${step.left} + ${step.right})`;
        case "skip":
            return starUnit;
    }
};

const exprToString = (expr: RMCExpr) => {
    return `[ ${expr.sequence.map(stepToString).join(" ; ")} ]`;
};

// const getVariableNames = (expr: RMCExpr) => {
//     return [...new Set(expr.sequence.map((step) => step.varName))];
// };

const isVariable = (arg: unknown): arg is Variable => {
    return !!arg && typeof arg === "object" && "type" in arg && arg.type === RMCVar;
};

type RMCExecutionFn = <T>(memory: RMCMemory<T>) => RMCMemory<T>;

// For each step type in the sequence we have an RMC Execution Function
type RMCStepFns = {
    [S in StepNames]: RMCExecutionFn;
};

const popExec: RMCExecutionFn = <T>({ program, stacks }) => {
    const [pop, ...rest] = program.sequence;
    if (pop.type !== "pop") {
        throw new Error();
    }
    const { varName } = pop;

    // Have to apply this to multiple stacks!
    // TODO: come back to this.
    function popOneStack(stack: RMCStack<T>) {
        const { substitutionMap } = stack;
        const definition = applySubstitution(varName, substitutionMap);
        const popResult = stack.pop();
        if (popResult === RMCFail) {
            return RMCFail;
        }
        if (isVariable(definition)) {
            // If the definition is a variable that implies it is an undefined variable. Otherwise it would have been replaced with either the constant or another variable that it is defined to be.
            stack.substitutionMap = updateSubstitution(definition.varName)(substitutionMap);
        } else {
        }
    }
};
const pushExec: RMCExecutionFn = ({ program, stacks, substitutionMap }) => {};

const RMCMachine =
    (expr: RMCExpr) =>
    <T>(input: RMCStack<T>, logging: boolean = false) => {
        // Create a mutable copy of the program instructions for execution.
        const program = [...expr.sequence];
        const stack = input.clone();

        // Note, when the env variable has not been defined its value is RMCVar. When it has been defined to equal another variable it's value is Variable. Defining it to be a variable with the same name is the same as leaving it undefined.
        const environment: Record<string, T | Variable | typeof RMCVar> = {};

        // We initialize variables in the environment as variable. As we execute the program we fill in the constant values as we go.
        getVariableNames(expr).forEach((varName) => (environment[varName] = RMCVar));

        function executePop(varName: string): typeof RMCFail | "next" {
            const popResult = stack.pop();
            // Case: Pop failed (nothing on the stack)
            if (popResult === RMCFail) {
                return RMCFail;
                //Case: Variable is undefined
            } else if (environment[varName] === RMCVar) {
                // Variable is assigned to value of to another variable
                if ((isVariable(popResult) && varName !== popResult.varName) || !isVariable(popResult)) {
                    environment[varName] = popResult;
                    return "next";
                }
                // Variable is defined
            } else {
                const varVal = environment[varName];
                // If variable is already defined, the popResult must equal the defined value or the program fails.
                return isEqual(popResult, varVal) ? "next" : RMCFail;
            }
            return RMCFail;
        }

        function executePush(varName: string): "next" {
            let pushValue = environment[varName];

            // If variable is not defined, the push value is the variable itself.
            if (pushValue === RMCVar) {
                pushValue = {
                    type: RMCVar,
                    varName,
                };
            }

            stack.push(pushValue);
            return "next";
        }

        const stepFns: { [K in StepNames]: (varName: string) => typeof RMCFail | "next" } = {
            pop: executePop,
            push: executePush,
        };

        function executeStep(logging: boolean): typeof RMCFail | "done" | "next" {
            if (program.length === 0) {
                logging && console.log("Program is done");
                return "done";
            }

            const step = program.shift()!;

            const stepResult = stepFns[step.type](step.varName);

            logging && console.log(`Step ${stepToString(step)} has ${RMCFail === stepResult ? "failed" : "succeeded"}`);

            return stepResult;
        }

        function executeProgram(logging: boolean) {
            logging && console.log(`\n\nExecuting program: ${exprToString(expr)}\nInput Stack: ${input.toString()}`);

            let status: typeof RMCFail | "done" | "next" = "next";
            while (status === "next") {
                status = executeStep(logging);
            }

            if (status === "done") {
                logging && console.log(`\n***Output Stack*** \n`, stack.toString(), "\n******");
                return stack;
            }
            return RMCFail;
        }

        executeProgram(logging);
    };

const section1_2_Expr: RMCExpr = {
    type: "RMCExpr",
    sequence: [
        { type: "pop", varName: "x" },
        { type: "pop", varName: "y" },
        { type: "pop", varName: "z" },
        { type: "push", varName: "x" },
        { type: "push", varName: "z" },
        { type: "push", varName: "y" },
    ],
};
const section1_2_Stack = new RMCStack<string>().push("e").push("d").push("c");
RMCMachine(section1_2_Expr)(section1_2_Stack, true);
// Works as expected permuting stack e d c to c e d

const matchingExpr: RMCExpr = {
    type: "RMCExpr",
    sequence: [
        { type: "pop", varName: "x" },
        { type: "pop", varName: "x" },
        { type: "push", varName: "x" },
    ],
};

const stackCC = new RMCStack<string>().push("c").push("c");
// RMCMachine(matchingExpr)(stackCC, true);
// Works as expected returning a stack c

const stackDC = new RMCStack<string>().push("d").push("c");
RMCMachine(matchingExpr)(stackDC, true);
// Fails on the second step as expected since x is already assigned to c which doesn't match the value d.
