/* ─── Helpers ────────────────────────────────────────────────────────────── */
/* ─── Compare tab ───────────────────────────────────────────────────────── */
let _cmpUsers = [];
let _pendingCompareId = null;
let _cmpSelA = null;
let _cmpSelB = null;

function openCompareWith(userId) {
  _pendingCompareId = userId;
  showTab('compare');
}

/* ── Player picker ── */
function ppRenderList(side, users, selectedId) {
  const list = document.getElementById(`pp-list-${side}`);
  if (!list) return;
  list.innerHTML = users.map(u => `
    <div class="pp-item ${u.id === selectedId ? 'pp-selected' : ''}" data-id="${u.id}"
         onclick="ppSelect('${side}',${u.id},'${u.name.replace(/'/g,"&#39;")}')">
      ${avatarHtml(u.name, u.id, 28)}
      <span class="pp-name">${u.name}</span>
      <span class="pp-pts">${u.total_points} pts</span>
      ${u.id === selectedId ? '<span class="pp-check">✓</span>' : ''}
    </div>`).join('');
}

function ppSetValue(side, userId, name) {
  const el = document.getElementById(`pp-value-${side}`);
  if (!el) return;
  if (userId && name) {
    el.innerHTML = `${avatarHtml(name, userId, 24)}<span style="font-weight:600;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${name}</span>`;
  } else {
    el.innerHTML = `<span class="pp-placeholder">${t('cmp_pick_player')}</span>`;
  }
}

function ppToggle(side, e) {
  e.stopPropagation();
  const other = side === 'a' ? 'b' : 'a';
  document.getElementById(`pp-dropdown-${other}`)?.classList.add('hidden');
  const otherArrow = document.getElementById(`pp-arrow-${other}`);
  if (otherArrow) otherArrow.style.transform = '';

  const dd    = document.getElementById(`pp-dropdown-${side}`);
  const arrow = document.getElementById(`pp-arrow-${side}`);
  const isOpen = !dd.classList.contains('hidden');
  dd.classList.toggle('hidden', isOpen);
  if (arrow) arrow.style.transform = isOpen ? '' : 'rotate(180deg)';
  if (!isOpen) {
    const search = document.getElementById(`pp-search-${side}`);
    if (search) { search.value = ''; ppFilter(side, ''); }
    setTimeout(() => search?.focus(), 50);
  }
}

function ppSelect(side, userId, name) {
  if (side === 'a') _cmpSelA = userId;
  else              _cmpSelB = userId;
  ppSetValue(side, userId, name);
  document.querySelectorAll(`#pp-list-${side} .pp-item`).forEach(el => {
    const sel = Number(el.dataset.id) === userId;
    el.classList.toggle('pp-selected', sel);
    el.querySelector('.pp-check')?.remove();
    if (sel) el.insertAdjacentHTML('beforeend', '<span class="pp-check">✓</span>');
  });
  document.getElementById(`pp-dropdown-${side}`)?.classList.add('hidden');
  const arrow = document.getElementById(`pp-arrow-${side}`);
  if (arrow) arrow.style.transform = '';
  if (_cmpSelA && _cmpSelB && _cmpSelA !== _cmpSelB) renderComparison(_cmpSelA, _cmpSelB);
  else document.getElementById('compare-result').innerHTML =
    `<div class="empty" style="padding:40px 0"><span class="icon">⚔️</span><p>${t('cmp_pick_both')}</p></div>`;
}

function ppFilter(side, q) {
  const lq = q.toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu,'');
  document.querySelectorAll(`#pp-list-${side} .pp-item`).forEach(el => {
    const name = (el.querySelector('.pp-name')?.textContent||'').toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu,'');
    el.style.display = name.includes(lq) ? '' : 'none';
  });
}

