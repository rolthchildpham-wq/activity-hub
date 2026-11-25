import {test,expect,workspace,tid,hasTestLab} from './fixtures/roles';

// Read-only layout checks. This suite never submits writes to Firebase.
test('mobile workspace keeps the primary navigation reachable without horizontal page overflow',async({asAdmin})=>{
 test.skip(!hasTestLab()||!tid,'Authenticated ADMIN TEST LAB profile is required');
 await asAdmin.setViewportSize({width:390,height:844});
 await asAdmin.goto(workspace(''));
 await expect(asAdmin.getByRole('navigation',{name:'Điều hướng nhanh'})).toBeVisible();
 await expect(asAdmin.getByRole('button',{name:/Thêm/})).toBeVisible();
 const dimensions=await asAdmin.evaluate(()=>({
  viewport:document.documentElement.clientWidth,
  document:document.documentElement.scrollWidth,
  workspace:document.querySelector('.workspace')?.getBoundingClientRect().width??0
 }));
 expect(dimensions.document).toBeLessThanOrEqual(dimensions.viewport+1);
 expect(dimensions.workspace).toBeLessThanOrEqual(dimensions.viewport+1);
 await asAdmin.screenshot({path:test.info().outputPath('workspace-mobile-navigation.png'),fullPage:true,animations:'disabled'});
});

test('mobile More menu exposes every secondary workspace module and navigates correctly',async({asAdmin})=>{
 test.skip(!hasTestLab()||!tid,'Authenticated ADMIN TEST LAB profile is required');
 await asAdmin.setViewportSize({width:390,height:844});
 await asAdmin.goto(workspace(''));
 await asAdmin.getByRole('button',{name:/Thêm/}).click();
 const menu=asAdmin.getByRole('navigation',{name:'Các chức năng khác'});
 await expect(menu).toBeVisible();
 for(const label of ['Xếp hạng','Điểm danh','Trọng tài','Tài chính','Nhật ký'])
  await expect(menu.getByRole('link',{name:new RegExp(label)})).toBeVisible();
 await menu.getByRole('link',{name:/Xếp hạng/}).click();
 await expect(asAdmin).toHaveURL(/\/leaderboard$/);
 await expect(asAdmin.getByRole('navigation',{name:'Điều hướng nhanh'}).getByRole('link',{name:/Xếp hạng/})).toHaveAttribute('aria-current','page');
 await expect(menu).toBeHidden();
});

test('desktop workspace exposes the full navigation without the mobile overlay',async({asAdmin})=>{
 test.skip(!hasTestLab()||!tid,'Authenticated ADMIN TEST LAB profile is required');
 await asAdmin.setViewportSize({width:1440,height:900});
 await asAdmin.goto(workspace(''));
 await expect(asAdmin.getByRole('navigation',{name:'Các chức năng'})).toBeVisible();
 for(const label of ['Tổng quan','Lịch thi đấu','Bảng đấu','Trực tiếp','Xếp hạng','Điểm danh','Trọng tài','Tài chính','Nhật ký'])
  await expect(asAdmin.getByRole('navigation',{name:'Các chức năng'}).getByRole('link',{name:new RegExp(label)})).toBeVisible();
 await expect(asAdmin.getByRole('navigation',{name:'Điều hướng nhanh'})).toBeHidden();
});
