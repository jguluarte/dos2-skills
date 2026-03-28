export function summaryText(primary, filters) {
    if (!primary && filters.size === 0) {
        return 'Showing all skills, tap to filter';
    }

    const trees = [...filters];
    const primaryStr = `Showing all ${primary} skills`;

    if (primary && filters.size === 0) {
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
