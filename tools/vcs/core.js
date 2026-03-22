/**
 * Visual Complexity Spacing — Core Module
 *
 * Language-agnostic density analysis. Works on a generic token stream.
 * Each token has: { type, value, line, column, range }
 *
 * Token types:
 *   'groupOpen'     — ( [ {
 *   'groupClose'    — ) ] }
 *   'templateOpen'  — ${
 *   'templateClose' — } (closing a template expression)
 *   'identifier'    — variable/function names
 *   'punctuation'   — ; . , ! etc
 *   'operator'      — + - = => etc
 *   'arrow'         — =>
 *   'keyword'       — if, const, etc
 *   'literal'       — strings, numbers
 *   'templateStr'   — template literal string parts
 *   'other'         — anything else
 */

// Characters that count toward density when adjacent
const GROUPING_CHARS = new Set(['(', ')', '[', ']', '{', '}']);
const DENSE_TRAILING = new Set(['.', ';', '!']);

// All density characters = grouping + dense trailing
const DENSITY_CHARS = new Set([...GROUPING_CHARS, ...DENSE_TRAILING]);

const OPENERS = new Set(['(', '[', '{']);
const CLOSERS = new Set([')', ']', '}']);

const BRACKET_PAIRS = {
    '(': ')',
    '[': ']',
    '{': '}',
    ')': '(',
    ']': '[',
    '}': '{',
};

function isDensityToken(token) {
    if (!token) return false;
    return DENSITY_CHARS.has(token.value);
}

function isGroupingChar(token) {
    if (!token) return false;
    return GROUPING_CHARS.has(token.value);
}

/**
 * Check if two tokens are directly adjacent (no whitespace).
 */
function isAdjacent(tokenA, tokenB) {
    if (!tokenA || !tokenB) return false;
    return tokenA.range[1] === tokenB.range[0];
}

function hasSpaceBetween(tokenA, tokenB) {
    if (!tokenA || !tokenB) return true;
    return tokenA.range[1] < tokenB.range[0];
}

/**
 * Count the density run backward from a given index.
 * Only counts tokens that are ADJACENT (no whitespace between them).
 */
function countDensityRunBackward(tokens, startIdx) {
    let count = 0;
    let groupingCount = 0;
    let idx = startIdx;

    while (idx >= 0) {
        const token = tokens[idx];
        if (!isDensityToken(token)) break;
        if (count > 0 && !isAdjacent(token, tokens[idx + 1])) break;

        count++;
        if (isGroupingChar(token)) groupingCount++;
        idx--;
    }

    return { count, groupingCount, startIdx: idx + 1, endIdx: startIdx };
}

/**
 * Count the density run forward from a given index.
 * Only counts tokens that are ADJACENT.
 */
function countDensityRunForward(tokens, startIdx) {
    let count = 0;
    let groupingCount = 0;
    let idx = startIdx;

    while (idx < tokens.length) {
        const token = tokens[idx];
        if (!isDensityToken(token)) break;
        if (count > 0 && !isAdjacent(tokens[idx - 1], token)) break;

        count++;
        if (isGroupingChar(token)) groupingCount++;
        idx++;
    }

    return { count, groupingCount, startIdx, endIdx: idx - 1 };
}

function findMatchingBracket(tokens, bracketIdx) {
    const bracket = tokens[bracketIdx];
    const isOpener = OPENERS.has(bracket.value);
    const target = BRACKET_PAIRS[bracket.value];
    const direction = isOpener ? 1 : -1;

    let depth = 1;
    let idx = bracketIdx + direction;

    while (idx >= 0 && idx < tokens.length) {
        const t = tokens[idx];
        if (t.value === bracket.value) depth++;
        if (t.value === target) depth--;
        if (depth === 0) return idx;
        idx += direction;
    }

    return null;
}

function isContinuation(tokens, afterIdx) {
    if (afterIdx >= tokens.length) return false;
    const next = tokens[afterIdx];
    if (!next) return false;
    return next.value === '.' || next.value === '[' || next.value === '(';
}

function isTermination(tokens, runEndIdx) {
    if (tokens[runEndIdx] && tokens[runEndIdx].value === ';') return true;
    const afterIdx = runEndIdx + 1;
    if (afterIdx >= tokens.length) return true;
    if (tokens[afterIdx].value === ';') return true;
    return false;
}

