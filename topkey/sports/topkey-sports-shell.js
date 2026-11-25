(() => {
  'use strict';

  const currentSport = location.pathname.includes('/sports/badminton/')
    ? 'badminton'
    : new URLSearchParams(location.search).get('sport') || 'football';
  const sports = [
    { key: 'football', icon: '⚽', name: 'Bóng đá', href: '/sports/vnext/index.html?sport=football' },
    { key: 'badminton', icon: '🏸', name: 'Cầu lông', href: '/sports/vnext/badminton.html' },
    { key: 'volleyball', icon: '🏐', name: 'Bóng chuyền', href: '/sports/vnext/index.html?sport=volleyball' },
    { key: 'running', icon: '🏃', name: 'Chạy bộ', href: '/sports/vnext/index.html?sport=running' },
    { key: 'handmade', icon: '🧶', name: 'DIY / Handmade', href: '/sports/vnext/index.html?sport=handmade' },
    { key: 'shuttle', icon: '🪶', name: 'Đá cầu', href: '/sports/vnext/index.html?sport=shuttle' },
    { key: 'cooking', icon: '👨‍🍳', name: 'Nấu ăn', href: '/sports/vnext/index.html?sport=cooking' }
  ];

  if (location.hash.startsWith('#spectator') || location.hash.startsWith('#register')) return;
  if (document.getElementById('topkey-sports-shell')) return;

  const shell = document.createElement('nav');
  shell.id = 'topkey-sports-shell';
  shell.className = 'tk-sports-shell';
  shell.setAttribute('aria-label', 'Điều hướng các bộ môn TOPKEY');

  const hub = document.createElement('a');
  hub.className = 'tk-sports-shell__hub';
  hub.href = '../../index.html';
  hub.textContent = '← Sports Hub';

  const label = document.createElement('label');
  label.className = 'tk-sports-shell__label';
  label.htmlFor = 'tk-sports-shell-select';
  label.textContent = 'BỘ MÔN';

  const select = document.createElement('select');
  select.id = 'tk-sports-shell-select';
  select.setAttribute('aria-label', 'Chuyển bộ môn');
  for (const sport of sports) {
    const option = document.createElement('option');
    option.value = sport.href;
    option.textContent = sport.icon + ' ' + sport.name;
    option.selected = sport.key === currentSport;
    select.append(option);
  }
  select.addEventListener('change', () => {
    const target = select.value;
    if (target) location.assign(target);
  });

  const current = sports.find(sport => sport.key === currentSport) || sports[0];
  const title = document.createElement('span');
  title.className = 'tk-sports-shell__current';
  title.textContent = current.icon + ' ' + current.name;

  shell.append(hub, label, select, title);
  document.body.prepend(shell);
})();
