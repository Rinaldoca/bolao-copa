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
          ${team ? `<span class="cp-flag">${team.f}</span><span>${team.n}</span>` : `<span class="cp-placeholder">Escolha a seleção...</span>`}
        </span>
        <span class="cp-arrow" id="cp-arrow">▾</span>
      </button>
      <div class="cp-dropdown hidden" id="cp-dropdown">
        <div class="cp-search-wrap">
          <input class="cp-search" id="cp-search" type="text" placeholder="🔍  Buscar seleção..." oninput="cpFilter(this.value)" autocomplete="off">
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
let statusFilter   = 'all';
let stageFilter    = 'all';
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
      toast('Sua sessão expirou. Selecione seu perfil novamente.', 'info');
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
    return await res.json();
  } catch (err) {
    toast('Erro de conexão', 'error');
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
  if (hint) hint.textContent = `Apostando como: ${user.name}`;
  if (notify) toast(`Bem-vindo, ${user.name}! ⚽`, 'success');
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

async function openPlayerModal(userId, name, pts, exact, correct) {
  document.getElementById('player-modal-title').textContent = `${name}`;
  document.getElementById('player-modal-body').innerHTML = '<div class="empty" style="padding:24px 0"><span class="icon">⏳</span>Carregando...</div>';
  document.getElementById('player-modal').classList.remove('hidden');
  document.getElementById('player-modal-overlay').classList.remove('hidden');

  const [bets, special] = await Promise.all([
    api(`/api/bets?user_id=${userId}`),
    api('/api/special-bets'),
  ]);

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
          <span style="font-weight:700">⚔️ vs você</span>
          <span style="color:var(--text-3)">${shared.length} jogo${shared.length!==1?'s':''} em comum</span>
          <span>Você: <strong>${myPts} pts</strong> · ${name}: <strong>${theirPts} pts</strong></span>
          <span class="rivalry-badge win">${wins}V</span>
          <span class="rivalry-badge draw">${draws}E</span>
          <span class="rivalry-badge loss">${losses}D</span>
        </div>`;
    }
  }

  document.getElementById('player-modal-body').innerHTML = `
    ${rivalryHtml}
    <div style="padding:16px 20px;border-bottom:1px solid var(--border);display:flex;gap:20px;flex-wrap:wrap">
      <div style="text-align:center"><div style="font-size:1.8rem;font-weight:900;color:var(--gold)">${pts}</div><div style="font-size:.72rem;color:var(--text-3)">pontos</div></div>
      <div style="text-align:center"><div style="font-size:1.4rem;font-weight:900;color:var(--green)">${exact}</div><div style="font-size:.72rem;color:var(--text-3)">🎯 exatos</div></div>
      <div style="text-align:center"><div style="font-size:1.4rem;font-weight:900;color:var(--blue)">${correct}</div><div style="font-size:.72rem;color:var(--text-3)">✅ certos</div></div>
      ${champBet ? `<div style="flex:1;min-width:120px"><div style="font-size:.7rem;color:var(--text-3);margin-bottom:2px">🏆 Campeão</div><div style="font-weight:700${champWon?' ;color:var(--gold)':''}">${champBet.team}${champWon?' ✓':''}</div></div>` : ''}
      ${scorerBet ? `<div style="flex:1;min-width:120px"><div style="font-size:.7rem;color:var(--text-3);margin-bottom:2px">⚽ Artilheiro</div><div style="font-weight:700${scorerWon?';color:var(--gold)':''}">${scorerBet.name}${scorerWon?' ✓':''}</div></div>` : ''}
    </div>
    <div style="padding:8px 20px 16px">
      ${betRows || '<div class="empty" style="padding:20px 0"><span class="icon">🎲</span>Sem palpites ainda.</div>'}
    </div>`;
}

async function renderUsersList() {
  const wrap = document.getElementById('users-list-wrap');
  wrap.innerHTML = '<div style="color:var(--text-3);font-size:.85rem;padding:8px 0">Carregando...</div>';
  const users = await api('/api/users');
  if (!Array.isArray(users) || !users.length) {
    wrap.innerHTML = '<div class="empty" style="padding:12px 0"><span class="icon">👤</span>Nenhum jogador ainda.</div>';
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
      `<button class="pill${lbStageFilter === null ? ' active' : ''}" onclick="setLbStage(null, this)">Geral</button>`,
      ...stagesWithFinished.map(s =>
        `<button class="pill${lbStageFilter === s ? ' active' : ''}" onclick="setLbStage('${s.replace(/'/g,"&#39;")}', this)">${s}</button>`
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
    wrap.innerHTML = '<div class="empty"><span class="icon">🏆</span>Ninguém no placar ainda.</div>';
    return;
  }
  const rankEmoji = ['🥇','🥈','🥉'];
  const rankClass = ['r1','r2','r3'];
  wrap.innerHTML = `
    <div class="lb-table">
      <div class="lb-header">
        <div>#</div><div>Jogador</div><div style="text-align:right">Pts</div>
        <div style="text-align:center">🎯</div><div style="text-align:center">✅</div>
      </div>
      ${data.map((p, i) => `
        <div class="lb-row ${currentUser?.id === p.id ? 'is-me' : ''}" onclick="openPlayerModal(${p.id},'${p.name.replace(/'/g,"&#39;")}',${p.total_points},${p.exact_scores},${p.correct_results})" style="cursor:pointer">
          <div class="lb-rank ${rankClass[i]||''}">${rankEmoji[i]||(i+1)}</div>
          <div>
            <div class="lb-name">${p.name}</div>
            <div class="lb-bets">${p.total_bets} palpite${p.total_bets!==1?'s':''}</div>
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

function standingsRow(t, i, extraCells = '') {
  const sg = t.GP - t.GC;
  return `<tr class="${i < 2 ? 'classified' : i === 2 ? 'possible' : ''}">
    <td class="td-pos">${i + 1}</td>
    <td class="td-team">${flag(t.team)}${t.team}</td>
    ${extraCells}
    <td>${t.J}</td><td>${t.V}</td><td>${t.E}</td><td>${t.D}</td>
    <td>${t.GP}</td><td>${t.GC}</td>
    <td class="${sg > 0 ? 'sg-pos' : sg < 0 ? 'sg-neg' : ''}">${sg > 0 ? '+' : ''}${sg}</td>
    <td class="td-pts">${t.Pts}</td>
  </tr>`;
}

function renderGroupStandings() {
  const wrap = document.getElementById('group-standings-container');
  if (!wrap) return;
  const groups = buildGroupStandings();
  if (!groups.length) {
    wrap.innerHTML = '<div class="empty"><span class="icon">📊</span>Nenhuma partida da fase de grupos cadastrada.</div>';
    return;
  }
  wrap.innerHTML = `
    <div class="standings-grid">
      ${groups.map(({ name, sorted }) => `
        <div class="standings-group">
          <div class="standings-title">Grupo ${name}</div>
          <table class="standings-table">
            <thead><tr>
              <th></th><th class="th-team">Seleção</th>
              <th title="Jogos">J</th><th title="Vitórias">V</th>
              <th title="Empates">E</th><th title="Derrotas">D</th>
              <th title="Gols pró">GP</th><th title="Gols contra">GC</th>
              <th title="Saldo">SG</th><th class="th-pts" title="Pontos">Pts</th>
            </tr></thead>
            <tbody>${sorted.map((t, i) => standingsRow(t, i)).join('')}</tbody>
          </table>
        </div>`).join('')}
    </div>
    <p class="standings-legend">
      <span class="legend-dot classified"></span> 1º e 2º classificados &nbsp;·&nbsp;
      <span class="legend-dot possible"></span> 3º lugar
    </p>`;
}

function renderThirdsRanking() {
  const wrap = document.getElementById('thirds-container');
  if (!wrap) return;
  const groups = buildGroupStandings();
  if (!groups.length) {
    wrap.innerHTML = '<div class="empty"><span class="icon">🥉</span>Nenhuma partida da fase de grupos cadastrada.</div>';
    return;
  }
  const thirds = groups
    .filter(g => g.sorted[2])
    .map(g => ({ ...g.sorted[2], group: g.name }))
    .sort((a, b) => (b.Pts - a.Pts) || ((b.GP - b.GC) - (a.GP - a.GC)) || (b.GP - a.GP) || a.team.localeCompare(b.team));

  wrap.innerHTML = `
    <p class="pane-sub" style="margin-bottom:16px">As <strong>8 melhores</strong> terceiras colocadas (de 12 grupos) avançam para as oitavas de final.</p>
    <div class="standings-group" style="max-width:580px">
      <table class="standings-table">
        <thead><tr>
          <th></th><th class="th-team">Seleção</th><th title="Grupo">Gr</th>
          <th title="Jogos">J</th><th title="Vitórias">V</th>
          <th title="Empates">E</th><th title="Derrotas">D</th>
          <th title="Gols pró">GP</th><th title="Gols contra">GC</th>
          <th title="Saldo">SG</th><th class="th-pts" title="Pontos">Pts</th>
        </tr></thead>
        <tbody>
          ${thirds.map((t, i) => {
            const sg = t.GP - t.GC;
            const rowClass = i < 8 ? 'classified' : 'eliminated';
            return `<tr class="${rowClass}">
              <td class="td-pos">${i + 1}</td>
              <td class="td-team">${flag(t.team)}${t.team}</td>
              <td style="color:var(--text-3);font-size:.78rem">${t.group}</td>
              <td>${t.J}</td><td>${t.V}</td><td>${t.E}</td><td>${t.D}</td>
              <td>${t.GP}</td><td>${t.GC}</td>
              <td class="${sg > 0 ? 'sg-pos' : sg < 0 ? 'sg-neg' : ''}">${sg > 0 ? '+' : ''}${sg}</td>
              <td class="td-pts">${t.Pts}</td>
            </tr>`;
          }).join('')}
        </tbody>
      </table>
    </div>
    <p class="standings-legend" style="max-width:580px;margin-top:10px">
      <span class="legend-dot classified"></span> Avança para as oitavas &nbsp;·&nbsp;
      <span class="legend-dot eliminated"></span> Eliminado
    </p>`;
}

/* ─── Bracket ────────────────────────────────────────────────────────────── */
const BRACKET_STAGES = ['32 avos de Final', 'Oitavas de Final', 'Quartas de Final', 'Semifinal', 'Final'];
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
        <p style="font-weight:700;font-size:1rem;margin-bottom:6px">Fase eliminatória a caminho</p>
        <p style="color:var(--text-3);font-size:.85rem">As partidas serão adicionadas pelo admin conforme os times se classificam.</p>
      </div>` : ''}
    <div class="bracket-wrapper">
      ${BRACKET_STAGES.map(stage => {
        const matches  = byStage[stage] || [];
        const expected = BRACKET_COUNTS[stage];
        const slots    = Math.max(matches.length, expected);

        return `
          <div class="bracket-col">
            <div class="bracket-col-title">${stage}</div>
            <div class="bracket-col-matches">
              ${matches.map(m => renderBracketCard(m)).join('')}
              ${Array.from({ length: slots - matches.length }, () => renderBracketCardEmpty()).join('')}
            </div>
          </div>`;
      }).join('<div class="bracket-connector">›</div>')}
    </div>
    ${thirdMatches.length ? `
      <div class="bracket-third">
        <div class="bracket-col-title" style="margin-bottom:10px">🥉 Terceiro Lugar</div>
        ${thirdMatches.map(renderBracketCard).join('')}
      </div>` : ''}`;
}

