/* ─── Matches ────────────────────────────────────────────────────────────── */
async function loadMatches() {
  allMatches = await api('/api/matches') || [];
  if (currentUser) {
    const bets = await api(`/api/bets?user_id=${currentUser.id}`) || [];
    userBets = {};
    bets.forEach(b => { userBets[b.match_id] = b; });
    document.getElementById('matches-user-hint').textContent = `${t('betting_as')} ${currentUser.name}`;
  } else {
    userBets = {};
    document.getElementById('matches-user-hint').textContent = '';
  }
  buildStagePills();
  syncStatusPills();
  renderMatches();
  updatePendingBadge();
}

function updatePendingBadge() {
  const badge  = document.getElementById('pending-badge');
  const bBadge = document.getElementById('bnav-badge');
  if (!badge) return;
  if (!currentUser) {
    badge.classList.add('hidden');
    if (bBadge) bBadge.classList.add('hidden');
    return;
  }
  const now = new Date();
  const LOCK_MS = 5 * 60 * 1000;
  const open = allMatches.filter(m =>
    m.status === 'upcoming' && new Date(m.match_date) - now > LOCK_MS &&
    m.home_team !== 'A definir' && m.away_team !== 'A definir'
  );
  const unbetted = open.filter(m => !userBets[m.id]).length;
  if (unbetted > 0) {
    badge.textContent = unbetted;
    badge.classList.remove('hidden');
    if (bBadge) { bBadge.textContent = unbetted; bBadge.classList.remove('hidden'); }
  } else {
    badge.classList.add('hidden');
    if (bBadge) bBadge.classList.add('hidden');
  }
}

function buildStagePills() {
  const G_ROUNDS = ['1ª Rodada', '2ª Rodada', '3ª Rodada'];
  const stages = [...new Set(allMatches.map(m => m.stage))];
  const groupStages    = stages.filter(s =>  G_ROUNDS.includes(s));
  const knockoutStages = stages.filter(s => !G_ROUNDS.includes(s));
  const row = document.getElementById('stage-pills-row');

  const stagePill = s => `<button class="pill pill-view ${stageFilter === s ? 'active' : ''}"
    onclick="setStageFilter('${s.replace(/'/g,"&#39;")}', this)">${tStageShort(s)}</button>`;

  if (stages.length <= 1) { row.innerHTML = ''; }
  else {
    row.innerHTML =
      `<span class="filter-label">Etapa</span>` +
      `<button class="pill pill-view ${stageFilter === 'all' ? 'active' : ''}" onclick="setStageFilter('all',this)">Todas</button>` +
      (groupStages.length    ? `<span class="filter-sep"></span>${groupStages.map(stagePill).join('')}`    : '') +
      (knockoutStages.length ? `<span class="filter-sep"></span>${knockoutStages.map(stagePill).join('')}` : '');
  }

  document.getElementById('view-toggle-row').innerHTML =
    `<span class="filter-label">Vista</span>` +
    `<button class="pill pill-view ${viewMode === 'grouped'       ? 'active' : ''}" onclick="setViewMode('grouped',this)">${t('view_grouped')}</button>` +
    `<button class="pill pill-view ${viewMode === 'chronological' ? 'active' : ''}" onclick="setViewMode('chronological',this)">${t('view_chrono')}</button>` +
    (currentUser ? `<span class="filter-sep"></span><button class="pill ${showUnbettedOnly ? 'active' : ''}" onclick="toggleUnbettedFilter(this)">${t('no_bet_filter')}</button>` : '') +
    `<button class="btn btn-ghost btn-sm" style="margin-left:auto" onclick="toggleAllGroups()">⊞</button>` +
    (currentUser ? `<button class="btn btn-ghost btn-sm" onclick="randomizeBets()">${t('randomize_btn')}</button>` : '') +
    (currentUser ? `<button class="btn btn-ghost btn-sm" style="color:var(--red)" onclick="confirmClearBets()">${t('clear_bets_btn')}</button>` : '');
}

function setViewMode(mode, btn) {
  viewMode = mode;
  localStorage.setItem('bolao_viewmode', mode);
  document.querySelectorAll('#view-toggle-row .pill-view').forEach(p => p.classList.remove('active'));
  btn.classList.add('active');
  renderMatches();
}

