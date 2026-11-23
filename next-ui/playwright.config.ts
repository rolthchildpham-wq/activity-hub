import {defineConfig,devices} from '@playwright/test';
import fs from 'node:fs';
const isRemote=!!process.env.TOPKEY_PREVIEW_URL;
const origin=process.env.TOPKEY_PREVIEW_URL||'http://127.0.0.1:4173';
export default defineConfig({
 testDir:'./e2e',
 timeout:30_000,
 retries:0,
 reporter:[['list'],['html',{open:'never'}]],
 use:{baseURL:origin,trace:'retain-on-failure',screenshot:'only-on-failure'},
 projects:[
  {name:'desktop',use:{...devices['Desktop Chrome']}},
  {name:'mobile',use:{...devices['iPhone 13']}},
  {name:'tablet',use:{viewport:{width:768,height:1024},browserName:'chromium'}}
 ],
 webServer:isRemote?undefined:{command:'npm run build && npm run preview -- --host 127.0.0.1',url:origin,reuseExistingServer:!process.env.CI,timeout:120_000}
});
