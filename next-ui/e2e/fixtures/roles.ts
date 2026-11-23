import {test as base,expect,type Page} from '@playwright/test';
const adminState=process.env.TOPKEY_ADMIN_STORAGE_STATE;
const refereeState=process.env.TOPKEY_REFEREE_STORAGE_STATE;
export const sport=process.env.TOPKEY_TEST_SPORT||'volleyball';
export const tid=process.env.TOPKEY_TEST_TID||'';
export const workspace=(module='')=>'./sports/'+encodeURIComponent(sport)+'/'+encodeURIComponent(tid)+(module?'/'+module:'');
export const hasTestLab=()=>Boolean(tid.startsWith('__testlab_'));
type TestRole={asAdmin:Page;asReferee:Page};
export const test=base.extend<TestRole>({
 asAdmin:async({browser},use)=>{
  base.skip(!adminState||!hasTestLab(),'ADMIN authenticated TEST LAB state required');
  const context=await browser.newContext({storageState:adminState});
  const page=await context.newPage();
  try{await use(page)}finally{await context.close()}
 },
 asReferee:async({browser},use)=>{
  base.skip(!refereeState||!hasTestLab(),'REFEREE authenticated TEST LAB state required');
  const context=await browser.newContext({storageState:refereeState});
  const page=await context.newPage();
  try{await use(page)}finally{await context.close()}
 }
});
export {expect};
export async function assertWorkspace(page:Page,module:string,title:RegExp){
 base.skip(!tid||!hasTestLab(),'Authenticated TEST LAB ID required');
 const errors:string[]=[];
 page.on('pageerror',error=>errors.push(error.message));
 await page.goto(workspace(module));
 await expect(page.getByRole('heading',{name:title}).first()).toBeVisible();
 await expect(page.getByRole('navigation',{name:'Đường dẫn trang'})).toBeVisible();
 await expect(page.locator('body')).not.toContainText('NaN%');
 await expect(page.locator('body')).not.toContainText('undefined / undefined');
 await page.screenshot({path:base.info().outputPath((module||'overview')+'.png'),fullPage:true,animations:'disabled'});
 expect(errors).toEqual([]);
}
