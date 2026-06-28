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
  const userOpts = '<option value="">Selecione o usuário...</option>' +
    (users||[]).map(u => `<option value="${u.id}">${u.name}</option>`).join('');
  uSel.innerHTML = userOpts;
  const ruSel = document.getElementById('ru-user');
  if (ruSel) ruSel.innerHTML = userOpts;
  mSel.innerHTML = '<option value="">Selecione a partida...</option>' +
    (matches||[]).map(m => {
      const d = new Date(m.match_date).toLocaleDateString('pt-BR',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit',timeZone:'Europe/Berlin'});
      return `<option value="${m.id}">${tTeam(m.home_team)} × ${tTeam(m.away_team)} (${d})</option>`;
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

let adminStageFilter = '';
function setAdminStageFilter(stage) {
  adminStageFilter = stage;
  document.querySelectorAll('.stage-filter-btn').forEach(btn => {
    btn.classList.toggle('active', btn.textContent.trim() === (stage || 'Todas'));
  });
  renderAdminMatchList();
}

async function loadAdminMatches() {
  const matches = await api('/api/matches') || [];
  allMatches = matches; // keep global in sync so openEditModal finds new matches
  renderAdminMatchList();
}

function renderAdminMatchList() {
  const matches = adminStageFilter
    ? allMatches.filter(m => m.stage === adminStageFilter)
    : allMatches;
  const wrap = document.getElementById('admin-match-list');
  if (!matches.length) {
    wrap.innerHTML = '<div class="empty" style="padding:16px 0">Nenhuma partida.</div>'; return;
  }
  wrap.innerHTML = matches.map(m => {
    const dateStr = fmtDate(m.match_date);
    const isFinished = m.status === 'finished';
    return `<div class="admin-match-item" id="ami-${m.id}">
      <div class="admin-match-info">
        <div class="admin-match-name">${tTeam(m.home_team)} × ${tTeam(m.away_team)}</div>
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
  matchBetsCache = {}; expandedBets.clear();
  await Promise.all([loadAdminMatches(), loadLeaderboard(), loadSpecialAndFeed()]);
  toast(`${res.home_team} ${hs}–${as_} ${res.away_team} ✓ · Placar atualizado`, 'success');
  if (!document.getElementById('tab-matches').classList.contains('hidden')) loadMatches();
}

async function adminClearResult(matchId) {
  if (!confirm('Limpar resultado? A partida volta para "a jogar" e os pontos são zerados.')) return;
  const res = await api(`/api/matches/${matchId}/clear-result`, 'POST', { password: adminPwd });
  if (res.error) { toast(res.error, 'error'); return; }
  matchBetsCache = {}; expandedBets.clear();
  await Promise.all([loadAdminMatches(), loadLeaderboard(), loadSpecialAndFeed()]);
  toast('Resultado removido · Placar atualizado ✓', 'info');
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
  toast(`${res.updated} partidas atualizadas!`, 'success');
  matchBetsCache = {}; expandedBets.clear(); allMatches = [];
  loadAdminMatches(); loadMatches(); renderBracketTab();
  loadLeaderboard(); loadSpecialAndFeed();
}

async function adminGenerateRound32() {
  if (!confirm('Gerar o mata-mata completo (32 avos → Final) com base na classificação atual dos grupos?\n\nOs 32 avos usam os classificados; as fases seguintes ficam "A definir". Isso não apaga palpites existentes.')) return;
  const btn = event.target; btn.disabled = true; btn.textContent = '⟳ Gerando...';
  const res = await api('/api/admin/generate-bracket', 'POST', { password: adminPwd });
  btn.disabled = false; btn.textContent = '⚡ Gerar mata-mata completo';
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

async function adminRenameUser() {
  const userId = Number(document.getElementById('ru-user').value);
  const name   = document.getElementById('ru-name').value.trim();
  if (!userId) { toast('Selecione o usuário', 'error'); return; }
  if (name.length < 2) { toast('Nome muito curto (mín. 2 caracteres)', 'error'); return; }
  const res = await api(`/api/admin/users/${userId}`, 'PUT', { password: adminPwd, name });
  if (res.error) { toast(res.error, 'error'); return; }
  document.getElementById('ru-name').value = '';
  toast(`Usuário renomeado para ${res.name} ✓`, 'success');
  matchBetsCache = {}; expandedBets.clear();
  loadAdminBetSelects();
  loadLeaderboard(); loadSpecialAndFeed();
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

