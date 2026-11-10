from pathlib import Path
import re,json
root=Path(__file__).parent
v=root/'sports/vnext'
p=v/'index.html'; html=p.read_text()
pattern=re.compile(r'<script src="(\./src/[^\"]+\.js|\./upgrade53\.js)(?:\?[^\"]*)?"></script>')
matches=list(pattern.finditer(html))
print('bundling',len(matches))
# Keep preboot independent for early execution; bundle rest in exact original order.
selected=[m for m in matches if 'testlab-preboot' not in m.group(1)]
parts=[]
for m in selected:
    src=m.group(1).replace('./','',1)
    contents=(v/src).read_text()
    parts.append('/* H97 module '+src+' */\n'+contents+'\n;\n')
bundle='\n'.join(parts)
(v/'h97-vnext.bundle.js').write_text(bundle)
for m in reversed(selected):html=html[:m.start()]+html[m.end():]
insert='\n<script src="./h97-vnext.bundle.js?v=u122h97-20261108"></script>'
html=html.rsplit('</body>', 1)[0] + insert + '</body>' + html.rsplit('</body>', 1)[1]
p.write_text(html)
print('bytes',len(bundle),'script count',html.count('<script'))
