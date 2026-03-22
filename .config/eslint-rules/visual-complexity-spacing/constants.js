// Character sets for grouping and dense trailing
export const OPENING = new Set(['(', '[', '{']);
export const CLOSING = new Set([')', ']', '}']);
export const DENSE_TRAILING = new Set([';', '.', '!']);

// AST node type constants
export const ARROW_FUNC = 'ArrowFunctionExpression';
export const BLOCK_STMT = 'BlockStatement';
export const CALL_EXPR = 'CallExpression';
export const FUNC_EXPR = 'FunctionExpression';
export const IDENTIFIER = 'Identifier';
export const MEMBER_EXPR = 'MemberExpression';
export const PUNCTUATOR = 'Punctuator';
export const TEMPLATE = 'Template';
export const TEMPLATE_LIT = 'TemplateLiteral';

// Visual anchoring thresholds — named so the design
// decisions are grep-able, not buried in comparisons

// obj.meth() — 4-char method suffices when the object name
// is already long enough to anchor the eye (5+ chars gives
// 9+ chars of context before the paren)
export const MIN_METHOD_LEN_WITH_LONG_OBJ = 4;

// parse() alone — 5+ chars gives the eye a word to land on,
// shorter names like fn() or go() look like noise in a pile
export const MIN_METHOD_LEN_STANDALONE = 5;

// items.find() — the object name counts as context only when
// it's a real word (5+ chars), not a 1-2 char abbreviation
export const MIN_OBJ_LEN_FOR_ANCHORING = 5;

// Inner callee inside wrap(longName(x)) — 8+ chars is
// unmistakable as a word boundary even inside nested parens
export const MIN_CALLEE_LEN_FOR_SUPPRESSION = 8;

// Total character width between brackets — at 15+ chars the
// content itself provides enough visual separation.
// Note: bracket access uses a separate constant
// (MIN_BRACKET_CONTENT_FOR_SPACING) because the semantics
// are inverted — long content there ADDS spacing.
export const MIN_CONTENT_LEN_FOR_SUPPRESSION = 15;

// Content-length threshold for bracket access: when inner content
// between nested brackets exceeds this, spacing is ADDED to help
// the eye match the brackets over distance. This is the inverse
// of call-expression suppression where long content SKIPS spacing.
export const MIN_BRACKET_CONTENT_FOR_SPACING = 15;

// Bracket access obj[arr[idx]] — 10+ char outer/inner names
// anchor the eye so nested brackets don't need extra spacing
export const MIN_BRACKET_OUTER_LEN = 10;
export const MIN_BRACKET_INNER_LEN = 10;

// How close an inner callee's closing paren must be to the
// outer close — at most 2 tokens away (e.g., `))`  or `);`)
// so we only check callees that actually contribute to the
// visual pile-up at the close boundary
export const INNER_CALLEE_PROXIMITY = 2;

// ${expr} counts as 2 grouping chars because it contributes
// both an opening `${` and a closing `}` to visual density
export const TEMPLATE_EXPR_WEIGHT = 2;

// Bracket matching constants
export const BRACKET_PAIRS = { ')': '(', ']': '[', '}': '{' };
export const TEMPLATE_BRACKET = '${';
