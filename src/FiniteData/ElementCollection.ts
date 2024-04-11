// ElementCollectionData and its associated functions gives us the most basic module which forms the foundation for other knowledge structures which are built on top of this by relating elements in various ways.
import { CollectionUUID, ElementUUID, collectionUUID, BasicElementUUID } from "../../internalUtils/uuid";
import { ElementType, ElementTypeFull, NullElement, getNullElement, isNullElement } from "../../networkStructure/NetworkElement";

// Note: ElementTypes should be a union which is disjoint on the .elementType field. i.e. only one element type per distinct subtype string.
export type ElementCollectionType<ElementTypes extends ElementType<string, unknown>> = Set<ElementTypes | NullElement> & {
    // The UUID of the network
    uuid: CollectionUUID;
    // The possibly non-unique name of the network
    displayName: string;

    elements: Map<ElementUUID, ElementTypes | NullElement>;

    null: NullElement;

    // Additional methods
    map: <T extends ElementTypeFull>(cb: (element: ElementTypes, collection: ElementCollectionType<ElementTypes>) => T) => ElementCollectionType<T>;
};

export class ElementCollection<ElementTypes extends ElementType<string, unknown>> implements ElementCollectionType<ElementTypes> {
    readonly uuid: CollectionUUID;
    displayName: string;
    elements: Map<ElementUUID, ElementTypes | NullElement>;
    null: NullElement;

    constructor(elements: ElementTypes[] = [], displayName: string = "") {
        this.uuid = collectionUUID();
        this.displayName = displayName ?? "";
        this.elements = new Map();
        this.null = getNullElement();

        elements.forEach((el) => {
            // Add non-null elements
            if (!isNullElement(el) && !this.elements.get(el.uuid)) {
                // If there are duplicate UUIDs, only the first in the array is added to the map.
                this.elements.set(el.uuid, el);
            }
        });

        // Add null element
        this.elements.set(this.null.uuid, this.null);
    }

    //**Additional methods**

    map<T extends ElementTypeFull>(callback: (element: ElementTypes, collection: ElementCollectionType<ElementTypes>) => T, displayName: string = `Mapped from "${this.displayName}"`): ElementCollectionType<T> {
        const newElementsArr: T[] = [];

        this.elements.forEach((el) => {
            if (!isNullElement(el)) {
                newElementsArr.push(callback(el, this));
            }
        });

        return new ElementCollection(newElementsArr, displayName);
    }

    //**JS Set methods and properties**
    get size(): number {
        return this.elements.size;
    }

    // Cannot add the null element
    add(element: ElementTypes): this {
        if (element && element.elementType !== this.null.elementType && !this.elements.has(element.uuid)) {
            this.elements.set(element.uuid, element);
        }
        return this;
    }

    // Cannot delete the null element
    delete(element: ElementTypes): boolean;
    delete(element: ElementTypes | BasicElementUUID): boolean {
        if (typeof element === "string") {
            return this.elements.delete(element);
        } else if (element.elementType !== this.null.elementType && element.uuid !== this.null.uuid) {
            return this.elements.delete(element.uuid);
        } else {
            return false;
        }
    }

    has(element: ElementTypes | NullElement): boolean;
    has(element: ElementTypes | NullElement | ElementUUID): boolean {
        if (typeof element === "string") {
            return this.elements.has(element);
        } else {
            return this.elements.has(element.uuid);
        }
    }

    clear(): void {
        this.elements.clear();
        this.elements.set(this.null.uuid, this.null);
    }

    forEach(callbackfn: (value: ElementTypes | NullElement, key: ElementTypes | NullElement, set: Set<ElementTypes | NullElement>) => void, thisArg?: any): void {
        new Set(this.elements.values()).forEach(callbackfn, thisArg);
    }

    entries(): IterableIterator<[ElementTypes | NullElement, ElementTypes | NullElement]> {
        return new Set(this.elements.values()).entries();
    }

    values(): IterableIterator<ElementTypes | NullElement> {
        return this.elements.values();
    }

    keys(): IterableIterator<ElementTypes | NullElement> {
        return this.elements.values();
    }

    [Symbol.iterator](): IterableIterator<ElementTypes | NullElement> {
        return this.elements.values();
    }

    get [Symbol.toStringTag](): string {
        return "ElementCollection";
    }
}
