const fs=require('fs'),vm=require('vm'),assert=require('assert');
function load(file,lang,sportKey='badminton',sportName='Cầu lông'){
 const langEl={value:lang},finalEl={value:'KHOẢNH KHẮC ĐÁNG NHỚ'};
 const document={getElementById:id=>id==='tk79-lang'?langEl:id==='tk79-final-title'?finalEl:null,createElement:()=>({}),body:{appendChild(){}},head:{appendChild(){}},readyState:'complete',addEventListener(){}};
 const T={App:{state:{config:{prizeStructure:[]}}},U:{},SPORT:{key:sportKey,name:sportName,mode:'sets'},AUTH_ROOT:'x',ROOT:'x',DEFAULT_RULES:{}};
 const ctx={console,window:null,document,Topkey:T,TopkeyUpgrade9:{},TopkeyUpgrade122Hotfix65:{buildReport(){return{}}},setTimeout(){return 0},setInterval(){return 0},clearTimeout(){},clearInterval(){},Date,Intl,JSON,String,Number,Math,URLSearchParams,Blob:function(){},FileReader:function(){}};ctx.window=ctx;vm.createContext(ctx);vm.runInContext(fs.readFileSync(file,'utf8'),ctx,{filename:file});return ctx.TopkeyUpgrade122Hotfix79;
}
const fixture={generatedAt:1794020400000,sportName:'Cầu lông',title:'PRODUCTION FIXTURE · CẦU LÔNG · u122',tid:'__testlab',summary:{teams:8,participants:16,finished:2,matches:2,categories:2},top4:{MD:[{rank:1,name:'Alpha'}]},prizeStructure:[{name:'Giải Nhất',quantity:2,reward:'Quà lưu niệm',note:'Mỗi giải'},{name:'Quà toàn giải',quantity:16,reward:'Quà lưu niệm',note:'Tất cả thành viên tham gia'}],rankings:{MD:[{rank:1,name:'Alpha',played:2,w:2,d:0,l:0,for:4,against:0,points:2}]},matches:[{date:'2026-11-07',time:'08:00',category:'MD',stage:'GROUP',teamA:'Alpha',teamB:'Beta',result:'21-15',status:'FINISHED'},{date:'2026-11-07',time:'09:00',category:'WD',stage:'SEMIFINAL',teamA:'Epsilon',teamB:'Zeta',result:'—',status:'WALKOVER'}],finance:{income:10000000,expense:4200000,balance:5800000,pending:1,rows:[{date:'2026-11-07',type:'INCOME',category:'Tài trợ test',amount:10000000,status:'PAID',note:'Production fixture'},{date:'2026-11-07',type:'EXPENSE',category:'Thuê sân test',amount:3000000,status:'APPROVED',note:'Dữ liệu giả'}]}};
for(const file of ['sports/badminton/upgrade122-hotfix80.js','sports/vnext/src/upgrade122-hotfix80.js'])for(const lang of ['vi-en','vi-zh','en-vi-zh']){
 const api=load(file,lang);const h=api.reportHtml(fixture,[]);
 for(const raw of ['>FINISHED<','>WALKOVER<','>INCOME<','>EXPENSE<','>PAID<','>APPROVED<','>GROUP<','>SEMIFINAL<'])assert(!h.includes(raw),`${file} ${lang} raw ${raw}`);
 assert(!api.titleText(fixture.title).includes('Cầu lông / Badminton / 羽毛球 / Badminton'), 'recursive sport translation');
 if(lang==='vi-zh'){for(const x of ['全賽事報告','羽毛球','男子雙打','小組賽','已結束','棄權勝','收入','支出','已付款','已批准','測試贊助','測試場地租金','正式環境測試資料','全賽事財務'])assert(h.includes(x),`${file} missing ${x}`)}
 if(lang==='vi-en'){for(const x of ['FINAL TOURNAMENT REPORT','Badminton','Men&#39;s Doubles','Group stage','Finished','Walkover','Income','Expense','Paid','Approved','Test sponsorship','TOURNAMENT FINANCE'])assert(h.includes(x),`${file} missing ${x}`)}
 if(lang==='en-vi-zh'){for(const x of ['FINAL TOURNAMENT REPORT','全賽事報告','Badminton','羽毛球','Income','收入','TOURNAMENT FINANCE','全賽事財務'])assert(h.includes(x),`${file} missing ${x}`)}
 console.log('PASS_TRANSLATION',file,lang,h.length)
}
console.log('REPORT_TRANSLATION_H88_OK 6');
