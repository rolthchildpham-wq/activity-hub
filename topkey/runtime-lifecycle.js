(() => {
  'use strict';
  if (window.TopkeyLifecycle) return;

  function bind(handler, options = {}) {
    if (typeof handler !== 'function') return () => {};
    const events = options.events || ['topkey:tab-change', 'topkey:admin-ready', 'topkey:language-changed', 'focus', 'pageshow'];
    const settleTicks = Math.max(0, Number(options.settleTicks ?? 8));
    const settleEvery = Math.max(0, Number(options.settleEvery ?? 250));
    const debounceMs = Math.max(0, Number(options.debounceMs ?? 40));
    let active = true;
    let settleTimer = 0;
    let debounceTimer = 0;
    let remaining = settleTicks;

    const invoke = () => {
      if (!active || document.hidden) return;
      try { handler(); }
      catch (error) { console.warn('TOPKEY lifecycle maintenance failed', error); }
    };
    const schedule = () => {
      if (!active) return;
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(invoke, debounceMs);
    };
    const settle = () => {
      if (!active || remaining <= 0) return;
      remaining -= 1;
      invoke();
      if (remaining > 0) settleTimer = setTimeout(settle, settleEvery);
    };
    const visibility = () => { if (!document.hidden) schedule(); };

    events.forEach(event => window.addEventListener(event, schedule, {passive: true}));
    document.addEventListener('visibilitychange', visibility, {passive: true});
    if (remaining > 0) settleTimer = setTimeout(settle, 0);

    return () => {
      if (!active) return;
      active = false;
      clearTimeout(settleTimer);
      clearTimeout(debounceTimer);
      events.forEach(event => window.removeEventListener(event, schedule));
      document.removeEventListener('visibilitychange', visibility);
    };
  }

  window.TopkeyLifecycle = {bind};
})();