function renderBracketCard(m) {
  const finished  = m.status === 'finished';
  const homeWon   = finished && m.home_score > m.away_score;
  const awayWon   = finished && m.away_score > m.home_score;
  const myBet     = userBets[m.id];
  const matchDate = new Date(m.match_date);
  const dateShort = matchDate.toLocaleDateString('pt-BR', { day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit', timeZone:'Europe/Berlin' });
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
    betLine = `<div class="bracket-bet" style="color:var(--text-3);font-size:.72rem">⏳ apostas encerradas</div>`;
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
    betLine = `<div class="bracket-bet" style="color:var(--text-3);font-size:.72rem"><a href="#" onclick="openUserModal();return false;" style="color:var(--gold)">Entre</a> para apostar</div>`;
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
      <div class="bracket-team"><span class="bracket-team-name">A definir</span></div>
      <div class="bracket-team"><span class="bracket-team-name">A definir</span></div>
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
    wrap.innerHTML = '<div class="history-chart-wrap"><p class="hc-empty">Nenhum resultado registrado ainda.</p></div>';
    return;
  }

  // Collect all users that appear
  const userIds = [];
  const userNames = {};
  (history[0]?.snapshot || []).forEach(u => {
    userIds.push(u.id);
    userNames[u.id] = u.name;
  });
  if (!userIds.length) {
    wrap.innerHTML = '<div class="history-chart-wrap"><p class="hc-empty">Nenhum participante ainda.</p></div>';
    return;
  }

  // Build series: index → {userId → pts}
  const series = history.map(h => {
    const map = {};
    h.snapshot.forEach(u => { map[u.id] = u.pts; });
    return map;
  });

  const maxPts = Math.max(1, ...series.map(s => Math.max(...userIds.map(id => s[id] || 0))));
  const W = Math.max(400, history.length * 48);
  const H = 180;
  const PAD = { top: 12, right: 16, bottom: 32, left: 36 };
  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;

  const xScale = i => PAD.left + (history.length < 2 ? innerW / 2 : (i / (history.length - 1)) * innerW);
  const yScale = v => PAD.top + innerH - (v / maxPts) * innerH;

  const COLORS = ['#009C3B','#FFD600','#2563eb','#dc2626','#7c3aed','#f97316','#06b6d4','#84cc16'];

  // Grid lines
  const gridLines = [0, 0.25, 0.5, 0.75, 1].map(t => {
    const y = PAD.top + innerH * (1 - t);
    const val = Math.round(maxPts * t);
    return `<line x1="${PAD.left}" y1="${y}" x2="${PAD.left + innerW}" y2="${y}" stroke="var(--border)" stroke-width="1"/>
            <text x="${PAD.left - 5}" y="${y + 4}" text-anchor="end" font-size="10" fill="var(--text-3)">${val}</text>`;
  }).join('');

  // X axis labels (every N steps to avoid crowding)
  const step = Math.ceil(history.length / 10);
  const xLabels = history.map((h, i) => {
    if (i % step !== 0 && i !== history.length - 1) return '';
    const x = xScale(i);
    const label = h.label.split(' ')[0]; // first word
    return `<text x="${x}" y="${H - 4}" text-anchor="middle" font-size="9" fill="var(--text-3)" transform="rotate(-35,${x},${H - 4})">${label}</text>`;
  }).join('');

  // Lines & dots per user
  const lines = userIds.map((id, ci) => {
    const color = COLORS[ci % COLORS.length];
    const pts = history.map((_, i) => series[i][id] || 0);
    const d = pts.map((v, i) => `${i === 0 ? 'M' : 'L'}${xScale(i).toFixed(1)},${yScale(v).toFixed(1)}`).join(' ');
    const lastX = xScale(history.length - 1);
    const lastY = yScale(pts[pts.length - 1]);
    const dots = pts.map((v, i) => {
      if (i !== 0 && i !== pts.length - 1 && pts[i] === pts[i - 1]) return '';
      return `<circle cx="${xScale(i).toFixed(1)}" cy="${yScale(v).toFixed(1)}" r="3" fill="${color}"/>`;
    }).join('');
    return `<path d="${d}" fill="none" stroke="${color}" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round"/>
            ${dots}
            <text x="${lastX + 5}" y="${lastY + 4}" font-size="10" fill="${color}" font-weight="700">${userNames[id].split(' ')[0]}</text>`;
  }).join('');

  wrap.innerHTML = `<div class="history-chart-wrap">
    <svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" style="min-width:${W}px">
      ${gridLines}
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
    ? '<span class="special-card-open">🟢 Apostas abertas</span>'
    : '<span class="special-card-closed">🔒 Apostas encerradas</span>';

  const renderRows = (bets, resultVal, getVal) =>
    bets.length === 0
      ? '<p style="color:var(--text-3);font-size:.8rem;padding:8px 0">Nenhum palpite ainda.</p>'
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
      <div class="special-card-title">🏆 Campeão</div>
      ${statusBadge}
      ${champResult ? `<div class="special-card-result">✓ ${champResult}</div>` : ''}
      ${renderRows(champBets, champResult, getChampVal)}
    </div>
    <div class="special-card">
      <div class="special-card-title">⚽ Artilheiro</div>
      ${statusBadge}
      ${scorerResult ? `<div class="special-card-result">✓ ${scorerResult}</div>` : ''}
      ${renderRows(scorerBets, scorerResult, getScorerVal)}
    </div>`;
}

function renderFeed(feed) {
  const wrap = document.getElementById('feed-container');
  if (!wrap) return;
  if (!feed?.length) {
    wrap.innerHTML = '<p class="feed-empty">Nenhum resultado registrado ainda.</p>';
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
        ${chips ? `<div class="feed-results">${chips}</div>` : '<p style="color:var(--text-3);font-size:.8rem">Sem palpites.</p>'}
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
          <div><div class="feed-title">🏆 Campeão: ${entry.team}</div><div class="feed-date">${fmtDate(entry.timestamp)}</div></div>
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
          <div><div class="feed-title">⚽ Artilheiro: ${entry.name}</div><div class="feed-date">${fmtDate(entry.timestamp)}</div></div>
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
    document.getElementById('matches-user-hint').textContent = `Apostando como: ${currentUser.name}`;
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
        ${s === 'all' ? 'Todas etapas' : s}
      </button>`).join('');
  }

  document.getElementById('view-toggle-row').innerHTML = `
    <button class="pill ${viewMode === 'grouped'       ? 'active' : ''}" onclick="setViewMode('grouped',this)">📊 Por Grupo</button>
    <button class="pill ${viewMode === 'chronological' ? 'active' : ''}" onclick="setViewMode('chronological',this)">📅 Cronológico</button>
    <button class="btn btn-ghost btn-sm" style="margin-left:auto" onclick="toggleAllGroups()" title="Expandir/colapsar tudo">⊞</button>
    ${currentUser ? `<button class="btn btn-ghost btn-sm" onclick="randomizeBets()" title="Preencher palpites aleatórios nos jogos ainda não apostados">🎲 Randomizar</button>` : ''}
    ${currentUser ? `<button class="btn btn-ghost btn-sm" style="color:var(--red)" onclick="confirmClearBets()" title="Apagar todos os seus palpites em jogos ainda não iniciados">🗑 Limpar</button>` : ''}`;
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

function renderMatches() {
  const container = document.getElementById('matches-container');
  let list = allMatches;
  if (statusFilter === 'upcoming') list = list.filter(m => m.status === 'upcoming');
  if (statusFilter === 'finished') list = list.filter(m => m.status === 'finished');
  if (stageFilter  !== 'all')      list = list.filter(m => m.stage === stageFilter);

  if (!list.length) {
    container.innerHTML = '<div class="empty"><span class="icon">⚽</span>Nenhuma partida encontrada.</div>';
    return;
  }

  if (viewMode === 'chronological') {
    container.innerHTML = renderSections(list, m => m.match_date.slice(0, 10), key => {
      const d = new Date(key + 'T12:00:00Z');
      const label = d.toLocaleDateString('pt-BR', { weekday:'long', day:'2-digit', month:'long', timeZone:'Europe/Berlin' });
      const cap   = label.charAt(0).toUpperCase() + label.slice(1);
      return { name: cap, sub: null };
    });
  } else {
    container.innerHTML = renderSections(list, m => m.group_name ? `${m.stage}|||${m.group_name}` : m.stage, key => {
      const [stage, group] = key.split('|||');
      return group ? { name: `Grupo ${group}`, sub: stage } : { name: stage, sub: null };
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

  return Object.entries(sections).sort(([a], [b]) => a.localeCompare(b)).map(([key, matches]) => {
    const collapsed  = collapsedGroups.has(key);
    const { name, sub } = labelFn(key);

    const openCount  = matches.filter(m => m.status === 'upcoming' && Date.now() < new Date(m.match_date)).length;
    const doneCount  = matches.filter(m => m.status === 'finished').length;
    const myBets     = matches.filter(m => userBets[m.id] !== undefined).length;

    const teams = [...new Set(matches.flatMap(m => [m.home_team, m.away_team]))];

    const stats = [
      openCount > 0 ? `<span class="gstat gstat-open">${openCount} abertas</span>`    : '',
      doneCount > 0 ? `<span class="gstat gstat-done">${doneCount} encerradas</span>` : '',
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
    const now = Date.now();
    document.querySelectorAll('.match-countdown[data-ts]').forEach(el => {
      const ts = Number(el.dataset.ts);
      const remaining = ts - now;
      const label = fmtCountdown(remaining);
      if (label) {
        el.textContent = label;
        // urgent styling when under 30 min
        el.classList.toggle('countdown-urgent', remaining < 30 * 60 * 1000);
      } else {
        // time's up — re-render matches to lock the bet input
        clearInterval(_countdownTimer);
        _countdownTimer = null;
        renderMatches();
      }
    });
  }, 1000);
}

function renderMatchCard(m) {
  const bet      = userBets[m.id];
  const finished = m.status === 'finished';
  const matchDate = new Date(m.match_date);
  const isPast   = Date.now() > matchDate.getTime() - 5 * 60 * 1000;
  const msLeft   = matchDate.getTime() - Date.now();
  const showCountdown = !finished && msLeft > 0 && msLeft < 48 * 60 * 60 * 1000;

  const dateStr = matchDate.toLocaleDateString('pt-BR', { day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit', timeZone:'Europe/Berlin' });

  let badge;
  if (finished)     badge = '<span class="badge badge-finished">Encerrado</span>';
  else if (isPast)  badge = '<span class="badge badge-closed">Em breve</span>';
  else              badge = '<span class="badge badge-open">Aberto</span>';

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
            <span class="bet-label">Palpite:</span>
            <span class="bet-prediction">${bet.home_score}×${bet.away_score}</span>
            <span class="pts-chip ${chipClass}">${pts} pt${pts!==1?'s':''}</span>
            <span>${emoji}</span>
           </div>`
        : `<span class="no-bet-msg">Sem palpite</span>`}
    </div>`;
  } else if (isPast) {
    betBar = `<div class="bet-bar"><span class="no-bet-msg">⏳ Apostas encerradas${bet ? ` · Palpite: <strong>${bet.home_score}×${bet.away_score}</strong>` : ''}</span></div>`;
  } else if (!currentUser) {
    betBar = `<div class="bet-bar"><span class="no-bet-msg"><a href="#" onclick="openUserModal();return false;">Entre</a> para apostar</span></div>`;
  } else {
    const hasBet = bet !== undefined;
    betBar = `<div class="bet-bar">
      <span class="bet-label">Palpite:</span>
      <div class="bet-inputs">
        <input type="number" class="bet-score-input" id="bh-${m.id}" min="0" max="20"
          value="${hasBet ? bet.home_score : ''}" placeholder="0"
          onblur="autoSaveBet(${m.id})" onkeydown="if(event.key==='Enter'){this.blur()}">
        <span class="bet-x">×</span>
        <input type="number" class="bet-score-input" id="ba-${m.id}" min="0" max="20"
          value="${hasBet ? bet.away_score : ''}" placeholder="0"
          onblur="autoSaveBet(${m.id})" onkeydown="if(event.key==='Enter'){this.blur()}">
      </div>
      <span class="auto-bet-status" id="abs-${m.id}">${hasBet ? '✓' : ''}</span>
    </div>`;
  }

  // "Ver palpites" toggle — visible whenever there are bets
  const toggleLabel = isPast
    ? `${expandedBets.has(m.id) ? '▲' : '▼'} Ver palpites (${m.bet_count})`
    : `👥 ${m.bet_count} apostaram`;
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
      <span class="bsr-label">Tendência</span>
      <div class="bsr-bar-wrap">
        <div class="bsr-seg bsr-home" style="width:${pHome}%" title="Casa: ${pHome}%">${pHome > 12 ? pHome + '%' : ''}</div>
        <div class="bsr-seg bsr-draw" style="width:${pDraw}%" title="Empate: ${pDraw}%">${pDraw > 12 ? pDraw + '%' : ''}</div>
        <div class="bsr-seg bsr-away" style="width:${pAway}%" title="Visitante: ${pAway}%">${pAway > 12 ? pAway + '%' : ''}</div>
      </div>
      <div class="bsr-legend">
        <span style="color:var(--green)">⬤ Casa ${pHome}%</span>
        <span style="color:var(--text-3)">⬤ Emp ${pDraw}%</span>
        <span style="color:var(--red)">⬤ Visit ${pAway}%</span>
      </div>
    </div>
    <div class="bet-stats-pills">
      <div class="bsp-item"><span class="bsp-val">${avgHome} × ${avgAway}</span><span class="bsp-sub">média de gols</span></div>
      <div class="bsp-item"><span class="bsp-val">${topScore[0]}</span><span class="bsp-sub">placar mais apostado (${topScore[1]}x)</span></div>
      <div class="bsp-item"><span class="bsp-val">${bigGame.home_score} × ${bigGame.away_score}</span><span class="bsp-sub">maior goleada prevista</span></div>
    </div>
  </div>`;
}

function renderAllBets(matchId, hideScores) {
  const bets = matchBetsCache[matchId];
  if (!bets) return '<div class="all-bets-list" style="color:var(--text-3);font-size:.8rem">Carregando...</div>';
  if (!bets.length) return '<div class="all-bets-list" style="color:var(--text-3);font-size:.8rem">Nenhum palpite.</div>';
  if (hideScores) {
    const names = bets.map(b => `<span class="feed-chip"><span class="fc-name">${b.user_name}</span></span>`).join('');
    return renderMatchBetStats(bets) + `<div class="all-bets-list">${names}</div>`;
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
    btn.innerHTML = hideScores ? `👥 ${count} apostaram` : `▼ Ver palpites (${count})`;
  } else {
    expandedBets.add(matchId);
    btn.innerHTML = hideScores ? `👥 ${count} apostaram` : `▲ Ver palpites (${count})`;
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
  if (!currentUser) { toast('Selecione seu perfil primeiro', 'error'); return; }
  const hs  = parseInt(document.getElementById(`bh-${matchId}`).value);
  const as_ = parseInt(document.getElementById(`ba-${matchId}`).value);
  if (isNaN(hs) || isNaN(as_) || hs < 0 || as_ < 0) { toast('Preencha os dois placares', 'error'); return; }
  const result = await api('/api/bets', 'POST', { user_id: currentUser.id, match_id: matchId, home_score: hs, away_score: as_ });
  if (result.error) { toast(result.error, 'error'); return; }
  userBets[matchId] = result;
  toast('Palpite salvo! ✓', 'success');
  renderMatches();
  loadLeaderboard();
}

async function autoSaveBet(matchId) {
  if (!currentUser) return;
  const hInput = document.getElementById(`bh-${matchId}`);
  const aInput = document.getElementById(`ba-${matchId}`);
  if (!hInput || !aInput) return;
  const hs  = parseInt(hInput.value);
  const as_ = parseInt(aInput.value);
  if (isNaN(hs) || isNaN(as_) || hs < 0 || as_ < 0) return;
  const statusEl = document.getElementById(`abs-${matchId}`);
  if (statusEl) { statusEl.textContent = '…'; statusEl.className = 'auto-bet-status saving'; }
  const result = await api('/api/bets', 'POST', { user_id: currentUser.id, match_id: matchId, home_score: hs, away_score: as_ });
  if (result.error) {
    if (statusEl) { statusEl.textContent = '✗'; statusEl.className = 'auto-bet-status error'; }
    toast(result.error, 'error');
    return;
  }
  userBets[matchId] = result;
  if (statusEl) { statusEl.textContent = '✓'; statusEl.className = 'auto-bet-status saved'; }
  loadLeaderboard();
}

async function confirmClearBets() {
  if (!currentUser) return;
  if (!confirm('Apagar todos os seus palpites em jogos que ainda não começaram?\n\nEssa ação não pode ser desfeita.')) return;
  const result = await api('/api/bets', 'DELETE', { user_id: currentUser.id });
  if (result.error) { toast(result.error, 'error'); return; }
  const n = result.deleted;
  Object.keys(userBets).forEach(id => {
    const m = allMatches.find(m => m.id === Number(id));
    if (m && m.status === 'upcoming' && new Date(m.match_date) > new Date()) delete userBets[id];
  });
  toast(`${n} palpite${n !== 1 ? 's' : ''} apagado${n !== 1 ? 's' : ''}`, n > 0 ? 'success' : 'info');
  renderMatches();
  loadLeaderboard();
}

function randScore() {
  // Weighted distribution: most games are low-scoring
  const goals = [0,0,0,1,1,1,1,2,2,2,3,3,4];
  return goals[Math.floor(Math.random() * goals.length)];
}

async function randomizeBets() {
  if (!currentUser) { toast('Selecione seu perfil primeiro', 'error'); return; }
  const now = Date.now();
  const open = allMatches.filter(m =>
    m.status === 'upcoming' &&
    now < new Date(m.match_date).getTime() - 5 * 60 * 1000 &&
    !userBets[m.id]
  );
  if (!open.length) { toast('Sem jogos abertos sem palpite', 'info'); return; }

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
  toast(`${saved} palpite${saved !== 1 ? 's' : ''} aleatório${saved !== 1 ? 's' : ''} salvo${saved !== 1 ? 's' : ''}! 🎲`, 'success');
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
    const label = stage.replace('Fase de ','').replace(' de Final','').replace('Semifinal','Semi').replace('Terceiro Lugar','3º Lugar');
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
  const goalDiffLabel = goalDiff > 0.1 ? `+${goalDiff.toFixed(1)} acima` : goalDiff < -0.1 ? `${goalDiff.toFixed(1)} abaixo` : 'na média';

  el.innerHTML = `
    <div class="section-divider"><span>📊 Estatísticas Detalhadas</span></div>
    <div class="dstats-grid">
      <div class="dstat-card">
        <div class="dstat-title">🔥 Sequência atual</div>
        <div class="dstat-val${currentStreak >= 3 ? ' hot' : ''}">${currentStreak}</div>
        <div class="dstat-sub">melhor: ${bestStreak}</div>
      </div>
      <div class="dstat-card">
        <div class="dstat-title">📈 Média de pontos</div>
        <div class="dstat-val">${avgPts.toFixed(2)}</div>
        <div class="dstat-sub">por jogo encerrado</div>
      </div>
      <div class="dstat-card">
        <div class="dstat-title">⚽ Gols previstos</div>
        <div class="dstat-val">${predGoals.toFixed(1)}</div>
        <div class="dstat-sub">real: ${realGoals.toFixed(1)} · ${goalDiffLabel}</div>
      </div>
      <div class="dstat-card">
        <div class="dstat-title">🎯 Jogos analisados</div>
        <div class="dstat-val">${finishedCount}</div>
        <div class="dstat-sub">com resultado</div>
      </div>
    </div>
    ${stageEntries.length ? `<div class="dstat-section-card"><div class="dstat-section-title">Pontos por fase</div><div class="stage-bars">${stageBars}</div></div>` : ''}
    ${total > 0 ? `
    <div class="dstat-section-card">
      <div class="dstat-section-title">Estilo de apostas</div>
      <div class="bet-style-row">
        <div class="bet-style-item">
          <div class="bet-style-pct">${pct(homeWins)}%</div>
          <div class="bet-style-bar-wrap">${styleBar(homeWins, 'home')}</div>
          <div class="bet-style-label">Casa</div>
          <div class="bet-style-n">${homeWins}</div>
        </div>
        <div class="bet-style-item">
          <div class="bet-style-pct">${pct(draws)}%</div>
          <div class="bet-style-bar-wrap">${styleBar(draws, 'draw')}</div>
          <div class="bet-style-label">Empate</div>
          <div class="bet-style-n">${draws}</div>
        </div>
        <div class="bet-style-item">
          <div class="bet-style-pct">${pct(awayWins)}%</div>
          <div class="bet-style-bar-wrap">${styleBar(awayWins, 'away')}</div>
          <div class="bet-style-label">Visitante</div>
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
    if (!award) return `<div class="award-card award-empty"><div class="award-emoji">${emoji}</div><div class="award-title">${title}</div><div class="award-empty-msg">Sem dados ainda</div></div>`;
    return `<div class="award-card" onclick="openPlayerModal(${award.id},'${award.name.replace(/'/g,"&#39;")}',0,0,0)" style="cursor:pointer">
      <div class="award-emoji">${emoji}</div>
      <div class="award-title">${title}</div>
      <div class="award-winner">${award.name}</div>
      <div class="award-value">${valueFn(award)}</div>
      ${subFn ? `<div class="award-sub">${subFn(award)}</div>` : ''}
    </div>`;
  };

  el.innerHTML = `<div class="awards-grid">
    ${card('🎯','Rei do Placar Exato', awards.rei_exato,
      a => `${a.exactScores} exato${a.exactScores!==1?'s':''}`,
      a => `em ${a.finishedCount} jogos`)}
    ${card('🔥','Maior Sequência', awards.maior_streak,
      a => `${a.currentStreak || a.bestStreak} seguidos`,
      a => a.currentStreak > 0 ? 'sequência ativa' : `melhor: ${a.bestStreak}`)}
    ${card('💪','Mais Consistente', awards.mais_consistente,
      a => `${Math.round(a.accuracy*100)}% de acerto`,
      a => `mín. 5 jogos · ${a.finishedCount} analisados`)}
    ${card('🤯','Maior Zebra', awards.maior_zebra,
      a => `${a.upsets} zebra${a.upsets!==1?'s':''}`,
      () => 'acertou vitórias visitantes')}
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
      <div style="color:var(--text-3);font-size:.8rem;margin-top:2px">${me.total_bets||0} palpites</div>
    </div>
    <div style="text-align:right">
      <div class="me-pts">${me.total_points||0}</div>
      <div class="me-pts-label">pontos</div>
    </div>`;

  // Stats
  const total     = me.total_bets || 0;
  const finished  = (bets||[]).filter(b => b.status === 'finished').length;
  const accuracy  = finished > 0 ? Math.round(((me.exact_scores||0) + (me.correct_results||0)) / finished * 100) : 0;
  document.getElementById('me-stats').innerHTML = `
    <div class="me-stat-card"><div class="me-stat-val" style="color:var(--gold)">${me.total_points||0}</div><div class="me-stat-label">Pontos</div></div>
    <div class="me-stat-card"><div class="me-stat-val" style="color:var(--green)">${me.exact_scores||0}</div><div class="me-stat-label">🎯 Exatos</div></div>
    <div class="me-stat-card"><div class="me-stat-val" style="color:var(--blue)">${me.correct_results||0}</div><div class="me-stat-label">✅ Certos</div></div>
    <div class="me-stat-card"><div class="me-stat-val">${accuracy}%</div><div class="me-stat-label">Acerto</div></div>`;

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
      <div class="special-card-title">🏆 Meu palpite de campeão</div>
      ${champResult ? (champWon ? '<div class="special-card-result">✓ Acertou! +10 pts</div>' : `<div class="special-card-closed">✗ Era ${champResult}</div>`) : ''}
      ${champBet
        ? `<div style="font-weight:700;margin-bottom:${isOpen&&!champResult?'8':'0'}px">${champBet.team}</div>`
        : `<div style="color:var(--text-3);font-size:.85rem;margin-bottom:${isOpen?'8':'0'}px">Sem palpite</div>`}
      ${isOpen && !champResult ? `
        <div class="special-input-row">
          ${renderChampionPicker(champBet?.team||'')}
          <button class="btn btn-primary btn-sm" onclick="saveMyChamp()">Salvar</button>
        </div>` : ''}
    </div>
    <div class="special-card">
      <div class="special-card-title">⚽ Meu palpite de artilheiro</div>
      ${scorerResult ? (scorerWon ? '<div class="special-card-result">✓ Acertou! +5 pts</div>' : `<div class="special-card-closed">✗ Era ${scorerResult}</div>`) : ''}
      ${scorerBet
        ? `<div style="font-weight:700;margin-bottom:${isOpen&&!scorerResult?'8':'0'}px">${scorerBet.name}</div>`
        : `<div style="color:var(--text-3);font-size:.85rem;margin-bottom:${isOpen?'8':'0'}px">Sem palpite</div>`}
      ${isOpen && !scorerResult ? `
        <div class="special-input-row">
          <input type="text" class="input" id="my-scorer-input" placeholder="Nome do jogador" value="${scorerBet?.name||''}">
          <button class="btn btn-primary btn-sm" onclick="saveMyScorer()">Salvar</button>
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
      <div class="me-bet-score">Palpite: <span class="me-bet-result-score">${b.home_score}×${b.away_score}</span></div>
      ${finished && match ? `<div class="me-bet-score">Placar: <span class="me-bet-result-score">${match.home_score}×${match.away_score}</span></div>` : ''}
      <span class="pts-chip ${chipClass}">${chipLabel}</span>
    </div>`;
  }).join('') : '<div class="empty" style="padding:24px 0"><span class="icon">🎲</span>Nenhum palpite ainda.</div>';
}

