const fs = require('node:fs');
const assert = require('node:assert/strict');
const root = 'topkey/sports';
const vnext = fs.readFileSync(root + '/vnext/index.html', 'utf8');
const badminton = fs.readFileSync(root + '/badminton/index.html', 'utf8');
const vcss = fs.readFileSync(root + '/vnext/ux-responsive-h214.css', 'utf8');
const bcss = fs.readFileSync(root + '/badminton/ux-responsive-h214.css', 'utf8');
const v215 = fs.readFileSync(root + '/vnext/contrast-awards-h215.css', 'utf8');
const b215 = fs.readFileSync(root + '/badminton/contrast-awards-h215.css', 'utf8');
for (const sport of ['football','volleyball','running','handmade','shuttle','cooking']) {
  assert.ok(vnext.includes("'" + sport + "'"), 'missing VNext sport identity: ' + sport);
}
assert.ok(vnext.includes('ux-responsive-h214.css?v=h214-20261124'));
assert.ok(badminton.includes('ux-responsive-h214.css?v=h214-20261124'));
assert.ok(vnext.includes('contrast-awards-h215.css?v=h215-20261124'));
assert.ok(badminton.includes('contrast-awards-h215.css?v=h215-20261124'));
for (const [name, css] of [['VNext H215', v215], ['Badminton H215', b215]]) {
  assert.ok(css.includes('#tk79-prize-list') && css.includes('tk79-prize-row'), name + ' prize editor layout');
  assert.ok(css.includes('#f7fbfd') && css.includes('#17384a'), name + ' prize input contrast');
  assert.ok(css.includes('max-width:760px'), name + ' mobile prize rows');
}
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
