import {test,expect,assertWorkspace} from './fixtures/roles';
test('referee can view realtime scoreboard without writing',async({asReferee})=>{
 await assertWorkspace(asReferee,'live',/Trực tiếp tỷ số/);
 await expect(asReferee.getByRole('heading',{name:/Trực tiếp tỷ số/})).toBeVisible();
});
