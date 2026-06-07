const fs   = require('fs');
const path = require('path');

const DATA_DIR = process.env.DATA_DIR || __dirname;
const FILE = path.join(DATA_DIR, 'bolao.json');

// Ensure the data directory exists (needed when a Railway volume is first mounted)
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const DEFAULTS = {
  settings: {
    admin_password:    'bolao2026',
    champion:          null,   // actual champion team
    top_scorer:        null,   // actual top scorer name
    special_bets_open: true,   // admin toggle for champion + scorer bets
  },
  _seq: { users: 0, matches: 0, bets: 0, feed: 0 },
  users:         [],
  matches:       [],
  bets:          [],
  champion_bets: [],  // { user_id, team }
  scorer_bets:   [],  // { user_id, name }
  feed:          [],  // result feed entries (newest first)
};

let _data = null;

function load() {
  if (_data) return _data;
  try {
    _data = JSON.parse(fs.readFileSync(FILE, 'utf8'));
    // Migrate older saves
    _data.champion_bets                = _data.champion_bets                || [];
    _data.scorer_bets                  = _data.scorer_bets                  || [];
    _data.feed                         = _data.feed                         || [];
    _data._seq.feed                    = _data._seq.feed                    || 0;
    _data.settings.champion            = _data.settings.champion            ?? null;
    _data.settings.top_scorer          = _data.settings.top_scorer          ?? null;
    _data.settings.special_bets_open   = _data.settings.special_bets_open   ?? true;
    _data.settings.last_sync           = _data.settings.last_sync           ?? null;
  } catch {
    _data = JSON.parse(JSON.stringify(DEFAULTS));
    persist();
  }
  return _data;
}

function persist() {
  fs.writeFileSync(FILE, JSON.stringify(_data, null, 2));
}

// ── Users ─────────────────────────────────────────────────────────────────────

function getUsers()       { return load().users.slice().sort((a, b) => a.name.localeCompare(b.name)); }
function getUserById(id)  { return load().users.find(u => u.id === id) || null; }

function createUser(name) {
  const db = load();
  if (db.users.find(u => u.name.toLowerCase() === name.toLowerCase())) throw new Error('DUPLICATE');
  const user = { id: ++db._seq.users, name, created_at: new Date().toISOString() };
  db.users.push(user);
  persist();
  return user;
}

// ── Matches ───────────────────────────────────────────────────────────────────

function getMatches() {
  const db = load();
  return db.matches
    .slice()
    .sort((a, b) => a.match_date.localeCompare(b.match_date) || a.id - b.id)
    .map(m => ({ ...m, bet_count: db.bets.filter(b => b.match_id === m.id).length }));
}

function getMatchById(id) { return load().matches.find(m => m.id === id) || null; }

function createMatch({ home_team, away_team, match_date, stage, group_name, venue, api_match_id }) {
  const db = load();
  const match = {
    id: ++db._seq.matches,
    api_match_id: api_match_id || null,
    home_team, away_team, match_date,
    stage:      stage      || 'Fase de Grupos',
    group_name: group_name || null,
    venue:      venue      || null,
    home_score: null, away_score: null,
    status:     'upcoming',
    created_at: new Date().toISOString(),
  };
  db.matches.push(match);
  persist();
  return match;
}

function replaceGroupStage(newMatches) {
  const db = load();
  const oldIds = new Set(db.matches.filter(m => m.stage === 'Fase de Grupos').map(m => m.id));
  db.matches = db.matches.filter(m => m.stage !== 'Fase de Grupos');
  db.bets    = db.bets.filter(b => !oldIds.has(b.match_id));
  db.feed    = db.feed.filter(f => !oldIds.has(f.match_id));
  for (const m of newMatches) {
    db.matches.push({
      id: ++db._seq.matches,
      api_match_id: m.api_match_id || null,
      home_team:    m.home_team,
      away_team:    m.away_team,
      match_date:   m.match_date,
      stage:        'Fase de Grupos',
      group_name:   m.group_name || null,
      venue:        m.venue || null,
      home_score:   null, away_score: null,
      status:       'upcoming',
      created_at:   new Date().toISOString(),
    });
  }
  persist();
}

