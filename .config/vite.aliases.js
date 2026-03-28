import path from 'path';
import { fileURLToPath } from 'url';

const root = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)), '..'
);

export const config = path.resolve(root, '.config');

export const aliases = {
    '@': path.resolve(root, 'src'),
    '@js': path.resolve(root, 'src/js'),
    '@data': path.resolve(root, 'src/data'),
    '@dist': path.resolve(root, 'dist'),
    '@templates': path.resolve(root, 'src/templates'),
    '@constants': path.resolve(root, 'src/js/constants.js'),
};