async function loadComparePage() {
  if (!_cmpUsers.length) {
    const lb = await api('/api/leaderboard') || [];
    _cmpUsers = lb;
  }

  if (_pendingCompareId !== null) {
    _cmpSelB = _pendingCompareId;
    if (currentUser && !_cmpSelA) _cmpSelA = currentUser.id;
    _pendingCompareId = null;
  } else {
    if (!_cmpSelA && currentUser) _cmpSelA = currentUser.id;
  }

  ppRenderList('a', _cmpUsers, _cmpSelA);
  ppRenderList('b', _cmpUsers, _cmpSelB);

  const uA = _cmpSelA ? _cmpUsers.find(u => u.id === _cmpSelA) : null;
  const uB = _cmpSelB ? _cmpUsers.find(u => u.id === _cmpSelB) : null;
  ppSetValue('a', uA?.id || null, uA?.name || null);
  ppSetValue('b', uB?.id || null, uB?.name || null);

  if (_cmpSelA && _cmpSelB && _cmpSelA !== _cmpSelB) renderComparison(_cmpSelA, _cmpSelB);
  else document.getElementById('compare-result').innerHTML =
    `<div class="empty" style="padding:40px 0"><span class="icon">⚔️</span><p>${t('cmp_pick_both')}</p></div>`;
}

