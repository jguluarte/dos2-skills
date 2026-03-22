const OPENING = new Set(['(', '[', '{']);
const CLOSING = new Set([')', ']', '}']);
const DENSE_TRAILING = new Set([';', '.', '!']);

function isOpening(token) {
    if (token.type === 'Punctuator' && OPENING.has(token.value)) {
        return true;
    }
    if (token.type === 'Template' && token.value.endsWith('${')) {
        return true;
    }
    return false;
}

function isClosing(token) {
    if (token.type === 'Punctuator' && CLOSING.has(token.value)) {
        return true;
    }
    if (token.type === 'Template' && token.value.startsWith('}')) {
        return true;
    }
    return false;
}

function isGrouping(token) {
    return isOpening(token) || isClosing(token);
}

function isDenseTrailing(token) {
    return token.type === 'Punctuator'
        && DENSE_TRAILING.has(token.value);
}

function openingWeight(token) {
    if (token.type === 'Template' && token.value.endsWith('${')) {
        return 2;
    }
    return 1;
}

function chainsLeft(token) {
    if (token.type === 'Template') {
        return !token.value.startsWith('`');
    }
    return true;
}

function chainsRight(token) {
    if (token.type === 'Template') {
        return !token.value.endsWith('`');
    }
    return true;
}

/**
 * Check if two consecutive tokens are actually adjacent
 * in the source (no whitespace between them).
 */
function areAdjacent(tokenA, tokenB) {
    return tokenA.range[1] === tokenB.range[0];
}

/**
 * Gap 1: Mixed-direction counting.
 * Count ANY adjacent grouping chars regardless of direction.
 * Tokens must be truly adjacent in source (no whitespace).
 *
 * Returns { count, startIdx, endIdx }.
 */
function adjacentCluster(tokens, startIdx) {
    let count = openingWeight(tokens[startIdx]);
    let left = startIdx;
    let right = startIdx;

    // Expand right — check source adjacency
    let i = startIdx + 1;
    while (i < tokens.length) {
        const tok = tokens[i];
        const prev = tokens[i - 1];
        if (!areAdjacent(prev, tok)) break;
        if (!isGrouping(tok) && !isDenseTrailing(tok)) break;
        if (!chainsLeft(tok)) break;
        if (isDenseTrailing(tok)) {
            count++;
            right = i;
            // ! can precede grouping chars (e.g., `(!(`)
            // so only break if the next token isn't adjacent
            // grouping — otherwise keep expanding
            const next = tokens[i + 1];
            if (
                !next
                || !areAdjacent(tok, next)
                || !isGrouping(next)
            ) {
                break;
            }
            i++;
            continue;
        }
        count += openingWeight(tok);
        if (!chainsRight(tok)) {
            right = i;
            break;
        }
        right = i;
        i++;
    }

    // Expand left — check source adjacency
    i = startIdx - 1;
    while (i >= 0) {
        const tok = tokens[i];
        const next = tokens[i + 1];
        if (!areAdjacent(tok, next)) break;
        if (!isGrouping(tok)) break;
        if (!chainsRight(tok)) break;
        count += openingWeight(tok);
        if (!chainsLeft(tok)) {
            left = i;
            break;
        }
        left = i;
        i--;
    }

    return { count, startIdx: left, endIdx: right };
}

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

function hasSpaceAfter(sourceCode, token) {
    const next = sourceCode.getTokenAfter(token);
    if (!next) return true;
    return token.range[1] < next.range[0];
}

function hasSpaceBefore(sourceCode, token) {
    const prev = sourceCode.getTokenBefore(token);
    if (!prev) return true;
    return prev.range[1] < token.range[0];
}

function isTokenOnSameLine(left, right) {
    return left.loc.end.line === right.loc.start.line;
}

/**
 * Check if content between brackets provides enough visual
 * anchoring to suppress spacing at a termination point.
 *
 * Checks both the outer callee and any inner callee
 * expressions (e.g., `wrap(pa.parse(data))` checks both
 * "wrap" and "pa.parse").
 */
