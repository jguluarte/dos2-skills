import { lookupBracket } from './bracket-map.js';
import { clusterComposition } from './cluster.js';
import { isClosing, isGrouping, isOpening } from './tokens.js';

export function findClosingOnlyContainer(ctx, cluster) {
    for (let j = cluster.endIdx; j >= cluster.startIdx; j--) {
        if (!isClosing( ctx.tokens[j] )) continue;
        const matchIdx = lookupBracket(ctx.bracketMap, j);
        if (matchIdx !== -1) {
            return { openIdx: matchIdx, closeIdx: j };
        }
    }
    return null;
}

export function findOpeningOnlyContainer(ctx, cluster) {
    for (let j = cluster.startIdx; j <= cluster.endIdx; j++) {
        if (!isOpening( ctx.tokens[j] )) continue;
        const matchIdx = lookupBracket(ctx.bracketMap, j);
        if (matchIdx !== -1) {
            return { openIdx: j, closeIdx: matchIdx };
        }
    }
    return null;
}

export function findMixedContainer(ctx, cluster) {
    for (let j = cluster.startIdx - 1; j >= 0; j--) {
        if (!isOpening( ctx.tokens[j] )) continue;
        const matchIdx = lookupBracket(ctx.bracketMap, j);
        if (matchIdx === -1) continue;
        if (matchIdx > cluster.endIdx) {
            return { openIdx: j, closeIdx: matchIdx };
        }
    }

    for (let j = cluster.endIdx + 1; j < ctx.tokens.length; j++) {
        if (!isClosing( ctx.tokens[j] )) continue;
        const matchIdx = lookupBracket(ctx.bracketMap, j);
        if (matchIdx === -1) continue;
        if (matchIdx < cluster.startIdx) {
            return { openIdx: matchIdx, closeIdx: j };
        }
    }

    return null;
}

export function findWidestPairInCluster(ctx, cluster) {
    let bestOpenIdx = -1;
    let bestCloseIdx = -1;
    let bestSpan = -1;

    for (let j = cluster.startIdx; j <= cluster.endIdx; j++) {
        if (!isGrouping( ctx.tokens[j] )) continue;
        const matchIdx = lookupBracket(ctx.bracketMap, j);
        if (matchIdx === -1) continue;
        const openIdx = Math.min(j, matchIdx);
        const closeIdx = Math.max(j, matchIdx);
        const span = closeIdx - openIdx;
        if (span > bestSpan) {
            bestSpan = span;
            bestOpenIdx = openIdx;
            bestCloseIdx = closeIdx;
        }
    }

    if (bestOpenIdx === -1) return null;
    return { openIdx: bestOpenIdx, closeIdx: bestCloseIdx };
}

export function findEnclosingContainer(ctx, cluster) {
    const { hasOpening, hasClosing } = clusterComposition(
        ctx.tokens, cluster
    );

    if (hasClosing && !hasOpening) {
        return findClosingOnlyContainer(ctx, cluster);
    }

    if (hasOpening && !hasClosing) {
        return findOpeningOnlyContainer(ctx, cluster);
    }

    return findMixedContainer(ctx, cluster)
        || findWidestPairInCluster(ctx, cluster);
}