/**
 * Get content info for suppression analysis.
 *
 * Looks at the INNER callee — the function/method name that creates
 * the nested call density inside the outer brackets. For:
 *   wrap(parse(data))      -> inner callee is "parse"
 *   wrap(pa.parse(data))   -> inner callee is "parse", obj "pa"
 *   callback(obj.method()) -> inner callee is "method", obj "obj"
 *
 * The inner callee determines readability because that's the text
 * between the outer brackets that the eye uses for anchoring.
 */
function getContentInfo(tokens, outerOpenIdx, outerCloseIdx) {
    const result = {
        calleeName: '',
        objectName: null,
        totalLength: 0,
    };

    // Find the innermost call expression inside the outer brackets.
    // Look for identifier followed by ( between the outer brackets.
    for (let i = outerOpenIdx + 1; i < outerCloseIdx; i++) {
        if (tokens[i].value === '(' && i > outerOpenIdx + 1) {
            const callee = tokens[i - 1];
            if (callee && callee.type === 'identifier') {
                result.calleeName = callee.value;

                // Check for member access: obj.method(
                if (i >= 3) {
                    const dot = tokens[i - 2];
                    const obj = tokens[i - 3];
                    if (dot && dot.value === '.'
                        && obj && obj.type === 'identifier') {
                        result.objectName = obj.value;
                    }
                }

                result.totalLength = result.objectName
                    ? result.objectName.length + 1
                        + result.calleeName.length
                    : result.calleeName.length;

                return result;
            }
        }
    }

    return result;
}

/**
 * Determine if content length suppresses spacing at a termination point.
 *
 * Thresholds from user testing:
 * - No object: callee name needs 5+ chars
 * - Short object (1-4 chars): method needs 5+ chars
 * - Long object (5+ chars): method needs 4+ chars
 */
function contentSuppresses(contentInfo) {
    const { calleeName, objectName } = contentInfo;
    if (!calleeName) return false;

    if (objectName) {
        if (objectName.length >= 5) {
            return calleeName.length >= 4;
        }
        return calleeName.length >= 5;
    }

    return calleeName.length >= 5;
}

function countGroupingInRun(runTokens) {
    return runTokens.filter(t => isGroupingChar(t)).length;
}

/**
 * Count arguments in a call expression (commas at depth 1).
 */
function countArgs(tokens, openIdx, closeIdx) {
    let depth = 0;
    let commas = 0;
    let hasContent = false;

    for (let i = openIdx + 1; i < closeIdx; i++) {
        const t = tokens[i];
        if (OPENERS.has(t.value)) depth++;
        else if (CLOSERS.has(t.value)) depth--;
        else if (t.value === ',' && depth === 0) commas++;
        if (depth === 0 && t.type !== 'whitespace') hasContent = true;
    }

    return hasContent ? commas + 1 : 0;
}

function checkArrowWithCall(tokens, openIdx, closeIdx) {
    for (let i = openIdx + 1; i < closeIdx; i++) {
        if (tokens[i].value === '=>') {
            for (let j = i + 1; j < closeIdx; j++) {
                if (tokens[j].value === '(') return true;
            }
        }
    }
    return false;
}

/**
 * Bracket access analysis.
 * For [], long content makes bracket matching hard -> space.
 * Short content -> easy match -> no space.
 *
 * Inner CALLS (parens) add density that prevents suppression.
 * Inner nested BRACKETS are just more bracket access and use
 * the same distance-based threshold.
 */
function checkBracketAccessSuppresses(tokens, openIdx, closeIdx) {
    const distance = tokens[closeIdx].range[0] - tokens[openIdx].range[1];

    // Check if content contains function calls (parens)
    let hasInnerCall = false;
    for (let i = openIdx + 1; i < closeIdx; i++) {
        if (tokens[i].value === '(' || tokens[i].value === ')') {
            hasInnerCall = true;
            break;
        }
    }

    if (hasInnerCall) {
        // Function calls inside brackets always add density
        // Don't suppress — let it be spaced
        return false;
    }

    // Plain bracket access (just nested brackets, identifiers)
    // Short distance = easy to match, suppress spacing
    if (distance < 12) return true;
    return false;
}

/**
 * Check if the bracket pair is empty (no tokens between opener/closer).
 */
