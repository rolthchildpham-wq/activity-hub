import {test,expect} from '@playwright/test';

// Owner-authorized TEST LAB account storage state is supplied externally,
// never committed. These tests navigate only; they never submit mutations.
const session=process.env.TOPKEY_STORAGE_STATE;
const sport=process.env.TOPKEY_TEST_SPORT||'volleyball';
const tid=process.env.TOPKEY_TEST_TID;
test.use({storageState:session});
test.skip(!session||!tid,'Authenticated TEST LAB profile and tournament ID are required');

for(const module of ['','schedule','bracket','live','leaderboard','check-in','finance','history','referee']){
 test('read-only '+(module||'overview')+' at '+test.info().project.name,async({page})=>{
  const pathname='./sports/'+encodeURIComponent(sport)+'/'+encodeURIComponent(tid!)+(module?'/'+module:'');
  const jsErrors:string[]=[];
  page.on('pageerror',err=>jsErrors.push(err.message));
  await page.goto(pathname);
  await expect(page.getByRole('heading').first()).toBeVisible();
  await expect(page.locator('body')).not.toContainText('NaN%');
  await page.screenshot({path:test.info().outputPath((module||'overview')+'.png'),fullPage:true,animations:'disabled'});
  expect(jsErrors).toEqual([]);
 });
}
