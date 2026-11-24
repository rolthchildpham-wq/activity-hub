const fs = require('node:fs');
const assert = require('node:assert/strict');
const root = 'topkey/sports';
const vnext = fs.readFileSync(root + '/vnext/index.html', 'utf8');
const badminton = fs.readFileSync(root + '/badminton/index.html', 'utf8');
const vcss = fs.readFileSync(root + '/vnext/ux-responsive-h214.css', 'utf8');
const bcss = fs.readFileSync(root + '/badminton/ux-responsive-h214.css', 'utf8');
for (const sport of ['football','volleyball','running','handmade','shuttle','cooking']) assert.ok(vnext.includes("'" + sport + "'"), 'missing VNext sport identity: ' + sport);
assert.match(vnext, /ux-responsive-h214\\.css\\?v=h214-20261124/);
assert.match(badminton, /ux-responsive-h214\\.css\\?v=h214-20261124/);
for (const [name, css] of [['VNext', vcss], ['Badminton', bcss]]) {
 assert.match(css, /@media\\(max-width:700px\\)|@media\\(max-width:690px\\)/, name + ' mobile layout');
 assert.match(css, /@media\\(max-width:420px\\)/, name + ' narrow-phone layout');
 assert.match(css, /prefers-reduced-motion:reduce/, name + ' reduced motion');
 assert.match(css, /\\.table-wrap[^\\{]*\\{[^}]*overflow:auto/s, name + ' contained table scroll');
 assert.match(css, /\\.form-grid[^\\{]*\\{[^}]*grid-template-columns/s, name + ' responsive form grid');
}
for (const tab of ['overview','control','teams','schedule','umpire','live','finance','announcements','audit','health','settings']) {
 assert.ok(vnext.includes('data-tab="' + tab + '"'), 'VNext missing function tab ' + tab);
 assert.ok(badminton.includes('data-tab="' + tab + '"'), 'Badminton missing function tab ' + tab);
}
console.log('H214 responsive UI contracts passed: 6 VNext sports + Badminton, 11 modules, mobile/table/form/reduced-motion rules.');
