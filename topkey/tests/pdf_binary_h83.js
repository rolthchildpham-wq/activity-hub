const fs=require('fs'),vm=require('vm'),assert=require('assert');
function load(file){
 const document={getElementById:()=>null,createElement:()=>({}),body:{appendChild(){}},head:{appendChild(){}},readyState:'complete',addEventListener(){}};
 const App={state:{config:{prizeStructure:[]}}};
 const T={App,U:{},SPORT:{key:'badminton',name:'Cầu lông',mode:'score'},AUTH_ROOT:'topkey_badminton_vnext_2026',ROOT:'topkey_badminton_vnext_2026',DEFAULT_RULES:{}};
 const ctx={console,window:null,document,Topkey:T,TopkeyUpgrade9:{},TopkeyUpgrade122Hotfix65:{buildReport(){return{}}},setTimeout(){return 0},setInterval(){return 0},clearTimeout(){},clearInterval(){},Date,Intl,JSON,String,Number,Math,URLSearchParams,Blob,TextEncoder,atob,URL};ctx.window=ctx;vm.createContext(ctx);vm.runInContext(fs.readFileSync(file,'utf8'),ctx,{filename:file});return ctx.TopkeyUpgrade122Hotfix79;
}
(async()=>{const api=load('sports/badminton/upgrade122-hotfix80.js');assert.equal(typeof api.buildImagePdf,'function');const imgs=[1,2].map(i=>'data:image/jpeg;base64,'+fs.readFileSync(`tests/fixtures/pdf_page_${i}.jpg`).toString('base64'));const blob=api.buildImagePdf(imgs);assert(blob.size>30000);const out='/mnt/data/topkey_h83_pdf_smoke.pdf';fs.writeFileSync(out,Buffer.from(await blob.arrayBuffer()));console.log('PDF_BINARY_OK',blob.size,out)})().catch(e=>{console.error(e);process.exit(1)});
