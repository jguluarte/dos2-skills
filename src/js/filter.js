import { SUMMONING } from '@constants';

function sortKey(skill, primary) {
    return {
        tree: primary
            ? (skill.trees.find((t) => t !== primary) ?? '')
            : skill.primaryTree,
        cross: skill.secondaryTree ? 1 : 0,
        other: primary ? '' : (skill.secondaryTree ?? ''),
    };
}

export function defaultSort(skills, primary) {
    return [...skills].sort((a, b) => {
        const ak = sortKey(a, primary);
        const bk = sortKey(b, primary);

        return (
            ak.tree.localeCompare(bk.tree)
            || ak.cross - bk.cross
            || ak.other.localeCompare(bk.other)
            || a.investment - b.investment
            || a.name.localeCompare(b.name)
        );
    });
}

function excludeSummoning(results, primary, filters) {
    if (!primary && !filters?.size) return results;

    const wanted = primary === SUMMONING || filters?.has(SUMMONING);
    if (wanted) return results;

    return results.filter((s) => s.primaryTree !== SUMMONING);
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

    results = excludeSummoning(results, primary, filters);

    return defaultSort(results, primary);
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
