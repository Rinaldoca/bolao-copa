/* ─── Bracket tab ───────────────────────────────────────────────────────── */
async function renderBracketTab() {
  if (currentUser) {
    const bets = await api(`/api/bets?user_id=${currentUser.id}`) || [];
    userBets = {};
    bets.forEach(b => { userBets[b.match_id] = b; });
  }
  renderGroupStandings();
  renderThirdsRanking();
  renderBracket();
}

function showBracketTab(tab, btn) {
  document.querySelectorAll('#tab-bracket .inner-tab').forEach(t => t.classList.remove('active'));
  btn.classList.add('active');
  document.getElementById('brtab-standings').classList.toggle('hidden', tab !== 'standings');
  document.getElementById('brtab-thirds').classList.toggle('hidden',    tab !== 'thirds');
  document.getElementById('brtab-bracket').classList.toggle('hidden',   tab !== 'bracket');
}

/* ─── Group standings ────────────────────────────────────────────────────── */

function buildGroupStandings() {
  const groups = {};
  allMatches.filter(m => GROUP_ROUND_STAGES.includes(m.stage)).forEach(m => {
    const g = m.group_name || '?';
    if (!groups[g]) groups[g] = {};
    [m.home_team, m.away_team].forEach(team => {
      if (!groups[g][team]) groups[g][team] = { team, J:0, V:0, E:0, D:0, GP:0, GC:0, Pts:0 };
    });
    if (m.status === 'finished') {
      const hs = m.home_score, as_ = m.away_score;
      const h = groups[g][m.home_team], a = groups[g][m.away_team];
      h.J++; a.J++;
      h.GP += hs; h.GC += as_;
      a.GP += as_; a.GC += hs;
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

function standingsRow(row, i, extraCells = '') {
  const sg = row.GP - row.GC;
  return `<tr class="${i < 2 ? 'classified' : i === 2 ? 'possible' : ''}">
    <td class="td-pos">${i + 1}</td>
    <td class="td-team">${flag(row.team)}${tTeam(row.team)}</td>
    ${extraCells}
    <td>${row.J}</td><td>${row.V}</td><td>${row.E}</td><td>${row.D}</td>
    <td>${row.GP}</td><td>${row.GC}</td>
    <td class="${sg > 0 ? 'sg-pos' : sg < 0 ? 'sg-neg' : ''}">${sg > 0 ? '+' : ''}${sg}</td>
    <td class="td-pts">${row.Pts}</td>
  </tr>`;
}

function renderGroupStandings() {
  const wrap = document.getElementById('group-standings-container');
  if (!wrap) return;
  const groups = buildGroupStandings();
  if (!groups.length) {
    wrap.innerHTML = `<div class="empty"><span class="icon">📊</span>${t('standings_empty')}</div>`;
    return;
  }
  wrap.innerHTML = `
    <div class="standings-grid">
      ${groups.map(({ name, sorted }) => `
        <div class="standings-group">
          <div class="standings-title">${t('standings_group')} ${name}</div>
          <table class="standings-table">
            <thead><tr>
              <th></th><th class="th-team">${t('standings_col_team')}</th>
              <th>J</th><th>V</th>
              <th>E</th><th>D</th>
              <th>GP</th><th>GC</th>
              <th>SG</th><th class="th-pts">${t('lb_col_pts')}</th>
            </tr></thead>
            <tbody>${sorted.map((team, i) => standingsRow(team, i)).join('')}</tbody>
          </table>
        </div>`).join('')}
    </div>
    <p class="standings-legend">
      <span class="legend-dot classified"></span> ${t('standings_qualified')} &nbsp;·&nbsp;
      <span class="legend-dot possible"></span> ${t('standings_third')}
    </p>`;
}

function renderThirdsRanking() {
  const wrap = document.getElementById('thirds-container');
  if (!wrap) return;
  const groups = buildGroupStandings();
  if (!groups.length) {
    wrap.innerHTML = `<div class="empty"><span class="icon">🥉</span>${t('standings_empty')}</div>`;
    return;
  }
  const thirds = groups
    .filter(g => g.sorted[2])
    .map(g => ({ ...g.sorted[2], group: g.name }))
    .sort((a, b) => (b.Pts - a.Pts) || ((b.GP - b.GC) - (a.GP - a.GC)) || (b.GP - a.GP) || a.team.localeCompare(b.team));

  wrap.innerHTML = `
    <p class="pane-sub" style="margin-bottom:16px" data-i18n-html="thirds_sub">${t('thirds_sub')}</p>
    <div class="standings-group" style="max-width:580px">
      <table class="standings-table">
        <thead><tr>
          <th></th><th class="th-team">${t('standings_col_team')}</th><th>${t('thirds_col_group')}</th>
          <th>J</th><th>V</th>
          <th>E</th><th>D</th>
          <th>GP</th><th>GC</th>
          <th>SG</th><th class="th-pts">${t('lb_col_pts')}</th>
        </tr></thead>
        <tbody>
          ${thirds.map((row, i) => {
            const sg = row.GP - row.GC;
            const rowClass = i < 8 ? 'classified' : 'eliminated';
            return `<tr class="${rowClass}">
              <td class="td-pos">${i + 1}</td>
              <td class="td-team">${flag(row.team)}${tTeam(row.team)}</td>
              <td style="color:var(--text-3);font-size:.78rem">${row.group}</td>
              <td>${row.J}</td><td>${row.V}</td><td>${row.E}</td><td>${row.D}</td>
              <td>${row.GP}</td><td>${row.GC}</td>
              <td class="${sg > 0 ? 'sg-pos' : sg < 0 ? 'sg-neg' : ''}">${sg > 0 ? '+' : ''}${sg}</td>
              <td class="td-pts">${row.Pts}</td>
            </tr>`;
          }).join('')}
        </tbody>
      </table>
    </div>
    <p class="standings-legend" style="max-width:580px;margin-top:10px">
      <span class="legend-dot classified"></span> ${t('thirds_advances')} &nbsp;·&nbsp;
      <span class="legend-dot eliminated"></span> ${t('thirds_eliminated')}
    </p>`;
}

/* ─── Bracket ────────────────────────────────────────────────────────────── */
const BRACKET_STAGES  = ['32 avos de Final', 'Oitavas de Final', 'Quartas de Final', 'Semifinal', 'Final'];
const GROUP_ROUND_STAGES = ['1ª Rodada', '2ª Rodada', '3ª Rodada'];
const STAGE_ORDER     = [...GROUP_ROUND_STAGES, '32 avos de Final', 'Oitavas de Final', 'Quartas de Final', 'Semifinal', 'Terceiro Lugar', 'Final'];
function stageRank(key) { const s = key.split('|||')[0]; const i = STAGE_ORDER.indexOf(s); return i === -1 ? 99 : i; }
const BRACKET_COUNTS = { '32 avos de Final': 16, 'Oitavas de Final': 8, 'Quartas de Final': 4, 'Semifinal': 2, 'Final': 1 };

function renderBracket() {
  const wrap = document.getElementById('bracket-container');
  const knockoutMatches = allMatches.filter(m => BRACKET_STAGES.includes(m.stage));

  const byStage = {};
  knockoutMatches.forEach(m => { (byStage[m.stage] = byStage[m.stage] || []).push(m); });

  const hasAny = knockoutMatches.length > 0;

  // Third place is shown separately at the bottom
  const thirdMatches = allMatches.filter(m => m.stage === 'Terceiro Lugar');

  wrap.innerHTML = `
    ${!hasAny ? `
      <div class="bracket-empty">
        <span class="icon" style="font-size:2rem">🏆</span>
        <p style="font-weight:700;font-size:1rem;margin-bottom:6px">${t('bracket_empty_title')}</p>
        <p style="color:var(--text-3);font-size:.85rem">${t('bracket_empty_sub')}</p>
      </div>` : ''}
    <div class="bracket-wrapper">
      ${BRACKET_STAGES.map(stage => {
        const matches  = byStage[stage] || [];
        const expected = BRACKET_COUNTS[stage];
        const slots    = Math.max(matches.length, expected);

        return `
          <div class="bracket-col">
            <div class="bracket-col-title">${tStage(stage)}</div>
            <div class="bracket-col-matches">
              ${matches.map(m => renderBracketCard(m)).join('')}
              ${Array.from({ length: slots - matches.length }, () => renderBracketCardEmpty()).join('')}
            </div>
          </div>`;
      }).join('<div class="bracket-connector">›</div>')}
    </div>
    ${thirdMatches.length ? `
      <div class="bracket-third">
        <div class="bracket-col-title" style="margin-bottom:10px">${t('bracket_third_place')}</div>
        ${thirdMatches.map(renderBracketCard).join('')}
      </div>` : ''}`;
}

function renderBracketCard(m) {
  const finished  = m.status === 'finished';
  const homeWon   = finished && m.home_score > m.away_score;
  const awayWon   = finished && m.away_score > m.home_score;
  const myBet     = userBets[m.id];
  const matchDate = new Date(m.match_date);
  const dateShort = matchDate.toLocaleDateString(dateLocale(), { day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit', timeZone:'Europe/Berlin' });
  const isPast    = Date.now() > matchDate.getTime() - 5 * 60 * 1000;
  const tbd       = m.home_team === 'A definir' || m.away_team === 'A definir';

  let betLine = '';
  if (tbd) {
    betLine = `<div class="bracket-bet" style="color:var(--text-3);font-size:.72rem">${t('tbd_bet_msg')}</div>`;
  } else if (finished && myBet) {
    const cls   = myBet.points===3 ? 'pts-3' : myBet.points===1 ? 'pts-1' : 'pts-0';
    const emoji = myBet.points===3 ? '🎯' : myBet.points===1 ? '✅' : '❌';
    betLine = `<div class="bracket-bet"><span class="pts-chip ${cls}" style="font-size:.7rem;padding:2px 7px">${myBet.home_score}-${myBet.away_score} · ${myBet.points}pt ${emoji}</span></div>`;
  } else if (finished && !myBet) {
    betLine = '';
  } else if (isPast && myBet) {
    betLine = `<div class="bracket-bet" style="color:var(--text-3);font-size:.72rem">⏳ ${myBet.home_score}-${myBet.away_score}</div>`;
  } else if (isPast) {
    betLine = `<div class="bracket-bet" style="color:var(--text-3);font-size:.72rem">${t('bracket_bets_closed')}</div>`;
  } else if (!tbd && currentUser) {
    betLine = `<div class="bracket-bet bracket-bet-inputs">
      <input type="number" class="bracket-score-input" id="bh-${m.id}" min="0" max="20"
        value="${myBet ? myBet.home_score : ''}" placeholder="0"
        onblur="autoSaveBet(${m.id})" onkeydown="if(event.key==='Enter')this.blur()">
      <span style="color:var(--text-3);font-size:.8rem;font-weight:700">×</span>
      <input type="number" class="bracket-score-input" id="ba-${m.id}" min="0" max="20"
        value="${myBet ? myBet.away_score : ''}" placeholder="0"
        onblur="autoSaveBet(${m.id})" onkeydown="if(event.key==='Enter')this.blur()">
      <span class="auto-bet-status" id="abs-${m.id}" style="font-size:.8rem">${myBet ? '✓' : ''}</span>
    </div>`;
  } else if (!tbd && !currentUser) {
    betLine = `<div class="bracket-bet" style="color:var(--text-3);font-size:.72rem"><a href="#" onclick="openUserModal();return false;" style="color:var(--gold)">${t('login_to_bet_link')}</a> ${t('login_to_bet_suffix')}</div>`;
  }

  return `
    <div class="bracket-card ${finished ? 'finished' : ''} ${tbd ? 'bracket-card-tbd' : ''} ${!finished && !isPast && myBet && !tbd ? 'bracket-has-bet' : ''} ${!finished && !isPast && !myBet && currentUser && !tbd ? 'bracket-needs-bet' : ''}">
      <div class="bracket-team ${homeWon ? 'winner' : finished ? 'loser' : ''}">
        ${flag(m.home_team)}<span class="bracket-team-name">${tTeam(m.home_team)}</span>
        ${finished ? `<span class="bracket-team-score">${m.home_score}</span>` : ''}
      </div>
      <div class="bracket-team ${awayWon ? 'winner' : finished ? 'loser' : ''}">
        ${flag(m.away_team)}<span class="bracket-team-name">${tTeam(m.away_team)}</span>
        ${finished ? `<span class="bracket-team-score">${m.away_score}</span>` : ''}
      </div>
      <div class="bracket-meta">${dateShort}${m.venue ? ` · ${m.venue}` : ''}</div>
      ${betLine}
    </div>`;
}

function renderBracketCardEmpty() {
  return `
    <div class="bracket-card bracket-card-tbd">
      <div class="bracket-team"><span class="bracket-team-name">${t('bracket_tbd')}</span></div>
      <div class="bracket-team"><span class="bracket-team-name">${t('bracket_tbd')}</span></div>
    </div>`;
}

