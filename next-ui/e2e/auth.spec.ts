import {test,expect} from '@playwright/test';
test('email login fields work on desktop and mobile',async({page})=>{
 await page.goto('./');
 await expect(page.getByRole('heading',{name:/Chào mừng trở lại/})).toBeVisible();
 await expect(page.getByLabel('Email')).toBeVisible();
 await expect(page.getByLabel('Mật khẩu')).toBeVisible();
 await expect(page.getByRole('button',{name:'Đăng nhập'})).toBeEnabled();
});
