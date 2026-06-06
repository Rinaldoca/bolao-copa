const fs   = require('fs');
const path = require('path');

const DATA_DIR = process.env.DATA_DIR || __dirname;
const FILE = path.join(DATA_DIR, 'bolao.json');

const DEFAULTS = {
  settings: { admin_password: 'bolao2026' },
  _seq:     { users: 0, matches: 0, bets: 0 },
  users:    [],
  matches:  [],
  bets:     [],
};

let _data = null;

function load() {
  if (_data) return _data;
  try {
    _data = JSON.parse(fs.readFileSync(FILE, 'utf8'));
  } catch {
    _data = JSON.parse(JSON.stringify(DEFAULTS));
    persist();
  }
  return _data;
}

function persist() {
  fs.writeFileSync(FILE, JSON.stringify(_data, null, 2));
}

// ── Users ────────────────────────────────────────────────────────────────────

function getUsers() {
  return load().users.slice().sort((a, b) => a.name.localeCompare(b.name));
}

function getUserById(id) {
  return load().users.find(u => u.id === id) || null;
}

function createUser(name) {
  const db = load();
  const clash = db.users.find(u => u.name.toLowerCase() === name.toLowerCase());
  if (clash) throw new Error('DUPLICATE');
  const user = { id: ++db._seq.users, name, created_at: new Date().toISOString() };
  db.users.push(user);
  persist();
  return user;
}

// ── Matches ──────────────────────────────────────────────────────────────────

function getMatches() {
  return load().matches.slice().sort((a, b) =>
    a.match_date.localeCompare(b.match_date) || a.id - b.id
  );
}

function getMatchById(id) {
  return load().matches.find(m => m.id === id) || null;
}

function createMatch({ home_team, away_team, match_date, stage, group_name, venue }) {
  const db = load();
  const match = {
    id: ++db._seq.matches,
    home_team, away_team, match_date,
    stage:       stage       || 'Fase de Grupos',
    group_name:  group_name  || null,
    venue:       venue       || null,
    home_score:  null,
    away_score:  null,
    status:      'upcoming',
    created_at:  new Date().toISOString(),
  };
  db.matches.push(match);
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

  // Recalculate points for every bet on this match
  const matchResult = Math.sign(home_score - away_score);
  db.bets.filter(b => b.match_id === id).forEach(bet => {
    if (bet.home_score === home_score && bet.away_score === away_score) {
      bet.points = 3;
    } else if (Math.sign(bet.home_score - bet.away_score) === matchResult) {
      bet.points = 1;
    } else {
      bet.points = 0;
    }
  });

  persist();
  return match;
}

function deleteMatch(id) {
  const db = load();
  db.matches = db.matches.filter(m => m.id !== id);
  db.bets    = db.bets.filter(b => b.match_id !== id);
  persist();
}

// ── Bets ─────────────────────────────────────────────────────────────────────

function getBets({ user_id, match_id } = {}) {
  const db = load();
  return db.bets
    .filter(b => (user_id == null || b.user_id === user_id) &&
                 (match_id == null || b.match_id === match_id))
    .map(b => {
      const u = db.users.find(u => u.id === b.user_id);
      const m = db.matches.find(m => m.id === b.match_id);
      return {
        ...b,
        user_name:   u?.name,
        home_team:   m?.home_team,
        away_team:   m?.away_team,
        match_home:  m?.home_score,
        match_away:  m?.away_score,
        status:      m?.status,
      };
    })
    .sort((a, b) => {
      const ma = db.matches.find(m => m.id === a.match_id);
      const mb = db.matches.find(m => m.id === b.match_id);
      return (ma?.match_date || '').localeCompare(mb?.match_date || '');
    });
}

function upsertBet({ user_id, match_id, home_score, away_score }) {
  const db = load();
  let bet = db.bets.find(b => b.user_id === user_id && b.match_id === match_id);
  if (bet) {
    bet.home_score = home_score;
    bet.away_score = away_score;
  } else {
    bet = {
      id: ++db._seq.bets,
      user_id, match_id, home_score, away_score,
      points: 0,
      created_at: new Date().toISOString(),
    };
    db.bets.push(bet);
  }
  persist();
  return bet;
}

