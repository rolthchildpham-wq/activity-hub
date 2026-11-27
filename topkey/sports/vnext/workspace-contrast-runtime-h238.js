/* H239: contrast guard for dynamically-rendered text on light workspace surfaces. */
(() => {
  'use strict';
  // Scan the full document: legacy pages can be mounted outside #app-shell during sport handoff.
  const ROOT = 'body';
  const TEXT = 'h1,h2,h3,h4,p,small,label,strong,b,span,em,li,td,th,time,div';
  const SAFE = '#29465b';

  const rgb = value => {
    const m = String(value || '').match(/rgba?\(([^)]+)\)/);
    if (!m) return null;
    const p = m[1].split(',').map(v => Number.parseFloat(v.trim()));
    return p.length >= 3 && p.slice(0,3).every(Number.isFinite)
      ? { r:p[0], g:p[1], b:p[2], a:p.length > 3 ? p[3] : 1 } : null;
  };
  const linear = v => {
    v /= 255;
    return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  };
  const luminance = c => 0.2126*linear(c.r)+0.7152*linear(c.g)+0.0722*linear(c.b);
  const contrast = (a,b) => {
    const x=luminance(a), y=luminance(b);
    return (Math.max(x,y)+0.05)/(Math.min(x,y)+0.05);
  };
  const effectiveBackground = node => {
    for (let el=node; el && el.nodeType===1; el=el.parentElement) {
      const c=rgb(getComputedStyle(el).backgroundColor);
      if (c && c.a >= 0.98) return c;
    }
    return {r:255,g:255,b:255,a:1};
  };
  const apply = () => {
    for (const root of document.querySelectorAll(ROOT)) {
      for (const node of root.querySelectorAll(TEXT)) {
        // Audit dynamic labels inside controls too; only recolor when their effective surface is light.
        if (!Array.from(node.childNodes).some(n=>n.nodeType===3 && n.textContent.trim())) continue;
        const fg=rgb(getComputedStyle(node).color);
        if (!fg) continue;
        const bg=effectiveBackground(node);
        if (luminance(bg) < 0.72 || contrast(fg,bg) >= 4.5) continue;
        if (node.style.getPropertyValue('color') !== SAFE ||
            node.style.getPropertyPriority('color') !== 'important') {
          node.style.setProperty('color',SAFE,'important');
        }
        if (node.style.getPropertyValue('-webkit-text-fill-color') !== SAFE ||
            node.style.getPropertyPriority('-webkit-text-fill-color') !== 'important') {
          node.style.setProperty('-webkit-text-fill-color',SAFE,'important');
        }
      }
    }
  };

  let queued=false;
  const schedule=()=>{
    if(queued)return;
    queued=true;
    queueMicrotask(()=>{queued=false;apply();});
  };
  apply();
  const observer=new MutationObserver(schedule);
  observer.observe(document.documentElement,{
    subtree:true,childList:true,attributes:true,characterData:true,
    attributeFilter:['class','style']
  });
  window.__TOPKEY_WORKSPACE_CONTRAST_H239={
    version:'h239-global-workspace-dynamic-aa-20261127',
    apply,
    disconnect:()=>observer.disconnect()
  };
})();