function editMatch(id, { home_team, away_team, match_date, stage, group_name, venue }) {
  const db = load();
  const match = db.matches.find(m => m.id === id);
  if (!match) return null;
  if (home_team)  match.home_team  = home_team;
  if (away_team)  match.away_team  = away_team;
  if (match_date) match.match_date = match_date;
  if (stage)      match.stage      = stage;
  match.group_name = group_name ?? match.group_name;
  match.venue      = venue      ?? match.venue;
  persist();
  return match;
}

function setMatchResult(id, home_score, away_score) {
  const db = load();
  const match = db.matches.find(m => m.id === id);
  if (!match) return null;
  match.home_score = home_score;
  match.away_score = away_score;
  match.status = 'finished';

  const matchResult = Math.sign(home_score - away_score);
  const betResults = [];
  db.bets.filter(b => b.match_id === id).forEach(bet => {
    if (bet.home_score === home_score && bet.away_score === away_score) {
      bet.points = 3;
    } else if (Math.sign(bet.home_score - bet.away_score) === matchResult) {
      bet.points = 1;
    } else {
      bet.points = 0;
    }
    betResults.push({ ...bet, user_name: db.users.find(u => u.id === bet.user_id)?.name });
  });

  // Feed entry
  db.feed.unshift({
    id:         ++db._seq.feed,
    type:       'match_result',
    match_id:   match.id,
    home_team:  match.home_team,
    away_team:  match.away_team,
    home_score, away_score,
    timestamp:  new Date().toISOString(),
    results:    betResults
      .sort((a, b) => b.points - a.points)
      .map(b => ({ user_name: b.user_name, home_score: b.home_score, away_score: b.away_score, points: b.points })),
  });
  if (db.feed.length > 50) db.feed = db.feed.slice(0, 50);

  persist();
  return match;
}

function upsertKnockoutMatches(matches) {
  const db = load();
  let added = 0, updated = 0;
  for (const m of matches) {
    const existing = m.api_match_id
      ? db.matches.find(x => x.api_match_id === m.api_match_id)
      : null;
    if (existing) {
      if (m.home_team && m.home_team !== 'A definir') existing.home_team = m.home_team;
      if (m.away_team && m.away_team !== 'A definir') existing.away_team = m.away_team;
      existing.match_date = m.match_date;
      if (m.venue) existing.venue = m.venue;
      updated++;
    } else {
      db.matches.push({
        id: ++db._seq.matches,
        api_match_id: m.api_match_id || null,
        home_team:    m.home_team,
        away_team:    m.away_team,
        match_date:   m.match_date,
        stage:        m.stage,
        group_name:   null,
        venue:        m.venue || null,
        home_score:   null, away_score: null,
        status:       'upcoming',
        created_at:   new Date().toISOString(),
      });
      added++;
    }
  }
  persist();
  return { added, updated };
}

function deleteMatch(id) {
  const db = load();
  db.matches = db.matches.filter(m => m.id !== id);
  db.bets    = db.bets.filter(b => b.match_id !== id);
  db.feed    = db.feed.filter(f => f.match_id !== id);
  persist();
}

// ── Bets ──────────────────────────────────────────────────────────────────────

function getBets({ user_id, match_id } = {}) {
  const db = load();
  return db.bets
    .filter(b =>
      (user_id  == null || b.user_id  === user_id)  &&
      (match_id == null || b.match_id === match_id))
    .map(b => {
      const u = db.users.find(u => u.id === b.user_id);
      const m = db.matches.find(m => m.id === b.match_id);
      return { ...b, user_name: u?.name, home_team: m?.home_team, away_team: m?.away_team,
                     match_home: m?.home_score, match_away: m?.away_score, status: m?.status };
    });
}

