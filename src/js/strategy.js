import { SUMMONING } from '@constants';

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

export class PrimaryFilter extends FilterStrategy {
    shouldApply = () => !!this.filter.primary;
    execute = (skills) => skills.filter( (s) => s.has(this.filter.primary) );
}

export class AnyFilter extends FilterStrategy {
    shouldApply = () => !!this.filter.any.size;
    execute = (skills) => skills.filter(
        (s) => s.trees.some( (t) => this.filter.any.has(t) )
    );
}

export class SummoningFilter extends FilterStrategy {
    shouldApply = () => this.filter.isActive() && !this.filter.has(SUMMONING);
    execute = (skills) => skills.filter( (s) => !s.has(SUMMONING) );
}
