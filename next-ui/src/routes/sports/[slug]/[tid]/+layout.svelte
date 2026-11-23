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
 let moreOpen=$state(false);
 let current='';
 let sport=$derived(sports.find(x=>x.key===$page.params.slug));
 let tid=$derived(String($page.params.tid||''));
 let baseRoute=$derived(base+'/sports/'+$page.params.slug+'/'+tid);
 let activeRoute=$derived(
  $page.url.pathname.replace(/\/$/,'')===baseRoute.replace(/\/$/,'')
   ? ''
   : $page.url.pathname.substring(baseRoute.length+1).split('/')[0]
 );
 const modules=[
  {key:'',label:'Tổng quan',icon:'▦'},
  {key:'schedule',label:'Lịch thi đấu',icon:'▤'},
  {key:'bracket',label:'Bảng đấu',icon:'🏆'},
  {key:'live',label:'Trực tiếp',icon:'●'},
  {key:'leaderboard',label:'Xếp hạng',icon:'≡'},
  {key:'check-in',label:'Điểm danh',icon:'✓'},
  {key:'referee',label:'Trọng tài',icon:'⚖'},
  {key:'finance',label:'Tài chính',icon:'₫'},
  {key:'history',label:'Nhật ký',icon:'◷'}
 ];
 let activeModule=$derived(modules.find(m=>m.key===activeRoute)||modules[0]);
 const primaryModules=modules.slice(0,4);
 const secondaryModules=modules.slice(4);
 const routeHref=(key:string)=>baseRoute+(key?'/'+key:'');
 const isCurrent=(key:string)=>activeRoute===key;
 function loadIfAuthorized(){
  const sportKey=$page.params.slug as SportKey;
  const id=String($page.params.tid||'');
  const signature=sportKey+'/'+id;
  if(!user||!sports.some(s=>s.key===sportKey)||sportKey==='vlog'||!/^[A-Za-z0-9_-]{1,100}$/.test(id)){
   current='';
   resetTournament();
   return;
  }
  if(current===signature)return;
  current=signature;
  loadTournament(sportKey,id);
 }
 afterNavigate(()=>{
  moreOpen=false;
  loadIfAuthorized();
 });
 onMount(()=>{
  let alive=true;
  let unsubscribe=()=>{};
  try{
   unsubscribe=onAuthStateChanged(client().auth,u=>{
    if(!alive)return;
    user=u;
    booting=false;
    if(u)loadIfAuthorized();
    else {current='';resetTournament()}
   },e=>{if(alive){error=e.message;booting=false}});
  }catch(e){error=e instanceof Error?e.message:String(e);booting=false}
  return()=>{alive=false;unsubscribe();resetTournament()};
 });
 async function login(){
  loggingIn=true;
  error='';
  try{
   await signInWithEmailAndPassword(client().auth,email,password);
   password='';
  }catch{
   error='Không thể đăng nhập. Kiểm tra tài khoản hoặc quyền truy cập.';
  }finally{loggingIn=false}
 }
 async function logout(){
  moreOpen=false;
  await signOut(client().auth);
  current='';
  resetTournament();
 }
</script>

