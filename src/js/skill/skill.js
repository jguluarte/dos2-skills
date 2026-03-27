import { SUMMONING } from '@constants';
import { Schema } from './schema.js';

export class Skill {
    constructor(data) {
        Object.assign(this, data);
        this.trees = [this.secondaryTree, this.primaryTree]
            .filter(Boolean);
    }

    static fromYAML(yaml) {
        return new Skill(Schema.parse(yaml));
    }

    // FIXME: this belongs in filter logic somewhere
    get isSummoning() {
        return this.primaryTree === SUMMONING;
    }

    // FIXME: this belongs in filter logic somewhere
    has(tree) {
        return this.trees.includes(tree);
    }

    // FIXME: this belongs in filter logic somewhere
    any(trees) {
        if (trees.size === 0) return true;
        return this.trees.some((t) => trees.has(t));
    }

}
