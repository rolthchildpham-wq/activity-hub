const fs=require('node:fs');const assert=require('node:assert/strict');
const html=fs.readFileSync('topkey/index.html','utf8');
const css=fs.readFileSync('topkey/hub-redesign-h240.css','utf8');
const js=fs.readFileSync('topkey/hub-workspace-h240.js','utf8');
assert.ok(html.includes('hub-redesign-h240.css?v=h240-full-visual-system-20261127'),'H240 visual system must load after legacy skins');
assert.ok(html.includes('hub-workspace-h240.js?v=h240-single-workspace-20261127'),'H240 workspace controller must load');
assert.ok(!html.includes('hub-workspace-nav-h231.js'),'Legacy H231 controller must not compete with H240');
for(const token of ['--tk-bg:#071827','--tk-header:#0b2032','--tk-panel:#102a3e','--tk-ink:#f2f8fc','--tk-muted:#bfd0dc','--tk-teal:#20d3bd','grid-template-columns:repeat(4,minmax(0,1fr))','@media(max-width:820px)','@media(max-width:420px)','prefers-reduced-motion:reduce']){
 assert.ok(css.includes(token),'Missing H240 visual/responsive token: '+token);
}
assert.ok(css.includes('body.tk-bi-hub .wrap{display:block!important'),'Main content must use normal flow, not fixed empty tracks');
assert.ok(css.includes('body.tk-bi-hub .footer{display:none!important'),'Legacy footer spacer must not reserve empty vertical space');
assert.ok(css.includes('body.tk-bi-hub .hub-workspace-hidden{display:none!important'),'Inactive workspaces must leave layout flow');
for(const id of ['topkey-home','topkey-sports','executive-dashboard','system-admin-launch'])assert.ok(js.includes("'"+id+"'"),'Missing workspace '+id);
assert.ok(js.includes("['.tk-bi-hero','.tk-bi-section-heading','#topkey-sports']"),'Home must show meaningful content and quick-launch cards');
assert.ok(js.includes('main.dataset.activeWorkspace=id'),'Active workspace state must be observable');
assert.ok(js.includes('history.pushState'),'Back/Forward navigation must be preserved');
assert.ok(js.includes("if('inert'in node)node.inert=!visible"),'Inactive workspaces must be inaccessible to keyboard/screen readers');
console.log('H240 complete Hub redesign and single-workspace layout contract passed.');
