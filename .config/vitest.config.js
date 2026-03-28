import { defineConfig } from 'vitest/config';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { aliases, config } from './vite.aliases.js';

const svelteConfig = `${config}/svelte.config.js`;

export default defineConfig({
    plugins: [svelte({ hot: false, configFile: svelteConfig })],
    resolve: {
        alias: aliases,
        conditions: ['browser'],
    },
    test: {
        environment: 'happy-dom',
        include: ['src/**/test/*.test.js'],
        setupFiles: ['src/js/test/setup.js'],
    },
});
