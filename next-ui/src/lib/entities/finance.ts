export type Transaction={type:'income'|'expense';amount:number;category?:string;note?:string;createdAt?:number};
export function summarizeFinance(records:Record<string,Transaction>|null|undefined){
 let income=0,expense=0;
 for(const t of Object.values(records??{})){
  if(!t||!Number.isFinite(t.amount)||t.amount<0)continue;
  if(t.type==='income')income+=t.amount;
  if(t.type==='expense')expense+=t.amount;
 }
 return {income,expense,balance:income-expense};
}
export function formatVND(value:number){return value.toLocaleString('vi-VN')+' ₫'}