function isEmptyPair(tokens, openIdx, closeIdx) {
    return closeIdx === openIdx + 1;
}

/**
 * Count the number of distinct closers in a run (not counting
 * closers that are part of empty pairs like `()`).
 *
 * `foo()` -> () has 1 closer but it's part of empty pair
 * `foo(bar())` -> )) has 2 closers, the inner ) is part of
 *   empty pair but the outer ) is not
 */
function countEffectiveClosers(tokens, runStart, runEnd) {
    let count = 0;
    for (let i = runStart; i <= runEnd; i++) {
        if (CLOSERS.has(tokens[i].value)) {
            // Check if this closer is part of an empty pair
            const matchIdx = findMatchingBracket(tokens, i);
            if (matchIdx !== null && !isEmptyPair(tokens, matchIdx, i)) {
                count++;
            }
        }
    }
    return count;
}

/**
 * Find the outermost closer in a closing density run.
 * The outermost closer wraps the most content (LAST closer in run).
 */
function findOutermostCloser(tokens, startIdx, endIdx) {
    let lastCloserIdx = null;
    for (let i = endIdx; i >= startIdx; i--) {
        if (CLOSERS.has(tokens[i].value)) {
            lastCloserIdx = i;
            break;
        }
    }
    return lastCloserIdx;
}

/**
 * Main analysis: find locations where spacing should be added.
 *
 * Two-pass approach:
 * 1. Template literal rule (independent)
 * 2. Density analysis on closing runs
 */
function analyze(tokens, metadata = {}) {
    const edits = [];
    const processed = new Set();

    // === Pass 1: Template literal spacing ===
    for (let i = 0; i < tokens.length; i++) {
        if (tokens[i].type === 'templateOpen') {
            handleTemplate(tokens, i, edits);
        }
    }

    // === Pass 2: Density analysis ===
    // We iterate left-to-right and trigger on closing grouping chars.
    // For each closer, we build the density run and check if it meets
    // the threshold.
    for (let i = 0; i < tokens.length; i++) {
        const token = tokens[i];
        if (!CLOSERS.has(token.value)) continue;

        // Build the full density run centered on this closer.
        // Scan backward and forward for adjacent density chars.
        const backRun = countDensityRunBackward(tokens, i);
        const fwdRun = countDensityRunForward(tokens, i);

        // Full run spans from backRun.startIdx to fwdRun.endIdx
        const runStart = backRun.startIdx;
        const runEnd = fwdRun.endIdx;
        const totalCount = runEnd - runStart + 1;

        if (totalCount < 3) continue;

        // Find the outermost closer
        const outermostCloserIdx = findOutermostCloser(
            tokens, runStart, runEnd,
        );
        if (outermostCloserIdx === null) continue;

        // Find its matching opener
        const matchIdx = findMatchingBracket(tokens, outermostCloserIdx);
        if (matchIdx === null) continue;

        const openIdx = matchIdx;
        const closeIdx = outermostCloserIdx;
        const pairKey = `${openIdx}-${closeIdx}`;
        if (processed.has(pairKey)) continue;
        processed.add(pairKey);

        // Skip empty bracket pairs — foo() is never dense
        if (isEmptyPair(tokens, openIdx, closeIdx)) continue;

        // Count effective closers (excluding empty-pair closers)
        // If all closers in the run are from empty pairs, no density
        const effectiveClosers = countEffectiveClosers(
            tokens, runStart, runEnd,
        );

        // Count closers in the run (for suppression decisions)
        let closerCount = 0;
        for (let j = runStart; j <= runEnd; j++) {
            if (CLOSERS.has(tokens[j].value)) closerCount++;
        }

        // Check continuation vs termination
        const continuation = isContinuation(tokens, runEnd + 1);
        const termination = isTermination(tokens, runEnd);

        // Arrow-in-call detection
        const hasArrow = checkArrowWithCall(tokens, openIdx, closeIdx);

        // === Suppression rules ===
        let suppressed = false;

        // Bracket access: for [], short content suppresses (opposite
        // of function calls)
        if (tokens[openIdx].value === '[') {
            suppressed = checkBracketAccessSuppresses(
                tokens, openIdx, closeIdx,
            );
            if (suppressed) continue;
        }

        // Content suppression (only for call expressions at termination)
        const isCallExpr = tokens[openIdx].value === '(';
        if (isCallExpr && !continuation && termination && !hasArrow) {
            // Multi-argument suppression: 2+ args absorb trailing char
            // contribution, but NOT 3+ actual grouping char stacks
            const argCount = countArgs(tokens, openIdx, closeIdx);
            if (argCount >= 2 && closerCount < 3) {
                suppressed = true;
            }

            // Content-length suppression: long callee name suppresses
            // at termination points (no groupingCount guard — content
            // can suppress even with 3 grouping chars)
            if (!suppressed) {
                const contentInfo = getContentInfo(
                        tokens, openIdx, closeIdx,
                    );
                if (contentSuppresses(contentInfo)) {
                    suppressed = true;
                }
            }
        }

        if (suppressed) continue;

        // === Add spacing ===
        const singleLine = tokens[openIdx].line === tokens[closeIdx].line;
        addSpacing(tokens, openIdx, closeIdx, singleLine, edits);
    }

    return edits;
}

