/* H115 - translate DISPLAY text only; never mutate Firebase, form values, IDs or scoring state.
 * Optional authenticated EdgeOne translation proxy. Missing provider => original strings remain visible.
 */
(()=>{'use strict';
 if(window.TopkeyDynamicI18n?.installed)return;
 const KEY='topkey_ui_language_v1',VERSION=window.TopkeyRelease?.cacheTag||'H115';
 const readLanguage=()=>{let s='vi';try{s=localStorage.getItem(KEY)||window.TopkeyUpgrade28?.language||'vi'}catch{}return String(s).startsWith('zh')?'zh':String(s).startsWith('en')?'en':'vi'};
 let current=readLanguage(),pending=new Map(),cache=new Map(),observed=new WeakMap(),observer=null,scheduled=false,working=false,issues=0,provider='unknown';
 let glossary=Object.create(null),seq=0;
 const G={
  'Tên CLB':{en:'Club name',zh:'社团名称'},'Năm thành lập':{en:'Founded',zh:'成立年份'},
  'Trưởng BTC / Phụ trách':{en:'Organizer lead / Person in charge',zh:'组委会主席 / 负责人'},
  'Trạng thái':{en:'Status',zh:'状态'},'Đang hoạt động':{en:'Active',zh:'正在运营'},
  'Nạp mẫu Excel Cầu lông':{en:'Load badminton Excel template',zh:'载入羽毛球 Excel 模板'},
  'Lưu hồ sơ BTC':{en:'Save organizer file',zh:'保存组委会档案'},
  'Lưu lịch':{en:'Save schedule',zh:'保存日程'},'Xóa toàn bộ lịch':{en:'Delete entire schedule',zh:'删除全部日程'},
  'Sửa lịch':{en:'Edit schedule',zh:'编辑日程'},'Tải lại lịch':{en:'Reload schedule',zh:'重新载入日程'},
  'Cấu hình CLB':{en:'Club settings',zh:'社团设置'},'Mở Quản trị hệ thống':{en:'Open system administration',zh:'打开系统管理'},
  'Quản trị hệ thống':{en:'System administration',zh:'系统管理'},'Chưa đăng nhập':{en:'Not signed in',zh:'尚未登录'},
  'Tách khỏi từng môn · Firebase Auth dùng chung':{en:'Independent of each sport · Shared Firebase Auth',zh:'独立于各运动 · 共用 Firebase 身份认证'},
  'Nạp lại':{en:'Reload',zh:'重新加载'},'Lưu cấu hình CLB':{en:'Save club settings',zh:'保存社团设置'},
  'Hồ sơ kế hoạch CLB · BTC':{en:'Club planning · Organizers',zh:'社团计划 · 组委会'},
  'Lịch & kế hoạch':{en:'Schedule & plan',zh:'日程与计划'},'Mốc hoạt động':{en:'Activity milestones',zh:'活动节点'},
  'Đăng ký':{en:'Registration',zh:'报名'},'Vòng tròn 1 lượt':{en:'Single round robin',zh:'单循环赛'},
  'Từ ngày':{en:'From',zh:'开始日期'},'Đến ngày':{en:'Until',zh:'结束日期'},
  'Số người dự kiến':{en:'Expected participants',zh:'预计参加人数'},
  'Hạn đăng ký':{en:'Registration deadline',zh:'报名截止日期'},
  'Chủ trì':{en:'Lead',zh:'主办'},'Phối hợp':{en:'Partner',zh:'协办'},
  'Đầu mối đăng ký':{en:'Registration contact',zh:'报名联系人'},
  'Hệ thống quản lý thể thao & hoạt động xã đoàn':{en:'Sports & Association Activities Management System',zh:'体育及社团活动管理系统'}
 };
 const safeSource=s=>String(s??'').trim();
 const cacheKey=(lang,source)=>lang+'\u0000'+source;
 function setCache(k,v){cache.set(k,v);if(cache.size>4500)cache.delete(cache.keys().next().value);}
 function known(s,l){const item=glossary[s]||G[s];return item?.[l]||null;}
 function blocked(parent){return !parent||!!parent.closest('script,style,noscript,template,svg,math,canvas,iframe,object,embed,pre,code,textarea,[contenteditable="true"],#rules-template,#tk28-language-modal,[data-tk115-no-translate]');}
 function eligible(s){return s.length>1&&s.length<650&&/[A-Za-z\u00c0-\u024f\u1e00-\u1eff\u3400-\u9fff]/.test(s)&&!/^https?:\/\//i.test(s)&&!/^\S+@\S+\.\S+$/.test(s)&&!/^([A-Z0-9_-]{2,}|\d+[\/\-:.]\d+)$/.test(s);}
 function display(node,translation){const rec=observed.get(node);if(!rec||!node.isConnected)return;const raw=node.nodeValue||'';if(rec.last!==null&&raw!==rec.last&&raw!==rec.source)return;const out=rec.prefix+translation+rec.suffix;if(raw!==out)node.nodeValue=out;rec.last=out;}
 function offer(node){if(!node?.parentElement||blocked(node.parentElement))return;const raw=node.nodeValue||'',s=safeSource(raw);if(!eligible(s))return;
  let rec=observed.get(node);
  if(!rec){rec={source:s,last:null,prefix:raw.match(/^\s*/)?.[0]||'',suffix:raw.match(/\s*$/)?.[0]||''};observed.set(node,rec)}
  else if(raw!==rec.last&&raw!==rec.prefix+rec.source+rec.suffix){rec.source=s;rec.prefix=raw.match(/^\s*/)?.[0]||'';rec.suffix=raw.match(/\s*$/)?.[0]||'';rec.last=null;}
  const source=rec.source,lang=current,k=cacheKey(lang,source);
  const local=known(source,lang);
  if(local){pending.delete(k);display(node,local);return}
  // Vietnamese UI strings are handled by the existing offline glossary. Chinese user content still needs a live translator in VI mode.
  if(lang==='vi'&&!/[\u3400-\u9fff]/.test(source)){display(node,source);return}
  if(lang!=='vi'&&/^[\d\s\-+.,:;€$₫%()]+$/.test(source)){display(node,source);return}
  if(cache.has(k)){display(node,cache.get(k));return}
  let job=pending.get(k);if(!job){job={lang,source,nodes:new Set()};pending.set(k,job)}job.nodes.add(node);
  schedule();
 }
 function visit(root=document.body){if(!root)return;const q=[];
  if(root.nodeType===3)q.push(root);
  else if(root.nodeType===1){const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);let node;while((node=walker.nextNode()))q.push(node)}
  for(const n of q)offer(n);
 }
 function schedule(){if(scheduled)return;scheduled=true;setTimeout(()=>{scheduled=false;flush().catch(e=>console.warn('H115 translate',e?.message||e))},250)}
 async function bearer(){try{const user=window.firebase?.auth?.()?.currentUser;if(user)return await user.getIdToken(false)}catch{}return ''}
 async function runProxy(batch,lang){const ctrl=new AbortController(),timer=setTimeout(()=>ctrl.abort(),6500);
  try{const token=await bearer();const resp=await fetch('/api/topkey-translate',{method:'POST',credentials:'same-origin',headers:{'content-type':'application/json',...(token?{authorization:'Bearer '+token}:{})},body:JSON.stringify({target:lang,segments:batch.map(x=>x.source)}),signal:ctrl.signal,cache:'no-store'});
   if(!resp.ok)throw new Error('TRANSLATE_HTTP_'+resp.status);
   const data=await resp.json();if(!data.ok||!Array.isArray(data.translations)||data.translations.length!==batch.length)throw new Error(data.error||'TRANSLATE_INVALID');
   provider='configured';return data.translations;
  }finally{clearTimeout(timer)}
 }
 async function flush(){if(working||!pending.size)return;working=true;const epoch=seq;
  try{while(pending.size&&epoch===seq){const batch=[...pending.values()].filter(x=>x.lang===current).slice(0,16);if(!batch.length){pending.clear();break}
    batch.forEach(x=>pending.delete(cacheKey(x.lang,x.source)));
    try{const translations=await runProxy(batch,batch[0].lang);
      batch.forEach((job,i)=>{const tr=String(translations[i]||job.source).slice(0,1400);setCache(cacheKey(job.lang,job.source),tr);if(epoch===seq)job.nodes.forEach(n=>display(n,tr));});
    }catch(e){issues++;provider=e?.message||'unavailable';batch.forEach(job=>{if(epoch===seq)job.nodes.forEach(n=>display(n,job.source));});
      // Avoid an unbounded loop when the optional translation backend is not configured.
      pending.clear();break;
    }
  }}finally{working=false;if(pending.size)schedule();}
 }
 function refresh(){const lang=readLanguage();if(lang!==current){current=lang;seq++;pending.clear();}visit(document.body);}
 function watch(){if(observer)return;observer=new MutationObserver(ms=>{const batch=new Set();for(const m of ms){if(m.type==='characterData')batch.add(m.target);else for(const n of m.addedNodes)batch.add(n)}if(batch.size>250){refresh();return}for(const n of batch)visit(n);});observer.observe(document.body,{subtree:true,childList:true,characterData:true});}
 async function loadGlossary(){try{const r=await fetch('/i18n/H115_TRANSLATIONS.json?v='+encodeURIComponent(VERSION),{cache:'force-cache'});if(r.ok){const d=await r.json();if(d&&typeof d==='object')glossary=d;refresh()}}catch{}}
 function init(){if(!document.body)return;watch();window.addEventListener('topkey:languagechange',()=>{refresh();});
  window.addEventListener('pageshow',refresh);
  if('requestIdleCallback'in window)requestIdleCallback(()=>{refresh();loadGlossary()},{timeout:1500});else setTimeout(()=>{refresh();loadGlossary()},120);
 }
 window.TopkeyDynamicI18n={installed:true,refresh,translateVisible:refresh,getStatus:()=>({language:current,provider,pending:pending.size,errors:issues}),translateRaw:async(text,target)=>{const s=safeSource(text),l=String(target||current);if(known(s,l))return known(s,l);return (await runProxy([{source:s}],l))[0]}};
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
