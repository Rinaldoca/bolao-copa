/* ─── Times da Copa 2026 ─────────────────────────────────────────────────── */
const WC2026_TEAMS = [
  {f:'🇲🇽',n:'México'},      {f:'🇿🇦',n:'África do Sul'}, {f:'🇰🇷',n:'Coreia do Sul'},{f:'🇨🇿',n:'Tchéquia'},
  {f:'🇨🇦',n:'Canadá'},      {f:'🇧🇦',n:'Bósnia'},         {f:'🇶🇦',n:'Catar'},         {f:'🇨🇭',n:'Suíça'},
  {f:'🇧🇷',n:'Brasil'},      {f:'🇲🇦',n:'Marrocos'},       {f:'🇭🇹',n:'Haiti'},         {f:'🏴󠁧󠁢󠁳󠁣󠁴󠁿',n:'Escócia'},
  {f:'🇺🇸',n:'EUA'},         {f:'🇵🇾',n:'Paraguai'},       {f:'🇦🇺',n:'Austrália'},     {f:'🇹🇷',n:'Turquia'},
  {f:'🇩🇪',n:'Alemanha'},    {f:'🇨🇼',n:'Curaçao'},        {f:'🇨🇮',n:'Costa do Marfim'},{f:'🇪🇨',n:'Equador'},
  {f:'🇳🇱',n:'Holanda'},     {f:'🇯🇵',n:'Japão'},          {f:'🇸🇪',n:'Suécia'},        {f:'🇹🇳',n:'Tunísia'},
  {f:'🇧🇪',n:'Bélgica'},     {f:'🇪🇬',n:'Egito'},          {f:'🇮🇷',n:'Irã'},           {f:'🇳🇿',n:'Nova Zelândia'},
  {f:'🇪🇸',n:'Espanha'},     {f:'🇨🇻',n:'Cabo Verde'},     {f:'🇸🇦',n:'Arábia Saudita'},{f:'🇺🇾',n:'Uruguai'},
  {f:'🇫🇷',n:'França'},      {f:'🇸🇳',n:'Senegal'},        {f:'🇮🇶',n:'Iraque'},        {f:'🇳🇴',n:'Noruega'},
  {f:'🇦🇷',n:'Argentina'},   {f:'🇩🇿',n:'Argélia'},        {f:'🇦🇹',n:'Áustria'},       {f:'🇯🇴',n:'Jordânia'},
  {f:'🇵🇹',n:'Portugal'},    {f:'🇨🇩',n:'Congo RD'},       {f:'🇺🇿',n:'Uzbequistão'},   {f:'🇨🇴',n:'Colômbia'},
  {f:'🏴󠁧󠁢󠁥󠁮󠁧󠁿',n:'Inglaterra'},{f:'🇭🇷',n:'Croácia'},       {f:'🇬🇭',n:'Gana'},          {f:'🇵🇦',n:'Panamá'},
].sort((a, b) => a.n.localeCompare(b.n, 'pt'));

const _flagMap = Object.fromEntries(WC2026_TEAMS.map(t => [t.n, t.f]));
function flag(name) { return _flagMap[name] ? `<span class="team-flag">${_flagMap[name]}</span>` : ''; }

let _champPickerSelected = null;

function renderChampionPicker(currentValue) {
  _champPickerSelected = currentValue || null;
  const team = currentValue ? WC2026_TEAMS.find(t => t.n === currentValue) : null;
  return `
    <div class="cp-wrap" id="cp-wrap">
      <button type="button" class="cp-btn" id="cp-btn" onclick="cpToggle(event)">
        <span class="cp-value" id="cp-value">
          ${team ? `<span class="cp-flag">${team.f}</span><span>${team.n}</span>` : `<span class="cp-placeholder">${t('cp_placeholder')}</span>`}
        </span>
        <span class="cp-arrow" id="cp-arrow">▾</span>
      </button>
      <div class="cp-dropdown hidden" id="cp-dropdown">
        <div class="cp-search-wrap">
          <input class="cp-search" id="cp-search" type="text" placeholder="${t('cp_search')}" oninput="cpFilter(this.value)" autocomplete="off">
        </div>
        <div class="cp-list" id="cp-list">
          ${WC2026_TEAMS.map(t => `
            <div class="cp-item ${currentValue===t.n?'cp-selected':''}" data-name="${t.n}" onclick="cpSelect('${t.n.replace(/'/g,"&#39;")}')">
              <span class="cp-flag">${t.f}</span>
              <span class="cp-name">${t.n}</span>
              ${currentValue===t.n?'<span class="cp-check">✓</span>':''}
            </div>`).join('')}
        </div>
      </div>
    </div>`;
}

function cpToggle(e) {
  e.stopPropagation();
  const dd = document.getElementById('cp-dropdown');
  const arrow = document.getElementById('cp-arrow');
  const isOpen = !dd.classList.contains('hidden');
  dd.classList.toggle('hidden');
  arrow.style.transform = isOpen ? '' : 'rotate(180deg)';
  if (!isOpen) setTimeout(() => document.getElementById('cp-search')?.focus(), 50);
}

function cpFilter(q) {
  const lq = q.toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '');
  document.querySelectorAll('.cp-item').forEach(el => {
    const name = el.dataset.name.toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '');
    el.style.display = name.includes(lq) ? '' : 'none';
  });
}

function cpSelect(name) {
  _champPickerSelected = name;
  const team = WC2026_TEAMS.find(t => t.n === name);
  const valueEl = document.getElementById('cp-value');
  if (valueEl && team) valueEl.innerHTML = `<span class="cp-flag">${team.f}</span><span>${team.n}</span>`;
  document.querySelectorAll('.cp-item').forEach(el => {
    const sel = el.dataset.name === name;
    el.classList.toggle('cp-selected', sel);
    const existing = el.querySelector('.cp-check');
    if (existing) existing.remove();
    if (sel) el.insertAdjacentHTML('beforeend', '<span class="cp-check">✓</span>');
  });
  const dd = document.getElementById('cp-dropdown');
  dd?.classList.add('hidden');
  document.getElementById('cp-arrow').style.transform = '';
}

document.addEventListener('click', e => {
  if (!e.target.closest('#cp-wrap')) {
    document.getElementById('cp-dropdown')?.classList.add('hidden');
    const arrow = document.getElementById('cp-arrow');
    if (arrow) arrow.style.transform = '';
  }
});

/* ─── State ──────────────────────────────────────────────────────────────── */
let currentUser    = null;
let allMatches     = [];
let userBets       = {};
let matchBetsCache = {};
let expandedBets   = new Set();
let statusFilter      = 'all';
let stageFilter       = 'all';
let showUnbettedOnly  = false;
let lbStageFilter  = null;
let viewMode       = localStorage.getItem('bolao_viewmode') || 'grouped';
let collapsedGroups = new Set(JSON.parse(localStorage.getItem('bolao_collapsed') || '[]'));
let adminPwd       = null;
let editingMatchId = null;

/* ─── Bootstrap ──────────────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  try {
    const saved = localStorage.getItem('bolao_user');
    if (saved) setUser(JSON.parse(saved), false);
  } catch {}
  loadAll();
  // Delegated handler for group collapse buttons (avoids inline-onclick quoting issues)
  document.getElementById('matches-container').addEventListener('click', e => {
    const btn = e.target.closest('.group-header');
    if (btn && btn.dataset.gkey !== undefined) toggleGroup(btn.dataset.gkey);
  });
});

async function loadAll() {
  // Verify saved user still exists in DB (handles DB resets after redeploys)
  if (currentUser) {
    const users = await api('/api/users') || [];
    const stillExists = users.find(u => u.id === currentUser.id && u.name === currentUser.name);
    if (!stillExists) {
      currentUser = null;
      localStorage.removeItem('bolao_user');
      document.getElementById('userBtnIcon').textContent = '👤';
      document.getElementById('userBtnText').textContent = 'Entrar';
      document.getElementById('userBtn').classList.remove('logged-in');
      toast(t('toast_expired'), 'info');
    }
  }
  await Promise.all([loadLeaderboard(), loadMatches()]);
  loadSpecialAndFeed();
}

/* ─── API ────────────────────────────────────────────────────────────────── */
async function api(url, method = 'GET', body = null) {
  try {
    const opts = { method, headers: { 'Content-Type': 'application/json' } };
    if (body) opts.body = JSON.stringify(body);
    const res = await fetch(url, opts);
    try {
      return await res.json();
    } catch {
      return { error: `Erro HTTP ${res.status}` };
    }
  } catch (err) {
    toast(t('toast_connection'), 'error');
    return { error: err.message };
  }
}

