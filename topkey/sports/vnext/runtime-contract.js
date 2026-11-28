/* TOPKEY shared release contract. App release and sport data schema are separate versions. */
(() => {
  'use strict';
  const release = window.TopkeyRelease;
  if (!release?.releaseId || !release?.cacheTag || !release?.version) {
    throw new Error('TOPKEY release manifest is missing or incomplete');
  }
  const api = Object.freeze({
    scope: 'shared-vnext',
    releaseId: release.releaseId,
    cacheTag: release.cacheTag,
    version: release.version,
    get sport() { return String(window.Topkey?.SPORT?.key || new URLSearchParams(location.search).get('sport') || ''); },
    get dataSchemaVersion() {
      const value = Number(window.Topkey?.SCHEMA_VERSION || window.Topkey?.SPORT?.schemaVersion || 0);
      return Number.isInteger(value) && value > 0 ? value : null;
    },
    get ready() { return Boolean(window.TopkeyPlatform && window.TopkeyRelease); }
  });
  Object.defineProperty(window, 'TopkeyRuntimeContract', { value: api, writable: false, configurable: false });
  const paintRelease = () => {
    const badge = document.getElementById('tk-release-badge');
    if (badge) {
      badge.textContent = release.releaseId + ' · RELEASE';
      badge.dataset.release = release.releaseId;
      badge.dataset.cacheTag = release.cacheTag;
    }
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', paintRelease, { once: true });
  else paintRelease();
})();
