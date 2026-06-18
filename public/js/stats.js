/* ─── Detailed stats (Eu tab) ───────────────────────────────────────────── */
function computeDetailedStats(bets, matchMap) {
  const finished = bets
    .filter(b => matchMap[b.match_id]?.status === 'finished')
    .sort((a, b) => (matchMap[a.match_id]?.match_date || '').localeCompare(matchMap[b.match_id]?.match_date || ''));

  let currentStreak = 0, bestStreak = 0, temp = 0;
  for (const b of finished) {
    if (b.points > 0) { temp++; bestStreak = Math.max(bestStreak, temp); }
    else temp = 0;
  }
  for (let i = finished.length - 1; i >= 0; i--) {
    if (finished[i].points > 0) currentStreak++;
    else break;
  }

  const byStage = {};
  finished.forEach(b => {
    const m = matchMap[b.match_id];
    if (!m) return;
    if (!byStage[m.stage]) byStage[m.stage] = { pts: 0, count: 0, correct: 0, exact: 0 };
    byStage[m.stage].pts += b.points;
    byStage[m.stage].count++;
    if (b.points >= 1) byStage[m.stage].correct++;
    if (b.points === 3) byStage[m.stage].exact++;
  });

  let homeWins = 0, draws = 0, awayWins = 0;
  bets.forEach(b => {
    if (b.home_score > b.away_score) homeWins++;
    else if (b.home_score === b.away_score) draws++;
    else awayWins++;
  });

  const predGoals = finished.length > 0
    ? finished.reduce((s, b) => s + b.home_score + b.away_score, 0) / finished.length : 0;
  const realGoals = finished.length > 0
    ? finished.reduce((s, b) => { const m = matchMap[b.match_id]; return s + (m?.home_score||0) + (m?.away_score||0); }, 0) / finished.length : 0;
  const avgPts = finished.length > 0
    ? finished.reduce((s, b) => s + b.points, 0) / finished.length : 0;

  return { currentStreak, bestStreak, byStage, homeWins, draws, awayWins, predGoals, realGoals, avgPts, finishedCount: finished.length };
}

