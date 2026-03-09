import { describe, it, expect } from 'vitest';
import { ViewModel } from '../js/view-model.js';

describe('ViewModel', () => {
    const source = {
        name: 'Test',
        value: 42,
        nested: { a: 1 },
    };

    it('passes through source properties', () => {
        const vm = new ViewModel(source);
        expect(vm.name).toBe('Test');
        expect(vm.value).toBe(42);
    });

    it('passes through nested source properties', () => {
        const vm = new ViewModel(source);
        expect(vm.nested).toEqual({ a: 1 });
    });

    it('returns undefined for missing properties', () => {
        const vm = new ViewModel(source);
        expect(vm.missing).toBeUndefined();
    });

    it('exposes _source', () => {
        const vm = new ViewModel(source);
        expect(vm._source).toBe(source);
    });

    it('supports "in" operator for source properties', () => {
        const vm = new ViewModel(source);
        expect('name' in vm).toBe(true);
        expect('value' in vm).toBe(true);
    });

    it('supports "in" operator returns false for missing', () => {
        const vm = new ViewModel(source);
        expect('missing' in vm).toBe(false);
    });

    it('class getters override source properties', () => {
        class Sub extends ViewModel {
            get name() { return 'Override'; }
        }
        const vm = new Sub(source);
        expect(vm.name).toBe('Override');
    });

    it('"in" finds class getter properties', () => {
        class Sub extends ViewModel {
            get computed() { return 'yes'; }
        }
        const vm = new Sub(source);
        expect('computed' in vm).toBe(true);
    });
});
