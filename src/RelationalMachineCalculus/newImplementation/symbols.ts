// SYMBOLS
export const RMCVarSym = Symbol("RMC Variable");
export type RMCVarSym = typeof RMCVar;
export const RMCFuncSym = Symbol("RMC Function");
export type RMCFuncSym = typeof RMCFuncSym;
export const RMCFailSym = Symbol("RMC Failure");
export type RMCFailSym = typeof RMCFailSym;
export const RMCOperationSym = Symbol("RMC Operation");
export type RMCOperationSym = typeof RMCOperationSym;
export const continueUnicode = "★";
export const failUnicode = "𝟎"; // This is a unicode symbol, unlikely to be used as a string value. Use this instead of the symbol RMCFail.