function renderDetailedStats(stats, el) {
  if (!el || !stats.finishedCount) { if (el) el.innerHTML = ''; return; }
  const { currentStreak, bestStreak, byStage, homeWins, draws, awayWins, predGoals, realGoals, avgPts, finishedCount } = stats;
  const total = homeWins + draws + awayWins;
  const pct = n => total > 0 ? Math.round(n / total * 100) : 0;

  const stageEntries = Object.entries(byStage);
  const maxPts = Math.max(1, ...stageEntries.map(([, v]) => v.pts));
  const stageBars = stageEntries.map(([stage, v]) => {
    const fillPct = Math.round(v.pts / maxPts * 100);
    const acc = v.count > 0 ? Math.round(v.correct / v.count * 100) : 0;
    const label = tStageShort(stage);
    return `<div class="stage-bar-item">
      <div class="stage-bar-label" title="${stage}">${label}</div>
      <div class="stage-bar-track"><div class="stage-bar-fill" style="width:${fillPct}%"></div></div>
      <div class="stage-bar-value">${v.pts}pt<span class="stage-bar-acc">${acc}%</span></div>
    </div>`;
  }).join('');

  const MAX_H = 72;
  const styleBar = (n, cls) => {
    const h = total > 0 ? Math.max(4, Math.round(n / total * MAX_H)) : 4;
    return `<div class="bet-style-bar ${cls}" style="height:${h}px"></div>`;
  };

  const goalDiff = predGoals - realGoals;
  const goalDiffLabel = goalDiff > 0.1 ? `+${goalDiff.toFixed(1)} ${t('dstat_above_avg')}` : goalDiff < -0.1 ? `${goalDiff.toFixed(1)} ${t('dstat_below_avg')}` : t('dstat_on_avg');

  el.innerHTML = `
    <div class="section-divider"><span data-i18n="div_stats">${t('div_stats')}</span></div>
    <div class="dstats-grid">
      <div class="dstat-card">
        <div class="dstat-title">${t('dstat_streak_title')}</div>
        <div class="dstat-val${currentStreak >= 3 ? ' hot' : ''}">${currentStreak}</div>
        <div class="dstat-sub">${t('dstat_streak_best')} ${bestStreak}</div>
      </div>
      <div class="dstat-card">
        <div class="dstat-title">${t('dstat_avg_title')}</div>
        <div class="dstat-val">${avgPts.toFixed(2)}</div>
        <div class="dstat-sub">${t('dstat_avg_sub')}</div>
      </div>
      <div class="dstat-card">
        <div class="dstat-title">${t('dstat_goals_title')}</div>
        <div class="dstat-val">${predGoals.toFixed(1)}</div>
        <div class="dstat-sub">${t('dstat_goals_real')} ${realGoals.toFixed(1)} · ${goalDiffLabel}</div>
      </div>
      <div class="dstat-card">
        <div class="dstat-title">${t('dstat_analyzed_title')}</div>
        <div class="dstat-val">${finishedCount}</div>
        <div class="dstat-sub">${t('dstat_analyzed_sub')}</div>
      </div>
    </div>
    ${stageEntries.length ? `<div class="dstat-section-card"><div class="dstat-section-title">${t('dstat_by_stage')}</div><div class="stage-bars">${stageBars}</div></div>` : ''}
    ${total > 0 ? `
    <div class="dstat-section-card">
      <div class="dstat-section-title">${t('dstat_style')}</div>
      <div class="bet-style-row">
        <div class="bet-style-item">
          <div class="bet-style-pct">${pct(homeWins)}%</div>
          <div class="bet-style-bar-wrap">${styleBar(homeWins, 'home')}</div>
          <div class="bet-style-label">${t('dstat_home')}</div>
          <div class="bet-style-n">${homeWins}</div>
        </div>
        <div class="bet-style-item">
          <div class="bet-style-pct">${pct(draws)}%</div>
          <div class="bet-style-bar-wrap">${styleBar(draws, 'draw')}</div>
          <div class="bet-style-label">${t('dstat_draw')}</div>
          <div class="bet-style-n">${draws}</div>
        </div>
        <div class="bet-style-item">
          <div class="bet-style-pct">${pct(awayWins)}%</div>
          <div class="bet-style-bar-wrap">${styleBar(awayWins, 'away')}</div>
          <div class="bet-style-label">${t('dstat_away')}</div>
          <div class="bet-style-n">${awayWins}</div>
        </div>
      </div>
    </div>` : ''}`;
}

/* ─── Group awards ───────────────────────────────────────────────────────── */
async function loadGroupAwards() {
  const awards = await api('/api/awards');
  renderGroupAwards(awards);
}

function renderGroupAwards(awards) {
  const el = document.getElementById('awards-container');
  const divider = document.getElementById('awards-divider');
  if (!el) return;
  if (!awards) {
    el.innerHTML = '';
    if (divider) divider.classList.add('hidden');
    return;
  }
  if (divider) divider.classList.remove('hidden');

  const card = (emoji, title, award, valueFn, subFn) => {
    if (!award) return `<div class="award-card award-empty"><div class="award-emoji">${emoji}</div><div class="award-title">${title}</div><div class="award-empty-msg">${t('award_no_data')}</div></div>`;
    return `<div class="award-card" onclick="openPlayerModal(${award.id},'${award.name.replace(/'/g,"&#39;")}')" style="cursor:pointer">
      <div class="award-emoji">${emoji}</div>
      <div class="award-title">${title}</div>
      <div class="award-winner-row">${avatarHtml(award.name, award.id, 26)}<div class="award-winner">${award.name}</div></div>
      <div class="award-value">${valueFn(award)}</div>
      ${subFn ? `<div class="award-sub">${subFn(award)}</div>` : ''}
    </div>`;
  };

  el.innerHTML = `<div class="awards-grid">
    ${card('🎯', t('award_exact_king'), awards.rei_exato,
      a => `${a.exactScores} ${getCurrentLang()==='en'?'exact':'exato'+( a.exactScores!==1?'s':'')}`,
      a => `${getCurrentLang()==='en'?'in':'em'} ${a.finishedCount} ${getCurrentLang()==='en'?'games':'jogos'}`)}
    ${card('🔥', t('award_streak'), awards.maior_streak,
      a => `${a.currentStreak || a.bestStreak} ${getCurrentLang()==='en'?'in a row':'seguidos'}`,
      a => a.currentStreak > 0 ? t('award_active_streak') : `${t('award_best_streak')} ${a.bestStreak}`)}
    ${card('💪', t('award_consistent'), awards.mais_consistente,
      a => `${Math.round(a.accuracy*100)}%`,
      a => `${t('award_min_games')} ${a.finishedCount} ${t('award_analyzed')}`)}
    ${card('📉', t('award_bad_run'), awards.pior_fase,
      a => `${a._neg} ${getCurrentLang()==='en'?(a._neg!==1?'misses':'miss'):'erro'+(a._neg!==1?'s':'')} ${getCurrentLang()==='en'?'in a row':'seguidos'}`,
      a => a.negStreak > 0 ? t('award_bad_run_active') : t('award_bad_run_worst'))}
  </div>`;
}

