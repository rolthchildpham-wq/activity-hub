from pathlib import Path
import subprocess
from playwright.sync_api import sync_playwright
root=Path('/mnt/data/h88_work')
html=Path('/mnt/data/h88_report_preview.html')
if not html.exists():
    subprocess.run(['node','tests/report_html_h88.js','sports/vnext/src/upgrade122-hotfix80.js','/mnt/data/h88_report_preview.html'],cwd=root,check=True)
out=Path('/mnt/data/h88_report_print_acceptance.pdf')
with sync_playwright() as p:
    b=p.chromium.launch(headless=True, executable_path='/usr/bin/chromium', args=['--no-sandbox'])
    page=b.new_page(viewport={'width':1400,'height':900})
    page.set_content(html.read_text(encoding='utf-8'),wait_until='load')
    page.emulate_media(media='print')
    page.pdf(path=str(out),format='A4',landscape=True,print_background=True,margin={'top':'8mm','right':'8mm','bottom':'8mm','left':'8mm'})
    b.close()
info=subprocess.check_output(['pdfinfo',str(out)],text=True)
pages=None
for line in info.splitlines():
    if line.startswith('Pages:'): pages=int(line.split(':',1)[1].strip())
assert pages and 1<=pages<=5, info
assert out.stat().st_size>20000, out.stat().st_size
print('PDF_PRINT_H88_OK',pages,out.stat().st_size,out)
