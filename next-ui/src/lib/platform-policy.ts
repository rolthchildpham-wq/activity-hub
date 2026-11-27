import type {SportKey} from './domain';

export const OPERATIONAL_SPORTS = [
 'badminton','football','volleyball','running','handmade','shuttle','cooking'
] as const;

export type TopkeyRole = 'ADMIN'|'BTC'|'UMPIRE'|'VIEWER'|'LIVE_ONLY';
export type TopkeyProfile = {
 role?:string;
 active?:boolean;
 disabled?:boolean;
 locked?:boolean;
 enabled?:boolean;
 isActive?:boolean;
 status?:string;
 sportScope?:string;
 assignedSport?:string;
 permissions?:Record<string,unknown>;
 [key:string]:unknown;
};
export type PlatformPolicy = {
 version?:string;
 sports?:readonly string[];
 roles?:Record<string,readonly string[]>;
 normalizeSport?:(value:unknown)=>string;
 normalizeScope?:(value:unknown)=>string;
 normalizeRole?:(value:unknown)=>string;
 isBlocked?:(profile:unknown)=>boolean;
 canAccess?:(profile:unknown,targetSport:unknown)=>boolean;
 canTab?:(role:unknown,tab:unknown)=>boolean;
};

const aliases:Record<string,string>={
 badminton:'badminton','cau long':'badminton','🏸 cau long':'badminton',
 football:'football','bong da':'football','⚽ bong da':'football',
 volleyball:'volleyball','bong chuyen':'volleyball','🏐 bong chuyen':'volleyball',
 running:'running','chay bo':'running','🏃 chay bo':'running',
 handmade:'handmade','diy':'handmade','diy / handmade':'handmade','🧶 diy / handmade':'handmade',
 shuttle:'shuttle','da cau':'shuttle','🪶 da cau':'shuttle',
 cooking:'cooking','nau an':'cooking','👨‍🍳 nau an':'cooking'
};
const roleTabs:Record<TopkeyRole,readonly string[]>={
 ADMIN:['overview','control','teams','schedule','umpire','live','finance','announcements','audit','health','settings'],
 BTC:['overview','control','teams','schedule','umpire','live','finance','announcements','audit','health','settings'],
 UMPIRE:['overview','control','umpire','live','health'],
 VIEWER:['overview','schedule','live'],
 LIVE_ONLY:['live']
};
function normalizedText(value:unknown):string{
 const raw=String(value??'').trim().toLowerCase();
 return (raw.normalize?raw.normalize('NFD').replace(/[\\u0300-\\u036f]/g,''):raw).replace(/đ/g,'d');
}
export function normalizeSport(value:unknown):string{
 const normalized=normalizedText(value);
 return aliases[normalized]||normalized;
}
export function normalizeScope(profileOrValue:unknown):string{
 const value=profileOrValue&&typeof profileOrValue==='object'
  ?(profileOrValue as TopkeyProfile).sportScope||(profileOrValue as TopkeyProfile).assignedSport||''
  :profileOrValue;
 return normalizeSport(value);
}
export function normalizeRole(value:unknown):TopkeyRole{
 const role=String(value||'VIEWER').trim().toUpperCase();
 return Object.hasOwn(roleTabs,role)?role as TopkeyRole:'VIEWER';
}
export function isBlocked(profile:unknown):boolean{
 if(!profile||typeof profile!=='object')return true;
 const p=profile as TopkeyProfile;
 return p.active===false||p.disabled===true||p.locked===true||p.enabled===false||p.isActive===false||
  ['DISABLED','BLOCKED','SUSPENDED','INACTIVE'].includes(String(p.status||'').toUpperCase());
}
export function canAccess(profile:unknown,targetSport:SportKey|string):boolean{
 if(isBlocked(profile))return false;
 const p=profile as TopkeyProfile;
 const role=normalizeRole(p.role),target=normalizeSport(targetSport),scope=normalizeScope(p);
 if(!OPERATIONAL_SPORTS.includes(target as typeof OPERATIONAL_SPORTS[number]))return false;
 if(role==='ADMIN')return true;
 if(role==='BTC')return !!scope&&scope===target;
 return !scope||scope===target;
}
export function canTab(role:unknown,tab:unknown):boolean{
 return roleTabs[normalizeRole(role)].includes(String(tab||''));
}
const moduleTabs:Record<string,string>={
 '':'overview',schedule:'schedule',bracket:'control',live:'live',leaderboard:'overview',
 analytics:'overview','check-in':'teams',referee:'umpire',finance:'finance',history:'audit'
};
export function canViewModule(profile:TopkeyProfile,moduleKey:string):boolean{
 if(isBlocked(profile))return false;
 const legacyTab=moduleTabs[moduleKey];
 if(!legacyTab||!canTab(profile.role,legacyTab))return false;
 const permissions=profile.permissions&&typeof profile.permissions==='object'?profile.permissions:{};
 const tabs=(permissions as Record<string,unknown>).tabs;
 if(tabs&&typeof tabs==='object'&&Object.prototype.hasOwnProperty.call(tabs,legacyTab)){
  const value=(tabs as Record<string,unknown>)[legacyTab];
  if(value===false||value==='none'||value==='hidden')return false;
 }
 return true;
}
export function policyMatchesOperationalSource(source:string):boolean{
 const required=[
  "const sports=Object.freeze(['badminton','football','volleyball','running','handmade','shuttle','cooking'])",
  "ADMIN:['overview','control','teams','schedule','umpire','live','finance','announcements','audit','health','settings']",
  "BTC:['overview','control','teams','schedule','umpire','live','finance','announcements','audit','health','settings']",
  "UMPIRE:['overview','control','umpire','live','health']",
  "VIEWER:['overview','schedule','live']",
  "LIVE_ONLY:['live']",
  "if(role==='ADMIN')return true;",
  "if(role==='BTC')return !!scope&&scope===target;",
  "return !scope||scope===target;"
 ];
 return required.every(fragment=>source.includes(fragment));
}
