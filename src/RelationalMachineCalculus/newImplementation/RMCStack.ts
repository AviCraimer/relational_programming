import { isEqual } from "lodash";
import { RMCFail } from "./symbols";

export class RMCStack<T> {
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
    eq(stackB: RMCStack<T>) {
        if (this.items.length !== stackB.items.length) {
            return false;
        } else {
            return this.items.every((item, i) => isEqual(item, stackB.items[i]));
        }
    }
}
