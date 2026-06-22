/* ─── Leaderboard ────────────────────────────────────────────────────────── */
async function loadLeaderboard() {
  const url  = '/api/leaderboard' + (lbStageFilter ? '?stage=' + encodeURIComponent(lbStageFilter) : '');
  const data = await api(url) || [];
  const wrap = document.getElementById('lb-container');

  // Build stage pills from finished matches
  const pillsWrap = document.getElementById('lb-stage-pills');
  if (pillsWrap) {
    const stagesWithFinished = [...new Set(
      allMatches.filter(m => m.status === 'finished').map(m => m.stage).filter(Boolean)
    )];
    const pills = [
      `<button class="pill${lbStageFilter === null ? ' active' : ''}" onclick="setLbStage(null, this)">${t('lb_general')}</button>`,
      ...stagesWithFinished.map(s =>
        `<button class="pill${lbStageFilter === s ? ' active' : ''}" onclick="setLbStage('${s.replace(/'/g,"&#39;")}', this)">${tStage(s)}</button>`
      ),
    ].join('');
    pillsWrap.innerHTML = `<div class="filter-group">${pills}</div>`;
  }

  // Show/hide history, difficulty, and special-grid sections based on stage filter
  const historyDiv      = document.getElementById('history-container');
  const historyDivider  = document.getElementById('history-divider');
  const difficultyDiv   = document.getElementById('difficulty-container');
  const difficultyDiv2  = document.getElementById('difficulty-divider');
  const specialGrid     = document.getElementById('special-grid');
  const specialDivider  = document.getElementById('special-divider');
  const hide = lbStageFilter ? 'none' : '';
  [historyDiv, historyDivider, difficultyDiv, difficultyDiv2, specialGrid, specialDivider]
    .forEach(el => { if (el) el.style.display = hide; });

  if (!lbStageFilter) loadMatchDifficulty();
  applyCollapsedSections();

  if (!data.length) {
    wrap.innerHTML = `<div class="empty"><span class="icon">🏆</span>${t('lb_empty')}</div>`;
    return;
  }
  const rankEmoji = ['🥇','🥈','🥉'];
  const rankClass = ['r1','r2','r3'];
  const _today = new Date().toISOString().slice(0, 10);
  const _stored = JSON.parse(localStorage.getItem('bolao_ranks_v2') || 'null');
  // reference = yesterday's ranks (prev); if same day just use stored.prev, otherwise stored.ranks
  const prevRanks = _stored ? (_stored.date === _today ? (_stored.prev || {}) : (_stored.ranks || {})) : {};
  wrap.innerHTML = `
    <div class="lb-table">
      <div class="lb-header">
        <div>#</div><div>${t('lb_col_player')}</div><div style="text-align:right">${t('lb_col_pts')}</div>
        <div style="text-align:center">🎯</div><div style="text-align:center">⚖️</div><div style="text-align:center">✅</div>
      </div>
      ${data.map((p, i) => {
        const prev = prevRanks[p.id];
        const delta = prev != null ? prev - (i + 1) : null;
        const movBadge = !delta ? '' :
          delta > 0 ? `<span class="rank-move up">▲${delta}</span>` :
                      `<span class="rank-move down">▼${Math.abs(delta)}</span>`;
        return `
        <div class="lb-row ${currentUser?.id === p.id ? 'is-me' : ''}" onclick="openPlayerModal(${p.id},'${p.name.replace(/'/g,"&#39;")}')" style="cursor:pointer">
          <div class="lb-rank ${rankClass[i]||''}">${rankEmoji[i]||(i+1)}${movBadge}</div>
          <div style="display:flex;align-items:center;gap:8px;min-width:0">
            ${avatarHtml(p.name, p.id, 32)}
            <div style="min-width:0">
              <div class="lb-name" style="display:flex;align-items:center;gap:6px">${p.name}${currentUser?.id === p.id ? `<span class="lb-me-badge">${t('lb_me')}</span>` : ''}</div>
              <div class="lb-bets">${p.total_bets} ${p.total_bets!==1?t('lb_bets_n'):t('lb_bets_1')}</div>
            </div>
          </div>
          <div class="lb-pts">${p.total_points}</div>
          <div class="lb-stat">${p.exact_scores}</div>
          <div class="lb-stat">${p.diff_scores}</div>
          <div class="lb-stat">${p.correct_results}</div>
        </div>`;
      }).join('')}
    </div>
    <div style="text-align:center;margin-top:10px">
      <button class="btn btn-ghost btn-sm" onclick="shareLeaderboard()" style="font-size:.78rem">📋 ${t('share_lb')}</button>
    </div>`;
  // Save current ranks for movement tracking (only rotate once per day)
  const currentRanks = {};
  data.forEach((p, i) => { currentRanks[p.id] = i + 1; });
  if (!_stored || _stored.date !== _today) {
    localStorage.setItem('bolao_ranks_v2', JSON.stringify({
      date: _today, ranks: currentRanks, prev: _stored?.ranks || {}
    }));
  }
}

