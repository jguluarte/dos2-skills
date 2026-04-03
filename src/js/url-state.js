import { ALL_TREES } from '@constants';

const ANY = 'f';
const PRIMARY = 'p';

export function load(search = window.location.search) {
    const params = new URLSearchParams(search);
    const p = params.get(PRIMARY);
    const f = params.get(ANY);
    return {
        primary: p && ALL_TREES.includes(p) ? p : null,
        filters: new Set(
            f ? f.split(',').filter((t) => ALL_TREES.includes(t)) : []
        ),
    };
}

export function save(primary, filters) {
    const url = serialize(primary, filters) || window.location.pathname;
    window.history.replaceState({}, '', url);
}

export function serialize(primary, filters) {
    const parts = [];
    if (primary) parts.push(`${PRIMARY}=${primary}`);

    if (filters?.size > 0) {
        parts.push(`${ANY}=${[...filters].sort().join(',')}`);
    }

    return parts.length ? `?${parts.join('&')}` : '';
}
