<script lang="ts">
 import {onMount} from 'svelte';
 import {base} from '$app/paths';
 import {sports,isTestLab,legacyHref,emptyTournament,sortDashboardMatches,formatMatchScore,type SportKey,type TournamentSnapshot} from '$lib/domain';
 import DashboardStats from '$lib/widgets/DashboardStats.svelte';
 import ScheduleTable from '$lib/widgets/ScheduleTable.svelte';
 import StateView from '$lib/shared/ui/StateView.svelte';
 import Button from '$lib/shared/ui/Button.svelte';
 import {client,listenTournament} from '$lib/firebase';
 import {signInWithEmailAndPassword,signOut,onAuthStateChanged,type User} from 'firebase/auth';
 import type {Auth} from 'firebase/auth';
 import type {Database} from 'firebase/database';
 let auth:Auth, db:Database;
 let user:User|null=null,booting=true,loading=false,error='',email='',password='';
 let selected:SportKey='volleyball',tid='main_2026',sidebar=false,tab:'overview'|'schedule'='overview';
 let data:TournamentSnapshot=emptyTournament();
 let hasData=false;
 let unsubscribeData:(()=>void)|undefined,unsubscribeAuth:(()=>void)|undefined;
 $: matches=sortDashboardMatches(data.matches);
 $: sport=sports.find(s=>s.key===selected)!;
 function statusText(value?:string){const key=(value||'SCHEDULED').toUpperCase();return ({SCHEDULED:'Chưa đấu',PENDING:'Chờ đấu',LIVE:'Đang thi đấu',IN_PROGRESS:'Đang thi đấu',FINISHED:'Đã kết thúc',WALKOVER:'Bỏ cuộc',RETIRED:'Dừng trận',DISQUALIFIED:'Bị loại'} as Record<string,string>)[key]||key}
 function subscribe(){
   unsubscribeData?.();hasData=false;error='';data=emptyTournament();
   if(!user||!db||selected==='vlog')return;
   loading=true;
   try{unsubscribeData=listenTournament(db,selected,tid,value=>{data=value;hasData=true;loading=false},e=>{loading=false;error='Không thể đọc giải. Kiểm tra mã giải và quyền truy cập: '+e.message})}
   catch(e){loading=false;error=e instanceof Error?e.message:String(e)}
 }
 function choose(key:SportKey){selected=key;tab='overview';sidebar=false;subscribe()}
 function changeTid(){tid=tid.trim();if(!tid)return;subscribe()}
 async function login(){error='';try{await signInWithEmailAndPassword(auth,email,password);password=''}catch(e){error='Không thể đăng nhập. Kiểm tra tài khoản, mật khẩu và quyền Firebase.'}}
 async function logout(){unsubscribeData?.();await signOut(auth);user=null;data={teams:{},matches:{},activeMatches:{},config:{}}}
 onMount(()=>{
   try{const c=client();auth=c.auth;db=c.db;unsubscribeAuth=onAuthStateChanged(auth,u=>{user=u;booting=false;subscribe()},e=>{booting=false;error=e.message})}
   catch(e){booting=false;error=e instanceof Error?e.message:String(e)}
   return ()=>{unsubscribeData?.();unsubscribeAuth?.()}
 });
</script>

