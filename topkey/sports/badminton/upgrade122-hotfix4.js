/* Upgrade122 Hotfix4 compatibility shim.
 * Hotfix4 MutationObserver auto-update loop was retired by Hotfix5 because it could saturate the main thread.
 * Effective auto-update implementation now lives in upgrade122-hotfix5.js.
 */
(()=>{'use strict';window.TopkeyUpgrade122Hotfix4={installed:false,retiredBy:'hotfix5',reason:'mutation-observer-loop'};})();
