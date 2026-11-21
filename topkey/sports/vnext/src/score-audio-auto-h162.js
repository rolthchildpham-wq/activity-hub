/* Unlock commentary audio in the referee's score-button gesture.
 * Reuses the existing score -> Firebase commentary -> TTS event path.
 */
(() => {
  'use strict';
  if (window.__TOPKEY_PUBLIC_ROUTE || window.TopkeyScoreAudioH162) return;
  const ids = new Set(['umpire-plus-a','umpire-plus-b']);
  function unlock(event) {
    const button = event.target?.closest?.('button');
    if (!button || !ids.has(button.id)) return;
    const T = window.Topkey, app = T?.App;
    if (!T?.Auth?.can?.('umpire') || !app) return;
    const match = app.state?.activeMatches?.[app.currentCourt];
    if (!match?.started || match.finished) return;
    app.audioUnlocked = true;
    const checkbox = document.getElementById('auto-commentary');
    if (checkbox) checkbox.checked = true;
    try { localStorage.setItem('topkey_auto_blv','1'); } catch {}
    try { window.speechSynthesis?.resume?.(); } catch {}
  }
  document.addEventListener('click',unlock,true);
  window.TopkeyScoreAudioH162 = {unlock};
})();
