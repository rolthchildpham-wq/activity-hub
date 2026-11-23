import {test,expect,assertWorkspace} from './fixtures/roles';
test('schedule renders with correct module breadcrumb',async({asAdmin})=>{
 await assertWorkspace(asAdmin,'schedule',/Lịch thi đấu/);
 await expect(asAdmin.getByRole('navigation',{name:'Đường dẫn trang'})).toContainText('Lịch thi đấu');
});
