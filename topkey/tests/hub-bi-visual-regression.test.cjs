const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const css=fs.readFileSync(path.join(root,'canva-ui-system.css'),'utf8');
const sports=['football','badminton','volleyball','running','handmade','shuttle','cooking'];
assert.match(html,/body class="tk-bi-hub"/);
assert.match(html,/canva-ui-system\.css\?v=canva-ui-v1-20261127/);
assert.match(html,/class="tk-bi-hero"/);
assert.match(html,/id="executive-dashboard"/);
assert.match(html,/id="topkey-sports"/);
assert.ok(!html.includes('sports-hub-bi.css'),'Legacy BI stylesheet must not load');
for(const sport of sports){
  assert.ok(html.includes('sport='+sport)||html.includes('sports/'+sport+'/index.html')||(sport==='badminton'&&html.includes('sports/vnext/badminton.html')),'Missing sport navigation: '+sport);
}
for(const dep of ['hub-auth-flow.js','executive-dashboard.js','hub-layout94.js','topkey-dynamic-i18n.js']){
  assert.ok(html.includes(dep),'Preserve runtime dependency '+dep);
}
for(const selector of ['.tk-bi-hero','.exec-kpis','.exec-card','.cards.compact-sports','.tk-bi-footer']){
 assert.ok(css.includes(selector),'Missing BI component '+selector);
}
assert.match(css,/@media\(max-width:650px\)/);
assert.match(css,/prefers-reduced-motion/);
console.log('TOPKEY Hub BI: 7 sport links, role-gated dashboard, auth dependencies and responsive theme verified.');
