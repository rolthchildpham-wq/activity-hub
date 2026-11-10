/* TOPKEY H106: offline-first, content-verified A4 landscape PDF writer.
   Never changes Firebase, results, permissions, or report data. */
(()=>{
'use strict';
if(window.TopkeyFinalReportPdfH106)return;
const W=1123,H=794,S=2,LEFT=52,RIGHT=W-52,BOTTOM=724,TOP=124;
const COLORS={navy:'#0b2743',teal:'#048aa6',ink:'#172e44',muted:'#5e7487',paper:'#ffffff',light:'#eaf4f9',border:'#c5d8e3',gold:'#b27b19',winner:'#fff7e0'};
const $str=v=>String(v==null?'':v);
const num=v=>{const n=Number(v);return Number.isFinite(n)?n:0};
const escNum=v=>new Intl.NumberFormat('vi-VN').format(num(v));
const money=v=>escNum(v)+' VND';
const safe=v=>$str(v).replace(/[\\/:*?"<>|]+/g,' ').replace(/\s+/g,' ').trim().slice(0,120)||'TOPKEY';
const when=v=>{try{return new Date(v||Date.now()).toLocaleString('vi-VN')}catch{return ''}};
const palettes={badminton:'#107d99',football:'#137e67',volleyball:'#6c52ac',running:'#c18b02',handmade:'#965c8c',shuttle:'#228495',cooking:'#ae6d42'};
function font(size=15,bold=false){return `${bold?'700':'400'} ${size}px Arial, "Segoe UI", sans-serif`}
function wrap(ctx,text,width,size=15,bold=false){
  ctx.font=font(size,bold);const result=[];
  for(const para of $str(text).replace(/\r/g,'').split('\n')){
    if(!para.trim()){result.push('');continue}
    let line='';for(const token of para.split(/\s+/)){
      const next=line?line+' '+token:token;
      if(ctx.measureText(next).width<=width){line=next;continue}
      if(line)result.push(line);
      line=token;
      // Split long IDs and unspaced words without losing their suffix.
      while(line&&ctx.measureText(line).width>width){let k=line.length;while(k>1&&ctx.measureText(line.slice(0,k)).width>width)k--;result.push(line.slice(0,k));line=line.slice(k)}
    }if(line)result.push(line)
  }
  return result.length?result:[''];
}
function text(ctx,value,x,y,maxWidth,opts={}){
  const size=opts.size||14,lineH=opts.lineH||Math.round(size*1.35),bold=!!opts.bold;
  let lines=wrap(ctx,value,maxWidth,size,bold);
  if(opts.maxLines&&lines.length>opts.maxLines){lines=lines.slice(0,opts.maxLines);let t=lines[lines.length-1];ctx.font=font(size,bold);while(t&&ctx.measureText(t+'…').width>maxWidth)t=t.slice(0,-1);lines[lines.length-1]=t+'…'}
  ctx.font=font(size,bold);ctx.fillStyle=opts.color||COLORS.ink;
  ctx.textBaseline='top';for(let i=0;i<lines.length;i++){
    const w=ctx.measureText(lines[i]).width;
    const tx=opts.align==='center'?x+(maxWidth-w)/2:opts.align==='right'?x+(maxWidth-w):x;
    ctx.fillText(lines[i],tx,y+i*lineH);
  }
  return lines.length*lineH;
}
function borderBox(ctx,x,y,w,h,fill='#ffffff',stroke=COLORS.border,r=6){
 ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.fillStyle=fill;ctx.fill();if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=1;ctx.stroke()}
}
function contentCount(report){const m=report?.summary||{},rows=report?.matches||[];return {teams:num(m.teams),matches:num(m.matches),actualMatches:rows.length,prizes:(report?.prizeStructure||[]).length,finance:(report?.finance?.rows||[]).length}}
function createPdfBytes(imageUrls){
 if(!imageUrls?.length)throw new Error('Khong co trang PDF');
 const objs=2+imageUrls.length*3,offsets=new Array(objs+1).fill(0),parts=[];let length=0;
 const te=new TextEncoder(),push=value=>{const b=typeof value==='string'?te.encode(value):value;parts.push(b);length+=b.length};
 const obj=(id,body)=>{offsets[id]=length;push(`${id} 0 obj\n`);for(const part of body)push(part);push('\nendobj\n')};
 push('%PDF-1.4\n');obj(1,['<< /Type /Catalog /Pages 2 0 R >>']);
 obj(2,[`<< /Type /Pages /Kids [${imageUrls.map((_,i)=>`${3+i*3} 0 R`).join(' ')}] /Count ${imageUrls.length} >>`]);
 imageUrls.forEach((url,i)=>{
   const id=3+i*3,imgId=id+1,contentId=id+2;
   const b64=url.slice(url.indexOf(',')+1),str=atob(b64),bytes=new Uint8Array(str.length);for(let k=0;k<str.length;k++)bytes[k]=str.charCodeAt(k);
   obj(id,[`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 841.89 595.28] /Resources << /XObject << /Im${i} ${imgId} 0 R >> >> /Contents ${contentId} 0 R >>`]);
   offsets[imgId]=length;push(`${imgId} 0 obj\n<< /Type /XObject /Subtype /Image /Width ${W*S} /Height ${H*S} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${bytes.length} >>\nstream\n`);push(bytes);push('\nendstream\nendobj\n');
   const command=te.encode(`q\n841.89 0 0 595.28 0 0 cm\n/Im${i} Do\nQ\n`);
   obj(contentId,[`<< /Length ${command.length} >>\nstream\n`,command,'\nendstream']);
 });
 const xref=length;push(`xref\n0 ${objs+1}\n0000000000 65535 f \n`);for(let i=1;i<=objs;i++)push(`${String(offsets[i]).padStart(10,'0')} 00000 n \n`);
 push(`trailer\n<< /Root 1 0 R /Size ${objs+1} >>\nstartxref\n${xref}\n%%EOF`);
 return new Blob(parts,{type:'application/pdf'});
}
async function loadImage(src){
 return await new Promise((resolve,reject)=>{
   const im=new Image(),tm=setTimeout(()=>reject(new Error('Anh bi timeout khi xuat PDF')),10000);
   im.onload=()=>{clearTimeout(tm);resolve(im)};
   im.onerror=()=>{clearTimeout(tm);reject(new Error('Khong doc duoc anh bao cao'))};
   im.src=src;
 });
}
function checkInk(canvas){
 const ctx=canvas.getContext('2d',{willReadFrequently:true});
 // H116: the header is always dark; inspect BELOW the header to detect blank report pages.
 // Sample many body pixels; reject pages with only the common header/footer.
 let marks=0;
 for(let y=156;y<710;y+=18){for(let x=60;x<1065;x+=22){
  const p=ctx.getImageData(x*S,y*S,1,1).data;
  if(p[3]>0 && (p[0]<226||p[1]<226||p[2]<226))marks++;
 }}
 return marks>=12;
}
async function createPdf(report,options={}){
 if(!report||typeof report!=='object')throw new Error('Chua co du lieu bao cao');
 const count=contentCount(report),required=count.matches;
 if(options.requireComplete!==false&&required>0&&count.actualMatches<required){
   throw new Error(`Bao cao chua du ${required} tran (dang co ${count.actualMatches}). Vui long tai du du lieu toan giai truoc khi xuat.`)
 }
 const languageMode=$str(options.languageMode||'vi').toLowerCase();
 const tr=(vi,en,zh)=>languageMode==='vi-en'?`${vi} / ${en}`:languageMode==='vi-zh'?`${vi} / ${zh}`:languageMode==='en-vi-zh'?`${en} / ${vi} / ${zh}`:vi;
 const sport=$str(options.sport||report.sport||'badminton').toLowerCase();
 const accent=palettes[sport]||COLORS.teal,imgs=[],pageStats=[];
 const date=when(report.generatedAt),reportName=$str(report.title||'Báo cáo cuối giải');let ctx=null,canvas=null,y=TOP,sectionName='',number=0,dirty=false,inkItems=0;
 function endPage(){
   if(!ctx)return;
   if(!dirty||inkItems<2)throw new Error(`Trang PDF ${number} khong co noi dung thuc`);
   ctx.strokeStyle=COLORS.border;ctx.beginPath();ctx.moveTo(LEFT,752);ctx.lineTo(RIGHT,752);ctx.stroke();
   text(ctx,'TOPKEY SPORTS · BÁO CÁO H116 · Đã kiểm tra nội dung',LEFT,762,700,{size:12,color:COLORS.muted});
   text(ctx,`Trang ${number}`,RIGHT-100,762,100,{size:12,align:'right',color:COLORS.muted,bold:true});
   if(!checkInk(canvas))throw new Error(`Trang PDF ${number} trang trang`);
   const url=canvas.toDataURL('image/jpeg',0.90);
   if(url.length<10000)throw new Error(`Anh trang PDF ${number} khong hop le`);
   imgs.push(url);pageStats.push({page:number,section:sectionName,length:url.length,items:inkItems});
   canvas.width=1;canvas.height=1;ctx=null;canvas=null;
 }
 function newPage(name){
   if(ctx)endPage();
   if(number>=300)throw new Error('Báo cáo vượt 300 trang; vui lòng chia thành nhiều phần để tránh tràn bộ nhớ.');sectionName=name;number++;dirty=true;inkItems=0;
   canvas=document.createElement('canvas');canvas.width=W*S;canvas.height=H*S;
   ctx=canvas.getContext('2d',{alpha:false,willReadFrequently:true});ctx.scale(S,S);
   ctx.fillStyle=COLORS.paper;ctx.fillRect(0,0,W,H);
   ctx.fillStyle=COLORS.navy;ctx.fillRect(0,0,W,94);
   ctx.fillStyle=accent;ctx.fillRect(0,92,W,5);
   text(ctx,'TOPKEY  ·  '+tr('BÁO CÁO CUỐI GIẢI','FINAL TOURNAMENT REPORT','賽事最終報告'),LEFT,20,960,{size:22,bold:true,color:'#ffffff',maxLines:1});
   text(ctx,reportName,LEFT,54,935,{size:15,bold:true,color:'#eaf8fd',maxLines:1});
   text(ctx,sectionName,LEFT,105,950,{size:19,bold:true,color:accent,maxLines:1});
   y=TOP+24;inkItems++;
 }
 function advance(size){if(y+size>BOTTOM)newPage(sectionName.replace(/(?: \(tiếp\))+$/,'')+' (tiếp)')}
 function paragraph(label,body,opts={}){
   if(!ctx)newPage(label);
   const sz=opts.size||15,width=RIGHT-LEFT-16;
   const lines=wrap(ctx,body,width,sz,false),size=lines.length*(sz*1.37)+17;
   advance(size);text(ctx,body,LEFT+6,y,width,{size:sz,color:opts.color||COLORS.ink});y+=size;inkItems++;
 }
 function heading(label){if(!ctx)newPage(label);advance(42);text(ctx,label,LEFT,y,RIGHT-LEFT,{size:19,bold:true,color:accent});y+=36;inkItems++}
 function empty(txt){advance(42);borderBox(ctx,LEFT,y,RIGHT-LEFT,34,COLORS.light);text(ctx,txt,LEFT+14,y+8,RIGHT-LEFT-24,{size:13,color:COLORS.muted});y+=43;inkItems++}
 function table(headers,rows,columnWidths,opts={}){
   const total=columnWidths.reduce((a,b)=>a+b,0),rowFont=opts.font||12.5;
   const widths=columnWidths.map(w=>(RIGHT-LEFT)*w/total);
   const heads=headers.map($str);
   let n=0;
   function drawHeader(){
    advance(31);ctx.fillStyle=accent;ctx.fillRect(LEFT,y,RIGHT-LEFT,29);let cx=LEFT;
    heads.forEach((h,j)=>{text(ctx,h,cx+7,y+7,widths[j]-12,{size:12,bold:true,color:'#ffffff',maxLines:1});cx+=widths[j]});y+=29;inkItems++;
   }
   drawHeader();if(!rows.length){empty('Chưa có dữ liệu trong mục này.');return}
   for(const raw of rows){
     const cells=raw.map($str);
     const countLines=cells.map((c,i)=>Math.min(opts.maxLines||3,wrap(ctx,c,widths[i]-14,rowFont).length));
     const height=Math.max(34,Math.max(...countLines)*Math.ceil(rowFont*1.36)+11);
     if(y+height>BOTTOM){newPage(sectionName.replace(/(?: \(tiếp\))+$/,'')+' (tiếp)');drawHeader()}
     if(n%2===0){ctx.fillStyle=COLORS.light;ctx.fillRect(LEFT,y,RIGHT-LEFT,height)}
     ctx.strokeStyle=COLORS.border;ctx.beginPath();ctx.moveTo(LEFT,y+height);ctx.lineTo(RIGHT,y+height);ctx.stroke();
     let x=LEFT;cells.forEach((c,i)=>{text(ctx,c,x+7,y+7,widths[i]-13,{size:rowFont,maxLines:opts.maxLines||3,color:i===0?accent:COLORS.ink,bold:opts.boldCols?.includes(i)});x+=widths[i]});
     y+=height;inkItems++;n++;
   }y+=18;
 }
 function cards(entries){const boxW=(RIGHT-LEFT-36)/4,boxH=88;advance(boxH+20);
  entries.slice(0,4).forEach((e,i)=>{const x=LEFT+i*(boxW+12);borderBox(ctx,x,y,boxW,boxH,COLORS.light);text(ctx,e[0],x+12,y+13,boxW-24,{size:12,color:COLORS.muted,maxLines:2});text(ctx,e[1],x+12,y+48,boxW-24,{size:23,bold:true,color:accent,maxLines:1})});y+=boxH+21;inkItems++;
 }
 function group(label,records,renderer){heading(label);if(!records?.length){empty('Chưa có dữ liệu.');return}renderer(records)}
 const photos=Array.isArray(options.images)?options.images:[];
 const usedPhotos=new Set();
 async function photosAt(position,headingText){
   const rows=[];
   photos.forEach((item,index)=>{
     if(usedPhotos.has(index))return;
     const key=$str(item?.position||'final');
     if(position===null||key===position){rows.push(item);usedPhotos.add(index)}
   });
   for(let i=0;i<rows.length;i+=2){
     newPage(`${headingText} · ${Math.floor(i/2)+1}`);
     const items=rows.slice(i,i+2);
     for(const [j,item] of items.entries()){
       const py=154+j*290,boxH=260;
       borderBox(ctx,LEFT,py,RIGHT-LEFT,boxH,'#f7fbfe');
       if(!item?.data){text(ctx,'Không có dữ liệu ảnh',LEFT+15,py+15,300,{size:15});inkItems++;continue}
       try{
         const im=await loadImage(item.data),caption=item.hasTitle===false?'':$str(item.title||'');
         const maxW=RIGHT-LEFT-32,maxH=216,ratio=Math.min(maxW/im.naturalWidth,maxH/im.naturalHeight);
         const dw=im.naturalWidth*ratio,dh=im.naturalHeight*ratio;
         ctx.drawImage(im,LEFT+16+(maxW-dw)/2,py+10+(maxH-dh)/2,dw,dh);
         if(caption)text(ctx,caption,LEFT+20,py+229,RIGHT-LEFT-40,{size:14,bold:true,align:'center',maxLines:1});
       }catch(e){text(ctx,'Không thể đọc ảnh: '+(e?.message||''),LEFT+18,py+110,RIGHT-LEFT-36,{size:13,color:COLORS.muted,maxLines:2})}
       inkItems++;
     }
   }
 }
 newPage(tr('Tổng quan giải đấu','Tournament overview','賽事概述'));
 const s=report.summary||{};
 cards([['Đội / VĐV',escNum(s.teams)],['Người tham gia',escNum(s.participants)],['Trận / lượt hoàn tất',`${escNum(s.finished)}/${escNum(s.matches)}`],['Nội dung thi',escNum(s.categories)]]);
 paragraph('Thông tin',`${$str(report.sportName||sport)}   ·   Mã giải: ${$str(report.tid||'—')}   ·   Ngày lập: ${date}`);
 heading('Tình trạng báo cáo');paragraph('Kết quả','Báo cáo tổng hợp thành tích, bảng xếp hạng, lịch thi đấu, cơ cấu giải thưởng và tài chính theo dữ liệu đã ghi nhận.');
 // Structured contents panel keeps the first report page useful and visibly populated.
 const tocY=Math.max(y+24,320);
 if(tocY+275<BOTTOM){
   borderBox(ctx,LEFT,tocY,RIGHT-LEFT,265,'#f4fafc',COLORS.border,10);
   text(ctx,tr('NỘI DUNG BÁO CÁO','CONTENTS','報告目錄'),LEFT+22,tocY+19,RIGHT-LEFT-44,{size:19,bold:true,color:accent,maxLines:1});
   const contents=[['01',tr('Thành tích và giải thưởng','Results and awards','成績與獎項')],
     ['02',tr('Bảng xếp hạng','Standings','排行榜')],
     ['03',tr('Lịch thi đấu và tỷ số','Schedule and scores','賽程及比分')],
     ['04',tr('Thu chi và số dư','Finance and balance','收支與餘額')],
     ['05',tr('Hình ảnh và ký xác nhận','Photos and approval','照片與簽署')]];
   contents.forEach((entry,i)=>{const yy=tocY+66+i*37;
     text(ctx,entry[0],LEFT+25,yy,54,{size:16,bold:true,color:accent});
     text(ctx,entry[1],LEFT+92,yy,RIGHT-LEFT-126,{size:15,maxLines:1});
   });y=tocY+276;inkItems++;
 }

 await photosAt('cover','Hình ảnh bìa');await photosAt('summary','Hình ảnh tổng quan');
 newPage(tr('Thành tích chung cuộc','Final results','最終成績'));
 const tops=Object.entries(report.top4||{});
 if(!tops.length)empty('Chưa có bảng thành tích chung cuộc.');
 for(const [cat,rs] of tops){heading('Nội dung: '+cat);table(['Hạng','Đội / vận động viên'],(rs||[]).map(r=>[r.rank,r.name]),[0.14,0.86],{font:15,maxLines:2})}
 await photosAt('champions','Hình ảnh thành tích');
 newPage(tr('Cơ cấu giải thưởng','Award structure','獎項結構'));
 const prizes=report.prizeStructure||[];
 if(!prizes.length)empty('Chưa cấu hình cơ cấu giải thưởng.');
 else table(['#','Tên giải','Số lượng','Giải thưởng / phần quà','Ghi chú'],prizes.map((r,i)=>[i+1,r.name,r.quantity||1,r.reward||'—',r.note||'']),[.055,.22,.10,.37,.255],{font:14,maxLines:3});
 await photosAt('prizes','Hình ảnh trao giải');
 newPage(tr('Bảng xếp hạng','Standings','排行榜'));
 const ranks=Object.entries(report.rankings||{});
 if(!ranks.length)empty('Chưa có dữ liệu bảng xếp hạng.');
 for(const [cat,records] of ranks){heading('Nội dung: '+cat);table(['#','Đội / VĐV','Trận','Thắng-Hòa-Thua','Hiệu số','Điểm / thành tích'],(records||[]).map(r=>[r.rank,r.name,r.played??0,`${r.w||0}-${r.d||0}-${r.l||0}`,((r.for!=null||r.against!=null)?num(r.for)-num(r.against):'—'),r.bestTime??r.score??r.points??0]),[.055,.40,.075,.15,.12,.20],{font:12.7,maxLines:2})}
 await photosAt('rankings','Hình ảnh bảng xếp hạng');
 newPage(tr('Lịch thi đấu và kết quả','Schedule and results','賽程及結果'));
 const matches=report.matches||[];
 table(['#','Ngày / giờ','Nội dung','Vòng','Trận / lượt','Kết quả','Trạng thái'],matches.map((m,i)=>[i+1,`${m.date||''} ${m.time||''}`,m.category||'',m.stage||'',m.teamB&&m.teamB!=='—'?`${m.teamA} / ${m.teamB}`:m.teamA||'',m.result||'—',m.status||'']),[.045,.145,.13,.11,.32,.15,.10],{font:11.5,maxLines:3});
 await photosAt('results','Hình ảnh trận đấu');
 newPage(tr('Tài chính toàn giải','Tournament finance','賽事財務'));
 const f=report.finance||{};
 cards([['Tổng thu',money(f.income)],['Tổng chi',money(f.expense)],['Số dư',money(f.balance)],['Chưa thanh toán',escNum(f.pending)]]);
 const finances=f.rows||[];
 table(['#','Ngày','Loại','Hạng mục','Số tiền','Trạng thái','Ghi chú'],finances.map((r,i)=>[i+1,r.date||'',r.type||'',r.category||'',money(r.amount),r.status||'',r.note||'']),[.045,.13,.11,.24,.16,.13,.185],{font:11.6,maxLines:3});
 await photosAt('finance','Hình ảnh tài chính');
 await photosAt('final',$str(options.finalTitle||'Khoảnh khắc đáng nhớ'));
 await photosAt('thanks','Hình ảnh kết thúc');
 await photosAt(null,'Hình ảnh khác');
 newPage(tr('Ký xác nhận và kết thúc','Approval and closing','簽署與總結'));
 paragraph('Tổng kết','Báo cáo được tạo từ dữ liệu tại thời điểm xuất. Thành tích và số liệu phải được đối chiếu với hệ thống quản lý giải trước khi ký xác nhận.');
 y=310;borderBox(ctx,LEFT,310,RIGHT-LEFT,250,'#f7fbfe');
 text(ctx,'ĐẠI DIỆN BAN TỔ CHỨC',LEFT+20,342,RIGHT-LEFT-40,{size:20,bold:true,align:'center',color:accent});
 text(ctx,reportName,LEFT+20,382,RIGHT-LEFT-40,{size:16,align:'center',maxLines:2});
 text(ctx,`Ngày xuất: ${date}`,LEFT+20,420,RIGHT-LEFT-40,{size:14,align:'center'});
 text(ctx,'(Ký, ghi rõ họ tên)',LEFT+20,520,RIGHT-LEFT-40,{size:14,align:'center',color:COLORS.muted});inkItems++;
 endPage();
 const blob=createPdfBytes(imgs);
 if(blob.size<12000)throw new Error('Tệp PDF được tạo quá nhỏ; từ chối tải tệp trắng.');
 return {blob,pages:pageStats.length,pageStats,bytes:blob.size,counts:count,layout:'A4-landscape'};
}
function save(blob,filename){const a=document.createElement('a'),url=URL.createObjectURL(blob);a.href=url;a.download=safe(filename)+'.pdf';document.body.appendChild(a);a.click();setTimeout(()=>{a.remove();URL.revokeObjectURL(url)},30000)}
async function exportReport(report,options={}){const result=await createPdf(report,options);if(!result?.blob||result.blob.size<15000||result.pages<2||!result.pageStats?.every(x=>x.items>=2))throw Error('PDF thiếu nội dung; không cho tải');save(result.blob,options.filename||`${Date.now()}_Bao_cao_cuoi_giai_${report?.title||'TOPKEY'}`);return result}
window.TopkeyFinalReportPdfH106={VERSION:'H116',createPdf,downloadPdf:save,exportReport,createPdfBytes,contentCount};
})();
