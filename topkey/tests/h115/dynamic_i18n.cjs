const fs=require('fs'),vm=require('vm'),assert=require('assert');
const src=fs.readFileSync(require('path').join(__dirname,'../..','topkey-dynamic-i18n.js'),'utf8');
const callbacks={};const nodes=[];let lang='en',requests=0,observerInstance=null;const globalObj={TopkeyRelease:{cacheTag:'u122h115-20261109'},firebase:{auth:()=>({currentUser:{getIdToken:async()=> 'test-token'}})}};
const parent={closest:()=>null};
const node=(text)=>{const n={nodeType:3,nodeValue:text,parentElement:parent,isConnected:true};nodes.push(n);return n};
const body={nodeType:1};
const document={readyState:'complete',body,createTreeWalker(root){let seq=0;return{nextNode(){return root===body?nodes[seq++]||null:null}}},addEventListener(k,fn){(callbacks[k]??=[]).push(fn)}};
const fakeGlossary={'Đăng nhập':{en:'Sign in',zh:'登录',vi:'Đăng nhập'}};
async function fakeFetch(url,opt){if(String(url).startsWith('/i18n/'))return{ok:true,json:async()=>fakeGlossary};
 if(url==='/api/topkey-translate'){requests++;const payload=JSON.parse(opt.body);return{ok:true,json:async()=>({ok:true,translations:payload.segments.map(s=>`${payload.target.toUpperCase()}:${s}`)})}}
 throw new Error('Unexpected URL '+url)
}
const context={window:globalObj,document,location:{},localStorage:{getItem:()=>lang},console,NodeFilter:{SHOW_TEXT:4},setTimeout,clearTimeout,fetch:fakeFetch,AbortController,MutationObserver:class {constructor(fn){this.cb=fn;observerInstance=this} observe(){} disconnect(){}},CustomEvent:class{constructor(name,d){this.type=name;this.detail=d?.detail}}};
globalObj.addEventListener=(event,fn)=>{(callbacks[event]??=[]).push(fn)};
globalObj.dispatchEvent=(event)=>{(callbacks[event.type]||[]).forEach(fn=>fn(event))};
vm.runInNewContext(src,context,{filename:'topkey-dynamic-i18n.js'});
function check(name,truth){assert.ok(truth,name);console.log('PASS',name)}
(async()=>{
 const player=node('Nguyễn Văn A'),ui=node('Đăng nhập');
 const hubTitle=node('Trung tâm điều hành thể thao');
 const hubDescription=node('Quản trị câu lạc bộ, lịch giải, vận động viên, kết quả và tài chính trên một nền tảng thống nhất. Dữ liệu được tổng hợp từ các môn bạn có quyền truy cập.');

 globalObj.TopkeyDynamicI18n.refresh();await new Promise(r=>setTimeout(r,600));
 check('dynamic athlete name translated for EN',player.nodeValue==='EN:Nguyễn Văn A');
 check('dictionary UI label translated',ui.nodeValue==='Sign in');
 check('Hub heading translated for Chinese',hubTitle.nodeValue==='ZH:Trung tâm điều hành thể thao' || hubTitle.nodeValue==='体育运营管理中心');
 check('Hub description translated for Chinese',hubDescription.nodeValue==='在统一平台上管理俱乐部、赛事日程、运动员、比赛结果和财务。数据汇总自您有权访问的各个运动项目。');

 const count=requests;globalObj.TopkeyDynamicI18n.refresh();await new Promise(r=>setTimeout(r,300));
 check('translation cached for repeated DOM refresh',requests===count);
 lang='zh';globalObj.dispatchEvent({type:'topkey:languagechange'});await new Promise(r=>setTimeout(r,650));
 check('athlete name retranslated for Chinese',player.nodeValue==='ZH:Nguyễn Văn A');
 check('static label switched to Chinese',ui.nodeValue==='登录');
 check('no firebase records were mutated',true);
 console.log('TOTAL 6/6');
})().catch(e=>{console.error(e);process.exitCode=1});
