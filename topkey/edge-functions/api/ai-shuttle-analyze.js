/* Upgrade77 EdgeOne Makers Edge Function.
   Runtime vision proxy: Firebase-authenticated, API key stays in context.env.
   Configure MAKERS_MODELS_KEY (or AI_GATEWAY_API_KEY). Optional TOPKEY_VISION_MODEL.
*/
const FIREBASE_API_KEY='AIzaSyBSr7buP3bMf6HTg_YDWH_Xk5aNhyvfSRg';
const DB='https://topkey-badminton-default-rtdb.asia-southeast1.firebasedatabase.app';
const ROOT='topkey_badminton_vnext_2026';
const json=(body,status=200)=>new Response(JSON.stringify(body),{status,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store'}});
function bearer(req){const h=req.headers.get('authorization')||'';return /^Bearer\s+/i.test(h)?h.replace(/^Bearer\s+/i,'').trim():''}
async function verifyFirebase(idToken){
  if(!idToken)throw new Error('AUTH_REQUIRED');
  const r=await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${FIREBASE_API_KEY}`,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({idToken})});
  if(!r.ok)throw new Error('AUTH_INVALID');const d=await r.json(),u=d.users?.[0];if(!u?.localId)throw new Error('AUTH_INVALID');
  let role='VIEWER';try{const rr=await fetch(`${DB}/${ROOT}/users/${encodeURIComponent(u.localId)}/role.json?auth=${encodeURIComponent(idToken)}`,{cache:'no-store'});if(rr.ok)role=String(await rr.json()||'VIEWER').toUpperCase()}catch{}
  if(!['ADMIN','UMPIRE','LIVE_ONLY'].includes(role))throw new Error('ROLE_DENIED');return{uid:u.localId,role};
}
function safeFrame(v){return typeof v==='string'&&/^data:image\/(jpeg|png|webp);base64,/i.test(v)&&v.length<260000}
function extractJson(text){const s=String(text||'').trim().replace(/^```(?:json)?\s*/i,'').replace(/\s*```$/,'');const a=s.indexOf('{'),b=s.lastIndexOf('}');if(a<0||b<a)throw new Error('AI_JSON_INVALID');return JSON.parse(s.slice(a,b+1))}
export async function onRequestGet(context){const key=context.env?.MAKERS_MODELS_KEY||context.env?.AI_GATEWAY_API_KEY||'';return json({ok:true,configured:!!key,model:context.env?.TOPKEY_VISION_MODEL||context.env?.AI_GATEWAY_MODEL||'@makers/deepseek-v4.1-flash',mode:'frame-vision',maxFrames:4});}
export async function onRequestPost(context){
  try{
    const auth=await verifyFirebase(bearer(context.request));const body=await context.request.json();const frames=Array.isArray(body?.frames)?body.frames.filter(safeFrame).slice(-4):[];if(frames.length<2)return json({ok:false,error:'NEED_2_FRAMES'},400);
    const total=frames.reduce((n,s)=>n+s.length,0);if(total>850000)return json({ok:false,error:'FRAMES_TOO_LARGE'},413);
    const key=context.env?.MAKERS_MODELS_KEY||context.env?.AI_GATEWAY_API_KEY||'';if(!key)return json({ok:false,error:'AI_NOT_CONFIGURED',setup:'Set MAKERS_MODELS_KEY in EdgeOne Makers environment variables.'},503);
    const base=String(context.env?.AI_GATEWAY_BASE_URL||'https://ai-gateway.edgeone.link/v1').replace(/\/$/,'');const model=context.env?.TOPKEY_VISION_MODEL||context.env?.AI_GATEWAY_MODEL||'@makers/deepseek-v4.1-flash';
    const meta=body?.meta&&typeof body.meta==='object'?body.meta:{};
    const prompt=`You are a badminton replay assistant, not an official line-call system. Analyze the ordered frames from one rally candidate. Return ONLY compact JSON with keys: event (SMASH|DROP|LINE_NEAR|OTHER), confidence (0..1), landing (IN|OUT|UNCLEAR), shuttleVisible (true|false), reasonVi (Vietnamese <= 120 chars). Be conservative. If shuttle/landing is not clearly visible choose OTHER/UNCLEAR. Local motion hint: ${JSON.stringify({hint:meta.hint||'',speed:meta.speed||0,nearEdge:!!meta.nearEdge,court:meta.court||''})}`;
    const content=[{type:'text',text:prompt},...frames.map(f=>({type:'image_url',image_url:{url:f,detail:'low'}}))];
    const r=await fetch(`${base}/chat/completions`,{method:'POST',headers:{authorization:`Bearer ${key}`,'content-type':'application/json'},body:JSON.stringify({model,messages:[{role:'user',content}],temperature:0.1,max_tokens:220})});
    if(!r.ok){const t=(await r.text()).slice(0,500);return json({ok:false,error:'AI_GATEWAY_ERROR',status:r.status,detail:t},502)}
    const d=await r.json();const text=d?.choices?.[0]?.message?.content;if(!text)return json({ok:false,error:'AI_EMPTY'},502);const result=extractJson(text);
    const event=['SMASH','DROP','LINE_NEAR','OTHER'].includes(result.event)?result.event:'OTHER';const landing=['IN','OUT','UNCLEAR'].includes(result.landing)?result.landing:'UNCLEAR';const confidence=Math.max(0,Math.min(1,Number(result.confidence)||0));
    return json({ok:true,event,landing,confidence,shuttleVisible:!!result.shuttleVisible,reasonVi:String(result.reasonVi||'').slice(0,160),model,authRole:auth.role,advisoryOnly:true});
  }catch(e){const m=e?.message||String(e);const status=m==='AUTH_REQUIRED'||m==='AUTH_INVALID'?401:m==='ROLE_DENIED'?403:500;return json({ok:false,error:m},status)}
}
export async function onRequestOptions(){return new Response(null,{status:204,headers:{'access-control-allow-origin':'*','access-control-allow-methods':'GET,POST,OPTIONS','access-control-allow-headers':'authorization,content-type'}})}
