import {test,expect} from '@playwright/test';

test('email login fields have labels on desktop and mobile',async({page})=>{
 await page.goto('./');
 await expect(page.getByRole('heading',{name:/Chào mừng trở lại/})).toBeVisible();
 await expect(page.getByLabel('Email')).toBeVisible();
 await expect(page.getByLabel('Mật khẩu')).toBeVisible();
 await expect(page.getByRole('button',{name:'Đăng nhập'})).toBeEnabled();
});
test('public layouts do not overflow at 360, 390, 768, 1280 pixels',async({page})=>{
 for(const width of [360,390,768,1280]){
  await page.setViewportSize({width,height:850});
  for(const url of ['./','./sports']){
   await page.goto(url);
   const result=await page.evaluate(()=>({
    viewport:window.innerWidth,
    documentWidth:document.documentElement.scrollWidth
   }));
   expect(result.documentWidth, url+' at '+width+'px').toBeLessThanOrEqual(result.viewport+2);
  }
  await page.screenshot({path:test.info().outputPath('public-'+width+'.png'),fullPage:true});
 }
});
