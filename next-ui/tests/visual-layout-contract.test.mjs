import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const workspace=readFileSync(new URL('../src/workspace-audit.css',import.meta.url),'utf8');
const layout=readFileSync(new URL('../src/routes/sports/[slug]/[tid]/+layout.svelte',import.meta.url),'utf8');
const workflow=readFileSync(new URL('../../.github/workflows/next-ui-validation.yml',import.meta.url),'utf8');

function luminance(hex){
 const channels=[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)/255);
 const linear=channels.map(v=>v<=0.04045?v/12.92:((v+0.055)/1.055)**2.4);
 return linear[0]*0.2126+linear[1]*0.7152+linear[2]*0.0722;
}
function contrast(fg,bg){
 const a=luminance(fg),b=luminance(bg);
 return (Math.max(a,b)+0.05)/(Math.min(a,b)+0.05);
}
test('known workspace text/background color pairs meet WCAG AA normal text 4.5:1',()=>{
 const pairs=[
  ['sidebar items','#f7f4ef','#172b4d'],
  ['breadcrumb','#5c6678','#ffffff'],
  ['outline button','#263f63','#ffffff'],
  ['mobile nav','#5c6678','#ffffff'],
  ['primary button','#ffffff','#172b4d'],
  ['live badge','#9d3024','#ffebe6'],
  ['muted copy','#5c6678','#ffffff']
 ];
 for(const [name,fg,bg] of pairs)assert.ok(contrast(fg,bg)>=4.5,
  name+' '+contrast(fg,bg).toFixed(2)+':1 fails AA');
 assert.match(workspace,/--tk-teal:#263F63/);
 assert.match(workspace,/\.workspace-sidebar \.workspace-nav a/);
});
test('Home and Workspace navigation are distinct with accessible active-state',()=>{
 assert.match(layout,/class="workspace-home-rail"/);
 assert.match(layout,/class="workspace-sidebar"/);
 assert.match(layout,/class="workspace-breadcrumb"/);
 assert.match(layout,/aria-current=\{isCurrent\(m\.key\)\?'page'/);
 assert.match(layout,/aria-expanded=\{moreOpen\}/);
 assert.match(layout,/const secondaryModules=modules\.slice\(4\)/);
});
test('mobile nav has touch targets and breakpoints for small phones and tablets',()=>{
 assert.match(workspace,/min-height:62px/);
 assert.match(workspace,/@media\(max-width:380px\)/);
 assert.match(workspace,/@media\(max-width:767px\)/);
 assert.match(workspace,/@media\(max-width:1280px\)/);
});
test('CI exports only PUBLIC visual screenshots, never authenticated UI evidence',()=>{
 assert.match(workflow,/name: next-ui-public-layout-images/);
 assert.match(workflow,/path: next-ui\/public-visuals\//);
 assert.doesNotMatch(workflow,/TOPKEY_ADMIN_STORAGE_B64[^\n]*artifact/);
});