/* ─── Tabs ───────────────────────────────────────────────────────────────── */
function showTab(name) {
  document.querySelectorAll('.tab-pane').forEach(el => el.classList.add('hidden'));
  document.querySelectorAll('.tab').forEach(el => el.classList.remove('active'));
  document.getElementById(`tab-${name}`).classList.remove('hidden');
  document.querySelector(`.tab[data-tab="${name}"]`).classList.add('active');
  if (name === 'leaderboard') { loadLeaderboard(); loadSpecialAndFeed(); }
  if (name === 'bracket')     renderBracketTab();
  if (name === 'matches')     loadMatches();
  if (name === 'me')          loadMyPage();
  if (name === 'admin' && adminPwd) loadAdminMatches();
}

/* ─── User ───────────────────────────────────────────────────────────────── */
function setUser(user, notify = true) {
  currentUser = user;
  localStorage.setItem('bolao_user', JSON.stringify(user));
  document.getElementById('userBtnIcon').textContent = '⚽';
  document.getElementById('userBtnText').textContent = user.name;
  document.getElementById('userBtn').classList.add('logged-in');
  const hint = document.getElementById('matches-user-hint');
  if (hint) hint.textContent = `${t('betting_as')} ${user.name}`;
  if (notify) toast(`${getCurrentLang() === 'en' ? 'Welcome' : 'Bem-vindo'}, ${user.name}! ⚽`, 'success');
}

function openUserModal() {
  document.getElementById('user-modal').classList.remove('hidden');
  document.getElementById('modal-overlay').classList.remove('hidden');
  renderUsersList();
}
function closeUserModal() {
  document.getElementById('user-modal').classList.add('hidden');
  document.getElementById('modal-overlay').classList.add('hidden');
}

function closePlayerModal() {
  document.getElementById('player-modal').classList.add('hidden');
  document.getElementById('player-modal-overlay').classList.add('hidden');
}

async function openPlayerModal(userId, name) {
  document.getElementById('player-modal-title').textContent = `${name}`;
  document.getElementById('player-modal-body').innerHTML = `<div class="empty" style="padding:24px 0"><span class="icon">⏳</span>${t('pm_loading')}</div>`;
  document.getElementById('player-modal').classList.remove('hidden');
  document.getElementById('player-modal-overlay').classList.remove('hidden');

  const [bets, special, lb] = await Promise.all([
    api(`/api/bets?user_id=${userId}`),
    api('/api/special-bets'),
    api('/api/leaderboard'),
  ]);
  const lbEntry = (lb || []).find(p => p.id === userId) || {};
  const pts     = lbEntry.total_points    || 0;
  const exact   = lbEntry.exact_scores    || 0;
  const correct = lbEntry.correct_results || 0;

  const champBet  = (special?.champion_bets  || []).find(b => b.user_id === userId);
  const scorerBet = (special?.scorer_bets    || []).find(b => b.user_id === userId);
  const champResult  = special?.champion;
  const scorerResult = special?.top_scorer;
  const champWon  = champResult  && champBet  && champBet.team.toLowerCase()  === champResult.toLowerCase();
  const scorerWon = scorerResult && scorerBet && scorerBet.name.toLowerCase() === scorerResult.toLowerCase();

  const matchMap = Object.fromEntries(allMatches.map(m => [m.id, m]));
  const sortedBets = (bets || []).slice().sort((a, b) => {
    const ma = matchMap[a.match_id], mb = matchMap[b.match_id];
    return new Date(ma?.match_date||0) - new Date(mb?.match_date||0);
  });

  const betRows = sortedBets.map(b => {
    const m = matchMap[b.match_id];
    if (!m) return '';
    const finished = m.status === 'finished';
    const chipClass = b.points === 3 ? 'pts-3' : b.points === 1 ? 'pts-1' : finished ? 'pts-0' : 'pts-none';
    const chipLabel = finished ? `${b.points}pt` : '—';
    const score = finished ? `<span style="color:var(--text-3);font-size:.78rem">${m.home_score}×${m.away_score}</span>` : '';
    return `<div class="player-bet-row">
      <div class="player-bet-match">${_flagMap[m.home_team]||''} ${m.home_team} <span style="color:var(--text-3)">×</span> ${m.away_team} ${_flagMap[m.away_team]||''} ${score}</div>
      <div style="display:flex;align-items:center;gap:8px;flex-shrink:0">
        <span style="font-weight:700">${b.home_score}×${b.away_score}</span>
        <span class="pts-chip ${chipClass}">${chipLabel}</span>
      </div>
    </div>`;
  }).join('');

  // Rivalry (1v1 vs currentUser)
  let rivalryHtml = '';
  if (currentUser && currentUser.id !== userId) {
    const myBetsArr = Object.values(userBets);
    const myBetMap  = Object.fromEntries(myBetsArr.map(b => [b.match_id, b]));
    const shared = (bets || []).filter(b => myBetMap[b.match_id] !== undefined);
    if (shared.length > 0) {
      let wins = 0, losses = 0, draws = 0, myPts = 0, theirPts = 0;
      shared.forEach(b => {
        const myB = myBetMap[b.match_id];
        myPts    += myB.points || 0;
        theirPts += b.points   || 0;
        if      ((myB.points || 0) > (b.points || 0)) wins++;
        else if ((myB.points || 0) < (b.points || 0)) losses++;
        else draws++;
      });
      rivalryHtml = `
        <div class="rivalry-bar">
          <span style="font-weight:700">${t('pm_rivalry')}</span>
          <span style="color:var(--text-3)">${shared.length} ${shared.length!==1 ? (getCurrentLang()==='en'?'games':'jogos') : (getCurrentLang()==='en'?'game':'jogo')} ${getCurrentLang()==='en'?'in common':'em comum'}</span>
          <span>${t('pm_you')} <strong>${myPts} pts</strong> · ${name}: <strong>${theirPts} pts</strong></span>
          <span class="rivalry-badge win">${wins}${t('pm_win')}</span>
          <span class="rivalry-badge draw">${draws}${t('pm_draw')}</span>
          <span class="rivalry-badge loss">${losses}${t('pm_loss')}</span>
        </div>`;
    }
  }

  document.getElementById('player-modal-body').innerHTML = `
    ${rivalryHtml}
    <div style="padding:16px 20px;border-bottom:1px solid var(--border);display:flex;gap:20px;flex-wrap:wrap">
      <div style="text-align:center"><div style="font-size:1.8rem;font-weight:900;color:var(--gold)">${pts}</div><div style="font-size:.72rem;color:var(--text-3)">${t('pm_points')}</div></div>
      <div style="text-align:center"><div style="font-size:1.4rem;font-weight:900;color:var(--green)">${exact}</div><div style="font-size:.72rem;color:var(--text-3)">${t('pm_exact')}</div></div>
      <div style="text-align:center"><div style="font-size:1.4rem;font-weight:900;color:var(--blue)">${correct}</div><div style="font-size:.72rem;color:var(--text-3)">${t('pm_results')}</div></div>
      ${champBet ? `<div style="flex:1;min-width:120px"><div style="font-size:.7rem;color:var(--text-3);margin-bottom:2px">${t('pm_champion')}</div><div style="font-weight:700${champWon?' ;color:var(--gold)':''}">${champBet.team}${champWon?' ✓':''}</div></div>` : ''}
      ${scorerBet ? `<div style="flex:1;min-width:120px"><div style="font-size:.7rem;color:var(--text-3);margin-bottom:2px">${t('pm_scorer')}</div><div style="font-weight:700${scorerWon?';color:var(--gold)':''}">${scorerBet.name}${scorerWon?' ✓':''}</div></div>` : ''}
    </div>
    <div style="padding:8px 20px 16px">
      ${betRows || `<div class="empty" style="padding:20px 0"><span class="icon">🎲</span>${t('pm_no_bets')}</div>`}
    </div>`;
}

async function renderUsersList() {
  const wrap = document.getElementById('users-list-wrap');
  wrap.innerHTML = `<div style="color:var(--text-3);font-size:.85rem;padding:8px 0">${t('um_loading')}</div>`;
  const users = await api('/api/users');
  if (!Array.isArray(users) || !users.length) {
    wrap.innerHTML = `<div class="empty" style="padding:12px 0"><span class="icon">👤</span>${t('um_no_players')}</div>`;
    return;
  }
  wrap.innerHTML = `<div class="users-list">${users.map(u => `
    <div class="user-option ${currentUser?.id === u.id ? 'selected' : ''}" onclick='pickUser(${JSON.stringify(u)})'>
      <div class="user-avatar">${u.name[0].toUpperCase()}</div>
      <span>${u.name}</span>
      ${currentUser?.id === u.id ? '<span class="user-check">✓</span>' : ''}
    </div>`).join('')}</div>`;
}

async function pickUser(user) {
  setUser(user);
  closeUserModal();
  matchBetsCache = {};
  expandedBets.clear();
  await loadMatches();
  if (!document.getElementById('tab-leaderboard').classList.contains('hidden')) loadLeaderboard();
}