function upsertBet({ user_id, match_id, home_score, away_score }) {
  const db = load();
  let bet = db.bets.find(b => b.user_id === user_id && b.match_id === match_id);
  if (bet) {
    bet.home_score = home_score;
    bet.away_score = away_score;
  } else {
    bet = { id: ++db._seq.bets, user_id, match_id, home_score, away_score, points: 0, created_at: new Date().toISOString() };
    db.bets.push(bet);
  }
  persist();
  return bet;
}

function clearUserBets(user_id) {
  const db = load();
  const now = new Date();
  // Only delete bets on matches that haven't started yet
  const LOCK_MS = 5 * 60 * 1000;
  const deletable = new Set(
    db.matches
      .filter(m => m.status === 'upcoming' && new Date(m.match_date) - LOCK_MS > now)
      .map(m => m.id)
  );
  const before = db.bets.length;
  db.bets = db.bets.filter(b => !(b.user_id === user_id && deletable.has(b.match_id)));
  persist();
  return before - db.bets.length;
}

// ── Special bets ──────────────────────────────────────────────────────────────

function getSpecialBetsOpen() { return load().settings.special_bets_open; }

function setSpecialBetsOpen(open) {
  const db = load();
  db.settings.special_bets_open = open;
  persist();
}

function getChampionBets() {
  const db = load();
  return db.champion_bets.map(b => ({ ...b, user_name: db.users.find(u => u.id === b.user_id)?.name }));
}

function upsertChampionBet(user_id, team) {
  const db = load();
  let bet = db.champion_bets.find(b => b.user_id === user_id);
  if (bet) { bet.team = team; } else { db.champion_bets.push({ user_id, team }); }
  persist();
}

function getScorerBets() {
  const db = load();
  return db.scorer_bets.map(b => ({ ...b, user_name: db.users.find(u => u.id === b.user_id)?.name }));
}

function upsertScorerBet(user_id, name) {
  const db = load();
  let bet = db.scorer_bets.find(b => b.user_id === user_id);
  if (bet) { bet.name = name; } else { db.scorer_bets.push({ user_id, name }); }
  persist();
}

function setChampion(team) {
  const db = load();
  db.settings.champion = team;
  // Award 10 pts in feed
  const winners = db.champion_bets.filter(b => b.team.toLowerCase() === team.toLowerCase());
  db.feed.unshift({
    id:        ++db._seq.feed,
    type:      'champion_result',
    team,
    timestamp: new Date().toISOString(),
    results:   db.champion_bets.map(b => ({
      user_name: db.users.find(u => u.id === b.user_id)?.name,
      pick:      b.team,
      points:    b.team.toLowerCase() === team.toLowerCase() ? 10 : 0,
    })).sort((a, b) => b.points - a.points),
  });
  if (db.feed.length > 50) db.feed = db.feed.slice(0, 50);
  persist();
  return winners.length;
}

function setTopScorer(name) {
  const db = load();
  db.settings.top_scorer = name;
  db.feed.unshift({
    id:        ++db._seq.feed,
    type:      'scorer_result',
    name,
    timestamp: new Date().toISOString(),
    results:   db.scorer_bets.map(b => ({
      user_name: db.users.find(u => u.id === b.user_id)?.name,
      pick:      b.name,
      points:    b.name.toLowerCase() === name.toLowerCase() ? 5 : 0,
    })).sort((a, b) => b.points - a.points),
  });
  if (db.feed.length > 50) db.feed = db.feed.slice(0, 50);
  persist();
}

// ── Feed ──────────────────────────────────────────────────────────────────────

