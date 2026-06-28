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

const GROUP_ROUNDS = ['1ª Rodada', '2ª Rodada', '3ª Rodada'];
function isGroupRound(s) { return GROUP_ROUNDS.includes(s) || s === 'Fase de Grupos'; }

function assignGroupRounds(db) {
  const byGroup = {};
  db.matches.filter(m => isGroupRound(m.stage) && m.group_name).forEach(m => {
    (byGroup[m.group_name] = byGroup[m.group_name] || []).push(m);
  });
  Object.values(byGroup).forEach(gms => {
    gms.sort((a, b) => a.match_date.localeCompare(b.match_date));
    gms.forEach((m, i) => { m.stage = GROUP_ROUNDS[Math.min(Math.floor(i / 2), 2)]; });
  });
}

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
    // Migrate "Fase de Grupos" to per-round stages
    if (_data.matches.some(m => m.stage === 'Fase de Grupos')) {
      assignGroupRounds(_data);
      persist();
    }
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

function renameUser(id, name) {
  const db = load();
  const user = db.users.find(u => u.id === id);
  if (!user) return null;
  if (db.users.find(u => u.id !== id && u.name.toLowerCase() === name.toLowerCase())) throw new Error('DUPLICATE');
  user.name = name;
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
  const oldIds = new Set(db.matches.filter(m => isGroupRound(m.stage)).map(m => m.id));
  const deletedBets = db.bets.filter(b => oldIds.has(b.match_id)).length;
  db.matches = db.matches.filter(m => !isGroupRound(m.stage));
  db.bets    = db.bets.filter(b => !oldIds.has(b.match_id));
  db.feed    = db.feed.filter(f => !oldIds.has(f.match_id));
  for (const m of newMatches) {
    db.matches.push({
      id: ++db._seq.matches,
      api_match_id: m.api_match_id || null,
      home_team:    m.home_team,
      away_team:    m.away_team,
      match_date:   m.match_date,
      stage:        '1ª Rodada',
      group_name:   m.group_name || null,
      venue:        m.venue || null,
      home_score:   null, away_score: null,
      status:       'upcoming',
      created_at:   new Date().toISOString(),
    });
  }
  assignGroupRounds(db);
  persist();
  return deletedBets;
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

// Tier: 3=exact · 2=goal diff · 1=right winner · 0=miss
// Points per tier vary by stage in the knockout rounds.
const BASE_SCORES  = [0, 2, 3, 4]; // group stage + 32 avos de Final
const STAGE_SCORES = {
  'Oitavas de Final': [0, 3, 4, 5],
  'Quartas de Final': [0, 4, 5, 6],
  'Semifinal':        [0, 5, 6, 7],
  'Terceiro Lugar':   [0, 5, 6, 7],
  'Final':            [0, 6, 7, 8],
};

// match_winner: 'home' | 'away' | null (null = regular finish, derive from score)
// For penalty matches the 90-min score is a draw; bet.bet_winner stores the
// bettor's predicted pen winner. Only correct pen prediction earns rightWinner.
function getBetTier(bet, home_score, away_score, match_winner) {
  const exact    = bet.home_score === home_score && bet.away_score === away_score;
  const sameDiff = bet.home_score - bet.away_score === home_score - away_score;

  const effectiveWinner = match_winner ||
    (home_score > away_score ? 'home' : away_score > home_score ? 'away' : 'draw');
  const betWinner = bet.home_score > bet.away_score ? 'home'
                  : bet.away_score > bet.home_score ? 'away' : 'draw';

  let rightWinner;
  if (match_winner && betWinner === 'draw') {
    // Draw bet on a pen match: must have predicted the right pen winner
    rightWinner = bet.bet_winner === match_winner;
  } else {
    rightWinner = betWinner === effectiveWinner;
  }

  if (exact    && rightWinner) return 3;
  if (sameDiff && rightWinner) return 2;
  if (rightWinner)             return 1;
  return 0;
}

function scoreBet(bet, home_score, away_score, stage, match_winner) {
  const tier = getBetTier(bet, home_score, away_score, match_winner);
  return (STAGE_SCORES[stage] || BASE_SCORES)[tier];
}

function setMatchResult(id, home_score, away_score, match_winner) {
  const db = load();
  const match = db.matches.find(m => m.id === id);
  if (!match) return null;
  match.home_score   = home_score;
  match.away_score   = away_score;
  match.status       = 'finished';
  match.match_winner = match_winner || null;

  const betResults = [];
  db.bets.filter(b => b.match_id === id).forEach(bet => {
    bet.tier   = getBetTier(bet, home_score, away_score, match.match_winner);
    bet.points = (STAGE_SCORES[match.stage] || BASE_SCORES)[bet.tier];
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

  advanceKnockoutWinner(db, match);

  persist();
  return match;
}

// ── Knockout bracket auto-advance ─────────────────────────────────────────────
// FIFA 2026 bracket structure from ESPN. Each entry: [srcPos, dstPos, slot]
// where pos = 0-indexed position within stage sorted by match_date.
const BRACKET = {
  '32 avos de Final': [        // → Oitavas de Final
    [0,  0, 'home'], [2,  0, 'away'],
    [1,  1, 'home'], [4,  1, 'away'],
    [3,  2, 'home'], [5,  2, 'away'],
    [6,  3, 'home'], [7,  3, 'away'],
    [10, 4, 'home'], [11, 4, 'away'],
    [8,  5, 'home'], [9,  5, 'away'],
    [13, 6, 'home'], [15, 6, 'away'],
    [12, 7, 'home'], [14, 7, 'away'],
  ],
  'Oitavas de Final': [        // → Quartas de Final
    [0, 0, 'home'], [1, 0, 'away'],
    [4, 1, 'home'], [5, 1, 'away'],
    [2, 2, 'home'], [3, 2, 'away'],
    [6, 3, 'home'], [7, 3, 'away'],
  ],
  'Quartas de Final': [        // → Semifinal
    [0, 0, 'home'], [1, 0, 'away'],
    [2, 1, 'home'], [3, 1, 'away'],
  ],
  'Semifinal': [               // → Final (winners) and Terceiro Lugar (losers)
    [0, 0, 'home'], [1, 0, 'away'],  // Final
  ],
};
const NEXT_STAGE = {
  '32 avos de Final': 'Oitavas de Final',
  'Oitavas de Final': 'Quartas de Final',
  'Quartas de Final': 'Semifinal',
  'Semifinal':        'Final',
};

function advanceKnockoutWinner(db, match) {
  const rules = BRACKET[match.stage];
  if (!rules) return;

  const stageMatches = db.matches
    .filter(m => m.stage === match.stage)
    .sort((a, b) => new Date(a.match_date) - new Date(b.match_date));
  const srcPos = stageMatches.findIndex(m => m.id === match.id);
  if (srcPos === -1) return;

  const rule = rules.find(r => r[0] === srcPos);
  if (!rule) return;

  const [, dstPos, slot] = rule;
  const nextStage = NEXT_STAGE[match.stage];
  const nextMatches = db.matches
    .filter(m => m.stage === nextStage)
    .sort((a, b) => new Date(a.match_date) - new Date(b.match_date));
  const nextMatch = nextMatches[dstPos];
  if (!nextMatch) return;

  const winner = match.home_score > match.away_score ? match.home_team : match.away_team;
  if (slot === 'home') nextMatch.home_team = winner;
  else                 nextMatch.away_team = winner;

  // For Semifinal, also fill 3rd place match with the loser
  if (match.stage === 'Semifinal') {
    const loser = match.home_score > match.away_score ? match.away_team : match.home_team;
    const thirdMatches = db.matches
      .filter(m => m.stage === 'Terceiro Lugar')
      .sort((a, b) => new Date(a.match_date) - new Date(b.match_date));
    if (thirdMatches[0]) {
      if (slot === 'home') thirdMatches[0].home_team = loser;
      else                 thirdMatches[0].away_team = loser;
    }
  }
}

// Re-score every finished match's bets (and feed snapshots) with the current
// scoring formula. Idempotent — safe to run on boot after a formula change.
function recomputeAllPoints() {
  const db = load();
  const scoreOf = {};
  db.matches.forEach(m => {
    if (m.status === 'finished' && m.home_score != null && m.away_score != null) {
      scoreOf[m.id] = [m.home_score, m.away_score, m.stage, m.match_winner || null];
    }
  });
  db.bets.forEach(b => {
    const r = scoreOf[b.match_id];
    if (r) {
      b.tier   = getBetTier(b, r[0], r[1], r[3]);
      b.points = (STAGE_SCORES[r[2]] || BASE_SCORES)[b.tier];
    }
  });
  db.feed.forEach(entry => {
    if (entry.type === 'match_result' && Array.isArray(entry.results)) {
      const m      = db.matches.find(x => x.id === entry.match_id);
      const scores = STAGE_SCORES[m?.stage] || BASE_SCORES;
      entry.results.forEach(r => {
        r.points = scores[getBetTier(r, entry.home_score, entry.away_score, m?.match_winner)];
      });
      entry.results.sort((a, b) => b.points - a.points);
    }
  });
  persist();
}

const SCORING_VERSION = 3;
function applyScoringMigration() {
  const db = load();
  if (db.settings.scoring_version === SCORING_VERSION) return;
  recomputeAllPoints();
  db.settings.scoring_version = SCORING_VERSION;
  persist();
}

function upsertKnockoutMatches(matches) {
  const db = load();
  let added = 0, updated = 0;
  for (const m of matches) {
    let existing = m.api_match_id
      ? db.matches.find(x => x.api_match_id === m.api_match_id)
      : null;
    // Fallback: match by stage + same calendar day for locally-generated matches
    // (api_match_id null). Use day-only comparison because API times may differ
    // from hardcoded dates by up to an hour. Only accept when exactly 1 candidate
    // exists for that stage/day so we never misassign.
    if (!existing && m.api_match_id && m.stage && m.match_date) {
      const day = m.match_date.slice(0, 10);
      const candidates = db.matches.filter(
        x => x.stage === m.stage && x.match_date?.slice(0, 10) === day && !x.api_match_id
      );
      if (candidates.length === 1) existing = candidates[0];
    }
    if (existing) {
      if (m.api_match_id && !existing.api_match_id) existing.api_match_id = m.api_match_id;
      if (m.home_team && m.home_team !== 'A definir') existing.home_team = m.home_team;
      if (m.away_team && m.away_team !== 'A definir') existing.away_team = m.away_team;
      existing.match_date = m.match_date;
      if (m.venue) existing.venue = m.venue;
      if (m.status === 'finished' && existing.status !== 'finished' &&
          m.home_score != null && m.away_score != null) {
        setMatchResult(existing.id, m.home_score, m.away_score);
      }
      updated++;
    } else if (m.home_team && m.home_team !== 'A definir' && m.away_team && m.away_team !== 'A definir') {
      // Only create a new match when the API actually knows who's playing.
      // Skip "A definir" entries — placeholder matches already exist from generateKnockout.
      db.matches.push({
        id: ++db._seq.matches,
        api_match_id: m.api_match_id || null,
        home_team:    m.home_team,
        away_team:    m.away_team,
        match_date:   m.match_date,
        stage:        m.stage,
        group_name:   null,
        venue:        m.venue || null,
        home_score:   m.home_score ?? null,
        away_score:   m.away_score ?? null,
        status:       m.status || 'upcoming',
        created_at:   new Date().toISOString(),
      });
      added++;
    }
  }
  persist();
  return { added, updated };
}

function clearMatchResult(id) {
  const db = load();
  const match = db.matches.find(m => m.id === id);
  if (!match) return null;
  match.home_score   = null;
  match.away_score   = null;
  match.match_winner = null;
  match.status       = 'upcoming';
  db.bets.filter(b => b.match_id === id).forEach(b => { b.points = 0; b.tier = undefined; });
  db.feed = db.feed.filter(f => f.match_id !== id);
  persist();
  return match;
}

function reassignMatchId(fromId, toId) {
  const db = load();
  if (db.matches.find(m => m.id === toId)) return { ok: false, error: `ID ${toId} já está em uso` };
  const match = db.matches.find(m => m.id === fromId);
  if (!match) return { ok: false, error: `Partida ${fromId} não encontrada` };
  match.id = toId;
  db.bets.filter(b => b.match_id === fromId).forEach(b => { b.match_id = toId; });
  db.feed.filter(f => f.match_id === fromId).forEach(f => { f.match_id = toId; });
  persist();
  return { ok: true, match };
}

function editKnockoutMatch(id, fields) {
  const db = load();
  const match = db.matches.find(m => m.id === id);
  if (!match) return;
  const allowed = ['api_match_id','home_team','away_team','match_date','venue','status','home_score','away_score','bet_opens_at'];
  for (const key of allowed) {
    if (key in fields) match[key] = fields[key];
  }
  persist();
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

function upsertBet({ user_id, match_id, home_score, away_score, bet_winner }) {
  const db = load();
  const isDraw = home_score === away_score;
  const winner = isDraw && ['home','away'].includes(bet_winner) ? bet_winner : null;
  let bet = db.bets.find(b => b.user_id === user_id && b.match_id === match_id);
  if (bet) {
    bet.home_score  = home_score;
    bet.away_score  = away_score;
    bet.bet_winner  = winner;
  } else {
    bet = { id: ++db._seq.bets, user_id, match_id, home_score, away_score, bet_winner: winner, points: 0, created_at: new Date().toISOString() };
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
      .filter(m => m.status === 'upcoming' && new Date(m.match_date) - LOCK_MS >= now)
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
  db.settings.champion = team.trim();
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
  db.settings.top_scorer = name.trim();
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
  db.matches.filter(m => isGroupRound(m.stage)).forEach(m => {
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
  const champion  = db.settings.champion;
  const topScorer = db.settings.top_scorer;

  const finished = db.matches
    .filter(m => m.status === 'finished')
    .slice()
    .sort((a, b) => a.match_date.localeCompare(b.match_date));
  const cumulative = {};
  db.users.forEach(u => { cumulative[u.id] = 0; });

  const result = finished.map(m => {
    db.bets.filter(b => b.match_id === m.id).forEach(b => {
      if (cumulative[b.user_id] !== undefined) cumulative[b.user_id] += b.points;
    });
    const matchDay = m.match_date.slice(0, 10);
    const activeUsers = db.users.filter(u => !u.created_at || u.created_at.slice(0, 10) <= matchDay);
    return {
      label: `${m.home_team.split(' ')[0]} × ${m.away_team.split(' ')[0]}`,
      snapshot: activeUsers.map(u => ({ id: u.id, name: u.name, pts: cumulative[u.id] || 0 })),
    };
  });

  // Add special-bet bonuses as a final snapshot so the chart end matches the leaderboard
  if (result.length > 0 && (champion || topScorer)) {
    const specialCumulative = { ...cumulative };
    let hasBonus = false;
    db.users.forEach(u => {
      const champBet  = db.champion_bets.find(b => b.user_id === u.id);
      const scorerBet = db.scorer_bets.find(b => b.user_id === u.id);
      const champPts  = champion  && champBet  && champBet.team.toLowerCase()  === champion.toLowerCase()  ? 10 : 0;
      const scorerPts = topScorer && scorerBet && scorerBet.name.toLowerCase() === topScorer.toLowerCase() ? 5  : 0;
      if (champPts + scorerPts > 0) {
        specialCumulative[u.id] = (specialCumulative[u.id] || 0) + champPts + scorerPts;
        hasBonus = true;
      }
    });
    if (hasBonus) {
      result.push({
        label: '🏆 Especiais',
        snapshot: db.users.map(u => ({ id: u.id, name: u.name, pts: specialCumulative[u.id] || 0 })),
      });
    }
  }

  return result;
}

// ── Leaderboard ───────────────────────────────────────────────────────────────

function getLeaderboard(stage) {
  const db = load();
  const champion  = db.settings.champion;
  const topScorer = db.settings.top_scorer;

  return db.users.map(u => {
    let myBets = db.bets.filter(b => b.user_id === u.id);
    if (stage) {
      myBets = myBets.filter(b => db.matches.find(m => m.id === b.match_id)?.stage === stage);
    }
    const finished  = myBets.filter(b => db.matches.find(m => m.id === b.match_id)?.status === 'finished');
    const matchPts  = myBets.reduce((s, b) => s + b.points, 0);

    const champBet  = stage ? null : db.champion_bets.find(b => b.user_id === u.id);
    const champPts  = !stage && champion && champBet && champBet.team.toLowerCase() === champion.toLowerCase() ? 10 : 0;

    const scorerBet = stage ? null : db.scorer_bets.find(b => b.user_id === u.id);
    const scorerPts = !stage && topScorer && scorerBet && scorerBet.name.toLowerCase() === topScorer.toLowerCase() ? 5 : 0;

    return {
      id: u.id, name: u.name,
      total_points:    matchPts + champPts + scorerPts,
      match_points:    matchPts,
      champion_points: champPts,
      scorer_points:   scorerPts,
      total_bets:      myBets.length,
      exact_scores:    myBets.filter(b => b.tier === 3).length,
      diff_scores:     myBets.filter(b => b.tier === 2).length,
      correct_results: myBets.filter(b => b.tier === 1).length,
      wrong_bets:      finished.filter(b => b.tier === 0).length,
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
    createMatch({ home_team: t1, away_team: t2, match_date: addDays('2026-06-11', gi,      16), stage: '1ª Rodada', group_name: group.name, venue: v1 });
    createMatch({ home_team: t3, away_team: t4, match_date: addDays('2026-06-11', gi,      20), stage: '1ª Rodada', group_name: group.name, venue: v2 });
    createMatch({ home_team: t1, away_team: t3, match_date: addDays('2026-06-11', 12 + gi, 16), stage: '2ª Rodada', group_name: group.name, venue: v2 });
    createMatch({ home_team: t2, away_team: t4, match_date: addDays('2026-06-11', 12 + gi, 20), stage: '2ª Rodada', group_name: group.name, venue: v1 });
    createMatch({ home_team: t1, away_team: t4, match_date: addDays('2026-06-11', 24 + gi, 18), stage: '3ª Rodada', group_name: group.name, venue: v1 });
    createMatch({ home_team: t2, away_team: t3, match_date: addDays('2026-06-11', 24 + gi, 18), stage: '3ª Rodada', group_name: group.name, venue: v2 });
  });
}

function getGroupAwards() {
  const db = load();
  const matchMap = Object.fromEntries(db.matches.map(m => [m.id, m]));

  const stats = db.users.map(u => {
    const myBets = db.bets.filter(b => b.user_id === u.id);
    const finished = myBets
      .filter(b => matchMap[b.match_id]?.status === 'finished')
      .sort((a, b) => (matchMap[a.match_id]?.match_date || '').localeCompare(matchMap[b.match_id]?.match_date || ''));

    if (!finished.length) return null;

    // Current streak (from most recent backwards)
    let currentStreak = 0;
    for (let i = finished.length - 1; i >= 0; i--) {
      if (finished[i].points > 0) currentStreak++;
      else break;
    }
    // Best streak ever
    let bestStreak = 0, temp = 0;
    for (const b of finished) {
      if (b.points > 0) { temp++; bestStreak = Math.max(bestStreak, temp); }
      else temp = 0;
    }

    const exactScores = finished.filter(b => b.tier === 3).length;
    const correct     = finished.filter(b => b.points > 0).length;
    const accuracy    = finished.length >= 3 ? correct / finished.length : -1;

    // Current miss streak (consecutive 0-point bets from most recent backwards)
    let negStreak = 0;
    for (let i = finished.length - 1; i >= 0; i--) {
      if (finished[i].points === 0) negStreak++;
      else break;
    }
    // Worst miss streak ever (for tiebreaking)
    let worstNegStreak = 0, negTemp = 0;
    for (const b of finished) {
      if (b.points === 0) { negTemp++; worstNegStreak = Math.max(worstNegStreak, negTemp); }
      else negTemp = 0;
    }

    return { id: u.id, name: u.name, exactScores, currentStreak, bestStreak, accuracy, finishedCount: finished.length, negStreak, worstNegStreak };
  }).filter(Boolean);

  if (!stats.length) return null;

  const top = (arr, key, min = 1) => {
    const s = [...arr].sort((a, b) => b[key] - a[key]);
    return s[0]?.[key] >= min ? s[0] : null;
  };

  return {
    rei_exato:        top(stats, 'exactScores'),
    maior_streak:     top(stats.map(s => ({ ...s, _streak: s.bestStreak })), '_streak'),
    mais_consistente: (() => {
      const eligible = stats.filter(s => s.accuracy >= 0).sort((a, b) => b.accuracy - a.accuracy);
      return eligible[0]?.accuracy > 0 ? eligible[0] : null;
    })(),
    pior_fase:        top(stats.filter(s => s.negStreak > 0).map(s => ({ ...s, _neg: s.negStreak })), '_neg') ||
                      top(stats.filter(s => s.worstNegStreak > 0).map(s => ({ ...s, _neg: s.worstNegStreak })), '_neg'),
  };
}

function getMatchStats() {
  const db = load();
  const finished = db.matches.filter(m => m.status === 'finished');
  return finished.map(m => {
    const bets = db.bets.filter(b => b.match_id === m.id);
    const total = bets.length;
    if (total === 0) return null;
    const exact   = bets.filter(b => b.tier === 3).length;
    const correct = bets.filter(b => b.points > 0).length;
    return {
      id: m.id,
      home_team: m.home_team, away_team: m.away_team,
      home_score: m.home_score, away_score: m.away_score,
      stage: m.stage,
      total, exact, correct,
      exactPct: exact / total,
      correctPct: correct / total,
    };
  }).filter(Boolean).sort((a, b) => a.correctPct - b.correctPct);
}

module.exports = {
  getUsers, getUserById, createUser, renameUser,
  getMatches, getMatchById, createMatch, editMatch, setMatchResult, clearMatchResult, reassignMatchId, deleteMatch, replaceGroupStage,
  getBets, upsertBet, clearUserBets, upsertKnockoutMatches, editKnockoutMatch,
  getSpecialBetsOpen, setSpecialBetsOpen,
  getChampionBets, upsertChampionBet, setChampion,
  getScorerBets, upsertScorerBet, setTopScorer,
  buildGroupStandingsServer, getFeed, getPointsHistory,
  getLeaderboard, getGroupAwards, getMatchStats,
  getSettings, getAdminPassword, setAdminPassword,
  getLastSync, setLastSync,
  needsSeed, seed,
  recomputeAllPoints, applyScoringMigration,
};
