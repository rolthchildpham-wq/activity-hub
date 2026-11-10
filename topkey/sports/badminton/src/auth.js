(() => {'use strict';const T=window.Topkey;if(!window.TopkeySharedAuth?.create)throw new Error('TOPKEY shared authentication missing');T.Auth=T.Auth||window.TopkeySharedAuth.create(T);})();