async function saveMyChamp() {
  if (!currentUser) return;
  const team = _champPickerSelected;
  if (!team) { toast('Escolha um time', 'error'); return; }
  const res = await api('/api/champion-bet', 'POST', { user_id: currentUser.id, team });
  if (res.error) { toast(res.error, 'error'); return; }
  toast('Palpite de campeão salvo! 🏆', 'success');
  loadMyPage();
  loadSpecialAndFeed();
}

async function saveMyScorer() {
  if (!currentUser) return;
  const name = document.getElementById('my-scorer-input')?.value.trim();
  if (!name) { toast('Informe o jogador', 'error'); return; }
  const res = await api('/api/scorer-bet', 'POST', { user_id: currentUser.id, name });
  if (res.error) { toast(res.error, 'error'); return; }
  toast('Palpite de artilheiro salvo! ⚽', 'success');
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
  toast('Acesso liberado ✓', 'success');
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
        <button class="btn btn-danger btn-sm"    onclick="adminDeleteMatch(${m.id})">✕</button>
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
    ${s.not_found > 0 ? `<p class="card-sub" style="margin-top:6px">⚠️ ${s.not_found} partida(s) não encontradas na API (podem ter nomes diferentes).</p>` : ''}`;
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
  toast(`${res.imported} partidas importadas com sucesso!`, 'success');
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
  btn.textContent = '💾 Backup manual';
  if (res.error || !res.ok) {
    toast(res.error || 'Erro ao fazer backup', 'error');
  } else {
    toast('Backup enviado para o Gist com sucesso!', 'success');
  }
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
  return new Date(str).toLocaleDateString('pt-BR', { day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit', timeZone:'Europe/Berlin' });
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
