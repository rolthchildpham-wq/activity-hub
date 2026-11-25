<script lang="ts">
 import {onMount} from 'svelte';
 import {base} from '$app/paths';
 import {onAuthStateChanged,getIdTokenResult,type User} from 'firebase/auth';
 import {client} from '$lib/firebase';
 import {uiRepositories,uiRepositoryGroups} from '$lib/features/ui-settings/catalog';
 type Theme='ivory'|'slate'|'midnight'; type Density='comfortable'|'compact';
 let user:User|null=$state(null),booting=$state(true),isAdmin=$state(false),error=$state(''),saved=$state(false);
 let theme:Theme=$state('ivory'),density:Density=$state('comfortable'),motion=$state(true);
 let enabled=$state<Record<string,boolean>>(Object.fromEntries(uiRepositories.map(item=>[item.id,item.enabledByDefault])));
 let activeGroup=$state('all');
 const themes={ivory:{bg:'#f4f5f2',surface:'#ffffff',ink:'#183b38',accent:'#b85c46',nav:'#183b38'},slate:{bg:'#edf1f5',surface:'#ffffff',ink:'#24364b',accent:'#3b72a4',nav:'#24364b'},midnight:{bg:'#111b24',surface:'#1b2935',ink:'#edf4f5',accent:'#e28a69',nav:'#0b141c'}};
 let selectedTheme=$derived(themes[theme]);
 let visibleRepositories=$derived(activeGroup==='all'?uiRepositories:uiRepositories.filter(item=>item.group===activeGroup));
 onMount(()=>{
  let alive=true;let unsubscribe=()=>{};
  try{unsubscribe=onAuthStateChanged(client().auth,async current=>{
   if(!alive)return;user=current;
   if(!current){isAdmin=false;booting=false;return}
   try{
    const token=await getIdTokenResult(current);const claims=token.claims as Record<string,unknown>;
    const roles=Array.isArray(claims.roles)?claims.roles:[];
    const permissions=(claims.permissions&&typeof claims.permissions==='object'?claims.permissions:{}) as Record<string,unknown>;
    isAdmin=claims.admin===true||claims.superAdmin===true||claims.role==='admin'||claims.role==='superadmin'||roles.some(role=>role==='admin'||role==='superadmin')||permissions.systemAdmin===true;
    if(isAdmin){try{const raw=localStorage.getItem('topkey-uiux-admin-preferences-v1');if(raw){const value=JSON.parse(raw);if(['ivory','slate','midnight'].includes(value.theme))theme=value.theme;if(['comfortable','compact'].includes(value.density))density=value.density;if(typeof value.motion==='boolean')motion=value.motion;if(value.enabled&&typeof value.enabled==='object')enabled={...enabled,...value.enabled}}}catch{error='Không đọc được tùy chọn đã lưu trên thiết bị này.'}}
   }catch{isAdmin=false;error='Không xác minh được quyền quản trị. Vui lòng đăng nhập lại.'}
   booting=false;
  },e=>{error=e.message;booting=false})}catch(e){error=e instanceof Error?e.message:String(e);booting=false}
  return()=>{alive=false;unsubscribe()};
 });
 function save(){try{localStorage.setItem('topkey-uiux-admin-preferences-v1',JSON.stringify({theme,density,motion,enabled}));saved=true}catch{error='Không thể lưu tùy chọn trên thiết bị này.'}}
 function reset(){theme='ivory';density='comfortable';motion=true;enabled=Object.fromEntries(uiRepositories.map(item=>[item.id,item.enabledByDefault]));saved=false}
 function compatibility(fit:string){return ({svelte:'Tương thích Svelte',react:'React only',framework:'Cần đánh giá tích hợp',optional:'Module tùy chọn 3D'})[fit]||fit}
