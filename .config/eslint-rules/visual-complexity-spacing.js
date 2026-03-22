// eslint-disable-next-line @stylistic/max-len
import { contentSuppressesSpacing } from './visual-complexity-spacing/anchoring.js';
// eslint-disable-next-line @stylistic/max-len
import { buildBracketMap, lookupBracket } from './visual-complexity-spacing/bracket-map.js';
import {
    adjacentCluster,
    clusterComposition,
    countClosingInCluster,
    findLastClosingIdx,
    hasTopLevelComma,
    markProcessed,
    nonExemptClusterCount,
} from './visual-complexity-spacing/cluster.js';
import {
    ARROW_FUNC,
    BLOCK_STMT,
    CALL_EXPR,
    FUNC_EXPR,
    IDENTIFIER,
    MEMBER_EXPR,
    MIN_BRACKET_CONTENT_FOR_SPACING,
    MIN_BRACKET_INNER_LEN,
    MIN_BRACKET_OUTER_LEN,
    TEMPLATE_LIT,
} from './visual-complexity-spacing/constants.js';
// eslint-disable-next-line @stylistic/max-len
import { findEnclosingContainer } from './visual-complexity-spacing/container.js';
import {
    areAdjacent,
    hasSpaceAfter,
    hasSpaceBefore,
    isClosing,
    isDenseTrailing,
    isGrouping,
    isOpening,
} from './visual-complexity-spacing/tokens.js';

// -------------------------------------------------------
// TokenContext — owns the token stream, bracket map, and
// accumulated spacing edits for a single Program pass
// -------------------------------------------------------

class TokenContext {
    constructor(sourceCode, threshold) {
        this.sourceCode = sourceCode;
        this.threshold = threshold;
        this.tokens = sourceCode.getTokens(
            sourceCode.ast, { includeComments: false }
        );
        this.bracketMap = buildBracketMap(this.tokens);
        this.spaceAfter = new Set();
        this.spaceBefore = new Set();
    }

    addSpaceAfter(idx) {
        if (!hasSpaceAfter(this.sourceCode, this.tokens[idx])) {
            this.spaceAfter.add(idx);
        }
    }

    addSpaceBefore(idx) {
        if (!hasSpaceBefore(this.sourceCode, this.tokens[idx])) {
            this.spaceBefore.add(idx);
        }
    }

