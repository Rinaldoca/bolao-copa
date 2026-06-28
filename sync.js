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
  'Cape Verde':            'Cabo Verde',
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

  // Unique dates to fetch from ESPN — also include the day before each date
  // because ESPN groups matches by US Eastern time, so a UTC early-morning match
  // (e.g. 02:00 UTC) appears under the previous calendar day on ESPN.
  const utcDates = [...new Set(pending.map(m => isoDay(m.match_date)))];
  const datesToFetch = new Set();
  for (const d of utcDates) {
    datesToFetch.add(d);
    const prev = new Date(d);
    prev.setDate(prev.getDate() - 1);
    datesToFetch.add(prev.toISOString().slice(0, 10));
  }

  const espnLookup = {};
  for (const date of datesToFetch) {
    try {
      const data = await fetchEspn(`${ESPN_SCOREBOARD}?dates=${date.replace(/-/g, '')}`);
      for (const event of data.events || []) {
        const comp = event.competitions?.[0];
        if (!comp) continue;
        const home = comp.competitors?.find(c => c.homeAway === 'home');
        const away = comp.competitors?.find(c => c.homeAway === 'away');
        if (!home || !away) continue;
        const homeNorm = normalize(home.team.displayName);
        const awayNorm = normalize(away.team.displayName);
        // Order-independent key: most WC games are at neutral venues, so the
        // home/away orientation can differ between ESPN and our data.
        const key = `${isoDay(event.date)}|${[homeNorm, awayNorm].sort().join('|')}`;
        espnLookup[key] = {
          statusName: comp.status?.type?.name,
          completed:  comp.status?.type?.completed,
          homeNorm,
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
  const notFoundMatches = [];

  for (const local of pending) {
    const localHomeNorm = normalize(local.home_team);
    const localAwayNorm = normalize(local.away_team);
    const key = `${isoDay(local.match_date)}|${[localHomeNorm, localAwayNorm].sort().join('|')}`;
    const hit = espnLookup[key];

    if (!hit) {
      notFound++;
      notFoundMatches.push({ id: local.id, home: local.home_team, away: local.away_team, date: isoDay(local.match_date) });
      continue;
    }
    if (!ESPN_FINISHED.has(hit.statusName) && !hit.completed) { skipped++; continue; }
    if (isNaN(hit.homeScore) || isNaN(hit.awayScore)) { skipped++; continue; }

    // ESPN may list the teams in the opposite order — map its scores onto our
    // own home/away orientation so existing bets are graded correctly.
    const sameOrder = localHomeNorm === hit.homeNorm;
    const homeScore = sameOrder ? hit.homeScore : hit.awayScore;
    const awayScore = sameOrder ? hit.awayScore : hit.homeScore;

    db.setMatchResult(local.id, homeScore, awayScore);
    updated++;
  }

  const result = { ok: true, updated, skipped, not_found: notFound, not_found_matches: notFoundMatches, pending: pending.length, time: now.toISOString() };
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
    group_name:   m.group?.replace('GROUP_', '') || null,
    venue:        m.venue || null,
  })).filter(m => m.home_team && m.away_team);

  const deletedBets = db.replaceGroupStage(mapped);
  console.log(`[import] Replaced group stage with ${mapped.length} matches, deleted ${deletedBets} bets`);
  return { ok: true, imported: mapped.length, deleted_bets: deletedBets };
}

// ── Import knockout stage from ESPN ───────────────────────────────────────────

const ESPN_TBD_ABBREVS = new Set(['3RD', 'RD32', 'RD16', 'QF', 'SF', 'F']);

function espnTeamName(competitor) {
  if (!competitor) return null;
  if (ESPN_TBD_ABBREVS.has(competitor.team?.abbreviation)) return null;
  const name = competitor.team?.displayName || '';
  if (/\b(Winner|Place|Group [A-Z]|Round of)/i.test(name)) return null;
  return toPortuguese(name) || null;
}

