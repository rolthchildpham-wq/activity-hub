(() => {
  'use strict';
  if (window.TopkeyProductionLoader) return;

  const BADMINTON_RUNTIME = [
    './upgrade122-hotfix85.js', './testlab122.js', './upgrade121.js',
    './upgrade122-hotfix5.js', './upgrade122-hotfix6.js', './upgrade122-hotfix7.js',
    './upgrade122-hotfix10.js', './upgrade122-hotfix11.js', './upgrade122-hotfix14.js',
    './upgrade122-hotfix15.js', './upgrade122-hotfix18.js', './upgrade122-hotfix20.js',
    './upgrade122-hotfix21.js', './upgrade122-hotfix22.js', './upgrade122-hotfix25.js',
    './upgrade122-hotfix26.js', './upgrade122-hotfix27.js', './upgrade122-hotfix28.js',
    './upgrade122-hotfix29.js', './upgrade122-hotfix30.js', './upgrade122-hotfix37.js',
    './upgrade122-hotfix53.js', './upgrade122-hotfix55.js', './upgrade122-hotfix56.js',
    './upgrade122-hotfix60.js', './upgrade122-hotfix61.js', './upgrade122-hotfix64.js',
    './upgrade122-hotfix65.js', './upgrade122-hotfix67.js', './upgrade122-hotfix76.js',
    './upgrade122-hotfix80.js', './upgrade122-hotfix41.js', './upgrade122-hotfix63.js',
    './upgrade122-hotfix68.js', './h98-focus.js', '../../h114-runtime-fixes.js',
    './upgrade122-hotfix57.js'
  ];
  const DEFAULT_RUNTIME = Array.isArray(window.__TOPKEY_RUNTIME_SOURCES)
    ? [...window.__TOPKEY_RUNTIME_SOURCES]
    : BADMINTON_RUNTIME;
  const FEATURES = {
    reports: [
      '../../h106-final-report-pdf.js',
      '../../vendor/jszip.min.js',
      '../../h112-ppt-template.js',
      '../../h116-report-integrity.js',
      '../../h116-custom-ppt.js',
      '../../h112-testlab-export-check.js',
      '../../h113-finance-report.js'
    ],
    testlab: ['../../h114-testlab-acceptance.js']
  };
  const loaded = new Map();
  const featurePromises = new Map();
  let runtimePromise = null;
  let runtimeScheduled = false;

  const idle = callback => {
    if (typeof window.requestIdleCallback === 'function') {
      return window.requestIdleCallback(callback, {timeout: 800});
    }
    return setTimeout(callback, 16);
  };
  const yieldToBrowser = () => new Promise(resolve => idle(resolve));
  const withBuild = source => {
    if (/^https?:\/\//i.test(source)) return source;
    const tag = String(window.TopkeyRelease?.cacheTag || '');
    if (!tag || /[?&](?:v|__topkey_build)=/.test(source)) return source;
    return source + (source.includes('?') ? '&' : '?') + 'v=' + encodeURIComponent(tag);
  };

  function preload(source) {
    const url = withBuild(source);
    if (document.querySelector(`link[data-topkey-preload="${url}"]`)) return;
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'script';
    link.href = url;
    link.dataset.topkeyPreload = url;
    document.head.appendChild(link);
  }

  function loadScript(source, timeout = 8000) {
    if (loaded.has(source)) return loaded.get(source);
    const existing = document.querySelector(`script[data-topkey-src="${source}"]`);
    if (existing?.dataset.topkeyReady === '1') return Promise.resolve(source);
    const promise = new Promise((resolve, reject) => {
      const script = existing || document.createElement('script');
      let finished = false;
      const finish = (ok, error) => {
        if (finished) return;
        finished = true;
        clearTimeout(timer);
        script.onload = script.onerror = null;
        if (ok) {
          script.dataset.topkeyReady = '1';
          resolve(source);
        } else {
          if (!existing) script.remove();
          loaded.delete(source);
          reject(error || new Error('Unable to load ' + source));
        }
      };
      script.async = false;
      script.dataset.topkeySrc = source;
      script.src = withBuild(source);
      script.onload = () => finish(true);
      script.onerror = () => finish(false, new Error('Unable to load ' + source));
      const timer = setTimeout(() => finish(false, new Error('Timeout loading ' + source)), timeout);
      if (!existing) document.head.appendChild(script);
    });
    loaded.set(source, promise);
    return promise;
  }

  async function loadOrdered(sources, options = {}) {
    const batchSize = Math.max(1, Number(options.batchSize || 4));
    const optional = options.optional === true;
    for (let offset = 0; offset < sources.length; offset += batchSize) {
      const batch = sources.slice(offset, offset + batchSize);
      batch.forEach(preload);
      for (const source of batch) {
        try {
          await loadScript(source);
        } catch (error) {
          if (!optional) throw error;
          console.warn('TOPKEY optional runtime skipped', source, error);
        }
      }
      await yieldToBrowser();
    }
    return true;
  }

  function loadRuntime(sources = DEFAULT_RUNTIME) {
    if (!runtimePromise) runtimePromise = loadOrdered(sources, {batchSize: 4, optional: true});
    return runtimePromise;
  }

  function loadFeature(name) {
    if (featurePromises.has(name)) return featurePromises.get(name);
    const sources = FEATURES[name];
    if (!sources) return Promise.reject(new Error('Unknown TOPKEY feature group: ' + name));
    const promise = loadOrdered(sources, {batchSize: 3, optional: false});
    featurePromises.set(name, promise);
    promise.catch(() => featurePromises.delete(name));
    return promise;
  }

  function scheduleRuntime() {
    if (runtimeScheduled) return runtimePromise;
    runtimeScheduled = true;
    idle(() => loadRuntime().catch(error => console.warn('TOPKEY runtime staging failed', error)));
    const params = new URLSearchParams(location.search);
    if (params.get('testlab') === '1') {
      idle(() => loadFeature('testlab').catch(error => console.warn('TOPKEY Test Lab extension unavailable', error)));
    }
    return runtimePromise;
  }

  function featureFor(target) {
    if (!target?.closest) return '';
    if (target.closest('#h114-qa, [data-topkey-feature="testlab"]')) return 'testlab';
    if (target.closest('[data-h113], [data-export], [data-topkey-feature="reports"], #tk65-open, #tk79-open, [id*="export"], [id*="report"], [id*="ppt"], [id*="pdf"]')) return 'reports';
    return '';
  }

  document.addEventListener('click', event => {
    const name = featureFor(event.target);
    if (!name || featurePromises.has(name)) return;
    const target = event.target;
    event.preventDefault();
    event.stopImmediatePropagation();
    loadFeature(name)
      .then(() => setTimeout(() => target?.click?.(), 0))
      .catch(error => {
        console.error('TOPKEY feature load failed', name, error);
        window.Topkey?.U?.toast?.('Khong tai duoc mo-dun xuat bao cao. Vui long thu lai.', 'err');
      });
  }, true);

  window.addEventListener('topkey:admin-ready', scheduleRuntime, {once: true, passive: true});
  if (window.__TOPKEY_ADMIN_READY) scheduleRuntime();

  window.TopkeyProductionLoader = Object.freeze({
    loadRuntime,
    loadFeature,
    scheduleRuntime,
    featureFor,
    runtimeSources: Object.freeze([...DEFAULT_RUNTIME]),
    featureSources: Object.freeze({reports: Object.freeze([...FEATURES.reports]), testlab: Object.freeze([...FEATURES.testlab])})
  });
})();