function toggleAllGroups() {
  // If any group is expanded, collapse all. Otherwise expand all.
  const allKeys = getGroupKeys();
  const allCollapsed = allKeys.every(k => collapsedGroups.has(k));
  if (allCollapsed) {
    collapsedGroups.clear();
  } else {
    allKeys.forEach(k => collapsedGroups.add(k));
  }
  localStorage.setItem('bolao_collapsed', JSON.stringify([...collapsedGroups]));
  renderMatches();
}

function getGroupKeys() {
  let list = allMatches;
  if (statusFilter === 'upcoming') list = list.filter(m => m.status === 'upcoming');
  if (statusFilter === 'finished') list = list.filter(m => m.status === 'finished');
  if (stageFilter  !== 'all')      list = list.filter(m => m.stage === stageFilter);
  if (viewMode === 'chronological') {
    return [...new Set(list.map(m => m.match_date.slice(0, 10)))];
  }
  return [...new Set(list.map(m => m.group_name ? `${m.stage}|||${m.group_name}` : m.stage))];
}

function toggleGroup(key) {
  if (collapsedGroups.has(key)) collapsedGroups.delete(key);
  else collapsedGroups.add(key);
  localStorage.setItem('bolao_collapsed', JSON.stringify([...collapsedGroups]));
  renderMatches();
}

function setStatusFilter(f, btn) {
  statusFilter = f;
  localStorage.setItem('bolao_statusFilter', f);
  document.querySelectorAll('#status-pills .pill').forEach(p => p.classList.remove('active'));
  btn.classList.add('active');
  renderMatches();
}

// Reflect the persisted statusFilter on the (static) status pills after a reload.
function syncStatusPills() {
  const map = { all: 0, upcoming: 1, finished: 2 };
  const pills = document.querySelectorAll('#status-pills .pill');
  pills.forEach(p => p.classList.remove('active'));
  pills[map[statusFilter] ?? 0]?.classList.add('active');
}

function setStageFilter(f, btn) {
  stageFilter = f;
  localStorage.setItem('bolao_stageFilter', f);
  document.querySelectorAll('#stage-pills-row .pill-view').forEach(p => p.classList.remove('active'));
  btn.classList.add('active');
  renderMatches();
}

function toggleUnbettedFilter(btn) {
  showUnbettedOnly = !showUnbettedOnly;
  btn.classList.toggle('active', showUnbettedOnly);
  renderMatches();
}

function renderNextBetCard() {
  const el = document.getElementById('next-bet-card');
  if (!el || !currentUser) { if (el) el.innerHTML = ''; return; }
  const LOCK_MS = 5 * 60 * 1000;
  const now = Date.now();
  const candidates = allMatches
    .filter(m => m.status === 'upcoming' && !userBets[m.id] && new Date(m.match_date).getTime() - now > LOCK_MS &&
      m.home_team !== 'A definir' && m.away_team !== 'A definir' &&
      !/Loser|Winner/.test(m.home_team) && !/Loser|Winner/.test(m.away_team))
    .sort((a, b) => new Date(a.match_date) - new Date(b.match_date));
  if (!candidates.length) { el.innerHTML = ''; return; }
  const next = candidates[0];
  const ms = new Date(next.match_date).getTime() - now - LOCK_MS;
  el.innerHTML = `<div class="nbc${ms < 3600000 ? ' urgent' : ''}">
    <div>
      <div class="nbc-label">⚡ ${t('next_bet_title')} (${candidates.length})</div>
      <div class="nbc-match">${_flagMap[next.home_team]||''} ${tTeam(next.home_team)} × ${tTeam(next.away_team)} ${_flagMap[next.away_team]||''}</div>
      <div class="nbc-time">${t('next_bet_closes')} ${fmtCountdown(ms)}</div>
    </div>
    <button class="btn btn-primary btn-sm" onclick="scrollToMatch(${next.id})">${t('next_bet_btn')} →</button>
  </div>`;
}

