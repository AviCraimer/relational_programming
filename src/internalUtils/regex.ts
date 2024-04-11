type StringOrStrings = string | Set<string> | string[];

// Escapes special characters is a string to make it safe to use the string as programmatic input when constructing a regex
const escapeRegExp = (str: string): string => str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const joinRegexParts = (parts: string[]): string => parts.join("|");

export const startsWithRegex = (args: StringOrStrings): RegExp => {
    const parts = Array.isArray(args) ? args : args instanceof Set ? [...args] : [args];
    const regexStr = `^(${joinRegexParts(parts.map(escapeRegExp))})`;
    return new RegExp(regexStr);
};

export const endsWithRegex = (args: StringOrStrings): RegExp => {
    const parts = Array.isArray(args) ? args : args instanceof Set ? [...args] : [args];
    const regexStr = `(${joinRegexParts(parts.map(escapeRegExp))})$`;
    return new RegExp(regexStr);
};
