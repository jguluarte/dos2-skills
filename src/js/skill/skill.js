import { Schema } from './schema.js';

export class Skill {
    constructor(data) {
        Object.assign(this, data);
        this.trees = [this.secondaryTree, this.primaryTree];
    }

    static fromYAML(yaml) {
        return new Skill(Schema.parse(yaml));
    }

    has(tree) {
        return this.trees.includes(tree);
    }

    // compare(other) {

    // }
}