function scrollToMatch(id) {
  if (statusFilter !== 'all') {
    statusFilter = 'all';
    document.querySelectorAll('#status-pills .pill').forEach(p => p.classList.remove('active'));
    document.querySelector('#status-pills .pill')?.classList.add('active');
  }
  stageFilter = 'all';
  buildStagePills();
  renderMatches();
  setTimeout(() => {
    const el = document.getElementById(`match-${id}`);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, 80);
}

function renderMatches() {
  const container = document.getElementById('matches-container');
  renderNextBetCard();
  let list = allMatches;
  if (statusFilter === 'upcoming') list = list.filter(m => m.status === 'upcoming');
  if (statusFilter === 'finished') list = list.filter(m => m.status === 'finished');
  if (stageFilter  !== 'all')      list = list.filter(m => m.stage === stageFilter);
  if (showUnbettedOnly && currentUser) {
    const LOCK_MS = 5 * 60 * 1000;
    list = list.filter(m => m.status === 'upcoming' && !userBets[m.id] && Date.now() < new Date(m.match_date).getTime() - LOCK_MS);
  }

  if (!list.length) {
    container.innerHTML = `<div class="empty"><span class="icon">⚽</span>${t('matches_empty')}</div>`;
    return;
  }

  if (viewMode === 'chronological') {
    container.innerHTML = renderSections(list, m => m.match_date.slice(0, 10), key => {
      const d = new Date(key + 'T12:00:00Z');
      const label = d.toLocaleDateString(dateLocale(), { weekday:'long', day:'2-digit', month:'long', timeZone:'Europe/Berlin' });
      const cap   = label.charAt(0).toUpperCase() + label.slice(1);
      return { name: cap, sub: null };
    });
  } else {
    container.innerHTML = renderSections(list, m => m.group_name ? `${m.stage}|||${m.group_name}` : m.stage, key => {
      const [stage, group] = key.split('|||');
      return group ? { name: `${t('standings_group')} ${group}`, sub: tStage(stage) } : { name: tStage(stage), sub: null };
    });
  }
  startCountdownTimer();
}

function renderSections(list, keyFn, labelFn) {
  const sections = {};
  list.forEach(m => {
    const k = keyFn(m);
    (sections[k] = sections[k] || []).push(m);
  });

  return Object.entries(sections).sort(([a], [b]) => stageRank(a) - stageRank(b) || a.localeCompare(b)).map(([key, matches]) => {
    const collapsed  = collapsedGroups.has(key);
    const { name, sub } = labelFn(key);

    const openCount  = matches.filter(m => m.status === 'upcoming' && Date.now() < new Date(m.match_date)).length;
    const doneCount  = matches.filter(m => m.status === 'finished').length;
    const myBets     = matches.filter(m => userBets[m.id] !== undefined).length;

    const teams = [...new Set(matches.flatMap(m => [m.home_team, m.away_team]))];

    const stats = [
      openCount > 0 ? `<span class="gstat gstat-open">${openCount} ${t('group_open')}</span>`    : '',
      doneCount > 0 ? `<span class="gstat gstat-done">${doneCount} ${t('group_done')}</span>` : '',
      myBets    > 0 ? `<span class="gstat gstat-bet">✓ ${myBets}</span>`              : '',
    ].filter(Boolean).join('');

    return `
      <div class="match-group">
        <button class="group-header" data-gkey="${key.replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/'/g,'&#39;')}">
          <span class="group-chevron ${collapsed ? '' : 'open'}">›</span>
          <div class="group-info">
            <span class="group-name">${name}</span>
            ${sub ? `<span class="group-sub">${sub}</span>` : ''}
            ${viewMode === 'grouped' && teams.length <= 8 ? `<span class="group-teams">${teams.join(' · ')}</span>` : ''}
          </div>
          <div class="group-stats">${stats}</div>
        </button>
        <div class="group-matches ${collapsed ? 'hidden' : ''}">
          ${matches.map(renderMatchCard).join('')}
        </div>
      </div>`;
  }).join('');
}

function fmtCountdown(ms) {
  if (ms <= 0) return null;
  const s = Math.floor(ms / 1000);
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (d > 0)  return `${d}d ${h}h`;
  if (h > 0)  return `${h}h ${String(m).padStart(2,'0')}m`;
  if (m > 0)  return `${m}m ${String(sec).padStart(2,'0')}s`;
  return `${sec}s`;
}

let _countdownTimer = null;
function startCountdownTimer() {
  if (_countdownTimer) return;
  _countdownTimer = setInterval(() => {
    const els = document.querySelectorAll('.match-countdown[data-ts]');
    if (!els.length) { clearInterval(_countdownTimer); _countdownTimer = null; return; }
    const now = Date.now();
    let anyExpired = false;
    els.forEach(el => {
      const remaining = Number(el.dataset.ts) - now;
      const label = fmtCountdown(remaining);
      if (label) {
        el.textContent = label;
        el.classList.toggle('countdown-urgent', remaining < 30 * 60 * 1000);
      } else {
        anyExpired = true;
      }
    });
    if (anyExpired) {
      clearInterval(_countdownTimer);
      _countdownTimer = null;
      renderMatches();
    }
  }, 1000);
}

function renderMatchCard(m) {
  const bet      = userBets[m.id];
  const finished = m.status === 'finished';
  const tbd      = !finished && (m.home_team === 'A definir' || m.away_team === 'A definir');
  const matchDate = new Date(m.match_date);
  const isPast   = Date.now() > matchDate.getTime() - 5 * 60 * 1000;
  const msLeft   = matchDate.getTime() - Date.now();
  const showCountdown = !finished && !tbd && msLeft > 0 && msLeft < 48 * 60 * 60 * 1000;

  const dateStr = matchDate.toLocaleDateString(dateLocale(), { day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit', timeZone:'Europe/Berlin' });

  let badge;
  if (finished)     badge = `<span class="badge badge-finished">${t('badge_finished')}</span>`;
  else if (tbd)     badge = `<span class="badge badge-tbd">${t('badge_tbd')}</span>`;
  else if (isPast)  badge = `<span class="badge badge-closed">${t('badge_closing')}</span>`;
  else              badge = `<span class="badge badge-open">${t('badge_open')}</span>`;

  const vsBlock = finished
    ? `<div class="vs-block"><div class="vs-scores"><div class="vs-box">${m.home_score}</div><span class="vs-sep">×</span><div class="vs-box">${m.away_score}</div></div></div>`
    : `<div class="vs-block"><span class="vs-label">VS</span></div>`;

  let betBar;
  if (tbd) {
    betBar = `<div class="bet-bar"><span class="no-bet-msg">${t('tbd_bet_msg')}</span></div>`;
  } else if (finished) {
    const pts = bet?.points ?? null;
    const { cls: chipClass, emoji } = pts == null ? { cls: 'pts-none', emoji: '' } : ptsMeta(pts);
    betBar = `<div class="bet-bar">
      ${bet
        ? `<div class="bet-result-row">
            <span class="bet-label">${t('bet_label')}</span>
            <span class="bet-prediction">${bet.home_score}×${bet.away_score}${bet.bet_winner ? ` · ${tTeam(bet.bet_winner === 'home' ? m.home_team : m.away_team)} pen` : ''}</span>
            <span class="pts-chip ${chipClass}">${pts} pt${pts!==1?'s':''}</span>
            <span>${emoji}</span>
           </div>`
        : `<span class="no-bet-msg">${t('no_bet_msg')}</span>`}
    </div>`;
  } else if (isPast) {
    betBar = `<div class="bet-bar"><span class="no-bet-msg">${t('bets_closed_no_bet')}${bet ? ` · ${t('bet_label')} <strong>${bet.home_score}×${bet.away_score}</strong>` : ''}</span></div>`;
  } else if (!currentUser) {
    betBar = `<div class="bet-bar"><span class="no-bet-msg"><a href="#" onclick="openUserModal();return false;">${t('login_to_bet_link')}</a> ${t('login_to_bet_suffix')}</span></div>`;
  } else {
    const hasBet = bet !== undefined;
    const isKnockout = !m.group_name;
    const showPen = isKnockout && hasBet && bet.home_score === bet.away_score;
    betBar = `<div class="bet-bar">
      <span class="bet-label">${t('bet_label')}</span>
      <div class="bet-inputs">
        <input type="number" class="bet-score-input" id="bh-${m.id}" min="0" max="20"
          value="${hasBet ? bet.home_score : ''}" placeholder="0"
          oninput="this.value=Math.min(20,Math.max(0,parseInt(this.value)||0));${isKnockout ? `toggleBetPen(${m.id});` : ''}"
          onblur="autoSaveBet(${m.id})" onkeydown="if(event.key==='Enter'){this.blur()}">
        <span class="bet-x">×</span>
        <input type="number" class="bet-score-input" id="ba-${m.id}" min="0" max="20"
          value="${hasBet ? bet.away_score : ''}" placeholder="0"
          oninput="this.value=Math.min(20,Math.max(0,parseInt(this.value)||0));${isKnockout ? `toggleBetPen(${m.id});` : ''}"
          onblur="autoSaveBet(${m.id})" onkeydown="if(event.key==='Enter'){this.blur()}">
        ${isKnockout ? `<select id="bp-${m.id}" class="bet-pen-select" title="Vencedor nos pênaltis" style="${showPen ? '' : 'display:none'}" onchange="autoSaveBet(${m.id})">
          <option value="">Pen?</option>
          <option value="home" ${hasBet && bet.bet_winner === 'home' ? 'selected' : ''}>${tTeam(m.home_team)}</option>
          <option value="away" ${hasBet && bet.bet_winner === 'away' ? 'selected' : ''}>${tTeam(m.away_team)}</option>
        </select>` : ''}
      </div>
      <span class="auto-bet-status" id="abs-${m.id}">${hasBet ? '✓' : ''}</span>
    </div>`;
  }

  // "Ver palpites" toggle — always shows scores regardless of bet window
  const toggleLabel = `${expandedBets.has(m.id) ? '▲' : '▼'} ${t('view_bets')} (${m.bet_count})`;
  const showAllBetsToggle = m.bet_count > 0
    ? `<button class="all-bets-toggle" onclick="toggleAllBets(${m.id}, this, false)">
        ${toggleLabel}
       </button>
       <div class="all-bets-section" id="all-bets-${m.id}" ${expandedBets.has(m.id)?'':'style="display:none"'}>
         ${renderAllBets(m.id, false)}
       </div>`
    : '';

  return `
    <div id="match-${m.id}" class="match-card ${finished?'finished':''} ${tbd?'tbd':''} ${bet!==undefined&&!finished?'has-bet':''} ${!finished&&!tbd&&!isPast&&bet===undefined&&currentUser?'needs-bet':''}">
      <div class="match-meta">
        <span>📅 ${dateStr}${m.venue ? ` · 📍 ${m.venue}` : ''}</span>
        ${badge}
        ${showCountdown ? `<span class="match-countdown ${msLeft < 30*60*1000 ? 'countdown-urgent' : ''}" data-ts="${matchDate.getTime()}">⏱ ${fmtCountdown(msLeft)}</span>` : ''}
      </div>
      <div class="match-teams">
        <div class="team home">
          <span class="t-name">${tTeam(m.home_team)}</span>
          <span class="t-flag">${_flagMap[m.home_team]||''}</span>
        </div>
        ${vsBlock}
        <div class="team away">
          <span class="t-flag">${_flagMap[m.away_team]||''}</span>
          <span class="t-name">${tTeam(m.away_team)}</span>
        </div>
      </div>
      ${betBar}
      ${showAllBetsToggle}
    </div>`;
}

function renderMatchBetStats(bets) {
  const n = bets.length;
  const homeWins = bets.filter(b => b.home_score > b.away_score).length;
  const draws    = bets.filter(b => b.home_score === b.away_score).length;
  const awayWins = bets.filter(b => b.home_score < b.away_score).length;
  const pHome = Math.round(homeWins / n * 100);
  const pDraw = Math.round(draws    / n * 100);
  const pAway = Math.round(awayWins / n * 100);

  const avgHome = (bets.reduce((s, b) => s + b.home_score, 0) / n).toFixed(1);
  const avgAway = (bets.reduce((s, b) => s + b.away_score, 0) / n).toFixed(1);

  const scoreCount = {};
  bets.forEach(b => { const k = `${b.home_score}×${b.away_score}`; scoreCount[k] = (scoreCount[k] || 0) + 1; });
  const topScore = Object.entries(scoreCount).sort((a, b) => b[1] - a[1])[0];

  const maxGoals = bets.reduce((m, b) => Math.max(m, b.home_score + b.away_score), 0);
  const bigGame  = bets.find(b => b.home_score + b.away_score === maxGoals);

  return `<div class="bet-stats-box">
    <div class="bet-stats-row">
      <span class="bsr-label">${t('bet_stats_trend')}</span>
      <div class="bsr-bar-wrap">
        <div class="bsr-seg bsr-home" style="width:${pHome}%">${pHome > 12 ? pHome + '%' : ''}</div>
        <div class="bsr-seg bsr-draw" style="width:${pDraw}%">${pDraw > 12 ? pDraw + '%' : ''}</div>
        <div class="bsr-seg bsr-away" style="width:${pAway}%">${pAway > 12 ? pAway + '%' : ''}</div>
      </div>
      <div class="bsr-legend">
        <span style="color:var(--green)">⬤ ${t('bet_stats_home')} ${pHome}%</span>
        <span style="color:var(--text-3)">⬤ ${t('bet_stats_draw')} ${pDraw}%</span>
        <span style="color:var(--red)">⬤ ${t('bet_stats_away')} ${pAway}%</span>
      </div>
    </div>
    <div class="bet-stats-pills">
      <div class="bsp-item"><span class="bsp-val">${avgHome} × ${avgAway}</span><span class="bsp-sub">${t('bet_stats_avg_goals')}</span></div>
      <div class="bsp-item"><span class="bsp-val">${topScore[0]}</span><span class="bsp-sub">${t('bet_stats_top_score')} (${topScore[1]}x)</span></div>
      <div class="bsp-item"><span class="bsp-val">${bigGame.home_score} × ${bigGame.away_score}</span><span class="bsp-sub">${t('bet_stats_biggest')}</span></div>
    </div>
  </div>`;
}

function renderAllBets(matchId, hideScores) {
  const bets = matchBetsCache[matchId];
  if (!bets) return `<div class="all-bets-list" style="color:var(--text-3);font-size:.8rem">${t('bets_loading')}</div>`;
  if (!bets.length) return `<div class="all-bets-list" style="color:var(--text-3);font-size:.8rem">${t('bets_none')}</div>`;
  if (hideScores) {
    const names = bets.map(b => `<span class="feed-chip"><span class="fc-name">${b.user_name}</span></span>`).join('');
    return `<div class="all-bets-list">${names}</div>`;
  }
  const chips = bets.map(b => {
    const cls = b.status === 'finished' ? ptsMeta(b.points).cls : '';
    return `<div class="feed-chip ${cls}">
      <span class="fc-name">${b.user_name}</span>
      <span class="fc-score">${b.home_score}×${b.away_score}</span>
      ${b.status==='finished'?`<span class="fc-pts">${b.points}pt</span>`:''}
    </div>`;
  }).join('');
  return renderMatchBetStats(bets) + `<div class="all-bets-list">${chips}</div>`;
}

async function toggleAllBets(matchId, btn, hideScores) {
  const match = allMatches.find(m => m.id === matchId);
  const count = match?.bet_count || '';
  if (expandedBets.has(matchId)) {
    expandedBets.delete(matchId);
    document.getElementById(`all-bets-${matchId}`).style.display = 'none';
    btn.innerHTML = `▼ ${t('view_bets')} (${count})`;
  } else {
    expandedBets.add(matchId);
    btn.innerHTML = `▲ ${t('view_bets')} (${count})`;
    if (!matchBetsCache[matchId]) {
      const bets = await api(`/api/bets?match_id=${matchId}`);
      matchBetsCache[matchId] = bets || [];
    }
    const section = document.getElementById(`all-bets-${matchId}`);
    section.innerHTML = renderAllBets(matchId, hideScores);
    section.style.display = 'block';
  }
}

function toggleBetPen(matchId) {
  const sel = document.getElementById(`bp-${matchId}`);
  if (!sel) return;
  const hs  = parseInt(document.getElementById(`bh-${matchId}`)?.value);
  const as_ = parseInt(document.getElementById(`ba-${matchId}`)?.value);
  const isDraw = !isNaN(hs) && !isNaN(as_) && hs === as_;
  sel.style.display = isDraw ? '' : 'none';
  if (!isDraw) sel.value = '';
}

async function saveBet(matchId) {
  if (!currentUser) { toast(t('toast_select_profile'), 'error'); return; }
  const hs  = parseInt(document.getElementById(`bh-${matchId}`).value);
  const as_ = parseInt(document.getElementById(`ba-${matchId}`).value);
  if (isNaN(hs) || isNaN(as_) || hs < 0 || as_ < 0) { toast(t('toast_fill_scores'), 'error'); return; }
  const penSel = document.getElementById(`bp-${matchId}`);
  const bet_winner = penSel?.value || null;
  const result = await api('/api/bets', 'POST', { user_id: currentUser.id, match_id: matchId, home_score: hs, away_score: as_, bet_winner });
  if (result.error) { toast(result.error, 'error'); return; }
  userBets[matchId] = result;
  toast(t('toast_bet_saved'), 'success');
  renderMatches();
  loadLeaderboard();
}

const _savingBets = new Set();

async function autoSaveBet(matchId) {
  if (!currentUser) return;
  if (_savingBets.has(matchId)) return;
  const hInput = document.getElementById(`bh-${matchId}`);
  const aInput = document.getElementById(`ba-${matchId}`);
  if (!hInput || !aInput) return;
  const hs  = parseInt(hInput.value);
  const as_ = parseInt(aInput.value);
  if (isNaN(hs) || isNaN(as_) || hs < 0 || as_ < 0) return;
  const penSel = document.getElementById(`bp-${matchId}`);
  const bet_winner = penSel?.value || null;
  const isNew = !userBets[matchId];
  const statusEl = document.getElementById(`abs-${matchId}`);
  if (statusEl) { statusEl.textContent = '…'; statusEl.className = 'auto-bet-status saving'; }
  _savingBets.add(matchId);
  const result = await api('/api/bets', 'POST', { user_id: currentUser.id, match_id: matchId, home_score: hs, away_score: as_, bet_winner });
  _savingBets.delete(matchId);
  if (result.error) {
    if (statusEl) { statusEl.textContent = '✗'; statusEl.className = 'auto-bet-status error'; }
    toast(result.error, 'error');
    if (result.error.includes('encerrad') || result.error.includes('encerrado')) loadMatches();
    return;
  }
  userBets[matchId] = result;
  if (isNew) {
    const m = allMatches.find(m => m.id === matchId);
    if (m) m.bet_count = (m.bet_count || 0) + 1;
  }
  if (statusEl) { statusEl.textContent = '✓'; statusEl.className = 'auto-bet-status saved'; }
  loadLeaderboard();
}

async function confirmClearBets() {
  if (!currentUser) return;
  if (!confirm(t('toast_clear_confirm'))) return;
  const result = await api('/api/bets', 'DELETE', { user_id: currentUser.id });
  if (result.error) { toast(result.error, 'error'); return; }
  const n = result.deleted;
  Object.keys(userBets).forEach(id => {
    const m = allMatches.find(m => m.id === Number(id));
    if (m && m.status === 'upcoming' && new Date(m.match_date) > new Date()) delete userBets[id];
  });
  toast(getCurrentLang() === 'en'
    ? `${n} bet${n !== 1 ? 's' : ''} deleted`
    : `${n} palpite${n !== 1 ? 's' : ''} apagado${n !== 1 ? 's' : ''}`, n > 0 ? 'success' : 'info');
  renderMatches();
  loadLeaderboard();
}

function randScore() {
  // Weighted distribution: most games are low-scoring
  const goals = [0,0,0,1,1,1,1,2,2,2,3,3,4];
  return goals[Math.floor(Math.random() * goals.length)];
}

let _randomizing = false;
async function randomizeBets() {
  if (!currentUser) { toast('Selecione seu perfil primeiro', 'error'); return; }
  if (_randomizing) return;
  _randomizing = true;
  const now = Date.now();
  const open = allMatches.filter(m =>
    m.status === 'upcoming' &&
    now < new Date(m.match_date).getTime() - 5 * 60 * 1000 &&
    m.home_team !== 'A definir' && m.away_team !== 'A definir' &&
    !userBets[m.id]
  );
  if (!open.length) { _randomizing = false; toast(t('toast_no_open'), 'info'); return; }

  // Fill inputs for visible matches and save all
  let saved = 0;
  for (const m of open) {
    const hs  = randScore();
    const as_ = randScore();
    const hInput = document.getElementById(`bh-${m.id}`);
    const aInput = document.getElementById(`ba-${m.id}`);
    if (hInput) hInput.value = hs;
    if (aInput) aInput.value = as_;
    const result = await api('/api/bets', 'POST', { user_id: currentUser.id, match_id: m.id, home_score: hs, away_score: as_ });
    if (!result.error) { userBets[m.id] = result; saved++; }
  }
  _randomizing = false;
  toast(getCurrentLang() === 'en'
    ? `${saved} random bet${saved !== 1 ? 's' : ''} saved! 🎲`
    : `${saved} palpite${saved !== 1 ? 's' : ''} aleatório${saved !== 1 ? 's' : ''} salvo${saved !== 1 ? 's' : ''}! 🎲`, 'success');
  renderMatches();
  loadLeaderboard();
}

