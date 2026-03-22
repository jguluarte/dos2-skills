const OPENING = new Set(['(', '[', '{']);
const CLOSING = new Set([')', ']', '}']);
const DENSE_TRAILING = new Set([';', '.', '!']);

// AST node type constants
const ARROW_FUNC = 'ArrowFunctionExpression';
const BLOCK_STMT = 'BlockStatement';
const CALL_EXPR = 'CallExpression';
const FUNC_EXPR = 'FunctionExpression';
const IDENTIFIER = 'Identifier';
const MEMBER_EXPR = 'MemberExpression';
const PUNCTUATOR = 'Punctuator';
const TEMPLATE = 'Template';
const TEMPLATE_LIT = 'TemplateLiteral';

// Visual anchoring thresholds — named so the design
// decisions are grep-able, not buried in comparisons

// obj.meth() — 4-char method suffices when the object name
// is already long enough to anchor the eye (5+ chars gives
// 9+ chars of context before the paren)
const MIN_METHOD_LEN_WITH_LONG_OBJ = 4;

// parse() alone — 5+ chars gives the eye a word to land on,
// shorter names like fn() or go() look like noise in a pile
const MIN_METHOD_LEN_STANDALONE = 5;

// items.find() — the object name counts as context only when
// it's a real word (5+ chars), not a 1-2 char abbreviation
const MIN_OBJ_LEN_FOR_ANCHORING = 5;

// Inner callee inside wrap(longName(x)) — 8+ chars is
// unmistakable as a word boundary even inside nested parens
const MIN_CALLEE_LEN_FOR_SUPPRESSION = 8;

// Total character width between brackets — at 15+ chars the
// content itself provides enough visual separation
const MIN_CONTENT_LEN_FOR_SUPPRESSION = 15;

// Bracket access obj[arr[idx]] — 10+ char outer/inner names
// anchor the eye so nested brackets don't need extra spacing
const MIN_BRACKET_OUTER_LEN = 10;
const MIN_BRACKET_INNER_LEN = 10;

// How close an inner callee's closing paren must be to the
// outer close — at most 2 tokens away (e.g., `))`  or `);`)
// so we only check callees that actually contribute to the
// visual pile-up at the close boundary
const INNER_CALLEE_PROXIMITY = 2;

// ${expr} counts as 2 grouping chars because it contributes
// both an opening `${` and a closing `}` to visual density
const TEMPLATE_EXPR_WEIGHT = 2;

function isOpening(token) {
    return (token.type === PUNCTUATOR && OPENING.has(token.value))
        || (token.type === TEMPLATE && token.value.endsWith('${'));
}

function isClosing(token) {
    return (token.type === PUNCTUATOR && CLOSING.has(token.value))
        || (token.type === TEMPLATE && token.value.startsWith('}'));
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
        return TEMPLATE_EXPR_WEIGHT;
    }
    return 1;
}

function connectsOnLeftEdge(token) {
    if (token.type === TEMPLATE) {
        return !token.value.startsWith('`');
    }
    return true;
}

function connectsOnRightEdge(token) {
    if (token.type === TEMPLATE) {
        return !token.value.endsWith('`');
    }
    return true;
}

function areAdjacent(tokenA, tokenB) {
    return tokenA.range[1] === tokenB.range[0];
}

// -------------------------------------------------------
// Cluster expansion — each direction is its own function
// -------------------------------------------------------

function denseTrailingContinues(tokens, tok, i) {
    const next = tokens[i + 1];
    return next && areAdjacent(tok, next) && isGrouping(next);
}

function expandRight(tokens, startIdx) {
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

        count += openingWeight(tok);
        right = i;
        if (!connectsOnRightEdge(tok)) break;
        i++;
    }

    return { count, right };
}