function checkContentSuppression(
    tokens, openIdx, closeIdx, contentLen
) {
    // Check inner callee expressions FIRST — the inner
    // callee is what the eye actually parses between the
    // brackets. Only consider callees whose matching )
    // is close to closeIdx (i.e., directly contributing
    // to the nesting density, not buried in a block body).
    let foundInnerCallee = false;
    for (let j = openIdx + 1; j < closeIdx - 1; j++) {
        if (tokens[j].value !== '(') continue;
        const matchJ = findMatchingBracket(tokens, j);
        if (matchJ === -1) continue;
        // Only consider this callee if its closing )
        // is near the container's close — within 2
        // tokens means it's part of the nesting stack
        if (closeIdx - matchJ > 2) continue;
        foundInnerCallee = true;
        // Check for member callee: obj.method(
        if (
            j >= 3
            && tokens[j - 1].type === 'Identifier'
            && tokens[j - 2].value === '.'
            && tokens[j - 3].type === 'Identifier'
        ) {
            const method = tokens[j - 1].value.length;
            const obj = tokens[j - 3].value.length;
            if (obj >= 5 && method >= 4) return true;
            if (method >= 5) return true;
        }
        // Check for long simple callee
        if (
            j >= 1
            && tokens[j - 1].type === 'Identifier'
            && tokens[j - 1].value.length >= 8
        ) {
            return true;
        }
    }

    // Fall back to outer callee check only if no inner
    // callee pattern was found inside the brackets.
    if (!foundInnerCallee && openIdx > 0) {
        const callee = tokens[openIdx - 1];
        const calleeLen = callee.value.length;

        // Member expression: obj.method
        if (
            openIdx > 2
            && tokens[openIdx - 2].value === '.'
        ) {
            const obj = tokens[openIdx - 3];
            const objLen = obj ? obj.value.length : 0;
            if (objLen >= 5 && calleeLen >= 4) return true;
            if (calleeLen >= 5) return true;
        } else if (calleeLen >= 8 || contentLen >= 15) {
            return true;
        }
    }

    return false;
}

/**
 * Find the outermost container bracket pair for a cluster.
 *
 * Two modes based on cluster composition:
 *
 * A) Closing-only cluster (like `))` or `))`+`;`):
 *    The outermost CLOSING bracket in the cluster defines
 *    the container. Its match is the opening bracket.
 *
 * B) Mixed or opening-only cluster (like `()}` or `(([[`):
 *    The density is at a junction between structures. Walk
 *    outward to find the enclosing bracket pair.
 *
 * Returns { openIdx, closeIdx } or null.
 */
