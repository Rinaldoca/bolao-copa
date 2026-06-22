const express = require('express');
const path    = require('path');
const fs      = require('fs');
const https   = require('https');

// Load .env for local dev (Railway injects vars directly)
try {
  fs.readFileSync(path.join(__dirname, '.env'), 'utf8').split('\n').forEach(line => {
    const m = line.match(/^([A-Z0-9_]+)=(.+)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim();
  });
} catch {}

const DATA_DIR = process.env.DATA_DIR || __dirname;

const db      = require('./db');
const { syncMatches, importGroupStage, importKnockoutStage, generateKnockout } = require('./sync');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

if (db.needsSeed()) db.seed();
db.applyScoringMigration();

// ── Users ─────────────────────────────────────────────────────────────────────

app.get('/api/users', (req, res) => {
  res.json(db.getUsers().map(u => ({ id: u.id, name: u.name })));
});

app.post('/api/users', (req, res) => {
  const name = (req.body.name || '').trim();
  if (name.length < 2)  return res.status(400).json({ error: 'Nome muito curto (mínimo 2 caracteres)' });
  if (name.length > 30) return res.status(400).json({ error: 'Nome muito longo (máximo 30 caracteres)' });
  try {
    const user = db.createUser(name);
    res.json({ id: user.id, name: user.name });
  } catch {
    res.status(400).json({ error: 'Este nome já está em uso' });
  }
});

app.put('/api/admin/users/:id', (req, res) => {
  const { password } = req.body;
  if (!auth(password)) return res.status(403).json({ error: 'Senha incorreta' });
  const name = (req.body.name || '').trim();
  if (name.length < 2)  return res.status(400).json({ error: 'Nome muito curto (mínimo 2 caracteres)' });
  if (name.length > 30) return res.status(400).json({ error: 'Nome muito longo (máximo 30 caracteres)' });
  try {
    const user = db.renameUser(Number(req.params.id), name);
    if (!user) return res.status(404).json({ error: 'Usuário não encontrado' });
    res.json({ id: user.id, name: user.name });
  } catch {
    res.status(400).json({ error: 'Este nome já está em uso' });
  }
});

// ── Matches ───────────────────────────────────────────────────────────────────

app.get('/api/matches', (req, res) => res.json(db.getMatches()));

app.post('/api/matches', (req, res) => {
  const { password, home_team, away_team, match_date, stage, group_name, venue } = req.body;
  if (!auth(password)) return res.status(403).json({ error: 'Senha incorreta' });
  if (!home_team || !away_team || !match_date) return res.status(400).json({ error: 'Times e data são obrigatórios' });
  const ht = home_team.trim().toLowerCase(), at = away_team.trim().toLowerCase(), day = match_date.slice(0, 10);
  const dup = db.getMatches().find(m => m.home_team.toLowerCase() === ht && m.away_team.toLowerCase() === at && m.match_date.slice(0, 10) === day);
  if (dup) return res.status(400).json({ error: `Partida já existe: ${home_team.trim()} vs ${away_team.trim()}` });
  res.json(db.createMatch({ home_team: home_team.trim(), away_team: away_team.trim(), match_date, stage, group_name: group_name || null, venue: venue || null }));
});

app.put('/api/matches/:id', (req, res) => {
  const { password, home_team, away_team, match_date, stage, group_name, venue } = req.body;
  if (!auth(password)) return res.status(403).json({ error: 'Senha incorreta' });
  const match = db.editMatch(Number(req.params.id), { home_team, away_team, match_date, stage, group_name, venue });
  if (!match) return res.status(404).json({ error: 'Partida não encontrada' });
  res.json(match);
});

app.put('/api/matches/:id/result', (req, res) => {
  const { password, home_score, away_score } = req.body;
  if (!auth(password)) return res.status(403).json({ error: 'Senha incorreta' });
  const hs = parseInt(home_score), as_ = parseInt(away_score);
  if (isNaN(hs) || isNaN(as_) || hs < 0 || as_ < 0) return res.status(400).json({ error: 'Placar inválido' });
  const match = db.setMatchResult(Number(req.params.id), hs, as_);
  if (!match) return res.status(404).json({ error: 'Partida não encontrada' });
  res.json(match);
});

app.post('/api/matches/:id/clear-result', (req, res) => {
  if (!auth(req.body.password)) return res.status(403).json({ error: 'Senha incorreta' });
  const match = db.clearMatchResult(Number(req.params.id));
  if (!match) return res.status(404).json({ error: 'Partida não encontrada' });
  res.json(match);
});

app.delete('/api/matches/:id', (req, res) => {
  if (!auth(req.body.password)) return res.status(403).json({ error: 'Senha incorreta' });
  db.deleteMatch(Number(req.params.id));
  res.json({ success: true });
});

app.post('/api/admin/bets', (req, res) => {
  const { password, user_id, match_id, home_score, away_score } = req.body;
  if (!auth(password)) return res.status(403).json({ error: 'Senha incorreta' });
  const hs = parseInt(home_score), as_ = parseInt(away_score);
  if (isNaN(hs) || isNaN(as_) || hs < 0 || as_ < 0) return res.status(400).json({ error: 'Placar inválido' });
  res.json(db.upsertBet({ user_id: Number(user_id), match_id: Number(match_id), home_score: hs, away_score: as_ }));
});

// ── Bets ──────────────────────────────────────────────────────────────────────

app.get('/api/bets', (req, res) => {
  const user_id  = req.query.user_id  ? Number(req.query.user_id)  : null;
  const match_id = req.query.match_id ? Number(req.query.match_id) : null;
  res.json(db.getBets({ user_id, match_id }));
});

app.post('/api/bets', (req, res) => {
  const { user_id, match_id, home_score, away_score } = req.body;
  const match = db.getMatchById(Number(match_id));
  if (!match)                             return res.status(404).json({ error: 'Partida não encontrada' });
  if (match.status !== 'upcoming')        return res.status(400).json({ error: 'Partida já encerrada' });
  if (new Date() > new Date(match.match_date) - 5 * 60 * 1000) return res.status(400).json({ error: 'Prazo de apostas encerrado (fecha 5 min antes do jogo)' });
  const hs = parseInt(home_score), as_ = parseInt(away_score);
  if (isNaN(hs) || isNaN(as_) || hs < 0 || as_ < 0) return res.status(400).json({ error: 'Placar inválido' });
  res.json(db.upsertBet({ user_id: Number(user_id), match_id: Number(match_id), home_score: hs, away_score: as_ }));
});

app.delete('/api/bets', (req, res) => {
  const user_id = Number(req.body.user_id);
  if (!user_id) return res.status(400).json({ error: 'user_id obrigatório' });
  const deleted = db.clearUserBets(user_id);
  res.json({ success: true, deleted });
});

// ── Special bets ──────────────────────────────────────────────────────────────

app.get('/api/special-bets', (req, res) => {
  res.json({
    champion_bets:      db.getChampionBets(),
    scorer_bets:        db.getScorerBets(),
    special_bets_open:  db.getSpecialBetsOpen(),
    champion:           db.getSettings().champion,
    top_scorer:         db.getSettings().top_scorer,
  });
});

app.post('/api/champion-bet', (req, res) => {
  const { user_id, team } = req.body;
  if (!db.getSpecialBetsOpen()) return res.status(400).json({ error: 'Apostas especiais encerradas' });
  if (!team?.trim()) return res.status(400).json({ error: 'Informe o nome do time' });
  db.upsertChampionBet(Number(user_id), team.trim());
  res.json({ success: true });
});

app.post('/api/scorer-bet', (req, res) => {
  const { user_id, name } = req.body;
  if (!db.getSpecialBetsOpen()) return res.status(400).json({ error: 'Apostas especiais encerradas' });
  if (!name?.trim()) return res.status(400).json({ error: 'Informe o nome do jogador' });
  db.upsertScorerBet(Number(user_id), name.trim());
  res.json({ success: true });
});

// ── Admin ─────────────────────────────────────────────────────────────────────

app.post('/api/admin/verify', (req, res) => {
  auth(req.body.password) ? res.json({ success: true }) : res.status(403).json({ error: 'Senha incorreta' });
});

app.put('/api/admin/password', (req, res) => {
  const { password, new_password } = req.body;
  if (!auth(password)) return res.status(403).json({ error: 'Senha incorreta' });
  if (!new_password || new_password.length < 4) return res.status(400).json({ error: 'Nova senha muito curta' });
  db.setAdminPassword(new_password);
  res.json({ success: true });
});

app.put('/api/admin/special-bets', (req, res) => {
  if (!auth(req.body.password)) return res.status(403).json({ error: 'Senha incorreta' });
  db.setSpecialBetsOpen(!!req.body.open);
  res.json({ success: true });
});

app.put('/api/admin/champion', (req, res) => {
  const { password, team } = req.body;
  if (!auth(password)) return res.status(403).json({ error: 'Senha incorreta' });
  if (!team?.trim()) return res.status(400).json({ error: 'Informe o nome do time' });
  const winners = db.setChampion(team.trim());
  res.json({ success: true, winners });
});

app.put('/api/admin/top-scorer', (req, res) => {
  const { password, name } = req.body;
  if (!auth(password)) return res.status(403).json({ error: 'Senha incorreta' });
  if (!name?.trim()) return res.status(400).json({ error: 'Informe o nome do jogador' });
  db.setTopScorer(name.trim());
  res.json({ success: true });
});

// ── Sync ──────────────────────────────────────────────────────────────────────

app.get('/api/admin/sync-status', (req, res) => {
  res.json({ last_sync: db.getLastSync(), has_api_key: !!process.env.FOOTBALL_API_KEY });
});

app.post('/api/admin/sync', async (req, res) => {
  if (!auth(req.body.password)) return res.status(403).json({ error: 'Senha incorreta' });
  try {
    const result = await syncMatches();
    res.json(result);
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

app.post('/api/admin/import-matches', async (req, res) => {
  if (!auth(req.body.password)) return res.status(403).json({ error: 'Senha incorreta' });
  try {
    const result = await importGroupStage();
    res.json(result);
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

app.post('/api/admin/import-knockout', async (req, res) => {
  if (!auth(req.body.password)) return res.status(403).json({ error: 'Senha incorreta' });
  try {
    const result = await importKnockoutStage();
    res.json(result);
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

app.post('/api/admin/generate-bracket', (req, res) => {
  if (!auth(req.body.password)) return res.status(403).json({ error: 'Senha incorreta' });
  try {
    const standings = db.buildGroupStandingsServer();
    const groupMatches = db.getMatches().filter(m => m.stage === 'Fase de Grupos');
    const groupStageComplete = groupMatches.length > 0 && groupMatches.every(m => m.status === 'finished');
    const matches   = generateKnockout(standings, groupStageComplete);
    const result    = db.upsertKnockoutMatches(matches);
    res.json({ ok: true, ...result });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// ── Leaderboard & Feed ────────────────────────────────────────────────────────

app.get('/api/leaderboard',  (req, res) => res.json(db.getLeaderboard(req.query.stage || null)));
app.get('/api/feed',         (req, res) => res.json(db.getFeed()));
app.get('/api/history',      (req, res) => res.json(db.getPointsHistory()));
app.get('/api/awards',       (req, res) => res.json(db.getGroupAwards()));
app.get('/api/match-stats',  (req, res) => res.json(db.getMatchStats()));

// ── Backup to GitHub Gist ─────────────────────────────────────────────────────

async function backupToGist() {
  const token  = process.env.GIST_TOKEN;
  const gistId = process.env.GIST_ID;
  if (!token || !gistId) return { ok: false, error: 'GIST_TOKEN/GIST_ID não configurados no servidor' };
  try {
    const content = fs.readFileSync(path.join(DATA_DIR, 'bolao.json'), 'utf8');
    const body    = JSON.stringify({ files: { 'bolao.json': { content } } });
    await new Promise((resolve, reject) => {
      const req = https.request({
        hostname: 'api.github.com',
        path:     `/gists/${gistId}`,
        method:   'PATCH',
        headers: {
          'Authorization': `token ${token}`,
          'User-Agent':    'bolao-copa',
          'Content-Type':  'application/json',
          'Content-Length': Buffer.byteLength(body),
        },
      }, res => {
        let data = '';
        res.on('data', c => data += c);
        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            console.log('[backup] Gist atualizado com sucesso.');
            resolve();
          } else {
            reject(new Error(`HTTP ${res.statusCode}: ${data}`));
          }
        });
      });
      req.on('error', reject);
      req.write(body);
      req.end();
    });
    return { ok: true };
  } catch (err) {
    console.error('[backup]', err.message);
    return { ok: false, error: err.message };
  }
}

setInterval(backupToGist, 60 * 60 * 1000);
setTimeout(backupToGist, 30 * 1000); // first run 30s after start

app.post('/api/admin/reassign-match-id', (req, res) => {
  const { password, from_id, to_id } = req.body;
  if (!auth(password)) return res.status(403).json({ error: 'Senha incorreta' });
  const result = db.reassignMatchId(Number(from_id), Number(to_id));
  if (!result.ok) return res.status(400).json(result);
  res.json(result);
});

app.post('/api/admin/backup', async (req, res) => {
  if (!auth(req.body.password)) return res.status(403).json({ error: 'Senha incorreta' });
  const result = await backupToGist();
  if (!result.ok) return res.status(502).json(result);
  res.json(result);
});

app.get('/api/admin/download', (req, res) => {
  if (!auth(req.query.password)) return res.status(403).json({ error: 'Senha incorreta' });
  const file = path.join(DATA_DIR, 'bolao.json');
  res.setHeader('Content-Disposition', `attachment; filename="bolao-backup-${new Date().toISOString().slice(0,10)}.json"`);
  res.setHeader('Content-Type', 'application/json');
  res.sendFile(file);
});

// ── Helper ────────────────────────────────────────────────────────────────────

function auth(password) { return password === db.getAdminPassword(); }

// ── Start ─────────────────────────────────────────────────────────────────────

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`\n⚽  Bolão Copa 2026 → http://localhost:${PORT}`);
  console.log(`🔑  Senha admin padrão: bolao2026`);
  console.log(`🔄  Sync API: ${process.env.FOOTBALL_API_KEY ? 'configurada ✓' : 'FOOTBALL_API_KEY não configurada'}\n`);
});

// Auto-sync every 5 minutes while there are pending matches
function autoSync() {
  const now = new Date();
  const hasPending = db.getMatches().some(m => m.status === 'upcoming' && new Date(m.match_date) < now);
  if (hasPending && process.env.FOOTBALL_API_KEY) {
    syncMatches().catch(err => console.error('[sync] Erro:', err.message));
  }
}
setInterval(autoSync, 5 * 60 * 1000);
setTimeout(autoSync, 15 * 1000); // first run 15s after startup
