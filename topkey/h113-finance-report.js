/* TOPKEY H114: PDF/Excel/photo source evidence is printed as visible appendix pages.
 * Read-only. No Firebase data, scoring, or permission writes. */
(()=>{'use strict';
if(window.TopkeyFinanceReportH113)return;
const WIN=window,DOC=document;
const T=WIN.Topkey=WIN.Topkey||{};
const STR=v=>String(v==null?'':v), NUM=v=>{const n=Number(v);return Number.isFinite(n)?n:0};
const MONEY=v=>new Intl.NumberFormat('vi-VN').format(NUM(v))+' VND';
const safeFile=s=>(STR(s).normalize('NFKC').replace(/[\\/:*?"<>|\x00-\x1f]/g,' ').replace(/\s+/g,' ').trim().slice(0,95)||'TOPKEY');
const safeHtml=s=>STR(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const timestamp=()=>new Date().toLocaleString('vi-VN');
const dataURLtoBytes=v=>{const b=atob(STR(v).split(',')[1]||'');const out=new Uint8Array(b.length);for(let i=0;i<b.length;i++)out[i]=b.charCodeAt(i);return out};
const textEncoder=new TextEncoder();
const MSG={
 vi:{name:'Báo cáo tài chính',csv:'Xuất CSV tài chính',pdf:'Xuất PDF + chứng từ',print:'In / Lưu PDF',header:'BÁO CÁO TÀI CHÍNH TOÀN GIẢI',appendix:'PHỤ LỤC CHỨNG TỪ',item:'Chứng từ của hạng mục',missing:'Chưa có chứng từ',pfile:'Chứng từ PDF gốc được đính kèm trong tệp này; xem trong danh sách Attachments của trình đọc PDF.',busy:'Đang tạo báo cáo và tải chứng từ…',error:'Không thể xuất đầy đủ báo cáo tài chính: ',ready:'Đã tạo báo cáo',none:'Không có giao dịch',origin:'Dữ liệu đầy đủ được kiểm tra tại thời điểm xuất'},
 en:{name:'Financial report',csv:'Export finance CSV',pdf:'Export PDF + receipts',print:'Print / Save PDF',header:'TOURNAMENT FINANCIAL REPORT',appendix:'RECEIPT APPENDIX',item:'Receipt for category',missing:'No receipt provided',pfile:'The original PDF receipt is embedded in this file. Open the PDF viewer Attachments panel to view it.',busy:'Preparing verified report and receipts…',error:'Cannot export a complete financial report: ',ready:'Report created',none:'No transactions',origin:'Full data verified at export time'},
 zh:{name:'财务报告',csv:'导出财务 CSV',pdf:'导出 PDF + 凭证',print:'打印 / 保存 PDF',header:'赛事财务报告',appendix:'凭证附件',item:'项目凭证',missing:'未上传凭证',pfile:'原始 PDF 凭证已作为附件嵌入此文件。请在 PDF 阅读器的“附件”面板查看。',busy:'正在核对数据并载入凭证…',error:'无法导出完整财务报告：',ready:'报告已生成',none:'暂无交易记录',origin:'导出时已核对完整数据'}
};
function language(){const lang=STR(WIN.TopkeyI18n?.language||WIN.TopkeyI18n?.getLanguage?.()||localStorage.getItem('topkey_ui_language_v1')||'vi').toLowerCase();return lang.startsWith('zh')?'zh':lang.startsWith('en')?'en':'vi'}
function tr(k){return MSG[language()][k]||MSG.vi[k]||k}
function financeAccess(){const auth=T?.Auth;const role=STR(auth?.role?.()||auth?.profile?.role).toUpperCase();if(!auth?.user?.uid||!auth?.profile||auth.profile.active===false)return false;if(role==='ADMIN')return true;return Boolean(auth.can?.('finance')||['view','edit'].includes(auth.profile?.permissions?.modules?.finance));}
function normalized(x,key){const row=x&&typeof x==='object'?x:{};return {...row,id:STR(row.id||key),type:STR(row.type).toUpperCase(),amount:Number(row.amount),status:STR(row.status||'REQUESTED').toUpperCase(),category:STR(row.category||'—'),date:STR(row.date||''),invoice:STR(row.invoice||''),note:STR(row.note||''),receiptName:STR(row.receiptName||''),receiptState:STR(row.receiptState||'NONE').toUpperCase()}}
function normalizeRows(value){const rows=Array.isArray(value)?value.map((v,i)=>normalized(v,i)):Object.entries(value||{}).map(([k,v])=>normalized(v,k));const ids=new Set();for(const row of rows){if(!row.id||ids.has(row.id))throw Error('Duplicate/missing finance ID: '+row.id);ids.add(row.id);if(!Number.isFinite(row.amount)||row.amount<0)throw Error('Invalid amount: '+row.id);if(!['INCOME','EXPENSE'].includes(row.type))throw Error('Invalid finance type: '+row.id)}return rows.sort((a,b)=>(a.date||'').localeCompare(b.date||'')||(a.seq||0)-(b.seq||0)||a.id.localeCompare(b.id))}
function summary(rows){let income=0,expense=0,paidIncome=0,paidExpense=0,pending=0;for(const row of rows){if(row.type==='INCOME'){income+=row.amount;if(row.status==='PAID')paidIncome+=row.amount}else{expense+=row.amount;if(row.status==='PAID')paidExpense+=row.amount}if(row.status!=='PAID')pending++}return{income,expense,balance:income-expense,paidIncome,paidExpense,paidBalance:paidIncome-paidExpense,pending,count:rows.length}}
function getTitle(){return STR(T?.App?.state?.config?.title||DOC.getElementById('tournament-title')?.textContent||T?.SPORT?.name||'TOPKEY').trim()}
async function collectRows(opts={}){
 if(opts.rows)return normalizeRows(opts.rows);
 if(!financeAccess())throw Error('Tài khoản chưa được xác minh quyền xem tài chính.');
 const data=T?.Data,app=T?.App;if(!data||!app||!data.ready)throw Error('Firebase chưa sẵn sàng.');
 if(data.connected===false||navigator.onLine===false)throw Error('Đang ngoại tuyến; không được xuất báo cáo từ dữ liệu chưa đồng bộ.');
 if(WIN.TopkeyH104?.requireFull){await WIN.TopkeyH104.requireFull(['finance'],'xuất báo cáo tài chính');const st=WIN.TopkeyH104.state?.finance;if(st&&!st.complete)throw Error('Dữ liệu phân trang chưa được xác minh đầy đủ.');return normalizeRows(app.state?.finance||{})}
 if(typeof data.read!=='function')throw Error('Không có API đọc dữ liệu Firebase.');
 const all=await data.read('finance');return normalizeRows(all||{});
}
function CSV(rows){const cols=['STT','Mã giao dịch','Ngày','Loại','Hạng mục','Số tiền (VND)','Trạng thái','Số chứng từ','Tên chứng từ','Trạng thái chứng từ','Link chứng từ','Ghi chú'];const cell=x=>{let s=STR(x);if(/^[\s]*[=+@-]/.test(s))s="'"+s;return '"'+s.replace(/"/g,'""')+'"'};const lines=rows.map((r,i)=>[i+1,r.id,r.date,r.type,r.category,r.amount,r.status,r.invoice,r.receiptName,r.receiptState,r.receiptUrl||'',r.note].map(cell).join(','));const stats=summary(rows);lines.push(['','TỔNG THU','','','',stats.income].map(cell).join(','),['','TỔNG CHI','','','',stats.expense].map(cell).join(','),['','SỐ DƯ','','','',stats.balance].map(cell).join(','));return '\ufeff'+[cols.map(cell).join(','),...lines].join('\r\n')+'\r\n'}
function saveBlob(blob,filename){const url=URL.createObjectURL(blob),a=DOC.createElement('a');a.href=url;a.download=filename;DOC.body.appendChild(a);a.click();setTimeout(()=>{a.remove();URL.revokeObjectURL(url)},30000)}
async function fetchTimeout(url,maxBytes=18000000){const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),20000);try{const r=await fetch(url,{mode:'cors',credentials:'omit',signal:controller.signal});if(!r.ok)throw Error('HTTP '+r.status);const len=Number(r.headers.get('content-length')||0);if(len>maxBytes)throw Error('Chứng từ vượt giới hạn '+Math.round(maxBytes/1e6)+' MB');const blob=await r.blob();if(blob.size>maxBytes)throw Error('Chứng từ quá lớn');return blob}finally{clearTimeout(timeout)}}
function attachmentsFor(row){const list=[];const add=(a,i)=>{if(!a)return;const url=STR(a.url||a.receiptUrl||a.downloadURL||''),name=STR(a.name||a.receiptName||row.receiptName||('chung_tu_'+i));if(!url&&!a.data&&!a.blob)return;list.push({url,name,kind:STR(a.type||a.mime||''),data:a.data,blob:a.blob})};if(Array.isArray(row.attachments))row.attachments.forEach(add);if(Array.isArray(row.receipts))row.receipts.forEach(add);if(row.receiptUrl)add({url:row.receiptUrl,name:row.receiptName},0);return list.filter((a,i,arr)=>arr.findIndex(b=>a.url?b.url===a.url:(b.name===a.name&&b.blob===a.blob))===i)}
async function collectReceipts(rows,{local=true}={}){
 const result=[],missing=[],MAX_TOTAL=90000000;let total=0;
 for(const [idx,row] of rows.entries()){
   const listed=attachmentsFor(row);if(!listed.length&&local&&T?.idb?.get){try{const r=await T.idb.get('receipts',row.id);if(r?.file)listed.push({blob:r.file,name:STR(r.name||row.receiptName||r.file.name||'chung_tu'),kind:r.file.type})}catch{}}
   if(!listed.length){if(!['NONE','','NO_RECEIPT'].includes(row.receiptState)||row.receiptName)missing.push(`${row.id} – ${row.category}: ${row.receiptState||'MISSING'}`);continue}
   for(const [k,attach] of listed.entries()){
     let blob=null;try{blob=attach.blob||((attach.data&&STR(attach.data).startsWith('data:'))?new Blob([dataURLtoBytes(attach.data)],{type:STR(attach.data).slice(5,STR(attach.data).indexOf(';'))}):await fetchTimeout(attach.url));}catch(e){if(local&&T?.idb?.get){try{const cached=await T.idb.get('receipts',row.id);blob=cached?.file||null}catch{}}if(!blob){missing.push(`${row.id} – ${row.category}: ${e?.message||e}`);continue}}
     if(!blob||!blob.size){missing.push(`${row.id} – ${row.category}: chứng từ rỗng`);continue}
     total+=blob.size;if(total>MAX_TOTAL)throw Error('Tổng dung lượng chứng từ vượt 90 MB; vui lòng chia đợt hoặc nén chứng từ.');
     const buf=new Uint8Array(await blob.arrayBuffer()),pdf=buf[0]===37&&buf[1]===80&&buf[2]===68&&buf[3]===70&&buf[4]===45;
     const img=/^image\/(jpeg|jpg|png|webp)$/i.test(blob.type)||/\.(png|jpe?g|webp)$/i.test(attach.name);
     const xlsx=/\.xlsx$/i.test(attach.name)||/spreadsheetml/i.test(blob.type);
     if(!pdf&&!img&&!xlsx){missing.push(`${row.id} – ${row.category}: định dạng không hỗ trợ (${blob.type||attach.name})`);continue}
     result.push({row,index:idx+1,name:attach.name||row.receiptName||`${row.id}_${k}`,blob:blob.type?blob:new Blob([buf],{type:pdf?'application/pdf':'image/jpeg'}),kind:pdf?'pdf':xlsx?'xlsx':'image',bytes:buf});
   }
 }
 return{receipts:result,missing,bytes:total};
}
const P_W=1123,P_H=794,P_SCALE=1.8;
function pdfText(ctx,value,x,y,opts={}){const size=opts.size||18,color=opts.color||'#15324c',weight=opts.bold?'700':'400',max=opts.max||980,step=opts.step||Math.round(size*1.4);ctx.font=`${weight} ${size}px Arial, sans-serif`;ctx.fillStyle=color;ctx.textBaseline='top';const lines=[];for(const para of STR(value).split('\n')){let line='';for(const word of para.split(/\s+/)){const proposed=line?line+' '+word:word;if(ctx.measureText(proposed).width<=max)line=proposed;else{if(line)lines.push(line);line=word;while(line&&ctx.measureText(line).width>max){let n=line.length;while(n>1&&ctx.measureText(line.slice(0,n)).width>max)n--;lines.push(line.slice(0,n));line=line.slice(n)}}}lines.push(line)}for(const line of lines){ctx.fillText(line,x,y);y+=step}return y}
function drawPage(title,body){const can=DOC.createElement('canvas');can.width=Math.round(P_W*P_SCALE);can.height=Math.round(P_H*P_SCALE);const ctx=can.getContext('2d',{alpha:false});ctx.scale(P_SCALE,P_SCALE);ctx.fillStyle='#fff';ctx.fillRect(0,0,P_W,P_H);ctx.fillStyle='#0b2845';ctx.fillRect(0,0,P_W,99);pdfText(ctx,title,42,27,{size:27,bold:true,color:'#ffffff',max:1000});body(ctx);ctx.strokeStyle='#cadde8';ctx.beginPath();ctx.moveTo(43,754);ctx.lineTo(P_W-43,754);ctx.stroke();pdfText(ctx,'TOPKEY SPORTS • Báo cáo tài chính / Financial Report',43,762,{size:12,color:'#657e90'});return can}
function jpeg(canvas){const url=canvas.toDataURL('image/jpeg',0.87);if(url.length<6500)throw Error('Trang PDF rỗng/bất thường');return dataURLtoBytes(url)}
function pdfLiteral(x){return STR(x).replace(/[^\x20-\x7e]/g,'_').replace(/[\\()]/g,m=>'\\'+m).slice(0,125)}
function utf16Hex(x){const s=STR(x);let out='FEFF';for(let i=0;i<s.length;i++)out+=s.charCodeAt(i).toString(16).padStart(4,'0').toUpperCase();return'<'+out+'>'}
function rawPdf(pages,embedded){if(!pages.length)throw Error('Không có trang PDF');const parts=[],offset=[0],enc=textEncoder;let size=0;const put=v=>{const a=typeof v==='string'?enc.encode(v):v;parts.push(a);size+=a.length};const write=(id,items)=>{offset[id]=size;put(`${id} 0 obj\n`);for(const item of items)put(item);put('\nendobj\n')};const N=pages.length,embStart=3+3*N,details=embedded.map((a,i)=>({fileId:embStart+i*3,specId:embStart+i*3+1,annotationId:embStart+i*3+2,...a}));const byPage=new Map();for(const a of details){if(!byPage.has(a.page))byPage.set(a.page,[]);byPage.get(a.page).push(a.annotationId)}
 put('%PDF-1.7\n');const names=details.map(a=>`(${pdfLiteral(a.filename)}) ${a.specId} 0 R`).join(' ');
 write(1,[`<< /Type /Catalog /Pages 2 0 R${details.length?` /Names << /EmbeddedFiles << /Names [${names}] >> >> /AF [${details.map(a=>`${a.specId} 0 R`).join(' ')}]`:''} >>`]);
 write(2,[`<< /Type /Pages /Kids [${pages.map((_,i)=>`${3+i*3} 0 R`).join(' ')}] /Count ${pages.length} >>`]);
 for(let i=0;i<N;i++){
  const page=3+i*3,imageId=page+1,contentId=page+2,anns=byPage.get(i+1)||[],im=pages[i];
  write(page,[`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 841.89 595.28] /Resources << /XObject << /Im ${imageId} 0 R >> >> /Contents ${contentId} 0 R${anns.length?` /Annots [${anns.map(id=>id+' 0 R').join(' ')}]`:''} >>`]);
  offset[imageId]=size;put(`${imageId} 0 obj\n<< /Type /XObject /Subtype /Image /Width ${Math.round(P_W*P_SCALE)} /Height ${Math.round(P_H*P_SCALE)} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${im.length} >>\nstream\n`);put(im);put('\nendstream\nendobj\n');
  const stream=enc.encode('q\n841.89 0 0 595.28 0 0 cm\n/Im Do\nQ\n');write(contentId,[`<< /Length ${stream.length} >>\nstream\n`,stream,'\nendstream']);
 }
 for(const a of details){const raw=a.bytes;offset[a.fileId]=size;put(`${a.fileId} 0 obj\n<< /Type /EmbeddedFile /Subtype /application#2Fpdf /Params << /Size ${raw.length} >> /Length ${raw.length} >>\nstream\n`);put(raw);put('\nendstream\nendobj\n');write(a.specId,[`<< /Type /Filespec /F (${pdfLiteral(a.filename)}) /UF ${utf16Hex(a.original)} /Desc ${utf16Hex(a.description)} /AFRelationship /Data /EF << /F ${a.fileId} 0 R /UF ${a.fileId} 0 R >> >>`]);write(a.annotationId,[`<< /Type /Annot /Subtype /FileAttachment /Rect [700 65 765 104] /FS ${a.specId} 0 R /Name /Paperclip /Contents ${utf16Hex(a.description)} >>`])}
 const xref=size,maxId=embStart+details.length*3-1;put(`xref\n0 ${maxId+1}\n0000000000 65535 f \n`);for(let i=1;i<=maxId;i++)put(`${String(offset[i]).padStart(10,'0')} 00000 n \n`);put(`trailer\n<< /Root 1 0 R /Size ${maxId+1} >>\nstartxref\n${xref}\n%%EOF`);return new Blob(parts,{type:'application/pdf'})
}
async function imageFromBlob(blob){const url=URL.createObjectURL(blob);try{return await new Promise((res,rej)=>{const im=new Image(),tm=setTimeout(()=>rej(Error('Ảnh chứng từ tải quá lâu')),15000);im.onload=()=>{clearTimeout(tm);res(im)};im.onerror=()=>{clearTimeout(tm);rej(Error('Không đọc được ảnh chứng từ'))};im.src=url})}finally{setTimeout(()=>URL.revokeObjectURL(url),1000)}}
/* PDF/Excel must be RENDERED in the printable document, not attached as external files. */
let pdfJsPromise=null;
async function ensurePdfJs(){
 if(WIN.pdfjsLib?.getDocument)return WIN.pdfjsLib;
 if(pdfJsPromise)return pdfJsPromise;
 pdfJsPromise=(async()=>{
  const urls=['https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js','https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.min.js'];
  for(const url of urls){try{await new Promise((resolve,reject)=>{const el=DOC.createElement('script');el.src=url;el.async=true;const timer=setTimeout(()=>{el.remove();reject(Error('PDF renderer timeout'))},12000);el.onload=()=>{clearTimeout(timer);resolve()};el.onerror=()=>{clearTimeout(timer);el.remove();reject(Error('PDF renderer download failed'))};DOC.head.appendChild(el)});if(WIN.pdfjsLib?.getDocument)return WIN.pdfjsLib}catch(e){console.warn('H114 PDF renderer',e)}}
  throw Error('Không tải được bộ xem trang PDF. Hãy kết nối mạng và thử lại. Chưa xuất báo cáo để tránh chứng từ bị trống.');
 })().catch(e=>{pdfJsPromise=null;throw e});return pdfJsPromise;
}
function textFromXml(node){return Array.from(node?.getElementsByTagName('t')||[]).map(n=>n.textContent||'').join('')}
async function excelPreview(doc){
 if(!WIN.JSZip?.loadAsync)throw Error('Thiếu bộ giải nén Excel trong website.');
 const zip=await WIN.JSZip.loadAsync(doc.bytes);const shared=[];const sharedFile=zip.file('xl/sharedStrings.xml');if(sharedFile){const xml=new DOMParser().parseFromString(await sharedFile.async('string'),'application/xml');for(const n of xml.getElementsByTagName('si'))shared.push(textFromXml(n))}
 const paths=Object.keys(zip.files).filter(n=>/^xl\/worksheets\/sheet\d+\.xml$/.test(n)).sort((a,b)=>Number(a.match(/sheet(\d+)/)[1])-Number(b.match(/sheet(\d+)/)[1]));if(!paths.length)throw Error('Excel không có sheet dữ liệu để in');
 const canvases=[];
 for(let si=0;si<paths.length;si++){
  const xml=new DOMParser().parseFromString(await zip.file(paths[si]).async('string'),'application/xml');
  const data=[];for(const row of xml.getElementsByTagName('row')){const vals=[];for(const cell of row.getElementsByTagName('c')){const raw=cell.getElementsByTagName('v')[0]?.textContent||'',txt=cell.getAttribute('t')==='s'?shared[Number(raw)]||'':cell.getAttribute('t')==='inlineStr'?textFromXml(cell):raw;const match=(cell.getAttribute('r')||'A1').match(/^[A-Z]+/);let idx=0;for(const ch of match?.[0]||'A')idx=idx*26+ch.charCodeAt(0)-64;idx-=1;if(idx>=0&&idx<12)vals[idx]=String(txt)}data.push(vals)}
  if(data.length>2500)throw Error('Excel có quá nhiều dòng. Chia nhỏ chứng từ trước khi xuất.');
  const used=data.filter(a=>a.some(v=>String(v||'').trim()));
  for(let page=0;page<Math.max(1,Math.ceil(used.length/20));page++){
   const c=DOC.createElement('canvas');c.width=1600;c.height=940;const ctx=c.getContext('2d',{alpha:false});ctx.fillStyle='#fff';ctx.fillRect(0,0,c.width,c.height);ctx.fillStyle='#123b5a';ctx.font='bold 31px Arial';ctx.fillText(`Excel · Sheet ${si+1} · trang ${page+1}`,34,56);
   const subset=used.slice(page*20,(page+1)*20);for(let i=0;i<subset.length;i++){const y=100+i*39;ctx.fillStyle=i%2?'#f6fafc':'#e8f1f7';ctx.fillRect(24,y-22,1540,39);ctx.fillStyle='#10283c';ctx.font='21px Arial';const values=subset[i].slice(0,8);values.forEach((cell,j)=>{let v=String(cell||'').replace(/\s+/g,' ');if(v.length>28)v=v.slice(0,27)+'…';ctx.fillText(v,30+j*191,y+4,185)})}canvases.push(c)
  }
 }
 // Preserve embedded receipt photos from workbook media as additional printable pages.
 const media=Object.keys(zip.files).filter(n=>/^xl\/media\/[^/]+\.(?:png|jpe?g|webp)$/i.test(n));
 if(media.length>60)throw Error('Excel chứa quá nhiều ảnh. Tách chứng từ thành nhiều phần.');
 for(const [i,path] of media.entries()){
   const bytes=await zip.file(path).async('uint8array');const type=/\.png$/i.test(path)?'image/png':/\.webp$/i.test(path)?'image/webp':'image/jpeg';
   const image=await imageFromBlob(new Blob([bytes],{type}));const c=DOC.createElement('canvas');c.width=1600;c.height=940;
   const ctx=c.getContext('2d',{alpha:false});ctx.fillStyle='white';ctx.fillRect(0,0,c.width,c.height);ctx.fillStyle='#123b5a';ctx.font='bold 30px Arial';ctx.fillText(`Excel · Ảnh đính kèm ${i+1}/${media.length}`,32,56);
   const scale=Math.min(1480/image.width,820/image.height);ctx.drawImage(image,60+(1480-image.width*scale)/2,90+(820-image.height*scale)/2,image.width*scale,image.height*scale);
   canvases.push(c);
 }
 return canvases;
}
async function pdfPreview(doc){
 const lib=await ensurePdfJs();const task=lib.getDocument({data:doc.bytes.slice(),disableWorker:true,stopAtErrors:true});const pdf=await task.promise;try{if(pdf.numPages>100)throw Error('PDF chứng từ quá 100 trang, cần chia nhỏ');const result=[];for(let k=1;k<=pdf.numPages;k++){const page=await pdf.getPage(k),viewport=page.getViewport({scale:1});const scale=Math.min(2.4,1700/viewport.width,1500/viewport.height);const v=page.getViewport({scale});const canvas=DOC.createElement('canvas');canvas.width=Math.max(1,Math.ceil(v.width));canvas.height=Math.max(1,Math.ceil(v.height));const ctx=canvas.getContext('2d',{alpha:false});ctx.fillStyle='white';ctx.fillRect(0,0,canvas.width,canvas.height);await page.render({canvasContext:ctx,viewport:v}).promise;result.push(canvas);page.cleanup?.()}return result}finally{await pdf.destroy?.()}
}
async function receiptPreviews(doc){if(doc.kind==='pdf')return pdfPreview(doc);if(doc.kind==='xlsx')return excelPreview(doc);return []}
function drawReceiptToPage(canvas,receipt){const ctx=canvas.getContext('2d');ctx.setTransform(P_SCALE,0,0,P_SCALE,0,0);const box={x:53,y:214,w:1017,h:517};const scale=Math.min(box.w/receipt.width,box.h/receipt.height),w=receipt.width*scale,h=receipt.height*scale;ctx.fillStyle='#f3f8fb';ctx.fillRect(box.x,box.y,box.w,box.h);ctx.drawImage(receipt,box.x+(box.w-w)/2,box.y+(box.h-h)/2,w,h)}

async function makePdf(rows,source,info={}){
 const stats=summary(rows),images=[],embedded=[];let evidencePages=0;const label=tr('header'),title=STR(info.title||getTitle()),tid=STR(info.tid||T?.Data?.tid||'TESTLAB'),now=STR(info.generatedAt||timestamp());
 function add(canvas){if(images.length>=300)throw Error('Giới hạn 300 trang; hãy chia báo cáo theo kỳ.');images.push(jpeg(canvas))}
 add(drawPage(label,ctx=>{let y=143;y=pdfText(ctx,title,48,y,{size:25,bold:true,max:1010})+11;y=pdfText(ctx,`Tournament ID: ${tid}   |   ${now}`,48,y,{size:16,color:'#597b91'})+34;const cards=[['TỔNG THU',stats.income],['TỔNG CHI',stats.expense],['SỐ DƯ',stats.balance]];cards.forEach(([s,n],i)=>{const x=48+i*355;ctx.fillStyle='#e7f3f8';ctx.fillRect(x,y,335,110);pdfText(ctx,s,x+14,y+13,{size:16,bold:true,color:'#165d7a'});pdfText(ctx,MONEY(n),x+14,y+52,{size:23,bold:true,max:315})});y+=150;pdfText(ctx,`Tổng giao dịch: ${stats.count} | Chưa PAID: ${stats.pending}`,48,y,{size:19,bold:true});pdfText(ctx,`Đã thanh toán: Thu ${MONEY(stats.paidIncome)} · Chi ${MONEY(stats.paidExpense)}`,48,y+43,{size:16,max:1020});pdfText(ctx,'Lưu ý: Tổng thu/chi là giá trị các bút toán đã lưu, không đồng nghĩa đã thanh toán.',48,y+90,{size:15,color:'#795e41',max:1000});pdfText(ctx,tr('origin'),48,y+142,{size:15,color:'#547080'});}))
 const PER=16;for(let i=0;i<Math.max(1,Math.ceil(rows.length/PER));i++){
 const slice=rows.slice(i*PER,(i+1)*PER);add(drawPage(`${label} · CHI TIẾT ${i+1}`,ctx=>{const cols=[48,93,222,310,573,726,884],widths=[42,120,86,260,150,150,200];['#','Ngày','Loại','Hạng mục','Số tiền','Trạng thái','Số chứng từ'].forEach((s,j)=>pdfText(ctx,s,cols[j],137,{size:14,bold:true,max:widths[j]}));ctx.fillStyle='#c8dce8';ctx.fillRect(48,165,1020,2);slice.forEach((r,k)=>{const y=178+k*33;if(k%2===0){ctx.fillStyle='#f1f7fa';ctx.fillRect(44,y-3,1030,32)}const v=[i*PER+k+1,r.date,r.type,r.category,MONEY(r.amount),r.status,r.invoice||'—'];for(let j=0;j<v.length;j++){let s=STR(v[j]);ctx.font='14px Arial';while(s.length>1&&ctx.measureText(s).width>widths[j])s=s.slice(0,-2)+'…';pdfText(ctx,s,cols[j],y,{size:14,max:widths[j]})}});if(!rows.length)pdfText(ctx,tr('none'),50,200,{size:19})}))
 }
 add(drawPage(tr('appendix'),ctx=>{pdfText(ctx,`Tổng số chứng từ: ${source.receipts.length}`,55,165,{size:24,bold:true});pdfText(ctx,'Mỗi chứng từ có mã giao dịch, tên hạng mục, số chứng từ và giá trị.',55,222,{size:17});pdfText(ctx,'Mỗi trang PDF, ảnh và bảng Excel sẽ được in trực tiếp sau trang này.',55,260,{size:16,color:'#6b7386'})}));
 for(const [index,doc] of source.receipts.entries()){
  const r=doc.row,who=`${tr('item')}: ${r.category}`;
  const previews=doc.kind==='image'?[await imageFromBlob(doc.blob)]:await receiptPreviews(doc);
  if(!previews.length)throw Error(`Chứng từ ${doc.name} không có trang nào. Từ chối xuất PDF trống.`);
  for(let pi=0;pi<previews.length;pi++){
    const c=drawPage(`${tr('appendix')} ${index+1}/${source.receipts.length} · trang ${pi+1}/${previews.length}`,ctx=>{
      let y=116;y=pdfText(ctx,who,48,y,{size:20,bold:true,max:1020})+7;
      y=pdfText(ctx,`#${r.id} · ${r.date} · ${r.type} · ${MONEY(r.amount)}`,48,y,{size:16,max:1010})+5;
      pdfText(ctx,`Số chứng từ: ${r.invoice||'—'} · Tệp: ${doc.name}`,48,y,{size:14,color:'#597b91',max:1020});
    });drawReceiptToPage(c,previews[pi]);add(c);evidencePages++;
  }
 }
 const blob=rawPdf(images,embedded);if(blob.size<10000)throw Error('PDF xuất bất thường/rỗng');return{blob,pages:images.length,embedded:0,visiblePages:evidencePages,visibleImages:source.receipts.filter(r=>r.kind==='image').length,summary:stats};
}
function htmlPrint(rows,source,title){const s=summary(rows);const cards=`<div class="summary">${[['Tổng thu',s.income],['Tổng chi',s.expense],['Số dư',s.balance]].map(([k,v])=>`<div><span>${k}</span><strong>${MONEY(v)}</strong></div>`).join('')}</div>`;
 const cols=['#','Ngày','Loại','Hạng mục','Số tiền','Trạng thái','Chứng từ'];const records=rows.map((r,i)=>`<tr><td>${i+1}</td><td>${safeHtml(r.date)}</td><td>${safeHtml(r.type)}</td><td>${safeHtml(r.category)}</td><td>${MONEY(r.amount)}</td><td>${safeHtml(r.status)}</td><td>${safeHtml(r.invoice||'—')}</td></tr>`).join('');
 const appendix=source.receipts.flatMap((d,i)=>{
  const pages=d.kind==='image'?[URL.createObjectURL(d.blob)]:(d.previewDataUrls||[]);
  if(!pages.length)throw Error('Chứng từ '+d.name+' không hiển thị được. Từ chối in thiếu trang.');
  return pages.map((src,page)=>`<section class="receipt"><h3>${i+1}. ${tr('item')}: ${safeHtml(d.row.category)} · Trang ${page+1}/${pages.length}</h3><p>Mã: ${safeHtml(d.row.id)} · Ngày: ${safeHtml(d.row.date)} · ${MONEY(d.row.amount)} · Số chứng từ: ${safeHtml(d.row.invoice||'—')} · Tệp: ${safeHtml(d.name)}</p><img src="${safeHtml(src)}"></section>`)
 }).join('');
 return `<!doctype html><html lang="vi"><head><meta charset="utf-8"><title>${safeHtml(title)} · Báo cáo tài chính</title><style>@page{size:A4 landscape;margin:12mm}body{font:14px Arial,sans-serif;color:#133650;background:white}h1,h2{color:#165f81}.summary{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin:24px 0}.summary>div{border:1px solid #b1d0df;border-radius:8px;padding:16px}.summary span,.summary strong{display:block}.summary strong{font-size:21px;margin-top:10px}table{border-collapse:collapse;width:100%}th,td{border:1px solid #aac9d5;padding:9px}th{background:#e5f3f8}.receipt{break-before:page;page-break-before:always;break-inside:avoid;padding-top:10px;min-height:150mm}.receipt img{max-width:98%;max-height:150mm;object-fit:contain;border:1px solid #e3eaf0}thead{display:table-header-group}@media print{button{display:none}}.sign{margin-top:30px;text-align:right}</style></head><body><button onclick="window.print()">In / Lưu PDF</button><h1>${safeHtml(tr('header'))}</h1><h2>${safeHtml(title)}</h2><p>${timestamp()} · ${safeHtml(T?.Data?.tid||'TESTLAB')}</p>${cards}<h2>Chi tiết thu chi (${rows.length})</h2><table><thead><tr>${cols.map(c=>`<th>${c}</th>`).join('')}</tr></thead><tbody>${records}</tbody></table><div class="sign">Ban tổ chức (ký xác nhận)</div><h2 style="break-before:page">${tr('appendix')}</h2>${appendix}</body></html>`}
let working=false;
async function report(kind,opts={}){if(working)throw Error('Một lần xuất báo cáo đang thực hiện.');working=true;const status=DOC.getElementById('h113-finance-status');if(status)status.textContent=tr('busy');try{
 const rows=await collectRows(opts),title=STR(opts.title||getTitle()),name=safeFile(`${T?.SPORT?.key||'TOPKEY'}_${T?.Data?.tid||'testlab'}_tai_chinh_${new Date().toISOString().slice(0,10)}`);
 if(kind==='csv'){const blob=new Blob([CSV(rows)],{type:'text/csv;charset=utf-8'});if(opts.download!==false)saveBlob(blob,name+'.csv');if(status)status.textContent=`${tr('ready')}: ${rows.length} giao dịch.`;return{blob,rows,summary:summary(rows)}}
 const src=opts.receipts||await collectReceipts(rows,{local:true});if(src.missing?.length)throw Error(`Có ${src.missing.length} chứng từ thiếu hoặc không đọc được:\n${src.missing.slice(0,5).join('\n')}\nHãy kiểm tra Firebase Storage/quyền CORS hoặc chứng từ lưu cục bộ trước khi xuất.`);
 if(kind==='print'){for(const doc of src.receipts){if(doc.kind!=='image'){const pages=await receiptPreviews(doc);doc.previewDataUrls=pages.map(p=>p.toDataURL('image/png'));}}const html=htmlPrint(rows,src,title);if(opts.open!==false){const w=WIN.open('','_blank');if(!w)throw Error('Trình duyệt chặn cửa sổ in.');w.document.open();w.document.write(html);w.document.close();await (w.document.fonts?.ready||Promise.resolve());}return{html,rows,summary:summary(rows)}}
 const pdf=await makePdf(rows,src,{title,tid:opts.tid,generatedAt:opts.generatedAt});if(opts.download!==false)saveBlob(pdf.blob,name+'.pdf');if(status)status.textContent=`${tr('ready')}: ${rows.length} giao dịch, ${src.receipts.length} chứng từ, ${pdf.pages} trang.`;return{...pdf,rows,receipts:src.receipts.length}
 }catch(e){if(status)status.textContent=tr('error')+(e?.message||e);throw e}finally{working=false}}
function mount(){const page=DOC.getElementById('page-finance'),app=T?.App;if(!page||!app||DOC.getElementById('h113-finance-controls'))return false;
 const where=page.querySelector('.card')||page,card=DOC.createElement('div');card.id='h113-finance-controls';card.className='card';card.style.cssText='padding:14px;margin-top:14px;border:1px solid #286481';card.innerHTML=`<h2 style="margin:0 0 8px">💼 <span data-h113-name>${tr('name')}</span></h2><div style="display:flex;flex-wrap:wrap;gap:8px"><button type="button" class="btn mini" data-h113="csv">${tr('csv')}</button><button type="button" class="btn mini ok" data-h113="pdf">${tr('pdf')}</button><button type="button" class="btn mini" data-h113="print">${tr('print')}</button></div><div id="h113-finance-status" class="note" role="status" style="margin-top:9px">${tr('origin')}</div>`;
 where.appendChild(card);card.addEventListener('click',async e=>{const button=e.target.closest('button[data-h113]');if(!button||button.disabled)return;const type=button.dataset.h113;for(const b of card.querySelectorAll('button'))b.disabled=true;try{await report(type)}catch(err){console.error('H113 finance report:',err);T?.U?.toast?.(tr('error')+(err?.message||err),'err')}finally{for(const b of card.querySelectorAll('button'))b.disabled=false}});
 const refresh=()=>{card.hidden=!financeAccess();card.querySelector('[data-h113-name]').textContent=tr('name');for(const b of card.querySelectorAll('button[data-h113]'))b.textContent=tr(b.dataset.h113)};refresh();const old=app.applyRole; if(typeof old==='function'&&!old.__h113){app.applyRole=function(...args){const result=old.apply(this,args);refresh();return result};app.applyRole.__h113=true}
 WIN.addEventListener('storage',refresh);WIN.addEventListener('topkey:languagechange',refresh);return true;
}
let tries=0;function boot(){if(mount())return;if(++tries<=15)setTimeout(boot,600)}if(DOC.readyState==='loading')DOC.addEventListener('DOMContentLoaded',boot,{once:true});else boot();WIN.addEventListener('topkey:admin-ready',()=>mount(),{once:true});
WIN.TopkeyFinanceReportH113=Object.freeze({CSV,summary,normalizeRows,collectRows,collectReceipts,makePdf,rawPdf,report,htmlPrint,mount});
})();
