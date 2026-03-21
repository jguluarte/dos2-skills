import { RuleTester } from 'eslint';
import { describe, it } from 'vitest';
import rule from '../../.config/eslint-rules/adjacent-bracket-spacing.js';

const ruleTester = new RuleTester({
    languageOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
    },
});

describe('adjacent-bracket-spacing', () => {
    it('enforces spacing when 3+ grouping chars are adjacent', () => {
        ruleTester.run('adjacent-bracket-spacing', rule, {
            valid: [
                // Single brackets — no adjacency
                '[a, b, c]',
                'foo(bar)',
                '({key: 1})',

                // 2 adjacent — OK
                'foo([bar])',
                'foo({bar: 1})',
                'arr.push([1, 2])',
                'bar([baz])',

                // Already spaced 3 adjacent — OK
                'foo( [[bar]] )',
                'foo( [{key: 1}] )',
                'foo( bar([baz]) )',
            ],

            invalid: [
                // 3 adjacent opening + closing
                {
                    code: 'foo([[bar]])',
                    output: 'foo( [[bar]] )',
                    errors: 2,
                },
                {
                    code: 'foo([{key: 1}])',
                    output: 'foo( [{key: 1}] )',
                    errors: 2,
                },

                // 3 adjacent closing only — balance both sides
                {
                    code: 'foo(bar([baz]))',
                    output: 'foo( bar([baz]) )',
                    errors: 2,
                },

                // Only opening side has 3 adjacent
                {
                    code: 'foo([[bar]], baz)',
                    output: 'foo( [[bar]], baz )',
                    errors: 2,
                },

                // Nested call — closing ))) is 3 adjacent
                {
                    code: 'a(b(c()))',
                    output: 'a( b(c()) )',
                    errors: 2,
                },

                // Object inside array inside call
                {
                    code: 'x([{a: 1}, {b: 2}])',
                    output: 'x( [{a: 1}, {b: 2}] )',
                    errors: 2,
                },

                // Only one side spaced — other side
                // still needs it
                {
                    code: 'foo( [[bar]])',
                    output: 'foo( [[bar]] )',
                    errors: 1,
                },
                {
                    code: 'foo([[bar]] )',
                    output: 'foo( [[bar]] )',
                    errors: 1,
                },
            ],
        });
    });

    it('counts ; as trailing density', () => {
        ruleTester.run('adjacent-bracket-spacing', rule, {
            valid: [
                // ); is only 2 — OK
                'foo(bar);',

                // Already spaced
                'foo( bar(baz) );',
            ],

            invalid: [
                // }); is 3 dense chars — space outermost
                {
                    code: 'foo(() => { bar(); });',
                    output: 'foo( () => { bar(); } );',
                    errors: 2,
                },

                // )); is 3 dense chars
                {
                    code: 'foo(bar());',
                    output: 'foo( bar() );',
                    errors: 2,
                },
            ],
        });
    });

    it('handles template literal ${ as a grouping char', () => {
        // ${ counts as 2 grouping chars ($, {), so
        // ${[ is already 3 adjacent
        ruleTester.run('adjacent-bracket-spacing', rule, {
            valid: [
                // ${ + simple expression — 2 adjacent, OK
                '`${foo}`',

                // Already spaced
                '`${ [arr] }`',
            ],

            invalid: [
                // ${ + [ = 3 adjacent ($, {, [)
                {
                    code: '`${[arr]}`',
                    output: '`${ [arr] }`',
                    errors: 2,
                },
            ],
        });
    });
});
