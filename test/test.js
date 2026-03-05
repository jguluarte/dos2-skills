const path = require('path');
const { describe, it } = require('node:test');
const assert = require('node:assert/strict');

function getCallerFile() {
    const stack = new Error().stack.split('\n');
    const callerLine = stack.find(line => line.includes('.test.js'));
    if (!callerLine) return 'unknown';
    const match = callerLine.match(/\((.+?):\d+:\d+\)/);
    if (!match) return 'unknown';
    return path.basename(match[1]);
}

function test(label, fn) {
    const file = getCallerFile();
    describe(`[${file}] ${label}`, fn);
}

module.exports = { test, describe, it, assert };
