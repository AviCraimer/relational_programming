// Demonstration of Push-Pop Calculus from section 1.2 of the paper.
// Paper: https://arxiv.org/abs/2405.10801

import { isEqual } from "lodash";
import { Multiset } from "./MultiSet";
const RMCVar = Symbol("RMC Variable");

const RMCFail = Symbol("RMC Failure");

type Variable = {
    type: typeof RMCVar;
    varName: string;
};

class RMCStack<T> {
    private items: (T | Variable)[] = [];

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
}

// Expressions
type Pop = {
    type: "pop";
    varName: string;
};

type Push = {
    type: "push";
    varName: string;
};

type Step = Push | Pop;

type StepNames = Step["type"];

type RMCExpr = {
    type: "RMCExpr";
    sequence: (Pop | Push)[];
};

// The string is the variable name. Which is mapped to a value T or a variable. If a variable is undefined, it's name will not be in the keys.
type SubstitutionMap<T> = Map<string, T | Variable>;

type RMCMemory<T> = {
    stacks: Multiset<RMCStack<T>>;
    substitutionMap: SubstitutionMap<T>;
    program: RMCExpr;
};

const stepToString = (step: Step) => {
    if (step.type === "pop") {
        return `<${step.varName}>`;
    } else if (step.type === "push") {
        return `[${step.varName}]`;
    }
    let x: never;
    x = step;
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

const applySubstitution = <T>(varName: string, substitutionMap: SubstitutionMap<T>): T | Variable => {
    const hasDef = substitutionMap.has(varName);

    if (hasDef) {
        const definition = substitutionMap.get(varName) as Variable | T;

        if (isVariable(definition)) {
            // Go to the end of the chain of variables defined as variables. This will terminate in a variable that is undefined (in which case the variable itself is returned) or defined as a non-variable value.
            return applySubstitution(definition.varName, substitutionMap);
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
};

const updateSubstitution =
    (varName: string) =>
    <T>(definition: Variable | T) =>
    (substitutionMap: SubstitutionMap<T>) => {
        if (substitutionMap.has(varName)) {
            throw new Error("variable is already defined, cannot be changed.");
        }
        const newMap = new Map(substitutionMap);

        newMap.set(varName, definition);
        return newMap;
    };

const popExec: RMCExecutionFn = ({ program, stacks, substitutionMap }) => {
    const [pop, ...rest] = program.sequence;
    if (pop.type !== "pop") {
        throw new Error();
    }
    const { varName } = pop;

    // Have to apply this to multiple stacks!
    // TODO: come back to this.
    const popResult = stack.pop();

    const definition = applySubstitution(varName, substitutionMap);
    if (isVariable(definition)) {
        updateSubstitution(definition.varName);
    } else {
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
