import {test,expect,assertWorkspace,workspace} from './fixtures/roles';
test('dashboard navigation and breadcrumbs for ADMIN TEST LAB',async({asAdmin})=>{
 await assertWorkspace(asAdmin,'',/Tổng quan giải/);
 await expect(asAdmin.getByRole('navigation',{name:'Các chức năng'})).toBeVisible();
 await expect(asAdmin.getByRole('link',{name:/Tổng quan/}).first()).toHaveAttribute('aria-current','page');
});
