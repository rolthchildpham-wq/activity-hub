/* H251: contrast guard for dynamically-rendered text and text-bearing wrappers on light workspace surfaces. */
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
        if (!node.textContent.trim()) continue;
        const fg=rgb(getComputedStyle(node).color);
        if (!fg) continue;
        const bg=effectiveBackground(node);
        // Correct contrast from each node's actual nearest opaque surface.
        // Podium medals use a dark disc; override inherited/inline dark text on that disc.
        const podiumMedal = node.classList.contains('tk9-medal');
        if (podiumMedal) {
          node.style.setProperty('color','#f8fbff','important');
          node.style.setProperty('-webkit-text-fill-color','#f8fbff','important');
          continue;
        }
        const settingsDarkSurface = node.closest('#page-settings') &&
          luminance(bg) < 0.25 && !node.closest('button,.btn,input,select,textarea');
        if (settingsDarkSurface) {
          node.style.setProperty('color','#e4eef5','important');
          node.style.setProperty('-webkit-text-fill-color','#e4eef5','important');
          continue;
        }
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
  window.__TOPKEY_WORKSPACE_CONTRAST_H251={
    version:'h252-settings-clock-targeted-aa-20261128',
    apply,
    disconnect:()=>observer.disconnect()
  };
})();