import {test,expect} from '@playwright/test';
import {mkdirSync,writeFileSync} from 'node:fs';
import {join} from 'node:path';

test('email login fields have labels on desktop and mobile',async({page})=>{
 await page.goto('./');
 await expect(page.getByRole('heading',{name:/Chào mừng trở lại/})).toBeVisible();
 await expect(page.getByLabel('Email')).toBeVisible();
 await expect(page.getByLabel('Mật khẩu')).toBeVisible();
 await expect(page.getByRole('button',{name:'Đăng nhập'})).toBeEnabled();
});

test('capture public layout evidence and measure 360/390/768/1280 viewport overflow',async({page})=>{
 const output=join(process.cwd(),'public-visuals');
 mkdirSync(output,{recursive:true});
 const summary:Array<{project:string;page:string;width:number;height:number;scrollWidth:number;overflowPx:number;navigationMs:number;pageErrors:string[]}>=[];

 for(const width of [360,390,768,1280]){
  await page.setViewportSize({width,height:850});
  for(const [name,url] of [['login','./'],['sports','./sports']] as const){
   const pageErrors:string[]=[];
   const record=(error:Error)=>pageErrors.push(error.message);
   page.on('pageerror',record);
   try{
    await page.goto(url,{waitUntil:'load'});
    await page.evaluate(()=>document.fonts.ready);
    const result=await page.evaluate(()=>{
     const navigation=performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming|undefined;
     return {
      width:window.innerWidth,
      height:window.innerHeight,
      scrollWidth:document.documentElement.scrollWidth,
      navigationMs:navigation?.duration??0
     };
    });
    expect(result.scrollWidth,name+' at '+width+'px').toBeLessThanOrEqual(result.width+2);
    expect(pageErrors,name+' at '+width+'px browser console').toEqual([]);
    await page.screenshot({
     path:join(output, [test.info().project.name,name,width].join('-')+'.png'),
     fullPage:true,
     animations:'disabled'
    });
    summary.push({
     project:test.info().project.name,page:name,width:result.width,height:result.height,
     scrollWidth:result.scrollWidth,overflowPx:result.scrollWidth-result.width,
     navigationMs:Math.round(result.navigationMs),pageErrors
    });
   }finally{page.off('pageerror',record)}
  }
 }
 writeFileSync(
  join(output,test.info().project.name+'-measurements.json'),
  JSON.stringify({source:'Playwright local SvelteKit preview, not EdgeOne production',samples:summary},null,2)
 );
 console.log('PUBLIC_LAYOUT_MEASUREMENTS='+JSON.stringify(summary));
});
