const https = require('https');
const db = require('./db');

const API_BASE = 'https://api.football-data.org/v4';

// English API names → Portuguese local DB names
const TEAM_MAP = {
  'Brazil':                'Brasil',
  'France':                'França',
  'Germany':               'Alemanha',
  'Spain':                 'Espanha',
  'Argentina':             'Argentina',
  'England':               'Inglaterra',
  'Italy':                 'Itália',
  'Netherlands':           'Holanda',
  'Croatia':               'Croácia',
  'Belgium':               'Bélgica',
  'Uruguay':               'Uruguai',
  'Mexico':                'México',
  'Colombia':              'Colômbia',
  'Switzerland':           'Suíça',
  'Japan':                 'Japão',
  'South Korea':           'Coreia do Sul',
  'Korea Republic':        'Coreia do Sul',
  'Morocco':               'Marrocos',
  'Senegal':               'Senegal',
  'USA':                   'EUA',
  'United States':         'EUA',
  'Canada':                'Canadá',
  'Australia':             'Austrália',
  'Ecuador':               'Equador',
  'Poland':                'Polônia',
  'Denmark':               'Dinamarca',
  'Serbia':                'Sérvia',
  'Iran':                  'Irã',
  'IR Iran':               'Irã',
  "Côte d'Ivoire":         'Costa do Marfim',
  'Ivory Coast':           'Costa do Marfim',
  'Ghana':                 'Gana',
  'Cameroon':              'Camarões',
  'Tunisia':               'Tunísia',
  'Saudi Arabia':          'Arábia Saudita',
  'Norway':                'Noruega',
  'Ukraine':               'Ucrânia',
  'Slovenia':              'Eslovênia',
  'Turkey':                'Turquia',
  'Türkiye':               'Turquia',
  'Austria':               'Áustria',
  'Chile':                 'Chile',
  'Paraguay':              'Paraguai',
  'Peru':                  'Peru',
  'Venezuela':             'Venezuela',
  'Panama':                'Panamá',
  'Honduras':              'Honduras',
  'Jamaica':               'Jamaica',
  'Costa Rica':            'Costa Rica',
  'Egypt':                 'Egito',
  'Qatar':                 'Catar',
  'Nigeria':               'Nigéria',
  'Portugal':              'Portugal',
  // Real WC 2026 teams
  'South Africa':          'África do Sul',
  'Czechia':               'Tchéquia',
  'Bosnia-Herzegovina':    'Bósnia',
  'Haiti':                 'Haiti',
  'Scotland':              'Escócia',
  'Curaçao':               'Curaçao',
  'Sweden':                'Suécia',
  'Cape Verde Islands':    'Cabo Verde',
  'New Zealand':           'Nova Zelândia',
  'Iraq':                  'Iraque',
  'Algeria':               'Argélia',
  'Jordan':                'Jordânia',
  'Congo DR':              'Congo RD',
  'Uzbekistan':            'Uzbequistão',
};

function toPortuguese(name) {
  return TEAM_MAP[name] || name;
}

function normalize(name) {
  return toPortuguese(name).toLowerCase().trim();
}

function fetchJson(url, token) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'X-Auth-Token': token } }, res => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        if (res.statusCode === 429) { reject(new Error('Rate limit atingido (429) — aguarde 1 minuto')); return; }
        if (res.statusCode !== 200) { reject(new Error(`API retornou HTTP ${res.statusCode}: ${data.slice(0, 200)}`)); return; }
        try { resolve(JSON.parse(data)); } catch (e) { reject(e); }
      });
    }).on('error', reject);
  });
}

function fetchEspn(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, res => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        if (res.statusCode !== 200) { reject(new Error(`ESPN HTTP ${res.statusCode}`)); return; }
        try { resolve(JSON.parse(data)); } catch (e) { reject(e); }
      });
    }).on('error', reject);
  });
}

function isoDay(str) { return str ? str.slice(0, 10) : null; }

const ESPN_SCOREBOARD = 'https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard';
const ESPN_FINISHED   = new Set(['STATUS_FULL_TIME','STATUS_FINAL_AET','STATUS_FINAL_PEN','STATUS_FULL_PEN','STATUS_ENDED']);

// ── Sync results ──────────────────────────────────────────────────────────────

