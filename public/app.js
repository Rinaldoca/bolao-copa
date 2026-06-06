/* ─── State ──────────────────────────────────────────────────────────────── */
let currentUser   = null;
let allMatches    = [];
let userBets      = {};   // match_id → bet object
let matchFilter   = 'all';
let adminPwd      = null;

/* ─── Bootstrap ──────────────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  const saved = localStorage.getItem('bolao_user');
  if (saved) try { setUser(JSON.parse(saved), false); } catch {}
  loadLeaderboard();
  loadMatches();
});

/* ─── API helper ─────────────────────────────────────────────────────────── */
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

/* ─── Tab routing ────────────────────────────────────────────────────────── */
function showTab(name) {
  document.querySelectorAll('.tab-pane').forEach(el => el.classList.add('hidden'));
  document.querySelectorAll('.tab').forEach(el => el.classList.remove('active'));
  document.getElementById(`tab-${name}`).classList.remove('hidden');
  document.querySelector(`.tab[data-tab="${name}"]`).classList.add('active');

  if (name === 'leaderboard') loadLeaderboard();
  if (name === 'matches')     loadMatches();
  if (name === 'admin' && adminPwd) loadAdminMatches();
}

/* ─── User management ────────────────────────────────────────────────────── */
function setUser(user, notify = true) {
  currentUser = user;
  localStorage.setItem('bolao_user', JSON.stringify(user));

  const btn = document.getElementById('userBtn');
  document.getElementById('userBtnIcon').textContent = '⚽';
  document.getElementById('userBtnText').textContent = user.name;
  btn.classList.add('logged-in');

  const hint = document.getElementById('matches-user-hint');
  if (hint) hint.textContent = `Apostando como: ${user.name}`;

  if (notify) toast(`Bem-vindo, ${user.name}! ⚽`, 'success');
}

function openUserModal() {
  document.getElementById('user-modal').classList.remove('hidden');
  document.getElementById('modal-overlay').classList.remove('hidden');
  loadUsersList();
}
function closeUserModal() {
  document.getElementById('user-modal').classList.add('hidden');
  document.getElementById('modal-overlay').classList.add('hidden');
}

async function loadUsersList() {
  const wrap = document.getElementById('users-list-container');
  wrap.innerHTML = '<div class="empty" style="padding:16px 0">Carregando...</div>';
  const users = await api('/api/users');
  if (!Array.isArray(users) || users.length === 0) {
    wrap.innerHTML = '<div class="empty" style="padding:14px 0"><span class="icon">👤</span>Nenhum jogador ainda.</div>';
    return;
  }
  wrap.innerHTML = `<div class="users-list">${users.map(u => `
    <div class="user-option ${currentUser?.id === u.id ? 'selected' : ''}"
         onclick='selectUser(${JSON.stringify(u)})'>
      <div class="user-avatar">${u.name[0].toUpperCase()}</div>
      <span>${u.name}</span>
      ${currentUser?.id === u.id ? '<span class="user-check">✓</span>' : ''}
    </div>`).join('')}
  </div>`;
}

async function selectUser(user) {
  setUser(user);
  closeUserModal();
  await loadMatches();
}

async function createUser() {
  const name = document.getElementById('newUserInput').value.trim();
  if (!name) return;
  const result = await api('/api/users', 'POST', { name });
  if (result.error) { toast(result.error, 'error'); return; }
  document.getElementById('newUserInput').value = '';
  selectUser(result);
}

/* ─── Matches ────────────────────────────────────────────────────────────── */
async function loadMatches() {
  allMatches = await api('/api/matches') || [];

  if (currentUser) {
    const bets = await api(`/api/bets?user_id=${currentUser.id}`) || [];
    userBets = {};
    bets.forEach(b => { userBets[b.match_id] = b; });
    const hint = document.getElementById('matches-user-hint');
    if (hint) hint.textContent = `Apostando como: ${currentUser.name}`;
  } else {
    userBets = {};
  }
  renderMatches();
}

function setFilter(filter, btn) {
  matchFilter = filter;
  document.querySelectorAll('.pill').forEach(p => p.classList.remove('active'));
  btn.classList.add('active');
  renderMatches();
}

function renderMatches() {
  const container = document.getElementById('matches-container');
  let list = allMatches;
  if (matchFilter === 'upcoming') list = allMatches.filter(m => m.status === 'upcoming');
  if (matchFilter === 'finished') list = allMatches.filter(m => m.status === 'finished');

  if (!list.length) {
    container.innerHTML = '<div class="empty"><span class="icon">⚽</span>Nenhuma partida encontrada.</div>';
    return;
  }

  // Group by stage → group_name
  const groups = {};
  list.forEach(m => {
    const key = m.group_name ? `${m.stage} — Grupo ${m.group_name}` : m.stage;
    (groups[key] = groups[key] || []).push(m);
  });

  container.innerHTML = Object.entries(groups).map(([label, matches]) => `
    <div class="stage-group">
      <div class="stage-label">${label}</div>
      ${matches.map(renderMatchCard).join('')}
    </div>
  `).join('');
}

