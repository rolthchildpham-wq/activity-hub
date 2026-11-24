const fs = require('node:fs');
const assert = require('node:assert/strict');
const root = 'topkey/sports';
const vnext = fs.readFileSync(root + '/vnext/index.html', 'utf8');
const badminton = fs.readFileSync(root + '/badminton/index.html', 'utf8');
const vcss = fs.readFileSync(root + '/vnext/ux-responsive-h214.css', 'utf8');
const bcss = fs.readFileSync(root + '/badminton/ux-responsive-h214.css', 'utf8');
for (const sport of ['football','volleyball','running','handmade','shuttle','cooking']) {
  assert.ok(vnext.includes("'" + sport + "'"), 'missing VNext sport identity: ' + sport);
}
assert.ok(vnext.includes('ux-responsive-h214.css?v=h214-20261124'));
assert.ok(badminton.includes('ux-responsive-h214.css?v=h214-20261124'));
for (const [name, css] of [['VNext', vcss], ['Badminton', bcss]]) {
  assert.ok(css.includes('@media(max-width:') && css.includes('420px'), name + ' responsive breakpoints');
  assert.ok(css.includes('prefers-reduced-motion:reduce'), name + ' reduced motion');
  assert.ok(css.includes('.table-wrap') && css.includes('overflow:auto'), name + ' contained table scroll');
  assert.ok(css.includes('.form-grid') && css.includes('grid-template-columns'), name + ' responsive form grid');
}
for (const tab of ['overview','control','teams','schedule','umpire','live','finance','announcements','audit','health','settings']) {
  assert.ok(vnext.includes('data-tab="' + tab + '"'), 'VNext missing function tab ' + tab);
  assert.ok(badminton.includes('data-tab="' + tab + '"'), 'Badminton missing function tab ' + tab);
}
console.log('H214 responsive UI contracts passed: 6 VNext sports + Badminton, 11 modules, mobile/table/form/reduced-motion rules.');
