/* ─── State ──────────────────────────────────────────────────────────────── */
/* ─── Avatar helpers ─────────────────────────────────────────────────────── */
const _AVATAR_COLORS = ['#E74C3C','#E67E22','#2ECC71','#1ABC9C','#3498DB','#9B59B6','#E91E63','#FF5722','#00BCD4','#F39C12'];
function _avatarColor(id) { return _AVATAR_COLORS[(id || 0) % _AVATAR_COLORS.length]; }
function _initials(name) {
  const p = (name || '?').trim().split(/\s+/);
  return p.length >= 2 ? (p[0][0] + p[p.length-1][0]).toUpperCase() : (name||'?').slice(0,2).toUpperCase();
}
function avatarHtml(name, id, size = 32) {
  return `<div class="avatar" style="background:${_avatarColor(id)};width:${size}px;height:${size}px;line-height:${size}px;font-size:${Math.round(size*.38)}px">${_initials(name)}</div>`;
}

let currentUser    = null;
let allMatches     = [];
let userBets       = {};
let matchBetsCache = {};
let expandedBets   = new Set();
let statusFilter      = localStorage.getItem('bolao_statusFilter') || 'all';
let stageFilter       = localStorage.getItem('bolao_stageFilter')  || 'all';
let showUnbettedOnly  = false;
let lbStageFilter  = null;
let _diffStageFilter = null;
let _diffStats = null;
let viewMode       = localStorage.getItem('bolao_viewmode') || 'grouped';
let collapsedGroups = new Set(JSON.parse(localStorage.getItem('bolao_collapsed') || '[]'));
let adminPwd       = null;
let editingMatchId = null;

/* ─── Bootstrap ──────────────────────────────────────────────────────────── */
/* ─── Collapsible sections ───────────────────────────────────────────────── */
const _sectionMap = {
  difficulty: { content: 'difficulty-container', divider: 'difficulty-divider' },
  special:    { content: 'special-grid',          divider: 'special-divider' },
  feed:       { content: 'feed-container',         divider: 'feed-divider' },
};
const _sectionCollapsed = {};

function initCollapsedSections() {
  Object.keys(_sectionMap).forEach(key => {
    _sectionCollapsed[key] = localStorage.getItem('bolao_sec_' + key) === '1';
  });
}

function toggleSection(key) {
  _sectionCollapsed[key] = !_sectionCollapsed[key];
  localStorage.setItem('bolao_sec_' + key, _sectionCollapsed[key] ? '1' : '0');
  applyCollapsedSections();
}

