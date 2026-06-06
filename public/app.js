/* ─── State ──────────────────────────────────────────────────────────────── */
let currentUser    = null;
let allMatches     = [];
let userBets       = {};
let matchBetsCache = {};
let expandedBets   = new Set();
let statusFilter   = 'all';
let stageFilter    = 'all';
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
});

async function loadAll() {
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
  const data = await api('/api/leaderboard') || [];
  const wrap = document.getElementById('lb-container');
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
        <div class="lb-row ${currentUser?.id === p.id ? 'is-me' : ''}">
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

/* ─── Bracket tab ───────────────────────────────────────────────────────── */
function renderBracketTab() {
  renderGroupStandings();
  renderBracket();
}

function showBracketTab(tab, btn) {
  document.querySelectorAll('#tab-bracket .inner-tab').forEach(t => t.classList.remove('active'));
  btn.classList.add('active');
  document.getElementById('brtab-standings').classList.toggle('hidden', tab !== 'standings');
  document.getElementById('brtab-bracket').classList.toggle('hidden',   tab !== 'bracket');
}

/* ─── Group standings ────────────────────────────────────────────────────── */
function renderGroupStandings() {
  const wrap = document.getElementById('group-standings-container');
  if (!wrap) return;

  const groupMatches = allMatches.filter(m => m.stage === 'Fase de Grupos');
  if (!groupMatches.length) {
    wrap.innerHTML = '<div class="empty"><span class="icon">📊</span>Nenhuma partida da fase de grupos cadastrada.</div>';
    return;
  }

  // Build per-group standings
  const groups = {};
  groupMatches.forEach(m => {
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

  const sortedGroups = Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));

  wrap.innerHTML = `<div class="standings-grid">` + sortedGroups.map(([groupName, teams]) => {
    const sorted = Object.values(teams).sort((a, b) =>
      (b.Pts - a.Pts) || ((b.GP - b.GC) - (a.GP - a.GC)) || (b.GP - a.GP) || a.team.localeCompare(b.team)
    );
    return `
      <div class="standings-group">
        <div class="standings-title">Grupo ${groupName}</div>
        <table class="standings-table">
          <thead><tr>
            <th></th><th class="th-team">Seleção</th>
            <th title="Jogos">J</th><th title="Vitórias">V</th>
            <th title="Empates">E</th><th title="Derrotas">D</th>
            <th title="Gols pró">GP</th><th title="Gols contra">GC</th>
            <th title="Saldo">SG</th><th title="Pontos" class="th-pts">Pts</th>
          </tr></thead>
          <tbody>
            ${sorted.map((t, i) => {
              const sg = t.GP - t.GC;
              const rowClass = i < 2 ? 'classified' : i === 2 ? 'possible' : '';
              return `<tr class="${rowClass}">
                <td class="td-pos">${i + 1}</td>
                <td class="td-team">${t.team}</td>
                <td>${t.J}</td><td>${t.V}</td><td>${t.E}</td><td>${t.D}</td>
                <td>${t.GP}</td><td>${t.GC}</td>
                <td class="${sg > 0 ? 'sg-pos' : sg < 0 ? 'sg-neg' : ''}">${sg > 0 ? '+' : ''}${sg}</td>
                <td class="td-pts">${t.Pts}</td>
              </tr>`;
            }).join('')}
          </tbody>
        </table>
      </div>`;
  }).join('') + `</div>
  <p class="standings-legend">
    <span class="legend-dot classified"></span> Classificados para oitavas
    &nbsp;·&nbsp;
    <span class="legend-dot possible"></span> Possível 3º lugar melhor
  </p>`;
}

/* ─── Bracket ────────────────────────────────────────────────────────────── */
const BRACKET_STAGES = ['Oitavas de Final', 'Quartas de Final', 'Semifinal', 'Final'];
const BRACKET_COUNTS = { 'Oitavas de Final': 16, 'Quartas de Final': 8, 'Semifinal': 4, 'Final': 1 };

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
  const dateShort = matchDate.toLocaleDateString('pt-BR', { day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit' });

  let betLine = '';
  if (finished && myBet) {
    const cls = myBet.points===3 ? 'pts-3' : myBet.points===1 ? 'pts-1' : 'pts-0';
    const emoji = myBet.points===3 ? '🎯' : myBet.points===1 ? '✅' : '❌';
    betLine = `<div class="bracket-bet"><span class="pts-chip ${cls}" style="font-size:.7rem;padding:2px 7px">${myBet.home_score}-${myBet.away_score} · ${myBet.points}pt ${emoji}</span></div>`;
  } else if (!finished && myBet) {
    betLine = `<div class="bracket-bet" style="color:var(--gold);font-size:.72rem">✓ ${myBet.home_score}-${myBet.away_score}</div>`;
  }

  return `
    <div class="bracket-card ${finished ? 'finished' : ''}">
      <div class="bracket-team ${homeWon ? 'winner' : finished ? 'loser' : ''}">
        <span class="bracket-team-name">${m.home_team}</span>
        ${finished ? `<span class="bracket-team-score">${m.home_score}</span>` : ''}
      </div>
      <div class="bracket-team ${awayWon ? 'winner' : finished ? 'loser' : ''}">
        <span class="bracket-team-name">${m.away_team}</span>
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

/* ─── Special bets + Feed ────────────────────────────────────────────────── */
async function loadSpecialAndFeed() {
  const [special, feed] = await Promise.all([
    api('/api/special-bets'),
    api('/api/feed'),
  ]);
  renderSpecialGrid(special, 'special-grid');
  renderFeed(feed);
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
    <button class="btn btn-ghost btn-sm" style="margin-left:auto" onclick="toggleAllGroups()" title="Expandir/colapsar tudo">⊞</button>`;
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
  return [...new Set(list.map(m => m.group_name ? `${m.stage} — Grupo ${m.group_name}` : m.stage))];
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
      const label = d.toLocaleDateString('pt-BR', { weekday:'long', day:'2-digit', month:'long' });
      const cap   = label.charAt(0).toUpperCase() + label.slice(1);
      return { name: cap, sub: null };
    });
  } else {
    container.innerHTML = renderSections(list, m => m.group_name ? `${m.stage}|||${m.group_name}` : m.stage, key => {
      const [stage, group] = key.split('|||');
      return group ? { name: `Grupo ${group}`, sub: stage } : { name: stage, sub: null };
    });
  }
}

