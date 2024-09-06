// Work in progress

import { pushOp, popOp, sequenceOp, branchOp, iterateOp, newVarOp, RMCOperation } from "./Operation";
import { RMCFuncTerm } from "./Term";
import { TermExamples } from "./Term.test";
const { x, y, add, concat, nestedFunc } = TermExamples;
// Simple operations
type Carrier = number | string;
type Locations = "a" | "b" | "c";

const pushX = pushOp<Carrier, Locations>(x, "a");
const popY = popOp<Carrier, Locations>(y, "b");

// Sequence operation
const seqOp = sequenceOp(pushX, popY);

// Branch operation
const branchOp1 = branchOp(pushOp(add as RMCFuncTerm<number | string>, "a" as Locations), pushOp(concat as RMCFuncTerm<number | string>, "b" as Locations));

// Iterate operation
const iterOp = iterateOp(seqOp);

// New variable operation
const newVarOp1 = newVarOp(y, pushOp(y, "c"));

// Complex nested operation
const complexOp: RMCOperation<number | string, "a" | "b" | "c"> = sequenceOp(
    branchOp(sequenceOp(pushOp(nestedFunc, "a"), iterateOp(popOp(x, "a"))), newVarOp(y, sequenceOp(pushOp(y, "b"), popOp(concat as RMCFuncTerm<number | string>, "c" as Locations)))),
    sequenceOp(pushOp(add as RMCFuncTerm<number | string>, "a" as Locations), popOp(x, "b"))
);