async function createUser() {
  const name = document.getElementById('newUserInput').value.trim();
  if (!name) return;
  const result = await api('/api/users', 'POST', { name });
  if (result.error) { toast(result.error, 'error'); return; }
  document.getElementById('newUserInput').value = '';
  pickUser(result);
}

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

  // Show/hide history and special-grid sections based on stage filter
  const historyDiv   = document.getElementById('history-container');
  const historyDivider = document.getElementById('history-divider');
  const specialGrid  = document.getElementById('special-grid');
  const specialDivider = document.getElementById('special-divider');
  if (lbStageFilter) {
    if (historyDiv)    historyDiv.style.display    = 'none';
    if (historyDivider) historyDivider.style.display = 'none';
    if (specialGrid)   specialGrid.style.display   = 'none';
    if (specialDivider) specialDivider.style.display = 'none';
  } else {
    if (historyDiv)    historyDiv.style.display    = '';
    if (historyDivider) historyDivider.style.display = '';
    if (specialGrid)   specialGrid.style.display   = '';
    if (specialDivider) specialDivider.style.display = '';
  }

  if (!data.length) {
    wrap.innerHTML = `<div class="empty"><span class="icon">🏆</span>${t('lb_empty')}</div>`;
    return;
  }
  const rankEmoji = ['🥇','🥈','🥉'];
  const rankClass = ['r1','r2','r3'];
  wrap.innerHTML = `
    <div class="lb-table">
      <div class="lb-header">
        <div>#</div><div>${t('lb_col_player')}</div><div style="text-align:right">${t('lb_col_pts')}</div>
        <div style="text-align:center">🎯</div><div style="text-align:center">✅</div>
      </div>
      ${data.map((p, i) => `
        <div class="lb-row ${currentUser?.id === p.id ? 'is-me' : ''}" onclick="openPlayerModal(${p.id},'${p.name.replace(/'/g,"&#39;")}')" style="cursor:pointer">
          <div class="lb-rank ${rankClass[i]||''}">${rankEmoji[i]||(i+1)}</div>
          <div>
            <div class="lb-name">${p.name}</div>
            <div class="lb-bets">${p.total_bets} ${p.total_bets!==1?t('lb_bets_n'):t('lb_bets_1')}</div>
          </div>
          <div class="lb-pts">${p.total_points}</div>
          <div class="lb-stat">${p.exact_scores}</div>
          <div class="lb-stat">${p.correct_results}</div>
        </div>`).join('')}
    </div>`;
}

function setLbStage(stage) {
  lbStageFilter = stage;
  loadLeaderboard();
}

/* ─── Bracket tab ───────────────────────────────────────────────────────── */
async function renderBracketTab() {
  if (currentUser) {
    const bets = await api(`/api/bets?user_id=${currentUser.id}`) || [];
    userBets = {};
    bets.forEach(b => { userBets[b.match_id] = b; });
  }
  renderGroupStandings();
  renderThirdsRanking();
  renderBracket();
}

function showBracketTab(tab, btn) {
  document.querySelectorAll('#tab-bracket .inner-tab').forEach(t => t.classList.remove('active'));
  btn.classList.add('active');
  document.getElementById('brtab-standings').classList.toggle('hidden', tab !== 'standings');
  document.getElementById('brtab-thirds').classList.toggle('hidden',    tab !== 'thirds');
  document.getElementById('brtab-bracket').classList.toggle('hidden',   tab !== 'bracket');
}

/* ─── Group standings ────────────────────────────────────────────────────── */

function buildGroupStandings() {
  const groups = {};
  allMatches.filter(m => m.stage === 'Fase de Grupos').forEach(m => {
    const g = m.group_name || '?';
    if (!groups[g]) groups[g] = {};
    [m.home_team, m.away_team].forEach(team => {
      if (!groups[g][team]) groups[g][team] = { team, J:0, V:0, E:0, D:0, GP:0, GC:0, Pts:0 };
    });
    if (m.status === 'finished') {
      const hs = m.home_score, as_ = m.away_score;
      const h = groups[g][m.home_team], a = groups[g][m.away_team];
      h.J++; a.J++;
      h.GP += hs; h.GC += as_;
      a.GP += as_; a.GC += hs;
      if (hs > as_)      { h.V++; h.Pts += 3; a.D++; }
      else if (hs < as_) { a.V++; a.Pts += 3; h.D++; }
      else               { h.E++; h.Pts++;    a.E++; a.Pts++; }
    }
  });
  return Object.entries(groups)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([name, teams]) => ({
      name,
      sorted: Object.values(teams).sort((a, b) =>
        (b.Pts - a.Pts) || ((b.GP - b.GC) - (a.GP - a.GC)) || (b.GP - a.GP) || a.team.localeCompare(b.team)
      ),
    }));
}

function standingsRow(row, i, extraCells = '') {
  const sg = row.GP - row.GC;
  return `<tr class="${i < 2 ? 'classified' : i === 2 ? 'possible' : ''}">
    <td class="td-pos">${i + 1}</td>
    <td class="td-team">${flag(row.team)}${row.team}</td>
    ${extraCells}
    <td>${row.J}</td><td>${row.V}</td><td>${row.E}</td><td>${row.D}</td>
    <td>${row.GP}</td><td>${row.GC}</td>
    <td class="${sg > 0 ? 'sg-pos' : sg < 0 ? 'sg-neg' : ''}">${sg > 0 ? '+' : ''}${sg}</td>
    <td class="td-pts">${row.Pts}</td>
  </tr>`;
}

function renderGroupStandings() {
  const wrap = document.getElementById('group-standings-container');
  if (!wrap) return;
  const groups = buildGroupStandings();
  if (!groups.length) {
    wrap.innerHTML = `<div class="empty"><span class="icon">📊</span>${t('standings_empty')}</div>`;
    return;
  }
  wrap.innerHTML = `
    <div class="standings-grid">
      ${groups.map(({ name, sorted }) => `
        <div class="standings-group">
          <div class="standings-title">${t('standings_group')} ${name}</div>
          <table class="standings-table">
            <thead><tr>
              <th></th><th class="th-team">${t('standings_col_team')}</th>
              <th>J</th><th>V</th>
              <th>E</th><th>D</th>
              <th>GP</th><th>GC</th>
              <th>SG</th><th class="th-pts">${t('lb_col_pts')}</th>
            </tr></thead>
            <tbody>${sorted.map((team, i) => standingsRow(team, i)).join('')}</tbody>
          </table>
        </div>`).join('')}
    </div>
    <p class="standings-legend">
      <span class="legend-dot classified"></span> ${t('standings_qualified')} &nbsp;·&nbsp;
      <span class="legend-dot possible"></span> ${t('standings_third')}
    </p>`;
}

function renderThirdsRanking() {
  const wrap = document.getElementById('thirds-container');
  if (!wrap) return;
  const groups = buildGroupStandings();
  if (!groups.length) {
    wrap.innerHTML = `<div class="empty"><span class="icon">🥉</span>${t('standings_empty')}</div>`;
    return;
  }
  const thirds = groups
    .filter(g => g.sorted[2])
    .map(g => ({ ...g.sorted[2], group: g.name }))
    .sort((a, b) => (b.Pts - a.Pts) || ((b.GP - b.GC) - (a.GP - a.GC)) || (b.GP - a.GP) || a.team.localeCompare(b.team));

  wrap.innerHTML = `
    <p class="pane-sub" style="margin-bottom:16px" data-i18n-html="thirds_sub">${t('thirds_sub')}</p>
    <div class="standings-group" style="max-width:580px">
      <table class="standings-table">
        <thead><tr>
          <th></th><th class="th-team">${t('standings_col_team')}</th><th>${t('thirds_col_group')}</th>
          <th>J</th><th>V</th>
          <th>E</th><th>D</th>
          <th>GP</th><th>GC</th>
          <th>SG</th><th class="th-pts">${t('lb_col_pts')}</th>
        </tr></thead>
        <tbody>
          ${thirds.map((row, i) => {
            const sg = row.GP - row.GC;
            const rowClass = i < 8 ? 'classified' : 'eliminated';
            return `<tr class="${rowClass}">
              <td class="td-pos">${i + 1}</td>
              <td class="td-team">${flag(row.team)}${row.team}</td>
              <td style="color:var(--text-3);font-size:.78rem">${row.group}</td>
              <td>${row.J}</td><td>${row.V}</td><td>${row.E}</td><td>${row.D}</td>
              <td>${row.GP}</td><td>${row.GC}</td>
              <td class="${sg > 0 ? 'sg-pos' : sg < 0 ? 'sg-neg' : ''}">${sg > 0 ? '+' : ''}${sg}</td>
              <td class="td-pts">${row.Pts}</td>
            </tr>`;
          }).join('')}
        </tbody>
      </table>
    </div>
    <p class="standings-legend" style="max-width:580px;margin-top:10px">
      <span class="legend-dot classified"></span> ${t('thirds_advances')} &nbsp;·&nbsp;
      <span class="legend-dot eliminated"></span> ${t('thirds_eliminated')}
    </p>`;
}