<svelte:head><title>TOPKEY · Quản lý thể thao</title><meta name="description" content="TOPKEY Sports Hub – dashboard thể thao theo dữ liệu giải thực tế"/></svelte:head>
{#if booting}
 <main class="boot-state" role="status"><div class="spinner"></div><h1>TOPKEY SPORTS</h1><p>Đang khởi tạo xác thực…</p></main>
{:else if !user}
 <main class="auth-screen">
  <section class="login-card">
   <div class="logo-mark">TK</div>
   <div class="login-eyebrow">TOPKEY · Sports management</div>
   <h1>Chào mừng trở lại</h1><p class="subtle">Đăng nhập để xem dữ liệu giải đấu và quản trị theo quyền tài khoản.</p>
   <form on:submit|preventDefault={login} class="login-form">
    <label for="login-email">Email</label><input id="login-email" type="email" autocomplete="username" bind:value={email} required placeholder="Email được cấp quyền"/>
    <label for="login-password">Mật khẩu</label><input id="login-password" type="password" autocomplete="current-password" bind:value={password} required placeholder="Nhập mật khẩu"/>
    <button type="submit" class="button primary">Đăng nhập</button>
   </form>
   {#if error}<p class="alert" role="alert">{error}</p>{/if}
   <p class="subtle small">Không có đăng ký tự do. Chỉ tài khoản đã được cấp quyền Firebase mới truy cập dữ liệu quản trị.</p>
   <a class="viewer-link" href="/index.html">← Trở về Sports Hub hiện tại</a>
  </section>
 </main>
{:else}
 <div class="app-layout">
  <aside class:mobile-open={sidebar} class="sidebar">
   <div class="side-logo"><span class="logo-mark small-logo">TK</span><div><strong>TOPKEY</strong><small>Sports Hub · VNext</small></div></div>
   <p class="side-section">Bộ môn</p>
   <nav class="sport-list" aria-label="Chọn bộ môn">
    {#each sports as s}<button class:current={selected===s.key} aria-label={s.name} on:click={()=>choose(s.key)}><span aria-hidden="true">{s.icon}</span><span>{s.name}</span></button>{/each}
   </nav>
   <div class="sidebar-foot"><p>Hệ thống mới · Đang chuyển đổi</p><a href="/index.html">Mở Hub hiện tại ↗</a></div>
  </aside>
  {#if sidebar}<button class="sidebar-backdrop" aria-label="Đóng menu" on:click={()=>sidebar=false}></button>{/if}
  <div class="content-shell">
   <header class="topbar">
    <div class="top-left"><button class="icon-button burger" aria-label="Mở danh mục" on:click={()=>sidebar=!sidebar}>☰</button><div><div class="overline">TOPKEY / {sport.name}</div><h1>Trung tâm điều hành</h1></div></div>
    <div class="top-actions"><a class="button outline" href={base+'/settings'}>Cài đặt UI/UX</a><span class="environment" class:testlab={isTestLab(tid)}>{isTestLab(tid)?'TEST LAB':'PRODUCTION'}</span><span class="user-email" title={user.email||''}>{user.email}</span><button class="button outline" on:click={logout}>Đăng xuất</button></div>
   </header>
   <main class="dashboard">
    <section class="heading-row"><div><div class="overline">Giải đấu · {sport.name}</div><h2>{typeof data.config?.title==='string'?data.config.title:'Tổng quan giải đấu'}</h2><p class="subtle">Dữ liệu chỉ đọc, trực tiếp từ giải đã chọn. Không có số liệu mô phỏng.</p></div>
     <div class="heading-links"><a class="button outline" href={base+'/sports/'+selected+'/'+encodeURIComponent(tid)}>Mở các module mới →</a>
     <a class="button primary" href={legacyHref(selected,tid)}>Mở chức năng đầy đủ ↗</a></div>
    </section>
    <section class="source-row">
     <form on:submit|preventDefault={changeTid} class="tid-form"><label for="tid">Mã giải đấu</label><input id="tid" bind:value={tid} autocomplete="off" spellcheck="false"/><Button variant="neutral" type="submit" loading={loading}>Tải dữ liệu</Button></form>
     {#if loading}<span class="status" role="status">● Đang đồng bộ Firebase…</span>{:else if error}<span class="status error" role="alert">● Lỗi kết nối</span>{:else if hasData}<span class="status success">● Đã nhận dữ liệu</span>{:else}<span class="status">● Chưa kết nối</span>{/if}
    </section>
    <div class="section-tabs"><button class:active={tab==='overview'} on:click={()=>tab='overview'}>Tổng quan</button><button class:active={tab==='schedule'} on:click={()=>tab='schedule'}>Lịch thi đấu</button></div>
    {#if selected==='vlog'}<section class="panel empty-panel"><h3>Vlog 2026</h3><p class="subtle">Dữ liệu Vlog thuộc module riêng. Mở phân hệ hiện tại để xem bài dự thi và điểm.</p><a href={legacyHref('vlog')} class="button primary">Mở Vlog ↗</a></section>
    {:else if !hasData}
     <StateView state={error?'error':loading?'loading':'empty'} message={error||'Chọn đúng mã giải và đăng nhập với tài khoản có quyền đọc.'}/>
    {:else if tab==='overview'}
     <DashboardStats {data}/>
     <section class="panel"><div class="panel-heading"><h3>Trận đấu gần đây và sắp diễn ra</h3><button class="text-button" on:click={()=>tab='schedule'}>Xem toàn bộ →</button></div>
      {#if matches.length===0}<p class="subtle">Chưa có trận đấu.</p>{:else}<div class="match-grid">{#each matches.slice(0,6) as [id,m]}
       {@const scoreText=formatMatchScore(m)}
       <article class="match-card"><div class="match-meta">{m.date||'Chưa định ngày'} · {m.time||'Chưa có giờ'} <span class:live={['LIVE','IN_PROGRESS'].includes((m.status||'').toUpperCase())} class="match-status">{statusText(m.status)}</span></div>
        <strong>{data.teams[m.teamAId||'']?.name||'Đội A'} <span class="versus">vs</span> {data.teams[m.teamBId||'']?.name||'Đội B'}</strong>
        <small>{m.category||'Chung'} · {m.groupName||m.groupId||m.group||m.stage||'Chưa phân bảng'}</small>
        {#if scoreText}<span class="match-score" aria-label={'Tỉ số '+scoreText}>{scoreText}</span>{/if}
       </article>{/each}</div>{/if}
     </section>
    {:else}
     <ScheduleTable {data}/>
    {/if}
    <footer class="app-footer">TOPKEY NEXT · Giao diện mới thử nghiệm · Các thao tác ghi dữ liệu vẫn thực hiện tại module hiện tại. <a href="/index.html">Trở về Hub ↗</a></footer>
   </main>
  </div>
 </div>
 <nav class="mobile-bottom" aria-label="Tác vụ nhanh"><button class:active={tab==='overview'} on:click={()=>tab='overview'}>⌂<span>Trang chủ</span></button><button class:active={tab==='schedule'} on:click={()=>tab='schedule'}>▤<span>Lịch</span></button><a href={legacyHref(selected,tid)}>●<span>Trực tiếp</span></a><button on:click={()=>sidebar=true}>☰<span>Bộ môn</span></button></nav>
{/if}