function setLbStage(stage) {
  lbStageFilter = stage;
  loadLeaderboard();
}

async function shareLeaderboard() {
  const data = await api('/api/leaderboard' + (lbStageFilter ? '?stage=' + encodeURIComponent(lbStageFilter) : ''));
  if (!data?.length) return;
  const stageLabel = lbStageFilter ? ` (${tStage(lbStageFilter)})` : '';
  const header = getCurrentLang() === 'en'
    ? `🏆 Pool Standings${stageLabel}\n`
    : `🏆 Bolão - Classificação${stageLabel}\n`;
  const rows = data.map((p, i) => {
    const rank = ['🥇','🥈','🥉'][i] || `${i+1}º`;
    return `${rank} ${p.name} — ${p.total_points}pts (🎯${p.exact_scores} ⚖️${p.diff_scores} ✅${p.correct_results})`;
  }).join('\n');
  try {
    await navigator.clipboard.writeText(header + rows);
    toast(t('share_copied'), 'success');
  } catch {
    toast(header + rows, 'info');
  }
}

function renderTeamStats(bets, matchMap, el) {
  if (!el) return;
  const finished = bets.filter(b => matchMap[b.match_id]?.status === 'finished');
  if (finished.length < 3) { el.innerHTML = ''; return; }

  const teamMap = {};
  finished.forEach(b => {
    const m = matchMap[b.match_id];
    if (!m) return;
    [m.home_team, m.away_team].forEach(team => {
      if (!teamMap[team]) teamMap[team] = { team, games: 0, correct: 0, exact: 0 };
      teamMap[team].games++;
      if (b.points > 0) teamMap[team].correct++;
      if (b.points === 4) teamMap[team].exact++;
    });
  });

  const stats = Object.values(teamMap)
    .filter(s => s.games >= 2)
    .map(s => ({ ...s, acc: s.correct / s.games }))
    .sort((a, b) => b.acc - a.acc);

  if (!stats.length) { el.innerHTML = ''; return; }

  const best  = stats.slice(0, 3);
  const worst = [...stats].reverse().slice(0, 3);

  const row = s => {
    const pct = Math.round(s.acc * 100);
    return `<div class="team-stat-row">
      <span class="team-stat-flag">${_flagMap[s.team]||''}</span>
      <span class="team-stat-name">${tTeam(s.team)}</span>
      <div class="team-stat-bar-wrap"><div class="team-stat-bar-fill" style="width:${pct}%"></div></div>
      <span class="team-stat-pct">${pct}%</span>
    </div>`;
  };

  const showWorst = worst[0]?.team !== best[best.length-1]?.team;
  el.innerHTML = `
    <div class="section-divider"><span>${t('team_stats_title')}</span></div>
    <div class="team-stats-grid">
      <div>
        <div class="team-stats-label">✅ ${t('team_stats_best')}</div>
        ${best.map(row).join('')}
      </div>
      ${showWorst ? `<div>
        <div class="team-stats-label">❌ ${t('team_stats_worst')}</div>
        ${worst.map(row).join('')}
      </div>` : ''}
    </div>`;
}

