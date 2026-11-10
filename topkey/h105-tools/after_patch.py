from pathlib import Path
import re
p=Path('/mnt/data/h105work/sports/badminton/upgrade122-hotfix80.js')
s=p.read_text('utf8')
a='<button id="tk88-ppt-plan" class="tk79-alt">'
b='<button id="tk105-ppt-template" class="tk79-alt">Standard PPT template</button>'+a
assert s.count(a)==1,s.count(a)
s=s.replace(a,b,1)
a="$('tk88-ppt-plan').onclick=downloadPptPlan;"
b=a+"$('tk105-ppt-template').onclick=()=>{const a=document.createElement('a');a.href='/report-templates/'+(Object.prototype.hasOwnProperty.call(SPORT_PALETTES,SPORT)?SPORT:'badminton')+'-topkey-report.pptx';a.download='TOPKEY-'+SPORT+'-editable-template.pptx';document.body.appendChild(a);a.click();a.remove()};"
assert s.count(a)==1
s=s.replace(a,b,1)
s=s.replace("for(const f of files.slice(0,30)){try{images.push", "for(const f of files.slice(0,Math.max(0,30-images.length))){try{images.push",1)
p.write_text(s,'utf8')
Path('/mnt/data/h105work/sports/vnext/src/upgrade122-hotfix80.js').write_text(s,'utf8')
b=Path('/mnt/data/h105work/sports/vnext/h97-vnext.bundle.js')
t=b.read_text('utf8')
anchor='/* H97 module src/upgrade122-hotfix80.js */\n'
i=t.index(anchor)+len(anchor)
m=re.search(r'\n;\n\n/\* H97 module src/',t[i:]);assert m
j=i+m.start(); t=t[:i]+s+'\n'+t[j:]
b.write_text(t,'utf8')
print('Added template download control and file cap to web UI')
