const OPENING = new Set(['(', '[', '{']);
const CLOSING = new Set([')', ']', '}']);
const DENSE_TRAILING = new Set([';', '.', '!']);

// AST node type constants
const ARROW_FUNC = 'ArrowFunctionExpression';
const BLOCK_STMT = 'BlockStatement';
const CALL_EXPR = 'CallExpression';
const IDENTIFIER = 'Identifier';
const MEMBER_EXPR = 'MemberExpression';
const PUNCTUATOR = 'Punctuator';
const TEMPLATE = 'Template';
const TEMPLATE_LIT = 'TemplateLiteral';

function isOpening(token) {
    if (token.type === PUNCTUATOR && OPENING.has(token.value)) {
        return true;
    }
    if (token.type === TEMPLATE && token.value.endsWith('${')) {
        return true;
    }
    return false;
}

function isClosing(token) {
    if (token.type === PUNCTUATOR && CLOSING.has(token.value)) {
        return true;
    }
    if (token.type === TEMPLATE && token.value.startsWith('}')) {
        return true;
    }
    return false;
}

function isGrouping(token) {
    return isOpening(token) || isClosing(token);
}

function isDenseTrailing(token) {
    return token.type === PUNCTUATOR
        && DENSE_TRAILING.has(token.value);
}

function openingWeight(token) {
    if (token.type === TEMPLATE && token.value.endsWith('${')) {
        return 2;
    }
    return 1;
}

function chainsLeft(token) {
    if (token.type === TEMPLATE) {
        return !token.value.startsWith('`');
    }
    return true;
}

