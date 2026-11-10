(() => {
'use strict';
const T=window.Topkey;
if(!T||window.__TOPKEY_H59_BTC_ROLE__)return;
window.__TOPKEY_H59_BTC_ROLE__=true;
const VERSION='2026.11.06-vnext-upgrade122-hotfix59-btc-system-role';
const CACHE_TAG='u122h59-20261106';
T.VERSION=VERSION; T.CONFIG_VERSION=VERSION;
window.__TOPKEY_BOOT_VERSION=VERSION; window.__TOPKEY_BOOT_CACHE=CACHE_TAG;
const tabs=['overview','control','teams','schedule','umpire','live','finance','announcements','audit','health','settings'];
T.ROLES=T.ROLES||{};
T.ROLES.BTC=tabs.slice();
const select=document.querySelector('#user-form select[name="role"]');
if(select && ![...select.options].some(o=>String(o.value||o.textContent).toUpperCase()==='BTC')){
  const opt=document.createElement('option'); opt.value='BTC'; opt.textContent='BTC';
  const admin=[...select.options].find(o=>String(o.value||o.textContent).toUpperCase()==='ADMIN');
  if(admin?.nextSibling) select.insertBefore(opt,admin.nextSibling); else select.appendChild(opt);
}
})();
