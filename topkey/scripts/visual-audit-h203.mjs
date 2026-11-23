// Read-only screenshot/contrast audit. Requires installed Playwright, Chrome and a preview URL.
// Optional TOPKEY_STORAGE_STATE points to a local Playwright auth storageState JSON.
// Do not commit storageState files or tokens. No clicks on mutations/forms.
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const base = process.argv[2];
if (!base || !/^https:\/\//.test(base)) {
  console.error('Usage: node scripts/visual-audit-h203.mjs https://<PREVIEW_HOST>/topkey/');
  process.exit(2);
}
const output = process.env.TOPKEY_AUDIT_DIR || 'visual-audit-h203';
const authFile = process.env.TOPKEY_STORAGE_STATE;
fs.mkdirSync(output, { recursive: true });
const roots = [
  ['hub', 'index.html'],
  ['badminton', 'sports/badminton/index.html'],
  ...['football','volleyball','running','handmade','shuttle','cooking'].map(s => [s, 'sports/vnext/index.html?sport='+s])
];
const viewports = [
  ['desktop', { width: 1440, height: 900 }],
  ['mobile', { width: 390, height: 844 }]
];
const audits = [];
const browser = await chromium.launch({ headless: true });
try {
  for (const [name, viewport] of viewports) {
    const context = await browser.newContext({
      viewport,
      ...(authFile ? { storageState: authFile } : {})
    });
    for (const [sport, relative] of roots) {
      const page = await context.newPage();
      const errors = [];
      page.on('pageerror', e => errors.push(String(e)));
      const url = new URL(relative, base).href;
      const report = { sport, viewport: name, url, screens: [], errors, contrast: [] };
      try {
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 25000 });
        await page.waitForTimeout(2000);
        const tabs = sport === 'hub' ? ['hub'] :
          await page.locator('#app-shell:not(.hidden) [data-tab]:visible').evaluateAll(
            nodes => nodes.filter(e => !e.disabled).map(e => e.dataset.tab).filter(Boolean)
          );
        const screens = tabs.length ? tabs : ['login'];
        for (const tab of screens) {
          if (tab !== 'hub' && tab !== 'login') {
            // Click only the existing navigation element; never submit forms or change scores.
            await page.locator('#app-shell:not(.hidden) [data-tab="'+tab+'"]').first().click().catch(() => {});
            await page.waitForTimeout(200);
          }
          const filename = [sport,name,tab].map(x=>x.replace(/[^a-z0-9_-]/gi,'_')).join('-')+'.png';
          await page.screenshot({ path: path.join(output, filename), fullPage: true, animations: 'disabled' });
          report.screens.push(filename);
          const result = await page.evaluate(() => {
            function rgb(s) {const m=s.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);return m?[+m[1],+m[2],+m[3]]:null}
            function luminance(c) {const a=c.map(x=>x/255).map(x=>x<=.04045?x/12.92:((x+.055)/1.055)**2.4);return .2126*a[0]+.7152*a[1]+.0722*a[2]}
            function ratio(a,b){const l=luminance(a),r=luminance(b);return (Math.max(l,r)+.05)/(Math.min(l,r)+.05)}
            const root=document.querySelector('#app-shell:not(.hidden) .page:not(.hidden)') || document.querySelector('#login-screen:not(.hidden)') || document.body;
            const elements=[...root.querySelectorAll('label,small,p,span,td,th,li,button')].filter(el=>{
              const rect=el.getBoundingClientRect(),style=getComputedStyle(el);
              return rect.width>0&&rect.height>0&&style.visibility!=='hidden'&&style.display!=='none'&&el.textContent.trim().length>2
            }).slice(0,800);
            const problems=[];
            for(const el of elements){
              const fg=rgb(getComputedStyle(el).color);
              let bg=null,n=el;
              while(n){const c=getComputedStyle(n).backgroundColor;if(c!=='rgba(0, 0, 0, 0)'){bg=rgb(c);break;}n=n.parentElement;}
              if(fg&&bg&&ratio(fg,bg)<4.5)problems.push({text:el.textContent.trim().slice(0,56),ratio:+ratio(fg,bg).toFixed(2),tag:el.tagName});
            }
            return {sampled:elements.length,problems:problems.slice(0,30),horizontalOverflow:document.documentElement.scrollWidth>innerWidth};
          });
          report.contrast.push({ tab, ...result });
        }
      } catch(e) { report.error = String(e); }
      audits.push(report);
      await page.close();
    }
    await context.close();
  }
} finally { await browser.close(); }
fs.writeFileSync(path.join(output, 'report.json'), JSON.stringify(audits,null,2));
const skipped=audits.filter(x=>x.error).length;
const weak=audits.flatMap(x=>x.contrast).reduce((n,x)=>n+x.problems.length,0);
console.log(JSON.stringify({ screens:audits.reduce((n,x)=>n+x.screens.length,0),errors:skipped,lowContrastSamples:weak,output },null,2));
if (skipped || weak) process.exitCode=1;