async function renderComparison(idA, idB) {
  const el = document.getElementById('compare-result');
  el.innerHTML = `<div class="empty" style="padding:32px 0"><span class="icon">⏳</span></div>`;

  const [betsA, betsB, special, lb, matches] = await Promise.all([
    api(`/api/bets?user_id=${idA}`),
    api(`/api/bets?user_id=${idB}`),
    api('/api/special-bets'),
    api('/api/leaderboard'),
    api('/api/matches'),
  ]);

  const rankA = lb.findIndex(u => u.id === idA) + 1;
  const rankB = lb.findIndex(u => u.id === idB) + 1;
  const uA = lb.find(u => u.id === idA) || {};
  const uB = lb.find(u => u.id === idB) || {};

  const champResult  = special?.champion;
  const scorerResult = special?.top_scorer;

  const champA  = (special?.champion_bets  || []).find(b => b.user_id === idA);
  const champB  = (special?.champion_bets  || []).find(b => b.user_id === idB);
  const scorerA = (special?.scorer_bets    || []).find(b => b.user_id === idA);
  const scorerB = (special?.scorer_bets    || []).find(b => b.user_id === idB);

  const champWonA  = champResult  && champA  && champA.team.toLowerCase()  === champResult.toLowerCase();
  const champWonB  = champResult  && champB  && champB.team.toLowerCase()  === champResult.toLowerCase();
  const scorerWonA = scorerResult && scorerA && scorerA.name.toLowerCase() === scorerResult.toLowerCase();
  const scorerWonB = scorerResult && scorerB && scorerB.name.toLowerCase() === scorerResult.toLowerCase();

  const matchMap = Object.fromEntries((matches || allMatches).map(m => [m.id, m]));
  const mapA = Object.fromEntries((betsA || []).map(b => [b.match_id, b]));
  const mapB = Object.fromEntries((betsB || []).map(b => [b.match_id, b]));

  const sharedIds = Object.keys(mapA).filter(id => mapB[id] !== undefined).map(Number);
  const finished  = sharedIds.filter(id => matchMap[id]?.status === 'finished');
  finished.sort((a, b) => new Date(matchMap[a]?.match_date||0) - new Date(matchMap[b]?.match_date||0));

  let winsA = 0, winsB = 0, draws = 0, ptsA = 0, ptsB = 0;
  finished.forEach(id => {
    const ba = mapA[id], bb = mapB[id];
    const pa = ba.points || 0, pb = bb.points || 0;
    ptsA += pa; ptsB += pb;
    if (pa > pb) winsA++;
    else if (pb > pa) winsB++;
    else draws++;
  });

  const totalA = uA.total_points || 0, totalB = uB.total_points || 0;
  const lead = totalA > totalB ? 'a' : totalB > totalA ? 'b' : 'tie';

  function statCol(val, isLeader, label) {
    return `<div class="cmp-stat ${isLeader ? 'cmp-leader' : ''}">
      <div class="cmp-stat-val">${val}</div>
      <div class="cmp-stat-lbl">${label}</div>
    </div>`;
  }

  function specialRow(pickA, wonA, pickB, wonB, label) {
    const valA = pickA ? `${pickA}${wonA ? ' ✓' : ''}` : t('cmp_no_pick');
    const valB = pickB ? `${pickB}${wonB ? ' ✓' : ''}` : t('cmp_no_pick');
    return `<div class="cmp-special-row">
      <span class="cmp-special-val ${wonA ? 'cmp-won' : ''}">${valA}</span>
      <span class="cmp-special-lbl">${label}</span>
      <span class="cmp-special-val ${wonB ? 'cmp-won' : ''}">${valB}</span>
    </div>`;
  }

  const totalW = winsA + winsB + draws || 1;
  const barA = Math.round(winsA / totalW * 100);
  const barB = Math.round(winsB / totalW * 100);
  const barD = 100 - barA - barB;

  const matchRows = finished.map(id => {
    const m  = matchMap[id];
    const ba = mapA[id], bb = mapB[id];
    const pa = ba.points || 0, pb = bb.points || 0;
    const winner = pa > pb ? 'a' : pb > pa ? 'b' : 'tie';
    const chip = (p) => `<span class="pts-chip ${ptsMeta(p).cls}">${p}pt</span>`;
    return `<div class="cmp-match-row ${winner === 'a' ? 'cmp-win-a' : winner === 'b' ? 'cmp-win-b' : ''}">
      <div class="cmp-match-bet cmp-bet-a">
        <span class="cmp-score">${ba.home_score}×${ba.away_score}</span>${chip(pa)}
      </div>
      <div class="cmp-match-info">
        <div class="cmp-match-teams">${_flagMap[m.home_team]||''} ${tTeam(m.home_team)} <span class="cmp-result">${m.home_score}×${m.away_score}</span> ${tTeam(m.away_team)} ${_flagMap[m.away_team]||''}</div>
        <div class="cmp-match-stage">${tStage(m.stage)}</div>
      </div>
      <div class="cmp-match-bet cmp-bet-b">
        ${chip(pb)}<span class="cmp-score">${bb.home_score}×${bb.away_score}</span>
      </div>
    </div>`;
  }).join('');

  el.innerHTML = `
    <div class="cmp-header">
      <div class="cmp-player ${lead === 'a' ? 'cmp-leader' : ''}">
        ${avatarHtml(uA.name || '—', idA, 44)}
        <div class="cmp-name">${uA.name || '—'}</div>
        <div class="cmp-rank">#${rankA || '—'}</div>
      </div>
      <div class="cmp-center-badge">⚔️</div>
      <div class="cmp-player ${lead === 'b' ? 'cmp-leader' : ''}">
        ${avatarHtml(uB.name || '—', idB, 44)}
        <div class="cmp-name">${uB.name || '—'}</div>
        <div class="cmp-rank">#${rankB || '—'}</div>
      </div>
    </div>

    <div class="cmp-stats-row">
      ${statCol(totalA, lead === 'a', t('cmp_points'))}
      ${statCol(uA.exact_scores || 0, (uA.exact_scores||0) >= (uB.exact_scores||0) && (uA.exact_scores||0) > 0, t('cmp_exact'))}
      ${statCol(uA.correct_results || 0, (uA.correct_results||0) >= (uB.correct_results||0) && (uA.correct_results||0) > 0, t('cmp_results'))}
      <div class="cmp-stat-sep"></div>
      ${statCol(totalB, lead === 'b', t('cmp_points'))}
      ${statCol(uB.exact_scores || 0, (uB.exact_scores||0) > (uA.exact_scores||0), t('cmp_exact'))}
      ${statCol(uB.correct_results || 0, (uB.correct_results||0) > (uA.correct_results||0), t('cmp_results'))}
    </div>

    <div class="cmp-special-block">
      ${specialRow(champA?.team, champWonA, champB?.team, champWonB, t('cmp_champ'))}
      ${specialRow(scorerA?.name, scorerWonA, scorerB?.name, scorerWonB, t('cmp_scorer'))}
    </div>

    ${finished.length > 0 ? `
    <div class="cmp-h2h-block">
      <div class="cmp-h2h-title">
        <span>${t('cmp_h2h_title')}</span>
        <span class="cmp-h2h-sub">${finished.length} ${t('cmp_h2h_games')}</span>
      </div>
      <div class="cmp-h2h-scores">
        <span class="cmp-h2h-num ${winsA > winsB ? 'cmp-h2h-lead' : ''}">${winsA}${t('cmp_h2h_win')}</span>
        <span class="cmp-h2h-num draw">${draws}${t('cmp_h2h_draw')}</span>
        <span class="cmp-h2h-num ${winsB > winsA ? 'cmp-h2h-lead' : ''}">${winsB}${t('cmp_h2h_win')}</span>
      </div>
      <div class="cmp-h2h-pts">
        <span class="${ptsA > ptsB ? 'cmp-h2h-lead' : ''}">${ptsA} pts</span>
        <span style="color:var(--text-3);font-size:.72rem">pts em comum</span>
        <span class="${ptsB > ptsA ? 'cmp-h2h-lead' : ''}">${ptsB} pts</span>
      </div>
      <div class="cmp-bar-wrap">
        <div class="cmp-bar-a" style="width:${barA}%"></div>
        <div class="cmp-bar-d" style="width:${barD}%"></div>
        <div class="cmp-bar-b" style="width:${barB}%"></div>
      </div>
    </div>

    <div class="cmp-matches-block">
      <div class="cmp-matches-header">
        <span>${uA.name || '—'}</span>
        <span>${t('cmp_matches_title')}</span>
        <span>${uB.name || '—'}</span>
      </div>
      ${matchRows}
    </div>
    ` : `<div class="empty" style="padding:32px 0"><span class="icon">⏳</span><p>${t('cmp_no_finished')}</p></div>`}
  `;
}