/* ─── Bracket ────────────────────────────────────────────────────────────── */
const BRACKET_STAGES = ['32 avos de Final', 'Oitavas de Final', 'Quartas de Final', 'Semifinal', 'Final'];
const STAGE_ORDER    = ['Fase de Grupos', '32 avos de Final', 'Oitavas de Final', 'Quartas de Final', 'Semifinal', 'Terceiro Lugar', 'Final'];
function stageRank(key) { const s = key.split('|||')[0]; const i = STAGE_ORDER.indexOf(s); return i === -1 ? 99 : i; }
const BRACKET_COUNTS = { '32 avos de Final': 16, 'Oitavas de Final': 8, 'Quartas de Final': 4, 'Semifinal': 2, 'Final': 1 };

function renderBracket() {
  const wrap = document.getElementById('bracket-container');
  const knockoutMatches = allMatches.filter(m => BRACKET_STAGES.includes(m.stage));

  const byStage = {};
  knockoutMatches.forEach(m => { (byStage[m.stage] = byStage[m.stage] || []).push(m); });

  const hasAny = knockoutMatches.length > 0;

  // Third place is shown separately at the bottom
  const thirdMatches = allMatches.filter(m => m.stage === 'Terceiro Lugar');

  wrap.innerHTML = `
    ${!hasAny ? `
      <div class="bracket-empty">
        <span class="icon" style="font-size:2rem">🏆</span>
        <p style="font-weight:700;font-size:1rem;margin-bottom:6px">${t('bracket_empty_title')}</p>
        <p style="color:var(--text-3);font-size:.85rem">${t('bracket_empty_sub')}</p>
      </div>` : ''}
    <div class="bracket-wrapper">
      ${BRACKET_STAGES.map(stage => {
        const matches  = byStage[stage] || [];
        const expected = BRACKET_COUNTS[stage];
        const slots    = Math.max(matches.length, expected);

        return `
          <div class="bracket-col">
            <div class="bracket-col-title">${tStage(stage)}</div>
            <div class="bracket-col-matches">
              ${matches.map(m => renderBracketCard(m)).join('')}
              ${Array.from({ length: slots - matches.length }, () => renderBracketCardEmpty()).join('')}
            </div>
          </div>`;
      }).join('<div class="bracket-connector">›</div>')}
    </div>
    ${thirdMatches.length ? `
      <div class="bracket-third">
        <div class="bracket-col-title" style="margin-bottom:10px">${t('bracket_third_place')}</div>
        ${thirdMatches.map(renderBracketCard).join('')}
      </div>` : ''}`;
}

