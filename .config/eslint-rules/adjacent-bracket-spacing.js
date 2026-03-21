const OPENING = new Set(['(', '[', '{']);
const CLOSING = new Set([')', ']', '}']);
// Characters that contribute to visual density on the
// closing side but aren't grouping chars themselves
const DENSE_TRAILING = new Set([';']);

/**
 * Check if a token is an opening grouping character.
 * Includes template literal `${` (Template token ending with `${`).
 */
function isOpening(token) {
    if (token.type === 'Punctuator' && OPENING.has(token.value)) {
        return true;
    }
    if (token.type === 'Template' && token.value.endsWith('${')) {
        return true;
    }
    return false;
}

/**
 * Check if a token is a closing grouping character.
 * Includes template literal `}` (Template token starting with `}`).
 */
function isClosing(token) {
    if (token.type === 'Punctuator' && CLOSING.has(token.value)) {
        return true;
    }
    if (token.type === 'Template' && token.value.startsWith('}')) {
        return true;
    }
    return false;
}

/**
 * Weight of an opening token. Template `${` counts as 2
 * because $ and { are both grouping characters.
 */
function openingWeight(token) {
    if (token.type === 'Template' && token.value.endsWith('${')) {
        return 2;
    }
    return 1;
}

/**
 * Can this token extend a run from the left?
 * Template tokens starting with ` have a backtick
 * providing visual separation — they break the run.
 */
function chainsLeft(token) {
    if (token.type === 'Template') {
        return !token.value.startsWith('`');
    }
    return true;
}

/**
 * Can this token extend a run to the right?
 * Template tokens ending with ` have a backtick
 * providing visual separation — they break the run.
 */
function chainsRight(token) {
    if (token.type === 'Template') {
        return !token.value.endsWith('`');
    }
    return true;
}

/**
 * Count consecutive opening grouping tokens starting at
 * index i, using weighted count for template `${`.
 * Backtick-bounded template tokens break the chain.
 */
function openingRunLength(tokens, i) {
    let count = 0;
    while (i < tokens.length && isOpening(tokens[i])) {
        if (count > 0 && !chainsLeft(tokens[i])) break;
        count += openingWeight(tokens[i]);
        if (!chainsRight(tokens[i])) break;
        i++;
    }
    return count;
}

/**
 * Count consecutive closing grouping tokens ending at
 * index i (counting backwards).
 * Backtick-bounded template tokens break the chain.
 */
function closingRunLength(tokens, i) {
    let count = 0;
    while (i >= 0 && isClosing(tokens[i])) {
        if (count > 0 && !chainsRight(tokens[i])) break;
        count++;
        if (!chainsLeft(tokens[i])) break;
        i--;
    }
    return count;
}

/**
 * Find the matching bracket for a given token index using
 * a stack-based approach.
 */
function findMatchingBracket(tokens, index) {
    const token = tokens[index];

    if (isOpening(token)) {
        let depth = 0;
        for (let i = index; i < tokens.length; i++) {
            if (isOpening(tokens[i])) depth++;
            if (isClosing(tokens[i])) depth--;
            if (depth === 0) return i;
        }
    }

    if (isClosing(token)) {
        let depth = 0;
        for (let i = index; i >= 0; i--) {
            if (isClosing(tokens[i])) depth++;
            if (isOpening(tokens[i])) depth--;
            if (depth === 0) return i;
        }
    }

    return -1;
}

/**
 * Check if there's already a space after a token.
 */
function hasSpaceAfter(sourceCode, token) {
    const next = sourceCode.getTokenAfter(token);
    if (!next) return true;
    return token.range[1] < next.range[0];
}

/**
 * Check if there's already a space before a token.
 */
function hasSpaceBefore(sourceCode, token) {
    const prev = sourceCode.getTokenBefore(token);
    if (!prev) return true;
    return prev.range[1] < token.range[0];
}

/** @type {import('eslint').Rule.RuleModule} */
export default {
    meta: {
        type: 'layout',
        docs: {
            description:
                'Require spacing when 3+ grouping characters '
                + 'are adjacent',
        },
        fixable: 'whitespace',
        schema: [],
        messages: {
            requireSpaceAfter:
                'Require a space after "{{token}}" — '
                + '3+ adjacent grouping characters.',
            requireSpaceBefore:
                'Require a space before "{{token}}" — '
                + '3+ adjacent grouping characters.',
        },
    },
    create(context) {
        const sourceCode = context.sourceCode;

        return {
            Program() {
                const tokens = sourceCode.getTokens(
                    sourceCode.ast,
                    { includeComments: false }
                );

                // Track which tokens need spacing to avoid
                // duplicate reports
                const needsSpaceAfter = new Set();
                const needsSpaceBefore = new Set();

                // Find opening runs of 3+
                for (let i = 0; i < tokens.length; i++) {
                    if (!isOpening(tokens[i])) continue;

                    const runLen = openingRunLength(tokens, i);
                    if (runLen < 3) continue;

                    // Outermost opening bracket is at i
                    const outerOpen = tokens[i];
                    if (!hasSpaceAfter(sourceCode, outerOpen)) {
                        needsSpaceAfter.add(i);
                    }

                    // Balance: space matching closing bracket
                    const matchIdx = findMatchingBracket(
                        tokens, i
                    );
                    if (
                        matchIdx !== -1
                        && !hasSpaceBefore(
                            sourceCode, tokens[matchIdx]
                        )
                    ) {
                        needsSpaceBefore.add(matchIdx);
                    }
                }

                // Find closing runs of 3+
                // A dense trailing char (;) after the
                // outermost closer adds to the density
                for (let i = tokens.length - 1; i >= 0; i--) {
                    if (!isClosing(tokens[i])) continue;

                    let runLen = closingRunLength(tokens, i);

                    // Check for dense trailing char
                    const next = tokens[i + 1];
                    if (
                        next
                        && DENSE_TRAILING.has(next.value)
                        && !hasSpaceAfter(
                            sourceCode, tokens[i]
                        )
                    ) {
                        runLen++;
                    }

                    if (runLen < 3) continue;

                    // Outermost closing bracket is at i
                    const outerClose = tokens[i];
                    if (!hasSpaceBefore(
                        sourceCode, outerClose
                    )) {
                        needsSpaceBefore.add(i);
                    }

                    // Balance: space matching opening bracket
                    const matchIdx = findMatchingBracket(
                        tokens, i
                    );
                    if (
                        matchIdx !== -1
                        && !hasSpaceAfter(
                            sourceCode, tokens[matchIdx]
                        )
                    ) {
                        needsSpaceAfter.add(matchIdx);
                    }
                }

                // Report violations
                for (const idx of needsSpaceAfter) {
                    const token = tokens[idx];
                    context.report({
                        loc: token.loc,
                        messageId: 'requireSpaceAfter',
                        data: { token: token.value },
                        fix(fixer) {
                            return fixer.insertTextAfter(
                                token, ' '
                            );
                        },
                    });
                }

                for (const idx of needsSpaceBefore) {
                    const token = tokens[idx];
                    context.report({
                        loc: token.loc,
                        messageId: 'requireSpaceBefore',
                        data: { token: token.value },
                        fix(fixer) {
                            return fixer.insertTextBefore(
                                token, ' '
                            );
                        },
                    });
                }
            },
        };
    },
};
