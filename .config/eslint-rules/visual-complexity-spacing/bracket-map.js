import {
    BRACKET_PAIRS,
    TEMPLATE,
    TEMPLATE_BRACKET,
} from './constants.js';
import { isClosing, isOpening } from './tokens.js';

export function bracketType(token) {
    if (token.type === TEMPLATE) return TEMPLATE_BRACKET;
    return token.value;
}

export function expectedOpener(token) {
    if (token.type === TEMPLATE) return TEMPLATE_BRACKET;
    return BRACKET_PAIRS[token.value];
}

export function buildBracketMap(tokens) {
    const map = new Map();
    const stack = [];

    for (let i = 0; i < tokens.length; i++) {
        const tok = tokens[i];
        if (isOpening(tok)) {
            stack.push({ index: i, type: bracketType(tok) });
        } else if (isClosing(tok)) {
            const expected = expectedOpener(tok);
            if (stack.length > 0
                && stack[stack.length - 1].type === expected) {
                const open = stack.pop();
                map.set(open.index, i);
                map.set(i, open.index);
            }
        }
    }

    return map;
}

export function lookupBracket(bracketMap, index) {
    const match = bracketMap.get(index);
    return match !== undefined ? match : -1;
}
