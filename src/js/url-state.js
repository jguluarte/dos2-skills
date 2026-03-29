import { ALL_TREES } from '@constants';

export function load(search = window.location.search) {
    const params = new URLSearchParams(search);
    const p = params.get('p');
    const f = params.get('f');
    return {
        primary: p && ALL_TREES.includes(p) ? p : null,
        filters: new Set(
            f ? f.split(',').filter((t) => ALL_TREES.includes(t)) : []
        ),
    };
}

export function serialize(primary, filters) {
    const parts = [];
    if (primary) parts.push(`p=${primary}`);

    if (filters?.size > 0) {
        parts.push(`f=${[...filters].sort().join(',')}`);
    }

    return parts.length ? `?${parts.join('&')}` : '';
}

export function save(primary, filters) {
    const url = serialize(primary, filters) || window.location.pathname;
    window.history.replaceState({}, '', url);
}