/* ─── Match difficulty ───────────────────────────────────────────────────── */
async function loadMatchDifficulty() {
  const el = document.getElementById('difficulty-container');
  if (!el) return;
  _diffStats = await api('/api/match-stats');
  renderMatchDifficulty(_diffStats);
}

function setDiffStage(stage) {
  _diffStageFilter = stage;
  renderMatchDifficulty(_diffStats);
}

function renderMatchDifficulty(stats) {
  const el = document.getElementById('difficulty-container');
  if (!el) return;
  if (!stats || stats.length === 0) {
    el.innerHTML = `<div class="empty" style="padding:16px 20px"><span class="icon">🎲</span>${t('diff_empty')}</div>`;
    return;
  }

  // Group by stage, preserving global sort order (hardest first within each stage)
  const byStage = {};
  stats.forEach(m => {
    if (!byStage[m.stage]) byStage[m.stage] = [];
    byStage[m.stage].push(m);
  });

  const stageOrder = Object.keys(byStage).sort((a, b) => stageRank(a) - stageRank(b));

  // Validate filter still has data (e.g. after a reload)
  if (_diffStageFilter && !byStage[_diffStageFilter]) _diffStageFilter = null;

  const pills = [
    `<button class="pill${_diffStageFilter === null ? ' active' : ''}" onclick="setDiffStage(null)">${t('lb_general')}</button>`,
    ...stageOrder.map(s =>
      `<button class="pill${_diffStageFilter === s ? ' active' : ''}" onclick="setDiffStage('${s.replace(/'/g,"&#39;")}')">${tStage(s)}</button>`)
  ].join('');

  function diffClass(correctPct) {
    return correctPct < 0.34 ? 'hard' : correctPct < 0.67 ? 'mid' : 'easy';
  }

  function matchRow(m) {
    const correctPct = Math.round(m.correctPct * 100);
    const exactPct   = Math.round(m.exactPct   * 100);
    const flag = `${_flagMap[m.home_team]||''} ${tTeam(m.home_team)} ${m.home_score}×${m.away_score} ${tTeam(m.away_team)} ${_flagMap[m.away_team]||''}`;
    return `<div class="diff-row diff-${diffClass(m.correctPct)}">
      <div class="diff-match">${flag}</div>
      <div class="diff-bars">
        <div class="diff-bar-wrap" title="${correctPct}% ${t('diff_correct')}">
          <div class="diff-bar-fill diff-bar-correct" style="width:${correctPct}%"></div>
          <span class="diff-bar-label">${correctPct}%</span>
        </div>
        <div class="diff-bar-wrap" title="${exactPct}% ${t('diff_exact')}">
          <div class="diff-bar-fill diff-bar-exact" style="width:${exactPct}%"></div>
          <span class="diff-bar-label diff-label-exact">${exactPct}% 🎯</span>
        </div>
      </div>
      <div class="diff-total">${m.total} ${t('diff_bets')}</div>
    </div>`;
  }

  const activeSections = _diffStageFilter ? [_diffStageFilter] : stageOrder;
  const sections = activeSections.map(stage => {
    const top5 = byStage[stage].slice(0, 5);
    return (_diffStageFilter ? '' : `<div class="diff-stage-label">${tStage(stage)}</div>`) +
      `<div class="diff-list">${top5.map(matchRow).join('')}</div>`;
  }).join('');

  el.innerHTML = `<div class="filter-group" style="padding:8px 12px 0">${pills}</div>
  <div class="diff-legend">
    <span class="diff-legend-item hard">${t('diff_hardest')}</span>
    <span class="diff-legend-item easy">${t('diff_easiest')}</span>
    <span style="color:var(--text-3);font-size:.72rem;margin-left:auto">${t('diff_sorted')}</span>
  </div>
  ${sections}`;
}

