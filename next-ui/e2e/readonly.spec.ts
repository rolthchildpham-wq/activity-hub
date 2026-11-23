import {test,expect} from '@playwright/test';

// Public/authenticated read-only smoke tests. These tests NEVER write to Firebase.
// The fixture uses a real Preview origin and existing role, when configured.
test('login is accessible on desktop and mobile',async({page})=>{
 await page.goto('./');
 await expect(page.getByRole('heading',{name:/Chào mừng trở lại|TOPKEY/})).toBeVisible();
 await expect(page.getByLabel('Email')).toBeVisible();
 await expect(page.getByLabel('Mật khẩu')).toBeVisible();
 await page.screenshot({path:test.info().outputPath('login.png'),fullPage:true});
});
test('sport directory includes all eight supported sports',async({page})=>{
 await page.goto('./sports');
 for(const name of ['Bóng đá','Cầu lông','Bóng chuyền','Chạy bộ','DIY / Handmade','Vlog 2026','Đá cầu','Nấu ăn'])
  await expect(page.getByText(name,{exact:true})).toBeVisible();
});
test('navigating unknown sports does not render private match data',async({page})=>{
 await page.goto('./sports/not-a-sport');
 await expect(page.getByText('Không tìm thấy bộ môn')).toBeVisible();
});