function chainsRight(token) {
    if (token.type === TEMPLATE) {
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
    let count = openingWeight( tokens[startIdx] );
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
            const continuesRight = next
                && areAdjacent(tok, next)
                && isGrouping(next);
            if (!continuesRight) break;
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
            if (isOpening( tokens[i] )) depth++;
            if (isClosing( tokens[i] )) depth--;
            if (depth === 0) return i;
        }
    }

    if (isClosing(token)) {
        let depth = 0;
        for (let i = index; i >= 0; i--) {
            if (isClosing( tokens[i] )) depth++;
            if (isOpening( tokens[i] )) depth--;
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
 * Check if a member callee pattern anchors visually.
 * Looks for obj.method( where names are long enough.
 */
function isMemberCalleeAnchored(tokens, parenIdx) {
    if (parenIdx < 3) return false;
    const isMethodIdent = tokens[parenIdx - 1].type === IDENTIFIER;
    const isDot = tokens[parenIdx - 2].value === '.';
    const isObjIdent = tokens[parenIdx - 3].type === IDENTIFIER;
    if (!isMethodIdent || !isDot || !isObjIdent) return false;
    const method = tokens[parenIdx - 1].value.length;
    const obj = tokens[parenIdx - 3].value.length;
    if (obj >= 5 && method >= 4) return true;
    if (method >= 5) return true;
    return false;
}

/**
 * Check if a simple callee identifier is long enough
 * to anchor visually.
 */
function isSimpleCalleeAnchored(tokens, parenIdx, minLen) {
    if (parenIdx < 1) return false;
    const callee = tokens[parenIdx - 1];
    return callee.type === IDENTIFIER && callee.value.length >= minLen;
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
        tokens, openIdx, closeIdx, contentLen) {
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
        if (isMemberCalleeAnchored(tokens, j)) return true;
        if (isSimpleCalleeAnchored(tokens, j, 8)) return true;
    }

    // Fall back to outer callee check only if no inner
    // callee pattern was found inside the brackets.
    if (!foundInnerCallee && openIdx > 0) {
        const callee = tokens[openIdx - 1];
        const calleeLen = callee.value.length;

        // Member expression: obj.method
        const hasDotBefore = openIdx > 2
            && tokens[openIdx - 2].value === '.';

        if (hasDotBefore) {
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
 * Scan cluster tokens for composition flags.
 * Returns { hasOpening, hasClosing }.
 */
function clusterComposition(tokens, cluster) {
    let hasOpening = false;
    let hasClosing = false;
    for (let j = cluster.startIdx; j <= cluster.endIdx; j++) {
        if (isOpening( tokens[j] )) hasOpening = true;
        if (isClosing( tokens[j] )) hasClosing = true;
    }
    return { hasOpening, hasClosing };
}

/**
 * Mode A: closing-only cluster. Find outermost closing
 * bracket and return its matched pair.
 */
function findClosingOnlyContainer(tokens, cluster) {
    for (let j = cluster.endIdx; j >= cluster.startIdx; j--) {
        if (!isClosing( tokens[j] )) continue;
        const matchIdx = findMatchingBracket(tokens, j);
        if (matchIdx !== -1) {
            return { openIdx: matchIdx, closeIdx: j };
        }
    }
    return null;
}

/**
 * Opening-only cluster. Find outermost opening bracket
 * and return its matched pair.
 */
function findOpeningOnlyContainer(tokens, cluster) {
    for (let j = cluster.startIdx; j <= cluster.endIdx; j++) {
        if (!isOpening( tokens[j] )) continue;
        const matchIdx = findMatchingBracket(tokens, j);
        if (matchIdx !== -1) {
            return { openIdx: j, closeIdx: matchIdx };
        }
    }
    return null;
}

/**
 * Mode B: mixed cluster. Walk outward to find the
 * enclosing bracket pair that contains the cluster.
 */
function findMixedContainer(tokens, cluster) {
    // Walk backward
    for (let j = cluster.startIdx - 1; j >= 0; j--) {
        if (!isOpening( tokens[j] )) continue;
        const matchIdx = findMatchingBracket(tokens, j);
        if (matchIdx === -1) continue;
        if (matchIdx > cluster.endIdx) {
            return { openIdx: j, closeIdx: matchIdx };
        }
    }

    // Walk forward
    for (let j = cluster.endIdx + 1; j < tokens.length; j++) {
        if (!isClosing( tokens[j] )) continue;
        const matchIdx = findMatchingBracket(tokens, j);
        if (matchIdx === -1) continue;
        if (matchIdx < cluster.startIdx) {
            return { openIdx: matchIdx, closeIdx: j };
        }
    }

    return null;
}

/**
 * Fallback: find widest bracket pair from cluster tokens.
 */
function findWidestPairInCluster(tokens, cluster) {
    let bestOpenIdx = -1;
    let bestCloseIdx = -1;
    let bestSpan = -1;

    for (let j = cluster.startIdx; j <= cluster.endIdx; j++) {
        if (!isGrouping( tokens[j] )) continue;
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
    const { hasOpening, hasClosing } = clusterComposition(
        tokens, cluster
    );

    if (hasClosing && !hasOpening) {
        return findClosingOnlyContainer(tokens, cluster);
    }

    if (hasOpening && !hasClosing) {
        return findOpeningOnlyContainer(tokens, cluster);
    }

    // Mixed: walk outward, then fall back to widest pair
    return findMixedContainer(tokens, cluster)
        || findWidestPairInCluster(tokens, cluster);
}

/**
 * Exempt a bracket token pair from cluster counting if
 * both the token and its value match expectations.
 */
function exemptIfMatch(sourceCode, node, getter, value, set) {
    const token = getter.call(sourceCode, node);
    if (token && token.value === value) set.add(token);
}

/**
 * Exempt all four brackets of a block-body function
 * (params parens + body braces) from cluster counting.
 */
function exemptBlockBodyBrackets(
        sourceCode, openParen, node, exemptBrackets) {
    if (openParen && openParen.value === '(') {
        exemptBrackets.add(openParen);
    }
    const closeParen = sourceCode.getTokenBefore(node.body);
    if (closeParen && closeParen.value === ')') {
        exemptBrackets.add(closeParen);
    }
    exemptIfMatch(
        sourceCode, node.body,
        sourceCode.getFirstToken, '{', exemptBrackets
    );
    exemptIfMatch(
        sourceCode, node.body,
        sourceCode.getLastToken, '}', exemptBrackets
    );
}

/**
 * Count closing grouping chars in a cluster range.
 */
function countClosingInCluster(tokens, cluster) {
    let count = 0;
    for (let j = cluster.startIdx; j <= cluster.endIdx; j++) {
        if (isClosing( tokens[j] )) count++;
    }
    return count;
}

/**
 * Check if container has a comma at depth 0 (multi-arg).
 */
function hasTopLevelComma(tokens, container) {
    let depth = 0;
    for (let j = container.openIdx + 1; j < container.closeIdx; j++) {
        if (isOpening( tokens[j] )) depth++;
        if (isClosing( tokens[j] )) depth--;
        if (depth === 0 && tokens[j].value === ',') return true;
    }
    return false;
}

/**
 * Find the last closing-bracket index within a cluster.
 * Returns -1 if none found.
 */
function findLastClosingIdx(tokens, cluster) {
    for (let j = cluster.endIdx; j >= cluster.startIdx; j--) {
        if (isClosing( tokens[j] )) return j;
    }
    return -1;
}

/**
 * Determine whether a cluster represents a continuation
 * point (expression continues) vs a termination point.
 */
function classifyContinuation(
        tokens, cluster, hasDenseTrailing, afterCluster) {
    if (hasDenseTrailing) {
        const trailing = tokens[cluster.endIdx];
        return trailing.value === '.' || trailing.value === '!';
    }

    // Cluster ends with an opening bracket — expression
    // continues through bracket access
    const lastToken = tokens[cluster.endIdx];
    if (isOpening(lastToken)) return true;

    // Check what follows the cluster
    if (!afterCluster) return false;
    const adjacent = areAdjacent(
        tokens[cluster.endIdx], afterCluster
    );
    const continuesAfter = afterCluster.value === '.'
        || afterCluster.value === '['
        || afterCluster.value === '(';
    return adjacent && continuesAfter;
}

/**
 * Apply spacing decisions for a single cluster.
 * Adds indices to needsSpaceAfter / needsSpaceBefore sets.
 */
function applyClusterSpacing(
        sourceCode, tokens, cluster, container,
        needsSpaceAfter, needsSpaceBefore) {
    const openToken = tokens[container.openIdx];
    const closeToken = tokens[container.closeIdx];
    const sameLine = isTokenOnSameLine(openToken, closeToken);
    const { hasOpening, hasClosing } = clusterComposition(
        tokens, cluster
    );

    // Space the dense side
    if (hasClosing) {
        if (!hasSpaceBefore(sourceCode, closeToken)) {
            needsSpaceBefore.add(container.closeIdx);
        }
    }
    if (hasOpening) {
        if (!hasSpaceAfter(sourceCode, openToken)) {
            needsSpaceAfter.add(container.openIdx);
        }
    }

    // Gap 2: Balance on single-line
    if (!sameLine) return;

    if (hasClosing && !hasOpening) {
        if (!hasSpaceAfter(sourceCode, openToken)) {
            needsSpaceAfter.add(container.openIdx);
        }
    }
    if (hasOpening && !hasClosing) {
        if (!hasSpaceBefore(sourceCode, closeToken)) {
            needsSpaceBefore.add(container.closeIdx);
        }
    }
}

/**
 * Check whether nested bracket access needs spacing
 * for a computed member expression bracket pair.
 */
function checkBracketAccessSpacing(
        sourceCode, tokens, i, matchIdx,
        needsSpaceAfter, needsSpaceBefore) {
    const token = tokens[i];

    // Check for nested bracket access
    let hasNestedBrackets = false;
    for (let j = i + 1; j < matchIdx; j++) {
        const isBracket = tokens[j].value === '['
            || tokens[j].value === ']';
        if (isBracket) {
            hasNestedBrackets = true;
            break;
        }
    }
    if (!hasNestedBrackets) return;

    // Check if identifier before [ is long
    // (anchoring effect from outer name)
    if (i > 0) {
        const before = tokens[i - 1];
        const longOuter = before.type === IDENTIFIER
            && before.value.length >= 10;
        if (longOuter) return;
    }

    // Check if first token inside brackets is a long
    // identifier (inner content anchors)
    if (i + 1 < matchIdx) {
        const firstInner = tokens[i + 1];
        const longInner = firstInner.type === IDENTIFIER
            && firstInner.value.length >= 10;
        if (longInner) return;
    }

    const contentLen = tokens[matchIdx].range[0]
        - token.range[1];

    // Long content increases spacing need
    if (contentLen >= 15) {
        if (!hasSpaceAfter(sourceCode, token)) {
            needsSpaceAfter.add(i);
        }
        if (!hasSpaceBefore(sourceCode, tokens[matchIdx])) {
            needsSpaceBefore.add(matchIdx);
        }
    }
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
            [TEMPLATE_LIT](node) {
                for (const expr of node.expressions) {
                    const exprTokens = sourceCode.getTokens(expr);
                    const hasGrp = exprTokens.some(
                        t => isGrouping(t)
                    );
                    if (!hasGrp) continue;
                    const before = sourceCode.getTokenBefore(expr);
                    const after = sourceCode.getTokenAfter(expr);
                    if (before) templateExprSpaced.add(before);
                    if (after) templateExprSpaced.add(after);
                }
            },

            // Gap 5: Arrow function detection
            [CALL_EXPR](node) {
                for (const arg of node.arguments) {
                    const isWrappedArrow = arg.type === ARROW_FUNC
                        && arg.expression === true
                        && arg.body.type === CALL_EXPR;
                    if (!isWrappedArrow) continue;

                    const openParen = sourceCode.getTokenAfter(
                        node.callee, t => t.value === '('
                    );
                    const closeParen = sourceCode.getLastToken(node);
                    if (openParen) {
                        arrowInCallOuters.add(openParen);
                    }
                    if (closeParen && closeParen.value === ')') {
                        arrowInCallOuters.add(closeParen);
                    }
                }
            },

            // Principle 11: block body arrows exempt
            [ARROW_FUNC](node) {
                // Block body `() => { }` — the block provides
                // visual separation, so the arrow's params
                // shouldn't contribute to density
                if (node.body.type !== BLOCK_STMT) return;

                const openParen = sourceCode.getFirstToken(node);
                exemptBlockBodyBrackets(
                    sourceCode, openParen, node, exemptBrackets
                );
            },

            // Principle 11: block body function expressions exempt
            FunctionExpression(node) {
                // function() { } — the block body provides
                // visual separation, same as arrow functions
                const firstToken = sourceCode.getFirstToken(node);
                // Skip `function` keyword to find the (
                const openParen = sourceCode.getTokenAfter(
                    firstToken, t => t.value === '('
                );
                exemptBlockBodyBrackets(
                    sourceCode, openParen, node, exemptBrackets
                );
            },

            // Gap 7: Bracket access inversion
            [MEMBER_EXPR](node) {
                if (!node.computed) return;
                const prop = node.property;
                exemptIfMatch(
                    sourceCode, prop,
                    sourceCode.getTokenBefore, '[',
                    computedMemberBrackets
                );
                exemptIfMatch(
                    sourceCode, prop,
                    sourceCode.getTokenAfter, ']',
                    computedMemberBrackets
                );
            },

            'Program:exit'() {
                const tokens = sourceCode.getTokens(
                    sourceCode.ast, { includeComments: false }
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
                processMainClusters(
                    sourceCode, tokens, threshold,
                    exemptBrackets, needsSpaceAfter,
                    needsSpaceBefore
                );

                // --- Gap 7: Bracket access — long content ---
                for (let i = 0; i < tokens.length; i++) {
                    const token = tokens[i];
                    if (!computedMemberBrackets.has(token)) {
                        continue;
                    }
                    if (token.value !== '[') continue;

                    const matchIdx = findMatchingBracket(
                        tokens, i
                    );
                    if (matchIdx === -1) continue;

                    checkBracketAccessSpacing(
                        sourceCode, tokens, i, matchIdx,
                        needsSpaceAfter, needsSpaceBefore
                    );
                }

                // Report violations
                reportViolations(
                    context, tokens, threshold,
                    needsSpaceAfter, 'requireSpaceAfter',
                    (fixer, token) => fixer.insertTextAfter(
                        token, ' '
                    )
                );
                reportViolations(
                    context, tokens, threshold,
                    needsSpaceBefore, 'requireSpaceBefore',
                    (fixer, token) => fixer.insertTextBefore(
                        token, ' '
                    )
                );
            },
        };
    },
};

/**
 * Process all main clusters: detect, filter, and apply
 * spacing decisions.
 */
function processMainClusters(
        sourceCode, tokens, threshold,
        exemptBrackets, needsSpaceAfter, needsSpaceBefore) {
    const processed = new Set();

    for (let i = 0; i < tokens.length; i++) {
        if (processed.has(i)) continue;
        if (!isGrouping( tokens[i] )) continue;

        const cluster = adjacentCluster(tokens, i);
        markProcessed(processed, cluster);

        const effectiveCount = subtractExempt(
            tokens, cluster, exemptBrackets
        );
        if (effectiveCount < threshold) continue;

        const lastGroupingIdx = findLastClosingIdx(tokens, cluster);

        const hasDenseTrailing = cluster.endIdx !== lastGroupingIdx
            && lastGroupingIdx !== -1
            && isDenseTrailing( tokens[cluster.endIdx] );

        const nextIdx = cluster.endIdx + 1;
        const afterCluster = nextIdx < tokens.length
            ? tokens[nextIdx]
            : null;

        const isContinuation = classifyContinuation(
            tokens, cluster, hasDenseTrailing, afterCluster
        );

        const container = findOutermostContainer(tokens, cluster);
        if (!container) continue;

        // --- Multi-arg suppression (Principle 13) ---
        const closingGrouping = countClosingInCluster(
            tokens, cluster
        );
        const suppressMultiArg = !isContinuation
            && hasDenseTrailing
            && closingGrouping < threshold;
        if (suppressMultiArg && hasTopLevelComma(tokens, container)) {
            continue;
        }

        // --- Gap 6: content-aware suppression ---
        const suppressContent = !isContinuation
            && hasDenseTrailing
            && closingGrouping < threshold
            && lastGroupingIdx !== -1;
        if (suppressContent) {
            const openToken = tokens[container.openIdx];
            const closeToken = tokens[container.closeIdx];
            const contentLen = closeToken.range[0]
                - openToken.range[1];

            const suppressed = checkContentSuppression(
                tokens, container.openIdx,
                container.closeIdx, contentLen
            );
            if (suppressed) continue;
        }

        applyClusterSpacing(
            sourceCode, tokens, cluster, container,
            needsSpaceAfter, needsSpaceBefore
        );
    }
}

/**
 * Mark all indices in a cluster as processed.
 */
function markProcessed(processed, cluster) {
    for (let j = cluster.startIdx; j <= cluster.endIdx; j++) {
        processed.add(j);
    }
}

/**
 * Subtract exempt bracket count from cluster count.
 */
function subtractExempt(tokens, cluster, exemptBrackets) {
    let effectiveCount = cluster.count;
    for (let j = cluster.startIdx; j <= cluster.endIdx; j++) {
        if (exemptBrackets.has( tokens[j] )) effectiveCount--;
    }
    return effectiveCount;
}

/**
 * Report all violations from an index set.
 */
function reportViolations(
        context, tokens, threshold, indexSet,
        messageId, fixFn) {
    for (const idx of indexSet) {
        const token = tokens[idx];
        context.report({
            loc: token.loc,
            messageId,
            data: {
                token: token.value,
                count: String(threshold),
            },
            fix(fixer) {
                return fixFn(fixer, token);
            },
        });
    }
}
