import { describe, it, expect } from 'vitest';
import { viewModel } from '../js/view-model.js';

describe('viewModel', () => {
    const source = { name: 'Fireball', cost: 3, active: true };

    it('passes through source properties', () => {
        const vm = viewModel(source, {});
        expect(vm.name).toBe('Fireball');
        expect(vm.cost).toBe(3);
        expect(vm.active).toBe(true);
    });

    it('returns undefined for missing properties', () => {
        const vm = viewModel(source, {});
        expect(vm.nonexistent).toBeUndefined();
    });

    it('overrides take priority over source', () => {
        const vm = viewModel(source, {
            name: s => s.name.toUpperCase(),
        });
        expect(vm.name).toBe('FIREBALL');
    });

    it('passes source as argument to override fn', () => {
        const vm = viewModel(source, {
            label: s => `${s.name} (${s.cost}AP)`,
        });
        expect(vm.label).toBe('Fireball (3AP)');
    });

    it('has trap reports source properties', () => {
        const vm = viewModel(source, {});
        expect('name' in vm).toBe(true);
        expect('missing' in vm).toBe(false);
    });

    it('has trap reports override properties', () => {
        const vm = viewModel(source, {
            computed: () => 42,
        });
        expect('computed' in vm).toBe(true);
    });

    it('has trap finds both source and overrides', () => {
        const vm = viewModel(source, {
            extra: () => 'yes',
        });
        expect('name' in vm).toBe(true);
        expect('extra' in vm).toBe(true);
        expect('nope' in vm).toBe(false);
    });
});
