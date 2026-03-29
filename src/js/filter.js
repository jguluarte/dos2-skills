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
    let results = skills;

    if (primary) {
        results = results.filter((s) => s.has(primary));
    }

    if (filters?.size > 0) {
        results = results.filter(
            (s) => s.trees.some((t) => filters.has(t))
        );
    }

    if (primary || filters?.size) {
        const wantsSummoning = primary === SUMMONING
            || filters?.has(SUMMONING);
        if (!wantsSummoning) {
            results = results.filter(
                (s) => s.primaryTree !== SUMMONING,
            );
        }
    }

    return results;
}

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