/* ─── My page ────────────────────────────────────────────────────────────── */
async function loadMyPage() {
  const noUser  = document.getElementById('me-no-user');
  const content = document.getElementById('me-content');

  if (!currentUser) {
    noUser.classList.remove('hidden');
    content.classList.add('hidden');
    return;
  }
  noUser.classList.add('hidden');
  content.classList.remove('hidden');

  const [leaderboard, bets, special] = await Promise.all([
    api('/api/leaderboard'),
    api(`/api/bets?user_id=${currentUser.id}`),
    api('/api/special-bets'),
  ]);

  const me = (leaderboard || []).find(p => p.id === currentUser.id) || {};

  const myRank = (leaderboard || []).findIndex(p => p.id === currentUser.id) + 1;

  // Header
  document.getElementById('me-header').innerHTML = `
    ${avatarHtml(currentUser.name, currentUser.id, 56)}
    <div style="flex:1;min-width:0">
      <div class="me-name">${currentUser.name}</div>
      <div style="color:var(--text-3);font-size:.8rem;margin-top:2px">#${myRank || '—'} · ${me.total_bets||0} ${(me.total_bets||0)!==1?t('lb_bets_n'):t('lb_bets_1')}</div>
    </div>
    <div style="text-align:right;flex-shrink:0">
      <div class="me-pts">${me.total_points||0}</div>
      <div class="me-pts-label">${t('me_pts')}</div>
    </div>`;

  // Stats
  const total     = me.total_bets || 0;
  const finished  = (bets||[]).filter(b => b.status === 'finished').length;
  const accuracy  = finished > 0 ? Math.round(((me.exact_scores||0) + (me.correct_results||0)) / finished * 100) : 0;
  document.getElementById('me-stats').innerHTML = `
    <div class="me-stat-card"><div class="me-stat-val" style="color:var(--gold)">${me.total_points||0}</div><div class="me-stat-label">${t('lb_col_pts')}</div></div>
    <div class="me-stat-card"><div class="me-stat-val" style="color:var(--green)">${me.exact_scores||0}</div><div class="me-stat-label">${t('me_exact')}</div></div>
    <div class="me-stat-card"><div class="me-stat-val" style="color:var(--blue)">${me.correct_results||0}</div><div class="me-stat-label">${t('me_results')}</div></div>
    <div class="me-stat-card"><div class="me-stat-val">${accuracy}%</div><div class="me-stat-label">${t('me_accuracy')}</div></div>`;

  // Special bets section
  const champBet  = (special?.champion_bets  || []).find(b => b.user_id === currentUser.id);
  const scorerBet = (special?.scorer_bets    || []).find(b => b.user_id === currentUser.id);
  const isOpen    = special?.special_bets_open;
  const champResult  = special?.champion;
  const scorerResult = special?.top_scorer;

  const champWon  = champResult  && champBet  && champBet.team.toLowerCase()  === champResult.toLowerCase();
  const scorerWon = scorerResult && scorerBet && scorerBet.name.toLowerCase() === scorerResult.toLowerCase();

  document.getElementById('me-special').innerHTML = `
    <div class="special-card">
      <div class="special-card-title">${t('me_champ_title')}</div>
      ${champResult ? (champWon ? `<div class="special-card-result">${t('me_correct', {pts:10})}</div>` : `<div class="special-card-closed">${t('me_wrong', {val:tTeam(champResult)})}</div>`) : ''}
      ${champBet
        ? `<div style="font-weight:700;margin-bottom:${isOpen&&!champResult?'8':'0'}px">${tTeam(champBet.team)}</div>`
        : `<div style="color:var(--text-3);font-size:.85rem;margin-bottom:${isOpen?'8':'0'}px">${t('me_no_bet_placed')}</div>`}
      ${isOpen && !champResult ? `
        <div class="special-input-row">
          ${renderChampionPicker(champBet?.team||'')}
          <button class="btn btn-primary btn-sm" onclick="saveMyChamp()">${getCurrentLang()==='en'?'Save':'Salvar'}</button>
        </div>` : ''}
    </div>
    <div class="special-card">
      <div class="special-card-title">${t('me_scorer_title')}</div>
      ${scorerResult ? (scorerWon ? `<div class="special-card-result">${t('me_correct', {pts:5})}</div>` : `<div class="special-card-closed">${t('me_wrong', {val:scorerResult})}</div>`) : ''}
      ${scorerBet
        ? `<div style="font-weight:700;margin-bottom:${isOpen&&!scorerResult?'8':'0'}px">${scorerBet.name}</div>`
        : `<div style="color:var(--text-3);font-size:.85rem;margin-bottom:${isOpen?'8':'0'}px">${t('me_no_bet_placed')}</div>`}
      ${isOpen && !scorerResult ? `
        <div class="special-input-row">
          <input type="text" class="input" id="my-scorer-input" placeholder="${t('me_scorer_placeholder')}" value="${scorerBet?.name||''}">
          <button class="btn btn-primary btn-sm" onclick="saveMyScorer()">${getCurrentLang()==='en'?'Save':'Salvar'}</button>
        </div>` : ''}
    </div>`;

  // Detailed stats
  const matchMap = Object.fromEntries(allMatches.map(m => [m.id, m]));
  const dstats = computeDetailedStats(bets || [], matchMap);
  renderDetailedStats(dstats, document.getElementById('me-detailed-stats'));
  renderTeamStats(bets || [], matchMap, document.getElementById('me-team-stats'));

  // My bets list
  const sorted = (bets||[]).slice().sort((a, b) => {
    const ma = allMatches.find(m => m.id === a.match_id);
    const mb = allMatches.find(m => m.id === b.match_id);
    return (ma?.match_date||'').localeCompare(mb?.match_date||'');
  });
  document.getElementById('me-bets').innerHTML = sorted.length ? sorted.map(b => {
    const match = allMatches.find(m => m.id === b.match_id);
    const finished = b.status === 'finished';
    const chipClass = b.points === 3 ? 'pts-3' : b.points === 1 ? 'pts-1' : finished ? 'pts-0' : 'pts-none';
    const chipLabel = finished ? `${b.points} pt${b.points!==1?'s':''}` : '—';
    return `<div class="me-bet-item">
      <div style="flex:1;min-width:140px">
        <div class="me-bet-match">${match?.home_team||'?'} × ${match?.away_team||'?'}</div>
        <div class="me-bet-date">${match ? fmtDate(match.match_date) : ''} · ${match?.stage||''}</div>
      </div>
      <div class="me-bet-score">${t('me_bet_label')} <span class="me-bet-result-score">${b.home_score}×${b.away_score}</span></div>
      ${finished && match ? `<div class="me-bet-score">${t('me_score_label')} <span class="me-bet-result-score">${match.home_score}×${match.away_score}</span></div>` : ''}
      <span class="pts-chip ${chipClass}">${chipLabel}</span>
    </div>`;
  }).join('') : `<div class="empty" style="padding:24px 0"><span class="icon">🎲</span>${t('me_no_bets')}</div>`;
}

async function saveMyChamp() {
  if (!currentUser) return;
  const team = _champPickerSelected;
  if (!team) { toast(t('toast_choose_team'), 'error'); return; }
  const res = await api('/api/champion-bet', 'POST', { user_id: currentUser.id, team });
  if (res.error) { toast(res.error, 'error'); return; }
  toast(t('toast_champ_saved'), 'success');
  loadMyPage();
  loadSpecialAndFeed();
}

async function saveMyScorer() {
  if (!currentUser) return;
  const name = document.getElementById('my-scorer-input')?.value.trim();
  if (!name) { toast(t('toast_fill_player'), 'error'); return; }
  const res = await api('/api/scorer-bet', 'POST', { user_id: currentUser.id, name });
  if (res.error) { toast(res.error, 'error'); return; }
  toast(t('toast_scorer_saved'), 'success');
  loadMyPage();
  loadSpecialAndFeed();
}

