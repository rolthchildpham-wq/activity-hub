import {test,expect,hasTestLab,tid} from './fixtures/roles';

test('dashboard schedule filters are usable on mobile and preserve the read-only Firebase view',async({asAdmin})=>{
 test.skip(!hasTestLab()||!tid,'Authenticated ADMIN TEST LAB profile is required');
 await asAdmin.setViewportSize({width:390,height:844});
 await asAdmin.goto('./');
 await expect(asAdmin.getByRole('heading',{name:'Trung tâm điều hành'})).toBeVisible();
 await expect(asAdmin.getByText('Đã nhận dữ liệu')).toBeVisible({timeout:15_000});
 await asAdmin.getByRole('button',{name:'Lịch thi đấu',exact:true}).click();
 await expect(asAdmin.getByRole('heading',{name:'Lịch thi đấu & kết quả'})).toBeVisible();
 const search=asAdmin.getByRole('searchbox',{name:'Tìm theo tên đội, mã trận hoặc bảng đấu'});
 const from=asAdmin.getByRole('textbox',{name:'Từ ngày'});
 const to=asAdmin.getByRole('textbox',{name:'Đến ngày'});
 await expect(search).toBeVisible();
 await expect(from).toBeVisible();
 await expect(to).toBeVisible();
 await search.fill('không-có-trận-phù-hợp');
 await expect(asAdmin.getByText('Không tìm thấy trận phù hợp')).toBeVisible();
 await asAdmin.getByRole('button',{name:'Xóa lọc'}).click();
 await expect(search).toHaveValue('');
 await expect(asAdmin.locator('html')).toHaveJSProperty('scrollWidth',await asAdmin.locator('html').evaluate(el=>el.clientWidth));
 await asAdmin.screenshot({path:test.info().outputPath('schedule-filters-mobile.png'),fullPage:true,animations:'disabled'});
});
