/* Compatibility bridge only. The badminton-specific loader has moved to shared VNext. */
(() => {
  'use strict';
  if (window.TopkeyProductionLoader) return;
  const script = document.createElement('script');
  script.src = new URL('../vnext/production-loader.js', document.currentScript?.src || location.href).href;
  script.async = false;
  script.onerror = () => console.error('TOPKEY shared VNext production loader unavailable');
  document.head.appendChild(script);
})();
