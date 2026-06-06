const express = require('express');
const path    = require('path');
const db      = require('./db');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

if (db.needsSeed()) db.seed();

// ── Users ────────────────────────────────────────────────────────────────────

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

// ── Matches ──────────────────────────────────────────────────────────────────

app.get('/api/matches', (req, res) => {
  res.json(db.getMatches());
});

app.post('/api/matches', (req, res) => {
  const { password, home_team, away_team, match_date, stage, group_name, venue } = req.body;
  if (!auth(password)) return res.status(403).json({ error: 'Senha incorreta' });
  if (!home_team || !away_team || !match_date)
    return res.status(400).json({ error: 'Times e data são obrigatórios' });
  res.json(db.createMatch({
    home_team: home_team.trim(),
    away_team: away_team.trim(),
    match_date,
    stage: stage || 'Fase de Grupos',
    group_name: group_name || null,
    venue: venue || null,
  }));
});

app.put('/api/matches/:id/result', (req, res) => {
  const { password, home_score, away_score } = req.body;
  if (!auth(password)) return res.status(403).json({ error: 'Senha incorreta' });
  const hs  = parseInt(home_score);
  const as_ = parseInt(away_score);
  if (isNaN(hs) || isNaN(as_) || hs < 0 || as_ < 0)
    return res.status(400).json({ error: 'Placar inválido' });
  const match = db.setMatchResult(Number(req.params.id), hs, as_);
  if (!match) return res.status(404).json({ error: 'Partida não encontrada' });
  res.json(match);
});

app.delete('/api/matches/:id', (req, res) => {
  if (!auth(req.body.password)) return res.status(403).json({ error: 'Senha incorreta' });
  db.deleteMatch(Number(req.params.id));
  res.json({ success: true });
});

// ── Bets ─────────────────────────────────────────────────────────────────────

app.get('/api/bets', (req, res) => {
  const user_id  = req.query.user_id  ? Number(req.query.user_id)  : null;
  const match_id = req.query.match_id ? Number(req.query.match_id) : null;
  res.json(db.getBets({ user_id, match_id }));
});

app.post('/api/bets', (req, res) => {
  const { user_id, match_id, home_score, away_score } = req.body;
  const match = db.getMatchById(Number(match_id));
  if (!match) return res.status(404).json({ error: 'Partida não encontrada' });
  if (match.status !== 'upcoming') return res.status(400).json({ error: 'Partida já encerrada' });
  if (new Date() > new Date(match.match_date))
    return res.status(400).json({ error: 'Prazo de apostas encerrado' });
  const hs  = parseInt(home_score);
  const as_ = parseInt(away_score);
  if (isNaN(hs) || isNaN(as_) || hs < 0 || as_ < 0)
    return res.status(400).json({ error: 'Placar inválido' });
  res.json(db.upsertBet({ user_id: Number(user_id), match_id: Number(match_id), home_score: hs, away_score: as_ }));
});

// ── Leaderboard ──────────────────────────────────────────────────────────────

app.get('/api/leaderboard', (req, res) => {
  res.json(db.getLeaderboard());
});

// ── Admin ─────────────────────────────────────────────────────────────────────

app.post('/api/admin/verify', (req, res) => {
  if (auth(req.body.password)) res.json({ success: true });
  else res.status(403).json({ error: 'Senha incorreta' });
});

app.put('/api/admin/password', (req, res) => {
  const { password, new_password } = req.body;
  if (!auth(password)) return res.status(403).json({ error: 'Senha incorreta' });
  if (!new_password || new_password.length < 4)
    return res.status(400).json({ error: 'Nova senha muito curta (mínimo 4 caracteres)' });
  db.setAdminPassword(new_password);
  res.json({ success: true });
});

// ── Helpers ───────────────────────────────────────────────────────────────────

function auth(password) {
  return password === db.getAdminPassword();
}

// ── Start ─────────────────────────────────────────────────────────────────────

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`\n⚽  Bolão Copa 2026 → http://localhost:${PORT}`);
  console.log(`🔑  Senha admin padrão: bolao2026\n`);
});
