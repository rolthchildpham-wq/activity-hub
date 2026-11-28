(() => {
  'use strict';
  if (window.TopkeyProductionLoader) return;

  const SHARED_RUNTIME_FALLBACK = ['../../h114-runtime-fixes.js'];
  const DEFAULT_RUNTIME = Array.isArray(window.__TOPKEY_RUNTIME_SOURCES)
    ? [...window.__TOPKEY_RUNTIME_SOURCES]
    : SHARED_RUNTIME_FALLBACK;
  const FEATURES = {
    reports: [
      '../badminton/upgrade122-hotfix55.js?v=h135-event-reports-20261113',
      '../badminton/upgrade122-hotfix65.js?v=tourney-lifecycle-20261117-r1',
      '../badminton/upgrade122-hotfix76.js?v=h135-event-reports-20261113',
      '../badminton/upgrade122-hotfix80.js?v=tourney-lifecycle-20261117-r1',
      '../../h106-final-report-pdf.js',
      '../../vendor/jszip.min.js',
      '../../ppt-report-wizard.js?v=ppt-upload-20261111',
      '../../h116-report-integrity.js',
      '../../h112-testlab-export-check.js?v=ppt-upload-20261111',
      '../../h113-finance-report.js'
    ],
    ppt: ['../../vendor/pptxgen.bundle.js'],
    testlab: ['../../h114-testlab-acceptance.js?v=ppt-upload-20261111'],
    badmintonPerformance: [
      '../badminton/upgrade122-hotfix5.js?v=h128-no-auto-reload-20261113',
      '../badminton/fast-start-h124.js?v=h126-startup-20261113',
      '../badminton/dashboard-smooth-h129.js?v=h129-20261113',
      '../badminton/tab-perf-h133.js?v=h133-20261113',
      '../badminton/sidebar-collapse-h130.js?v=h130-20261113'
    ]
  };
  const loaded = new Map();
  const featurePromises = new Map();
  const readyFeatures = new Set();
  let runtimePromise = null;
  let runtimeScheduled = false;

  // Input-aware background staging: keep scoring/tabs responsive while legacy
  // optional extensions load. Never delay an explicit user-requested feature.
  // H134: background runtime is not user-critical; wait for a genuinely
  // quiet navigation period before evaluating each legacy extension.
  // Explicit report/PPT features still load immediately through loadFeature().
  let lastInteractionAt = Date.now();
  let lastTabChangeAt = Date.now();
  const markInteraction = () => { lastInteractionAt = Date.now(); };
  document.addEventListener('click', event => {
    if (event.target?.closest?.('[data-tab]')) lastTabChangeAt = Date.now();
  }, {passive:true,capture:true});
  for (const eventName of ['pointerdown', 'keydown', 'touchstart']) {
    document.addEventListener(eventName, markInteraction, {passive: true, capture: true});
  }
  const idle = callback => {
    if (typeof window.requestIdleCallback === 'function') {
      return window.requestIdleCallback(callback, {timeout: 1200});
    }
    return setTimeout(callback, 80);
  };
  const yieldToBrowser = (quietMs=0) => new Promise(resolve => {
    const check = () => {
      const sinceInput = Date.now() - lastInteractionAt;
      const sinceTab = Date.now() - lastTabChangeAt;
      const inputPending = typeof navigator.scheduling?.isInputPending === 'function'
        && navigator.scheduling.isInputPending({includeContinuous: true});
      if (sinceInput < quietMs || sinceTab < quietMs || inputPending ||
          (quietMs && document.hidden)) {
        setTimeout(check, 180);return;
      }
      idle(() => {
        // Re-check if an input arrived while waiting for idle callback.
        if (Date.now() - lastInteractionAt < quietMs ||
            Date.now() - lastTabChangeAt < quietMs) {setTimeout(check,180);return;}
        resolve();
      });
    };
    check();
  });
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
    const quietMs = Number.isFinite(Number(options.quietMs)) ? Math.max(0, Number(options.quietMs)) : 4000;
    for (let offset = 0; offset < sources.length; offset += batchSize) {
      const batch = sources.slice(offset, offset + batchSize);
      // Avoid preloading the next batch during active table/umpire navigation.
      if (!optional) batch.forEach(preload);
      for (const source of batch) {
        // Legacy extensions can run expensive top-level JS synchronously.
        // Wait until 4 seconds without clicks/tab changes before each script.
        if (optional) await yieldToBrowser(quietMs);
        try {
          await loadScript(source);
        } catch (error) {
          if (!optional) throw error;
          console.warn('TOPKEY optional runtime skipped', source, error);
        }
      }
      if(optional) await yieldToBrowser(quietMs);
      else await yieldToBrowser();
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
    const promise = loadOrdered(sources, {batchSize: 3, optional: false}).then(result => {readyFeatures.add(name);return result;});
    featurePromises.set(name, promise);
    promise.catch(() => featurePromises.delete(name));
    return promise;
  }

  function waitForBadmintonApp(timeout = 15000) {
    const started = Date.now();
    return new Promise((resolve, reject) => {
      const check = () => {
        const T = window.Topkey;
        if (T?.App && T?.Auth && window.TopkeyCoreDataRuntime115) return resolve(true);
        if (Date.now() - started >= timeout) return reject(new Error('Badminton shared app/auth/core initialization timed out'));
        setTimeout(check, 50);
      };
      check();
    });
  }

  function scheduleRuntime() {
    if (!window.__TOPKEY_CORE_READY || !window.__TOPKEY_ADMIN_READY) return runtimePromise;
    if (runtimeScheduled) return runtimePromise;
    runtimeScheduled = true;
    // Allow the verified application to settle before background extensions run.
    setTimeout(() => idle(() => loadRuntime().catch(error => console.warn('TOPKEY runtime staging failed', error))), 850);
    const params = new URLSearchParams(location.search);
    if (params.get('sport') === 'badminton') {
      idle(() => waitForBadmintonApp().then(() => loadOrdered(FEATURES.badmintonPerformance, {
        batchSize: 2, optional: true, quietMs: 350
      })).catch(error => console.error('TOPKEY badminton shared performance runtime', error)));
    }
    if (params.get('testlab') === '1') {
      idle(() => Promise.all([loadFeature('testlab'), loadFeature('reports')])
        .catch(error => console.warn('TOPKEY Test Lab/report extensions unavailable', error)));
    }
    return runtimePromise;
  }

  function featureFor(target) {
    if (!target?.closest) return '';
    if (target.closest('#h114-qa, [data-topkey-feature="testlab"]')) return 'testlab';
    if (target.closest('[data-h113], [data-export], [data-topkey-feature="reports"], #tk65-open, #tk79-open, #tk65-download-current, .tk65-archive-report, [id*="export"], [id*="report"], [id*="ppt"], [id*="pdf"]')) return 'reports';
    return '';
  }

  document.addEventListener('click', event => {
    const name = featureFor(event.target);
    if (!name || readyFeatures.has(name)) return;
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

  window.addEventListener('topkey:admin-ready', scheduleRuntime, {passive: true});
  window.addEventListener('topkey:core-ready', scheduleRuntime, {passive: true});
  if (window.__TOPKEY_ADMIN_READY && window.__TOPKEY_CORE_READY) scheduleRuntime();

  window.TopkeyProductionLoader = Object.freeze({
    scope: 'shared-vnext',
    releaseId: String(window.TopkeyRelease?.releaseId || 'UNKNOWN'),
    cacheTag: String(window.TopkeyRelease?.cacheTag || ''),
    loadRuntime,
    loadFeature,
    scheduleRuntime,
    featureFor,
    runtimeSources: Object.freeze([...DEFAULT_RUNTIME]),
    featureSources: Object.freeze({ppt: Object.freeze([...FEATURES.ppt]), reports: Object.freeze([...FEATURES.reports]), testlab: Object.freeze([...FEATURES.testlab]), badmintonPerformance: Object.freeze([...FEATURES.badmintonPerformance])})
  });
})();
