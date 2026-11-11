// Read at most one archive page. Reports stay in their existing storage path.
(() => {
 'use strict';
 window.TopkeyArchivePage = async function(ref, cursor = null, size = 25) {
  let query = ref.orderByChild('closedAt');
  if (cursor) query = query.endAt(cursor.value, cursor.key);
  const snap = await query.limitToLast(size + 2).once('value');
  const ordered = [];
  snap.forEach(child => { ordered.push({key:child.key,value:child.val()}); });
  const eligible = ordered.filter(x => !cursor || x.key !== cursor.key);
  const selected = eligible.slice(-size);
  const first = selected[0];
  return {
   rows:Object.fromEntries(selected.map(x => [x.key,{...x.value,tid:x.value?.tid||x.key}])),
   hasMore:eligible.length > size,
   cursor:first ? {key:first.key,value:first.value?.closedAt ?? null} : null
  };
 };
})();
