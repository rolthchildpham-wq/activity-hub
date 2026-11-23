import {test,expect,assertWorkspace} from './fixtures/roles';
test('leaderboard warns that official ranking uses sport-specific rules',async({asAdmin})=>{
 await assertWorkspace(asAdmin,'leaderboard',/Bảng xếp hạng/);
 await expect(asAdmin.getByText(/Cần áp dụng đúng luật từng bộ môn/)).toBeVisible();
});