async function syncMatches() {
  const now     = new Date();
  const pending = db.getMatches().filter(m => m.status === 'upcoming' && new Date(m.match_date) < now);

  if (!pending.length) {
    const result = { ok: true, updated: 0, skipped: 0, not_found: 0, pending: 0, time: now.toISOString() };
    db.setLastSync(result);
    return result;
  }

  // Unique dates to fetch from ESPN
  const dates = [...new Set(pending.map(m => isoDay(m.match_date)))];

  const espnLookup = {};
  for (const date of dates) {
    try {
      const data = await fetchEspn(`${ESPN_SCOREBOARD}?dates=${date.replace(/-/g, '')}`);
      for (const event of data.events || []) {
        const comp = event.competitions?.[0];
        if (!comp) continue;
        const home = comp.competitors?.find(c => c.homeAway === 'home');
        const away = comp.competitors?.find(c => c.homeAway === 'away');
        if (!home || !away) continue;
        const key = `${isoDay(event.date)}|${normalize(home.team.displayName)}|${normalize(away.team.displayName)}`;
        espnLookup[key] = {
          statusName: comp.status?.type?.name,
          completed:  comp.status?.type?.completed,
          homeScore:  parseInt(home.score),
          awayScore:  parseInt(away.score),
        };
      }
    } catch (err) {
      const result = { ok: false, error: `Erro ESPN (${date}): ${err.message}`, time: now.toISOString() };
      db.setLastSync(result);
      return result;
    }
  }

  let updated = 0, skipped = 0, notFound = 0;

  for (const local of pending) {
    const key = `${isoDay(local.match_date)}|${normalize(local.home_team)}|${normalize(local.away_team)}`;
    const hit = espnLookup[key];

    if (!hit) { notFound++; continue; }
    if (!ESPN_FINISHED.has(hit.statusName) && !hit.completed) { skipped++; continue; }
    if (isNaN(hit.homeScore) || isNaN(hit.awayScore)) { skipped++; continue; }

    db.setMatchResult(local.id, hit.homeScore, hit.awayScore);
    updated++;
  }

  const result = { ok: true, updated, skipped, not_found: notFound, pending: pending.length, time: now.toISOString() };
  db.setLastSync(result);
  console.log(`[sync] ${result.time} — updated:${updated} skipped:${skipped} not_found:${notFound}`);
  return result;
}

// ── Import group stage ────────────────────────────────────────────────────────

async function importGroupStage() {
  const apiKey = process.env.FOOTBALL_API_KEY;
  if (!apiKey) return { ok: false, error: 'Variável FOOTBALL_API_KEY não configurada' };

  let apiMatches;
  try {
    const data = await fetchJson(`${API_BASE}/competitions/WC/matches?stage=GROUP_STAGE`, apiKey);
    apiMatches = data.matches || [];
  } catch (err) {
    return { ok: false, error: `Erro na API: ${err.message}` };
  }

  if (!apiMatches.length) return { ok: false, error: 'Nenhuma partida retornada pela API' };

  const mapped = apiMatches.map(m => ({
    api_match_id: m.id,
    home_team:    toPortuguese(m.homeTeam?.name || m.homeTeam?.shortName || ''),
    away_team:    toPortuguese(m.awayTeam?.name || m.awayTeam?.shortName || ''),
    match_date:   m.utcDate,
    stage:        'Fase de Grupos',
    group_name:   m.group?.replace('GROUP_', '') || null,
    venue:        m.venue || null,
  })).filter(m => m.home_team && m.away_team);

  db.replaceGroupStage(mapped);
  console.log(`[import] Replaced group stage with ${mapped.length} matches from API`);
  return { ok: true, imported: mapped.length };
}

// ── Import knockout stage ─────────────────────────────────────────────────────

const KNOCKOUT_STAGE_MAP = {
  'ROUND_OF_32':    '32 avos de Final',
  'ROUND_OF_16':    'Oitavas de Final',
  'QUARTER_FINALS': 'Quartas de Final',
  'SEMI_FINALS':    'Semifinal',
  'THIRD_PLACE':    'Terceiro Lugar',
  'FINAL':          'Final',
};

