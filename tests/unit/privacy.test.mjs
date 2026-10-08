import test from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync, existsSync } from 'node:fs';
import { join, extname } from 'node:path';
import { execSync } from 'node:child_process';

const root = new URL('../../', import.meta.url).pathname;
const TEXT = new Set(['.html', '.js', '.mjs', '.css', '.md', '.json', '.svg', '.txt', '.webmanifest']);
// This file names the patterns it looks for, so it is excluded from its own scan.
const SKIP = new Set(['node_modules', '.git', 'package-lock.json', 'privacy.test.mjs']);

function* walk(dir) {
  for (const name of readdirSync(dir)) {
    if (SKIP.has(name)) continue;
    const path = join(dir, name);
    if (statSync(path).isDirectory()) yield* walk(path);
    else if (TEXT.has(extname(name))) yield path;
  }
}

// Generic patterns only: this test must not contain any real personal value.
const PATTERNS = {
  'e-mail address': /[\w.+-]+@[\w-]+\.[a-z]{2,}/i,
  'international phone number': /(?<![\d.])(?:\+|00)\s?97[0-9][\s-]?\d[\d\s-]{6,}\d/,
  'local mobile number': /(?<![\d.])05\d[\s-]?\d{3}[\s-]?\d{4}(?!\d)/,
  'landline number': /(?<![\d.])0[2-9]-\d{6,8}(?!\d)/,
  'prefilled password field': /type=["']?password["']?[^>]*value=["'][^"']+["']|value=["'][^"']+["'][^>]*type=["']?password/i,
  'tracking script': /googletagmanager|google-analytics|fbevents|facebook\.net\/en_US|sessioncam|bat\.bing|hotjar|criteo/i,
};

function scan(dir) {
  const hits = [];
  for (const file of walk(dir)) {
    const text = readFileSync(file, 'utf8');
    for (const [label, re] of Object.entries(PATTERNS)) if (re.test(text)) hits.push(`${file.replace(root, '')}: ${label}`);
  }
  return hits;
}

test('source, docs and tests contain no personal contact data, passwords or trackers', () => {
  const dirs = ['src', 'docs', 'tests', 'public'].map((d) => join(root, d)).filter(existsSync);
  const hits = [...dirs.flatMap(scan), ...['index.html', 'shop.html', 'product.html', 'then-and-now.html', 'README.md'].flatMap((f) => scan_file(join(root, f)))];
  assert.deepEqual(hits, []);
});

function scan_file(file) {
  const text = readFileSync(file, 'utf8');
  return Object.entries(PATTERNS).filter(([, re]) => re.test(text)).map(([label]) => `${file.replace(root, '')}: ${label}`);
}

test('production build (if present) contains no personal contact data, passwords or trackers', { skip: !existsSync(join(root, 'dist')) }, () => {
  assert.deepEqual(scan(join(root, 'dist')), []);
});

test('legacy personal files are not part of the working tree', () => {
  for (const name of ['About US.html', 'Contact Us.html', '132.html', 'wooo.html']) assert.ok(!existsSync(join(root, name)), name);
});

test('no build output is committed', () => {
  let tracked;
  try {
    tracked = execSync('git ls-files', { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).split('\n');
  } catch {
    return; // not inside a Git repository (for example, an export before `git init`)
  }
  assert.deepEqual(tracked.filter((f) => /^(dist|dist-[\w-]+|node_modules)\//.test(f)), []);
});
