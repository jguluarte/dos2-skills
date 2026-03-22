import {
    CLOSING,
    DENSE_TRAILING,
    OPENING,
    PUNCTUATOR,
    TEMPLATE,
    TEMPLATE_EXPR_WEIGHT,
} from './constants.js';

export function isOpening(token) {
    return (token.type === PUNCTUATOR && OPENING.has(token.value))
        || (token.type === TEMPLATE && token.value.endsWith('${'));
}

export function isClosing(token) {
    return (token.type === PUNCTUATOR && CLOSING.has(token.value))
        || (token.type === TEMPLATE && token.value.startsWith('}'));
}

export function isGrouping(token) {
    return isOpening(token) || isClosing(token);
}

export function isDenseTrailing(token) {
    return token.type === PUNCTUATOR
        && DENSE_TRAILING.has(token.value);
}

export function tokenWeight(token) {
    if (token.type === TEMPLATE && token.value.endsWith('${')) {
        return TEMPLATE_EXPR_WEIGHT;
    }
    return 1;
}

export function connectsOnLeftEdge(token) {
    if (token.type === TEMPLATE) {
        return !token.value.startsWith('`');
    }
    return true;
}

export function connectsOnRightEdge(token) {
    if (token.type === TEMPLATE) {
        return !token.value.endsWith('`');
    }
    return true;
}

export function areAdjacent(tokenA, tokenB) {
    return tokenA.range[1] === tokenB.range[0];
}

export function hasSpaceAfter(sourceCode, token) {
    const next = sourceCode.getTokenAfter(token);
    if (!next) return true;
    return token.range[1] < next.range[0];
}

export function hasSpaceBefore(sourceCode, token) {
    const prev = sourceCode.getTokenBefore(token);
    if (!prev) return true;
    return prev.range[1] < token.range[0];
}