// ── Leaderboard ──────────────────────────────────────────────────────────────

function getLeaderboard() {
  const db = load();
  return db.users.map(u => {
    const myBets = db.bets.filter(b => b.user_id === u.id);
    const finished = myBets.filter(b => {
      const m = db.matches.find(m => m.id === b.match_id);
      return m?.status === 'finished';
    });
    return {
      id:              u.id,
      name:            u.name,
      total_points:    myBets.reduce((s, b) => s + b.points, 0),
      total_bets:      myBets.length,
      exact_scores:    myBets.filter(b => b.points === 3).length,
      correct_results: myBets.filter(b => b.points === 1).length,
      wrong_bets:      finished.filter(b => b.points === 0).length,
    };
  }).sort((a, b) =>
    b.total_points - a.total_points ||
    b.exact_scores - a.exact_scores ||
    a.name.localeCompare(b.name)
  );
}

// ── Settings ─────────────────────────────────────────────────────────────────

function getAdminPassword() {
  return load().settings.admin_password;
}

function setAdminPassword(pwd) {
  const db = load();
  db.settings.admin_password = pwd;
  persist();
}

// ── Seed ─────────────────────────────────────────────────────────────────────

function needsSeed() {
  return load().matches.length === 0;
}

function addDays(base, days, hour) {
  const d = new Date(base + 'T12:00:00Z');
  d.setUTCDate(d.getUTCDate() + days);
  const y  = d.getUTCFullYear();
  const mo = String(d.getUTCMonth() + 1).padStart(2, '0');
  const dy = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${mo}-${dy}T${String(hour).padStart(2, '0')}:00:00`;
}

function seed() {
  const groups = [
    { name: 'A', teams: ['EUA',       'Panamá',     'Honduras',     'Jamaica'],          venues: ['Los Angeles', 'Seattle'] },
    { name: 'B', teams: ['México',    'Equador',    'Venezuela',    'Costa Rica'],        venues: ['Cidade do México', 'Guadalajara'] },
    { name: 'C', teams: ['Canadá',    'Ucrânia',    'Eslovênia',    'Noruega'],           venues: ['Toronto', 'Vancouver'] },
    { name: 'D', teams: ['Argentina', 'Chile',      'Polônia',      'Marrocos'],          venues: ['Miami', 'Atlanta'] },
    { name: 'E', teams: ['Brasil',    'Colômbia',   'Suíça',        'Costa do Marfim'],   venues: ['Dallas', 'Houston'] },
    { name: 'F', teams: ['França',    'Senegal',    'Japão',        'Austrália'],         venues: ['New York/NJ', 'Boston'] },
    { name: 'G', teams: ['Inglaterra','Nigéria',    'Irã',          'Dinamarca'],         venues: ['Philadelphia', 'Kansas City'] },
    { name: 'H', teams: ['Espanha',   'Croácia',    'Coreia do Sul','Tunísia'],           venues: ['San Francisco', 'Los Angeles'] },
    { name: 'I', teams: ['Portugal',  'Bélgica',    'Gana',         'Camarões'],          venues: ['Monterrey', 'Guadalajara'] },
    { name: 'J', teams: ['Alemanha',  'Uruguai',    'Arábia Saudita','Sérvia'],           venues: ['Chicago', 'Kansas City'] },
    { name: 'K', teams: ['Holanda',   'Paraguai',   'Egito',        'Turquia'],           venues: ['Dallas', 'Houston'] },
    { name: 'L', teams: ['Itália',    'Áustria',    'Peru',         'Catar'],             venues: ['Miami', 'Atlanta'] },
  ];

  // Group stage: June 11 → July 15, 2026
  // Each group: Matchday 1 on day gi, MD2 on day 12+gi, MD3 on day 24+gi
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
  getMatches, getMatchById, createMatch, setMatchResult, deleteMatch,
  getBets, upsertBet,
  getLeaderboard,
  getAdminPassword, setAdminPassword,
  needsSeed, seed,
};
