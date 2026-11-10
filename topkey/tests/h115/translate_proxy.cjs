const fs=require('fs'),vm=require('vm'),assert=require('assert');
const src=fs.readFileSync(require('path').join(__dirname,'../..','edge-functions/api/topkey-translate.js'),'utf8').replace(/export async function /g,'async function ')+ '\nthis.exports={onRequestPost,onRequestGet};';
let aiCalls=0,googleCalls=0;
const fetch=async (url,opts)=>{
 if(String(url).includes('identitytoolkit.googleapis.com')){googleCalls++;return {ok:true,json:async()=>({users:[{localId:'uid123'}]})};}
 if(String(url).includes('/chat/completions')){aiCalls++;const s=JSON.parse(opts.body);const original=JSON.parse(s.messages[1].content);return {ok:true,json:async()=>({choices:[{message:{content:JSON.stringify(original.map(x=>'Chinese '+x))}}]})};}
 throw new Error('unexpected '+url)
};
const box={Response,URL,AbortSignal,fetch,console};vm.runInNewContext(src,box);
async function request(body,{token='',publicAccess=false,origin='https://topkey.example'}={}){
 const req=new Request('https://topkey.example/api/topkey-translate',{method:'POST',headers:{'content-type':'application/json','origin':origin,...token?{'authorization':'Bearer '+token}:{}},body:JSON.stringify(body)});
 const ctx={request:req,env:{MAKERS_MODELS_KEY:'test-key',TOPKEY_TRANSLATE_PUBLIC:publicAccess?'1':'0'}};
 const resp=await box.exports.onRequestPost(ctx);return{status:resp.status,body:await resp.json()};
}
(async()=>{
 const body={target:'zh',segments:['Nguyễn Văn A','Đăng ký']};let r=await request(body);assert.strictEqual(r.status,401);console.log('PASS unauthenticated denied');
 r=await request(body,{token:'fake-token'});assert.strictEqual(r.status,200);assert.deepStrictEqual(Array.from(r.body.translations),['Chinese Nguyễn Văn A','Chinese Đăng ký']);console.log('PASS authenticated translation batch');
 r=await request(body,{publicAccess:true});assert.strictEqual(r.status,200);console.log('PASS public translation only when explicitly enabled');
 r=await request(body,{token:'fake-token',origin:'https://evil.example'});assert.strictEqual(r.status,403);console.log('PASS mismatched Origin denied');
 r=await request({target:'xx',segments:['a']},{token:'fake-token'});assert.strictEqual(r.status,400);console.log('PASS unknown locale rejected');
 r=await request({target:'en',segments:Array(30).fill('A')},{token:'fake-token'});assert.strictEqual(r.status,400);console.log('PASS excessive batch rejected');
 console.log('TOTAL 6/6');
})().catch(e=>{console.error(e);process.exitCode=1})
