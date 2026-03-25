import { defineConfig } from 'vitest/config';
import { aliases } from './vite.aliases.js';

export default defineConfig({
    resolve: { alias: aliases },
    test: {
        environment: 'happy-dom',
        include: ['src/**/test/*.test.js'],
        setupFiles: ['src/js/test/setup.js'],
    },
});
