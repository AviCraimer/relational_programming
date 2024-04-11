import { startsWithRegex, endsWithRegex } from "./regex";

describe("startsWithRegex", () => {
    test("returns correct regex for a single string", () => {
        const regex = startsWithRegex("hello");
        expect(regex).toEqual(/^(hello)/);
        expect(regex.test("hello world")).toBe(true);
        expect(regex.test("world hello")).toBe(false);
    });

    test("returns correct regex for an array of strings", () => {
        const regex = startsWithRegex(["hello", "hi"]);
        expect(regex).toEqual(/^(hello|hi)/);
        expect(regex.test("hello world")).toBe(true);
        expect(regex.test("hi there")).toBe(true);
        expect(regex.test("hey hello")).toBe(false);
    });

    test("returns correct regex for a set of strings", () => {
        const regex = startsWithRegex(new Set(["hello", "hi"]));
        expect(regex).toEqual(/^(hello|hi)/);
        expect(regex.test("hello world")).toBe(true);
        expect(regex.test("hi there")).toBe(true);
        expect(regex.test("hey hello")).toBe(false);
    });

    test("escapes special characters in the input strings", () => {
        const regex = startsWithRegex(["hello.", "hi*"]);
        expect(regex).toEqual(/^(hello\.|hi\*)/);
        expect(regex.test("hello. world")).toBe(true);
        expect(regex.test("hi* there")).toBe(true);
        expect(regex.test("hello world")).toBe(false);
    });
});

describe("endsWithRegex", () => {
    test("returns correct regex for a single string", () => {
        const regex = endsWithRegex("world");
        expect(regex).toEqual(/(world)$/);
        expect(regex.test("hello world")).toBe(true);
        expect(regex.test("world hello")).toBe(false);
    });

    test("returns correct regex for an array of strings", () => {
        const regex = endsWithRegex(["world", "there"]);
        expect(regex).toEqual(/(world|there)$/);
        expect(regex.test("hello world")).toBe(true);
        expect(regex.test("hi there")).toBe(true);
        expect(regex.test("hello hey")).toBe(false);
    });

    test("returns correct regex for a set of strings", () => {
        const regex = endsWithRegex(new Set(["world", "there"]));
        expect(regex).toEqual(/(world|there)$/);
        expect(regex.test("hello world")).toBe(true);
        expect(regex.test("hi there")).toBe(true);
        expect(regex.test("hello hey")).toBe(false);
    });

    test("escapes special characters in the input strings", () => {
        const regex = endsWithRegex(["world.", "there*"]);
        expect(regex).toEqual(/(world\.|there\*)$/);
        expect(regex.test("hello world.")).toBe(true);
        expect(regex.test("hi there*")).toBe(true);
        expect(regex.test("hello world")).toBe(false);
    });
});