function applyCollapsedSections() {
  if (lbStageFilter) return;
  Object.entries(_sectionMap).forEach(([key, ids]) => {
    const contentEl = document.getElementById(ids.content);
    const chevron   = document.querySelector(`#${ids.divider} .section-chevron`);
    const collapsed = _sectionCollapsed[key];
    if (contentEl) contentEl.style.display = collapsed ? 'none' : '';
    if (chevron)   chevron.style.transform  = collapsed ? 'rotate(-90deg)' : '';
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initCollapsedSections();
  try {
    const saved = localStorage.getItem('bolao_user');
    if (saved) setUser(JSON.parse(saved), false);
  } catch {}
  loadAll();
  // Restore the last-visited tab (defaults to leaderboard if none saved).
  const savedTab = localStorage.getItem('bolao_tab');
  if (savedTab && _PERSISTED_TABS.includes(savedTab)) showTab(savedTab);
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
// Tabs worth remembering across reloads (transient views like compare/admin are not).
const _PERSISTED_TABS = ['leaderboard', 'matches', 'bracket', 'me'];

function showTab(name) {
  document.querySelectorAll('.tab-pane').forEach(el => el.classList.add('hidden'));
  document.querySelectorAll('.tab, .bnav-tab').forEach(el => el.classList.remove('active'));
  document.getElementById(`tab-${name}`).classList.remove('hidden');
  document.querySelector(`.tab[data-tab="${name}"]`)?.classList.add('active');
  document.querySelector(`.bnav-tab[data-tab="${name}"]`)?.classList.add('active');
  if (_PERSISTED_TABS.includes(name)) localStorage.setItem('bolao_tab', name);
  if (name === 'leaderboard') { loadLeaderboard(); loadSpecialAndFeed(); }
  if (name === 'bracket')     renderBracketTab();
  if (name === 'matches')     loadMatches();
  if (name === 'me')          loadMyPage();
  if (name === 'compare')     loadComparePage();
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
  const lbEntry  = (lb || []).find(p => p.id === userId) || {};
  const rankPos  = (lb || []).findIndex(p => p.id === userId) + 1;
  const pts      = lbEntry.total_points    || 0;
  const exact    = lbEntry.exact_scores    || 0;
  const correct  = lbEntry.correct_results || 0;

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
      <div class="player-bet-match">${_flagMap[m.home_team]||''} ${tTeam(m.home_team)} <span style="color:var(--text-3)">×</span> ${tTeam(m.away_team)} ${_flagMap[m.away_team]||''} ${score}</div>
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
      const matchMap2 = Object.fromEntries(allMatches.map(m => [m.id, m]));
      const finishedShared = shared.filter(b => matchMap2[b.match_id]?.status === 'finished')
        .sort((a, b) => new Date(matchMap2[a.match_id]?.match_date||0) - new Date(matchMap2[b.match_id]?.match_date||0));
      const h2hRows = finishedShared.map(b => {
        const m   = matchMap2[b.match_id];
        const myB = myBetMap[b.match_id];
        const myPtsR  = myB.points  || 0;
        const thPtsR  = b.points    || 0;
        const outcome = myPtsR > thPtsR ? 'win' : myPtsR < thPtsR ? 'loss' : 'draw';
        const chip = p => `<span class="pts-chip ${p===3?'pts-3':p===1?'pts-1':'pts-0'}">${p}pt</span>`;
        return `<div class="h2h-row">
          <div class="h2h-match">${_flagMap[m.home_team]||''} ${tTeam(m.home_team)} ${m.home_score}×${m.away_score} ${tTeam(m.away_team)} ${_flagMap[m.away_team]||''}</div>
          <div class="h2h-bets">
            <span class="h2h-bet-me">${myB.home_score}×${myB.away_score} ${chip(myPtsR)}</span>
            <span class="h2h-vs">vs</span>
            <span class="h2h-bet-them">${b.home_score}×${b.away_score} ${chip(thPtsR)}</span>
            <span class="rivalry-badge ${outcome}" style="font-size:.65rem;padding:1px 6px">${outcome==='win'?'▲':outcome==='loss'?'▼':'='}</span>
          </div>
        </div>`;
      }).join('');

      rivalryHtml = `
        <div class="rivalry-bar">
          <span style="font-weight:700">${t('pm_rivalry')}</span>
          <span style="color:var(--text-3)">${shared.length} ${shared.length!==1 ? (getCurrentLang()==='en'?'games':'jogos') : (getCurrentLang()==='en'?'game':'jogo')} ${getCurrentLang()==='en'?'in common':'em comum'}</span>
          <span>${t('pm_you')} <strong>${myPts} pts</strong> · ${name}: <strong>${theirPts} pts</strong></span>
          <div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap">
            <span class="rivalry-badge win">${wins}${t('pm_win')}</span>
            <span class="rivalry-badge draw">${draws}${t('pm_draw')}</span>
            <span class="rivalry-badge loss">${losses}${t('pm_loss')}</span>
            ${h2hRows ? `<button class="h2h-toggle-btn" onclick="const d=this.closest('.rivalry-bar').querySelector('.h2h-detail');d.classList.toggle('hidden');this.textContent=d.classList.contains('hidden')?'▼ ${t('pm_h2h_detail')}':'▲ ${t('pm_h2h_detail')}'">▼ ${t('pm_h2h_detail')}</button>` : ''}
          </div>
          ${h2hRows ? `<div class="h2h-detail hidden">${h2hRows}</div>` : ''}
        </div>`;
    }
  }

  document.getElementById('player-modal-body').innerHTML = `
    ${rivalryHtml}
    <div style="display:flex;align-items:center;gap:12px;padding:16px 20px 12px;border-bottom:1px solid var(--border)">
      ${avatarHtml(name, userId, 44)}
      <div style="flex:1;min-width:0;overflow:hidden">
        <div style="font-weight:800;font-size:1rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${name}</div>
        <div style="font-size:.72rem;color:var(--text-3)">#${rankPos || '—'}</div>
      </div>
      <div style="display:flex;gap:16px;text-align:center;flex-shrink:0">
        <div><div style="font-size:1.5rem;font-weight:900;color:var(--gold)">${pts}</div><div style="font-size:.65rem;color:var(--text-3)">${t('pm_points')}</div></div>
        <div><div style="font-size:1.2rem;font-weight:900;color:var(--green)">${exact}</div><div style="font-size:.65rem;color:var(--text-3)">${t('pm_exact')}</div></div>
        <div><div style="font-size:1.2rem;font-weight:900;color:var(--blue)">${correct}</div><div style="font-size:.65rem;color:var(--text-3)">${t('pm_results')}</div></div>
      </div>
    </div>
    ${champBet || scorerBet ? `<div style="padding:10px 20px;border-bottom:1px solid var(--border);display:flex;gap:16px;flex-wrap:wrap">
      ${champBet ? `<div><div style="font-size:.7rem;color:var(--text-3);margin-bottom:2px">${t('pm_champion')}</div><div style="font-weight:700${champWon?' ;color:var(--gold)':''}">${tTeam(champBet.team)}${champWon?' ✓':''}</div></div>` : ''}
      ${scorerBet ? `<div><div style="font-size:.7rem;color:var(--text-3);margin-bottom:2px">${t('pm_scorer')}</div><div style="font-weight:700${scorerWon?';color:var(--gold)':''}">${scorerBet.name}${scorerWon?' ✓':''}</div></div>` : ''}
    </div>` : ''}
    <div style="padding:8px 20px 16px">
      ${betRows || `<div class="empty" style="padding:20px 0"><span class="icon">🎲</span>${t('pm_no_bets')}</div>`}
    </div>
    ${currentUser && currentUser.id !== userId ? `
      <div style="padding:0 20px 16px">
        <button class="btn btn-ghost btn-sm" style="width:100%" onclick="closePlayerModal();openCompareWith(${userId})">⚔️ ${t('pm_full_compare')}</button>
      </div>` : ''}`;
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

