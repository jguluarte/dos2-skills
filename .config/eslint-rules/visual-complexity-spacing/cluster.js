import {
    areAdjacent,
    connectsOnLeftEdge,
    connectsOnRightEdge,
    isClosing,
    isDenseTrailing,
    isGrouping,
    isOpening,
    tokenWeight,
} from './tokens.js';

// -------------------------------------------------------
// Cluster expansion — each direction is its own function
// -------------------------------------------------------

function denseTrailingContinues(tokens, tok, i) {
    const next = tokens[i + 1];
    return next && areAdjacent(tok, next) && isGrouping(next);
}

export function expandRight(tokens, startIdx) {
    let count = 0;
    let right = startIdx;

    let i = startIdx + 1;
    while (i < tokens.length) {
        const tok = tokens[i];
        if (!areAdjacent(tokens[i - 1], tok)) break;
        if (!isGrouping(tok) && !isDenseTrailing(tok)) break;
        if (!connectsOnLeftEdge(tok)) break;

        if (isDenseTrailing(tok)) {
            count++;
            right = i;
            if (!denseTrailingContinues(tokens, tok, i)) break;
            i++;
            continue;
        }

        count += tokenWeight(tok);
        right = i;
        if (!connectsOnRightEdge(tok)) break;
        i++;
    }

    return { count, right };
}

// Dense trailing chars (;, .) only appear at the right end of
// clusters — left expansion only includes grouping chars.
export function expandLeft(tokens, startIdx) {
    let count = 0;
    let left = startIdx;

    let i = startIdx - 1;
    while (i >= 0) {
        const tok = tokens[i];
        const next = tokens[i + 1];
        if (!areAdjacent(tok, next)) break;
        if (!isGrouping(tok)) break;
        if (!connectsOnRightEdge(tok)) break;
        count += tokenWeight(tok);
        left = i;
        if (!connectsOnLeftEdge(tok)) break;
        i--;
    }

    return { count, left };
}

/**
 * Count adjacent grouping chars (mixed direction) starting
 * from startIdx, expanding both directions while tokens
 * remain source-adjacent.
 */
export function adjacentCluster(tokens, startIdx) {
    let count = tokenWeight( tokens[startIdx] );
    const rightResult = expandRight(tokens, startIdx);
    const leftResult = expandLeft(tokens, startIdx);
    count += rightResult.count + leftResult.count;
    return {
        count,
        startIdx: leftResult.left,
        endIdx: rightResult.right,
    };
}

// -------------------------------------------------------
// Cluster composition queries
// -------------------------------------------------------

export function clusterComposition(tokens, cluster) {
    let hasOpening = false;
    let hasClosing = false;
    for (let j = cluster.startIdx; j <= cluster.endIdx; j++) {
        if (isOpening( tokens[j] )) hasOpening = true;
        if (isClosing( tokens[j] )) hasClosing = true;
    }
    return { hasOpening, hasClosing };
}

export function countClosingInCluster(tokens, cluster) {
    let count = 0;
    for (let j = cluster.startIdx; j <= cluster.endIdx; j++) {
        if (isClosing( tokens[j] )) count++;
    }
    return count;
}

export function findLastClosingIdx(tokens, cluster) {
    for (let j = cluster.endIdx; j >= cluster.startIdx; j--) {
        if (isClosing( tokens[j] )) return j;
    }
    return -1;
}

export function hasTopLevelComma(tokens, container) {
    let depth = 0;
    for (let j = container.openIdx + 1; j < container.closeIdx; j++) {
        if (isOpening( tokens[j] )) depth++;
        if (isClosing( tokens[j] )) depth--;
        if (depth === 0 && tokens[j].value === ',') return true;
    }
    return false;
}

export function markProcessed(processed, cluster) {
    for (let j = cluster.startIdx; j <= cluster.endIdx; j++) {
        processed.add(j);
    }
}

export function nonExemptClusterCount(tokens, cluster, exemptBrackets) {
    let effectiveCount = cluster.count;
    for (let j = cluster.startIdx; j <= cluster.endIdx; j++) {
        if (exemptBrackets.has( tokens[j] )) effectiveCount--;
    }
    return effectiveCount;
}