/**
 * Handle template literal spacing.
 * ${ } gets spaced when content contains any grouping chars.
 */
function handleTemplate(tokens, openIdx, edits) {
    const closeIdx = findTemplateClose(tokens, openIdx);
    if (closeIdx === null) return;

    let hasGrouping = false;
    for (let i = openIdx + 1; i < closeIdx; i++) {
        if (isGroupingChar(tokens[i])) {
            hasGrouping = true;
            break;
        }
    }

    if (!hasGrouping) return;

    if (openIdx + 1 < tokens.length
        && !hasSpaceBetween(tokens[openIdx], tokens[openIdx + 1])) {
        edits.push({
            type: 'add',
            position: tokens[openIdx].range[1],
            side: 'after',
            token: tokens[openIdx],
        });
    }

    if (closeIdx - 1 >= 0
        && !hasSpaceBetween(tokens[closeIdx - 1], tokens[closeIdx])) {
        edits.push({
            type: 'add',
            position: tokens[closeIdx].range[0],
            side: 'before',
            token: tokens[closeIdx],
        });
    }
}

function findTemplateClose(tokens, openIdx) {
    let depth = 1;
    for (let i = openIdx + 1; i < tokens.length; i++) {
        if (tokens[i].type === 'templateOpen') depth++;
        if (tokens[i].type === 'templateClose') {
            depth--;
            if (depth === 0) return i;
        }
    }
    return null;
}

/**
 * Add spacing edits for a bracket pair.
 */
function addSpacing(tokens, openIdx, closeIdx, singleLine, edits) {
    const afterOpen = tokens[openIdx + 1];
    if (afterOpen && !hasSpaceBetween(tokens[openIdx], afterOpen)) {
        edits.push({
            type: 'add',
            position: tokens[openIdx].range[1],
            side: 'after',
            token: tokens[openIdx],
        });
    }

    const beforeClose = tokens[closeIdx - 1];
    if (beforeClose && !hasSpaceBetween(beforeClose, tokens[closeIdx])) {
        edits.push({
            type: 'add',
            position: tokens[closeIdx].range[0],
            side: 'before',
            token: tokens[closeIdx],
        });
    }
}

/**
 * Apply edits to the original source text.
 */
function applyEdits(source, edits) {
    if (edits.length === 0) return source;

    // Deduplicate edits at the same position
    const seen = new Set();
    const unique = [];
    for (const edit of edits) {
        const key = `${edit.type}-${edit.position}-${edit.side}`;
        if (!seen.has(key)) {
            seen.add(key);
            unique.push(edit);
        }
    }

    // Sort by position in reverse order
    const sorted = unique.sort((a, b) => b.position - a.position);

    let result = source;
    for (const edit of sorted) {
        if (edit.type === 'add') {
            result = result.slice(0, edit.position) + ' '
                + result.slice(edit.position);
        }
    }

    return result;
}

export {
    analyze,
    applyEdits,
    countDensityRunBackward,
    countDensityRunForward,
    findMatchingBracket,
    hasSpaceBetween,
    isAdjacent,
    isDensityToken,
    isGroupingChar,
    isContinuation,
    isTermination,
    getContentInfo,
    contentSuppresses,
    countGroupingInRun,
    countArgs,
    GROUPING_CHARS,
    DENSE_TRAILING,
    DENSITY_CHARS,
    OPENERS,
    CLOSERS,
    BRACKET_PAIRS,
};
