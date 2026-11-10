const fs = require('fs');
const assert = require('assert');

const html = fs.readFileSync('index.html', 'utf8');
const css = fs.readFileSync('hub-layout94.css', 'utf8');
const runtime = fs.readFileSync('hub-layout94.js', 'utf8');
const serviceWorkers = [
  fs.readFileSync('sw.js', 'utf8'),
  fs.readFileSync('sports/badminton/sw.js', 'utf8'),
  fs.readFileSync('sports/vnext/sw.js', 'utf8')
];

const headerStart = html.indexOf('<header class="top">');
const headerEnd = html.indexOf('</header>', headerStart);
const header = html.slice(headerStart, headerEnd);

assert(headerStart >= 0 && headerEnd > headerStart, 'Hub header is missing');
assert(/<h1><span class="hub-title-line">HỆ THỐNG QUẢN LÝ THỂ THAO &amp;<\/span><span class="hub-title-line">HOẠT ĐỘNG XÃ ĐOÀN<\/span><\/h1>/.test(header), 'default title must have the two reference lines');
assert(header.indexOf('</h1>') < header.indexOf('class="eyebrow"'), 'subtitle must stay below the title');
assert(header.indexOf('class="brand-logo-wrap"') < header.indexOf('class="brand-title"'), 'logo must stay left of title');
assert(header.indexOf('class="brand-title"') < header.indexOf('class="status"'), 'status badges must stay right of title');
assert(/\.hub-title-line\s*\{[^}]*display:block[^}]*white-space:nowrap/.test(css), 'desktop title lines must not split internally');
assert(css.includes('@media(max-width:1680px)') && css.includes('max-width:460px'), 'wide desktop must reserve enough title space');
assert(css.includes('@media(max-width:1320px)') && css.includes('flex-direction:column'), 'responsive header stacking is missing');
assert(/@media\(max-width:900px\)[\s\S]*\.hub-title-line\{white-space:normal\}/.test(css), 'tablet title lines must be allowed to wrap');
assert(css.includes('overflow-wrap:anywhere'), 'long custom titles must wrap safely');
assert(runtime.includes('h.textContent=title'), 'custom titles must remain plain text');
for (const source of serviceWorkers) {
  assert(source.includes('h96-header-reference-layout'), 'every service worker must use the H96 cache namespace');
  assert(!source.includes('u122h95-performance-hardening'), 'H95 cache namespace must not remain active');
}

console.log('HEADER_LAYOUT_H96_OK');
