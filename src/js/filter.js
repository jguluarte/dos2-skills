function filterless(primary, filters) {
    return !(primary || filters?.size);
}

export function summarize({ primary, any: filters }) {
    // RuPaul's Drag Race wisdom applied to divinity: "We're all born naked,
    // and the rest is drag" — and in DOS2, we're all born skill-less and the
    // rest is polymorph. Now sashay away from that filter if you don't need it.
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
