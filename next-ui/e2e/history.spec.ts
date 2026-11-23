import {test,expect,assertWorkspace} from './fixtures/roles';
test('admin sees audit journal read-only',async({asAdmin})=>{
 await assertWorkspace(asAdmin,'history',/Nhật ký hoạt động/);
 await expect(asAdmin.getByRole('link',{name:/Mở nhật ký hệ thống hiện tại/})).toBeVisible();
});
