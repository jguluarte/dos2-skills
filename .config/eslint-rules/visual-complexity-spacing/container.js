import { lookupBracket } from './bracket-map.js';
import { clusterComposition } from './cluster.js';
import { isClosing, isGrouping, isOpening } from './tokens.js';

// Cluster is all closing brackets (e.g., )))). Walk backward
// to find the outermost open paren that encloses the pile-up.
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

// Cluster is all opening brackets (e.g., (([). Walk forward
// to find the matched close.
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

// Cluster has both opens and closes (e.g., )(). Search backward
// for an opening whose match is past the cluster, then forward
// for a closing whose match precedes it.
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

// Fallback when findMixedContainer can't find an enclosing
// pair. Picks the widest matched pair within the cluster itself.
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

    // Mixed clusters may not have an enclosing bracket outside
    // the cluster. Fall back to the widest pair inside it.
    return findMixedContainer(ctx, cluster)
        || findWidestPairInCluster(ctx, cluster);
}
