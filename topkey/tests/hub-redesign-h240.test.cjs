'use strict';
const fs=require('node:fs');const assert=require('node:assert/strict');
const html=fs.readFileSync('topkey/index.html','utf8');
const css=fs.readFileSync('topkey/canva-ui-system.css','utf8');
const js=fs.readFileSync('topkey/hub-workspace-h240.js','utf8');
assert.ok(/canva-ui-system\.css\?v=canva-ui-v\d+-202611\d+/.test(html),'Hub must load consolidated Canva stylesheet');
assert.ok(!html.includes('hub-redesign-h240.css'),'Legacy H240 stylesheet must not load');
assert.ok(html.includes('hub-workspace-h240.js?v=h240-single-workspace-20261127'),'H240 workspace controller must load');
assert.ok(!html.includes('hub-workspace-nav-h231.js'),'Legacy H231 controller must not compete with H240');
for(const token of ['--tk-navy:#0B1F33','--tk-slate:#173A55','--tk-teal:#0AA6A6','--tk-ink:#F5FAFD','--tk-muted:#B8C9D6','grid-template-columns:repeat(3,minmax(0,1fr))','@media(max-width:640px)','prefers-reduced-motion:reduce']){
 assert.ok(css.includes(token),'Missing Canva visual/responsive token: '+token);
}
assert.ok(css.includes('body.tk-bi-hub .footer{display:none!important'),'Legacy footer spacer must not reserve empty vertical space');
assert.ok(css.includes('body.tk-bi-hub #topkey-sports.cards .sport'),'Sport cards must use Canva card surfaces');
assert.ok(css.includes('body.tk-bi-hub .exec-insights-focus'),'Dashboard focus card must use Canva contrast colors');
assert.ok(css.includes('body.tk-bi-hub .hub-workspace-hidden'),'Inactive workspaces must leave layout flow');
assert.ok(css.includes('grid-template-columns:264px minmax(0,1fr)'),'Desktop Hub must use a real sidebar/main layout, not empty spacer tracks');
assert.ok(css.includes('position:fixed;left:0;right:0;bottom:0'),'Mobile Hub navigation must dock to the bottom');
for(const id of ['topkey-home','topkey-sports','executive-dashboard','system-admin-launch'])assert.ok(js.includes("'"+id+"'"),'Missing workspace '+id);
assert.ok(js.includes("['.tk-bi-hero','.tk-bi-section-heading','#topkey-sports']"));
assert.ok(js.includes('main.dataset.activeWorkspace=id'));
assert.ok(js.includes('history.pushState'));
assert.ok(js.includes("if('inert'in node)node.inert=!visible"));
console.log('H240 Canva Hub replacement, single-workspace layout, responsive navigation and accessibility contracts passed.');
