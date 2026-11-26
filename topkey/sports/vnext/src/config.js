(() => {
  'use strict';
  const T = window.Topkey = window.Topkey || {};
  T.VERSION = window.TopkeyRelease?.version || 'UNAVAILABLE_RELEASE_RUNTIME';
  T.SCHEMA_VERSION = 2;
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
  T.AUTH_ROOT = 'topkey_badminton_vnext_2026';
  const common={categories:['OPEN'],stages:['GROUP','KNOCKOUT','SEMIFINAL','FINAL'],participantLabel:'Đội',member1Label:'Thành viên 1',member2Label:'Thành viên 2',venueLabel:'Sân',officialLabel:'Trọng tài',eventLabel:'Trận',registrationMode:'TEAM',formats:['ROUND_ROBIN','GROUP_KNOCKOUT','KNOCKOUT']};
  T.SPORTS={
    football:{...common,key:'football',icon:'⚽',name:'Bóng đá',title:'TOPKEY FOOTBALL VNEXT',root:'topkey_football_vnext_2026',mode:'score',registrationMode:'TEAM_ROSTER',member1Label:'Đội trưởng',member2Label:'HLV / Đại diện',categories:['NAM_S5','NU_S5','NAM_S7','NU_S7','NAM_S11','NU_S11'],formats:['ROUND_ROBIN','GROUP_KNOCKOUT','KNOCKOUT'],rules:{winPoints:3,drawPoints:1,lossPoints:0,walkoverWinPoints:3,minRestMinutes:120,estimatedMatchMinutes:60,tieBreakers:['points','goalDiff','goalsFor','headToHead','name']},profile:{teamRoster:true,fieldSizes:[5,7,11],genderDivisions:['MEN','WOMEN'],knockoutStages:['QUARTERFINAL','SEMIFINAL','FINAL']}},
    volleyball:{...common,key:'volleyball',icon:'🏐',name:'Bóng chuyền',title:'TOPKEY VOLLEYBALL VNEXT',root:'topkey_volleyball_vnext_2026',mode:'sets',registrationMode:'TEAM_ROSTER',member1Label:'Đội trưởng',member2Label:'HLV / Đại diện',categories:['NAM_6V6','NU_6V6','MIX_6V6','PHONG_TRAO_6V6'],formats:['ROUND_ROBIN','GROUP_KNOCKOUT','KNOCKOUT'],rules:{winPoints:3,lossPoints:0,walkoverWinPoints:3,minRestMinutes:60,estimatedMatchMinutes:75,bestOf:5,points:25,decidingPoints:15,winBy:2,cap:99,tieBreakers:['points','setDiff','pointDiff','headToHead','name']},profile:{teamRoster:true,playersOnCourt:6,knockoutStages:['QUARTERFINAL','SEMIFINAL','FINAL']}},
    running:{...common,key:'running',icon:'🏃',name:'Chạy bộ',title:'TOPKEY RUNNING VNEXT',root:'topkey_running_vnext_2026',mode:'time',registrationMode:'INDIVIDUAL_OR_RELAY',participantLabel:'VĐV / Đội tiếp sức',member1Label:'Họ và tên / Đội trưởng',member2Label:'CLB / Liên hệ',venueLabel:'Làn / Khu vực',officialLabel:'Trọng tài thời gian',eventLabel:'Lượt chạy',categories:['3K','5K','10K','RELAY_4X400'],stages:['HEAT','QUALIFY','FINAL'],formats:['MASS_START','TIME_TRIAL','HEATS_FINAL'],rules:{minRestMinutes:30,estimatedMatchMinutes:25,tieBreakers:['time','name']},profile:{timing:['GUN_TIME','CHIP_TIME'],relay:true}},
    handmade:{...common,key:'handmade',icon:'🧶',name:'DIY / Handmade',title:'TOPKEY HANDMADE VNEXT',root:'topkey_handmade_vnext_2026',mode:'judged',registrationMode:'INDIVIDUAL_OR_TEAM',participantLabel:'Thí sinh / Đội',member1Label:'Tác giả chính',member2Label:'Thành viên / Liên hệ',venueLabel:'Khu vực (Sảnh)',officialLabel:'Giám khảo',eventLabel:'Lượt chấm',categories:['DIY','HANDMADE','RECYCLE','OPEN'],stages:['DISPLAY','QUALIFY','FINAL'],formats:['JUDGED_RUBRIC'],rules:{minRestMinutes:10,estimatedMatchMinutes:15,maxJudgeScore:100,tieBreakers:['score','name']},rubric:[{key:'creativity',label:'Sáng tạo / Ý tưởng',weight:30},{key:'craft',label:'Kỹ thuật / Hoàn thiện',weight:30},{key:'aesthetic',label:'Thẩm mỹ',weight:20},{key:'utility',label:'Công năng / Bền vững',weight:20}]},
    shuttle:{...common,key:'shuttle',icon:'🪶',name:'Đá cầu',title:'TOPKEY SHUTTLECOCK VNEXT',root:'topkey_shuttle_vnext_2026',mode:'sets',registrationMode:'INDIVIDUAL_PAIR_OR_TEAM',member1Label:'VĐV 1 / Đội trưởng',member2Label:'VĐV 2 / Thành viên',categories:['DON_NAM','DON_NU','DOI_NAM','DOI_NU','DOI_NAM_NU','DONG_DOI'],formats:['ROUND_ROBIN','GROUP_KNOCKOUT','KNOCKOUT'],rules:{winPoints:3,lossPoints:0,walkoverWinPoints:3,minRestMinutes:30,estimatedMatchMinutes:35,bestOf:3,points:21,decidingPoints:21,winBy:2,cap:99,tieBreakers:['points','setDiff','pointDiff','headToHead','name']},profile:{pairing:true,teamEvent:true}},
 new URLSearchParams(location.search).get('sport')||'football';
  T.SPORT=T.SPORTS[key]||T.SPORTS.football;
  T.ROOT=T.SPORT.root;
  T.DEFAULT_RULES=T.SPORT.rules;
  T.MATCH_STATUSES=['SCHEDULED','CHECK_IN','READY','CALLED','LIVE','SUSPENDED','FINISHED','WALKOVER','RETIRED','DISQUALIFIED','CANCELLED'];
  T.ROLES=window.TopkeyPlatform.policy.roles;
})();
