/* TOPKEY H112: data-driven export using the original nine-slide PPTX template for each sport.
   No write to Firebase; images are session-only; report data is never changed. */
(()=>{'use strict';
 const TEMPLATES={badminton:'badminton',football:'football',volleyball:'volleyball',running:'running',handmade:'handmade',shuttle:'shuttle',cooking:'cooking'};
 const NS={p:'http://schemas.openxmlformats.org/presentationml/2006/main',a:'http://schemas.openxmlformats.org/drawingml/2006/main',r:'http://schemas.openxmlformats.org/officeDocument/2006/relationships',rel:'http://schemas.openxmlformats.org/package/2006/relationships'};
 const formatAmount=n=>new Intl.NumberFormat('vi-VN').format(Number(n)||0)+' VND';
 const clean=s=>String(s==null?'':s).replace(/[\u0000-\u001f]+/g,' ').trim();
 const pick=s=>clean(s).slice(0,250);
 const escFilename=s=>clean(s).replace(/[\\/:*?"<>|]+/g,' ').slice(0,70)||'TOPKEY';
 const parse=s=>{const doc=new DOMParser().parseFromString(s,'application/xml');if(doc.getElementsByTagName('parsererror').length)throw Error('PowerPoint template XML invalid');return doc};
 const serial=d=>new XMLSerializer().serializeToString(d);
 const getTags=(p,ns,name)=>Array.from(p.getElementsByTagNameNS(ns,name));
 const spText=sp=>getTags(sp,NS.a,'t').map(t=>t.textContent||'').join('');
 function setText(sp,s){const tt=getTags(sp,NS.a,'t');if(!tt.length)return false;tt[0].textContent=pick(s);tt[0].setAttribute('xml:space','preserve');tt.slice(1).forEach(t=>t.textContent='');return true}
 function replaceBy(slideXml,replace,rename){const d=parse(slideXml),sp=getTags(d,NS.p,'sp'),seen={};for(const shape of sp){const before=spText(shape);if(rename&&before===rename.from)setText(shape,rename.to);const key=before.trim();if(!(key in replace))continue;let val=replace[key];if(Array.isArray(val)){const i=seen[key]||0;seen[key]=i+1;val=val[i]??''}setText(shape,val)}return d}
 function awardRows(report){return (report?.prizeStructure||[]).filter(x=>x&&(x.name||x.reward)).map(x=>({name:clean(x.name),quantity:Math.max(1,Number(x.quantity)||1),reward:clean(x.reward||'—'),note:clean(x.note)}))}
 const awardOf=(prizes,i)=>prizes[i]||{name:'—',quantity:0,reward:'Chưa cấu hình',note:''};
 function replaceSlide(n,report,opt={},chunk=0){
  const prizes=awardRows(report),matches=report.matches||[],ranking=Object.values(report.top4||{}).flat(),finance=report.finance||{};
  const when=report.generatedAt?new Date(report.generatedAt).toLocaleDateString('vi-VN'):new Date().toLocaleDateString('vi-VN');
  const section=opt.plan||{};
  const body=key=>section[key]?.custom?clean(section[key].body).slice(0,380):'';
  const replacements={
    1:{'[Tên giải / Tên sự kiện]':report.title||'TOPKEY','[Ngày]   [Địa điểm]   [CLB / Ban tổ chức]':`${when} · ${report.location||'TOPKEY'} · Ban tổ chức`, 'BÁO CÁO TỔNG KẾT': section.cover?.title||'BÁO CÁO TỔNG KẾT'},
    2:{'[Date]':when,'[Venue]':report.location||'TOPKEY','[Count]':`${report.summary?.teams||0} đội · ${report.summary?.participants||0} VĐV`, '[Nội dung giới thiệu sự kiện; chỉnh sửa được]':body('summary')||`${report.summary?.finished||0}/${report.summary?.matches||0} trận hoàn tất · ${report.summary?.categories||0} nội dung thi đấu`},
    3:{},
    4:{'[Số lượng]':Array.from({length:4},(_,j)=>`${awardOf(prizes,chunk*4+j).quantity||'—'}`),'[Giá trị / Phần quà]':Array.from({length:4},(_,j)=>awardOf(prizes,chunk*4+j).reward),'GIẢI NHẤT':awardOf(prizes,chunk*4).name,'GIẢI NHÌ':awardOf(prizes,chunk*4+1).name,'GIẢI BA':awardOf(prizes,chunk*4+2).name,'KHUYẾN KHÍCH':awardOf(prizes,chunk*4+3).name},
    5:{'[Nhất]':ranking[0]?.name||'—','[Nhì]':ranking[1]?.name||'—','[Ba]':ranking[2]?.name||'—'},
    6:{'[Team A - Team B]':Array.from({length:4},(_,j)=>{const m=matches[chunk*4+j];return m?`${m.teamA||''} / ${m.teamB||''}`:'—'}),'[Date time]':Array.from({length:4},(_,j)=>{const m=matches[chunk*4+j];return m?`${m.date||''} ${m.time||''}`:'—'}),'[Result]':Array.from({length:4},(_,j)=>matches[chunk*4+j]?.result||'—')},
    7:{'[VND]':[formatAmount(finance.income),formatAmount(finance.expense),formatAmount(finance.balance)],'[Ghi chú / Phân tích tài chính / Nguồn kinh phí]':body('finance')||`${finance.rows?.length||0} giao dịch · Đối chiếu dữ liệu trước khi chốt.`},
    8:{'[Tên người nhận giải]':(ranking[0]?.name||'Chưa công bố'),'[Hạng mục và giá trị]':prizes[0]?`${prizes[0].name}: ${prizes[0].reward}`:'Chưa công bố giải thưởng'},
    9:{'[Ban tổ chức / Nhà tài trợ / Tình nguyện viên]':body('thanks')||'Ban tổ chức · Nhà tài trợ · Vận động viên'}
  };
  const aliases={1:'cover',2:'summary',3:'final',4:'prizes',5:'rankings',6:'results',7:'finance',8:'prizes',9:'thanks'};
  const key=aliases[n],t=section[key]?.title;if(t){const titles={1:'BÁO CÁO TỔNG KẾT',2:'01 / TỔNG QUAN SỰ KIỆN',3:'02 / KHOẢNH KHẮC ĐÁNG NHỚ',4:'03 / CƠ CẤU GIẢI THƯỞNG',5:'04 / THÀNH TÍCH & BXH',6:'05 / LỊCH & KẾT QUẢ',7:'06 / TÀI CHÍNH SỰ KIỆN',8:'07 / VINH DANH & TRAO GIẢI',9:'THANK YOU / CẢM ƠN'};replacements[n][titles[n]]=t}
  return replacements[n];
 }
 function base64Bytes(data){const idx=String(data).indexOf(',');if(idx<0)throw Error('Invalid image data');const b=atob(String(data).slice(idx+1));const a=new Uint8Array(b.length);for(let i=0;i<b.length;i++)a[i]=b.charCodeAt(i);return a}
 const mimeOf=d=>String(d).slice(0,40).includes('image/png')?'png':'jpg';
 function imageInsert(doc,placeholder,relId){const shapes=getTags(doc,NS.p,'sp');const sp=shapes.find(s=>spText(s).includes(placeholder));if(!sp)return false;const spPr=getTags(sp,NS.p,'spPr')[0],transform=spPr&&getTags(spPr,NS.a,'xfrm')[0];if(!transform)return false;
  const pic=doc.createElementNS(NS.p,'p:pic'),nv=doc.createElementNS(NS.p,'p:nvPicPr'),cNvPr=doc.createElementNS(NS.p,'p:cNvPr');cNvPr.setAttribute('id',String(500+relId));cNvPr.setAttribute('name','TOPKEY inserted photo');nv.appendChild(cNvPr);nv.appendChild(doc.createElementNS(NS.p,'p:cNvPicPr'));nv.appendChild(doc.createElementNS(NS.p,'p:nvPr'));pic.appendChild(nv);
  const fill=doc.createElementNS(NS.p,'p:blipFill'),blip=doc.createElementNS(NS.a,'a:blip');blip.setAttributeNS(NS.r,'r:embed','rId'+relId);fill.appendChild(blip);const stretch=doc.createElementNS(NS.a,'a:stretch');stretch.appendChild(doc.createElementNS(NS.a,'a:fillRect'));fill.appendChild(stretch);pic.appendChild(fill);
  const pr=doc.createElementNS(NS.p,'p:spPr');pr.appendChild(transform.cloneNode(true));const g=doc.createElementNS(NS.a,'a:prstGeom');g.setAttribute('prst','rect');g.appendChild(doc.createElementNS(NS.a,'a:avLst'));pr.appendChild(g);pic.appendChild(pr);sp.parentNode.replaceChild(pic,sp);return true;
 }
 async function exportDeck(report,options={}){
  const sport=String(options.sport||report?.sport||'').toLowerCase(),key=TEMPLATES[sport];if(!key)throw Error('Chưa có template cho môn này');
  if(!window.JSZip)throw Error('Thiếu thư viện ZIP nội bộ; chưa thể dùng mẫu PPTX gốc');
  if(!report||typeof report!=='object')throw Error('Chưa có dữ liệu báo cáo');
  let origin='built-in';let templateBytes;
  if(options.templateBlob){
    if(options.templateBlob.size>15*1024*1024)throw Error('Mẫu PPTX cá nhân vượt 15 MB');
    templateBytes=await options.templateBlob.arrayBuffer();origin='custom';
  }else{
    const response=await fetch(`../../report-templates/${key}-topkey-report.pptx?v=${encodeURIComponent(window.TopkeyRelease?.cacheTag||'h116')}`,{cache:'no-store'});
    if(!response.ok)throw Error(`Không tải được mẫu PowerPoint ${key}: HTTP ${response.status}`);
    templateBytes=await response.arrayBuffer();
  }
  const zip=await JSZip.loadAsync(templateBytes);
  // Fail closed: only a compatible original nine-slide structure can be populated safely.
  for(let n=1;n<=9;n++)if(!zip.file(`ppt/slides/slide${n}.xml`))throw Error(`Template ${key}: thiếu slide chuẩn số ${n}`);
  for(const f of ['ppt/presentation.xml','ppt/_rels/presentation.xml.rels','[Content_Types].xml'])if(!zip.file(f))throw Error('Template PPTX thiếu cấu trúc bắt buộc: '+f);const plan=options.plan||{},images=Array.isArray(options.images)?options.images:[];
  const slideDocuments={},usedPhotos=new Set(),stats={sport:key,origin,template:key+'.pptx',photos:0,replacedSlides:0,slides:9,prizes:awardRows(report).length,matches:(report.matches||[]).length};
  for(let n=1;n<=9;n++){
    const f=`ppt/slides/slide${n}.xml`,orig=await zip.file(f).async('string'),d=replaceBy(orig,replaceSlide(n,report,options,0));slideDocuments[n]=d;
  }
  const positionMap={1:['cover'],2:['summary'],3:['final','champions','rankings','results'],8:['prizes'],9:['thanks']};
  for(const [sn,pos] of Object.entries(positionMap)){
   const n=+sn,doc=slideDocuments[n],holders=n===3?['+  ẢNH 1','+  ẢNH 2','+  ẢNH 3','+  ẢNH 4']:n===1?['+  ẢNH BÌA']:n===2?['+  ẢNH TỔNG QUAN']:n===8?['+  ẢNH TRAO GIẢI']:['+  ẢNH TẬP THỂ'];
   const available=images.map((im,i)=>({im,i})).filter(({im,i})=>!usedPhotos.has(i)&&pos.includes(String(im.position||'final'))&&typeof im.data==='string'&&im.data.startsWith('data:image/'));
   const relFile=`ppt/slides/_rels/slide${n}.xml.rels`,rels=parse(await zip.file(relFile).async('string'));
   let count=0;for(const {im,i} of available.slice(0,holders.length)){
     const id=800+n*20+count,ext=mimeOf(im.data);if(imageInsert(doc,holders[count],id)){
       const media=`ppt/media/h112_photo_${n}_${count}.${ext}`,rr=rels.createElementNS(NS.rel,'Relationship');rr.setAttribute('Id','rId'+id);rr.setAttribute('Type','http://schemas.openxmlformats.org/officeDocument/2006/relationships/image');rr.setAttribute('Target',`../media/h112_photo_${n}_${count}.${ext}`);rels.documentElement.appendChild(rr);
       zip.file(media,base64Bytes(im.data));usedPhotos.add(i);stats.photos++;count++;
     }
   }
   zip.file(relFile,serial(rels));
  }
  // For long schedules / awards, append copies of the original styled slides.
  const extra=[];
  const scheduleChunks=Math.ceil((report.matches||[]).length/4),awardChunks=Math.ceil(awardRows(report).length/4);
  for(let c=1;c<Math.max(1,scheduleChunks);c++)extra.push({slide:6,chunk:c});
  for(let c=1;c<Math.max(1,awardChunks);c++)extra.push({slide:4,chunk:c});
  // Custom editor content for every section is preserved on an additional editable,
  // original-template-format note slide. Limit text to prevent text overflow.
  for(const [key,section] of Object.entries(plan)){
    if(['summary','finance','thanks'].includes(key)||!section?.custom||!String(section.body||'').trim())continue;
    const body=clean(section.body).slice(0,2500);
    for(let i=0;i<body.length;i+=180)extra.push({slide:2,kind:'custom',key,body:body.slice(i,i+180),part:Math.floor(i/180)+1});
  }
  let next=10;
  for(const item of extra){const n=next++,orig=await zip.file(`ppt/slides/slide${item.slide}.xml`).async('string'),d=replaceBy(orig,replaceSlide(item.slide,report,options,item.chunk));if(item.kind==='custom'){for(const shape of getTags(d,NS.p,'sp')){const text=spText(shape).trim();if(text==='01 / TỔNG QUAN SỰ KIỆN')setText(shape,`${clean(plan[item.key]?.title||item.key)} · Ghi chú ${item.part}`);if(text.startsWith('Tùy chỉnh mục tiêu'))setText(shape,'Nội dung biên tập riêng cho mục báo cáo');if(text==='[Nội dung giới thiệu sự kiện; chỉnh sửa được]'||text.includes('trận hoàn tất'))setText(shape,item.body)}}zip.file(`ppt/slides/slide${n}.xml`,serial(d));const rel=`ppt/slides/_rels/slide${item.slide}.xml.rels`;zip.file(`ppt/slides/_rels/slide${n}.xml.rels`,await zip.file(rel).async('string'));stats.slides++}
  for(const [n,doc] of Object.entries(slideDocuments))zip.file(`ppt/slides/slide${n}.xml`,serial(doc));
  const typefile='[Content_Types].xml',ct=parse(await zip.file(typefile).async('string'));
  if(stats.photos){const hasExt=Array.from(ct.documentElement.children).some(e=>e.getAttribute('Extension')==='jpg');if(!hasExt){const e=ct.createElementNS(ct.documentElement.namespaceURI,'Default');e.setAttribute('Extension','jpg');e.setAttribute('ContentType','image/jpeg');ct.documentElement.appendChild(e)}}
  for(let n=10;n<next;n++){const e=ct.createElementNS(ct.documentElement.namespaceURI,'Override');e.setAttribute('PartName',`/ppt/slides/slide${n}.xml`);e.setAttribute('ContentType','application/vnd.openxmlformats-officedocument.presentationml.slide+xml');ct.documentElement.appendChild(e)}zip.file(typefile,serial(ct));
  const pre=parse(await zip.file('ppt/presentation.xml').async('string'));
  const prs=parse(await zip.file('ppt/_rels/presentation.xml.rels').async('string'));
  // Remove unselected sections without touching the original template file.
  const sectionBySlide={1:'cover',2:'summary',3:'final',4:'prizes',5:'rankings',6:'results',7:'finance',8:'prizes',9:'thanks'};
  const relMap={};getTags(prs,NS.rel,'Relationship').forEach(x=>{const m=/slides\/slide(\d+)\.xml/.exec(x.getAttribute('Target')||'');if(m)relMap[x.getAttribute('Id')]=+m[1]});
  const list=getTags(pre,NS.p,'sldIdLst')[0];if(!list)throw Error('Missing slide list');
  getTags(list,NS.p,'sldId').forEach(el=>{const n=relMap[el.getAttributeNS(NS.r,'id')];if(n&&plan[sectionBySlide[n]]?.enabled===false)list.removeChild(el)});
  let newid=1100;for(let j=0;j<extra.length;j++){const item=extra[j],slide=item.slide,n=10+j;if(plan[item.kind==='custom'?item.key:sectionBySlide[slide]]?.enabled===false)continue;const rId='rIdH112_'+n,rel=prs.createElementNS(NS.rel,'Relationship');rel.setAttribute('Id',rId);rel.setAttribute('Type','http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide');rel.setAttribute('Target',`slides/slide${n}.xml`);prs.documentElement.appendChild(rel);const sl=pre.createElementNS(NS.p,'p:sldId');sl.setAttribute('id',String(newid++));sl.setAttributeNS(NS.r,'r:id',rId);list.appendChild(sl)}
  zip.file('ppt/presentation.xml',serial(pre));zip.file('ppt/_rels/presentation.xml.rels',serial(prs));
  if(!getTags(list,NS.p,'sldId').length)throw Error('Bạn chưa chọn mục PPT nào');
  const blob=await zip.generateAsync({type:'blob',compression:'DEFLATE',compressionOptions:{level:5}});
  if(blob.size<6000)throw Error('Tệp PPTX bất thường');
  for(let n=1;n<=9;n++)if(!zip.file(`ppt/slides/slide${n}.xml`))throw Error('Thiếu slide gốc trong PPTX xuất');
  stats.bytes=blob.size;stats.displaySlides=getTags(list,NS.p,'sldId').length;
  return{blob,stats};
 }
 function download(blob,name){const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=escFilename(name)+'.pptx';document.body.appendChild(a);a.click();setTimeout(()=>{a.remove();URL.revokeObjectURL(url)},30000)}
 window.TopkeyPptxTemplateH112=Object.freeze({build:exportDeck,download,templateFor:s=>TEMPLATES[String(s).toLowerCase()]||null});
})();
