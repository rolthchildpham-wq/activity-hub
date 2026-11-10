'use strict';
const PptxGenJS=require('pptxgenjs');
const {safeOuterShadow,warnIfSlideElementsOutOfBounds}=require('/home/oai/skills/slides/pptxgenjs_helpers');
const fs=require('fs');
const path=require('path');
const OUT=path.join(__dirname,'..','report-templates');
fs.mkdirSync(OUT,{recursive:true});
const THEMES={
 badminton:{bg:'102D48',card:'214865',accent:'4BDEDC',muted:'C4E2EF',name:'C\u1ea7u l\u00f4ng',en:'BADMINTON',motif:'court'},
 football:{bg:'102E29',card:'214B3B',accent:'9CF081',muted:'C9E6DC',name:'B\u00f3ng \u0111\u00e1',en:'FOOTBALL',motif:'field'},
 volleyball:{bg:'2C234C',card:'4A3767',accent:'FFB870',muted:'E4DAF1',name:'B\u00f3ng chuy\u1ec1n',en:'VOLLEYBALL',motif:'net'},
 running:{bg:'101E34',card:'253650',accent:'FFC400',muted:'D4DEEF',name:'Ch\u1ea1y b\u1ed9',en:'RUNNING',motif:'chevron'},
 handmade:{bg:'392B49',card:'594363',accent:'FFB8D1',muted:'EEDDEB',name:'Th\u1ee7 c\u00f4ng',en:'DIY / HANDMADE',motif:'dot'},
 shuttle:{bg:'153648',card:'24566A',accent:'C9F185',muted:'D8E9ED',name:'\u0110\u00e1 c\u1ea7u',en:'SHUTTLECOCK',motif:'net'},
 cooking:{bg:'51362F',card:'735044',accent:'FFD193',muted:'F6E2D2',name:'N\u1ea5u \u0103n',en:'COOKING',motif:'circle'}
};
const WHITE='FFFFFF';
function text(s,str,x,y,w,h,opts={}){s.addText(String(str),{x,y,w,h,fontFace:'Arial',fontSize:opts.size||18,bold:!!opts.bold,color:opts.color||WHITE,margin:0.02,breakLine:false,fit:'shrink',valign:opts.valign||'mid',align:opts.align||'left'});}
function rect(s,ppt,x,y,w,h,fill,stroke=null,rad=.1){s.addShape(rad?ppt.ShapeType.roundRect:ppt.ShapeType.rect,{x,y,w,h,rectRadius:rad,fill:{color:fill},line:{color:stroke||fill,width:stroke?1:0}})}
function chrome(ppt,t,number,title,sub=''){
 const s=ppt.addSlide();s.background={color:t.bg};
 s.addShape(ppt.ShapeType.line,{x:.36,y:.87,w:12.6,h:0,line:{color:t.accent,width:2}});
 s.addShape(ppt.ShapeType.line,{x:.36,y:7.1,w:12.6,h:0,line:{color:t.accent,width:1}});
 // Sports motif at top right, tailored to the provided running/cooking examples.
 if(t.motif==='chevron')for(let i=0;i<3;i++)s.addShape(ppt.ShapeType.chevron,{x:11.7+i*.4,y:.27,w:.38,h:.3,fill:{color:t.accent},line:{color:t.accent,width:0}});
 else if(t.motif==='circle')for(let i=0;i<3;i++)s.addShape(ppt.ShapeType.ellipse,{x:11.9+i*.37,y:.29,w:.23,h:.23,fill:{color:t.accent},line:{color:t.accent,width:0}});
 else for(let i=0;i<3;i++)rect(s,ppt,11.6+i*.42,.28,.26,.22,t.accent,null,.04);
 if(title)text(s,title,.5,.18,10.8,.55,{size:23,bold:true});
 if(sub)text(s,sub,.52,.94,11.7,.28,{size:11,color:t.muted});
 text(s,'TOPKEY  |  '+t.en,.5,7.15,7.3,.2,{size:8,color:t.muted});
 text(s,String(number).padStart(2,'0'),12.15,7.15,.6,.2,{size:8,color:t.accent,align:'right'});
 return s;
}
function placeholder(ppt,s,t,x,y,w,h,label){rect(s,ppt,x,y,w,h,t.card,t.accent,.07);text(s,'+  '+label,x+.18,y+h/2-.26,w-.36,.54,{size:16,color:t.muted,align:'center'});}
function pill(ppt,s,t,x,y,w,h,head,value){rect(s,ppt,x,y,w,h,t.card,t.accent,.06);text(s,head,x+.25,y+.18,w-.5,.32,{size:13,color:t.muted});text(s,value,x+.25,y+.62,w-.5,.6,{size:25,bold:true,color:t.accent});}
async function make(key,t){
 const ppt=new PptxGenJS();ppt.layout='LAYOUT_WIDE';ppt.author='TOPKEY Sports Hub';ppt.company='TOPKEY';ppt.title='TOPKEY '+t.en+' Editable Report Template';ppt.subject='Report slides with editable text and image placeholders';ppt.lang='vi-VN';ppt.theme={headFontFace:'Arial',bodyFontFace:'Arial',lang:'vi-VN'};
 let s=chrome(ppt,t,1,'TOPKEY  |  '+t.en);
 text(s,'B\u00c1O C\u00c1O T\u1ed4NG K\u1ebeT',.75,1.32,8.0,.6,{size:30,bold:true});text(s,'[T\u00ean gi\u1ea3i / T\u00ean s\u1ef1 ki\u1ec7n]',.78,2.04,8.5,1.02,{size:35,bold:true,color:t.accent});text(s,'[Ng\u00e0y]   [\u0110\u1ecba \u0111i\u1ec3m]   [CLB / Ban t\u1ed5 ch\u1ee9c]',.78,3.25,7.7,.5,{size:17,color:t.muted});placeholder(ppt,s,t,8.6,1.48,4.05,4.88,'\u1ea2NH B\u00ccA');
 s=chrome(ppt,t,2,'01 / T\u1ed4NG QUAN S\u1ef0 KI\u1ec6N','T\u00f9y ch\u1ec9nh m\u1ee5c ti\u00eau, th\u1eddi gian, \u0111\u1ecba \u0111i\u1ec3m.');
 [['Th\u1eddi gian','[Date]'],['\u0110\u1ecba \u0111i\u1ec3m','[Venue]'],['S\u1ed1 \u0111\u1ed9i / V\u0110V','[Count]']].forEach((a,i)=>pill(ppt,s,t,.55+i*4.26,1.4,3.85,1.6,...a));rect(s,ppt,.55,3.4,7.5,2.9,t.card,null,.05);text(s,'M\u1ee5c \u0111\u00edch / Objective:',.8,3.65,6.8,.47,{size:21,bold:true,color:t.accent});text(s,'[N\u1ed9i dung gi\u1edbi thi\u1ec7u s\u1ef1 ki\u1ec7n; ch\u1ec9nh s\u1eeda \u0111\u01b0\u1ee3c]',.8,4.3,6.8,1.4,{size:19});placeholder(ppt,s,t,8.37,3.4,4.35,2.9,'\u1ea2NH T\u1ed4NG QUAN');
 s=chrome(ppt,t,3,'02 / KHO\u1ea2NH KH\u1eaeC \u0110\u00c1NG NH\u1eda','The memorable moments / \u96e3\u5fd8\u7684\u77ac\u9593');
 [[.55,1.33],[6.82,1.33],[.55,4.05],[6.82,4.05]].forEach(([x,y],i)=>placeholder(ppt,s,t,x,y,5.9,2.43,'\u1ea2NH '+(i+1))); 
 s=chrome(ppt,t,4,'03 / C\u01a0 C\u1ea4U GI\u1ea2I TH\u01af\u1edeNG','Award structure / \u734e\u9805\u7d50\u69cb');
 const prizes=[['GI\u1ea2I NH\u1ea4T','[S\u1ed1 l\u01b0\u1ee3ng]','[Gi\u00e1 tr\u1ecb / Ph\u1ea7n qu\u00e0]'],['GI\u1ea2I NH\u00cc','[S\u1ed1 l\u01b0\u1ee3ng]','[Gi\u00e1 tr\u1ecb / Ph\u1ea7n qu\u00e0]'],['GI\u1ea2I BA','[S\u1ed1 l\u01b0\u1ee3ng]','[Gi\u00e1 tr\u1ecb / Ph\u1ea7n qu\u00e0]'],['KHUY\u1ebeN KH\u00cdCH','[S\u1ed1 l\u01b0\u1ee3ng]','[Gi\u00e1 tr\u1ecb / Ph\u1ea7n qu\u00e0]']];
 prizes.forEach((a,i)=>{let x=.6+(i%2)*6.35,y=1.45+Math.floor(i/2)*2.45;rect(s,ppt,x,y,5.9,2.04,t.card,t.accent,.08);text(s,a[0],x+.2,y+.2,5.4,.43,{size:21,bold:true,color:t.accent});text(s,a[1],x+.2,y+.79,5.4,.32,{size:14});text(s,a[2],x+.2,y+1.19,5.4,.48,{size:16});});
 s=chrome(ppt,t,5,'04 / TH\u00c0NH T\u00cdCH & BXH','Th\u00f4ng tin \u0111\u01b0\u1ee3c \u0111i\u1ec1n t\u1eeb h\u1ec7 th\u1ed1ng khi xu\u1ea5t b\u00e1o c\u00e1o.');
 [['1','[Nh\u1ea5t]'],['2','[Nh\u00ec]'],['3','[Ba]']].forEach((a,i)=>{let x=.75+i*4.25;rect(s,ppt,x,2.05,3.85,3.15,t.card,t.accent,.05);text(s,'# '+a[0],x+.3,2.45,3.2,.85,{size:37,bold:true,color:t.accent,align:'center'});text(s,a[1],x+.3,3.64,3.2,.65,{size:21,align:'center'});});
 s=chrome(ppt,t,6,'05 / L\u1ecaCH & K\u1ebeT QU\u1ea2','Ch\u1ec9nh s\u1eeda d\u1eef li\u1ec7u tr\u01b0\u1edbc khi tr\u00ecnh b\u00e0y.');
 const rows=[['STT','\u0110\u1ed9i / V\u0110V','Th\u1eddi gian','K\u1ebft qu\u1ea3'],['1','[Team A - Team B]','[Date time]','[Result]'],['2','[Team A - Team B]','[Date time]','[Result]'],['3','[Team A - Team B]','[Date time]','[Result]'],['4','[Team A - Team B]','[Date time]','[Result]']];
 rows.forEach((r,i)=>{const y=1.42+i*.84;rect(s,ppt,.55,y,12.2,.7,i===0?t.accent:t.card,null,.015);text(s,r[0],.8,y+.12,.72,.45,{size:14,color:i===0?t.bg:WHITE,bold:i===0});text(s,r[1],1.57,y+.12,5.65,.45,{size:14,color:i===0?t.bg:WHITE,bold:i===0});text(s,r[2],7.35,y+.12,2.45,.45,{size:14,color:i===0?t.bg:WHITE,bold:i===0});text(s,r[3],10.2,y+.12,2.3,.45,{size:14,color:i===0?t.bg:WHITE,bold:i===0})});
 s=chrome(ppt,t,7,'06 / T\u00c0I CH\u00cdNH S\u1ef0 KI\u1ec6N');
 [['T\u1ed5ng thu','[VND]'],['T\u1ed5ng chi','[VND]'],['S\u1ed1 d\u01b0','[VND]']].forEach((a,i)=>pill(ppt,s,t,.75+i*4.2,1.7,3.8,2.05,...a));rect(s,ppt,.75,4.3,11.8,1.55,t.card,null,.06);text(s,'[Ghi ch\u00fa / Ph\u00e2n t\u00edch t\u00e0i ch\u00ednh / Ngu\u1ed3n kinh ph\u00ed]',1.1,4.68,11.1,.64,{size:18});
 s=chrome(ppt,t,8,'07 / VINH DANH & TRAO GI\u1ea2I','Award ceremony / \u9812\u734e\u5100\u5f0f');
 placeholder(ppt,s,t,.72,1.38,7.95,4.9,'\u1ea2NH TRAO GI\u1ea2I');rect(s,ppt,8.96,1.38,3.7,4.9,t.card,t.accent,.06);text(s,'[T\u00ean ng\u01b0\u1eddi nh\u1eadn gi\u1ea3i]',9.2,2.1,3.2,1.2,{size:22,bold:true,color:t.accent});text(s,'[H\u1ea1ng m\u1ee5c v\u00e0 gi\u00e1 tr\u1ecb]',9.2,3.8,3.2,1.2,{size:18});
 s=chrome(ppt,t,9,'THANK YOU / C\u1ea2M \u01a0N');
 text(s,'C\u1ea2M \u01a0N \u0110\u00c3 \u0110\u1ed2NG H\u00c0NH',.85,1.55,11.75,1.1,{size:32,bold:true,align:'center',color:t.accent});text(s,'[Ban t\u1ed5 ch\u1ee9c / Nh\u00e0 t\u00e0i tr\u1ee3 / T\u00ecnh nguy\u1ec7n vi\u00ean]',.85,3.05,11.75,.7,{size:19,align:'center'});placeholder(ppt,s,t,3.1,4.05,7.15,2.0,'\u1ea2NH T\u1eacP TH\u1ec2');
 // Text/image overlays within deliberately drawn placeholder panels are intentional.
 // Warn only about true out-of-bounds placement.
 for(const slide of ppt._slides)warnIfSlideElementsOutOfBounds(slide,ppt);
 const target=path.join(OUT,key+'-topkey-report.pptx');await ppt.writeFile({fileName:target});
 console.log(key,target,ppt._slides.length);
}
(async()=>{for(const [key,t] of Object.entries(THEMES))await make(key,t)})().catch(e=>{console.error(e);process.exit(1)});
