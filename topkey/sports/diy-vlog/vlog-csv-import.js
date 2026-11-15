/* TOPKEY Vlog production CSV import. CSV roundtrips with "Xuất CSV".
 * No remote dependencies, no writes until the user confirms a validated preview.
 */
(()=>{'use strict';
 const HEADERS=['Tên','Loại','Đơn vị','Xem','Thích','Chia sẻ','TikTok'];
 function parseCSV(content){
  const input=String(content||'').replace(/^\uFEFF/,'');
  if(input.length>3000000)throw Error('CSV vượt quá 3 MB.');
  const rows=[];let row=[],cell='',quoted=false;
  for(let i=0;i<input.length;i++){
   const ch=input[i];
   if(quoted){
    if(ch==='"'&&input[i+1]==='"'){cell+='"';i++}
    else if(ch==='"')quoted=false;
    else cell+=ch;
   }else if(ch==='"'){if(cell.trim())throw Error('CSV có dấu nháy không hợp lệ tại dòng '+(rows.length+1));quoted=true}
   else if(ch===','||ch==='\t'){row.push(cell);cell=''}
   else if(ch==='\r'||ch==='\n'){
    if(ch==='\r'&&input[i+1]==='\n')i++;
    row.push(cell);if(row.some(v=>v.trim()))rows.push(row);
    row=[];cell='';
   }else cell+=ch;
  }
  if(quoted)throw Error('CSV thiếu dấu nháy đóng.');
  row.push(cell);if(row.some(v=>v.trim()))rows.push(row);
  return rows;
 }
 function normalize(s){return String(s||'').trim().toLocaleLowerCase('vi').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/\s+/g,'')}
 function count(raw,label){
  const value=String(raw??'').trim().replace(/\s/g,'');
  if(!value)return 0;
  if(!/^\d{1,10}$/.test(value)&&!/^\d{1,3}(?:\.\d{3})+$/.test(value))
   throw Error(label+' phải là số nguyên không âm (tối đa 1 tỷ).');
  const num=Number(value.replace(/\./g,''));
  if(!Number.isSafeInteger(num)||num>1000000000)throw Error(label+' vượt quá 1 tỷ.');
  return num;
 }
 function validateFile(text,currentEntries){
  const matrix=parseCSV(text);if(!matrix.length)throw Error('Tệp CSV trống.');
  const header=matrix.shift().map(normalize);
  const columns=HEADERS.map(x=>header.indexOf(normalize(x)));
  if(columns.some(i=>i<0))throw Error('Thiếu cột bắt buộc: '+HEADERS.filter((_,i)=>columns[i]<0).join(', '));
  if(matrix.length>1000)throw Error('Tối đa 1.000 dòng dữ liệu trong một lần nhập.');
  const existing=Object.values(currentEntries||{});
  const seen=new Set(existing.map(e=>normalize(e.name)+'|'+normalize(e.type)+'|'+normalize(e.dept)));
  const urls=new Set(existing.filter(e=>e.url).map(e=>String(e.url).trim().toLowerCase()));
  const planned=[],skipped=[],errors=[];
  matrix.forEach((cells,index)=>{
   const line=index+2;const get=i=>String(cells[columns[i]]??'').trim();
   if(cells.every(v=>!String(v).trim()))return;
   try{
    const name=get(0),type=get(1),dept=get(2);
    if(!name||name.length>100||dept.length>100)throw Error('Tên bắt buộc, tên/đơn vị không quá 100 ký tự.');
    if(type!=='Đội'&&type!=='Cá nhân')throw Error('Loại phải là Đội hoặc Cá nhân.');
    const url=get(6);
    if(url){const link=new URL(url);
     if(link.protocol!=='https:'||!/^(?:(?:www|m|vt|vm)\.)?tiktok\.com$/i.test(link.hostname))
      throw Error('TikTok phải là URL HTTPS thuộc tiktok.com.');
    }
    const entry={name,type,dept,views:count(get(3),'Xem'),likes:count(get(4),'Thích'),shares:count(get(5),'Chia sẻ'),url};
    const key=normalize(name)+'|'+normalize(type)+'|'+normalize(dept);
    if(seen.has(key)||(url&&urls.has(url.toLowerCase()))){
     skipped.push({line,name,reason:'Đã tồn tại trong Firebase hoặc trùng trong file'});
     return;
    }
    seen.add(key);if(url)urls.add(url.toLowerCase());planned.push({line,...entry});
   }catch(e){errors.push({line,reason:String(e.message||e)})}
  });
  return {planned,skipped,errors,total:matrix.length};
 }
 function install(){
  const trigger=document.getElementById('import-csv'),input=document.getElementById('import-csv-file'),
   preview=document.getElementById('import-csv-preview'),message=document.getElementById('import-csv-status'),
   approve=document.getElementById('import-csv-confirm'),cancel=document.getElementById('import-csv-cancel');
  if(!trigger||!input||!preview||!message||!approve||!cancel)return;
  let draft=null;
  function reset(){draft=null;input.value='';preview.hidden=true;approve.disabled=true;message.textContent=''}
  trigger.addEventListener('click',()=>{
   if(!window.TopkeyVlogImportGuard?.()){message.textContent='Chỉ ADMIN/BTC Vlog được nhập danh sách cuộc thi thật.';return}
   input.click();
  });
  input.addEventListener('change',async()=>{
   if(!input.files?.length)return;const file=input.files[0];
   draft=null;approve.disabled=true;preview.hidden=false;message.textContent='Đang đọc tệp CSV...';
   try{
    if(!window.TopkeyVlogImportGuard?.())throw Error('Bạn không có quyền nhập.');
    if(file.size>3000000)throw Error('Tệp CSV quá lớn (tối đa 3 MB).');
    if(!/\.csv$/i.test(file.name))throw Error('Vui lòng lưu Excel thành CSV UTF-8 (.csv) để nhập.');
    const report=validateFile(await file.text(),window.TopkeyVlogExistingEntries?.()||{});
    draft=report;
    preview.querySelector('[data-counts]').textContent='Tệp: '+report.total+' dòng · hợp lệ mới: '+report.planned.length+
     ' · trùng: '+report.skipped.length+' · lỗi: '+report.errors.length;
    const list=preview.querySelector('[data-preview]');
    list.replaceChildren();
    for(const e of report.planned.slice(0,8)){
     const row=document.createElement('div');row.textContent='Dòng '+e.line+': '+e.name+' — '+e.type+' · '+e.views+' xem';
     list.appendChild(row);
    }
    for(const e of report.errors.slice(0,12)){
     const row=document.createElement('div');row.className='vlog-csv-error';
     row.textContent='Dòng '+e.line+': '+e.reason;list.appendChild(row);
    }
    if(report.errors.length)message.textContent='Có dòng lỗi. Sửa file rồi nhập lại; chưa ghi Firebase.';
    else if(!report.planned.length)message.textContent='Không có bài dự thi mới để nhập.';
    else message.textContent='Xác nhận để CHỈ THÊM '+report.planned.length+' bài mới; không cập nhật hoặc xóa dữ liệu cũ.';
    approve.disabled=Boolean(report.errors.length)||!report.planned.length;
   }catch(e){draft=null;message.textContent='Không thể nhập: '+e.message;approve.disabled=true}
  });
  cancel.addEventListener('click',reset);
  approve.addEventListener('click',async()=>{
   if(!draft||draft.errors.length||!draft.planned.length)return;
   if(!window.TopkeyVlogImportGuard?.()){message.textContent='Quyền quản trị đã thay đổi; không thể ghi.';return}
   if(!window.confirm('Thêm '+draft.planned.length+' bài dự thi mới vào Firebase PRODUCTION? KHÔNG ghi đè dữ liệu hiện có.'))return;
   approve.disabled=true;cancel.disabled=true;trigger.disabled=true;
   try{
    const result=await window.TopkeyVlogImportCommit(draft.planned);
    message.textContent='Đã lưu và xác minh '+result+' bài dự thi mới trong Firebase.';
    draft=null;input.value='';
   }catch(e){message.textContent='Lỗi ghi dữ liệu: '+String(e.message||e)+'. Hãy tải lại bảng để kiểm tra trước khi thử lại.'}
   finally{cancel.disabled=false;trigger.disabled=false}
  });
 }
 window.TopkeyVlogCSV={parseCSV,validateFile};
 if(typeof document!=='undefined'){
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
 }
})();