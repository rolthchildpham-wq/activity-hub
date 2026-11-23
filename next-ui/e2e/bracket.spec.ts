import {test,expect,assertWorkspace} from './fixtures/roles';
test('bracket includes no imaginary winners',async({asReferee})=>{
 await assertWorkspace(asReferee,'bracket',/Bảng và nhánh đấu/);
 await expect(asReferee.getByText(/Không tự suy đoán đội đi tiếp/)).toBeVisible();
});
