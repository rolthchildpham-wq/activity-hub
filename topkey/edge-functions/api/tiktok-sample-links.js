/* EdgeOne server-side TikTok public trend/search scraper for isolated Vlog TEST LAB.
   Uses TikWM public feed/search endpoints; no account cookies, private videos or production writes. */
const FIREBASE_API_KEY='AIzaSyBSr7buP3bMf6HTg_YDWH_Xk5aNhyvfSRg';
const DB_URL='https://topkey-badminton-default-rtdb.asia-southeast1.firebasedatabase.app';
const json=(body,status=200)=>new Response(JSON.stringify(body),{status,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff'}});
const fetchWithTimeout=async(url,options={},timeoutMs=12000)=>{
 const controller=new AbortController();
 const timer=setTimeout(()=>controller.abort(),timeoutMs);
 try{return await fetch(url,{...options,signal:controller.signal});}
 finally{clearTimeout(timer);}
};
async function verify(token){
 if(!token)return null;
 const r=await fetchWithTimeout('https://identitytoolkit.googleapis.com/v1/accounts:lookup?key='+encodeURIComponent(FIREBASE_API_KEY),{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({idToken:token})},7000);
 if(!r.ok)return null;const d=await r.json();return d?.users?.[0]?.localId||null;
}
const active=p=>p&&p.active!==false&&p.disabled!==true&&p.locked!==true&&p.enabled!==false&&p.isActive!==false&&!['disabled','blocked','suspended','inactive'].includes(String(p.status||'').toLowerCase());
const allowed=p=>{
 const role=String(p?.role||'').toUpperCase(),scope=String(p?.sportScope||p?.assignedSport||'').toLowerCase();
 const scopes=Array.isArray(p?.sportScopes)?p.sportScopes.map(x=>String(x||'').toLowerCase()):[];
 const handmade=['handmade','diy','diy / handmade','🧶 diy / handmade'].includes(scope)||scopes.some(x=>['handmade','diy','diy / handmade','🧶 diy / handmade'].includes(x))||p?.sportAccess?.handmade===true;
 return active(p)&&(role==='ADMIN'||String(p?.permissions?.modules?.vlog||'').toLowerCase()==='edit'||(role==='BTC'&&(p?.sportAccess?.vlog===true||scopes.includes('vlog')||scope==='vlog'||handmade)));
};
const validUrl=s=>typeof s==='string'&&/^https:\/\/www\.tiktok\.com\/@[A-Za-z0-9._-]+\/video\/\d{8,22}$/.test(s);
export async function onRequestPost(context){
 try{
  const request=context.request,origin=request.headers.get('origin')||'';
  if(origin&&new URL(origin).host!==new URL(request.url).host)return json({ok:false,error:'INVALID_ORIGIN'},403);
  const token=(request.headers.get('authorization')||'').replace(/^Bearer\s+/i,'').trim(),uid=await verify(token);
  if(!uid)return json({ok:false,error:'AUTH_REQUIRED'},401);
  const profileUrl=DB_URL+'/topkey_badminton_vnext_2026/users/'+encodeURIComponent(uid)+'.json?auth='+encodeURIComponent(token);
  const profileResponse=await fetchWithTimeout(profileUrl,{},7000);
  if(!profileResponse.ok)return json({ok:false,error:'PROFILE_READ_FAILED'},502);
  const profile=await profileResponse.json();
  if(!allowed(profile))return json({ok:false,error:'VLOG_ADMIN_REQUIRED'},403);
  const body=await request.json(),kind=body?.kind==='search'?'search':'trend',keyword=String(body?.keyword||'').slice(0,80),cursor=String(body?.cursor??'0').slice(0,100),count=Math.max(1,Math.min(30,Number(body?.count)||30));
  if(kind==='search'&&!keyword)return json({ok:false,error:'KEYWORD_REQUIRED'},400);
  let upstream,payload;
  if(kind==='search'){
   const u=new URL('https://www.tikwm.com/api/feed/search/');
   u.searchParams.set('keywords',keyword);u.searchParams.set('count',String(count));u.searchParams.set('cursor',cursor);u.searchParams.set('hd','1');
   const headers={'user-agent':'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124.0 Safari/537.36','referer':'https://www.tiktok.com/','accept':'application/json'};
   upstream=await fetchWithTimeout(u.toString(),{headers},18000);
   if(upstream.status===403||upstream.status===405||upstream.status===429){
    const form=new URLSearchParams({keywords:keyword,count:String(count),cursor,hd:'1'});
    upstream=await fetchWithTimeout('https://www.tikwm.com/api/feed/search/',{method:'POST',headers:{...headers,'content-type':'application/x-www-form-urlencoded; charset=UTF-8','cookie':'current_language=en'},body:form},18000);
   }
  }else{
   const form=new URLSearchParams({region:'VN',count:String(count),cursor,web:'1',hd:'1'});
   upstream=await fetchWithTimeout('https://www.tikwm.com/api/feed/list/',{method:'POST',headers:{'content-type':'application/x-www-form-urlencoded; charset=UTF-8','user-agent':'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124.0 Safari/537.36','referer':'https://www.tiktok.com/','cookie':'current_language=en'},body:form},18000);
  }
  payload=await upstream.json().catch(()=>null);
  if(!upstream.ok||!payload)return json({ok:false,error:'SCRAPER_UPSTREAM_'+upstream.status},502);
  if(Number(payload.code)!==0)return json({ok:false,error:'TIKWM_'+String(payload.msg||payload.message||payload.code||'FAILED').slice(0,150)},502);
  const root=payload.data||payload;
  const list=Array.isArray(root)?root:(Array.isArray(root.videos)?root.videos:Array.isArray(root.items)?root.items:[]);
  const items=[];
  for(const v of list){
   const id=String(v.video_id||v.aweme_id||v.id||'');
   const username=String(v.author?.unique_id||v.author?.uniqueId||'');
   let url=String(v.share_url||v.shareUrl||'');
   if(!validUrl(url)&&username&&/^\d{8,22}$/.test(id))url='https://www.tiktok.com/@'+username+'/video/'+id;
   if(!validUrl(url))continue;
   items.push({id,url,username,authorName:String(v.author?.nickname||username||'TikTok VN'),views:Number(v.play_count)||0,likes:Number(v.digg_count)||0,shares:Number(v.share_count)||0});
  }
  const next=root.cursor??payload.cursor??root.next_cursor??payload.next_cursor??null;
  const hasMore=kind==='search'&&(root.hasMore===true||root.has_more===true||payload.hasMore===true||payload.has_more===true)&&(next!==null&&String(next)!==cursor);
  return json({ok:true,items,nextCursor:hasMore?String(next):null,hasMore,source:'TikWM public '+(kind==='trend'?'VN trending feed':'TikTok public search'),region:'VN',returned:items.length});
 }catch(e){return json({ok:false,error:String(e?.message||e).slice(0,220)},502)}
}
