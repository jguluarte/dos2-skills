#!/usr/bin/env node

/**
 * Visual Complexity Spacing — CLI
 *
 * Usage:
 *   node tools/vcs/cli.js file.js          # print modified output
 *   node tools/vcs/cli.js --check file.js  # exit 1 if changes needed
 *   node tools/vcs/cli.js --write file.js  # modify in place
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { parseJS } from './js-parser.js';
import { analyze, applyEdits } from './core.js';

function usage() {
    console.log(`Usage: vcs-tool [options] <file>

Options:
  --check   Check if changes are needed (exit 1 if so)
  --write   Modify the file in place
  --help    Show this help

Without flags, prints the modified output to stdout.`);
}

function main() {
    const args = process.argv.slice(2);

    let check = false;
    let write = false;
    let filePath = null;

    for (const arg of args) {
        if (arg === '--check') check = true;
        else if (arg === '--write') write = true;
        else if (arg === '--help' || arg === '-h') {
            usage();
            process.exit(0);
        } else if (!arg.startsWith('-')) {
            filePath = arg;
        } else {
            console.error(`Unknown option: ${arg}`);
            usage();
            process.exit(1);
        }
    }

    if (!filePath) {
        console.error('Error: no file specified');
        usage();
        process.exit(1);
    }

    const absPath = resolve(filePath);
    let source;
    try {
        source = readFileSync(absPath, 'utf-8');
    } catch (err) {
        console.error(`Error reading file: ${err.message}`);
        process.exit(1);
    }

    const { tokens, metadata } = parseJS(source);
    const edits = analyze(tokens, metadata);
    const result = applyEdits(source, edits);

    if (check) {
        if (result !== source) {
            console.log(`${absPath}: spacing changes needed`);
            process.exit(1);
        }
        process.exit(0);
    }

    if (write) {
        if (result !== source) {
            writeFileSync(absPath, result, 'utf-8');
            console.log(`${absPath}: updated`);
        } else {
            console.log(`${absPath}: no changes needed`);
        }
        process.exit(0);
    }

    // Default: print to stdout
    process.stdout.write(result);
}

main();
