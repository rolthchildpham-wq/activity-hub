import {test,expect,assertWorkspace} from './fixtures/roles';
test('admin sees finance view without invented totals',async({asAdmin})=>{
 await assertWorkspace(asAdmin,'finance',/Tài chính/);
 await expect(asAdmin.getByRole('link',{name:/Mở tài chính chính thức/})).toBeVisible();
 await expect(asAdmin.locator('body')).not.toContainText('NaN ₫');
});
