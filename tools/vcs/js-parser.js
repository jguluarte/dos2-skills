/**
 * JavaScript Parser Adapter for VCS
 *
 * Converts espree tokens into the generic token stream
 * used by the core density analyzer.
 *
 * Espree template literal tokenization:
 *   `${expr}`  =>  Template("`${")  ...expr tokens...  Template("}`")
 *   `text${expr}more`  =>  Template("`text${")  ...expr...  Template("}more`")
 *   `no expr`  =>  Template("`no expr`")
 *
 * We split Template tokens that contain ${ or } boundaries into
 * separate templateStr / templateOpen / templateClose tokens.
 */

import * as espree from 'espree';
import { OPENERS, CLOSERS } from './core.js';

/**
 * Map espree token types to our generic types.
 */
function mapTokenType(espreeToken) {
    const { type, value } = espreeToken;

    switch (type) {
        case 'Punctuator':
            if (OPENERS.has(value)) return 'groupOpen';
            if (CLOSERS.has(value)) return 'groupClose';
            if (value === '=>') return 'arrow';
            return 'punctuation';

        case 'Identifier':
            return 'identifier';

        case 'Keyword':
            return 'keyword';

        case 'Numeric':
        case 'String':
        case 'Boolean':
        case 'Null':
        case 'RegularExpression':
            return 'literal';

        case 'Template':
            return 'templateStr';

        default:
            return 'other';
    }
}

/**
 * Parse JavaScript source and return a normalized token stream.
 *
 * @param {string} source - JavaScript source code
 * @returns {{ tokens: Array, metadata: Object }}
 */
function parseJS(source) {
    const ast = espree.parse(source, {
        ecmaVersion: 'latest',
        sourceType: 'module',
        loc: true,
        range: true,
        tokens: true,
        comment: true,
    });

    // Collect template expression ranges from the AST
    const templateExprRanges = [];
    walkAST(ast, (node) => {
        if (node.type === 'TemplateLiteral') {
            for (const expr of node.expressions) {
                templateExprRanges.push({
                    // ${ is 2 chars before the expression start
                    dollarPos: expr.range[0] - 2,
                    braceOpenPos: expr.range[0] - 1,
                    exprStart: expr.range[0],
                    exprEnd: expr.range[1],
                    braceClosePos: expr.range[1],
                });
            }
        }
    });

    // Sort by position
    templateExprRanges.sort((a, b) => a.dollarPos - b.dollarPos);

    const tokens = [];

    for (const t of ast.tokens) {
        if (t.type === 'Template') {
            splitTemplateToken(t, source, templateExprRanges, tokens);
        } else {
            tokens.push(makeToken(t));
        }
    }

    // Sort by position (should already be sorted, but be safe)
    tokens.sort((a, b) => a.range[0] - b.range[0]);

    const metadata = { templateExprRanges };
    return { tokens, metadata };
}

/**
 * Split a Template token into sub-tokens when it contains ${ or }
 * boundaries from template expressions.
 */
function splitTemplateToken(t, source, templateExprRanges, tokens) {
    const val = t.value;
    const start = t.range[0];
    const end = t.range[1];

    // Check if this Template token ends with ${ (opens an expression)
    // Pattern: `...${  or  }...${
    const endsWithDollarBrace = val.endsWith('${');

    // Check if this Template token starts with } (closes an expression)
    const startsWithBrace = val.startsWith('}');

    if (!endsWithDollarBrace && !startsWithBrace) {
        // Plain template string (no expressions), e.g., `hello`
        tokens.push({
            type: 'templateStr',
            value: val,
            line: t.loc.start.line,
            column: t.loc.start.column,
            range: [start, end],
        });
        return;
    }

    let pos = start;
    const line = t.loc.start.line;

    // If starts with }, emit templateClose
    if (startsWithBrace) {
        tokens.push({
            type: 'templateClose',
            value: '}',
            line,
            column: pos - lineStart(source, line),
            range: [pos, pos + 1],
        });
        pos += 1;
    }

    // Middle part (between } and ${ or just template text)
    const middleEnd = endsWithDollarBrace ? end - 2 : end;
    if (pos < middleEnd) {
        tokens.push({
            type: 'templateStr',
            value: source.slice(pos, middleEnd),
            line,
            column: pos - lineStart(source, line),
            range: [pos, middleEnd],
        });
        pos = middleEnd;
    }

    // If ends with ${, emit templateOpen
    if (endsWithDollarBrace) {
        tokens.push({
            type: 'templateOpen',
            value: '${',
            line,
            column: pos - lineStart(source, line),
            range: [pos, pos + 2],
        });
    }
}

/**
 * Get the character offset of the start of a given line number (1-based).
 */
function lineStart(source, lineNum) {
    let line = 1;
    for (let i = 0; i < source.length; i++) {
        if (line === lineNum) return i;
        if (source[i] === '\n') line++;
    }
    return 0;
}

/**
 * Convert an espree token to our format.
 */
function makeToken(t) {
    return {
        type: mapTokenType(t),
        value: t.value,
        line: t.loc.start.line,
        column: t.loc.start.column,
        range: [...t.range],
    };
}

/**
 * Simple AST walker.
 */
function walkAST(node, visitor) {
    if (!node || typeof node !== 'object') return;

    if (node.type) {
        visitor(node);
    }

    for (const key of Object.keys(node)) {
        if (key === 'parent') continue;
        const child = node[key];
        if (Array.isArray(child)) {
            for (const item of child) {
                walkAST(item, visitor);
            }
        } else if (child && typeof child === 'object' && child.type) {
            walkAST(child, visitor);
        }
    }
}

export { parseJS, mapTokenType, walkAST };