function fmtDate(str) {
  return new Date(str).toLocaleDateString(dateLocale(), { day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit', timeZone:'Europe/Berlin' });
}

function timeAgo(str) {
  const ms  = Date.now() - new Date(str).getTime();
  const min = Math.floor(ms / 60000);
  const h   = Math.floor(ms / 3600000);
  const d   = Math.floor(ms / 86400000);
  const en  = getCurrentLang() === 'en';
  if (min < 1)  return en ? 'just now'      : 'agora';
  if (min < 60) return en ? `${min}m ago`   : `há ${min}min`;
  if (h   < 24) return en ? `${h}h ago`     : `há ${h}h`;
  if (d   < 7)  return en ? `${d}d ago`     : `há ${d} dias`;
  return fmtDate(str);
}

/* ─── Language switcher ──────────────────────────────────────────────────── */
async function setLang(lang) {
  setCurrentLang(lang);
  // Re-render dynamic content (data already cached in allMatches/userBets)
  buildStagePills();
  renderMatches();
  const activePaneId = document.querySelector('.tab-pane:not(.hidden)')?.id;
  if (activePaneId === 'tab-leaderboard') { loadLeaderboard(); loadSpecialAndFeed(); }
  else if (activePaneId === 'tab-bracket') renderBracketTab();
  else if (activePaneId === 'tab-me') loadMyPage();
  else if (activePaneId === 'tab-matches') { /* already rebuilt above */ }
}

function toast(msg, type = 'info') {
  document.querySelectorAll('.toast').forEach(t => t.remove());
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.textContent = msg;
  document.body.appendChild(el);
  requestAnimationFrame(() => el.classList.add('show'));
  setTimeout(() => { el.classList.remove('show'); setTimeout(() => el.remove(), 350); }, 2800);
}
