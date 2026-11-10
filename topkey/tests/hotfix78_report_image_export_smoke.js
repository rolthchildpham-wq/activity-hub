const pptxgen = require('pptxgenjs');
const fs = require('fs');
const path = require('path');
(async()=>{
  const imgPath=path.resolve(__dirname,'../assets/topkey-logo-4k.png');
  const data='data:image/png;base64,'+fs.readFileSync(imgPath).toString('base64');
  const pptx=new pptxgen(); pptx.layout='LAYOUT_WIDE';
  for(let i=1;i<=9;i++){const s=pptx.addSlide();s.addText('FIXTURE SLIDE '+i,{x:.7,y:.5,w:8,h:.5,fontSize:24});}
  const s=pptx.addSlide(); s.addText('HÌNH ẢNH HOẠT ĐỘNG GIẢI',{x:.7,y:.4,w:12,h:.5,fontSize:22,bold:true}); s.addImage({data,x:1.0,y:1.2,w:11.2,h:3.0}); s.addText('Ảnh kiểm tra Hotfix78',{x:1,y:4.5,w:11.2,h:.4,align:'center'});
  const out='/mnt/data/topkey_h78_testout/h78_fixture_with_image.pptx'; await pptx.writeFile({fileName:out}); console.log(out);
})();
