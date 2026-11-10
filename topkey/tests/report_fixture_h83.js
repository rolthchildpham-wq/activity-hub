const fs=require('fs'),vm=require('vm'),assert=require('assert');
function load(file,lang){
 const langEl={value:lang};
 const document={getElementById:id=>id==='tk79-lang'?langEl:null,createElement:()=>({}),body:{appendChild(){}},readyState:'complete',addEventListener(){}};
 const App={state:{config:{prizeStructure:[]}}};
 const T={App,U:{},SPORT:{key:'badminton',name:'Cầu lông',mode:'score'},AUTH_ROOT:'topkey_badminton_vnext_2026',ROOT:'topkey_badminton_vnext_2026',DEFAULT_RULES:{}};
 const ctx={console,window:null,document,Topkey:T,TopkeyUpgrade9:{},TopkeyUpgrade122Hotfix65:{buildReport(){return{}}},setTimeout(){return 0},setInterval(){return 0},clearTimeout(){},clearInterval(){},Date,Intl,JSON,String,Number,Math,URLSearchParams,Blob:function(){},FileReader:function(){}};ctx.window=ctx;vm.createContext(ctx);vm.runInContext(fs.readFileSync(file,'utf8'),ctx,{filename:file});return ctx.TopkeyUpgrade122Hotfix79;
}
const fixture={generatedAt:1794020400000,sportName:'Cầu lông',title:'GIẢ ĐỊNH H83',tid:'__testlab_h83',summary:{teams:8,participants:16,finished:11,total:11,categories:3},top4:{MD:[{rank:1,name:'Đôi Nam Alpha'},{rank:2,name:'Đôi Nam Beta'},{rank:3,name:'Đôi Nam Gamma'}]},prizeStructure:[{name:'Giải Nhất',quantity:2,reward:'1.000.000 VND',note:'Mỗi giải'},{name:'Quà toàn giải',quantity:16,reward:'Quà lưu niệm',note:''}],rankings:{MD:[{rank:1,name:'Đôi Nam Alpha',played:2,w:2,d:0,l:0,setDiff:4,pointDiff:20,points:6}]},matches:[{code:'M01',date:'2026-11-07',time:'08:00',category:'MD',stage:'Vòng bảng',teamA:'Alpha',teamB:'Beta',result:'21-15 | 21-18',status:'FINISHED'}],finance:{income:1000000,expense:200000,balance:800000,pending:0,rows:[{date:'2026-11-07',type:'INCOME',category:'Tài trợ',amount:1000000,status:'PAID',note:'Fixture'}]}};
const imgs=[{id:'i1',data:'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAAB',position:'final',hasTitle:true,title:'Khoảnh khắc trao giải'}];
for(const file of ['sports/badminton/upgrade122-hotfix80.js','sports/vnext/src/upgrade122-hotfix80.js']){
 for(const lang of ['vi-en','vi-zh','en-vi-zh']){
  const api=load(file,lang);assert(api&&typeof api.reportHtml==='function');const h=api.reportHtml(fixture,imgs);assert(h.length>3500,'report too small');assert(h.includes('GIẢ ĐỊNH H83'));assert(h.includes('Giải Nhất'));assert(h.includes('1.000.000 VND'));assert(h.includes('Khoảnh khắc trao giải'));assert(h.includes('data:image/png;base64'));assert(h.includes('Alpha'));assert(h.includes('1.000.000 ₫')||h.includes('1.000.000'));if(lang==='vi-en'){assert(h.includes('FINAL TOURNAMENT REPORT'));assert(h.includes('STANDINGS'));assert(h.includes('SCHEDULE &amp; RESULTS')||h.includes('SCHEDULE & RESULTS'));assert(h.includes('TOURNAMENT FINANCE'))}if(lang==='vi-zh'){assert(h.includes('全賽事報告'));assert(h.includes('排名'));assert(h.includes('賽程與結果'));assert(h.includes('全賽事財務'))}if(lang==='en-vi-zh'){assert(h.includes('FINAL TOURNAMENT REPORT')&&h.includes('全賽事報告'));assert(h.includes('STANDINGS')&&h.includes('排名'));assert(h.includes('TOURNAMENT FINANCE')&&h.includes('全賽事財務'))}console.log('PASS',file,lang,h.length)
 }
}
console.log('REPORT_FIXTURE_OK 6');
