'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const src=fs.readFileSync('topkey/sports/vnext/src/commentary-audio-h160.js','utf8');
const html=fs.readFileSync('topkey/sports/vnext/index.html','utf8');
function make(){
 const played=[],controls={};
 const values={'auto-commentary':{checked:true},'blv-volume':{value:'1'},'blv-rate':{value:'1'},'blv-pitch':{value:'1'},'tk154-voice-mode':{value:'device'}};
 const app={audioUnlocked:true,lastSpokenCommentId:null,speakCommentary(){return 'original'}};
 function Utterance(text){this.text=text}
 const window={
  Topkey:{App:app,SPORT:{key:'volleyball'}},
  speechSynthesis:{cancel(){},getVoices:()=>[{name:'English',lang:'en-US'},{name:'Google Vietnamese',lang:'vi-VN'}],speak(u){played.push(u)}},
  addEventListener(){},
  __TOPKEY_VNEXT_BOOT:null
 };
 const document={
  readyState:'loading',addEventListener(){},
  getElementById(id){return values[id]||null}
 };
 const context={window,document,SpeechSynthesisUtterance:Utterance,console};
 vm.runInNewContext(src,context,{timeout:1000});
 return {api:window.TopkeyAudioH160,played,app,values,window,controls};
}
test('selects Vietnamese voice and does not speak English for score',()=>{
 const {api}=make();
 assert.equal(api.bestVietnameseVoice().lang,'vi-VN');
});
test('plays one score and suppresses duplicate ID',()=>{
 const h=make();
 const row={id:'score001',text:'Đội A 5, Đội B 4.'};
 assert.equal(h.api.playLocal(row),true);
 assert.equal(h.played.length,1);
 assert.equal(h.played[0].voice.lang,'vi-VN');
 assert.equal(h.api.playLocal(row),false);
 assert.equal(h.played.length,1);
});
test('auto voice stays quiet until operator unlocks, explicit manual/test can read',()=>{
 const h=make();
 h.app.audioUnlocked=false;
 assert.equal(h.api.playLocal({id:'score002',text:'Đội A 1, Đội B 0.'}),false);
 assert.equal(h.api.playLocal({id:'test001',text:'Test BLV'},{force:true}),true);
 assert.equal(h.played.length,1);
});
test('volume zero explicitly reports failure and avoids marking scored item as spoken',()=>{
 const h=make();
 h.values['blv-volume'].value='0';
 assert.equal(h.api.playLocal({id:'score003',text:'Đội A ghi điểm.'}),false);
 assert.equal(h.app.lastSpokenCommentId,null);
});
test('screen uses H160 after H154 and does not create Firebase writes',()=>{
 assert.ok(html.indexOf('commentary-audio-h160.js')>html.indexOf('live-publisher-h154.js'));
 assert.equal(html.split('commentary-audio-h160.js').length-1,1);
 assert.ok(/canva-sports-ui\.css\?v=canva-sports-v\d+-202611\d+/.test(html));
 assert.match(src,/topkey_auto_blv/);
 assert.match(src,/tk153_manual_/);
 assert.doesNotMatch(src,/queueSet\(|queueMulti\(|\.ref\(|firebase\.database/);
});
test('fallback to device while neural disabled, no promise of YouTube audio mixing',()=>{
 assert.match(src,/neural\.value='device'/);
 assert.match(src,/opt\.disabled=true/);
 assert.match(src,/không tự truyền vào YouTube/);
});
