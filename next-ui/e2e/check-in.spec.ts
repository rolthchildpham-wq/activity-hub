import {test,expect,assertWorkspace} from './fixtures/roles';
test('check-in renders source data and official handoff',async({asAdmin})=>{
 await assertWorkspace(asAdmin,'check-in',/Điểm danh/);
 await expect(asAdmin.getByRole('link',{name:/Mở quản lý điểm danh/})).toBeVisible();
});
