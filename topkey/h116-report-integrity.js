/* H116 canonical report validation used by Production and Test Lab. No DB access. */
(()=>{'use strict';
function assertReport(r){
 if(!r||typeof r!=='object')throw Error('Không có dữ liệu báo cáo cuối giải');
 if(!r.title||!r.tid)throw Error('Thiếu tên hoặc mã giải trong báo cáo');
 const ms=Array.isArray(r.matches)?r.matches:[];
 if(Number(r.summary?.matches||0)>ms.length)throw Error(`Lịch thi đấu chưa tải đủ: ${ms.length}/${r.summary.matches}`);
 if(!Array.isArray(r.prizeStructure))throw Error('Báo cáo chưa có trường cơ cấu giải thưởng (có thể là danh sách trống)');
 return true;
}
function assertHtml(html,r){
 assertReport(r);
 if(typeof html!=='string'||!/<html/i.test(html)||!/(data-section=["']prizes)/.test(html))throw Error('Thiếu mục Cơ cấu giải thưởng trong HTML báo cáo');
 for(const p of r.prizeStructure){if(p?.name&&!html.includes(String(p.name).replaceAll('&','&amp;').replaceAll('<','&lt;')))throw Error('Thiếu giải thưởng '+p.name+' trong HTML');}
 return true;
}
function assertPdf(result){if(!result?.blob||result.blob.type!=='application/pdf'||!result.pages||result.bytes<15000||result.pageStats?.some(x=>x.items<2))throw Error('Tệp PDF trắng hoặc thiếu nội dung');return true}
async function assertPpt(result,report,sport){
 if(!window.JSZip||!result?.blob)throw Error('Không xác minh được file PPTX');
 const zip=await window.JSZip.loadAsync(result.blob),presentation=await zip.file('ppt/presentation.xml')?.async('string');
 if(!presentation||!zip.file('ppt/slides/slide1.xml'))throw Error('Tệp PPTX thiếu nội dung');
 if(result.stats?.sport!==sport||result.stats.template!==sport+'.pptx')throw Error('Xuất sai mẫu môn '+sport);
 const xml=await zip.file('ppt/slides/slide1.xml').async('string');
 if(report?.title&&!xml.includes(String(report.title).replaceAll('&','&amp;').replaceAll('<','&lt;')))throw Error('Slide bìa không chứa tên giải');
 if(report.prizeStructure?.length){const prize=await zip.file('ppt/slides/slide4.xml').async('string');if(!prize?.includes(String(report.prizeStructure[0].name).replaceAll('&','&amp;').replaceAll('<','&lt;')))throw Error('Slide giải thưởng chưa có hạng mục đầu tiên');}
 return true;
}
window.TopkeyReportIntegrityH116=Object.freeze({assertReport,assertHtml,assertPdf,assertPpt,version:'H116'});
})();
