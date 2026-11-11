/* On-demand PPT reports. Templates and attachments stay in this browser session. */
(()=>{'use strict';
 const NS={p:'http://schemas.openxmlformats.org/presentationml/2006/main',a:'http://schemas.openxmlformats.org/drawingml/2006/main',r:'http://schemas.openxmlformats.org/officeDocument/2006/relationships',rel:'http://schemas.openxmlformats.org/package/2006/relationships'};
 const SECTIONS=[['cover','Bìa'],['summary','Tổng quan'],['champions','Thành tích'],['prizes','Giải thưởng'],['rankings','Bảng xếp hạng'],['results','Lịch và kết quả'],['finance','Tài chính'],['final','Hình ảnh hoạt động'],['thanks','Cảm ơn'],['manual','Giữ nội dung mẫu']];
 const MAX_FILE=30*1024*1024,MAX_TOTAL=80*1024*1024;
 const txt=v=>String(v??''),esc=v=>txt(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const tags=(node,ns,name)=>[...node.getElementsByTagNameNS(ns,name)];
 const parse=xml=>{const d=new DOMParser().parseFromString(xml,'application/xml');if(d.getElementsByTagName('parsererror').length)throw Error('Mẫu có cấu trúc XML không hợp lệ');return d};
 const serial=d=>new XMLSerializer().serializeToString(d);
 const shapeText=node=>tags(node,NS.a,'t').map(x=>x.textContent||'').join('');
 const shapeId=node=>tags(node,NS.p,'cNvPr')[0]?.getAttribute('id');
 const findShape=(d,id)=>tags(d,NS.p,'sp').find(x=>shapeId(x)===String(id));
 function setText(node,value){if(!node)return;let ts=tags(node,NS.a,'t');if(!ts.length){let body=tags(node,NS.p,'txBody')[0];if(!body){body=node.ownerDocument.createElementNS(NS.p,'p:txBody');body.appendChild(node.ownerDocument.createElementNS(NS.a,'a:bodyPr'));body.appendChild(node.ownerDocument.createElementNS(NS.a,'a:lstStyle'));node.appendChild(body)}let paragraph=tags(body,NS.a,'p')[0];if(!paragraph){paragraph=node.ownerDocument.createElementNS(NS.a,'a:p');body.appendChild(paragraph)}const run=node.ownerDocument.createElementNS(NS.a,'a:r'),text=node.ownerDocument.createElementNS(NS.a,'a:t');run.appendChild(text);paragraph.appendChild(run);ts=[text]}ts[0].textContent=txt(value);ts[0].setAttribute('xml:space','preserve');ts.slice(1).forEach(x=>x.textContent='');}
 const money=n=>new Intl.NumberFormat('vi-VN').format(Number(n)||0)+' ₫';
 const cat=v=>({MEN:'Đôi nam',WOMEN:'Đôi nữ',MIX:'Đôi nam nữ'}[v]||v||'');
 const status=v=>({FINISHED:'Kết thúc',CANCELLED:'Đã hủy',WALKOVER:'Xử thắng',RETIRED:'Bỏ cuộc',DISQUALIFIED:'Truất quyền',PAID:'Đã thanh toán'}[v]||v||'');
 const safe=v=>txt(v).replace(/[\\/:*?"<>|\u0000-\u001f]/g,'_').slice(0,120)||'TOPKEY';
 const label=key=>SECTIONS.find(x=>x[0]===key)?.[1]||key;
 function sectionLines(r,key){
  const ms=r.matches||[],s=r.summary||{},f=r.finance||{};
  switch(key){
   case 'cover':return [r.title||'TOPKEY',r.sportName||r.sport||'',new Date(r.generatedAt||Date.now()).toLocaleDateString('vi-VN'),r.location||''].filter(Boolean);
   case 'summary':return [`${s.teams||0} đội / ${s.participants||0} người tham gia`,`${ms.length} trận: ${ms.filter(x=>x.status==='CANCELLED').length} trận hủy`,`${ms.filter(x=>['FINISHED','WALKOVER','RETIRED','DISQUALIFIED'].includes(x.status)).length} trận đã kết thúc`,`${s.categories||0} nội dung`,r.location||''].filter(Boolean);
   case 'champions':case 'rankings':return Object.entries(key==='champions'?r.top4||{}:r.rankings||{}).flatMap(([c,rows])=>rows.map(x=>`${cat(c)} · #${x.rank} · ${x.name}${key==='rankings'?` · ${x.played??0} trận · T-H-B ${x.w??0}-${x.d??0}-${x.l??0} · ${r.mode==='time'?(x.bestTime??'—')+' ms':r.mode==='judged'?(x.score??'—')+' điểm':(x.points??0)+' điểm'}`:''}`));
   case 'results':return ms.map((m,i)=>`${i+1}. ${m.date||''} ${m.time||''} · ${cat(m.category)} · ${m.teamA||''}${m.teamB?' / '+m.teamB:''} · ${m.result||'—'} · ${status(m.status)}`);
   case 'prizes':return (r.prizeStructure||[]).map(x=>`${x.name} · SL ${x.quantity||1} · ${x.reward||'—'}${x.note?' · '+x.note:''}`);
   case 'finance':return [`Tổng thu: ${money(f.income)}`,`Tổng chi: ${money(f.expense)}`,`Số dư: ${money(f.balance)}`,...(f.rows||[]).map(x=>`${x.date||''} · ${x.type==='INCOME'?'Thu':'Chi'} · ${x.category||''} · ${money(x.amount)} · ${status(x.status)}${x.note?' · '+x.note:''}`)];
   case 'thanks':return ['Cảm ơn Ban tổ chức và toàn thể người tham gia'];
   default:return [];
  }
 }
 function tokens(r){const out={title:r.title||'TOPKEY',sport:r.sportName||r.sport||'',date:new Date(r.generatedAt||Date.now()).toLocaleDateString('vi-VN'),location:r.location||''};for(const [key] of SECTIONS)out[key==='cover'?'cover_text':key]=sectionLines(r,key).join('\n');return out;}
 function replaceTokens(value,r,pageKey,pageText){const values=tokens(r);if(pageKey)values[pageKey]=pageText;return txt(value).replace(/\{\{\s*([a-z_]+)\s*\}\}/g,(full,k)=>Object.hasOwn(values,k)?txt(values[k]):full);}
 const shapeInfo=sp=>{const ph=tags(sp,NS.p,'ph')[0],text=shapeText(sp),size=tags(sp,NS.a,'ext')[0];return{id:shapeId(sp),text,type:ph?(ph.getAttribute('type')||'body'):'',width:Number(size?.getAttribute('cx')||0)/914400,height:Number(size?.getAttribute('cy')||0)/914400,font:Number(tags(sp,NS.a,'rPr')[0]?.getAttribute('sz')||1800)/100};};
 function resolvePart(base,target){if(target.startsWith('/'))return target.slice(1);const parts=base.split('/');parts.pop();for(const x of target.split('/')){if(x==='..')parts.pop();else if(x!=='.'&&x)parts.push(x)}return parts.join('/');}
 function relPath(part){const i=part.lastIndexOf('/');return part.slice(0,i+1)+'_rels/'+part.slice(i+1)+'.rels';}
 async function openTemplate(file){
  if(!file||!txt(file.name).toLowerCase().endsWith('.pptx'))throw Error('Chọn mẫu PowerPoint .pptx');
  if(file.size>MAX_FILE)throw Error('Mẫu PPTX tối đa 30 MB');
  const zip=await JSZip.loadAsync(await file.arrayBuffer());
  const total=Object.values(zip.files).reduce((n,x)=>n+(x._data?.uncompressedSize||0),0);if(total>150*1024*1024||Object.keys(zip.files).length>8000)throw Error('Mẫu có quá nhiều dữ liệu để xử lý trên trình duyệt');
  if(Object.keys(zip.files).some(x=>/vbaProject|activeX\//i.test(x)))throw Error('Hãy dùng mẫu PPTX không chứa macro hoặc ActiveX');
  for(const required of ['ppt/presentation.xml','ppt/_rels/presentation.xml.rels','[Content_Types].xml'])if(!zip.file(required))throw Error('Tệp không phải mẫu PowerPoint hợp lệ');
  const pre=parse(await zip.file('ppt/presentation.xml').async('string')),rels=parse(await zip.file('ppt/_rels/presentation.xml.rels').async('string')),map={};
  for(const e of tags(rels,NS.rel,'Relationship'))if(e.getAttribute('TargetMode')!=='External')map[e.getAttribute('Id')]=resolvePart('ppt/presentation.xml',e.getAttribute('Target')||'');
  const slides=[];for(const [index,e]of tags(pre,NS.p,'sldId').entries()){
   const rid=e.getAttributeNS(NS.r,'id'),part=map[rid];if(!part||!/^ppt\/slides\/[^/]+\.xml$/.test(part)||!zip.file(part))throw Error('Mẫu có tham chiếu slide không hợp lệ');
   const xml=await zip.file(part).async('string'),doc=parse(xml),shapes=tags(doc,NS.p,'sp').map(shapeInfo).filter(x=>x.id&&(x.text.trim()||x.type));
   const title=shapes.find(x=>['title','ctrTitle'].includes(x.type))||shapes[0];
   const tokenShape=shapes.find(x=>/\{\{\s*(summary|champions|prizes|rankings|results|finance|thanks)\s*\}\}/.test(x.text));
   const guess=tokenShape?.text.match(/\{\{\s*(summary|champions|prizes|rankings|results|finance|thanks)\s*\}\}/)?.[1]||'manual';
   const body=tokenShape||shapes.find(x=>x.type==='body')||shapes.filter(x=>x.id!==title?.id).sort((a,b)=>b.width*b.height-a.width*a.height)[0];
   slides.push({id:'slide-'+index,part,rid,xml,shapes,titleId:title?.id||'',bodyId:body?.id||'',section:guess,title:(title?.text||'Slide '+(index+1)).slice(0,180),enabled:true,attach:false,files:[],capacity:16});
  }
  if(!slides.length||slides.length>150)throw Error('Mẫu cần từ 1 đến 150 slide');
  return{file,zip,slides};
 }
 function splitLines(lines,maxChars=110,maxLines=13){
  const wrapped=[];for(const raw of lines){for(const original of txt(raw).split('\n')){let line=original;while(line.length>maxChars){let at=line.lastIndexOf(' ',maxChars);if(at<maxChars/3)at=maxChars;wrapped.push(line.slice(0,at));line=line.slice(at).trimStart()}wrapped.push(line)}}
  const pages=[];for(let i=0;i<wrapped.length;i+=maxLines)pages.push(wrapped.slice(i,i+maxLines).join('\n'));return pages.length?pages:[''];
 }
 async function imageData(file){
  if(!/\.(png|jpe?g|webp)$/i.test(file.name))return null;
  if(file.size>MAX_FILE)throw Error('Ảnh vượt 30 MB: '+file.name);
  const url=URL.createObjectURL(file);try{return await new Promise((resolve,reject)=>{const im=new Image();im.onload=()=>{const scale=Math.min(1,1800/im.width,1300/im.height),canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(im.width*scale));canvas.height=Math.max(1,Math.round(im.height*scale));const c=canvas.getContext('2d');c.fillStyle='#fff';c.fillRect(0,0,canvas.width,canvas.height);c.drawImage(im,0,0,canvas.width,canvas.height);resolve({data:canvas.toDataURL('image/jpeg',.87),width:canvas.width,height:canvas.height})};im.onerror=()=>reject(Error('Không đọc được ảnh '+file.name));im.src=url})}finally{URL.revokeObjectURL(url)}
 }
 function selectedFiles(items){return items.filter(x=>x.enabled&&x.attach).flatMap(item=>(item.files||[]).map(file=>({item,file})));}
 function validateFiles(items){const files=selectedFiles(items);if(files.length>60||files.reduce((n,x)=>n+x.file.size,0)>MAX_TOTAL)throw Error('Chọn tối đa 60 tệp, tổng dung lượng không quá 80 MB');for(const x of files)if(x.file.size>MAX_FILE)throw Error('Tệp tối đa 30 MB: '+x.file.name);return files;}
 async function ensureAutoEngine(){if(typeof(window.PptxGenJS||window.pptxgenjs)==='function')return;await window.TopkeyProductionLoader?.loadFeature('ppt');if(typeof(window.PptxGenJS||window.pptxgenjs)!=='function')throw Error('Không tải được thư viện tạo PowerPoint. Vui lòng thử lại.');}
 function fitImage(width,height,x,y,w,h){const k=Math.min(w/width,h/height);return{x:x+(w-width*k)/2,y:y+(h-height*k)/2,w:width*k,h:height*k};}
 async function buildAuto(report,items){
  await ensureAutoEngine();validateFiles(items);
  const Ctor=window.PptxGenJS||window.pptxgenjs,ppt=new Ctor();ppt.layout='LAYOUT_WIDE';ppt.author='TOPKEY';ppt.title=report.title||'Báo cáo toàn giải';ppt.subject='Báo cáo tự động';ppt.lang='vi-VN';ppt.theme={headFontFace:'Arial',bodyFontFace:'Arial',lang:'vi-VN'};
  const slide=(title,body)=>{const s=ppt.addSlide();s.background={color:'102D48'};s.addText(txt(title),{x:.55,y:.35,w:12.2,h:.65,fontSize:25,bold:true,color:'4BDEDC',margin:0,fit:'shrink'});if(body)s.addText(txt(body),{x:.65,y:1.35,w:12,h:5.3,fontFace:'Arial',fontSize:16,color:'FFFFFF',margin:0,breakLine:false,fit:'shrink',valign:'top'});return s;};
  for(const item of items.filter(x=>x.enabled)){
   const lines=sectionLines(report,item.section);if(!lines.length&&item.section!=='final')lines.push('Chưa có dữ liệu');
   if(item.section==='cover'){const s=slide(item.title,'');s.addText(report.title||'TOPKEY',{x:.85,y:2,w:11.6,h:1.5,fontFace:'Arial',fontSize:32,bold:true,color:'FFFFFF',align:'center',fit:'shrink'});s.addText([report.sportName||report.sport||'',new Date(report.generatedAt||Date.now()).toLocaleDateString('vi-VN'),report.location||''].filter(Boolean).join(' · '),{x:1,y:4,w:11.3,h:1,fontSize:20,color:'C4E2EF',align:'center',fit:'shrink'});}else if(item.section!=='final'||item.attach&&(item.files||[]).length){const pages=splitLines(lines,105,12);for(const [i,body]of pages.entries())slide(item.title+(i?' (tiếp)':''),body);}
   if(item.attach)for(const file of item.files||[]){const im=await imageData(file);if(im){const s=slide(item.title+' · '+file.name,'');s.addImage({data:im.data,...fitImage(im.width,im.height,.7,1.3,11.9,5.7)})}else slide(item.title+' · Tệp đính kèm',file.name+'\nTệp được gửi cùng báo cáo trong gói ZIP.');}
  }
  if(!ppt._slides?.length)throw Error('Chọn ít nhất một mục có nội dung để xuất');
  const blob=await ppt.write({outputType:'blob',compression:true});return{blob,stats:{mode:'auto',displaySlides:ppt._slides.length}};
 }
 function newRelationship(doc,id,type,target){const e=doc.createElementNS(NS.rel,'Relationship');e.setAttribute('Id',id);e.setAttribute('Type',NS.r+'/'+type);e.setAttribute('Target',target);doc.documentElement.appendChild(e);}
 function insertImage(doc,shape,relId,image){
  const transform=tags(shape,NS.a,'xfrm')[0];if(!transform)throw Error('Ô ảnh được chọn không có vị trí trong mẫu');
  const off=tags(transform,NS.a,'off')[0],ext=tags(transform,NS.a,'ext')[0];
  const box=fitImage(image.width,image.height,Number(off.getAttribute('x')),Number(off.getAttribute('y')),Number(ext.getAttribute('cx')),Number(ext.getAttribute('cy')));
  const pic=doc.createElementNS(NS.p,'p:pic');pic.innerHTML='';
  const nv=doc.createElementNS(NS.p,'p:nvPicPr'),id=doc.createElementNS(NS.p,'p:cNvPr');id.setAttribute('id',shapeId(shape));id.setAttribute('name','Ảnh báo cáo');nv.appendChild(id);nv.appendChild(doc.createElementNS(NS.p,'p:cNvPicPr'));nv.appendChild(doc.createElementNS(NS.p,'p:nvPr'));pic.appendChild(nv);
  const fill=doc.createElementNS(NS.p,'p:blipFill'),blip=doc.createElementNS(NS.a,'a:blip');blip.setAttributeNS(NS.r,'r:embed',relId);fill.appendChild(blip);const stretch=doc.createElementNS(NS.a,'a:stretch');stretch.appendChild(doc.createElementNS(NS.a,'a:fillRect'));fill.appendChild(stretch);pic.appendChild(fill);
  const pr=doc.createElementNS(NS.p,'p:spPr'),x=transform.cloneNode(true);tags(x,NS.a,'off')[0].setAttribute('x',Math.round(box.x));tags(x,NS.a,'off')[0].setAttribute('y',Math.round(box.y));tags(x,NS.a,'ext')[0].setAttribute('cx',Math.round(box.w));tags(x,NS.a,'ext')[0].setAttribute('cy',Math.round(box.h));pr.appendChild(x);const g=doc.createElementNS(NS.a,'a:prstGeom');g.setAttribute('prst','rect');g.appendChild(doc.createElementNS(NS.a,'a:avLst'));pr.appendChild(g);pic.appendChild(pr);shape.parentNode.replaceChild(pic,shape);
 }
 async function buildTemplate(report,template,items){
  if(!template)throw Error('Hãy tải lên mẫu PPTX trước khi tạo báo cáo');validateFiles(items);
  const zip=await JSZip.loadAsync(await template.file.arrayBuffer()),pre=parse(await zip.file('ppt/presentation.xml').async('string')),rels=parse(await zip.file('ppt/_rels/presentation.xml.rels').async('string')),ct=parse(await zip.file('[Content_Types].xml').async('string')),list=tags(pre,NS.p,'sldIdLst')[0];
  if(!list)throw Error('Mẫu thiếu danh sách slide');
  while(list.firstChild)list.removeChild(list.firstChild);
  for(const e of [...rels.documentElement.children])if((e.getAttribute('Type')||'').endsWith('/slide'))e.remove();
  let count=0;const originalPaths=new Set(template.slides.map(x=>x.part));
  // Use separate slide parts; the uploaded template remains unchanged.
  for(const item of items.filter(x=>x.enabled)){
   const bodyInfo=item.shapes.find(x=>x.id===item.bodyId);
   if(item.section!=='manual'&&!bodyInfo)throw Error(`Slide “${item.title}”: chọn ô chữ nhận dữ liệu`);
   if(item.bodyId&&item.bodyId===item.titleId&&item.section!=='manual')throw Error(`Slide “${item.title}”: chọn hai ô khác nhau cho tiêu đề và nội dung`);
   const chars=Math.max(18,Math.floor((bodyInfo?.width||7)*72/((bodyInfo?.font||18)*.56))),lines=Math.max(1,Math.min(item.capacity||16,Math.floor((bodyInfo?.height||4)*72/((bodyInfo?.font||18)*1.35))));
   const chunks=item.section==='manual'?['']:splitLines(sectionLines(report,item.section),chars,lines);
   const photos=[];if(item.attach)for(const file of item.files||[]){const im=await imageData(file);if(im){if(!bodyInfo)throw Error(`Slide “${item.title}”: chọn ô nội dung làm khung ảnh`);photos.push({image:im,name:file.name})}else chunks.push(`Tệp đính kèm: ${file.name}\nTệp được gửi cùng báo cáo trong gói ZIP.`);}
   for(const page of [...chunks.map(body=>({body})),...photos]){
    const doc=parse(item.xml),sourceRel=zip.file(relPath(item.part)),rs=sourceRel?parse(await sourceRel.async('string')):parse(`<Relationships xmlns="${NS.rel}"/>`);
    for(const e of [...rs.documentElement.children]){const type=e.getAttribute('Type')||'';if(type.endsWith('/notesSlide')||type.endsWith('/slide')){const rid=e.getAttribute('Id');for(const link of [...doc.getElementsByTagName('*')])if(link.localName?.startsWith('hlink')&&link.getAttributeNS(NS.r,'id')===rid)link.remove();e.remove();continue}if(e.getAttribute('TargetMode')!=='External')e.setAttribute('Target','/'+resolvePart(item.part,e.getAttribute('Target')||''));}
    for(const shape of tags(doc,NS.p,'sp')){const before=shapeText(shape),after=replaceTokens(before,report,item.section,page.body||'');if(before!==after)setText(shape,after);}
    if(item.titleId&&item.section!=='manual')setText(findShape(doc,item.titleId),replaceTokens(item.title,report));
    const body=item.bodyId&&findShape(doc,item.bodyId);if(body&&(item.section!=='manual'||page.body))setText(body,page.body||'');
    const n=++count,part=`ppt/slides/topkeyReport${n}.xml`,rid='rIdTopkeyReport'+n;
    if(page.image){const media=`ppt/media/topkeyReport${n}.jpg`;zip.file(media,page.image.data.split(',')[1],{base64:true});newRelationship(rs,'rIdTopkeyPhoto','image','/'+media);insertImage(doc,body,'rIdTopkeyPhoto',page.image);}
    zip.file(part,serial(doc));zip.file(relPath(part),serial(rs));newRelationship(rels,rid,'slide','slides/topkeyReport'+n+'.xml');
    const sid=pre.createElementNS(NS.p,'p:sldId');sid.setAttribute('id',String(256+n));sid.setAttributeNS(NS.r,'r:id',rid);list.appendChild(sid);
    const override=ct.createElementNS(ct.documentElement.namespaceURI,'Override');override.setAttribute('PartName','/'+part);override.setAttribute('ContentType','application/vnd.openxmlformats-officedocument.presentationml.slide+xml');ct.documentElement.appendChild(override);
   }
  }
  if(!count)throw Error('Chọn ít nhất một slide để xuất');
  // No hidden, unselected source slides in the exported presentation.
  for(const part of originalPaths){zip.remove(part);zip.remove(relPath(part));}
  for(const part of Object.keys(zip.files))if(part.startsWith('ppt/notesSlides/'))zip.remove(part);
  for(const e of [...ct.documentElement.children])if(originalPaths.has((e.getAttribute('PartName')||'').slice(1))||(e.getAttribute('PartName')||'').startsWith('/ppt/notesSlides/'))e.remove();
  if(![...ct.documentElement.children].some(e=>e.getAttribute('Extension')==='jpg')){const e=ct.createElementNS(ct.documentElement.namespaceURI,'Default');e.setAttribute('Extension','jpg');e.setAttribute('ContentType','image/jpeg');ct.documentElement.appendChild(e);}
  // Custom slide lists/sections refer to the original slide IDs and no longer apply.
  for(const e of [...pre.getElementsByTagName('*')])if(['custShowLst','sectionLst'].includes(e.localName))e.remove();
  if(zip.file('docProps/app.xml')){const app=parse(await zip.file('docProps/app.xml').async('string'));for(const e of [...app.getElementsByTagName('*')])if(e.localName==='Slides')e.textContent=String(count);zip.file('docProps/app.xml',serial(app));}
  zip.file('ppt/presentation.xml',serial(pre));zip.file('ppt/_rels/presentation.xml.rels',serial(rels));zip.file('[Content_Types].xml',serial(ct));
  return{blob:await zip.generateAsync({type:'blob',compression:'DEFLATE'}),stats:{mode:'template',displaySlides:count,template:template.file.name}};
 }
 async function packageResult(result,report,items){const files=validateFiles(items).filter(x=>!(/\.(png|jpe?g|webp)$/i.test(x.file.name))),name=safe(report.title||'TOPKEY')+'_bao_cao';if(!files.length)return{...result,filename:name+'.pptx'};
  const zip=new JSZip();zip.file(name+'.pptx',await result.blob.arrayBuffer());let index=0;for(const {item,file}of files)zip.file(`dinh-kem/${safe(item.title)}/${++index}_${safe(file.name)}`,await file.arrayBuffer());
  zip.file('HUONG-DAN.txt','Mở file PPTX để xem báo cáo. Các tệp đính kèm nằm trong thư mục dinh-kem, chia theo mục đã chọn.');return{...result,blob:await zip.generateAsync({type:'blob',compression:'DEFLATE'}),filename:name+'_kem_tep.zip'};
 }
 let state=null;
 function autoItems(){return SECTIONS.filter(x=>x[0]!=='manual').map(([section,title])=>({id:section,section,title:section==='cover'?'BÁO CÁO TOÀN GIẢI':title,enabled:!['final','thanks'].includes(section),attach:false,files:[]}));}
 function getPlan(){return state&&{mode:state.mode,template:state.template,items:state.mode==='auto'?state.auto:state.template?.slides||[]};}
 function draw(){
  const host=document.getElementById('ppt-wizard-list');if(!host||!state)return;const plan=getPlan();
  document.getElementById('ppt-wizard-upload').hidden=state.mode!=='template';
  host.innerHTML=plan.items.map((x,i)=>`<article data-item="${esc(x.id)}" class="ppt-wizard-item"><label><input type="checkbox" class="ppt-use" ${x.enabled?'checked':''}> <b>${i+1}. ${esc(x.title)}</b></label><label>Tiêu đề <input class="ppt-title" type="text" value="${esc(x.title)}" maxlength="180"></label>${state.mode==='template'?`<label>Dữ liệu cho slide <select class="ppt-section">${SECTIONS.map(([k,n])=>`<option value="${k}" ${x.section===k?'selected':''}>${n}</option>`).join('')}</select></label><label>Ô chữ tiêu đề <select class="ppt-title-target"><option value="">Giữ tiêu đề gốc</option>${x.shapes.map(s=>`<option value="${s.id}" ${s.id===x.titleId?'selected':''}>${esc((s.text||'Ô '+s.type+' #'+s.id).slice(0,65))}</option>`).join('')}</select></label><label>Ô nhận dữ liệu / khung ảnh <select class="ppt-body-target"><option value="">Chọn ô chữ trong mẫu</option>${x.shapes.map(s=>`<option value="${s.id}" ${s.id===x.bodyId?'selected':''}>${esc((s.text||'Ô '+s.type+' #'+s.id).slice(0,65))}</option>`).join('')}</select></label>`:''}<label><input class="ppt-attach" type="checkbox" ${x.attach?'checked':''}> Mục này cần ảnh / tệp đính kèm</label><div class="ppt-files-wrap" ${x.attach?'':'hidden'}><input class="ppt-files" type="file" multiple accept="image/jpeg,image/png,image/webp,.pdf,.docx,.xlsx,.csv,.txt,.pptx"><div class="ppt-file-names">${x.files.map(f=>esc(f.name)).join('<br>')}</div><button class="ppt-files-clear" type="button">Bỏ tệp đã chọn</button></div></article>`).join('')||(state.mode==='template'?'Tải lên mẫu .pptx để hiện danh sách slide.':'');
  host.querySelectorAll('[data-item]').forEach(row=>{const x=plan.items.find(i=>i.id===row.dataset.item);row.querySelector('.ppt-use').onchange=e=>x.enabled=e.target.checked;row.querySelector('.ppt-title').oninput=e=>x.title=e.target.value;row.querySelector('.ppt-attach').onchange=e=>{x.attach=e.target.checked;row.querySelector('.ppt-files-wrap').hidden=!x.attach};row.querySelector('.ppt-files').onchange=e=>{const incoming=[...e.target.files||[]],before=x.files;x.files=incoming;try{validateFiles(plan.items);row.querySelector('.ppt-file-names').textContent=incoming.map(f=>f.name).join('\n')}catch(err){x.files=before;message(err.message)}e.target.value=''};row.querySelector('.ppt-files-clear').onclick=()=>{x.files=[];row.querySelector('.ppt-file-names').textContent=''};if(state.mode==='template'){row.querySelector('.ppt-section').onchange=e=>x.section=e.target.value;row.querySelector('.ppt-title-target').onchange=e=>x.titleId=e.target.value;row.querySelector('.ppt-body-target').onchange=e=>x.bodyId=e.target.value;}});
 }
 function message(text){const el=document.getElementById('ppt-wizard-message');if(el)el.textContent=text;}
 function mount(sport,report){
  const modal=document.getElementById('tk79-modal');if(!modal)return;
  if(!state||state.sport!==sport||state.tid!==report.tid)state={sport,tid:report.tid,mode:'auto',template:null,auto:autoItems(),loading:false,uploadVersion:0};
  for(const id of ['tk88-ppt-structure-host','tk105-ppt-template','tk112-save-ppt-plan','tk88-ppt-plan','tk116-template-selector']){const el=document.getElementById(id);if(el)el.hidden=true;}
  let root=document.getElementById('ppt-wizard');if(!root){root=document.createElement('section');root.id='ppt-wizard';root.className='tk79-panel';root.style.marginTop='14px';modal.querySelector('.tk79-box').appendChild(root);}
  root.innerHTML=`<style>#ppt-wizard [hidden]{display:none!important}#ppt-wizard input[type=checkbox],#ppt-wizard input[type=radio]{width:auto}#ppt-wizard-list{display:grid;grid-template-columns:repeat(auto-fit,minmax(270px,1fr));gap:10px;margin-top:12px}.ppt-wizard-item{border-top:1px solid #43758d;padding:12px 0;display:grid;gap:9px}.ppt-wizard-item label{display:block;font-size:13px}.ppt-wizard-item input[type=text],.ppt-wizard-item select{display:block;width:100%;box-sizing:border-box;margin-top:5px;padding:8px;background:#061827;color:white;border:1px solid #43758d;border-radius:6px}.ppt-file-names{white-space:pre-wrap;font-size:12px;margin:7px 0}</style><h3>Tạo báo cáo PowerPoint</h3><label><input type="radio" name="ppt-mode" value="auto" ${state.mode==='auto'?'checked':''}> Tạo tự động từ dữ liệu giải</label> <label><input type="radio" name="ppt-mode" value="template" ${state.mode==='template'?'checked':''}> Theo mẫu tải lên</label><div id="ppt-wizard-upload" style="margin-top:12px" ${state.mode==='template'?'':'hidden'}><label>Chọn / đổi mẫu .pptx <input id="ppt-template-file" type="file" accept=".pptx,application/vnd.openxmlformats-officedocument.presentationml.presentation"></label><p class="tk79-note">Mẫu không giới hạn 9 slide. Giữ bố cục gốc và chọn ô chữ nhận dữ liệu cho từng slide. Các thẻ {{title}}, {{date}}, {{location}} được điền tự động. Mẫu chỉ dùng trên thiết bị này trong phiên xuất, không tải lên máy chủ.</p><div id="ppt-template-name">${esc(state.template?.file.name||'Chưa chọn mẫu')}</div></div><p class="tk79-note">Tích mục cần xuất. Chỉ bật chọn ảnh/tệp cho mục cần đính kèm. Ảnh chèn vào PPT; tệp khác đi cùng báo cáo trong ZIP. Khi nội dung dài, app tạo thêm trang từ cùng bố cục.</p><div id="ppt-wizard-message" role="status"></div><div id="ppt-wizard-list"></div><button type="button" class="tk79-ok" id="ppt-wizard-create" style="padding:12px;margin-top:12px">Tạo và tải báo cáo PPT</button>`;
  root.querySelectorAll('[name=ppt-mode]').forEach(el=>el.onchange=()=>{state.mode=el.value;draw()});
  root.querySelector('#ppt-template-file').onchange=async e=>{const file=e.target.files?.[0];if(!file)return;const session=state,version=++state.uploadVersion;state.loading=true;message('Đang đọc mẫu...');try{const template=await openTemplate(file);if(state!==session||version!==state.uploadVersion)return;state.template=template;root.querySelector('#ppt-template-name').textContent=file.name;message(`Đã đọc ${template.slides.length} slide. Chọn nguồn dữ liệu và ô chữ cần điền.`);draw()}catch(err){if(state===session&&version===state.uploadVersion)message('Không đọc được mẫu: '+err.message)}finally{if(state===session&&version===state.uploadVersion)state.loading=false;e.target.value=''}};
  root.querySelector('#ppt-wizard-create').onclick=()=>document.getElementById('tk79-ppt')?.click();draw();
 }
 async function build(report){if(!state)mount(report.sport,report);if(!state)throw Error('Mở cửa sổ tạo báo cáo trước');if(state.loading)throw Error('Đang đọc mẫu, vui lòng đợi');const current=getPlan(),plan={...current,items:current.items.map(x=>({...x,files:[...(x.files||[])]}))},result=plan.mode==='template'?await buildTemplate(report,plan.template,plan.items):await buildAuto(report,plan.items);return packageResult(result,report,plan.items);}
 function reset(){if(state)state.uploadVersion++;state=null;document.getElementById('ppt-wizard')?.remove();}
 function download(result){const url=URL.createObjectURL(result.blob),a=document.createElement('a');a.href=url;a.download=result.filename;document.body.appendChild(a);a.click();setTimeout(()=>{a.remove();URL.revokeObjectURL(url)},30000);}
 window.TopkeyPptWizard=Object.freeze({mount,reset,build,buildAuto,buildTemplate,openTemplate,autoItems,sectionLines,packageResult,getPlan,download,version:'upload-template-20261111'});
})();
