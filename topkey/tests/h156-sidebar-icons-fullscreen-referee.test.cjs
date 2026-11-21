'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
const js=fs.readFileSync('topkey/sports/vnext/src/fullscreen-referee-h156.js','utf8');
const css=fs.readFileSync('topkey/sports/vnext/fullscreen-referee-h156.css','utf8');
const html=fs.readFileSync('topkey/sports/vnext/index.html','utf8');
test('H156 assets load after old H155 and CSS remains scoped',()=>{
 for(const p of ['fullscreen-referee-h156.css','fullscreen-referee-h156.js'])
   assert.equal(html.split(p).length-1,1);
 assert.ok(html.indexOf('fullscreen-referee-h156.css')>html.indexOf('live-two-scroll-h155.css'));
 assert.ok(html.indexOf('fullscreen-referee-h156.js')>html.indexOf('live-two-scroll-h155.js'));
 assert.match(css,/#tk144-live-studio \.tk144-official-pane/);
 assert.match(css,/overflow-y:auto!important/);
 assert.equal((css.match(/\{/g)||[]).length,(css.match(/\}/g)||[]).length);
});
test('No duplicated event handlers: shortcuts only scroll to original buttons',()=>{
 assert.match(js,/matchAction\(board,config\.test\)/);
 assert.match(js,/pane\.scrollTop/);
 assert.match(js,/button\.focus/);
 assert.doesNotMatch(js,/target\.click\(|dispatchEvent\(/);
 assert.doesNotMatch(js,/queueSet|queueMulti|firebase\.database|\.ref\(/);
});
test('Navigation strips second glyph without deleting translated label',()=>{
 const button={
   childNodes:[],
   querySelectorAll(){return[]}
 };
 const textNode={nodeType:3,textContent:'▦ Tổng quan'};
 button.childNodes=[textNode];
 const nav={querySelectorAll(){return[button]}};
 const window={__TOPKEY_PUBLIC_ROUTE:false,addEventListener(){}};
 const ctx={window,document:{readyState:'loading',addEventListener(){},
   getElementById(){return nav},querySelector(){return nav}},Promise,MutationObserver:function(){this.observe=()=>{}},
   console};
 vm.runInNewContext(js,ctx,{timeout:1000});
 assert.equal(window.TopkeyH156.normalizeNavigation(),true);
 assert.equal(textNode.textContent,'Tổng quan');
 assert.equal(window.TopkeyH156.normalizeNavigation(),true);
 assert.equal(textNode.textContent,'Tổng quan');
});
test('Full screen scrollbar keeps referee controls reachable',()=>{
 assert.match(css,/#tk144-live-studio:fullscreen \.tk144-official-pane/);
 assert.match(css,/max-height:100%!important/);
 assert.match(css,/#umpire-board[\s\S]*max-height:none!important/);
 assert.match(css,/position:sticky/);
 assert.match(js,/Thay người/);
 assert.match(js,/Thẻ \/ Phạt/);
 assert.match(js,/Timeout/);
});
