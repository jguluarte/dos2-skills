import { lookupBracket } from './bracket-map.js';
import {
    IDENTIFIER,
    INNER_CALLEE_PROXIMITY,
    MIN_CALLEE_LEN_FOR_SUPPRESSION,
    MIN_CONTENT_LEN_FOR_SUPPRESSION,
    MIN_METHOD_LEN_STANDALONE,
    MIN_METHOD_LEN_WITH_LONG_OBJ,
    MIN_OBJ_LEN_FOR_ANCHORING,
} from './constants.js';

export function isMemberCalleeAnchored(tokens, parenIdx) {
    if (parenIdx < 3) return false;
    const isMethodIdent = tokens[parenIdx - 1].type === IDENTIFIER;
    const isDot = tokens[parenIdx - 2].value === '.';
    const isObjIdent = tokens[parenIdx - 3].type === IDENTIFIER;
    if (!isMethodIdent || !isDot || !isObjIdent) return false;
    const method = tokens[parenIdx - 1].value.length;
    const obj = tokens[parenIdx - 3].value.length;
    const hasLongObjAndMethod = obj >= MIN_OBJ_LEN_FOR_ANCHORING
        && method >= MIN_METHOD_LEN_WITH_LONG_OBJ;
    const hasLongMethod = method >= MIN_METHOD_LEN_STANDALONE;
    return hasLongObjAndMethod || hasLongMethod;
}

export function isSimpleCalleeAnchored(tokens, parenIdx, minLen) {
    if (parenIdx < 1) return false;
    const callee = tokens[parenIdx - 1];
    return callee.type === IDENTIFIER
        && callee.value.length >= minLen;
}

export function findInnerCallee(tokens, bracketMap, openIdx, closeIdx) {
    for (let j = openIdx + 1; j < closeIdx - 1; j++) {
        if (tokens[j].value !== '(') continue;
        const matchJ = lookupBracket(bracketMap, j);
        if (matchJ === -1) continue;
        if (closeIdx - matchJ > INNER_CALLEE_PROXIMITY) continue;
        return j;
    }
    return -1;
}

export function innerCalleeAnchors(tokens, calleeIdx) {
    if (isMemberCalleeAnchored(tokens, calleeIdx)) return true;
    return isSimpleCalleeAnchored(
        tokens, calleeIdx, MIN_CALLEE_LEN_FOR_SUPPRESSION
    );
}

export function outerCalleeAnchors(tokens, openIdx, contentLen) {
    if (openIdx <= 0) return false;
    if (isMemberCalleeAnchored(tokens, openIdx)) return true;
    const minLen = MIN_CALLEE_LEN_FOR_SUPPRESSION;
    if (isSimpleCalleeAnchored(tokens, openIdx, minLen)) {
        return true;
    }
    return contentLen >= MIN_CONTENT_LEN_FOR_SUPPRESSION;
}

/**
 * Check if content between brackets provides enough visual
 * anchoring to suppress spacing. Checks inner callees first
 * (what the eye parses between brackets), falls back to outer.
 */
export function contentSuppressesSpacing(ctx, openIdx, closeIdx) {
    const contentLen = ctx.contentLength(openIdx, closeIdx);

    const innerIdx = findInnerCallee(
        ctx.tokens, ctx.bracketMap, openIdx, closeIdx
    );
    if (innerIdx !== -1) {
        return innerCalleeAnchors(ctx.tokens, innerIdx);
    }

    return outerCalleeAnchors(ctx.tokens, openIdx, contentLen);
}