</script>
<svelte:head><title>TOPKEY · Cài đặt UI/UX</title><meta name="description" content="Quản trị thư viện giao diện, theme và tùy chọn trải nghiệm TOPKEY"/></svelte:head>
{#if booting}
 <main class="settings-state"><p>Đang xác minh quyền quản trị…</p></main>
{:else if !user}
 <main class="settings-state"><section class="settings-panel"><h1>Cần đăng nhập</h1><p>Đăng nhập tài khoản TOPKEY được cấp quyền quản trị để mở cài đặt UI/UX.</p><a href={base+'/'}>← Về trang đăng nhập</a></section></main>
{:else if !isAdmin}
 <main class="settings-state"><section class="settings-panel"><h1>Không đủ quyền</h1><p>Trang này chỉ dành cho tài khoản có custom claim admin, superAdmin hoặc permissions.systemAdmin.</p><p>Không có thay đổi nào được ghi vào Firebase.</p><a href={base+'/'}>← Quay lại Sports Hub</a></section></main>
{:else}
 <main class="settings-page" style={"--preview-bg:"+selectedTheme.bg+";--preview-surface:"+selectedTheme.surface+";--preview-ink:"+selectedTheme.ink+";--preview-accent:"+selectedTheme.accent+";--preview-nav:"+selectedTheme.nav}>
  <header class="settings-header"><div><a href={base+'/'} class="back-link">← Sports Hub</a><p class="eyebrow">ADMIN CONTROL CENTER</p><h1>Cài đặt giao diện UI/UX</h1><p class="intro">Quản lý nguồn thiết kế, theme và hành vi giao diện tập trung.</p></div><span class="admin-chip">ADMIN · {user.email}</span></header>
  {#if error}<p class="settings-alert" role="alert">{error}</p>{/if}
  <section class="settings-panel"><div class="section-title"><div><p class="eyebrow">01 · DESIGN SYSTEM</p><h2>Tùy biến giao diện</h2><p>Thay đổi xem trước ngay trên trang này.</p></div></div>
   <div class="settings-grid">
    <label>Theme màu<select bind:value={theme}><option value="ivory">Ivory · TOPKEY</option><option value="slate">Slate · chuyên nghiệp</option><option value="midnight">Midnight · tối</option></select></label>
    <label>Mật độ hiển thị<select bind:value={density}><option value="comfortable">Thoáng · dễ đọc</option><option value="compact">Gọn · nhiều dữ liệu</option></select></label>
    <label class="toggle-row"><input type="checkbox" bind:checked={motion}/> Cho phép chuyển động UI</label>
   </div>
   <div class:compact={density==='compact'} class:reduce-motion={!motion} class="theme-preview">
    <div class="preview-nav"><strong>TOPKEY</strong><span>Dashboard</span><span>Lịch thi đấu</span><span>Trọng tài</span></div>
    <div class="preview-content"><div><small>SPORTS MANAGEMENT</small><h3>Trung tâm điều hành</h3><p>Trận đấu gần đây và sắp diễn ra</p></div><div class="preview-cards"><article><small>ĐANG THI ĐẤU</small><strong>08</strong></article><article><small>ĐÃ HOÀN TẤT</small><strong>24</strong></article><article><small>ĐỘI THAM GIA</small><strong>16</strong></article></div><button type="button">Xem trước thay đổi</button></div>
   </div>
   <p class="helper">Tùy chọn hiện được lưu trên trình duyệt quản trị này. Chưa ghi cấu hình dùng chung lên Firebase và không tự thay đổi giao diện production.</p>
  </section>
  <section class="settings-panel"><div class="section-title"><div><p class="eyebrow">02 · REPOSITORY LIBRARY</p><h2>Thư viện GitHub UI/UX</h2><p>Bật/tắt nguồn tham khảo cho quy trình thiết kế. Không tự tải mã nguồn hoặc chèn script bên thứ ba vào website.</p></div><span class="count">{uiRepositories.length} repositories</span></div>
   <div class="filters" aria-label="Lọc nhóm repository"><button class:active={activeGroup==='all'} onclick={()=>activeGroup='all'}>Tất cả</button>{#each uiRepositoryGroups as group}<button class:active={activeGroup===group.id} onclick={()=>activeGroup=group.id}>{group.label}</button>{/each}</div>
   <div class="repository-grid">{#each visibleRepositories as item}
    <article class="repository-card"><div class="repo-top"><div><p class="repo-group">{uiRepositoryGroups.find(group=>group.id===item.group)?.label}</p><h3>{item.name}</h3><code>{item.repo}</code></div><input type="checkbox" aria-label={'Bật '+item.name} bind:checked={enabled[item.id]}/></div>
     <p>{item.purpose}</p><div class="repo-tags"><span class:compatible={item.fit==='svelte'}>{compatibility(item.fit)}</span><span>{item.enabledByDefault?'Mặc định đề xuất':'Tùy chọn'}</span></div>
     <p class="repo-note">{item.notes}</p><p class="admin-control">{item.adminControl}</p><a href={item.url} target="_blank" rel="noopener noreferrer">Mở repository GitHub ↗</a>
    </article>
   {/each}</div>
  </section>
  <footer class="settings-footer"><p>Danh mục repository là cấu hình tham khảo; thêm dependency, import component và deploy phải qua PR + kiểm thử tương thích.</p><div><button class="secondary" onclick={reset}>Khôi phục mặc định</button><button class="primary" onclick={save}>Lưu tùy chọn trên thiết bị</button></div>{#if saved}<span role="status">Đã lưu tùy chọn UI/UX trên thiết bị này.</span>{/if}</footer>
 </main>
{/if}
<style>
 .settings-page{max-width:1180px;margin:0 auto;padding:28px 24px 54px;color:var(--preview-ink,#193b38)}.settings-header{display:flex;justify-content:space-between;align-items:flex-start;gap:20px;margin-bottom:24px}.back-link{color:#476c65;text-decoration:none;font-weight:700;font-size:13px}.eyebrow{font-size:10px;letter-spacing:.12em;font-weight:850;color:#a35b48;margin:16px 0 7px}.settings-header h1{font-size:clamp(25px,4vw,34px);margin:0;letter-spacing:-.035em}.intro,.section-title p:not(.eyebrow){color:#687d78;font-size:13px;margin:8px 0}.admin-chip,.count{font-size:11px;font-weight:800;padding:9px 12px;border-radius:999px;background:#e8f2ee;color:#24584d}
 .settings-panel{background:white;border:1px solid #e1e9e5;border-radius:16px;padding:22px;margin:16px 0;box-shadow:0 8px 24px #193b3809}.section-title{display:flex;justify-content:space-between;align-items:center}.section-title .eyebrow{margin-top:0}.section-title h2{font-size:20px;margin:0}.settings-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px;margin:18px 0}.settings-grid label{display:grid;gap:7px;font-size:12px;font-weight:800}.settings-grid select{min-height:42px;padding:9px;border:1px solid #d4dfda;border-radius:9px;background:#fff;color:#203f3b}.settings-grid .toggle-row{display:flex;align-items:center;gap:9px}.toggle-row input,.repo-top input{width:18px;height:18px;accent-color:#245d53}
 .theme-preview{background:var(--preview-bg);border:1px solid #dce5e0;border-radius:13px;overflow:hidden;color:var(--preview-ink);transition:background .2s}.theme-preview.reduce-motion{transition:none}.preview-nav{display:flex;align-items:center;gap:22px;background:var(--preview-nav);color:white;padding:13px 17px;font-size:11px}.preview-nav strong{font-size:14px;margin-right:auto}.preview-content{padding:18px}.preview-content small{font-size:9px;letter-spacing:.1em;color:var(--preview-accent);font-weight:850}.preview-content h3{margin:5px 0;font-size:18px}.preview-content p{font-size:12px;opacity:.7}.preview-cards{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin:14px 0}.preview-cards article{background:var(--preview-surface);border:1px solid #899b991f;border-radius:10px;padding:13px}.preview-cards strong{display:block;font-size:23px;margin-top:5px}.preview-content button,.primary{background:var(--preview-accent);color:white;border:0;border-radius:9px;padding:10px 14px;font-weight:800}.compact .preview-content{padding:12px}.compact .preview-cards article{padding:8px}
 .helper,.settings-footer p{font-size:11px;color:#73847f;line-height:1.6}.filters{display:flex;gap:8px;flex-wrap:wrap;margin:18px 0}.filters button,.secondary{border:1px solid #d4e0da;background:#fff;color:#355b53;border-radius:9px;padding:8px 12px;font-size:11px;font-weight:800}.filters button.active{background:#193f3a;color:white;border-color:#193f3a}.repository-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.repository-card{border:1px solid #e1e9e5;border-radius:12px;padding:15px;min-width:0}.repo-top{display:flex;justify-content:space-between;gap:12px}.repo-group{margin:0 0 5px;color:#a35b48;font-size:10px;font-weight:800}.repo-top h3{font-size:16px;margin:0 0 3px}.repo-top code{font-size:10px;color:#637973;overflow-wrap:anywhere}.repository-card>p{font-size:12px;color:#506a63;line-height:1.5}.repo-tags{display:flex;gap:7px;flex-wrap:wrap}.repo-tags span{font-size:10px;background:#f0f4f2;color:#526b64;border-radius:99px;padding:5px 8px}.repo-tags span.compatible{background:#e2f2e9;color:#226247}.repository-card .repo-note{font-size:11px;color:#788983}.repository-card .admin-control{font-size:11px;font-weight:750;color:#315e54}.repository-card a{font-size:11px;font-weight:850;color:#a34f3d;text-decoration:none}
 .settings-footer{display:flex;align-items:center;justify-content:space-between;gap:15px;flex-wrap:wrap}.settings-footer div{display:flex;gap:8px}.settings-footer .primary{background:#193f3a;cursor:pointer}.settings-footer .secondary{cursor:pointer}.settings-footer [role=status]{font-size:11px;color:#216447;width:100%}.settings-alert{background:#fff0eb;color:#963f30;padding:10px 14px;border-radius:9px}.settings-state{max-width:620px;margin:12vh auto;padding:20px}.settings-state .settings-panel{padding:26px}.settings-state h1{font-size:24px}.settings-state p{color:#637973;font-size:13px}.settings-state a{color:#a34f3d;font-weight:800}
 @media(max-width:700px){.settings-page{padding:18px 13px 36px}.settings-header{display:block}.admin-chip{display:inline-block;margin-top:14px}.settings-panel{padding:15px}.settings-grid{grid-template-columns:1fr}.repository-grid{grid-template-columns:1fr}.preview-nav{gap:10px}.preview-nav span{font-size:9px}.settings-footer{align-items:stretch}.settings-footer div{width:100%}.settings-footer button{flex:1}}
</style>
