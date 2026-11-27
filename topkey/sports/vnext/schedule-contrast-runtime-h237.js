/* H237: runtime guard for legacy schedule rows that carry inline important text colors. */
(() => {
  'use strict';
  const ROOT = '#app-shell #page-schedule';
  const TEXT = 'h1,h2,h3,h4,p,small,label,strong,b,span,em,li,td,th,.muted,.note,.hint,.description';
  const COLOR = '#29465b';
  const MUTED = '#405e72';

  const apply = () => {
    const root = document.querySelector(ROOT);
    if (!root) return;
    for (const node of root.querySelectorAll(TEXT)) {
      if (node.closest('button,.btn')) continue;
      const color = node.matches('.muted,.note,.hint,.description') ? MUTED : COLOR;
      if (node.style.getPropertyValue('color') !== color ||
          node.style.getPropertyPriority('color') !== 'important') {
        node.style.setProperty('color', color, 'important');
      }
      if (node.style.getPropertyValue('-webkit-text-fill-color') !== color ||
          node.style.getPropertyPriority('-webkit-text-fill-color') !== 'important') {
        node.style.setProperty('-webkit-text-fill-color', color, 'important');
      }
      if (node.style.getPropertyValue('opacity') !== '1' ||
          node.style.getPropertyPriority('opacity') !== 'important') {
        node.style.setProperty('opacity', '1', 'important');
      }
      if (node.style.getPropertyValue('text-shadow') !== 'none' ||
          node.style.getPropertyPriority('text-shadow') !== 'important') {
        node.style.setProperty('text-shadow', 'none', 'important');
      }
    }
  };

  let queued = false;
  const schedule = () => {
    if (queued) return;
    queued = true;
    queueMicrotask(() => {
      queued = false;
      apply();
    });
  };

  apply();
  const observer = new MutationObserver(schedule);
  observer.observe(document.documentElement, {
    subtree: true,
    childList: true,
    attributes: true,
    attributeFilter: ['class', 'style']
  });
  window.__TOPKEY_SCHEDULE_CONTRAST_H237 = {
    version: 'h237-schedule-aa-20261127',
    apply,
    disconnect: () => observer.disconnect()
  };
})();
