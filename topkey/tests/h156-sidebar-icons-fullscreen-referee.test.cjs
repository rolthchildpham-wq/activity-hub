'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
const js=fs.readFileSync('topkey/sports/vnext/src/fullscreen-referee-h156.js','utf8');
const css=fs.readFileSync('topkey/sports/vnext/canva-sports-ui.css','utf8');
const html=fs.readFileSync('topkey/sports/vnext/index.html','utf8');
test('H156 referee script remains and its visual rules live in Canva CSS',()=>{
 assert.equal(html.split('fullscreen-referee-h156.js').length-1,1);
 assert.ok(/canva-sports-ui\.css\?v=canva-sports-v\d+-202611\d+/.test(html));
 assert.ok(!html.includes('fullscreen-referee-h156.css'));
 assert.ok(html.indexOf('fullscreen-referee-h156.js')>html.indexOf('live-two-scroll-h155.js'));
 assert.ok(css.includes('#tk144-live-studio .tk144-official-pane'));
 assert.ok(css.includes('overflow-y:auto'));
 assert.equal(css.split('{').length,css.split('}').length);
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
 assert.ok(css.includes('max-height:100%'));
 assert.ok(css.includes('#umpire-board')&&css.includes('max-height:none'));
 assert.match(css,/position:sticky/);
 assert.match(js,/Thay người/);
 assert.match(js,/Thẻ \/ Phạt/);
 assert.match(js,/Timeout/);
});
