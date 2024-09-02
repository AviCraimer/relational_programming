// Note to self. This code is mostly outdated, but the Sum steps may be useful for the new version.

import { isEqual } from "lodash";

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

type Sum = {
    type: "sum";
    left: RMCExpr;
    right: RMCExpr;
};

type Step = Push | Pop | Sum;

type StepNames = Step["type"];

type RMCExpr = {
    type: "RMCExpr";
    sequence: (Pop | Push)[];
};

const stepToString = (step: Step): string => {
    if (step.type === "pop") {
        return `<${step.varName}>`;
    } else if (step.type === "push") {
        return `[${step.varName}]`;
    } else if (step.type === "sum") {
        return `(${exprToString(step.left)}+${exprToString(step.right)})`;
    }
    return step;
};

const exprToString = (expr: RMCExpr): string => {
    return `[ ${expr.sequence.map(stepToString).join(" ; ")} ]`;
};

const getVariableNames = (expr: RMCExpr) => {
    return [...new Set(expr.sequence.map((step) => step.varName))];
};

const isVariable = (arg: unknown): arg is Variable => {
    return !!arg && typeof arg === "object" && "type" in arg && arg.type === RMCVar;
};

const RMCMachine =
    (expr: RMCExpr) =>
    <T>(input: RMCStack<T>, logging: boolean = false): (RMCStack<T> | typeof RMCFail)[] => {
        // Create a mutable copy of the program instructions for execution.
        const program = [...expr.sequence];
        // The current operating stack
        const stack = input.clone();

        // Any fully resolved stacks
        const outputs: RMCStack<T>[] = [];

        // Note, when the env variable has not been defined its value is RMCVar. When it has been defined to equal another variable it's value is Variable. Defining it to be a variable with the same name is the same as leaving it undefined.
        const environment: Record<string, T | Variable | typeof RMCVar> = {};

        // We initialize variables in the environment as variable. As we execute the program we fill in the constant values as we go.
        getVariableNames(expr).forEach((varName) => (environment[varName] = RMCVar));

        type ExecuteStepFn = (step: Step) => typeof RMCFail | "next";

        const executePop = (pop: Pop) => {
            const { varName } = pop;
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
        };

        const executePush = (push: Push): "next" => {
            const { varName } = pop;
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
        };

        const executeSum = (sum: Sum): "next" => {
            logging && console.log("Left Side:");
            const leftResults = RMCMachine(sum.left)(stack, logging);

            logging && console.log("Right Side:");
            const rightResults = RMCMachine(sum.right)(stack, logging);

            return [...leftResults, ...rightResults];
        };

        const stepFns: { [K in StepNames]: (varName: string) => typeof RMCFail | "next" } = {
            pop: executePop,
            push: executePush,
            sum: executeSum,
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