function renderSections(list, keyFn, labelFn) {
  const sections = {};
  list.forEach(m => {
    const k = keyFn(m);
    (sections[k] = sections[k] || []).push(m);
  });

  return Object.entries(sections).map(([key, matches]) => {
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
        <button class="group-header" onclick="toggleGroup(${JSON.stringify(key)})">
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

function renderMatchCard(m) {
  const bet      = userBets[m.id];
  const finished = m.status === 'finished';
  const matchDate = new Date(m.match_date);
  const isPast   = Date.now() > matchDate.getTime();

  const dateStr = matchDate.toLocaleDateString('pt-BR', { day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit' });

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
    betBar = `<div class="bet-bar">
      <span class="bet-label">Palpite:</span>
      <div class="bet-inputs">
        <input type="number" class="bet-score-input" id="bh-${m.id}" min="0" max="20"
          value="${bet !== undefined ? bet.home_score : ''}" placeholder="0">
        <span class="bet-x">×</span>
        <input type="number" class="bet-score-input" id="ba-${m.id}" min="0" max="20"
          value="${bet !== undefined ? bet.away_score : ''}" placeholder="0">
      </div>
      <div class="bet-status">
        ${bet !== undefined ? '<span class="saved-tag">✓ Salvo</span>' : ''}
        <button class="btn btn-primary btn-sm" onclick="saveBet(${m.id})">
          ${bet !== undefined ? 'Atualizar' : 'Apostar'}
        </button>
      </div>
    </div>`;
  }

  // "Ver palpites" toggle (only after match deadline)
  const showAllBetsToggle = isPast && m.bet_count > 0
    ? `<button class="all-bets-toggle" onclick="toggleAllBets(${m.id}, this)">
        ${expandedBets.has(m.id) ? '▲' : '▼'} Ver palpites (${m.bet_count})
       </button>
       <div class="all-bets-section" id="all-bets-${m.id}" ${expandedBets.has(m.id)?'':'style="display:none"'}>
         ${renderAllBets(m.id)}
       </div>`
    : '';

  return `
    <div class="match-card ${finished?'finished':''} ${bet!==undefined&&!finished?'has-bet':''}">
      <div class="match-meta">
        <span>📅 ${dateStr}${m.venue ? ` · 📍 ${m.venue}` : ''}</span>
        ${badge}
      </div>
      <div class="match-teams">
        <div class="team-name home">${m.home_team}</div>
        ${vsBlock}
        <div class="team-name away">${m.away_team}</div>
      </div>
      ${betBar}
      ${showAllBetsToggle}
    </div>`;
}

function renderAllBets(matchId) {
  const bets = matchBetsCache[matchId];
  if (!bets) return '<div class="all-bets-list" style="color:var(--text-3);font-size:.8rem">Carregando...</div>';
  if (!bets.length) return '<div class="all-bets-list" style="color:var(--text-3);font-size:.8rem">Nenhum palpite.</div>';
  const chips = bets.map(b => {
    const cls = b.points === 3 ? 'pts-3' : b.points === 1 ? 'pts-1' : b.points === 0 && b.status === 'finished' ? 'pts-0' : '';
    return `<div class="feed-chip ${cls}">
      <span class="fc-name">${b.user_name}</span>
      <span class="fc-score">${b.home_score}×${b.away_score}</span>
      ${b.status==='finished'?`<span class="fc-pts">${b.points}pt</span>`:''}
    </div>`;
  }).join('');
  return `<div class="all-bets-list">${chips}</div>`;
}

async function toggleAllBets(matchId, btn) {
  if (expandedBets.has(matchId)) {
    expandedBets.delete(matchId);
    document.getElementById(`all-bets-${matchId}`).style.display = 'none';
    btn.innerHTML = `▼ Ver palpites (${allMatches.find(m=>m.id===matchId)?.bet_count||''})`;
  } else {
    expandedBets.add(matchId);
    btn.innerHTML = `▲ Ver palpites (${allMatches.find(m=>m.id===matchId)?.bet_count||''})`;
    if (!matchBetsCache[matchId]) {
      const bets = await api(`/api/bets?match_id=${matchId}`);
      matchBetsCache[matchId] = bets || [];
    }
    const section = document.getElementById(`all-bets-${matchId}`);
    section.innerHTML = renderAllBets(matchId);
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
          <input type="text" class="input" id="my-champ-input" placeholder="Time campeão" value="${champBet?.team||''}">
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
  const team = document.getElementById('my-champ-input')?.value.trim();
  if (!team) { toast('Informe o time', 'error'); return; }
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
  return new Date(str).toLocaleDateString('pt-BR', { day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' });
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
