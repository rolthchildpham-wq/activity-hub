import test from 'node:test';
import assert from 'node:assert/strict';
import {bracketRounds} from '../src/lib/entities/bracket.ts';
import {byDate} from '../src/lib/entities/schedule.ts';
import {summarizeFinance} from '../src/lib/entities/finance.ts';

test('bracket rounds honor progression even with unknown phases',()=>{
 const result=bracketRounds({a:{stage:'F'},b:{stage:'QF'},c:null,d:{stage:'SF'}});
 assert.deepEqual(result.map(x=>x.stage),['QF','SF','F']);
});
test('schedule handles missing date and keeps stable ascending order',()=>{
 const groups=byDate({x:{date:'2026-11-23',time:'13:00'},y:{date:'2026-11-23',time:'09:00'},z:{},bad:null});
 assert.equal(groups[0].date,'2026-11-23');
 assert.deepEqual(groups[0].matches.map(x=>x.id),['y','x']);
 assert.equal(groups[1].date,'Chưa xếp ngày');
});
test('finance excludes malformed values and distinguishes income/expense',()=>{
 assert.deepEqual(summarizeFinance({a:{type:'income',amount:100},b:{type:'expense',amount:40},c:{type:'expense',amount:-9},d:null}),{income:100,expense:40,balance:60,requested:0});
});

test('volleyball group A and B remain separate and shown before knockout',()=>{
 const rounds=bracketRounds({a:{stage:'GROUP',group:'A',category:'NAM_6V6'},b:{stage:'GROUP',group:'B',category:'NAM_6V6'},q:{stage:'QF',category:'NAM_6V6'}});
 assert.deepEqual(rounds.map(r=>r.name),['NAM_6V6 · GROUP · A','NAM_6V6 · GROUP · B','NAM_6V6 · QF']);
});

test('legacy finance uses uppercase INCOME/EXPENSE with approval stages',()=>{
 const data={
  a:{type:'INCOME',amount:1500000,status:'REQUESTED'},
  b:{type:'EXPENSE',amount:320000,status:'PAID'},
  c:{type:'EXPENSE',amount:100000,status:'APPROVED'}
 };
 assert.deepEqual(summarizeFinance(data),{
  income:1500000,expense:420000,balance:1080000,requested:1
 });
});
