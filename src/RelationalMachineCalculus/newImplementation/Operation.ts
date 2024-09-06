import { Term, Variable } from "./Term";
import { RMCOperationSym, failUnicode, continueUnicode } from "./symbols";

type OperationName = "continue" | "fail" | "sequence" | "iterate" | "branch" | "push" | "pop" | "newVar";

type OperationBase = {
    type: RMCOperationSym;
    operation: OperationName;
    toString: () => string;
};

// Continue operation
export type ContinueOp = { operation: "continue" } & OperationBase;

const continueToString = () => continueUnicode;

export const continueOp = (): ContinueOp => ({
    type: RMCOperationSym,
    operation: "continue",
    toString: continueToString,
});

// Fail operation
export type FailOp = { operation: "fail" } & OperationBase;

const failToString = () => failUnicode;

export const failOp = (): FailOp => ({
    type: RMCOperationSym,
    operation: "fail",
    toString: failToString,
});

// Sequence operation
export type SequenceOp<T, L> = { operation: "sequence"; first: RMCOperation<T, L>; second: RMCOperation<T, L> } & OperationBase;

const sequenceToString = (op: SequenceOp<any, any>) => `(${op.first.toString()};${op.second.toString()})`;

export const sequenceOp = <T, L>(first: RMCOperation<T, L>, second: RMCOperation<T, L>): SequenceOp<T, L> => ({
    type: RMCOperationSym,
    operation: "sequence",
    first,
    second,
    toString() {
        return sequenceToString(this);
    },
});

// Iterate operation (Kleene star)
export type IterateOp<T, L> = { operation: "iterate"; body: RMCOperation<T, L> } & OperationBase;

const iterateToString = (op: IterateOp<any, any>) => `(${op.body.toString()})*`;

export const iterateOp = <T, L>(body: RMCOperation<T, L>): IterateOp<T, L> => ({
    type: RMCOperationSym,
    operation: "iterate",
    body,
    toString() {
        return iterateToString(this);
    },
});

// Branch operation (non-deterministic)
export type BranchOp<T, L> = { operation: "branch"; left: RMCOperation<T, L>; right: RMCOperation<T, L> } & OperationBase;

const branchToString = (op: BranchOp<any, any>) => `(${op.left.toString()} + ${op.right.toString()})`;

export const branchOp = <T, L>(left: RMCOperation<T, L>, right: RMCOperation<T, L>): BranchOp<T, L> => ({
    type: RMCOperationSym,
    operation: "branch",
    left,
    right,
    toString() {
        return branchToString(this);
    },
});

// Push operation
export type PushOp<T, L> = { operation: "push"; term: Term<T>; location: L } & OperationBase;

const pushToString = (op: PushOp<any, any>) => `[${op.term.toString()}]${op.location}`;

export const pushOp = <T, L>(term: Term<T>, location: L): PushOp<T, L> => ({
    type: RMCOperationSym,
    operation: "push",
    term,
    location,
    toString() {
        return pushToString(this);
    },
});

// Pop operation
export type PopOp<T, L> = { operation: "pop"; term: Term<T>; location: L } & OperationBase;

const popToString = (op: PopOp<any, any>) => `${op.location}<${op.term.toString()}>`;

export const popOp = <T, L>(term: Term<T>, location: L): PopOp<T, L> => ({
    type: RMCOperationSym,
    operation: "pop",
    term,
    location,
    toString() {
        return popToString(this);
    },
});

// New variable operation
export type NewVarOp<T, L> = { operation: "newVar"; variable: Variable; body: RMCOperation<T, L> } & OperationBase;

const newVarToString = (op: NewVarOp<any, any>) => `∃${op.variable.name}.(${op.body.toString()})`;

export const newVarOp = <T, L>(variable: Variable, body: RMCOperation<T, L>): NewVarOp<T, L> => ({
    type: RMCOperationSym,
    operation: "newVar",
    variable,
    body,
    toString() {
        return newVarToString(this);
    },
});

// Union type of all operations
export type RMCOperation<T, L> = ContinueOp | FailOp | SequenceOp<T, L> | IterateOp<T, L> | BranchOp<T, L> | PushOp<T, L> | PopOp<T, L> | NewVarOp<T, L>;
