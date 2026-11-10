(() => {
  'use strict';
  const T = window.Topkey = window.Topkey || {};
  T.VERSION = window.TopkeyRelease?.version || 'UNAVAILABLE_RELEASE_RUNTIME';
  T.CONFIG_VERSION = T.VERSION;
  T.SCHEMA_VERSION = 3;
  T.FIREBASE_CONFIG = {
    apiKey: 'AIzaSyBSr7buP3bMf6HTg_YDWH_Xk5aNhyvfSRg',
    authDomain: 'topkey-badminton.firebaseapp.com',
    databaseURL: 'https://topkey-badminton-default-rtdb.asia-southeast1.firebasedatabase.app',
    projectId: 'topkey-badminton',
    storageBucket: 'topkey-badminton.firebasestorage.app',
    messagingSenderId: '907878800245',
    appId: '1:907878800245:web:aa77e4846656a0ba84913c',
    measurementId: 'G-E4M8XDJ26J'
  };
  T.ROOT = 'topkey_badminton_vnext_2026';
  T.AUTH_ROOT = T.ROOT;
  T.SPORT = {key:'badminton',icon:'🏸',name:'Cầu lông',title:'TOPKEY BADMINTON VNEXT',root:T.ROOT,mode:'sets'};
  T.LEGACY_ROOT = 'topkey_badminton_app_ai';
  T.DEFAULT_RULES = {
    winPoints: 3, lossPoints: 0, walkoverWinPoints: 3,
    tieBreakers: ['headToHead','setDiff','pointDiff','setsFor','pointsFor','name'],
    minRestMinutes: 30, estimatedMatchMinutes: 35,
    bestOf: 3, points: 21, winBy: 2, cap: 30, decidingSideChangeAt: 11
  };
  T.MATCH_STATUSES = ['SCHEDULED','CHECK_IN','READY','CALLED_TO_COURT','WARM_UP','LIVE','INTERVAL','SUSPENDED','FINISHED','WALKOVER','RETIRED','DISQUALIFIED','CANCELLED'];
  T.ROLES = window.TopkeyPlatform.policy.roles;
})();