    contentLength(openIdx, closeIdx) {
        return this.tokens[closeIdx].range[0]
            - this.tokens[openIdx].range[1];
    }
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

// Dense trailing (.) after a closing bracket means
// the expression chains onward: getResult().prop
function trailingContinues(tokens, cluster) {
    const trailing = tokens[cluster.endIdx];
    return trailing.value === '.';
}

// The token after the cluster starts a new access/call:
// wrap(x)[0], wrap(x).y, wrap(x)(args)
function adjacentTokenContinues(tokens, cluster, afterCluster) {
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

function isContinuation(tokens, cluster, hasDenseTrailing, afterCluster) {
    if (hasDenseTrailing) {
        return trailingContinues(tokens, cluster);
    }
    return adjacentTokenContinues(tokens, cluster, afterCluster);
}

function isTokenOnSameLine(left, right) {
    return left.loc.end.line === right.loc.start.line;
}

// -------------------------------------------------------
// Spacing application
// -------------------------------------------------------

function applyClusterSpacing(ctx, cluster, container) {
    const openToken = ctx.tokens[container.openIdx];
    const closeToken = ctx.tokens[container.closeIdx];
    const sameLine = isTokenOnSameLine(openToken, closeToken);
    const { hasOpening, hasClosing } = clusterComposition(
        ctx.tokens, cluster
    );

    if (hasClosing) {
        ctx.addSpaceBefore(container.closeIdx);
    }
    if (hasOpening) {
        ctx.addSpaceAfter(container.openIdx);
    }

    if (!sameLine) return;

    if (hasClosing && !hasOpening) {
        ctx.addSpaceAfter(container.openIdx);
    }
    if (hasOpening && !hasClosing) {
        ctx.addSpaceBefore(container.closeIdx);
    }
}

// -------------------------------------------------------
// Suppression policy
// -------------------------------------------------------

// Suppression only applies when the cluster is a terminated
// statement (not a continuation) with dense trailing, and
// the close-brackets alone don't meet the threshold.
// When those preconditions hold, commas or long content
// provide enough visual separation to skip extra spaces.
function shouldSuppressSpacing(ctx, classification, container) {
    if (classification.continues) return false;
    if (!classification.hasDenseTrailing) return false;

    const closingCount = countClosingInCluster(
        ctx.tokens, classification.cluster
    );
    if (closingCount >= ctx.threshold) return false;

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

function checkBracketAccessSpacing(ctx, i, matchIdx) {
    if (!containsNestedBrackets(ctx.tokens, i, matchIdx)) return;
    if (outerNameAnchors(ctx.tokens, i)) return;
    if (innerNameAnchors(ctx.tokens, i, matchIdx)) return;

    if (ctx.contentLength(i, matchIdx) >= MIN_BRACKET_CONTENT_FOR_SPACING) {
        ctx.addSpaceAfter(i);
        ctx.addSpaceBefore(matchIdx);
    }
}

// -------------------------------------------------------
// Cluster processing helpers
// -------------------------------------------------------

function tokenAfterCluster(tokens, cluster) {
    const nextIdx = cluster.endIdx + 1;
    return nextIdx < tokens.length ? tokens[nextIdx] : null;
}

function endsWithTrailingAfterClose(tokens, cluster) {
    const lastGroupingIdx = findLastClosingIdx(tokens, cluster);
    return cluster.endIdx !== lastGroupingIdx
        && lastGroupingIdx !== -1
        && isDenseTrailing( tokens[cluster.endIdx] );
}

// -------------------------------------------------------
// Main cluster detection loop
// -------------------------------------------------------

function classifyCluster(ctx, cluster) {
    const hasDenseTrailing = endsWithTrailingAfterClose(
        ctx.tokens, cluster
    );
    const afterCluster = tokenAfterCluster(ctx.tokens, cluster);
    const continues = isContinuation(
        ctx.tokens, cluster, hasDenseTrailing, afterCluster
    );
    return { cluster, hasDenseTrailing, continues };
}

function containerIsEmpty(container) {
    return container.closeIdx === container.openIdx + 1;
}

function processCluster(ctx, cluster) {
    const classification = classifyCluster(ctx, cluster);
    const container = findEnclosingContainer(ctx, cluster);
    if (!container) return;
    if (containerIsEmpty(container)) return;

    if (shouldSuppressSpacing(ctx, classification, container)) return;

    applyClusterSpacing(ctx, cluster, container);
}

function processMainClusters(ctx, astMarkers) {
    const processed = new Set();

    for (let i = 0; i < ctx.tokens.length; i++) {
        if (processed.has(i)) continue;
        if (!isGrouping( ctx.tokens[i] )) continue;

        const cluster = adjacentCluster(ctx.tokens, i);
        markProcessed(processed, cluster);

        const effectiveCount = nonExemptClusterCount(
            ctx.tokens, cluster, astMarkers.exemptBrackets
        );
        if (effectiveCount < ctx.threshold) continue;

        processCluster(ctx, cluster);
    }
}

// -------------------------------------------------------
// Template and arrow sub-rules
// -------------------------------------------------------

function applyTemplateExprSpacing(ctx, astMarkers) {
    for (let i = 0; i < ctx.tokens.length; i++) {
        const token = ctx.tokens[i];
        if (!astMarkers.templateExprSpaced.has(token)) continue;
        if (isOpening(token)) {
            ctx.addSpaceAfter(i);
        }
        if (isClosing(token)) {
            ctx.addSpaceBefore(i);
        }
    }
}

function applyArrowInCallSpacing(ctx, astMarkers) {
    for (let i = 0; i < ctx.tokens.length; i++) {
        const token = ctx.tokens[i];
        if (!astMarkers.arrowInCallOuters.has(token)) continue;
        if (token.value === '(') {
            ctx.addSpaceAfter(i);
        }
        if (token.value === ')') {
            ctx.addSpaceBefore(i);
        }
    }
}

function applyBracketAccessSpacing(ctx, astMarkers) {
    for (let i = 0; i < ctx.tokens.length; i++) {
        const token = ctx.tokens[i];
        if (!astMarkers.computedMemberBrackets.has(token)) continue;
        if (token.value !== '[') continue;
        const matchIdx = lookupBracket(ctx.bracketMap, i);
        if (matchIdx === -1) continue;
        checkBracketAccessSpacing(ctx, i, matchIdx);
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

function reportViolations(report, ctx) {
    reportIndexSet(report, ctx, {
        indexSet: ctx.spaceAfter,
        messageId: 'requireSpaceAfter',
        fixFn: (fixer, token) => fixer.insertTextAfter(token, ' '),
    });
    reportIndexSet(report, ctx, {
        indexSet: ctx.spaceBefore,
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
        const threshold = options.threshold ?? 3;

        const astMarkers = {
            templateExprSpaced: new Set(),
            arrowInCallOuters: new Set(),
            computedMemberBrackets: new Set(),
            exemptBrackets: new Set(),
        };
        const exempt = astMarkers.exemptBrackets;

        return {
            [TEMPLATE_LIT](node) {
                for (const expr of node.expressions) {
                    const exprTokens = sourceCode.getTokens(expr);
                    const hasGroupingChar = exprTokens.some(
                        (t) => isGrouping(t)
                    );
                    if (!hasGroupingChar) continue;
                    const before = sourceCode.getTokenBefore(expr);
                    const after = sourceCode.getTokenAfter(expr);
                    if (before) {
                        astMarkers.templateExprSpaced.add(before);
                    }
                    if (after) {
                        astMarkers.templateExprSpaced.add(after);
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
                        astMarkers.arrowInCallOuters.add(openParen);
                    }
                    if (closeParen && closeParen.value === ')') {
                        astMarkers.arrowInCallOuters.add(closeParen);
                    }
                }
            },

            [ARROW_FUNC](node) {
                if (node.body.type !== BLOCK_STMT) return;
                const openParen = sourceCode.getFirstToken(node);
                exemptBlockBodyBrackets(
                    sourceCode, openParen, node, exempt
                );
            },

            [FUNC_EXPR](node) {
                const firstToken = sourceCode.getFirstToken(node);
                const isParen = (t) => t.value === '(';
                const openParen = sourceCode.getTokenAfter(
                    firstToken, isParen
                );
                exemptBlockBodyBrackets(
                    sourceCode, openParen, node, exempt
                );
            },

            [MEMBER_EXPR](node) {
                if (!node.computed) return;
                const prop = node.property;
                const open = sourceCode.getTokenBefore(prop);
                exemptIfMatch(
                    open, '[', astMarkers.computedMemberBrackets
                );
                const close = sourceCode.getTokenAfter(prop);
                exemptIfMatch(
                    close, ']', astMarkers.computedMemberBrackets
                );
            },

            'Program:exit'() {
                const ctx = new TokenContext(sourceCode, threshold);

                applyTemplateExprSpacing(ctx, astMarkers);
                applyArrowInCallSpacing(ctx, astMarkers);
                processMainClusters(ctx, astMarkers);
                applyBracketAccessSpacing(ctx, astMarkers);
                reportViolations(
                    context.report.bind(context), ctx
                );
            },
        };
    },
};