function renderMatchCard(m) {
  const bet      = userBets[m.id];
  const finished = m.status === 'finished';
  const matchDate = new Date(m.match_date);
  const isPast   = Date.now() > matchDate.getTime();

  const dateStr = matchDate.toLocaleDateString('pt-BR', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });

  // VS / Score block
  const vsBlock = finished
    ? `<div class="vs-block">
        <div class="vs-scores">
          <div class="vs-box">${m.home_score}</div>
          <span class="vs-sep">×</span>
          <div class="vs-box">${m.away_score}</div>
        </div>
       </div>`
    : `<div class="vs-block"><span class="vs-label">VS</span></div>`;

  // Status badge
  let badge;
  if (finished) badge = '<span class="badge badge-finished">Encerrado</span>';
  else if (isPast) badge = '<span class="badge badge-closed">Em breve</span>';
  else badge = '<span class="badge badge-open">Aberto</span>';

  // Bet section
  let betBar;
  if (finished) {
    const pts = bet ? bet.points : null;
    let chipClass = 'pts-none', chipLabel = 'Sem palpite';
    if (bet !== undefined) {
      chipClass = pts === 3 ? 'pts-3' : pts === 1 ? 'pts-1' : 'pts-0';
      chipLabel = `${pts} pt${pts !== 1 ? 's' : ''}`;
    }
    const emoji = pts === 3 ? '🎯' : pts === 1 ? '✅' : pts === 0 ? '❌' : '';
    betBar = `<div class="bet-bar">
      ${bet
        ? `<div class="bet-result-row">
            <span class="bet-label">Palpite:</span>
            <span class="bet-prediction">${bet.home_score} × ${bet.away_score}</span>
            <span class="pts-chip ${chipClass}">${chipLabel}</span>
            <span>${emoji}</span>
           </div>`
        : `<span class="no-bet-msg">Sem palpite registrado</span>`}
    </div>`;
  } else if (isPast) {
    betBar = `<div class="bet-bar">
      <span class="no-bet-msg">⏳ Apostas encerradas${bet ? ` · Palpite: <strong>${bet.home_score} × ${bet.away_score}</strong>` : ''}</span>
    </div>`;
  } else if (!currentUser) {
    betBar = `<div class="bet-bar">
      <span class="no-bet-msg"><a href="#" onclick="openUserModal();return false;">Selecione seu perfil</a> para apostar</span>
    </div>`;
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

  return `
    <div class="match-card ${finished ? 'finished' : ''} ${bet !== undefined && !finished ? 'has-bet' : ''}">
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
    </div>`;
}

async function saveBet(matchId) {
  if (!currentUser) { toast('Selecione seu perfil primeiro', 'error'); return; }
  const hs = parseInt(document.getElementById(`bh-${matchId}`).value);
  const as_ = parseInt(document.getElementById(`ba-${matchId}`).value);
  if (isNaN(hs) || isNaN(as_) || hs < 0 || as_ < 0) {
    toast('Preencha os dois placares', 'error'); return;
  }
  const result = await api('/api/bets', 'POST', {
    user_id: currentUser.id, match_id: matchId, home_score: hs, away_score: as_
  });
  if (result.error) { toast(result.error, 'error'); return; }
  userBets[matchId] = result;
  toast('Palpite salvo! ✓', 'success');
  renderMatches();
  loadLeaderboard();
}

/* ─── Leaderboard ────────────────────────────────────────────────────────── */
async function loadLeaderboard() {
  const data = await api('/api/leaderboard') || [];
  const wrap = document.getElementById('leaderboard-container');

  if (!data.length) {
    wrap.innerHTML = '<div class="empty"><span class="icon">🏆</span>Ninguém no placar ainda. Sejam os primeiros!</div>';
    return;
  }

  const rankEmoji  = ['🥇', '🥈', '🥉'];
  const rankClass  = ['r1', 'r2', 'r3'];

  wrap.innerHTML = `
    <div class="lb-table">
      <div class="lb-header">
        <div>#</div><div>Jogador</div><div style="text-align:right">Pts</div>
        <div style="text-align:center">🎯</div><div style="text-align:center">✅</div>
      </div>
      ${data.map((p, i) => `
        <div class="lb-row ${currentUser?.id === p.id ? 'is-me' : ''}">
          <div class="lb-rank ${rankClass[i] || ''}">${rankEmoji[i] || (i + 1)}</div>
          <div>
            <div class="lb-name">${p.name}</div>
            <div class="lb-bets">${p.total_bets} palpite${p.total_bets !== 1 ? 's' : ''}</div>
          </div>
          <div class="lb-pts">${p.total_points}</div>
          <div class="lb-stat">${p.exact_scores}</div>
          <div class="lb-stat">${p.correct_results}</div>
        </div>`).join('')}
    </div>`;
}

