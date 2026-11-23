// Matches TOPKEY h97 finance rows: type INCOME/EXPENSE and status
// REQUESTED -> APPROVED -> PAID, not lower-case transactions.
export type Transaction={
 type:'INCOME'|'EXPENSE'|'income'|'expense';amount:number;
 status?:string;category?:string;note?:string;date?:string;createdAt?:number
};
export function summarizeFinance(records:Record<string,Transaction>|null|undefined){
 let income=0,expense=0,requested=0;
 for(const t of Object.values(records??{})){
  if(!t||!Number.isFinite(t.amount)||t.amount<0)continue;
  if(t.type==='INCOME'||t.type==='income')income+=t.amount;
  if(t.type==='EXPENSE'||t.type==='expense')expense+=t.amount;
  if(t.status==='REQUESTED')requested++;
 }
 // Totals are recorded entries, NOT proof that payment was settled.
 return {income,expense,balance:income-expense,requested};
}
export function formatVND(value:number){return value.toLocaleString('vi-VN')+' ₫'}
