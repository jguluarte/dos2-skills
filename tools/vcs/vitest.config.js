import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        include: ['tools/vcs/test/**/*.test.js'],
    },
});