async function importKnockoutStage() {
  const apiKey = process.env.FOOTBALL_API_KEY;
  if (!apiKey) return { ok: false, error: 'Variável FOOTBALL_API_KEY não configurada' };

  let apiMatches;
  try {
    const data = await fetchJson(`${API_BASE}/competitions/WC/matches`, apiKey);
    apiMatches = (data.matches || []).filter(m => KNOCKOUT_STAGE_MAP[m.stage]);
  } catch (err) {
    return { ok: false, error: `Erro na API: ${err.message}` };
  }

  if (!apiMatches.length) return { ok: false, error: 'Nenhuma partida de fase eliminatória retornada pela API' };

  const mapped = apiMatches.map(m => ({
    api_match_id: m.id,
    home_team:    toPortuguese(m.homeTeam?.name || '') || 'A definir',
    away_team:    toPortuguese(m.awayTeam?.name || '') || 'A definir',
    match_date:   m.utcDate,
    stage:        KNOCKOUT_STAGE_MAP[m.stage],
    group_name:   null,
    venue:        m.venue || null,
    home_score:   m.status === 'FINISHED' ? (m.score?.fullTime?.home ?? null) : null,
    away_score:   m.status === 'FINISHED' ? (m.score?.fullTime?.away ?? null) : null,
    status:       m.status === 'FINISHED' ? 'finished' : 'upcoming',
  }));

  const result = db.upsertKnockoutMatches(mapped);
  console.log(`[import-knockout] added:${result.added} updated:${result.updated} skipped:${result.skipped}`);
  return { ok: true, ...result };
}

// ── Generate Round of 32 from group standings ─────────────────────────────────
// Bracket structure per FIFA 2026 (games 73–88)

function s(groups, grp, pos) {
  return groups.find(g => g.name === grp)?.sorted[pos]?.team || 'A definir';
}

function bestThird(groups, allowed) {
  return groups
    .filter(g => allowed.includes(g.name) && g.sorted[2])
    .map(g => g.sorted[2])
    .sort((a, b) => (b.Pts - a.Pts) || ((b.GP - b.GC) - (a.GP - a.GC)) || (b.GP - a.GP))[0]?.team || 'A definir';
}

function generateRound32(groupStandings) {
  const g = groupStandings;
  return [
    { date:'2026-06-28T22:00:00Z', home:s(g,'A',1), away:s(g,'B',1),                           venue:'Los Angeles' },
    { date:'2026-06-29T17:00:00Z', home:s(g,'E',0), away:bestThird(g,['A','B','C','D','F']),   venue:'Boston' },
    { date:'2026-06-29T20:00:00Z', home:s(g,'F',0), away:s(g,'C',1),                           venue:'Monterrey' },
    { date:'2026-06-29T23:00:00Z', home:s(g,'C',0), away:s(g,'F',1),                           venue:'Houston' },
    { date:'2026-06-30T17:00:00Z', home:s(g,'I',0), away:bestThird(g,['C','D','F','G','H']),   venue:'Nova York' },
    { date:'2026-06-30T20:00:00Z', home:s(g,'E',1), away:s(g,'I',1),                           venue:'Dallas' },
    { date:'2026-06-30T23:00:00Z', home:s(g,'A',0), away:bestThird(g,['C','E','F','H','I']),   venue:'Cidade do México' },
    { date:'2026-07-01T17:00:00Z', home:s(g,'L',0), away:bestThird(g,['E','H','I','J','K']),   venue:'Atlanta' },
    { date:'2026-07-01T20:00:00Z', home:s(g,'D',0), away:bestThird(g,['B','E','F','I','J']),   venue:'San Francisco' },
    { date:'2026-07-01T23:00:00Z', home:s(g,'G',0), away:bestThird(g,['A','E','H','I','J']),   venue:'Seattle' },
    { date:'2026-07-02T17:00:00Z', home:s(g,'K',1), away:s(g,'L',1),                           venue:'Toronto' },
    { date:'2026-07-02T20:00:00Z', home:s(g,'H',0), away:s(g,'J',1),                           venue:'Los Angeles' },
    { date:'2026-07-02T23:00:00Z', home:s(g,'B',0), away:bestThird(g,['E','F','G','I','J']),   venue:'Vancouver' },
    { date:'2026-07-03T17:00:00Z', home:s(g,'J',0), away:s(g,'H',1),                           venue:'Miami' },
    { date:'2026-07-03T20:00:00Z', home:s(g,'K',0), away:bestThird(g,['D','E','I','J','L']),   venue:'Kansas City' },
    { date:'2026-07-03T23:00:00Z', home:s(g,'D',1), away:s(g,'G',1),                           venue:'Dallas' },
  ].map(m => ({ api_match_id: null, home_team: m.home, away_team: m.away,
                match_date: m.date, stage: '32 avos de Final', venue: m.venue }));
}

module.exports = { syncMatches, importGroupStage, importKnockoutStage, generateRound32 };
