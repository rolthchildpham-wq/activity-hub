(()=>{'use strict';
const T=window.Topkey,App=T?.App;if(!T||!App||App.__upgrade54Installed)return;
App.__upgrade54Installed=true;
const VERSION='2026.10.29-vnext-featureparity15-upgrade54';
function stamp(){T.CONFIG_VERSION=VERSION;T.VERSION=VERSION;T.RUNTIME_BUILD=VERSION;document.documentElement.dataset.topkeyBuild='upgrade54';try{App.renderHealth?.()}catch{}const h=document.getElementById('health-version');if(h)h.textContent=VERSION}
stamp();setTimeout(stamp,0);setTimeout(stamp,700);window.addEventListener('focus',stamp);
})();
