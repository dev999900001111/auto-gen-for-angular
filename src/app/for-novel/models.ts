// { "definition": "\${definition}", "elements": [{ "name": "\${name}", "definition": "\${definition}" },] }

const a = {};
export class ObjectModel {
    constructor(
        public name: string,
        public definition: string,
        public elements: ObjectModel[] = [],
    ) { }
}

export class TreeModel {
    constructor(
        public definition: string,
        public children: { [key: string]: TreeModel } = {},
    ) { }
}