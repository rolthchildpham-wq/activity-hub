<script lang="ts">
 import {onMount} from 'svelte';
 import {sports,summarize,groupPhases,isTestLab,legacyHref,type SportKey,type TournamentSnapshot} from '$lib/domain';
 import {client,listenTournament} from '$lib/firebase';
 import {signInWithEmailAndPassword,signOut,onAuthStateChanged,type User} from 'firebase/auth';
 import type {Auth} from 'firebase/auth';
 import type {Database} from 'firebase/database';
 let auth:Auth, db:Database;
 let user:User|null=null,booting=true,loading=false,error='',email='',password='';
 let selected:SportKey='volleyball',tid='main_2026',sidebar=false,tab:'overview'|'schedule'='overview';
 let data:TournamentSnapshot={teams:{},matches:{},activeMatches:{},config:{}};
 let hasData=false;
 let unsubscribeData:(()=>void)|undefined,unsubscribeAuth:(()=>void)|undefined;
 $: stats=summarize(data);
 $: phases=groupPhases(data.matches);
 $: matches=Object.values(data.matches).sort((a,b)=>((a.date||'')+' '+(a.time||'')).localeCompare((b.date||'')+' '+(b.time||'')));
 $: sport=sports.find(s=>s.key===selected)!;
 function subscribe(){
   unsubscribeData?.();hasData=false;error='';data={teams:{},matches:{},activeMatches:{},config:{}};
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
   <div class="login-eyebrow">TOPKEY · SPORTS MANAGEMENT</div>
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
   <div class="side-logo"><span class="logo-mark small-logo">TK</span><div><strong>TOPKEY</strong><small>SPORTS HUB · VNEXT</small></div></div>
   <p class="side-section">BỘ MÔN</p>
   <nav class="sport-list" aria-label="Chọn bộ môn">
    {#each sports as s}<button class:current={selected===s.key} on:click={()=>choose(s.key)}><span aria-hidden="true">{s.icon}</span><span>{s.name}</span></button>{/each}
   </nav>
   <div class="sidebar-foot"><p>Hệ thống mới · Đang chuyển đổi</p><a href="/index.html">Mở Hub hiện tại ↗</a></div>
  </aside>
  {#if sidebar}<button class="sidebar-backdrop" aria-label="Đóng menu" on:click={()=>sidebar=false}></button>{/if}
  <div class="content-shell">
   <header class="topbar">
    <div class="top-left"><button class="icon-button burger" aria-label="Mở danh mục" on:click={()=>sidebar=!sidebar}>☰</button><div><div class="overline">TOPKEY / {sport.name}</div><h1>Trung tâm điều hành</h1></div></div>
    <div class="top-actions"><span class="environment" class:testlab={isTestLab(tid)}>{isTestLab(tid)?'TEST LAB':'PRODUCTION'}</span><span class="user-email" title={user.email||''}>{user.email}</span><button class="button outline" on:click={logout}>Đăng xuất</button></div>
   </header>
   <main class="dashboard">
    <section class="heading-row"><div><div class="overline">GIẢI ĐẤU · {sport.name.toUpperCase()}</div><h2>{typeof data.config?.title==='string'?data.config.title:'Tổng quan giải đấu'}</h2><p class="subtle">Dữ liệu chỉ đọc, trực tiếp từ giải đã chọn. Không có số liệu mô phỏng.</p></div>
     <a class="button primary" href={legacyHref(selected)}>Mở chức năng đầy đủ ↗</a>
    </section>
    <section class="source-row">
     <form on:submit|preventDefault={changeTid} class="tid-form"><label for="tid">Mã giải đấu</label><input id="tid" bind:value={tid} autocomplete="off" spellcheck="false"/><button class="button neutral" type="submit">Tải dữ liệu</button></form>
     {#if loading}<span class="status" role="status">● Đang đồng bộ Firebase…</span>{:else if error}<span class="status error" role="alert">● Lỗi kết nối</span>{:else if hasData}<span class="status success">● Đã nhận dữ liệu</span>{:else}<span class="status">● Chưa kết nối</span>{/if}
    </section>
    {#if error}<div class="alert" role="alert">{error}</div>{/if}
    <div class="section-tabs"><button class:active={tab==='overview'} on:click={()=>tab='overview'}>Tổng quan</button><button class:active={tab==='schedule'} on:click={()=>tab='schedule'}>Lịch thi đấu</button></div>
    {#if selected==='vlog'}<section class="panel empty-panel"><h3>Vlog 2026</h3><p class="subtle">Dữ liệu Vlog thuộc module riêng. Mở phân hệ hiện tại để xem bài dự thi và điểm.</p><a href={legacyHref('vlog')} class="button primary">Mở Vlog ↗</a></section>
    {:else if !hasData}
     <section class="panel empty-panel"><h3>{loading?'Đang tải giải đấu…':'Chưa có dữ liệu để hiển thị'}</h3><p class="subtle">Chọn đúng mã giải và đăng nhập với tài khoản có quyền đọc. Không hiển thị số 0 như kết quả thật trước khi tải xong.</p></section>
    {:else if tab==='overview'}
     <div class="kpi-grid">
      <div class="panel kpi accent-green"><span>Đội / VĐV</span><strong>{stats.teams}</strong><small>Đã đăng ký</small></div>
      <div class="panel kpi accent-blue"><span>Đã điểm danh</span><strong>{stats.checkedIn}</strong><small>Trên tổng {stats.teams}</small></div>
      <div class="panel kpi accent-orange"><span>Trận đang Live</span><strong>{stats.live}</strong><small>Theo trạng thái trận / sân</small></div>
      <div class="panel kpi accent-purple"><span>Đã hoàn tất</span><strong>{stats.completed}</strong><small>Trên {stats.scheduled} trận</small></div>
     </div>
     <div class="analysis-grid">
      <section class="panel"><div class="panel-heading"><h3>Tiến độ thi đấu</h3><span class="tag">Theo dữ liệu giải</span></div>
       {#if phases.length===0}<p class="subtle">Chưa có lịch thi đấu.</p>{:else}<div class="progress-list">{#each phases as phase}
        <div class="progress-item"><div><strong>{phase.name}</strong><span>{phase.done} / {phase.total} trận</span></div><div class="track"><div class="fill" style:width={(phase.total?phase.done/phase.total*100:0)+'%'}></div></div></div>
       {/each}</div>{/if}
      </section>
      <section class="panel"><div class="panel-heading"><h3>Điểm danh</h3><span class="tag">Realtime</span></div>
       <div class="donut" style:--fraction={(stats.teams?stats.checkedIn/stats.teams*100:0)+'%'}><div><strong>{stats.teams?Math.round(stats.checkedIn/stats.teams*100)+'%':'—'}</strong><small>đã check-in</small></div></div>
       <p class="subtle centered">{stats.checkedIn} / {stats.teams} đội hoặc VĐV</p>
      </section>
     </div>
     <section class="panel"><div class="panel-heading"><h3>Trận đấu gần đây và sắp diễn ra</h3><button class="text-button" on:click={()=>tab='schedule'}>Xem toàn bộ →</button></div>
      {#if matches.length===0}<p class="subtle">Chưa có trận đấu.</p>{:else}<div class="match-grid">{#each matches.slice(0,6) as m}
       <article class="match-card"><div class="match-meta">{m.date||'Chưa định ngày'} · {m.time||'Chưa có giờ'} <span class:live={m.status==='LIVE'} class="match-status">{m.status||'SCHEDULED'}</span></div>
        <strong>{data.teams[m.teamAId||'']?.name||'Đội A'} <span class="versus">vs</span> {data.teams[m.teamBId||'']?.name||'Đội B'}</strong>
        <small>{m.category||'Chung'} · {m.groupName||m.groupId||m.group||m.stage||'Chưa phân bảng'}</small>
       </article>{/each}</div>{/if}
     </section>
    {:else}
     <section class="panel"><div class="panel-heading"><h3>Lịch và kết quả</h3><span class="tag">{matches.length} trận</span></div>
     {#if matches.length===0}<p class="subtle">Chưa có trận đấu.</p>{:else}<div class="table-scroll"><table><thead><tr><th>Trận</th><th>Ngày / Giờ</th><th>Đội A</th><th>Đội B</th><th>Bảng / Vòng</th><th>Trạng thái</th></tr></thead><tbody>{#each matches as m}<tr><td>{m.code||m.id||'—'}</td><td>{m.date||'—'} {m.time||''}</td><td>{data.teams[m.teamAId||'']?.name||'—'}</td><td>{data.teams[m.teamBId||'']?.name||'—'}</td><td>{m.groupName||m.groupId||m.group||m.stage||'—'}</td><td><span class:live={m.status==='LIVE'} class="match-status">{m.status||'SCHEDULED'}</span></td></tr>{/each}</tbody></table></div>{/if}
     </section>
    {/if}
    <footer class="app-footer">TOPKEY NEXT · Giao diện mới thử nghiệm · Các thao tác ghi dữ liệu vẫn thực hiện tại module hiện tại. <a href="/index.html">Trở về Hub ↗</a></footer>
   </main>
  </div>
 </div>
 <nav class="mobile-bottom" aria-label="Tác vụ nhanh"><button class:active={tab==='overview'} on:click={()=>tab='overview'}>⌂<span>Trang chủ</span></button><button class:active={tab==='schedule'} on:click={()=>tab='schedule'}>▤<span>Lịch</span></button><a href={legacyHref(selected)}>●<span>Trực tiếp</span></a><button on:click={()=>sidebar=true}>☰<span>Bộ môn</span></button></nav>
{/if}