function findOutermostContainer(tokens, cluster) {
    // Check cluster composition
    let hasOpening = false;
    let hasClosing = false;
    for (let j = cluster.startIdx; j <= cluster.endIdx; j++) {
        if (isOpening(tokens[j])) hasOpening = true;
        if (isClosing(tokens[j])) hasClosing = true;
    }

    if (hasClosing && !hasOpening) {
        // Mode A: closing-only. Find outermost closing
        // bracket and use its matched pair.
        for (
            let j = cluster.endIdx;
            j >= cluster.startIdx;
            j--
        ) {
            if (!isClosing(tokens[j])) continue;
            const matchIdx = findMatchingBracket(tokens, j);
            if (matchIdx !== -1) {
                return { openIdx: matchIdx, closeIdx: j };
            }
        }
    }

    if (hasOpening && !hasClosing) {
        // Opening-only. Find outermost opening bracket and
        // use its matched pair.
        for (
            let j = cluster.startIdx;
            j <= cluster.endIdx;
            j++
        ) {
            if (!isOpening(tokens[j])) continue;
            const matchIdx = findMatchingBracket(tokens, j);
            if (matchIdx !== -1) {
                return { openIdx: j, closeIdx: matchIdx };
            }
        }
    }

    // Mode B: mixed cluster. Walk outward to find the
    // enclosing bracket pair that contains the cluster.
    // Walk backward
    for (let j = cluster.startIdx - 1; j >= 0; j--) {
        if (!isOpening(tokens[j])) continue;
        const matchIdx = findMatchingBracket(tokens, j);
        if (matchIdx === -1) continue;
        if (matchIdx > cluster.endIdx) {
            return { openIdx: j, closeIdx: matchIdx };
        }
    }

    // Walk forward
    for (
        let j = cluster.endIdx + 1;
        j < tokens.length;
        j++
    ) {
        if (!isClosing(tokens[j])) continue;
        const matchIdx = findMatchingBracket(tokens, j);
        if (matchIdx === -1) continue;
        if (matchIdx < cluster.startIdx) {
            return { openIdx: matchIdx, closeIdx: j };
        }
    }

    // Fallback: use widest pair from cluster
    let bestOpenIdx = -1;
    let bestCloseIdx = -1;
    let bestSpan = -1;

    for (let j = cluster.startIdx; j <= cluster.endIdx; j++) {
        if (!isGrouping(tokens[j])) continue;
        const matchIdx = findMatchingBracket(tokens, j);
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

/** @type {import('eslint').Rule.RuleModule} */
export default {
    meta: {
        type: 'layout',
        docs: {
            description:
                'Require spacing when adjacent grouping characters '
                + 'create visual complexity',
        },
        fixable: 'whitespace',
        schema: [{
            type: 'object',
            properties: {
                threshold: {
                    type: 'integer',
                    minimum: 2,
                    default: 3,
                },
            },
            additionalProperties: false,
        }],
        messages: {
            requireSpaceAfter:
                'Require a space after "{{token}}" — '
                + '{{count}}+ adjacent grouping characters.',
            requireSpaceBefore:
                'Require a space before "{{token}}" — '
                + '{{count}}+ adjacent grouping characters.',
        },
    },
    create(context) {
        const sourceCode = context.sourceCode;
        const options = context.options[0] || {};
        const threshold = options.threshold || 3;

        // --- AST pre-pass metadata ---
        const templateExprSpaced = new Set();
        const arrowInCallOuters = new Set();
        const computedMemberBrackets = new Set();
        // Brackets exempt from cluster counting
        // (e.g., block-body arrow params — principle 11)
        const exemptBrackets = new Set();

        return {
            // Gap 3: Template literal sub-rule
            TemplateLiteral(node) {
                for (const expr of node.expressions) {
                    const exprTokens = sourceCode.getTokens(expr);
                    const hasGrp = exprTokens.some(
                        t => isGrouping(t)
                    );
                    if (hasGrp) {
                        const before = sourceCode.getTokenBefore(
                            expr
                        );
                        const after = sourceCode.getTokenAfter(
                            expr
                        );
                        if (before) templateExprSpaced.add(before);
                        if (after) templateExprSpaced.add(after);
                    }
                }
            },

            // Gap 5: Arrow function detection
            CallExpression(node) {
                for (const arg of node.arguments) {
                    if (
                        arg.type === 'ArrowFunctionExpression'
                        && arg.expression === true
                        && arg.body.type === 'CallExpression'
                    ) {
                        const openParen = sourceCode.getTokenAfter(
                            node.callee,
                            t => t.value === '('
                        );
                        const closeParen = sourceCode.getLastToken(
                            node
                        );
                        if (openParen) {
                            arrowInCallOuters.add(openParen);
                        }
                        if (
                            closeParen
                            && closeParen.value === ')'
                        ) {
                            arrowInCallOuters.add(closeParen);
                        }
                    }
                }
            },

            // Principle 11: block body arrows exempt
            ArrowFunctionExpression(node) {
                // Block body `() => { }` — the block provides
                // visual separation, so the arrow's params
                // shouldn't contribute to density
                if (node.body.type === 'BlockStatement') {
                    // Find the ( ) around params
                    const openParen = sourceCode.getFirstToken(
                        node
                    );
                    if (
                        openParen
                        && openParen.value === '('
                    ) {
                        exemptBrackets.add(openParen);
                    }
                    const closeParen
                        = sourceCode.getTokenBefore(node.body);
                    if (
                        closeParen
                        && closeParen.value === ')'
                    ) {
                        exemptBrackets.add(closeParen);
                    }
                }
            },

            // Gap 7: Bracket access inversion
            MemberExpression(node) {
                if (node.computed) {
                    const openBracket = sourceCode.getTokenBefore(
                        node.property
                    );
                    const closeBracket = sourceCode.getTokenAfter(
                        node.property
                    );
                    if (
                        openBracket
                        && openBracket.value === '['
                    ) {
                        computedMemberBrackets.add(openBracket);
                    }
                    if (
                        closeBracket
                        && closeBracket.value === ']'
                    ) {
                        computedMemberBrackets.add(closeBracket);
                    }
                }
            },

            'Program:exit'() {
                const tokens = sourceCode.getTokens(
                    sourceCode.ast,
                    { includeComments: false }
                );

                const needsSpaceAfter = new Set();
                const needsSpaceBefore = new Set();

                // --- Gap 3: Template literal sub-rule ---
                for (let i = 0; i < tokens.length; i++) {
                    const token = tokens[i];
                    if (!templateExprSpaced.has(token)) continue;

                    if (isOpening(token)) {
                        if (!hasSpaceAfter(sourceCode, token)) {
                            needsSpaceAfter.add(i);
                        }
                    }
                    if (isClosing(token)) {
                        if (!hasSpaceBefore(sourceCode, token)) {
                            needsSpaceBefore.add(i);
                        }
                    }
                }

                // --- Gap 5: Arrow-in-call spacing ---
                for (let i = 0; i < tokens.length; i++) {
                    const token = tokens[i];
                    if (!arrowInCallOuters.has(token)) continue;

                    if (token.value === '(') {
                        if (!hasSpaceAfter(sourceCode, token)) {
                            needsSpaceAfter.add(i);
                        }
                    }
                    if (token.value === ')') {
                        if (!hasSpaceBefore(sourceCode, token)) {
                            needsSpaceBefore.add(i);
                        }
                    }
                }

                // --- Main cluster detection ---
                const processed = new Set();

                for (let i = 0; i < tokens.length; i++) {
                    if (processed.has(i)) continue;
                    if (!isGrouping(tokens[i])) continue;

                    const cluster = adjacentCluster(tokens, i);

                    for (
                        let j = cluster.startIdx;
                        j <= cluster.endIdx;
                        j++
                    ) {
                        processed.add(j);
                    }

                    // Subtract exempt tokens from count
                    // (e.g., block-body arrow params)
                    let effectiveCount = cluster.count;
                    for (
                        let j = cluster.startIdx;
                        j <= cluster.endIdx;
                        j++
                    ) {
                        if (exemptBrackets.has(tokens[j])) {
                            effectiveCount--;
                        }
                    }

                    if (effectiveCount < threshold) continue;

                    // Dense trailing detection
                    const lastGroupingIdx = (() => {
                        for (
                            let j = cluster.endIdx;
                            j >= cluster.startIdx;
                            j--
                        ) {
                            if (isClosing(tokens[j])) return j;
                        }
                        return -1;
                    })();

                    const hasDenseTrailing
                        = cluster.endIdx !== lastGroupingIdx
                        && lastGroupingIdx !== -1
                        && isDenseTrailing(
                            tokens[cluster.endIdx]
                        );

                    // --- Gap 4: continuation vs termination ---
                    const afterCluster = cluster.endIdx + 1
                        < tokens.length
                        ? tokens[cluster.endIdx + 1]
                        : null;

                    let isContinuation = false;
                    if (hasDenseTrailing) {
                        const trailing = tokens[cluster.endIdx];
                        if (
                            trailing.value === '.'
                            || trailing.value === '!'
                        ) {
                            isContinuation = true;
                        }
                    } else {
                        // Check if cluster ends with an opening
                        // bracket — that means the expression
                        // continues through bracket access
                        const lastToken
                            = tokens[cluster.endIdx];
                        if (isOpening(lastToken)) {
                            isContinuation = true;
                        }
                        // Check what follows the cluster
                        if (
                            !isContinuation
                            && afterCluster
                            && areAdjacent(
                                tokens[cluster.endIdx],
                                afterCluster
                            )
                            && (
                                afterCluster.value === '.'
                                || afterCluster.value === '['
                                || afterCluster.value === '('
                            )
                        ) {
                            isContinuation = true;
                        }
                    }

                    // Find the outermost container
                    const container = findOutermostContainer(
                        tokens, cluster
                    );
                    if (!container) continue;

                    // --- Multi-arg suppression (Principle 13) ---
                    // Count only CLOSING grouping chars — opening
                    // chars like `(` from empty calls don't count
                    // toward the closing-side density
                    let closingGrouping = 0;
                    for (
                        let j = cluster.startIdx;
                        j <= cluster.endIdx;
                        j++
                    ) {
                        if (isClosing(tokens[j])) {
                            closingGrouping++;
                        }
                    }
                    if (
                        !isContinuation
                        && hasDenseTrailing
                        && closingGrouping < threshold
                    ) {
                        let hasComma = false;
                        for (
                            let j = container.openIdx + 1;
                            j < container.closeIdx;
                            j++
                        ) {
                            if (tokens[j].value === ',') {
                                hasComma = true;
                                break;
                            }
                        }
                        if (hasComma) continue;
                    }

                    // --- Gap 6: content-aware suppression ---
                    // Only at termination points (trailing ;)
                    // and only when density comes from trailing
                    // char, not 3+ actual closing brackets
                    if (
                        !isContinuation
                        && hasDenseTrailing
                        && closingGrouping < threshold
                        && lastGroupingIdx !== -1
                    ) {
                        const openToken
                            = tokens[container.openIdx];
                        const closeToken
                            = tokens[container.closeIdx];
                        const contentLen
                            = closeToken.range[0]
                            - openToken.range[1];

                        // Check callee length — both outer
                        // and inner call structures
                        const suppressed
                            = checkContentSuppression(
                                tokens,
                                container.openIdx,
                                container.closeIdx,
                                contentLen
                            );
                        if (suppressed) continue;
                    }

                    // --- Determine spacing targets ---
                    const openToken = tokens[container.openIdx];
                    const closeToken = tokens[container.closeIdx];
                    const sameLine = isTokenOnSameLine(
                        openToken, closeToken
                    );

                    // Determine cluster directionality
                    let clusterHasClosing = false;
                    let clusterHasOpening = false;
                    for (
                        let j = cluster.startIdx;
                        j <= cluster.endIdx;
                        j++
                    ) {
                        if (isClosing(tokens[j])) {
                            clusterHasClosing = true;
                        }
                        if (isOpening(tokens[j])) {
                            clusterHasOpening = true;
                        }
                    }

                    // Space the dense side
                    if (clusterHasClosing) {
                        if (
                            !hasSpaceBefore(
                                sourceCode, closeToken
                            )
                        ) {
                            needsSpaceBefore.add(
                                container.closeIdx
                            );
                        }
                    }
                    if (clusterHasOpening) {
                        if (
                            !hasSpaceAfter(
                                sourceCode, openToken
                            )
                        ) {
                            needsSpaceAfter.add(
                                container.openIdx
                            );
                        }
                    }

                    // Gap 2: Balance on single-line
                    if (sameLine) {
                        if (
                            clusterHasClosing
                            && !clusterHasOpening
                        ) {
                            if (
                                !hasSpaceAfter(
                                    sourceCode, openToken
                                )
                            ) {
                                needsSpaceAfter.add(
                                    container.openIdx
                                );
                            }
                        }
                        if (
                            clusterHasOpening
                            && !clusterHasClosing
                        ) {
                            if (
                                !hasSpaceBefore(
                                    sourceCode, closeToken
                                )
                            ) {
                                needsSpaceBefore.add(
                                    container.closeIdx
                                );
                            }
                        }
                    }
                }

                // --- Gap 7: Bracket access — long content ---
                for (let i = 0; i < tokens.length; i++) {
                    const token = tokens[i];
                    if (!computedMemberBrackets.has(token)) {
                        continue;
                    }
                    if (token.value !== '[') continue;

                    const matchIdx = findMatchingBracket(tokens, i);
                    if (matchIdx === -1) continue;

                    // Check for nested bracket access
                    let hasNestedBrackets = false;
                    for (let j = i + 1; j < matchIdx; j++) {
                        if (
                            tokens[j].value === '['
                            || tokens[j].value === ']'
                        ) {
                            hasNestedBrackets = true;
                            break;
                        }
                    }
                    if (!hasNestedBrackets) continue;

                    // Check if identifier before [ is long
                    // (anchoring effect from outer name)
                    if (i > 0) {
                        const before = tokens[i - 1];
                        if (
                            before.type === 'Identifier'
                            && before.value.length >= 10
                        ) {
                            continue; // long outer name anchors
                        }
                    }

                    // Check if first token inside brackets is
                    // a long identifier (inner content anchors)
                    if (i + 1 < matchIdx) {
                        const firstInner = tokens[i + 1];
                        if (
                            firstInner.type === 'Identifier'
                            && firstInner.value.length >= 10
                        ) {
                            continue; // long inner name anchors
                        }
                    }

                    const contentLen = tokens[matchIdx].range[0]
                        - token.range[1];

                    // Long content increases spacing need
                    if (contentLen >= 15) {
                        if (!hasSpaceAfter(sourceCode, token)) {
                            needsSpaceAfter.add(i);
                        }
                        if (
                            !hasSpaceBefore(
                                sourceCode, tokens[matchIdx]
                            )
                        ) {
                            needsSpaceBefore.add(matchIdx);
                        }
                    }
                }

                // Report violations
                for (const idx of needsSpaceAfter) {
                    const token = tokens[idx];
                    context.report({
                        loc: token.loc,
                        messageId: 'requireSpaceAfter',
                        data: {
                            token: token.value,
                            count: String(threshold),
                        },
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
                        data: {
                            token: token.value,
                            count: String(threshold),
                        },
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
