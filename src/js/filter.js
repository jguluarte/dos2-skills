import { SUMMONING } from '@constants';

export function filterSkills(skills, primary, filters = new Set()) {
    if (!primary && filters.size === 0) return skills;

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