/* ─── Admin ──────────────────────────────────────────────────────────────── */
async function adminLogin() {
  const pwd = document.getElementById('adminPasswordInput').value;
  if (!pwd) { toast('Digite a senha', 'error'); return; }
  const res = await api('/api/admin/verify', 'POST', { password: pwd });
  if (res.error) { toast('Senha incorreta', 'error'); return; }
  adminPwd = pwd;
  document.getElementById('admin-login-card').classList.add('hidden');
  document.getElementById('admin-panel').classList.remove('hidden');
  loadAdminMatches();
  toast('Acesso liberado ✓', 'success');
}

async function loadAdminMatches() {
  const matches = await api('/api/matches') || [];
  const wrap = document.getElementById('admin-match-list');

  if (!matches.length) {
    wrap.innerHTML = '<div class="empty" style="padding:16px 0">Nenhuma partida cadastrada.</div>';
    return;
  }

  wrap.innerHTML = matches.map(m => {
    const dateStr = new Date(m.match_date).toLocaleDateString('pt-BR', {
      day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
    });
    const isFinished = m.status === 'finished';
    return `
      <div class="admin-match-item" id="ami-${m.id}">
        <div class="admin-match-info">
          <div class="admin-match-name">${m.home_team} × ${m.away_team}</div>
          <div class="admin-match-meta">${dateStr}${m.venue ? ` · ${m.venue}` : ''} · ${m.stage}${m.group_name ? ` G${m.group_name}` : ''}</div>
        </div>
        ${isFinished
          ? `<span class="result-saved">✓ ${m.home_score}–${m.away_score}</span>`
          : `<div class="admin-result-form">
              <input type="number" class="result-input" id="rh-${m.id}" min="0" max="20" placeholder="0">
              <span class="result-sep">×</span>
              <input type="number" class="result-input" id="ra-${m.id}" min="0" max="20" placeholder="0">
              <button class="btn btn-primary btn-sm" onclick="saveResult(${m.id})">Salvar</button>
             </div>`}
        <button class="btn btn-danger btn-sm" onclick="deleteMatch(${m.id})">Excluir</button>
      </div>`;
  }).join('');
}

async function saveResult(matchId) {
  const hs = parseInt(document.getElementById(`rh-${matchId}`).value);
  const as_ = parseInt(document.getElementById(`ra-${matchId}`).value);
  if (isNaN(hs) || isNaN(as_) || hs < 0 || as_ < 0) {
    toast('Insira o placar completo', 'error'); return;
  }
  const res = await api(`/api/matches/${matchId}/result`, 'PUT', {
    password: adminPwd, home_score: hs, away_score: as_
  });
  if (res.error) { toast(res.error, 'error'); return; }
  toast(`${res.home_team} ${hs}–${as_} ${res.away_team} salvo!`, 'success');
  loadAdminMatches();
  loadLeaderboard();
  if (!document.getElementById('tab-matches').classList.contains('hidden')) loadMatches();
}

async function deleteMatch(matchId) {
  if (!confirm('Excluir esta partida e todos os palpites relacionados?')) return;
  const res = await api(`/api/matches/${matchId}`, 'DELETE', { password: adminPwd });
  if (res.error) { toast(res.error, 'error'); return; }
  toast('Partida excluída', 'info');
  loadAdminMatches();
  loadMatches();
}

async function adminAddMatch() {
  const home  = document.getElementById('f-home').value.trim();
  const away  = document.getElementById('f-away').value.trim();
  const date  = document.getElementById('f-date').value;
  const group = document.getElementById('f-group').value.trim().toUpperCase();
  const stage = document.getElementById('f-stage').value;
  const venue = document.getElementById('f-venue').value.trim();

  if (!home || !away || !date) { toast('Times e data são obrigatórios', 'error'); return; }

  const res = await api('/api/matches', 'POST', {
    password: adminPwd, home_team: home, away_team: away,
    match_date: date + ':00', stage, group_name: group || null, venue: venue || null
  });
  if (res.error) { toast(res.error, 'error'); return; }
  toast('Partida adicionada!', 'success');
  ['f-home','f-away','f-date','f-group','f-venue'].forEach(id => {
    document.getElementById(id).value = '';
  });
  loadAdminMatches();
  loadMatches();
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

/* ─── Toast ──────────────────────────────────────────────────────────────── */
function toast(msg, type = 'info') {
  document.querySelectorAll('.toast').forEach(t => t.remove());
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.textContent = msg;
  document.body.appendChild(el);
  requestAnimationFrame(() => el.classList.add('show'));
  setTimeout(() => {
    el.classList.remove('show');
    setTimeout(() => el.remove(), 350);
  }, 2800);
}
