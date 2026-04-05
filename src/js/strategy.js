import { SUMMONING, TRI_STATE } from '@constants';

class Strategy {
    apply(skills) {
        return this.shouldApply()
            ? this.execute(skills)
            : skills;
    }
}

class FilterStrategy extends Strategy {
    constructor(filter) {
        super();
        this.filter = filter;
    }
}

const { YES, NO, ONLY } = TRI_STATE;

export class PrimaryFilter extends FilterStrategy {
    shouldApply = () => !!this.filter.primary;
    execute = (skills) => skills.filter( (s) => s.has(this.filter.primary) );
}

export class AnyFilter extends FilterStrategy {
    shouldApply = () => !!this.filter.any.size;
    execute = (skills) => skills.filter(
        (s) => this.single(s) || s.trees.some((t) => this.filter.any.has(t))
    );

    single = (s) => this.filter.singleClass === YES && !s.secondaryTree;
}

export class SummoningFilter extends FilterStrategy {
    shouldApply = () => this.filter.isActive() && !this.filter.has(SUMMONING);
    execute = (skills) => skills.filter( (s) => !s.has(SUMMONING) );
}

class EnumStrategy extends FilterStrategy {
    handler = {};

    shouldApply = () => this.identifier() in this.handler;
    execute = (skills) => skills.filter(
        this.handler[this.identifier()]
    );
}

export class SingleClassFilter extends EnumStrategy {
    handler = {
        [NO]:   (s) => !!s.secondaryTree, // Only dual-class
        [ONLY]: (s) => !s.secondaryTree,  // Only single-class
    };

    identifier = () => this.filter.singleClass;
}

export class SourceFilter extends EnumStrategy {
    handler = {
        [NO]:   (s) => !s.spCost,
        [ONLY]: (s) => !!s.spCost,
    };

    identifier = () => this.filter.source;
}
