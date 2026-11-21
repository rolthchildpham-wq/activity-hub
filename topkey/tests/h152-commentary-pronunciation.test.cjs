'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
const src=fs.readFileSync('topkey/sports/vnext/src/commentary-pronunciation-h152.js','utf8');
const html=fs.readFileSync('topkey/sports/vnext/index.html','utf8');
function create(){
 const speakCalls=[],ctx={
  window:{addEventListener(){},__TOPKEY_PUBLIC_ROUTE:false,
   speechSynthesis:{getVoices(){return [
    {lang:'en-US',name:'Microsoft Jenny Natural'},
    {lang:'en-GB',name:'British English'},
    {lang:'zh-CN',name:'Mandarin neural'},
    {lang:'vi-VN',name:'Vietnamese'}
   ]},cancel(){},speak(u){speakCalls.push(u)}}},
  document:{readyState:'loading',addEventListener(){}},
  SpeechSynthesisUtterance:function(t){this.text=t},
  console
 };
 vm.runInNewContext(src,ctx,{timeout:1000});
 return {api:ctx.window.TopkeyCommentaryH152,speakCalls};
}
test('English US/UK voice and Mandarin exact language matching',()=>{
 const {api}=create();
 assert.equal(api.localeFor('en'),'en-US');
 assert.equal(api.localeFor('gb'),'en-GB');
 assert.equal(api.localeFor('zh'),'zh-CN');
 assert.equal(api.bestVoice('en-US',[{lang:'vi-VN',name:'Vietnamese'}]),null);
});
test('IPA needs written English original and never reads symbols as prose',()=>{
 const {api}=create();
 assert.equal(api.normalize('/həˈloʊ/','en-US','hello'),'hello');
 assert.throws(()=>api.normalize('/həˈloʊ/','en-US'),/IPA/);
});
test('Pinyin requires Hanzi, and preserves Mandarin characters for tones',()=>{
 const {api}=create();
 assert.equal(api.normalize('nǐ hǎo','zh-CN','你好'),'你好');
 assert.throws(()=>api.normalize('nǐ hǎo','zh-CN'),/Pinyin/);
 assert.equal(api.normalize('你好','zh-CN'),'你好');
});
test('Chinese-English segments never use a mismatched voice',async()=>{
 const {api,speakCalls}=create();
 const pending=api.speak('你好 hello',{lang:'mix'});
 assert.equal(speakCalls[0].lang,'zh-CN');
 assert.equal(speakCalls[0].voice.lang,'zh-CN');
 speakCalls[0].onend();
 assert.equal(speakCalls[1].lang,'en-US');
 assert.equal(speakCalls[1].voice.lang,'en-US');
 speakCalls[1].onend();
 assert.equal(await pending,true);
});
test('Sports Hub loads component only on Admin VNext; no Firebase modifications',()=>{
 assert.match(html,/commentary-pronunciation-h152\.js\?v=h152-20261121/);
 assert.match(src,/__TOPKEY_PUBLIC_ROUTE/);
 assert.doesNotMatch(src,/queueSet|queueMulti|firebase\.database|\.ref\(/);
});
