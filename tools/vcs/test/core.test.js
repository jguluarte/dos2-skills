import { describe, it, expect } from 'vitest';
import { parseJS } from '../js-parser.js';
import {
    analyze,
    applyEdits,
    countDensityRunBackward,
    findMatchingBracket,
    hasSpaceBetween,
    isGroupingChar,
    isDensityToken,
    isContinuation,
    isTermination,
    getContentInfo,
    contentSuppresses,
    countGroupingInRun,
    countArgs,
} from '../core.js';

// Helper: parse source, analyze, and apply edits in one step
function transform(source) {
    const { tokens, metadata } = parseJS(source);
    const edits = analyze(tokens, metadata);
    return applyEdits(source, edits);
}

// Helper: parse and return just the edits (for inspection)
function getEdits(source) {
    const { tokens, metadata } = parseJS(source);
    return analyze(tokens, metadata);
}

// ============================================================
// Unit tests for core primitives
// ============================================================

describe('core primitives', () => {
    describe('isDensityToken', () => {
        it('identifies grouping chars', () => {
            expect(isDensityToken({ value: '(' })).toBe(true);
            expect(isDensityToken({ value: ')' })).toBe(true);
            expect(isDensityToken({ value: '[' })).toBe(true);
            expect(isDensityToken({ value: ']' })).toBe(true);
            expect(isDensityToken({ value: '{' })).toBe(true);
            expect(isDensityToken({ value: '}' })).toBe(true);
        });

        it('identifies dense trailing chars', () => {
            expect(isDensityToken({ value: '.' })).toBe(true);
            expect(isDensityToken({ value: ';' })).toBe(true);
            expect(isDensityToken({ value: '!' })).toBe(true);
        });

        it('rejects non-density chars', () => {
            expect(isDensityToken({ value: ',' })).toBe(false);
            expect(isDensityToken({ value: '+' })).toBe(false);
            expect(isDensityToken({ value: 'foo' })).toBe(false);
        });

        it('handles null/undefined', () => {
            expect(isDensityToken(null)).toBe(false);
            expect(isDensityToken(undefined)).toBe(false);
        });
    });

    describe('hasSpaceBetween', () => {
        it('detects adjacent tokens', () => {
            const a = { range: [0, 3] };
            const b = { range: [3, 4] };
            expect(hasSpaceBetween(a, b)).toBe(false);
        });

        it('detects spaced tokens', () => {
            const a = { range: [0, 3] };
            const b = { range: [4, 5] };
            expect(hasSpaceBetween(a, b)).toBe(true);
        });
    });

    describe('countDensityRunBackward', () => {
        it('counts adjacent density chars including opener', () => {
            const { tokens } = parseJS('foo(bar());');
            // Find the ; token (last in run)
            const semiIdx = tokens.findIndex(t => t.value === ';');
            const run = countDensityRunBackward(tokens, semiIdx);
            // (  )  )  ; = 4 density tokens (bar's ( is adjacent)
            expect(run.count).toBe(4);
            expect(run.groupingCount).toBe(3);
        });
    });

    describe('findMatchingBracket', () => {
        it('finds matching paren for opener', () => {
            const { tokens } = parseJS('foo(bar());');
            const outerOpen = tokens.findIndex(
                t => t.value === '(' && t.range[0] === 3,
            );
            const matchIdx = findMatchingBracket(tokens, outerOpen);
            expect(tokens[matchIdx].value).toBe(')');
            expect(tokens[matchIdx].range[0]).toBe(9);
        });

        it('finds matching paren for closer', () => {
            const { tokens } = parseJS('foo(bar());');
            const outerClose = tokens.findIndex(
                t => t.value === ')' && t.range[0] === 9,
            );
            const matchIdx = findMatchingBracket(tokens, outerClose);
            expect(tokens[matchIdx].value).toBe('(');
            expect(tokens[matchIdx].range[0]).toBe(3);
        });
    });

    describe('contentSuppresses', () => {
        it('suppresses with long callee name', () => {
            expect(contentSuppresses({
                calleeName: 'parse',
                objectName: null,
                totalLength: 5,
            })).toBe(true);
        });

        it('does not suppress with short callee name', () => {
            expect(contentSuppresses({
                calleeName: 'bar',
                objectName: null,
                totalLength: 3,
            })).toBe(false);
        });

        it('adjusts threshold for member expressions', () => {
            // Long object (5+ chars) -> method needs 4+ chars
            expect(contentSuppresses({
                calleeName: 'pars',
                objectName: 'parse',
                totalLength: 10,
            })).toBe(true);

            // Short object (2 chars) -> method needs 5+ chars
            expect(contentSuppresses({
                calleeName: 'arse',
                objectName: 'pa',
                totalLength: 7,
            })).toBe(false);
            expect(contentSuppresses({
                calleeName: 'parse',
                objectName: 'pa',
                totalLength: 8,
            })).toBe(true);
        });
    });

    describe('countArgs', () => {
        it('counts single argument', () => {
            const { tokens } = parseJS('foo(bar());');
            const openIdx = tokens.findIndex(
                t => t.value === '(' && t.range[0] === 3,
            );
            const closeIdx = tokens.findIndex(
                t => t.value === ')' && t.range[0] === 9,
            );
            expect(countArgs(tokens, openIdx, closeIdx)).toBe(1);
        });

        it('counts multiple arguments', () => {
            const { tokens } = parseJS('foo(data, parse());');
            const openIdx = tokens.findIndex(
                t => t.value === '(' && t.range[0] === 3,
            );
            // Last ) before ;
            const closeIdx = tokens.findIndex(
                t => t.value === ')' && t.range[0] === 17,
            );
            expect(countArgs(tokens, openIdx, closeIdx)).toBe(2);
        });
    });
});

