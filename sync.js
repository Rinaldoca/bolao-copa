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

function isoDay(str) { return str ? str.slice(0, 10) : null; }

// ── Sync results ──────────────────────────────────────────────────────────────

async function syncMatches() {
  const apiKey = process.env.FOOTBALL_API_KEY;
  if (!apiKey) {
    return { ok: false, error: 'Variável FOOTBALL_API_KEY não configurada' };
  }

  let apiMatches;
  try {
    const data = await fetchJson(`${API_BASE}/competitions/WC/matches`, apiKey);
    apiMatches = data.matches || [];
  } catch (err) {
    const result = { ok: false, error: `Erro na API: ${err.message}`, time: new Date().toISOString() };
    db.setLastSync(result);
    return result;
  }

  // Build lookups: by api_match_id and by "day|home|away"
  const idLookup  = {};
  const dayLookup = {};
  for (const m of apiMatches) {
    idLookup[m.id] = m;
    const home = normalize(m.homeTeam?.name || '');
    const away = normalize(m.awayTeam?.name || '');
    const day  = isoDay(m.utcDate);
    if (home && away && day) dayLookup[`${day}|${home}|${away}`] = m;
  }

  const now     = new Date();
  const pending = db.getMatches().filter(m => m.status === 'upcoming' && new Date(m.match_date) < now);

  let updated = 0, skipped = 0, notFound = 0;

  for (const local of pending) {
    // Prefer api_match_id lookup, fall back to date+team
    const hit = local.api_match_id
      ? idLookup[local.api_match_id]
      : dayLookup[`${isoDay(local.match_date)}|${normalize(local.home_team)}|${normalize(local.away_team)}`];

    if (!hit)                  { notFound++; continue; }
    if (hit.status !== 'FINISHED') { skipped++;  continue; }

    const hs  = hit.score?.fullTime?.home;
    const as_ = hit.score?.fullTime?.away;
    if (hs == null || as_ == null) { skipped++; continue; }

    db.setMatchResult(local.id, hs, as_);
    updated++;
  }

  const result = { ok: true, updated, skipped, not_found: notFound, pending: pending.length, time: new Date().toISOString() };
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

module.exports = { syncMatches, importGroupStage };
