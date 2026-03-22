/**
 * Tests for the visual-complexity-spacing ESLint rule.
 *
 * This rule adds spaces inside the outermost bracket when
 * 3+ grouping characters (parens, brackets, braces, plus
 * ; . !) pile up without whitespace.
 *
 * Example: foo([[bar]]) becomes foo( [[bar]] ).
 *
 * It accounts for chained access, template literals, arrow
 * functions, function name length, and argument count to
 * decide when spacing is needed vs when the code is already
 * readable without it.
 *
 * P6 is handled implicitly through callee-length suppression;
 * no separate short-content check exists.
 *
 * Principle 14 (operator-adjacent spacing) is intentionally out
 * of scope — it belongs in a separate companion rule.
 *
 * Glossary:
 * - pile-up: 3+ grouping characters (parens, brackets, braces, or dense
 *   trailing chars like ; . !) adjacent without whitespace. E.g., )), ]], }).
 * - anchoring: when a long identifier name (5+ chars for methods, 8+ for
 *   standalone callees) provides enough visual separation that spacing
 *   becomes optional at statement end.
 * - skips vs fixes: "skips" = the rule does not add spaces (valid case).
 *   "fixes" = the rule inserts spaces (invalid case, autofix applied).
 */

import { RuleTester } from 'eslint';
import { describe, it } from 'vitest';
import rule from
    '../../.config/eslint-rules/visual-complexity-spacing.js';

/*
 * Principle mapping (see FORMATTING-PHILOSOPHY.md):
 *   P1     -> brackets that pile up: setState([[initialRow]])
 *   P2     -> semicolons and trailing punctuation
 *   P3     -> chained .method() or [index] after nested calls
 *   P4     -> long names make spacing optional at statement end
 *   P5     -> empty call inside other brackets: callbacks[getName()]
 *   P7     -> completing partially-spaced brackets
 *   P8     -> nested bracket access: obj[arr[index]]
 *   P9     -> template literal ${} expressions
 *   P10/11 -> multi-line expressions
 *   P12    -> concise arrow inside calls: items.map(x => parse(x))
 *   P13    -> commas provide visual separation in multi-arg calls
 *   P6     -> (implicit, see header note)
 *   P14    -> (separate companion rule, not implemented here)
 */

const RULE = 'visual-complexity-spacing';

const ruleTester = new RuleTester({
    languageOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
    },
});

function validOnly(...cases) {
    return { valid: cases, invalid: [] };
}

function invalidOnly(...cases) {
    return { valid: [], invalid: cases };
}

/**
 * Build an invalid test case expecting autofix.
 *
 * Default errors = 2 because most fixes insert a space on
 * both the open side and the close side — each is reported
 * as a separate violation.
 */
function expectFix(code, output, errors = 2) {
    return { code, output, errors };
}