function renderBracketCard(m) {
  const finished  = m.status === 'finished';
  const homeWon   = finished && m.home_score > m.away_score;
  const awayWon   = finished && m.away_score > m.home_score;
  const myBet     = userBets[m.id];
  const matchDate = new Date(m.match_date);
  const dateShort = matchDate.toLocaleDateString(dateLocale(), { day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit', timeZone:'Europe/Berlin' });
  const isPast    = Date.now() > matchDate.getTime() - 5 * 60 * 1000;
  const tbd       = m.home_team === 'A definir' || m.away_team === 'A definir';

  let betLine = '';
  if (finished && myBet) {
    const cls   = myBet.points===3 ? 'pts-3' : myBet.points===1 ? 'pts-1' : 'pts-0';
    const emoji = myBet.points===3 ? '🎯' : myBet.points===1 ? '✅' : '❌';
    betLine = `<div class="bracket-bet"><span class="pts-chip ${cls}" style="font-size:.7rem;padding:2px 7px">${myBet.home_score}-${myBet.away_score} · ${myBet.points}pt ${emoji}</span></div>`;
  } else if (finished && !myBet) {
    betLine = '';
  } else if (isPast && myBet) {
    betLine = `<div class="bracket-bet" style="color:var(--text-3);font-size:.72rem">⏳ ${myBet.home_score}-${myBet.away_score}</div>`;
  } else if (isPast) {
    betLine = `<div class="bracket-bet" style="color:var(--text-3);font-size:.72rem">${t('bracket_bets_closed')}</div>`;
  } else if (!tbd && currentUser) {
    betLine = `<div class="bracket-bet bracket-bet-inputs">
      <input type="number" class="bracket-score-input" id="bh-${m.id}" min="0" max="20"
        value="${myBet ? myBet.home_score : ''}" placeholder="0"
        onblur="autoSaveBet(${m.id})" onkeydown="if(event.key==='Enter')this.blur()">
      <span style="color:var(--text-3);font-size:.8rem;font-weight:700">×</span>
      <input type="number" class="bracket-score-input" id="ba-${m.id}" min="0" max="20"
        value="${myBet ? myBet.away_score : ''}" placeholder="0"
        onblur="autoSaveBet(${m.id})" onkeydown="if(event.key==='Enter')this.blur()">
      <span class="auto-bet-status" id="abs-${m.id}" style="font-size:.8rem">${myBet ? '✓' : ''}</span>
    </div>`;
  } else if (!tbd && !currentUser) {
    betLine = `<div class="bracket-bet" style="color:var(--text-3);font-size:.72rem"><a href="#" onclick="openUserModal();return false;" style="color:var(--gold)">${t('login_to_bet_link')}</a> ${t('login_to_bet_suffix')}</div>`;
  }

  return `
    <div class="bracket-card ${finished ? 'finished' : ''} ${!finished && !isPast && myBet && !tbd ? 'bracket-has-bet' : ''} ${!finished && !isPast && !myBet && currentUser && !tbd ? 'bracket-needs-bet' : ''}">
      <div class="bracket-team ${homeWon ? 'winner' : finished ? 'loser' : ''}">
        ${flag(m.home_team)}<span class="bracket-team-name">${m.home_team}</span>
        ${finished ? `<span class="bracket-team-score">${m.home_score}</span>` : ''}
      </div>
      <div class="bracket-team ${awayWon ? 'winner' : finished ? 'loser' : ''}">
        ${flag(m.away_team)}<span class="bracket-team-name">${m.away_team}</span>
        ${finished ? `<span class="bracket-team-score">${m.away_score}</span>` : ''}
      </div>
      <div class="bracket-meta">${dateShort}${m.venue ? ` · ${m.venue}` : ''}</div>
      ${betLine}
    </div>`;
}

function renderBracketCardEmpty() {
  return `
    <div class="bracket-card bracket-card-tbd">
      <div class="bracket-team"><span class="bracket-team-name">${t('bracket_tbd')}</span></div>
      <div class="bracket-team"><span class="bracket-team-name">${t('bracket_tbd')}</span></div>
    </div>`;
}

/* ─── Rules card ────────────────────────────────────────────────────────── */
function toggleRules() {
  const body  = document.getElementById('rules-body');
  const arrow = document.getElementById('rules-arrow');
  const open  = body.classList.toggle('hidden');
  arrow.textContent = open ? '▾' : '▴';
}

/* ─── Special bets + Feed ────────────────────────────────────────────────── */
async function loadSpecialAndFeed() {
  const [special, feed, history] = await Promise.all([
    api('/api/special-bets'),
    api('/api/feed'),
    api('/api/history'),
  ]);
  renderSpecialGrid(special, 'special-grid');
  renderFeed(feed);
  renderHistoryChart(history || []);
  loadGroupAwards();
}

function renderHistoryChart(history) {
  const wrap = document.getElementById('history-container');
  if (!wrap) return;
  if (!history.length) {
    wrap.innerHTML = `<div class="history-chart-wrap"><p class="hc-empty">${t('history_empty')}</p></div>`;
    return;
  }

  // Collect all users across all snapshots
  const userIds = [];
  const userNames = {};
  const seenIds = new Set();
  history.forEach(h => {
    (h.snapshot || []).forEach(u => {
      if (!seenIds.has(u.id)) {
        seenIds.add(u.id);
        userIds.push(u.id);
        userNames[u.id] = u.name;
      }
    });
  });
  if (!userIds.length) {
    wrap.innerHTML = `<div class="history-chart-wrap"><p class="hc-empty">${t('history_no_participants')}</p></div>`;
    return;
  }

  // Build series: index → {userId → pts} (only users active at that snapshot)
  const series = history.map(h => {
    const map = {};
    h.snapshot.forEach(u => { map[u.id] = u.pts; });
    return map;
  });

  // Rank at each step: only rank users present in that snapshot
  const rankAt = series.map(s => {
    const present = userIds.filter(id => id in s);
    const sorted = [...present].sort((a, b) => (s[b] || 0) - (s[a] || 0));
    const map = {};
    sorted.forEach((id, i) => { map[id] = i + 1; });
    return map;
  });

  const N = userIds.length;
  const W = Math.max(400, history.length * 48);
  const PAD = { top: 16, right: 90, bottom: 32, left: 32 };
  const innerW = W - PAD.left - PAD.right;
  const innerH = Math.max(100, (N - 1) * 28);
  const H = PAD.top + innerH + PAD.bottom;

  const xScale = i => PAD.left + (history.length < 2 ? innerW / 2 : (i / (history.length - 1)) * innerW);
  // Rank 1 at top, rank N at bottom
  const yScale = r => PAD.top + ((r - 1) / Math.max(1, N - 1)) * innerH;

  const COLORS = ['#009C3B','#FFD600','#2563eb','#dc2626','#7c3aed','#f97316','#06b6d4','#84cc16'];

  // Dashed horizontal grid lines, one per rank
  const gridLines = Array.from({ length: N }, (_, i) => {
    const y = yScale(i + 1);
    return `<line x1="${PAD.left}" y1="${y}" x2="${PAD.left + innerW}" y2="${y}" stroke="var(--border)" stroke-width="1" stroke-dasharray="3,3"/>`;
  }).join('');

  // Y axis: rank labels
  const yLabels = Array.from({ length: N }, (_, i) => {
    const r = i + 1;
    const label = r <= 3 ? ['1º','2º','3º'][r - 1] : `${r}º`;
    return `<text x="${PAD.left - 5}" y="${yScale(r) + 4}" text-anchor="end" font-size="10" fill="var(--text-3)">${label}</text>`;
  }).join('');

  // X axis labels (every N steps to avoid crowding)
  const step = Math.ceil(history.length / 10);
  const xLabels = history.map((h, i) => {
    if (i % step !== 0 && i !== history.length - 1) return '';
    const x = xScale(i);
    const label = h.label.split(' ')[0];
    return `<text x="${x}" y="${H - 4}" text-anchor="middle" font-size="9" fill="var(--text-3)" transform="rotate(-35,${x},${H - 4})">${label}</text>`;
  }).join('');

  // Spread end labels by final rank (already spaced by innerH, but ensure min gap)
  const lastX = xScale(history.length - 1);
  const lastRank = rankAt[rankAt.length - 1];
  const endLabelInfo = userIds
    .filter(id => id in lastRank)
    .map(id => ({ id, rawY: yScale(lastRank[id]) }))
    .sort((a, b) => a.rawY - b.rawY);
  const MIN_GAP = 12;
  for (let i = 1; i < endLabelInfo.length; i++) {
    if (endLabelInfo[i].rawY - endLabelInfo[i - 1].rawY < MIN_GAP)
      endLabelInfo[i].rawY = endLabelInfo[i - 1].rawY + MIN_GAP;
  }
  const labelY = Object.fromEntries(endLabelInfo.map(el => [el.id, el.rawY]));

  // Lines & dots per user
  const lines = userIds.map((id, ci) => {
    const color = COLORS[ci % COLORS.length];
    const d = rankAt.map((r, i) => {
      if (!(id in r)) return ''; // user not yet active
      const rank = r[id];
      const prevActive = i > 0 && id in rankAt[i - 1];
      return `${prevActive ? 'L' : 'M'}${xScale(i).toFixed(1)},${yScale(rank).toFixed(1)}`;
    }).join(' ');
    const dots = rankAt.map((r, i) => {
      if (!(id in r)) return ''; // user not yet active
      const rank = r[id];
      const prev = i > 0 && id in rankAt[i - 1] ? rankAt[i - 1][id] : null;
      // Draw dot only when rank changes or at first/last point
      if (prev !== null && rank === prev && i !== rankAt.length - 1) return '';
      return `<circle cx="${xScale(i).toFixed(1)}" cy="${yScale(rank).toFixed(1)}" r="3.5" fill="${color}" stroke="var(--surface)" stroke-width="1.5"/>`;
    }).join('');
    return `<path d="${d}" fill="none" stroke="${color}" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round"/>
            ${dots}
            <text x="${lastX + 6}" y="${labelY[id] + 4}" font-size="10" fill="${color}" font-weight="700">${userNames[id].split(' ')[0]}</text>`;
  }).join('');

  wrap.innerHTML = `<div class="history-chart-wrap">
    <svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" style="min-width:${W}px">
      ${gridLines}
      ${yLabels}
      ${xLabels}
      ${lines}
    </svg>
  </div>`;
}

function renderSpecialGrid(special, containerId) {
  const wrap = document.getElementById(containerId);
  if (!wrap) return;

  const champOpen   = special?.special_bets_open;
  const champResult = special?.champion;
  const scorerResult= special?.top_scorer;
  const champBets   = special?.champion_bets || [];
  const scorerBets  = special?.scorer_bets   || [];

  const statusBadge = champOpen
    ? `<span class="special-card-open">${t('special_open')}</span>`
    : `<span class="special-card-closed">${t('special_closed')}</span>`;

  const renderRows = (bets, resultVal, getVal) =>
    bets.length === 0
      ? `<p style="color:var(--text-3);font-size:.8rem;padding:8px 0">${t('special_no_bets')}</p>`
      : bets.map(b => {
          const val = getVal(b);
          const won = resultVal && val.toLowerCase() === resultVal.toLowerCase();
          return `<div class="special-bet-row">
            <div><span class="special-user">${b.user_name}</span><br><span class="special-pick">${val}</span></div>
            <div class="special-pts ${won ? 'won' : resultVal ? 'lost' : ''}">
              ${won ? '✓ +' + (getVal===getChampVal?10:5)+' pts' : resultVal ? '—' : ''}
            </div>
          </div>`;
        }).join('');

  const getChampVal  = b => b.team;
  const getScorerVal = b => b.name;

  wrap.innerHTML = `
    <div class="special-card">
      <div class="special-card-title">${t('special_champion')}</div>
      ${statusBadge}
      ${champResult ? `<div class="special-card-result">✓ ${champResult}</div>` : ''}
      ${renderRows(champBets, champResult, getChampVal)}
    </div>
    <div class="special-card">
      <div class="special-card-title">${t('special_scorer')}</div>
      ${statusBadge}
      ${scorerResult ? `<div class="special-card-result">✓ ${scorerResult}</div>` : ''}
      ${renderRows(scorerBets, scorerResult, getScorerVal)}
    </div>`;
}

function renderFeed(feed) {
  const wrap = document.getElementById('feed-container');
  if (!wrap) return;
  if (!feed?.length) {
    wrap.innerHTML = `<p class="feed-empty">${t('feed_empty')}</p>`;
    return;
  }
  wrap.innerHTML = feed.map(entry => {
    if (entry.type === 'match_result') {
      const chips = entry.results.map(r => {
        const cls = r.points === 3 ? 'pts-3' : r.points === 1 ? 'pts-1' : 'pts-0';
        const emoji = r.points === 3 ? '🎯' : r.points === 1 ? '✅' : '❌';
        return `<div class="feed-chip ${cls}">
          <span class="fc-name">${r.user_name}</span>
          <span class="fc-score">${r.home_score}×${r.away_score}</span>
          <span class="fc-pts">${r.points}pt</span>
          <span>${emoji}</span>
        </div>`;
      }).join('');
      return `<div class="feed-entry">
        <div class="feed-header">
          <div>
            <div class="feed-title">${entry.home_team} <span class="feed-score">${entry.home_score}–${entry.away_score}</span> ${entry.away_team}</div>
            <div class="feed-date">${fmtDate(entry.timestamp)}</div>
          </div>
        </div>
        ${chips ? `<div class="feed-results">${chips}</div>` : `<p style="color:var(--text-3);font-size:.8rem">${t('feed_no_bets')}</p>`}
      </div>`;
    }
    if (entry.type === 'champion_result') {
      const chips = entry.results.map(r =>
        `<div class="feed-chip ${r.points>0?'pts-s':'pts-0'}">
          <span class="fc-name">${r.user_name}</span>
          <span class="fc-score">${r.pick}</span>
          ${r.points > 0 ? `<span class="fc-pts">+${r.points}pt 🏆</span>` : ''}
        </div>`).join('');
      return `<div class="feed-entry">
        <div class="feed-header">
          <div><div class="feed-title">${t('feed_champion')} ${entry.team}</div><div class="feed-date">${fmtDate(entry.timestamp)}</div></div>
        </div>
        <div class="feed-results">${chips}</div>
      </div>`;
    }
    if (entry.type === 'scorer_result') {
      const chips = entry.results.map(r =>
        `<div class="feed-chip ${r.points>0?'pts-s':'pts-0'}">
          <span class="fc-name">${r.user_name}</span>
          <span class="fc-score">${r.pick}</span>
          ${r.points > 0 ? `<span class="fc-pts">+${r.points}pt ⚽</span>` : ''}
        </div>`).join('');
      return `<div class="feed-entry">
        <div class="feed-header">
          <div><div class="feed-title">${t('feed_scorer')} ${entry.name}</div><div class="feed-date">${fmtDate(entry.timestamp)}</div></div>
        </div>
        <div class="feed-results">${chips}</div>
      </div>`;
    }
    return '';
  }).join('');
}

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
  renderMatches();
  updatePendingBadge();
}

function updatePendingBadge() {
  const badge = document.getElementById('pending-badge');
  if (!badge) return;
  if (!currentUser) { badge.classList.add('hidden'); return; }
  const now = new Date();
  const LOCK_MS = 5 * 60 * 1000;
  const open = allMatches.filter(m =>
    m.status === 'upcoming' && new Date(m.match_date) - now > LOCK_MS
  );
  const unbetted = open.filter(m => !userBets[m.id]).length;
  if (unbetted > 0) {
    badge.textContent = unbetted;
    badge.classList.remove('hidden');
  } else {
    badge.classList.add('hidden');
  }
}

function buildStagePills() {
  const stages = [...new Set(allMatches.map(m => m.stage))];
  const row = document.getElementById('stage-pills-row');
  if (stages.length <= 1) { row.innerHTML = ''; }
  else {
    row.innerHTML = ['all', ...stages].map(s => `
      <button class="pill ${stageFilter === s ? 'active' : ''}"
        onclick="setStageFilter('${s}', this)">
        ${s === 'all' ? t('all_stages') : tStage(s)}
      </button>`).join('');
  }

  document.getElementById('view-toggle-row').innerHTML = `
    <button class="pill ${viewMode === 'grouped'       ? 'active' : ''}" onclick="setViewMode('grouped',this)">${t('view_grouped')}</button>
    <button class="pill ${viewMode === 'chronological' ? 'active' : ''}" onclick="setViewMode('chronological',this)">${t('view_chrono')}</button>
    ${currentUser ? `<button class="pill ${showUnbettedOnly ? 'active' : ''}" onclick="toggleUnbettedFilter(this)">${t('no_bet_filter')}</button>` : ''}
    <button class="btn btn-ghost btn-sm" style="margin-left:auto" onclick="toggleAllGroups()">⊞</button>
    ${currentUser ? `<button class="btn btn-ghost btn-sm" onclick="randomizeBets()">${t('randomize_btn')}</button>` : ''}
    ${currentUser ? `<button class="btn btn-ghost btn-sm" style="color:var(--red)" onclick="confirmClearBets()">${t('clear_bets_btn')}</button>` : ''}`;
}

function setViewMode(mode, btn) {
  viewMode = mode;
  localStorage.setItem('bolao_viewmode', mode);
  document.querySelectorAll('#view-toggle-row .pill').forEach(p => p.classList.remove('active'));
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
  document.querySelectorAll('#status-pills .pill').forEach(p => p.classList.remove('active'));
  btn.classList.add('active');
  renderMatches();
}

function setStageFilter(f, btn) {
  stageFilter = f;
  document.querySelectorAll('#stage-pills-row .pill').forEach(p => p.classList.remove('active'));
  btn.classList.add('active');
  renderMatches();
}

function toggleUnbettedFilter(btn) {
  showUnbettedOnly = !showUnbettedOnly;
  btn.classList.toggle('active', showUnbettedOnly);
  renderMatches();
}

function renderMatches() {
  const container = document.getElementById('matches-container');
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
  const matchDate = new Date(m.match_date);
  const isPast   = Date.now() > matchDate.getTime() - 5 * 60 * 1000;
  const msLeft   = matchDate.getTime() - Date.now();
  const showCountdown = !finished && msLeft > 0 && msLeft < 48 * 60 * 60 * 1000;

  const dateStr = matchDate.toLocaleDateString(dateLocale(), { day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit', timeZone:'Europe/Berlin' });

  let badge;
  if (finished)     badge = `<span class="badge badge-finished">${t('badge_finished')}</span>`;
  else if (isPast)  badge = `<span class="badge badge-closed">${t('badge_closing')}</span>`;
  else              badge = `<span class="badge badge-open">${t('badge_open')}</span>`;

  const vsBlock = finished
    ? `<div class="vs-block"><div class="vs-scores"><div class="vs-box">${m.home_score}</div><span class="vs-sep">×</span><div class="vs-box">${m.away_score}</div></div></div>`
    : `<div class="vs-block"><span class="vs-label">VS</span></div>`;

  let betBar;
  if (finished) {
    const pts = bet?.points ?? null;
    const chipClass = pts === 3 ? 'pts-3' : pts === 1 ? 'pts-1' : pts === 0 ? 'pts-0' : 'pts-none';
    const emoji     = pts === 3 ? '🎯' : pts === 1 ? '✅' : pts === 0 ? '❌' : '';
    betBar = `<div class="bet-bar">
      ${bet
        ? `<div class="bet-result-row">
            <span class="bet-label">${t('bet_label')}</span>
            <span class="bet-prediction">${bet.home_score}×${bet.away_score}</span>
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
    betBar = `<div class="bet-bar">
      <span class="bet-label">${t('bet_label')}</span>
      <div class="bet-inputs">
        <input type="number" class="bet-score-input" id="bh-${m.id}" min="0" max="20"
          value="${hasBet ? bet.home_score : ''}" placeholder="0"
          oninput="this.value=Math.min(20,Math.max(0,parseInt(this.value)||0))"
          onblur="autoSaveBet(${m.id})" onkeydown="if(event.key==='Enter'){this.blur()}">
        <span class="bet-x">×</span>
        <input type="number" class="bet-score-input" id="ba-${m.id}" min="0" max="20"
          value="${hasBet ? bet.away_score : ''}" placeholder="0"
          oninput="this.value=Math.min(20,Math.max(0,parseInt(this.value)||0))"
          onblur="autoSaveBet(${m.id})" onkeydown="if(event.key==='Enter'){this.blur()}">
      </div>
      <span class="auto-bet-status" id="abs-${m.id}">${hasBet ? '✓' : ''}</span>
    </div>`;
  }

  // "Ver palpites" toggle — visible whenever there are bets
  const toggleLabel = isPast
    ? `${expandedBets.has(m.id) ? '▲' : '▼'} ${t('view_bets')} (${m.bet_count})`
    : `👥 ${m.bet_count} ${t('bets_placed')}`;
  const showAllBetsToggle = m.bet_count > 0
    ? `<button class="all-bets-toggle" onclick="toggleAllBets(${m.id}, this, ${!isPast})">
        ${toggleLabel}
       </button>
       <div class="all-bets-section" id="all-bets-${m.id}" ${expandedBets.has(m.id)?'':'style="display:none"'}>
         ${renderAllBets(m.id, !isPast)}
       </div>`
    : '';

  return `
    <div class="match-card ${finished?'finished':''} ${bet!==undefined&&!finished?'has-bet':''} ${!finished&&!isPast&&bet===undefined&&currentUser?'needs-bet':''}">
      <div class="match-meta">
        <span>📅 ${dateStr}${m.venue ? ` · 📍 ${m.venue}` : ''}</span>
        ${badge}
        ${showCountdown ? `<span class="match-countdown ${msLeft < 30*60*1000 ? 'countdown-urgent' : ''}" data-ts="${matchDate.getTime()}">⏱ ${fmtCountdown(msLeft)}</span>` : ''}
      </div>
      <div class="match-teams">
        <div class="team home">
          <span class="t-name">${m.home_team}</span>
          <span class="t-flag">${_flagMap[m.home_team]||''}</span>
        </div>
        ${vsBlock}
        <div class="team away">
          <span class="t-flag">${_flagMap[m.away_team]||''}</span>
          <span class="t-name">${m.away_team}</span>
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
    const cls = b.points === 3 ? 'pts-3' : b.points === 1 ? 'pts-1' : b.points === 0 && b.status === 'finished' ? 'pts-0' : '';
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
    btn.innerHTML = hideScores ? `👥 ${count} ${t('bets_placed')}` : `▼ ${t('view_bets')} (${count})`;
  } else {
    expandedBets.add(matchId);
    btn.innerHTML = hideScores ? `👥 ${count} ${t('bets_placed')}` : `▲ ${t('view_bets')} (${count})`;
    if (!matchBetsCache[matchId]) {
      const bets = await api(`/api/bets?match_id=${matchId}`);
      matchBetsCache[matchId] = bets || [];
    }
    const section = document.getElementById(`all-bets-${matchId}`);
    section.innerHTML = renderAllBets(matchId, hideScores);
    section.style.display = 'block';
  }
}

async function saveBet(matchId) {
  if (!currentUser) { toast(t('toast_select_profile'), 'error'); return; }
  const hs  = parseInt(document.getElementById(`bh-${matchId}`).value);
  const as_ = parseInt(document.getElementById(`ba-${matchId}`).value);
  if (isNaN(hs) || isNaN(as_) || hs < 0 || as_ < 0) { toast(t('toast_fill_scores'), 'error'); return; }
  const result = await api('/api/bets', 'POST', { user_id: currentUser.id, match_id: matchId, home_score: hs, away_score: as_ });
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
  const isNew = !userBets[matchId];
  const statusEl = document.getElementById(`abs-${matchId}`);
  if (statusEl) { statusEl.textContent = '…'; statusEl.className = 'auto-bet-status saving'; }
  _savingBets.add(matchId);
  const result = await api('/api/bets', 'POST', { user_id: currentUser.id, match_id: matchId, home_score: hs, away_score: as_ });
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
    !userBets[m.id]
  );
  if (!open.length) { toast(t('toast_no_open'), 'info'); return; }

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
      <div class="award-winner">${award.name}</div>
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
    ${card('🤯', t('award_upsets'), awards.maior_zebra,
      a => `${a.upsets} ${getCurrentLang()==='en'?(a.upsets!==1?'upsets':'upset'):'zebra'+(a.upsets!==1?'s':'')}`,
      () => t('award_upsets_sub'))}
  </div>`;
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

  // Header
  document.getElementById('me-header').innerHTML = `
    <div class="me-avatar">${currentUser.name[0].toUpperCase()}</div>
    <div style="flex:1">
      <div class="me-name">${currentUser.name}</div>
      <div style="color:var(--text-3);font-size:.8rem;margin-top:2px">${me.total_bets||0} ${(me.total_bets||0)!==1?t('lb_bets_n'):t('lb_bets_1')}</div>
    </div>
    <div style="text-align:right">
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
      ${champResult ? (champWon ? `<div class="special-card-result">${t('me_correct', {pts:10})}</div>` : `<div class="special-card-closed">${t('me_wrong', {val:champResult})}</div>`) : ''}
      ${champBet
        ? `<div style="font-weight:700;margin-bottom:${isOpen&&!champResult?'8':'0'}px">${champBet.team}</div>`
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

/* ─── Admin ──────────────────────────────────────────────────────────────── */
async function adminLogin() {
  const pwd = document.getElementById('adminPwdInput').value;
  if (!pwd) { toast('Digite a senha', 'error'); return; }
  const res = await api('/api/admin/verify', 'POST', { password: pwd });
  if (res.error) { toast('Senha incorreta', 'error'); return; }
  adminPwd = pwd;
  document.getElementById('admin-login-card').classList.add('hidden');
  document.getElementById('admin-panel').classList.remove('hidden');
  loadAdminMatches();
  loadAdminSpecialStatus();
  loadSyncStatus();
  loadAdminBetSelects();
  toast('Acesso liberado ✓', 'success');
}

async function loadAdminBetSelects() {
  const [users, matches] = await Promise.all([api('/api/users'), api('/api/matches')]);
  const uSel = document.getElementById('ab-user');
  const mSel = document.getElementById('ab-match');
  uSel.innerHTML = '<option value="">Selecione o usuário...</option>' +
    (users||[]).map(u => `<option value="${u.id}">${u.name}</option>`).join('');
  mSel.innerHTML = '<option value="">Selecione a partida...</option>' +
    (matches||[]).map(m => {
      const d = new Date(m.match_date).toLocaleDateString('pt-BR',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit',timeZone:'Europe/Berlin'});
      return `<option value="${m.id}">${m.home_team} × ${m.away_team} (${d})</option>`;
    }).join('');
}

async function adminSetBet() {
  const userId  = Number(document.getElementById('ab-user').value);
  const matchId = Number(document.getElementById('ab-match').value);
  const hs      = parseInt(document.getElementById('ab-home').value);
  const as_     = parseInt(document.getElementById('ab-away').value);
  if (!userId || !matchId) { toast('Selecione usuário e partida', 'error'); return; }
  if (isNaN(hs) || isNaN(as_) || hs < 0 || as_ < 0) { toast('Preencha o placar', 'error'); return; }
  const res = await api('/api/admin/bets', 'POST', { password: adminPwd, user_id: userId, match_id: matchId, home_score: hs, away_score: as_ });
  if (res.error) { toast(res.error, 'error'); return; }
  toast('Palpite salvo ✓', 'success');
  matchBetsCache = {}; expandedBets.clear();
  loadLeaderboard();
}

async function loadAdminSpecialStatus() {
  const special = await api('/api/special-bets');
  const wrap = document.getElementById('admin-special-status');
  if (!special) return;
  wrap.innerHTML = `
    <span>Apostas especiais: <strong>${special.special_bets_open ? '🟢 Abertas' : '🔒 Encerradas'}</strong></span>
    <button class="btn btn-sm ${special.special_bets_open ? 'btn-danger' : 'btn-green'}"
      onclick="adminToggleSpecialBets(${!special.special_bets_open})">
      ${special.special_bets_open ? 'Encerrar apostas' : 'Reabrir apostas'}
    </button>`;
  if (special.champion)   document.getElementById('championInput').value = special.champion;
  if (special.top_scorer) document.getElementById('scorerInput').value   = special.top_scorer;
}

async function adminToggleSpecialBets(open) {
  const res = await api('/api/admin/special-bets', 'PUT', { password: adminPwd, open });
  if (res.error) { toast(res.error, 'error'); return; }
  toast(open ? 'Apostas reabertas!' : 'Apostas encerradas!', 'success');
  loadAdminSpecialStatus();
  loadSpecialAndFeed();
}

async function adminSetChampion() {
  const team = document.getElementById('championInput').value.trim();
  if (!team) { toast('Informe o time', 'error'); return; }
  const res = await api('/api/admin/champion', 'PUT', { password: adminPwd, team });
  if (res.error) { toast(res.error, 'error'); return; }
  toast(`Campeão definido: ${team} (${res.winners} acertou)`, 'success');
  loadLeaderboard(); loadSpecialAndFeed();
}

async function adminSetScorer() {
  const name = document.getElementById('scorerInput').value.trim();
  if (!name) { toast('Informe o jogador', 'error'); return; }
  const res = await api('/api/admin/top-scorer', 'PUT', { password: adminPwd, name });
  if (res.error) { toast(res.error, 'error'); return; }
  toast(`Artilheiro definido: ${name}`, 'success');
  loadLeaderboard(); loadSpecialAndFeed();
}

async function loadAdminMatches() {
  const matches = await api('/api/matches') || [];
  allMatches = matches; // keep global in sync so openEditModal finds new matches
  const wrap = document.getElementById('admin-match-list');
  if (!matches.length) {
    wrap.innerHTML = '<div class="empty" style="padding:16px 0">Nenhuma partida.</div>'; return;
  }
  wrap.innerHTML = matches.map(m => {
    const dateStr = fmtDate(m.match_date);
    const isFinished = m.status === 'finished';
    return `<div class="admin-match-item" id="ami-${m.id}">
      <div class="admin-match-info">
        <div class="admin-match-name">${m.home_team} × ${m.away_team}</div>
        <div class="admin-match-meta">${dateStr}${m.venue?' · '+m.venue:''} · ${m.stage}${m.group_name?' G'+m.group_name:''}</div>
      </div>
      ${isFinished
        ? `<span class="result-saved">✓ ${m.home_score}–${m.away_score}</span>`
        : `<div class="admin-result-form">
            <input type="number" class="result-input" id="rh-${m.id}" min="0" max="20" placeholder="0">
            <span class="result-sep">×</span>
            <input type="number" class="result-input" id="ra-${m.id}" min="0" max="20" placeholder="0">
            <button class="btn btn-primary btn-sm" onclick="adminSaveResult(${m.id})">Salvar</button>
           </div>`}
      <div class="admin-actions">
        <button class="btn btn-secondary btn-sm" onclick="openEditModal(${m.id})">✏️</button>
        ${m.status === 'finished'
          ? `<button class="btn btn-danger btn-sm" onclick="adminClearResult(${m.id})" title="Limpar resultado">↩ Resultado</button>`
          : `<button class="btn btn-danger btn-sm" onclick="adminDeleteMatch(${m.id})" title="Excluir partida">✕</button>`
        }
      </div>
    </div>`;
  }).join('');
}

async function adminSaveResult(matchId) {
  const hs  = parseInt(document.getElementById(`rh-${matchId}`).value);
  const as_ = parseInt(document.getElementById(`ra-${matchId}`).value);
  if (isNaN(hs) || isNaN(as_) || hs < 0 || as_ < 0) { toast('Insira o placar completo', 'error'); return; }
  const res = await api(`/api/matches/${matchId}/result`, 'PUT', { password: adminPwd, home_score: hs, away_score: as_ });
  if (res.error) { toast(res.error, 'error'); return; }
  toast(`${res.home_team} ${hs}–${as_} ${res.away_team} ✓`, 'success');
  matchBetsCache = {}; expandedBets.clear();
  loadAdminMatches(); loadLeaderboard(); loadSpecialAndFeed();
  if (!document.getElementById('tab-matches').classList.contains('hidden')) loadMatches();
}

async function adminClearResult(matchId) {
  if (!confirm('Limpar resultado? A partida volta para "a jogar" e os pontos são zerados.')) return;
  const res = await api(`/api/matches/${matchId}/clear-result`, 'POST', { password: adminPwd });
  if (res.error) { toast(res.error, 'error'); return; }
  toast('Resultado removido ✓', 'info');
  matchBetsCache = {}; expandedBets.clear();
  loadAdminMatches(); loadLeaderboard(); loadSpecialAndFeed();
  if (!document.getElementById('tab-matches').classList.contains('hidden')) loadMatches();
}

async function adminDeleteMatch(matchId) {
  if (!confirm('Excluir partida e todos os palpites relacionados?')) return;
  const res = await api(`/api/matches/${matchId}`, 'DELETE', { password: adminPwd });
  if (res.error) { toast(res.error, 'error'); return; }
  toast('Partida excluída', 'info');
  loadAdminMatches(); loadMatches();
}

async function adminAddMatch() {
  const home  = document.getElementById('f-home').value.trim();
  const away  = document.getElementById('f-away').value.trim();
  const date  = document.getElementById('f-date').value;
  const group = document.getElementById('f-group').value.trim().toUpperCase();
  const stage = document.getElementById('f-stage').value;
  const venue = document.getElementById('f-venue').value.trim();
  if (!home || !away || !date) { toast('Times e data são obrigatórios', 'error'); return; }
  const res = await api('/api/matches', 'POST', { password: adminPwd, home_team: home, away_team: away, match_date: date+':00', stage, group_name: group||null, venue: venue||null });
  if (res.error) { toast(res.error, 'error'); return; }
  toast('Partida adicionada!', 'success');
  ['f-home','f-away','f-date','f-group','f-venue'].forEach(id => { document.getElementById(id).value = ''; });
  loadAdminMatches(); loadMatches();
}

async function loadSyncStatus() {
  const data = await api('/api/admin/sync-status');
  const wrap = document.getElementById('sync-status');
  if (!wrap) return;
  if (!data) { wrap.innerHTML = ''; return; }

  if (!data.has_api_key) {
    wrap.innerHTML = `<p class="card-sub" style="color:var(--red)">⚠️ <code>FOOTBALL_API_KEY</code> não configurada. Configure a variável de ambiente com sua chave de <strong>football-data.org</strong>.</p>`;
    return;
  }

  const s = data.last_sync;
  if (!s) {
    wrap.innerHTML = `<p class="card-sub">🟢 API configurada. Ainda não foi feita nenhuma sincronização.</p>`;
    return;
  }

  if (!s.ok) {
    wrap.innerHTML = `<p class="card-sub" style="color:var(--red)">❌ Último sync falhou: ${s.error}<br><span style="color:var(--text-3)">${fmtDate(s.time)}</span></p>`;
    return;
  }

  wrap.innerHTML = `
    <div class="sync-result">
      <span class="sync-badge ok">✓ OK</span>
      <span>${s.updated} resultado(s) atualizado(s)</span>
      <span class="sync-time">${fmtDate(s.time)}</span>
    </div>
    ${s.not_found > 0 ? `<p class="card-sub" style="margin-top:6px">⚠️ ${s.not_found} partida(s) não encontrada(s) na ESPN:${
      (s.not_found_matches || []).map(m => `<br>&nbsp;&nbsp;• ${m.home} × ${m.away} (${m.date})`).join('')
    }</p>` : ''}`;
}

async function adminSync() {
  const btn = event.target;
  btn.disabled = true;
  btn.textContent = '⟳ Sincronizando...';
  const res = await api('/api/admin/sync', 'POST', { password: adminPwd });
  btn.disabled = false;
  btn.textContent = '↻ Sincronizar agora';

  if (res.error) { toast(res.error, 'error'); return; }
  if (!res.ok)   { toast(`Erro: ${res.error}`, 'error'); return; }

  toast(`Sync OK — ${res.updated} resultado(s) atualizado(s)`, 'success');
  loadSyncStatus();
  if (res.updated > 0) {
    loadAdminMatches();
    loadLeaderboard();
    loadSpecialAndFeed();
    matchBetsCache = {}; expandedBets.clear();
    if (!document.getElementById('tab-matches').classList.contains('hidden')) loadMatches();
  }
}

async function adminImportMatches() {
  if (!confirm('Isso vai substituir TODAS as partidas da Fase de Grupos e apagar palpites existentes. Continuar?')) return;
  const btn = event.target;
  btn.disabled = true;
  btn.textContent = '⟳ Importando...';
  const res = await api('/api/admin/import-matches', 'POST', { password: adminPwd });
  btn.disabled = false;
  btn.textContent = '📥 Importar partidas da API';

  if (res.error || !res.ok) { toast(res.error || 'Erro ao importar', 'error'); return; }
  const delMsg = res.deleted_bets > 0 ? ` (${res.deleted_bets} palpites apagados)` : '';
  toast(`${res.imported} partidas importadas com sucesso!${delMsg}`, 'success');
  matchBetsCache = {}; expandedBets.clear(); allMatches = [];
  loadAdminMatches();
  loadMatches();
  renderBracketTab();
}

async function adminImportKnockout() {
  const btn = event.target; btn.disabled = true; btn.textContent = '⟳ Importando...';
  const res = await api('/api/admin/import-knockout', 'POST', { password: adminPwd });
  btn.disabled = false; btn.textContent = '🏆 Importar Fase Eliminatória (API)';
  if (res.error || !res.ok) { toast(res.error || 'Erro ao importar', 'error'); return; }
  toast(`${res.added} partidas adicionadas, ${res.updated} atualizadas!`, 'success');
  allMatches = []; loadMatches(); renderBracketTab();
}

async function adminGenerateRound32() {
  if (!confirm('Gerar os 32 jogos da fase de 32 avos com base na classificação atual dos grupos?\n\nIsso não apaga palpites existentes.')) return;
  const btn = event.target; btn.disabled = true; btn.textContent = '⟳ Gerando...';
  const res = await api('/api/admin/generate-round32', 'POST', { password: adminPwd });
  btn.disabled = false; btn.textContent = '⚡ Gerar 32 avos das classificações';
  if (res.error || !res.ok) { toast(res.error || 'Erro ao gerar', 'error'); return; }
  toast(`${res.added} partidas criadas, ${res.updated} atualizadas!`, 'success');
  allMatches = []; loadMatches(); renderBracketTab();
}

async function adminBackup() {
  const btn = event.target;
  btn.disabled = true;
  btn.textContent = '⟳ Salvando...';
  const res = await api('/api/admin/backup', 'POST', { password: adminPwd });
  btn.disabled = false;
  btn.textContent = '💾 Backup (Gist)';
  if (res.error || !res.ok) {
    toast(res.error || 'Erro ao fazer backup', 'error');
  } else {
    toast('Backup enviado para o Gist com sucesso!', 'success');
  }
}

function adminDownload() {
  window.location.href = `/api/admin/download?password=${encodeURIComponent(adminPwd)}`;
}

async function adminChangePwd() {
  const newPwd = document.getElementById('newPwdInput').value;
  if (!newPwd) { toast('Digite a nova senha', 'error'); return; }
  const res = await api('/api/admin/password', 'PUT', { password: adminPwd, new_password: newPwd });
  if (res.error) { toast(res.error, 'error'); return; }
  adminPwd = newPwd;
  document.getElementById('newPwdInput').value = '';
  toast('Senha alterada!', 'success');
}

// Edit match modal
function openEditModal(matchId) {
  const match = allMatches.find(m => m.id === matchId);
  if (!match) return;
  editingMatchId = matchId;
  document.getElementById('em-home').value  = match.home_team;
  document.getElementById('em-away').value  = match.away_team;
  document.getElementById('em-date').value  = match.match_date.slice(0, 16);
  document.getElementById('em-group').value = match.group_name || '';
  document.getElementById('em-stage').value = match.stage;
  document.getElementById('em-venue').value = match.venue || '';
  document.getElementById('edit-modal').classList.remove('hidden');
  document.getElementById('edit-modal-overlay').classList.remove('hidden');
}
function closeEditModal() {
  editingMatchId = null;
  ['em-home','em-away','em-date','em-group','em-stage','em-venue'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
  document.getElementById('edit-modal').classList.add('hidden');
  document.getElementById('edit-modal-overlay').classList.add('hidden');
}
async function adminSaveEdit() {
  if (!editingMatchId) return;
  const res = await api(`/api/matches/${editingMatchId}`, 'PUT', {
    password:   adminPwd,
    home_team:  document.getElementById('em-home').value.trim(),
    away_team:  document.getElementById('em-away').value.trim(),
    match_date: document.getElementById('em-date').value + ':00',
    group_name: document.getElementById('em-group').value.trim().toUpperCase() || null,
    stage:      document.getElementById('em-stage').value,
    venue:      document.getElementById('em-venue').value.trim() || null,
  });
  if (res.error) { toast(res.error, 'error'); return; }
  toast('Partida atualizada!', 'success');
  closeEditModal();
  loadAdminMatches(); loadMatches();
}

/* ─── Helpers ────────────────────────────────────────────────────────────── */
function fmtDate(str) {
  return new Date(str).toLocaleDateString(dateLocale(), { day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit', timeZone:'Europe/Berlin' });
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