// Dense trailing chars (;, .) only appear at the right end of
// clusters — left expansion only includes grouping chars.
function expandLeft(tokens, startIdx) {
    let count = 0;
    let left = startIdx;

    let i = startIdx - 1;
    while (i >= 0) {
        const tok = tokens[i];
        const next = tokens[i + 1];
        if (!areAdjacent(tok, next)) break;
        if (!isGrouping(tok)) break;
        if (!connectsOnRightEdge(tok)) break;
        count += openingWeight(tok);
        if (!connectsOnLeftEdge(tok)) {
            left = i;
            break;
        }
        left = i;
        i--;
    }

    return { count, left };
}

/**
 * Count adjacent grouping chars (mixed direction) starting
 * from startIdx, expanding both directions while tokens
 * remain source-adjacent.
 */
function adjacentCluster(tokens, startIdx) {
    let count = openingWeight(tokens[startIdx]);
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
// Bracket map — O(n) pre-pass replaces O(n) per-lookup
// -------------------------------------------------------

function buildBracketMap(tokens) {
    const map = new Map();
    const stack = [];

    for (let i = 0; i < tokens.length; i++) {
        if (isOpening(tokens[i])) {
            stack.push(i);
        } else if (isClosing(tokens[i])) {
            if (stack.length > 0) {
                const openIdx = stack.pop();
                map.set(openIdx, i);
                map.set(i, openIdx);
            }
        }
    }

    return map;
}

function lookupBracket(bracketMap, index) {
    const match = bracketMap.get(index);
    return match !== undefined ? match : -1;
}

// -------------------------------------------------------
// Token spacing queries
// -------------------------------------------------------

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

// -------------------------------------------------------
// Visual anchoring checks
// -------------------------------------------------------

function isMemberCalleeAnchored(tokens, parenIdx) {
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

function isSimpleCalleeAnchored(tokens, parenIdx, minLen) {
    if (parenIdx < 1) return false;
    const callee = tokens[parenIdx - 1];
    return callee.type === IDENTIFIER
        && callee.value.length >= minLen;
}

function findInnerCallee(tokens, bracketMap, openIdx, closeIdx) {
    for (let j = openIdx + 1; j < closeIdx - 1; j++) {
        if (tokens[j].value !== '(') continue;
        const matchJ = lookupBracket(bracketMap, j);
        if (matchJ === -1) continue;
        if (closeIdx - matchJ > INNER_CALLEE_PROXIMITY) continue;
        return j;
    }
    return -1;
}

function innerCalleeAnchors(tokens, calleeIdx) {
    if (isMemberCalleeAnchored(tokens, calleeIdx)) return true;
    return isSimpleCalleeAnchored(
        tokens, calleeIdx, MIN_CALLEE_LEN_FOR_SUPPRESSION
    );
}

function outerCalleeAnchors(tokens, openIdx, contentLen) {
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
function contentSuppressesSpacing(ctx, openIdx, closeIdx) {
    const contentLen = ctx.tokens[closeIdx].range[0]
        - ctx.tokens[openIdx].range[1];

    const innerIdx = findInnerCallee(
        ctx.tokens, ctx.bracketMap, openIdx, closeIdx
    );
    if (innerIdx !== -1) {
        return innerCalleeAnchors(ctx.tokens, innerIdx);
    }

    return outerCalleeAnchors(ctx.tokens, openIdx, contentLen);
}

// -------------------------------------------------------
// Cluster composition queries
// -------------------------------------------------------

function clusterComposition(tokens, cluster) {
    let hasOpening = false;
    let hasClosing = false;
    for (let j = cluster.startIdx; j <= cluster.endIdx; j++) {
        if (isOpening(tokens[j])) hasOpening = true;
        if (isClosing(tokens[j])) hasClosing = true;
    }
    return { hasOpening, hasClosing };
}

function countClosingInCluster(tokens, cluster) {
    let count = 0;
    for (let j = cluster.startIdx; j <= cluster.endIdx; j++) {
        if (isClosing(tokens[j])) count++;
    }
    return count;
}

function findLastClosingIdx(tokens, cluster) {
    for (let j = cluster.endIdx; j >= cluster.startIdx; j--) {
        if (isClosing(tokens[j])) return j;
    }
    return -1;
}

function hasTopLevelComma(tokens, container) {
    let depth = 0;
    for (let j = container.openIdx + 1; j < container.closeIdx; j++) {
        if (isOpening(tokens[j])) depth++;
        if (isClosing(tokens[j])) depth--;
        if (depth === 0 && tokens[j].value === ',') return true;
    }
    return false;
}

// -------------------------------------------------------
// Container finding — by cluster composition mode
// -------------------------------------------------------

function findClosingOnlyContainer(ctx, cluster) {
    for (let j = cluster.endIdx; j >= cluster.startIdx; j--) {
        if (!isClosing(ctx.tokens[j])) continue;
        const matchIdx = lookupBracket(ctx.bracketMap, j);
        if (matchIdx !== -1) {
            return { openIdx: matchIdx, closeIdx: j };
        }
    }
    return null;
}

function findOpeningOnlyContainer(ctx, cluster) {
    for (let j = cluster.startIdx; j <= cluster.endIdx; j++) {
        if (!isOpening(ctx.tokens[j])) continue;
        const matchIdx = lookupBracket(ctx.bracketMap, j);
        if (matchIdx !== -1) {
            return { openIdx: j, closeIdx: matchIdx };
        }
    }
    return null;
}

function findMixedContainer(ctx, cluster) {
    for (let j = cluster.startIdx - 1; j >= 0; j--) {
        if (!isOpening(ctx.tokens[j])) continue;
        const matchIdx = lookupBracket(ctx.bracketMap, j);
        if (matchIdx === -1) continue;
        if (matchIdx > cluster.endIdx) {
            return { openIdx: j, closeIdx: matchIdx };
        }
    }

    for (let j = cluster.endIdx + 1; j < ctx.tokens.length; j++) {
        if (!isClosing(ctx.tokens[j])) continue;
        const matchIdx = lookupBracket(ctx.bracketMap, j);
        if (matchIdx === -1) continue;
        if (matchIdx < cluster.startIdx) {
            return { openIdx: matchIdx, closeIdx: j };
        }
    }

    return null;
}

function findWidestPairInCluster(ctx, cluster) {
    let bestOpenIdx = -1;
    let bestCloseIdx = -1;
    let bestSpan = -1;

    for (let j = cluster.startIdx; j <= cluster.endIdx; j++) {
        if (!isGrouping(ctx.tokens[j])) continue;
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

function findOutermostContainer(ctx, cluster) {
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

// -------------------------------------------------------
// Bracket exemption helpers
// -------------------------------------------------------

function exemptIfMatch(token, value, set) {
    if (token && token.value === value) set.add(token);
}

function exemptBlockBodyBrackets(sourceCode, openParen, node, set) {
    exemptIfMatch(openParen, '(', set);
    const closeParen = sourceCode.getTokenBefore(node.body);
    exemptIfMatch(closeParen, ')', set);
    const openBrace = sourceCode.getFirstToken(node.body);
    exemptIfMatch(openBrace, '{', set);
    const closeBrace = sourceCode.getLastToken(node.body);
    exemptIfMatch(closeBrace, '}', set);
}

// -------------------------------------------------------
// Continuation vs termination classification
// -------------------------------------------------------

function classifyContinuation(tokens, cluster, hasDenseTrailing, afterCluster) {
    if (hasDenseTrailing) {
        const trailing = tokens[cluster.endIdx];
        // `!` after `)` is not valid in standard JS — it's a
        // prefix operator, not postfix. This branch exists for
        // TypeScript's non-null assertion (e.g., getResult()!.prop)
        // if the rule is ever used with a TS parser.
        return trailing.value === '.' || trailing.value === '!';
    }

    const lastToken = tokens[cluster.endIdx];
    if (isOpening(lastToken)) return true;

    if (!afterCluster) return false;
    const adjacent = areAdjacent(
        tokens[cluster.endIdx], afterCluster
    );
    const continuesAfter = afterCluster.value === '.'
        || afterCluster.value === '['
        || afterCluster.value === '(';
    return adjacent && continuesAfter;
}

// -------------------------------------------------------
// Spacing application
// -------------------------------------------------------

function addSpaceAfterIfMissing(ctx, results, idx) {
    if (!hasSpaceAfter(ctx.sourceCode, ctx.tokens[idx])) {
        results.after.add(idx);
    }
}

function addSpaceBeforeIfMissing(ctx, results, idx) {
    if (!hasSpaceBefore(ctx.sourceCode, ctx.tokens[idx])) {
        results.before.add(idx);
    }
}

function applyClusterSpacing(ctx, results, cluster, container) {
    const openToken = ctx.tokens[container.openIdx];
    const closeToken = ctx.tokens[container.closeIdx];
    const sameLine = isTokenOnSameLine(openToken, closeToken);
    const { hasOpening, hasClosing } = clusterComposition(
        ctx.tokens, cluster
    );

    if (hasClosing) {
        addSpaceBeforeIfMissing(ctx, results, container.closeIdx);
    }
    if (hasOpening) {
        addSpaceAfterIfMissing(ctx, results, container.openIdx);
    }

    if (!sameLine) return;

    if (hasClosing && !hasOpening) {
        addSpaceAfterIfMissing(ctx, results, container.openIdx);
    }
    if (hasOpening && !hasClosing) {
        addSpaceBeforeIfMissing(ctx, results, container.closeIdx);
    }
}

// -------------------------------------------------------
// Suppression policy — extracted from processMainClusters
// -------------------------------------------------------

function shouldSuppressSpacing(ctx, info, container) {
    const closingGrouping = countClosingInCluster(
        ctx.tokens, info.cluster
    );
    const canSuppress = !info.isContinuation
        && info.hasDenseTrailing
        && closingGrouping < ctx.threshold;

    if (!canSuppress) return false;

    if (hasTopLevelComma(ctx.tokens, container)) return true;

    return contentSuppressesSpacing(
        ctx, container.openIdx, container.closeIdx
    );
}

// -------------------------------------------------------
// Bracket access spacing (computed member expressions)
// -------------------------------------------------------

function containsNestedBrackets(tokens, openIdx, closeIdx) {
    for (let j = openIdx + 1; j < closeIdx; j++) {
        if (tokens[j].value === '[' || tokens[j].value === ']') {
            return true;
        }
    }
    return false;
}

function outerNameAnchors(tokens, bracketIdx) {
    if (bracketIdx <= 0) return false;
    const before = tokens[bracketIdx - 1];
    return before.type === IDENTIFIER
        && before.value.length >= MIN_BRACKET_OUTER_LEN;
}

function innerNameAnchors(tokens, bracketIdx, closeIdx) {
    if (bracketIdx + 1 >= closeIdx) return false;
    const firstInner = tokens[bracketIdx + 1];
    return firstInner.type === IDENTIFIER
        && firstInner.value.length >= MIN_BRACKET_INNER_LEN;
}

function checkBracketAccessSpacing(ctx, results, i, matchIdx) {
    if (!containsNestedBrackets(ctx.tokens, i, matchIdx)) return;
    if (outerNameAnchors(ctx.tokens, i)) return;
    if (innerNameAnchors(ctx.tokens, i, matchIdx)) return;

    const contentLen = ctx.tokens[matchIdx].range[0]
        - ctx.tokens[i].range[1];

    if (contentLen >= MIN_CONTENT_LEN_FOR_SUPPRESSION) {
        addSpaceAfterIfMissing(ctx, results, i);
        addSpaceBeforeIfMissing(ctx, results, matchIdx);
    }
}

// -------------------------------------------------------
// Cluster processing helpers
// -------------------------------------------------------

function markProcessed(processed, cluster) {
    for (let j = cluster.startIdx; j <= cluster.endIdx; j++) {
        processed.add(j);
    }
}

function effectiveClusterCount(tokens, cluster, exemptBrackets) {
    let effectiveCount = cluster.count;
    for (let j = cluster.startIdx; j <= cluster.endIdx; j++) {
        if (exemptBrackets.has(tokens[j])) effectiveCount--;
    }
    return effectiveCount;
}

function tokenAfterCluster(tokens, cluster) {
    const nextIdx = cluster.endIdx + 1;
    return nextIdx < tokens.length ? tokens[nextIdx] : null;
}

function endsWithTrailingAfterClose(tokens, cluster) {
    const lastGroupingIdx = findLastClosingIdx(tokens, cluster);
    return cluster.endIdx !== lastGroupingIdx
        && lastGroupingIdx !== -1
        && isDenseTrailing(tokens[cluster.endIdx]);
}

// -------------------------------------------------------
// Main cluster detection loop
// -------------------------------------------------------

function classifyCluster(ctx, cluster) {
    const hasDenseTrailing = endsWithTrailingAfterClose(
        ctx.tokens, cluster
    );
    const afterCluster = tokenAfterCluster(ctx.tokens, cluster);
    const isContinuation = classifyContinuation(
        ctx.tokens, cluster, hasDenseTrailing, afterCluster
    );
    return { cluster, hasDenseTrailing, isContinuation };
}

function containerIsEmpty(container) {
    return container.closeIdx === container.openIdx + 1;
}

function processCluster(ctx, results, cluster) {
    const info = classifyCluster(ctx, cluster);
    const container = findOutermostContainer(ctx, cluster);
    if (!container) return;
    if (containerIsEmpty(container)) return;

    if (shouldSuppressSpacing(ctx, info, container)) return;

    applyClusterSpacing(ctx, results, cluster, container);
}

function processMainClusters(ctx, results, metadata) {
    const processed = new Set();

    for (let i = 0; i < ctx.tokens.length; i++) {
        if (processed.has(i)) continue;
        if (!isGrouping(ctx.tokens[i])) continue;

        const cluster = adjacentCluster(ctx.tokens, i);
        markProcessed(processed, cluster);

        const effectiveCount = effectiveClusterCount(
            ctx.tokens, cluster, metadata.exemptBrackets
        );
        if (effectiveCount < ctx.threshold) continue;

        processCluster(ctx, results, cluster);
    }
}

// -------------------------------------------------------
// Template and arrow sub-rules
// -------------------------------------------------------

function applyTemplateExprSpacing(ctx, results, metadata) {
    for (let i = 0; i < ctx.tokens.length; i++) {
        const token = ctx.tokens[i];
        if (!metadata.templateExprSpaced.has(token)) continue;
        if (isOpening(token)) {
            addSpaceAfterIfMissing(ctx, results, i);
        }
        if (isClosing(token)) {
            addSpaceBeforeIfMissing(ctx, results, i);
        }
    }
}

function applyArrowInCallSpacing(ctx, results, metadata) {
    for (let i = 0; i < ctx.tokens.length; i++) {
        const token = ctx.tokens[i];
        if (!metadata.arrowInCallOuters.has(token)) continue;
        if (token.value === '(') {
            addSpaceAfterIfMissing(ctx, results, i);
        }
        if (token.value === ')') {
            addSpaceBeforeIfMissing(ctx, results, i);
        }
    }
}

function applyBracketAccessSpacing(ctx, results, metadata) {
    for (let i = 0; i < ctx.tokens.length; i++) {
        const token = ctx.tokens[i];
        if (!metadata.computedMemberBrackets.has(token)) continue;
        if (token.value !== '[') continue;
        const matchIdx = lookupBracket(ctx.bracketMap, i);
        if (matchIdx === -1) continue;
        checkBracketAccessSpacing(ctx, results, i, matchIdx);
    }
}

// -------------------------------------------------------
// Violation reporting
// -------------------------------------------------------

function reportIndexSet(report, ctx, violation) {
    for (const idx of violation.indexSet) {
        const token = ctx.tokens[idx];
        report({
            loc: token.loc,
            messageId: violation.messageId,
            data: {
                token: token.value,
                count: String(ctx.threshold),
            },
            fix: (fixer) => violation.fixFn(fixer, token),
        });
    }
}

function reportViolations(report, ctx, results) {
    reportIndexSet(report, ctx, {
        indexSet: results.after,
        messageId: 'requireSpaceAfter',
        fixFn: (fixer, token) => fixer.insertTextAfter(token, ' '),
    });
    reportIndexSet(report, ctx, {
        indexSet: results.before,
        messageId: 'requireSpaceBefore',
        fixFn: (fixer, token) => fixer.insertTextBefore(token, ' '),
    });
}

// -------------------------------------------------------
// Rule export
// -------------------------------------------------------

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

        const metadata = {
            templateExprSpaced: new Set(),
            arrowInCallOuters: new Set(),
            computedMemberBrackets: new Set(),
            exemptBrackets: new Set(),
        };
        const exempt = metadata.exemptBrackets;

        return {
            [TEMPLATE_LIT](node) {
                for (const expr of node.expressions) {
                    const exprTokens = sourceCode.getTokens(expr);
                    const hasGrouping = exprTokens.some(
                        (t) => isGrouping(t)
                    );
                    if (!hasGrouping) continue;
                    const before = sourceCode.getTokenBefore(expr);
                    const after = sourceCode.getTokenAfter(expr);
                    if (before) {
                        metadata.templateExprSpaced.add(before);
                    }
                    if (after) {
                        metadata.templateExprSpaced.add(after);
                    }
                }
            },

            [CALL_EXPR](node) {
                for (const arg of node.arguments) {
                    const isWrappedArrow = arg.type === ARROW_FUNC
                        && arg.expression === true
                        && arg.body.type === CALL_EXPR;
                    if (!isWrappedArrow) continue;

                    const openParen = sourceCode.getTokenAfter(
                        node.callee, (t) => t.value === '('
                    );
                    const closeParen = sourceCode.getLastToken(node);
                    if (openParen) {
                        metadata.arrowInCallOuters.add(openParen);
                    }
                    if (closeParen && closeParen.value === ')') {
                        metadata.arrowInCallOuters.add(closeParen);
                    }
                }
            },

            [ARROW_FUNC](node) {
                if (node.body.type !== BLOCK_STMT) return;
                const openParen = sourceCode.getFirstToken(node);
                exemptBlockBodyBrackets(sourceCode, openParen, node, exempt);
            },

            [FUNC_EXPR](node) {
                const firstToken = sourceCode.getFirstToken(node);
                const isParen = (t) => t.value === '(';
                const openParen = sourceCode.getTokenAfter(firstToken, isParen);
                exemptBlockBodyBrackets(sourceCode, openParen, node, exempt);
            },

            [MEMBER_EXPR](node) {
                if (!node.computed) return;
                const prop = node.property;
                const open = sourceCode.getTokenBefore(prop);
                exemptIfMatch(
                    open, '[', metadata.computedMemberBrackets
                );
                const close = sourceCode.getTokenAfter(prop);
                exemptIfMatch(
                    close, ']', metadata.computedMemberBrackets
                );
            },

            'Program:exit'() {
                const tokens = sourceCode.getTokens(
                    sourceCode.ast, { includeComments: false }
                );
                const bracketMap = buildBracketMap(tokens);

                const ctx = {
                    sourceCode,
                    tokens,
                    threshold,
                    bracketMap,
                };
                const results = {
                    after: new Set(),
                    before: new Set(),
                };

                applyTemplateExprSpacing(ctx, results, metadata);
                applyArrowInCallSpacing(ctx, results, metadata);
                processMainClusters(ctx, results, metadata);
                applyBracketAccessSpacing(ctx, results, metadata);
                reportViolations(
                    context.report.bind(context), ctx, results
                );
            },
        };
    },
};
