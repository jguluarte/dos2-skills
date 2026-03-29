import { SUMMONING } from '@constants';

export function defaultSort(skills) {
    return [...skills].sort((a, b) => {
        const aCross = a.secondaryTree ? 1 : 0;
        const bCross = b.secondaryTree ? 1 : 0;

        return (
            a.primaryTree.localeCompare(b.primaryTree)
            || aCross - bCross
            || (a.secondaryTree ?? '').localeCompare(b.secondaryTree ?? '')
            || a.investment - b.investment
            || a.name.localeCompare(b.name)
        );
    });
}

export function filterSkills(skills, primary, filters = new Set()) {
    if ( filterless(primary, filters) ) return skills;

    let results = primary
        ? reduceBy(skills, primary)
        : skills;

    results = reduceBy(results, ...filters);
    return summoningFilter(results, primary, ...filters);
}

function filterless(primary, filters) {
    return !(primary || filters?.size);
}

function reduceBy(skills, ...filters) {
    if (filters?.length) {
        return skills.filter(
            (s) => s.trees.some( (t) => filters.includes(t) )
        );
    }

    return skills;
}

function summoningFilter(skills, ...filters) {
    return filters.includes(SUMMONING)
        ? skills
        : skills.filter( (s) => !s.has(SUMMONING) );
}

export function summarize(primary, filters = []) {
    if ( filterless(primary, filters) ) {
        return 'Showing all skills, tap to filter';
    }

    const trees = filters ? [...filters] : [];
    const primaryStr = `Showing all ${primary} skills`;

    if (primary && trees.length === 0) {
        return primaryStr;
    }

    if (!primary) {
        if (trees.length === 1) return `Showing all ${trees[0]} skills`;

        const last = trees.pop();
        return `Showing skills with ${trees.join(', ')} or ${last}`;
    }

    if (trees.length === 1) return `${primaryStr}, with ${trees[0]}`;

    const last = trees.pop();
    return `${primaryStr}, with ${trees.join(', ')} or ${last}`;
}
