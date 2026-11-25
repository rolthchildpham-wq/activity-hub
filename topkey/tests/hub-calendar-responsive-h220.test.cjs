const fs = require('node:fs');
const assert = require('node:assert/strict');

const css = fs.readFileSync('topkey/hub-dashboard-reference-h219.css', 'utf8');
const mobile = css.match(/@media\s*\(max-width:\s*680px\)\s*\{([\s\S]*?)\n\}/);

assert.ok(mobile, 'H220 must define a dedicated mobile calendar layout at 680px');
assert.match(mobile[1], /\.exec-calendar-weekdays\s*,\s*body\.tk-bi-hub\s*\.exec-calendar-grid\s*\{[^}]*min-width:\s*0(?:px)?\s*!important/s,
  'Calendar weekday and day grids must release the 560px desktop minimum width on mobile');
assert.match(mobile[1], /\.exec-calendar-card\s*\{[^}]*overflow-x:\s*visible\s*!important/s,
  'Mobile calendar must not require an inner horizontal scroll container');
assert.match(mobile[1], /\.exec-calendar-day\s*\{[^}]*min-height:\s*0\s*!important/s,
  'Mobile calendar cells must use compact content-driven sizing');
assert.match(mobile[1], /\.exec-calendar-date\s*\{[^}]*font-size:\s*10px\s*!important/s,
  'Mobile calendar date labels must remain legible in compact cells');

console.log('H220 mobile calendar no-horizontal-scroll contract passed.');