{#if booting}
 <StateView state="loading" message="Đang xác minh tài khoản…"/>
{:else if !sport||sport.key==='vlog'||!/^[A-Za-z0-9_-]{1,100}$/.test(tid)}
 <StateView state="error" message="Mã giải hoặc bộ môn không hợp lệ. Vlog có phân hệ riêng."/>
{:else if !user}
 <main class="auth-screen"><section class="login-card">
  <div class="logo-mark">TK</div>
  <h1>Đăng nhập TOPKEY</h1>
  <p class="subtle">Vui lòng đăng nhập bằng tài khoản được cấp quyền để xem dữ liệu giải.</p>
  <form onsubmit={(event)=>{event.preventDefault();void login()}} class="login-form">
   <label for="workspace-email">Email</label>
   <input id="workspace-email" type="email" autocomplete="username" bind:value={email} required/>
   <label for="workspace-password">Mật khẩu</label>
   <input id="workspace-password" type="password" autocomplete="current-password" bind:value={password} required/>
   <button type="submit" class="button primary" disabled={loggingIn}>{loggingIn?'Đang đăng nhập…':'Đăng nhập'}</button>
  </form>
  {#if error}<p class="alert" role="alert">{error}</p>{/if}
  <a href={legacyHref(sport.key,tid)} class="viewer-link">Xem lịch / kết quả công khai trên hệ thống hiện tại ↗</a>
  <p><a href={base+'/sports'} class="viewer-link">← Quay lại các bộ môn</a></p>
 </section></main>
{:else}
 <div class="workspace workspace-two-layer">
  <aside class="workspace-home-rail" aria-label="Điều hướng toàn hệ thống">
   <a href={base+'/'} class="home-rail-logo" aria-label="Trang chủ TOPKEY">TK</a>
   <a href={base+'/'} title="Trang chủ" aria-label="Trang chủ">⌂</a>
   <a href={base+'/sports'} title="Danh sách bộ môn" aria-label="Bộ môn" aria-current="page">▦</a>
   <a href="/index.html" title="TOPKEY hiện tại" aria-label="Website hiện tại">↗</a>
  </aside>

  <aside class="workspace-sidebar" aria-label="Điều hướng giải">
   <a class="workspace-back" href={base+'/sports'}>← Tất cả bộ môn</a>
   <h2>{sport.icon} {sport.name}</h2>
   <p class="subtle workspace-tid" title={tid}>Giải: {tid}</p>
   <span class="environment" class:testlab={isTestLab(tid)}>{isTestLab(tid)?'TEST LAB':'PRODUCTION'}</span>
   <nav class="workspace-nav" aria-label="Các chức năng">
    {#each modules as m}
     <a aria-current={isCurrent(m.key)?'page':undefined}
      href={routeHref(m.key)}>{m.icon} <span>{m.label}</span></a>
    {/each}
   </nav>
   <button type="button" class="button outline" onclick={logout}>Đăng xuất</button>
  </aside>

  <div class="workspace-main">
   <header class="workspace-header">
    <nav aria-label="Đường dẫn trang" class="workspace-breadcrumb">
     <a href={base+'/'}>TOPKEY</a><span aria-hidden="true">/</span>
     <a href={base+'/sports'}>{sport.name}</a><span aria-hidden="true">/</span>
     <span aria-current="page">{activeModule.label}</span>
    </nav>
    <a class="button outline" href={base+'/'}>Dashboard tổng</a>
   </header>
   <main class="workspace-content" id="workspace-content">
    {#if $tournament.error}
     <StateView state="error" message={$tournament.error}/>
    {:else if !$tournament.loaded}
     <StateView state="loading" message="Đang đồng bộ các nhánh giải đấu…"/>
    {:else}
     {@render children()}
    {/if}
    <p class="workspace-disclaimer">Giao diện mới đang ở chế độ xem. Chấm điểm, phân quyền và chỉnh sửa dữ liệu tiếp tục dùng module TOPKEY hiện tại cho tới khi kiểm thử tương đương hoàn tất.</p>
   </main>
  </div>
 </div>
 <nav class="workspace-bottom" aria-label="Điều hướng nhanh">
  {#each primaryModules as m}
   <a href={routeHref(m.key)} aria-current={isCurrent(m.key)?'page':undefined}>
    <span aria-hidden="true">{m.icon}</span><span>{m.label}</span>
   </a>
  {/each}
  <button type="button" aria-expanded={moreOpen} aria-controls="workspace-more-menu" onclick={()=>moreOpen=!moreOpen}>
   <span aria-hidden="true">☰</span><span>Thêm</span>
  </button>
 </nav>
 {#if moreOpen}
  <button type="button" class="workspace-more-backdrop" aria-label="Đóng danh mục" onclick={()=>moreOpen=false}></button>
  <nav id="workspace-more-menu" class="workspace-more-menu" aria-label="Các chức năng khác">
   <div class="workspace-more-title">Điều hành giải đấu <button type="button" aria-label="Đóng" onclick={()=>moreOpen=false}>✕</button></div>
   {#each secondaryModules as m}
    <a href={routeHref(m.key)} aria-current={isCurrent(m.key)?'page':undefined}>{m.icon} {m.label}</a>
   {/each}
   <button type="button" class="workspace-signout-mobile" onclick={logout}>Đăng xuất</button>
  </nav>
 {/if}
{/if}
