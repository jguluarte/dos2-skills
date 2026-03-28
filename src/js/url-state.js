import { ALL_TREES } from '@constants';

export function load() {
    const params = new URLSearchParams(window.location.search);
    const p = params.get('p');
    const f = params.get('f');
    return {
        primary: p && ALL_TREES.includes(p) ? p : null,
        filters: new Set(
            f ? f.split(',').filter((t) => ALL_TREES.includes(t)) : []
        ),
    };
}

export function save(primary, filters) {
    const params = new URLSearchParams();
    if (primary) params.set('p', primary);
    if (filters.size > 0) {
        params.set('f', [...filters].sort().join(','));
    }
    const qs = params.toString();
    const url = qs ? `?${qs}` : window.location.pathname;
    window.history.replaceState({}, '', url);
}
