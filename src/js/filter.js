import { SUMMONING } from '@constants';

export function summarize(primary, filters) {
    if (!(primary || filters?.size)) {
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

export function filterSkills(skills, primary, filters = new Set()) {
    if (!(primary || filters.size)) return skills;

    let results = skills;

    if (primary) {
        results = results.filter((s) => s.has(primary));
    }

    if (filters.size > 0) {
        results = results.filter((s) => s.any(filters));
    }

    const wantsSummoning = [primary, ...filters].includes(SUMMONING);
    if (!wantsSummoning) {
        results = results.filter((s) => s.primaryTree !== SUMMONING);
    }

    return results;
}
