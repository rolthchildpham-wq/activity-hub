<script lang="ts">
 import {onMount} from 'svelte';
 import {afterNavigate} from '$app/navigation';
 import {page} from '$app/stores';
 import {base} from '$app/paths';
 import {onAuthStateChanged,signInWithEmailAndPassword,signOut,type User} from 'firebase/auth';
 import {client} from '$lib/firebase';
 import {sports,legacyHref,type SportKey,isTestLab} from '$lib/domain';
 import {tournament,loadTournament,resetTournament} from '$lib/features/tournament/store';
 import StateView from '$lib/shared/ui/StateView.svelte';
 let {children}=$props();
 let user=$state<User|null>(null);
 let booting=$state(true);
 let error=$state('');
 let email=$state('');
 let password=$state('');
 let loggingIn=$state(false);
 let current='';
 let sport=$derived(sports.find(x=>x.key===$page.params.slug));
 let tid=$derived(String($page.params.tid||''));
 const modules=[
  {key:'',label:'Tổng quan',icon:'▦'},{key:'schedule',label:'Lịch thi đấu',icon:'▤'},
  {key:'bracket',label:'Bảng đấu',icon:'🏆'},{key:'live',label:'Trực tiếp',icon:'●'},{key:'referee',label:'Trọng tài',icon:'⚖'},
  {key:'leaderboard',label:'Xếp hạng',icon:'≡'},{key:'check-in',label:'Điểm danh',icon:'✓'},
  {key:'finance',label:'Tài chính',icon:'₫'},{key:'history',label:'Nhật ký',icon:'◷'}
 ];
 function loadIfAuthorized(){
  const sportKey=$page.params.slug as SportKey, id=String($page.params.tid||'');
  const signature=sportKey+'/'+id;
  if(!user||!sports.some(x=>x.key===sportKey)||!/^[A-Za-z0-9_-]{1,100}$/.test(id))return;
  if(current===signature)return;
  current=signature;loadTournament(sportKey,id);
 }
 afterNavigate(loadIfAuthorized);
 onMount(()=>{
  let alive=true;
  let unsub=()=>{};
  try{unsub=onAuthStateChanged(client().auth,u=>{
   if(!alive)return;
   user=u;booting=false;
   if(u)loadIfAuthorized();else{current='';resetTournament()}
  },e=>{error=e.message;booting=false});}
  catch(e){error=e instanceof Error?e.message:String(e);booting=false}
  return()=>{alive=false;unsub();resetTournament()};
 });
 async function login(){
  loggingIn=true;error='';
  try{await signInWithEmailAndPassword(client().auth,email,password);password=''}
  catch{error='Không thể đăng nhập. Kiểm tra tài khoản hoặc quyền truy cập.'}
  finally{loggingIn=false}
 }
 async function logout(){await signOut(client().auth);current='';resetTournament()}
 let baseRoute=$derived(base+'/sports/'+$page.params.slug+'/'+tid);
</script>
{#if booting}
 <StateView state="loading" message="Đang xác minh tài khoản…"/>
{:else if !sport||sport.key==='vlog'||!/^[A-Za-z0-9_-]{1,100}$/.test(tid)}
 <StateView state="error" message="Mã giải hoặc bộ môn không hợp lệ. Vlog có phân hệ riêng."/>
{:else if !user}
 <main class="auth-screen"><section class="login-card">
  <div class="logo-mark">TK</div><h1>Đăng nhập TOPKEY</h1>
  <p class="subtle">Vui lòng đăng nhập bằng tài khoản được cấp quyền để xem dữ liệu giải.</p>
  <form onsubmit={(event)=>{event.preventDefault();login()}} class="login-form">
   <label for="workspace-email">Email</label><input id="workspace-email" type="email" autocomplete="username" bind:value={email} required/>
   <label for="workspace-password">Mật khẩu</label><input id="workspace-password" type="password" autocomplete="current-password" bind:value={password} required/>
   <button type="submit" class="button primary" disabled={loggingIn}>{loggingIn?'Đang đăng nhập…':'Đăng nhập'}</button>
  </form>
  {#if error}<p class="alert" role="alert">{error}</p>{/if}
  <a href={legacyHref(sport.key,String($page.params.tid||''))} class="viewer-link">Xem lịch / kết quả công khai trên hệ thống hiện tại ↗</a>
  <p><a href={base+'/sports'} class="viewer-link">← Quay lại các bộ môn</a></p>
 </section></main>
{:else}
 <div class="workspace">
  <aside class="workspace-sidebar" aria-label="Điều hướng giải">
   <a class="workspace-back" href={base+'/sports'}>← Bộ môn</a>
   <h2>{sport.icon} {sport.name}</h2>
   <p class="subtle">Giải: {tid}</p>
   <span class="environment" class:testlab={isTestLab(tid)}>{isTestLab(tid)?'TEST LAB':'PRODUCTION'}</span>
   <nav class="workspace-nav">{#each modules as m}
    <a aria-current={$page.url.pathname===(m.key?baseRoute+'/'+m.key:baseRoute)?'page':undefined}
     href={m.key?baseRoute+'/'+m.key:baseRoute}>{m.icon} {m.label}</a>
   {/each}</nav>
   <button type="button" class="button outline" onclick={logout}>Đăng xuất</button>
  </aside>
  <div class="workspace-main">
   <header class="workspace-header">
    <div><a href={base+'/sports'}>TOPKEY</a> / {sport.name} / {tid}</div>
    <a class="button outline" href={base+'/'}>Dashboard tổng</a>
   </header>
   <main class="workspace-content">
    {#if $tournament.error}<StateView state="error" message={$tournament.error}/>
    {:else if !$tournament.loaded}<StateView state="loading" message="Đang đồng bộ các nhánh giải đấu…"/>
    {:else}{@render children()}{/if}
    <p class="workspace-disclaimer">Bảng mới ở chế độ đọc. Chấm điểm, phân quyền và chỉnh sửa dữ liệu sử dụng module TOPKEY hiện tại đến khi kiểm thử tương đương hoàn tất.</p>
   </main>
  </div>
 </div>
 <nav class="workspace-bottom" aria-label="Điều hướng nhanh">{#each modules.slice(0,5) as m}
  <a href={m.key?baseRoute+'/'+m.key:baseRoute}>{m.icon}<span>{m.label}</span></a>
 {/each}</nav>
{/if}