function buildGroupStandingsServer() {
  const db = load();
  const groups = {};
  db.matches.filter(m => m.stage === 'Fase de Grupos').forEach(m => {
    const g = m.group_name || '?';
    if (!groups[g]) groups[g] = {};
    [m.home_team, m.away_team].forEach(team => {
      if (!groups[g][team]) groups[g][team] = { team, J:0, V:0, E:0, D:0, GP:0, GC:0, Pts:0 };
    });
    if (m.status === 'finished') {
      const hs = m.home_score, as_ = m.away_score;
      const h = groups[g][m.home_team], a = groups[g][m.away_team];
      h.J++; a.J++; h.GP += hs; h.GC += as_; a.GP += as_; a.GC += hs;
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

function getFeed() { return load().feed.slice(0, 20); }

function getPointsHistory() {
  const db = load();
  const finished = db.matches
    .filter(m => m.status === 'finished')
    .slice()
    .sort((a, b) => a.match_date.localeCompare(b.match_date));
  const cumulative = {};
  db.users.forEach(u => { cumulative[u.id] = 0; });
  return finished.map(m => {
    db.bets.filter(b => b.match_id === m.id).forEach(b => {
      if (cumulative[b.user_id] !== undefined) cumulative[b.user_id] += b.points;
    });
    return {
      label: `${m.home_team.split(' ')[0]} × ${m.away_team.split(' ')[0]}`,
      snapshot: db.users.map(u => ({ id: u.id, name: u.name, pts: cumulative[u.id] || 0 })),
    };
  });
}

// ── Leaderboard ───────────────────────────────────────────────────────────────

function getLeaderboard() {
  const db = load();
  const champion  = db.settings.champion;
  const topScorer = db.settings.top_scorer;

  return db.users.map(u => {
    const myBets    = db.bets.filter(b => b.user_id === u.id);
    const finished  = myBets.filter(b => db.matches.find(m => m.id === b.match_id)?.status === 'finished');
    const matchPts  = myBets.reduce((s, b) => s + b.points, 0);

    const champBet  = db.champion_bets.find(b => b.user_id === u.id);
    const champPts  = champion && champBet && champBet.team.toLowerCase() === champion.toLowerCase() ? 10 : 0;

    const scorerBet = db.scorer_bets.find(b => b.user_id === u.id);
    const scorerPts = topScorer && scorerBet && scorerBet.name.toLowerCase() === topScorer.toLowerCase() ? 5 : 0;

    return {
      id: u.id, name: u.name,
      total_points:    matchPts + champPts + scorerPts,
      match_points:    matchPts,
      champion_points: champPts,
      scorer_points:   scorerPts,
      total_bets:      myBets.length,
      exact_scores:    myBets.filter(b => b.points === 3).length,
      correct_results: myBets.filter(b => b.points === 1).length,
      wrong_bets:      finished.filter(b => b.points === 0).length,
    };
  }).sort((a, b) => b.total_points - a.total_points || b.exact_scores - a.exact_scores || a.name.localeCompare(b.name));
}

// ── Settings ──────────────────────────────────────────────────────────────────

function getSettings()            { const s = load().settings; return { champion: s.champion, top_scorer: s.top_scorer, special_bets_open: s.special_bets_open }; }
function getAdminPassword()       { return load().settings.admin_password; }
function setAdminPassword(pwd)    { const db = load(); db.settings.admin_password = pwd; persist(); }
function getLastSync()            { return load().settings.last_sync || null; }
function setLastSync(info)        { const db = load(); db.settings.last_sync = info; persist(); }

// ── Seed ──────────────────────────────────────────────────────────────────────

function needsSeed() { return load().matches.length === 0; }

function addDays(base, days, hour) {
  const d = new Date(base + 'T12:00:00Z');
  d.setUTCDate(d.getUTCDate() + days);
  const [y, mo, dy] = [d.getUTCFullYear(), String(d.getUTCMonth() + 1).padStart(2, '0'), String(d.getUTCDate()).padStart(2, '0')];
  return `${y}-${mo}-${dy}T${String(hour).padStart(2, '0')}:00:00`;
}

function seed() {
  // Real WC 2026 groups (confirmed)
  const groups = [
    { name: 'A', teams: ['México',       'África do Sul', 'Coreia do Sul', 'Tchéquia'],    venues: ['Los Angeles',   'Seattle'] },
    { name: 'B', teams: ['Canadá',       'Bósnia',        'Catar',         'Suíça'],        venues: ['Toronto',       'Vancouver'] },
    { name: 'C', teams: ['Brasil',       'Marrocos',      'Haiti',         'Escócia'],      venues: ['Dallas',        'Houston'] },
    { name: 'D', teams: ['EUA',          'Paraguai',      'Austrália',     'Turquia'],      venues: ['New York/NJ',   'Los Angeles'] },
    { name: 'E', teams: ['Alemanha',     'Curaçao',       'Costa do Marfim','Equador'],     venues: ['Chicago',       'Kansas City'] },
    { name: 'F', teams: ['Holanda',      'Japão',         'Suécia',        'Tunísia'],      venues: ['Atlanta',       'Miami'] },
    { name: 'G', teams: ['Bélgica',      'Egito',         'Irã',           'Nova Zelândia'],venues: ['Philadelphia',  'Boston'] },
    { name: 'H', teams: ['Espanha',      'Cabo Verde',    'Arábia Saudita','Uruguai'],      venues: ['San Francisco', 'Seattle'] },
    { name: 'I', teams: ['França',       'Senegal',       'Iraque',        'Noruega'],      venues: ['New York/NJ',   'Boston'] },
    { name: 'J', teams: ['Argentina',    'Argélia',       'Áustria',       'Jordânia'],     venues: ['Miami',         'Atlanta'] },
    { name: 'K', teams: ['Portugal',     'Congo RD',      'Uzbequistão',   'Colômbia'],     venues: ['Monterrey',     'Guadalajara'] },
    { name: 'L', teams: ['Inglaterra',   'Croácia',       'Gana',          'Panamá'],       venues: ['Kansas City',   'Dallas'] },
  ];
  groups.forEach((group, gi) => {
    const [t1, t2, t3, t4] = group.teams;
    const [v1, v2] = group.venues;
    createMatch({ home_team: t1, away_team: t2, match_date: addDays('2026-06-11', gi,      16), stage: 'Fase de Grupos', group_name: group.name, venue: v1 });
    createMatch({ home_team: t3, away_team: t4, match_date: addDays('2026-06-11', gi,      20), stage: 'Fase de Grupos', group_name: group.name, venue: v2 });
    createMatch({ home_team: t1, away_team: t3, match_date: addDays('2026-06-11', 12 + gi, 16), stage: 'Fase de Grupos', group_name: group.name, venue: v2 });
    createMatch({ home_team: t2, away_team: t4, match_date: addDays('2026-06-11', 12 + gi, 20), stage: 'Fase de Grupos', group_name: group.name, venue: v1 });
    createMatch({ home_team: t1, away_team: t4, match_date: addDays('2026-06-11', 24 + gi, 18), stage: 'Fase de Grupos', group_name: group.name, venue: v1 });
    createMatch({ home_team: t2, away_team: t3, match_date: addDays('2026-06-11', 24 + gi, 18), stage: 'Fase de Grupos', group_name: group.name, venue: v2 });
  });
}

module.exports = {
  getUsers, getUserById, createUser,
  getMatches, getMatchById, createMatch, editMatch, setMatchResult, deleteMatch, replaceGroupStage,
  getBets, upsertBet, clearUserBets, upsertKnockoutMatches,
  getSpecialBetsOpen, setSpecialBetsOpen,
  getChampionBets, upsertChampionBet, setChampion,
  getScorerBets, upsertScorerBet, setTopScorer,
  buildGroupStandingsServer, getFeed, getPointsHistory,
  getLeaderboard,
  getSettings, getAdminPassword, setAdminPassword,
  getLastSync, setLastSync,
  needsSeed, seed,
};