describe('visual-complexity-spacing', () => {

    describe('P1: brackets that pile up: setState([[initialRow]])', () => {

        it('skips 2 brackets: foo([bar])', () => {
            const cases = [
                'foo([bar])',
                'foo({bar: 1})',
                'arr.push([1, 2])',
            ];
            ruleTester.run(RULE, rule, validOnly(...cases));
        });

        it('fixes 3+ adjacent brackets: setState([[initialRow]])', () => {
            const code = 'setState([[initialRow]])';
            const output = 'setState( [[initialRow]] )';
            ruleTester.run(RULE, rule, invalidOnly(expectFix(code, output)));
        });

        it('fixes mixed bracket types: db.insert([{name: val}])', () => {
            const code = 'db.insert([{name: val}])';
            const output = 'db.insert( [{name: val}] )';
            ruleTester.run(RULE, rule, invalidOnly(expectFix(code, output)));
        });

        it('fixes triple-nested empty calls: run(init(setup()))', () => {
            const code = 'run(init(setup()))';
            const output = 'run( init(setup()) )';
            ruleTester.run(RULE, rule, invalidOnly(expectFix(code, output)));
        });

        it('fixes ({ pile-up at argument start', () => {
            const code = 'setup({key: fn()}, x)';
            const output = 'setup( {key: fn()}, x )';
            ruleTester.run(RULE, rule, invalidOnly(expectFix(code, output)));
        });

        it('fixes log(pad(trim()), suffix) multi-arg pile-up', () => {
            const code = "log(pad(trim()), 'left')";
            const output = "log( pad(trim()), 'left' )";
            ruleTester.run(
                RULE, rule, invalidOnly(expectFix(code, output))
            );
        });

        it('skips already-spaced expressions', () => {
            const cases = [
                'setState( [[initialRow]] )',
                'db.insert( [{name: val}] )',
                'run( init(setup()) )',
                'parseInt( getValue() )',
            ];
            ruleTester.run(RULE, rule, validOnly(...cases));
        });

        it('fixes 3+ adjacent via new + nested: new Set(new Map([]))', () => {
            const code = 'new Set(new Map([]))';
            const output = 'new Set( new Map([]) )';
            ruleTester.run(RULE, rule, invalidOnly(expectFix(code, output)));
        });

        it('fixes spread arg adds to pile-up: foo(...bar(baz()))', () => {
            const code = 'foo(...bar(baz()))';
            const output = 'foo( ...bar(baz()) )';
            ruleTester.run(RULE, rule, invalidOnly(expectFix(code, output)));
        });

        it('fixes 4-deep nesting: app.use(cors(config(defaults())))', () => {
            const code = 'app.use(cors(config(defaults())))';
            const output = 'app.use( cors(config(defaults())) )';
            ruleTester.run(RULE, rule, invalidOnly(expectFix(code, output)));
        });

        it('fixes empty literal arg: Object.keys({})', () => {
            ruleTester.run(RULE, rule, invalidOnly(
                expectFix('Object.keys({})', 'Object.keys( {} )')
            ));
        });

        it('fixes empty literal arg: Array.from([])', () => {
            ruleTester.run(RULE, rule, invalidOnly(
                expectFix('Array.from([])', 'Array.from( [] )')
            ));
        });

        it('fixes nested call arg: parseInt(getValue())', () => {
            const code = 'parseInt(getValue())';
            const output = 'parseInt( getValue() )';
            ruleTester.run(RULE, rule, invalidOnly(expectFix(code, output)));
        });

        it('fixes array of calls: Promise.all([fetch(a), fetch(b)])', () => {
            const code = 'Promise.all([fetch(a), fetch(b)])';
            const output = 'Promise.all( [fetch(a), fetch(b)] )';
            ruleTester.run(
                RULE, rule, invalidOnly(expectFix(code, output))
            );
        });
    });

    describe('P7: completing partially-spaced brackets', () => {

        it('fixes half-spaced open only: foo( [[bar]])', () => {
            ruleTester.run(RULE, rule, invalidOnly(
                expectFix('foo( [[bar]])', 'foo( [[bar]] )', 1)
            ));
        });

        it('fixes half-spaced close only: foo([[bar]] )', () => {
            ruleTester.run(RULE, rule, invalidOnly(
                expectFix('foo([[bar]] )', 'foo( [[bar]] )', 1)
            ));
        });
    });

    describe('P10/P11: multi-line expressions', () => {

        it('skips newlines break pile-up: foo(\\n    bar()\\n)', () => {
            ruleTester.run(
                RULE, rule, validOnly('foo(\n    bar()\n);')
            );
        });

        it('fixes close-side only when open is on prior line', () => {
            ruleTester.run(RULE, rule, invalidOnly(
                expectFix('foo(\n    bar())', 'foo(\n    bar() )', 1)
            ));
        });

        it('skips block body provides structure: () => {...}', () => {
            const code =
                'setTimeout(() => {\n    doStuff();\n});';
            ruleTester.run(RULE, rule, validOnly(code));
        });
    });

    describe('P11: block braces provide visual separation', () => {
        // Block bodies ({}) give the eye enough structure that
        // adjacent brackets don't need spacing. Tests for this
        // behavior also appear in P10 (multi-line) and P12 (arrows).

        it('skips block body arrow: foo(() => { bar() })', () => {
            ruleTester.run(
                RULE, rule, validOnly('foo(() => { bar() })')
            );
        });

        it('skips block body function expression', () => {
            const code = 'foo(function(){ bar(); });';
            ruleTester.run(RULE, rule, validOnly(code));
        });

        it('skips named function expression', () => {
            const code =
                'foo(function handler(){ bar(); });';
            ruleTester.run(RULE, rule, validOnly(code));
        });
    });

    describe('P9: template literal ${} expressions', () => {

        it('skips ${} simple interpolation: no grouping chars inside', () => {
            ruleTester.run(
                RULE, rule, validOnly('`${name}`', '`${obj.name}`')
            );
        });

        it('fixes ${} call parens pile with }: ${getName()}', () => {
            ruleTester.run(RULE, rule, invalidOnly(
                expectFix('`${getName()}`', '`${ getName() }`')
            ));
        });

        it('fixes ${} bracket access piles with }: ${items[0]}', () => {
            ruleTester.run(RULE, rule, invalidOnly(
                expectFix('`${items[0]}`', '`${ items[0] }`')
            ));
        });

        it('fixes ${} method call piles with }: ${obj().name}', () => {
            ruleTester.run(RULE, rule, invalidOnly(
                expectFix('`${obj().name}`', '`${ obj().name }`')
            ));
        });

        it('fixes each ${} independently in one literal', () => {
            const code = '`${fn()} and ${bar()}`';
            const output = '`${ fn() } and ${ bar() }`';
            ruleTester.run(RULE, rule, invalidOnly(expectFix(code, output, 4)));
        });

        it('fixes ${} nested call doubles the pile-up: ${fn(bar())}', () => {
            ruleTester.run(RULE, rule, invalidOnly(
                expectFix('`${fn(bar())}`', '`${ fn(bar()) }`')
            ));
        });
    });

    describe('P3: chained .method() or [index] after nested calls', () => {

        it('fixes chained .method() after ))', () => {
            const code = 'wrap(parse(data)).unwrap()';
            const output = 'wrap( parse(data) ).unwrap()';
            ruleTester.run(RULE, rule, invalidOnly(expectFix(code, output)));
        });

        it('fixes chained [index] after ))', () => {
            const code = 'getMap(buildKey(userId))[0]';
            const output = 'getMap( buildKey(userId) )[0]';
            ruleTester.run(RULE, rule, invalidOnly(expectFix(code, output)));
        });

        it('skips already-spaced chained access', () => {
            const code = 'wrap( parse(data) ).unwrap()';
            ruleTester.run(RULE, rule, validOnly(code));
        });

        it('fixes immediate invocation after ))', () => {
            const code = "require(resolve('./module'))('./config')";
            const output =
                "require( resolve('./module') )('./config')";
            ruleTester.run(RULE, rule, invalidOnly(expectFix(code, output)));
        });

        it('fixes chain overrides long callee anchoring', () => {
            const code = 'callback(obj.method()).next()';
            const output = 'callback( obj.method() ).next()';
            ruleTester.run(RULE, rule, invalidOnly(expectFix(code, output)));
        });
    });

    describe('P2: semicolons and trailing punctuation', () => {

        it('skips ); is only 2 grouping chars: foo(bar);', () => {
            ruleTester.run(RULE, rule, validOnly('foo(bar);'));
        });

        it('fixes )); semicolon adds to pile-up: emit(parse());', () => {
            ruleTester.run(RULE, rule, invalidOnly(
                expectFix('emit(parse());', 'emit( parse() );')
            ));
        });

        it('fixes !( piles with outer (: if (!(foo || bar))', () => {
            const code = 'if (!(foo || bar)) { }';
            const output = 'if ( !(foo || bar) ) { }';
            ruleTester.run(RULE, rule, invalidOnly(expectFix(code, output)));
        });

        it('fixes await does not suppress pile-up', () => {
            const code = 'await emit(parse());';
            const output = 'await emit( parse() );';
            ruleTester.run(RULE, rule, invalidOnly(expectFix(code, output)));
        });

        it('fixes ))) in if condition: if (has(get(key)))', () => {
            const code = 'if (has(get(key))) {}';
            const output = 'if ( has(get(key)) ) {}';
            ruleTester.run(RULE, rule, invalidOnly(expectFix(code, output)));
        });

        it('fixes ))) in while condition: while (has(next()))', () => {
            const code = 'while (has(next())) {}';
            const output = 'while ( has(next()) ) {}';
            ruleTester.run(RULE, rule, invalidOnly(expectFix(code, output)));
        });
    });

    describe('P12: concise arrow inside calls', () => {

        it('fixes concise arrow )) pile-up', () => {
            const code = 'skills.forEach(skill => renderCard(skill))';
            const output = 'skills.forEach( skill => renderCard(skill) )';
            ruleTester.run(RULE, rule, invalidOnly(expectFix(code, output)));
        });

        it('skips block body provides structure: () => { bar() }', () => {
            const cases = [
                'foo(() => { bar() })',
                'foo(()=>{ bar(); });',
            ];
            ruleTester.run(RULE, rule, validOnly(...cases));
        });

        it('skips block body function expression: function(){ bar(); }', () => {
            const cases = [
                'foo(function(){ bar(); });',
                'foo(function handler(){ bar(); });',
            ];
            ruleTester.run(RULE, rule, validOnly(...cases));
        });

        it('fixes each arrow independently in chain: .map().filter()', () => {
            const code = 'items.map(x => parse(x)).filter(y => validate(y))';
            const output = 'items.map( x => parse(x) )'
                + '.filter( y => validate(y) )';
            ruleTester.run(RULE, rule, invalidOnly(expectFix(code, output, 4)));
        });

        it('skips arrow property access has no pile-up: x => x.name', () => {
            ruleTester.run(
                RULE, rule, validOnly('arr.map(x => x.name)')
            );
        });

        it('fixes arrow with parenthesized object: x => ({key: x}))', () => {
            const code = 'arr.map(x => ({key: x}))';
            const output = 'arr.map( x => ({key: x}) )';
            ruleTester.run(RULE, rule, invalidOnly(expectFix(code, output)));
        });

        it('fixes arrow with tuple params adds (', () => {
            const code = 'arr.forEach((x, i) => process(x))';
            const output = 'arr.forEach( (x, i) => process(x) )';
            ruleTester.run(RULE, rule, invalidOnly(expectFix(code, output)));
        });

        it('fixes multiple arrows share outer call', () => {
            const code = 'race(x => fetch(x), y => cache(y))';
            const output = 'race( x => fetch(x), y => cache(y) )';
            ruleTester.run(RULE, rule, invalidOnly(expectFix(code, output)));
        });
    });

    describe('P4: long names skip spacing at statement end', () => {

        it('skips long callee anchors: callback(obj.method());', () => {
            ruleTester.run(
                RULE, rule, validOnly('callback(obj.method());')
            );
        });

        it('skips standalone callee 8+ chars anchors', () => {
            ruleTester.run(
                RULE, rule, validOnly('getData(parseResponse(result));')
            );
        });

        it('fixes short callee no anchoring: foo(bar(x));', () => {
            ruleTester.run(RULE, rule, invalidOnly(
                expectFix('foo(bar(x));', 'foo( bar(x) );')
            ));
        });

        it('fixes short obj.method no anchoring: wrap(ab.cdef(data));', () => {
            ruleTester.run(RULE, rule, invalidOnly(
                expectFix('wrap(ab.cdef(data));', 'wrap( ab.cdef(data) );')
            ));
        });

        it('fixes short inner callee despite long outer', () => {
            ruleTester.run(RULE, rule, invalidOnly(
                expectFix('callback(fn(x));', 'callback( fn(x) );')
            ));
        });

        // MIN_METHOD_LEN_STANDALONE = 5: 'parse' is 5 chars
        it('skips 5+ char method with short object', () => {
            ruleTester.run(
                RULE, rule, validOnly('wrap(pa.parse(data));')
            );
        });

        // MIN_OBJ_LEN_FOR_ANCHORING=5 + MIN_METHOD_LEN_WITH_LONG_OBJ=4
        it('skips obj=5 method=4 (long object offsets short method)', () => {
            ruleTester.run(
                RULE, rule, validOnly('wrap(items.find(data));')
            );
        });

        // obj 'item' = 4 chars, below MIN_OBJ_LEN_FOR_ANCHORING
        it('fixes obj=4, method=4 (too short)', () => {
            ruleTester.run(RULE, rule, invalidOnly(
                expectFix('wrap(item.find(data));', 'wrap( item.find(data) );')
            ));
        });

        // MIN_CALLEE_LEN_FOR_SUPPRESSION = 8: 'abcdefgh' is exactly 8
        it('skips inner callee exactly 8 chars', () => {
            ruleTester.run(
                RULE, rule, validOnly('a(abcdefgh(x));')
            );
        });

        // 'abcdefg' = 7, below MIN_CALLEE_LEN_FOR_SUPPRESSION
        it('fixes inner callee 7 chars (too short)', () => {
            ruleTester.run(RULE, rule, invalidOnly(
                expectFix('a(abcdefg(x));', 'a( abcdefg(x) );')
            ));
        });

        // INNER_CALLEE_PROXIMITY = 2: inner callee's close paren
        // must be within 2 tokens of the outer close to count as
        // contributing to the visual pile-up. When it's too far,
        // findInnerCallee returns -1 and we fall to outer checks.

        // closeIdx - matchJ = 2 (at boundary): inner callee
        // 'abcdefgh' (8 chars) is within proximity and anchors
        it('skips inner callee at proximity boundary', () => {
            // wrap(abcdefgh(x)); -> inner ) at 5, outer ) at 7
            // 7 - 5 = 2 = INNER_CALLEE_PROXIMITY
            ruleTester.run(
                RULE, rule, validOnly('wrap(abcdefgh(x));')
            );
        });

        // MIN_CONTENT_LEN_FOR_SUPPRESSION = 15
        // 13 chars + {} = 15 total, at MIN_CONTENT_LEN_FOR_SUPPRESSION
        it('skips when content >= 15 chars (no inner callee)', () => {
            ruleTester.run(
                RULE, rule, validOnly('fn({longValueStri});')
            );
        });

        // content 'longValueStr' + braces = 14, below threshold
        it('fixes when content < 15 chars (no inner callee)', () => {
            ruleTester.run(RULE, rule, invalidOnly(
                expectFix('fn({longValueStr});', 'fn( {longValueStr} );')
            ));
        });
    });

    describe('P8: nested bracket access: obj[arr[index]]', () => {

        it('skips short content needs no spacing: obj[arr[index]]', () => {
            ruleTester.run(
                RULE, rule, validOnly('obj[arr[index]]')
            );
        });

        it('skips long inner name anchors: obj[longArrayName[index]]', () => {
            ruleTester.run(RULE, rule, validOnly('obj[longArrayName[index]]'));
        });

        it('fixes long property with short accessor', () => {
            const code = 'obj[arr[longPropertyName]]';
            const output = 'obj[ arr[longPropertyName] ]';
            ruleTester.run(
                RULE, rule, invalidOnly(expectFix(code, output))
            );
        });

        it('skips inner name at INNER_LEN boundary (10)', () => {
            const code = 'obj[abcdefghij[longPropertyName]]';
            ruleTester.run(RULE, rule, validOnly(code));
        });

        it('fixes inner name 9 chars (below INNER_LEN)', () => {
            const code = 'obj[abcdefghi[longPropertyName]]';
            const output = 'obj[ abcdefghi[longPropertyName] ]';
            ruleTester.run(
                RULE, rule, invalidOnly(expectFix(code, output))
            );
        });

        it('skips outer name at OUTER_LEN boundary (10)', () => {
            const code = 'abcdefghij[arr[longPropertyName]]';
            ruleTester.run(RULE, rule, validOnly(code));
        });

        it('fixes outer name 9 chars (below MIN_BRACKET_OUTER_LEN)', () => {
            const code = 'abcdefghi[arr[longPropertyName]]';
            const output = 'abcdefghi[ arr[longPropertyName] ]';
            ruleTester.run(
                RULE, rule, invalidOnly(expectFix(code, output))
            );
        });
    });

    describe('P13: commas provide visual separation in multi-arg calls', () => {

        it('skips comma separates nested call from close', () => {
            ruleTester.run(RULE, rule, validOnly('foo(data, parse());'));
        });

        it('fixes single-arg no comma separation: foo(parse());', () => {
            ruleTester.run(RULE, rule, invalidOnly(
                expectFix('foo(parse());', 'foo( parse() );')
            ));
        });

        it('fixes 3+ pile-up overrides comma: foo(data, bar(parse()));', () => {
            const code = 'foo(data, bar(parse()));';
            const output = 'foo( data, bar(parse()) );';
            ruleTester.run(RULE, rule, invalidOnly(expectFix(code, output)));
        });

        it('fixes ])) mixed brackets in multi-arg', () => {
            const code = 'buildSummaryText(null, '
                + 'new Set([WARFARE, NECROMANCER]))';
            const output = 'buildSummaryText( null, '
                + 'new Set([WARFARE, NECROMANCER]) )';
            ruleTester.run(
                RULE, rule, invalidOnly(expectFix(code, output))
            );
        });

        it('fixes object arg commas are inside not between args', () => {
            ruleTester.run(RULE, rule, invalidOnly(
                expectFix('foo({a: 1, b: 2});', 'foo( {a: 1, b: 2} );')
            ));
        });
    });

    describe('P5: empty call inside brackets', () => {

        it('skips double invocation is sequential not nested: fn()()', () => {
            ruleTester.run(RULE, rule, validOnly('fn()()'));
        });

        it('fixes empty call in bracket access: callbacks[getName()]', () => {
            ruleTester.run(RULE, rule, invalidOnly(
                expectFix('callbacks[getName()]', 'callbacks[ getName() ]')
            ));
        });
    });

    describe('P6: short inner content (implicit via anchoring)', () => {
        // P6 is handled implicitly through callee-length suppression.
        // These tests document the current behavior for the philosophy
        // doc's examples. See header comment for details.

        it('fixes 1-char inner content: foo(bar(x));', () => {
            ruleTester.run(RULE, rule, invalidOnly(
                expectFix('foo(bar(x));', 'foo( bar(x) );')
            ));
        });

        it('fixes 2-char inner content: foo(bar(ab));', () => {
            ruleTester.run(RULE, rule, invalidOnly(
                expectFix('foo(bar(ab));', 'foo( bar(ab) );')
            ));
        });

        // foo(bar(baz)); - 3 chars - currently ALSO fixes because
        // callee 'bar' is only 3 chars. This is the P6 gap.
        it('fixes 3-char inner content (P6 gap): foo(bar(baz));', () => {
            ruleTester.run(RULE, rule, invalidOnly(
                expectFix('foo(bar(baz));', 'foo( bar(baz) );')
            ));
        });
    });

    describe('real-world patterns', () => {

        it('fixes chain after )) pile-up', () => {
            const code = 'Object.keys(getConfig()).forEach(fn)';
            const output = 'Object.keys( getConfig() ).forEach(fn)';
            ruleTester.run(RULE, rule, invalidOnly(expectFix(code, output)));
        });

        it('fixes ])) via new + spread', () => {
            const code = 'Array.from(new Set([...items]))';
            const output = 'Array.from( new Set([...items]) )';
            ruleTester.run(RULE, rule, invalidOnly(expectFix(code, output)));
        });

        it('fixes )); with semicolon: require(resolve(path));', () => {
            const code = "require(resolve('./path'));";
            const output = "require( resolve('./path') );";
            ruleTester.run(RULE, rule, invalidOnly(expectFix(code, output)));
        });

        it('fixes )); multi-arg inner call: assert(equal(a, b));', () => {
            const code = 'assert(equal(a, b));';
            const output = 'assert( equal(a, b) );';
            ruleTester.run(RULE, rule, invalidOnly(expectFix(code, output)));
        });

        it('fixes )) in ternary branch: cond ? fn(bar()) : baz', () => {
            const code = 'const x = cond ? fn(bar()) : baz';
            const output = 'const x = cond ? fn( bar() ) : baz';
            ruleTester.run(RULE, rule, invalidOnly(expectFix(code, output)));
        });

        it('fixes destructured param adds (', () => {
            const code = 'arr.forEach(({name}) => process(name))';
            const output = 'arr.forEach( ({name}) => process(name) )';
            ruleTester.run(RULE, rule, invalidOnly(expectFix(code, output)));
        });

        it('fixes tagged template ${} with nested call', () => {
            ruleTester.run(RULE, rule, invalidOnly(
                expectFix('html`${fn(bar())}`', 'html`${ fn(bar()) }`')
            ));
        });

        it('skips long inner callee anchors', () => {
            const code = 'JSON.parse(JSON.stringify(obj))';
            ruleTester.run(RULE, rule, validOnly(code));
        });

        it('skips member callee anchors: console.log(obj.method());', () => {
            const code = 'console.log(obj.method());';
            ruleTester.run(RULE, rule, validOnly(code));
        });

        it('skips block body separates pile-up', () => {
            const code = 'function x() '
                + '{ return fn(bar()); }';
            ruleTester.run(RULE, rule, validOnly(code));
        });

        it('skips no semicolon keeps )) at threshold', () => {
            ruleTester.run(
                RULE, rule, validOnly('assert(equal(a, b))')
            );
        });
    });

    describe('comments between grouping characters', () => {

        it('skips comment whitespace breaks pile-up', () => {
            ruleTester.run(RULE, rule, validOnly('foo(bar()/* comment */)'));
        });
    });

    describe('optional chaining', () => {

        it('fixes ?. counts as grouping: foo?.(bar?.())', () => {
            ruleTester.run(RULE, rule, invalidOnly(
                expectFix('foo?.(bar?.())', 'foo?.( bar?.() )')
            ));
        });
    });

    describe('custom threshold option', () => {

        it('fixes 2 brackets at threshold 2: foo([bar])', () => {
            ruleTester.run(RULE, rule, {
                valid: [],
                invalid: [{
                    code: 'foo([bar])',
                    output: 'foo( [bar] )',
                    errors: 2,
                    options: [{ threshold: 2 }],
                }],
            });
        });

        it('skips empty call below threshold 2: fn()', () => {
            ruleTester.run(RULE, rule, {
                valid: [{
                    code: 'fn()',
                    options: [{ threshold: 2 }],
                }],
                invalid: [],
            });
        });

        it('skips 3 pile-up below threshold 4: foo([[bar]])', () => {
            ruleTester.run(RULE, rule, {
                valid: [{
                    code: 'foo([[bar]])',
                    options: [{ threshold: 4 }],
                }],
                invalid: [],
            });
        });
    });

    describe('fix idempotency', () => {

        it('skips already-fixed output (re-running produces no errors)', () => {
            const fixOutputs = [
                'setState( [[initialRow]] )',
                'db.insert( [{name: val}] )',
                'run( init(setup()) )',
                'app.use( cors(config(defaults())) )',
                'Object.keys( {} )',
                'Array.from( [] )',
                'parseInt( getValue() )',
                "require( resolve('./module') )('./config')",
                'if ( has(get(key)) ) {}',
                'arr.map( x => ({key: x}) )',
                'emit( parse() );',
                'wrap( parse(data) ).unwrap()',
                'foo(\n    bar() )',
                'fn( sh(longArg) );',
                'fn( {longValueStr} );',
                'callback( obj.method() ).next()',
                '`${ fn(bar()) }`',
                'arr.forEach( (x, i) => process(x) )',
                'race( x => fetch(x), y => cache(y) )',
                'Object.keys( getConfig() ).forEach(fn)',
                'Array.from( new Set([...items]) )',
                "require( resolve('./path') );",
                'assert( equal(a, b) );',
                'const x = cond ? fn( bar() ) : baz',
                'arr.forEach( ({name}) => process(name) )',
                'html`${ fn(bar()) }`',
                'obj[ abcdefghi[longPropertyName] ]',
                'abcdefghi[ arr[longPropertyName] ]',
            ];
            ruleTester.run(RULE, rule, validOnly(...fixOutputs));
        });
    });
});