// ============================================================
// Integration tests — full transform pipeline
// ============================================================

describe('density spacing transforms', () => {
    describe('basic density (3+ adjacent grouping chars)', () => {
        it('spaces foo(bar()) -> foo( bar() )', () => {
            expect(transform('foo(bar());')).toBe('foo( bar() );');
        });

        it('spaces nested empty calls', () => {
            expect(transform('foo(bar());')).toBe('foo( bar() );');
        });
    });

    describe('content-aware suppression at termination', () => {
        it('suppresses with long member expression: callback(obj.method())',
            () => {
                // obj.method = 10 chars total, well above threshold
                expect(transform('callback(obj.method());'))
                    .toBe('callback(obj.method());');
            });

        it('suppresses with long callee: getData(parseResponse(result))',
            () => {
                expect(transform('getData(parseResponse(result));'))
                    .toBe('getData(parseResponse(result));');
            });

        it('spaces with short callee: foo(bar(x))', () => {
            expect(transform('foo(bar(x));')).toBe('foo( bar(x) );');
        });
    });

    describe('continuation vs termination', () => {
        it('spaces continuation with .method: wrap(parse(data)).unwrap()',
            () => {
                expect(transform('wrap(parse(data)).unwrap()'))
                    .toBe('wrap( parse(data) ).unwrap()');
            });

        it('spaces continuation with [prop]: getMap(buildKey(id))[0]',
            () => {
                expect(transform('getMap(buildKey(id))[0];'))
                    .toBe('getMap( buildKey(id) )[0];');
            });
    });

    describe('template literals', () => {
        it('spaces template with call: `${getName()}`', () => {
            expect(transform('const msg = `${getName()}`;'))
                .toBe('const msg = `${ getName() }`;');
        });

        it('spaces template with bracket access: `${items[0]}`', () => {
            expect(transform('const msg = `${items[0]}`;'))
                .toBe('const msg = `${ items[0] }`;');
        });

        it('leaves template without grouping chars: `${name}`', () => {
            expect(transform('const msg = `${name}`;'))
                .toBe('const msg = `${name}`;');
        });

        it('leaves template without grouping chars: `${obj.name}`', () => {
            // . is a density char but not a grouping char
            expect(transform('const msg = `${obj.name}`;'))
                .toBe('const msg = `${obj.name}`;');
        });
    });

    describe('arrow-in-call (cognitive density)', () => {
        it('spaces arrow with nested call in forEach', () => {
            expect(transform(
                'skills.forEach(skill => renderCard(skill));',
            )).toBe(
                'skills.forEach( skill => renderCard(skill) );',
            );
        });
    });

    describe('bracket access density', () => {
        it('leaves short content unspaced: obj[arr[index]]', () => {
            expect(transform('obj[arr[index]];'))
                .toBe('obj[arr[index]];');
        });

        it('spaces long content: obj[arr[longPropertyName]]', () => {
            expect(transform('obj[arr[longPropertyName]];'))
                .toBe('obj[ arr[longPropertyName] ];');
        });
    });

    describe('multi-argument suppression', () => {
        it('suppresses when trailing char is sole trigger', () => {
            // foo(data, parse()) -> )) + ; = 3, but only 2 real grouping
            // and multi-arg -> suppress
            expect(transform('foo(data, parse());'))
                .toBe('foo(data, parse());');
        });

        it('does not suppress when 3+ real grouping chars', () => {
            // foo(data, bar(parse())) -> ))) = 3 real grouping
            expect(transform('foo(data, bar(parse()));'))
                .toBe('foo( data, bar(parse()) );');
        });
    });
});

// ============================================================
// Edge cases and already-spaced inputs
// ============================================================

describe('edge cases', () => {
    it('does not double-space already-spaced input', () => {
        expect(transform('foo( bar() );')).toBe('foo( bar() );');
    });

    it('handles simple calls without density', () => {
        expect(transform('foo(bar);')).toBe('foo(bar);');
    });

    it('handles empty parens', () => {
        expect(transform('foo();')).toBe('foo();');
    });

    it('handles chained method calls without density', () => {
        expect(transform('foo.bar.baz();'))
            .toBe('foo.bar.baz();');
    });

    it('handles assignment without density', () => {
        expect(transform('const x = foo(bar);'))
            .toBe('const x = foo(bar);');
    });
});

// ============================================================
// Additional cases from user philosophy
// ============================================================

describe('content suppression thresholds', () => {
    it('suppresses pa.parse(data) — method=5, short obj', () => {
        expect(transform('wrap(pa.parse(data));'))
            .toBe('wrap(pa.parse(data));');
    });

    it('spaces pa.arse(data) — method=4, short obj', () => {
        expect(transform('wrap(pa.arse(data));'))
            .toBe('wrap( pa.arse(data) );');
    });

    it('suppresses parse.pars(data) — method=4, long obj', () => {
        expect(transform('wrap(parse.pars(data));'))
            .toBe('wrap(parse.pars(data));');
    });
});

describe('empty call as density multiplier', () => {
    it('spaces callbacks[getName()]', () => {
        expect(transform('callbacks[getName()];'))
            .toBe('callbacks[ getName() ];');
    });
});

describe('balance: space the outermost container', () => {
    // NOTE: Ideally this would space outer(), not mid(), per the
    // philosophy. The current prototype spaces the bracket pair
    // that directly contains the density run. Promoting the spacing
    // to the outermost container is a future enhancement.
    it('outer(mid(inner()), x) — spaces mid for now', () => {
        expect(transform("outer(mid(inner()), 'x');"))
            .toBe("outer(mid( inner() ), 'x');");
    });
});