async function importKnockoutStage() {
  // Build set of group stage pairs so we can exclude them from ESPN results
  const groupPairs = new Set(
    db.getMatches()
      .filter(m => m.group_name)
      .map(m => [normalize(m.home_team), normalize(m.away_team)].sort().join('|'))
  );

  // Collect ESPN events June 28 – July 20, skip group stage matches
  const seenIds = new Set();
  const knockoutEvents = [];
  const start = new Date('2026-06-28');
  const end   = new Date('2026-07-20');

  for (let d = new Date(start); d < end; d.setDate(d.getDate() + 1)) {
    const dateStr = d.toISOString().slice(0, 10).replace(/-/g, '');
    try {
      const data = await fetchEspn(`${ESPN_SCOREBOARD}?dates=${dateStr}`);
      for (const e of (data.events || [])) {
        if (seenIds.has(e.id)) continue;
        seenIds.add(e.id);
        const comp     = e.competitions?.[0];
        const homeComp = comp?.competitors?.find(c => c.homeAway === 'home');
        const awayComp = comp?.competitors?.find(c => c.homeAway === 'away');
        const homeNorm = normalize(homeComp?.team?.displayName || '');
        const awayNorm = normalize(awayComp?.team?.displayName || '');
        if (!homeNorm || !awayNorm) continue;
        if (groupPairs.has([homeNorm, awayNorm].sort().join('|'))) continue;
        knockoutEvents.push({ e, comp, homeComp, awayComp });
      }
    } catch (err) {
      console.warn(`[import-knockout] ESPN ${dateStr}: ${err.message}`);
    }
  }

  if (!knockoutEvents.length) return { ok: false, error: 'Nenhuma partida retornada pela ESPN' };

  // Match each DB knockout match to the closest ESPN event by time (within 6h).
  // Sort DB matches chronologically so greedy assignment is stable.
  const dbKnockout = db.getMatches()
    .filter(m => !m.group_name)
    .sort((a, b) => new Date(a.match_date) - new Date(b.match_date));

  const usedIds = new Set();
  let updated = 0, skipped = 0;
  // ESPN times can run up to ~4h after scheduled kick-off (late slots, next-day UTC).
  // Allow events up to 1h before (scheduling slippage) but not earlier — this keeps
  // group-stage matches (which end hours before R32 kick-offs) from being matched.
  const BEFORE = 1 * 60 * 60 * 1000;
  const AFTER  = 5 * 60 * 60 * 1000;

  for (const dbm of dbKnockout) {
    const dbTime = new Date(dbm.match_date).getTime();
    let best = null, bestDiff = Infinity;

    for (const ev of knockoutEvents) {
      if (usedIds.has(ev.e.id)) continue;
      const delta = new Date(ev.e.date).getTime() - dbTime; // positive = ESPN is later
      if (delta < -BEFORE || delta > AFTER) continue;
      const diff = Math.abs(delta);
      if (diff < bestDiff) { best = ev; bestDiff = diff; }
    }

    if (!best) { skipped++; continue; }
    usedIds.add(best.e.id);

    const homeTeam = espnTeamName(best.homeComp);
    const awayTeam = espnTeamName(best.awayComp);
    const finished = ESPN_FINISHED.has(best.comp?.status?.type?.name);

    db.editKnockoutMatch(dbm.id, {
      api_match_id: Number(best.e.id),
      match_date:   best.e.date,
      home_team:    homeTeam || 'A definir',
      away_team:    awayTeam || 'A definir',
      ...(finished ? {
        status:     'finished',
        home_score: Number(best.homeComp?.score ?? 0),
        away_score: Number(best.awayComp?.score ?? 0),
      } : {}),
    });
    updated++;
  }

  console.log(`[import-knockout] updated:${updated} skipped:${skipped}`);
  return { ok: true, updated, skipped };
}

// ── Generate the full knockout bracket from group standings ───────────────────
// Bracket structure & dates per FIFA 2026 (28 Jun – 19 Jul). The Round of 32
// resolves real teams from the current group standings; later rounds stay
// "A definir" (TBD) until the bracket fills in.

function s(groups, grp, pos) {
  return groups.find(g => g.name === grp)?.sorted[pos]?.team || 'A definir';
}

function bestThird(groups, allowed) {
  return groups
    .filter(g => allowed.includes(g.name) && g.sorted[2])
    .map(g => g.sorted[2])
    .sort((a, b) => (b.Pts - a.Pts) || ((b.GP - b.GC) - (a.GP - a.GC)) || (b.GP - a.GP))[0]?.team || 'A definir';
}

function generateKnockout(groupStandings, resolveTeams = false) {
  const g = groupStandings;
  // Only resolve real teams once the group stage is complete; otherwise the
  // bracket would show premature/incorrect matchups from partial standings.
  const r32 = (team) => resolveTeams ? team : 'A definir';

  const round32 = [
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
  ].map(m => ({ api_match_id: null, home_team: r32(m.home), away_team: r32(m.away),
                match_date: m.date, stage: '32 avos de Final', venue: m.venue }));

  // Later rounds: teams unknown until the bracket fills in.
  const tbd = [
    // Oitavas de Final (Round of 16) — 4–7 July
    { date:'2026-07-04T17:00:00Z', stage:'Oitavas de Final', venue:'Filadélfia' },
    { date:'2026-07-04T21:00:00Z', stage:'Oitavas de Final', venue:'Houston' },
    { date:'2026-07-05T17:00:00Z', stage:'Oitavas de Final', venue:'Cidade do México' },
    { date:'2026-07-05T21:00:00Z', stage:'Oitavas de Final', venue:'Dallas' },
    { date:'2026-07-06T17:00:00Z', stage:'Oitavas de Final', venue:'Atlanta' },
    { date:'2026-07-06T21:00:00Z', stage:'Oitavas de Final', venue:'Seattle' },
    { date:'2026-07-07T17:00:00Z', stage:'Oitavas de Final', venue:'Los Angeles' },
    { date:'2026-07-07T21:00:00Z', stage:'Oitavas de Final', venue:'Nova York' },
    // Quartas de Final — 9–12 July
    { date:'2026-07-09T20:00:00Z', stage:'Quartas de Final',  venue:'Boston' },
    { date:'2026-07-10T19:00:00Z', stage:'Quartas de Final',  venue:'Los Angeles' },
    { date:'2026-07-11T21:00:00Z', stage:'Quartas de Final',  venue:'Kansas City' },
    { date:'2026-07-12T01:00:00Z', stage:'Quartas de Final',  venue:'Miami' },
    // Semifinal — 14–15 July
    { date:'2026-07-14T19:00:00Z', stage:'Semifinal',         venue:'Dallas' },
    { date:'2026-07-15T19:00:00Z', stage:'Semifinal',         venue:'Atlanta' },
    // Terceiro Lugar — 18 July
    { date:'2026-07-18T21:00:00Z', stage:'Terceiro Lugar',    venue:'Miami' },
    // Final — 19 July
    { date:'2026-07-19T19:00:00Z', stage:'Final',             venue:'Nova York' },
  ].map(m => ({ api_match_id: null, home_team: 'A definir', away_team: 'A definir',
                match_date: m.date, stage: m.stage, venue: m.venue }));

  return [...round32, ...tbd];
}

module.exports = { syncMatches, importGroupStage, importKnockoutStage, generateKnockout };
