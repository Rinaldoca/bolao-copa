/* ─── Rules card ────────────────────────────────────────────────────────── */
function toggleRules() {
  const body  = document.getElementById('rules-body');
  const arrow = document.getElementById('rules-arrow');
  const open  = body.classList.toggle('hidden');
  arrow.textContent = open ? '▾' : '▴';
}

/* ─── Special bets + Feed ────────────────────────────────────────────────── */
async function loadSpecialAndFeed() {
  const [special, feed, history] = await Promise.all([
    api('/api/special-bets'),
    api('/api/feed'),
    api('/api/history'),
  ]);
  renderSpecialGrid(special, 'special-grid');
  renderFeed(feed);
  renderHistoryChart(history || []);
  loadGroupAwards();
  applyCollapsedSections();
}

function renderHistoryChart(history) {
  const wrap = document.getElementById('history-container');
  if (!wrap) return;
  if (!history.length) {
    wrap.innerHTML = `<div class="history-chart-wrap"><p class="hc-empty">${t('history_empty')}</p></div>`;
    return;
  }

  // Collect all users across all snapshots
  const userIds = [];
  const userNames = {};
  const seenIds = new Set();
  history.forEach(h => {
    (h.snapshot || []).forEach(u => {
      if (!seenIds.has(u.id)) {
        seenIds.add(u.id);
        userIds.push(u.id);
        userNames[u.id] = u.name;
      }
    });
  });
  if (!userIds.length) {
    wrap.innerHTML = `<div class="history-chart-wrap"><p class="hc-empty">${t('history_no_participants')}</p></div>`;
    return;
  }

  // Build series: index → {userId → pts} (only users active at that snapshot)
  const series = history.map(h => {
    const map = {};
    h.snapshot.forEach(u => { map[u.id] = u.pts; });
    return map;
  });

  // Rank at each step: only rank users present in that snapshot
  const rankAt = series.map(s => {
    const present = userIds.filter(id => id in s);
    const sorted = [...present].sort((a, b) => (s[b] || 0) - (s[a] || 0));
    const map = {};
    sorted.forEach((id, i) => { map[id] = i + 1; });
    return map;
  });

  const N = userIds.length;
  const W = Math.max(400, history.length * 48);
  const PAD = { top: 16, right: 90, bottom: 32, left: 32 };
  const innerW = W - PAD.left - PAD.right;
  const innerH = Math.max(100, (N - 1) * 28);
  const H = PAD.top + innerH + PAD.bottom;

  const xScale = i => PAD.left + (history.length < 2 ? innerW / 2 : (i / (history.length - 1)) * innerW);
  // Rank 1 at top, rank N at bottom
  const yScale = r => PAD.top + ((r - 1) / Math.max(1, N - 1)) * innerH;

  const COLORS = ['#009C3B','#FFD600','#2563eb','#dc2626','#7c3aed','#f97316','#06b6d4','#84cc16'];

  // Dashed horizontal grid lines, one per rank
  const gridLines = Array.from({ length: N }, (_, i) => {
    const y = yScale(i + 1);
    return `<line x1="${PAD.left}" y1="${y}" x2="${PAD.left + innerW}" y2="${y}" stroke="var(--border)" stroke-width="1" stroke-dasharray="3,3"/>`;
  }).join('');

  // Y axis: rank labels
  const yLabels = Array.from({ length: N }, (_, i) => {
    const r = i + 1;
    const label = r <= 3 ? ['1º','2º','3º'][r - 1] : `${r}º`;
    return `<text x="${PAD.left - 5}" y="${yScale(r) + 4}" text-anchor="end" font-size="10" fill="var(--text-3)">${label}</text>`;
  }).join('');

  // X axis labels (every N steps to avoid crowding)
  const step = Math.ceil(history.length / 10);
  const xLabels = history.map((h, i) => {
    if (i % step !== 0 && i !== history.length - 1) return '';
    const x = xScale(i);
    const label = h.label.split(' ')[0];
    return `<text x="${x}" y="${H - 4}" text-anchor="middle" font-size="9" fill="var(--text-3)" transform="rotate(-35,${x},${H - 4})">${label}</text>`;
  }).join('');

  // Spread end labels by final rank (already spaced by innerH, but ensure min gap)
  const lastX = xScale(history.length - 1);
  const lastRank = rankAt[rankAt.length - 1];
  const endLabelInfo = userIds
    .filter(id => id in lastRank)
    .map(id => ({ id, rawY: yScale(lastRank[id]) }))
    .sort((a, b) => a.rawY - b.rawY);
  const MIN_GAP = 12;
  for (let i = 1; i < endLabelInfo.length; i++) {
    if (endLabelInfo[i].rawY - endLabelInfo[i - 1].rawY < MIN_GAP)
      endLabelInfo[i].rawY = endLabelInfo[i - 1].rawY + MIN_GAP;
  }
  const labelY = Object.fromEntries(endLabelInfo.map(el => [el.id, el.rawY]));

  // Average rank line (dashed, background)
  const avgRanks = series.map(s => {
    const vals = Object.values(s);
    if (!vals.length) return (N + 1) / 2;
    const avg   = vals.reduce((a, b) => a + b, 0) / vals.length;
    const above = vals.filter(v => v > avg).length;
    const tied  = vals.filter(v => v === avg).length;
    return above + 1 + (tied > 0 ? (tied - 1) / 2 : 0);
  });
  const avgD = avgRanks.map((r, i) => `${i===0?'M':'L'}${xScale(i).toFixed(1)},${yScale(r).toFixed(1)}`).join(' ');
  const avgLineEl = `<path d="${avgD}" fill="none" stroke="rgba(255,255,255,0.18)" stroke-width="1.5" stroke-dasharray="4,3" stroke-linejoin="round"/>
    <text x="${xScale(series.length-1)+6}" y="${yScale(avgRanks[avgRanks.length-1])+4}" font-size="9" fill="rgba(255,255,255,0.28)">${getCurrentLang()==='en'?'avg':'média'}</text>`;

  // Lines & dots per user
  const lines = userIds.map((id, ci) => {
    const color = COLORS[ci % COLORS.length];
    const d = rankAt.map((r, i) => {
      if (!(id in r)) return ''; // user not yet active
      const rank = r[id];
      const prevActive = i > 0 && id in rankAt[i - 1];
      return `${prevActive ? 'L' : 'M'}${xScale(i).toFixed(1)},${yScale(rank).toFixed(1)}`;
    }).join(' ');
    const dots = rankAt.map((r, i) => {
      if (!(id in r)) return ''; // user not yet active
      const rank = r[id];
      const prev = i > 0 && id in rankAt[i - 1] ? rankAt[i - 1][id] : null;
      // Draw dot only when rank changes or at first/last point
      if (prev !== null && rank === prev && i !== rankAt.length - 1) return '';
      return `<circle cx="${xScale(i).toFixed(1)}" cy="${yScale(rank).toFixed(1)}" r="3.5" fill="${color}" stroke="var(--surface)" stroke-width="1.5"/>`;
    }).join('');
    return `<path d="${d}" fill="none" stroke="${color}" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round"/>
            ${dots}
            <text x="${lastX + 6}" y="${labelY[id] + 4}" font-size="10" fill="${color}" font-weight="700">${userNames[id].split(' ')[0]}</text>`;
  }).join('');

  wrap.innerHTML = `<div class="history-chart-wrap">
    <svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" style="min-width:${W}px">
      ${gridLines}
      ${yLabels}
      ${xLabels}
      ${avgLineEl}
      ${lines}
    </svg>
  </div>`;
}

function renderSpecialGrid(special, containerId) {
  const wrap = document.getElementById(containerId);
  if (!wrap) return;

  const champOpen    = special?.special_bets_open;
  const champResult  = special?.champion;
  const scorerResult = special?.top_scorer;
  const champBets    = special?.champion_bets || [];
  const scorerBets   = special?.scorer_bets   || [];
  const getChampVal  = b => b.team;
  const getScorerVal = b => b.name;

  const statusBadge = champOpen
    ? `<span class="special-card-open">${t('special_open')}</span>`
    : `<span class="special-card-closed">${t('special_closed')}</span>`;

  const myChampBet  = currentUser ? champBets.find(b => b.user_id === currentUser.id) : null;
  const myScorerBet = currentUser ? scorerBets.find(b => b.user_id === currentUser.id) : null;

  // My bet highlight + optional CTA to place/change (when open)
  const myPickBlock = (myBet, getVal, resultVal) => {
    if (!currentUser && champOpen) return `<div class="special-cta"><a href="#" onclick="openUserModal();return false;" class="btn btn-ghost btn-sm">${t('login_to_bet_link')}</a></div>`;
    const val = myBet ? getVal(myBet) : null;
    const won = resultVal && val?.toLowerCase() === resultVal.toLowerCase();
    if (val) return `<div class="special-my-pick">
      <div class="smp-label">${t('special_your_pick')}</div>
      <div class="smp-val">${tTeam(val)}${won ? ' ✓' : ''}</div>
      ${champOpen && !resultVal ? `<button class="btn btn-ghost btn-sm smp-change" onclick="showTab('me')">${t('special_change')}</button>` : ''}
    </div>`;
    if (!champOpen) return '';
    return `<div class="special-cta">
      <div style="color:var(--text-3);font-size:.82rem;margin-bottom:8px">${t('special_not_placed')}</div>
      <button class="btn btn-primary btn-sm" onclick="showTab('me')">${t('special_place_bet')}</button>
    </div>`;
  };

  // Others' bets — collapsible toggle (own pick shown separately above)
  const renderRows = (bets, myBet, resultVal, getVal, pts) => {
    const others = bets.filter(b => !currentUser || b.user_id !== currentUser.id);
    if (!others.length && !myBet) return `<p style="color:var(--text-3);font-size:.8rem;padding:8px 0">${t('special_no_bets')}</p>`;
    if (!others.length) return '';
    const rows = others.map(b => {
      const val = getVal(b);
      const won = resultVal && val?.toLowerCase() === resultVal.toLowerCase();
      return `<div class="special-bet-row">
        <div><span class="special-user">${b.user_name}</span><br><span class="special-pick">${tTeam(val)}</span></div>
        <div class="special-pts ${won ? 'won' : resultVal ? 'lost' : ''}">
          ${won ? `✓ +${pts}pts` : resultVal ? '—' : ''}
        </div>
      </div>`;
    }).join('');
    const label = getCurrentLang() === 'en' ? `See others (${others.length})` : `Ver outros (${others.length})`;
    return `<button class="all-bets-toggle" onclick="const s=this.nextElementSibling;const open=s.style.display==='';s.style.display=open?'none':'';this.textContent=(open?'▼ ':'▲ ')+'${label}'" style="border-top:1px solid var(--border);margin-top:6px">▼ ${label}</button>
    <div style="display:none">${rows}</div>`;
  };

  wrap.innerHTML = `
    <div class="special-card">
      <div class="special-card-title">${t('special_champion')}</div>
      ${statusBadge}
      ${champResult ? `<div class="special-card-result">✓ ${tTeam(champResult)}</div>` : ''}
      ${myPickBlock(myChampBet,  getChampVal,  champResult)}
      ${renderRows(champBets,  myChampBet,  champResult,  getChampVal,  10)}
    </div>
    <div class="special-card">
      <div class="special-card-title">${t('special_scorer')}</div>
      ${statusBadge}
      ${scorerResult ? `<div class="special-card-result">✓ ${scorerResult}</div>` : ''}
      ${myPickBlock(myScorerBet, getScorerVal, scorerResult)}
      ${renderRows(scorerBets, myScorerBet, scorerResult, getScorerVal, 5)}
    </div>`;
}

function renderFeed(feed) {
  const wrap = document.getElementById('feed-container');
  if (!wrap) return;
  if (!feed?.length) {
    wrap.innerHTML = `<p class="feed-empty">${t('feed_empty')}</p>`;
    return;
  }
  const matchLookup = Object.fromEntries(allMatches.map(m => [m.id, m]));
  wrap.innerHTML = feed.map(entry => {
    if (entry.type === 'match_result') {
      const match   = matchLookup[entry.match_id];
      const hFlag   = _flagMap[entry.home_team] || '';
      const aFlag   = _flagMap[entry.away_team] || '';
      const exact   = entry.results.filter(r => r.points === 3).length;
      const correct = entry.results.filter(r => r.points === 1).length;
      const missed  = entry.results.filter(r => r.points === 0).length;
      const summary = [exact?`🎯 ${exact}`:'', correct?`✅ ${correct}`:'', missed?`❌ ${missed}`:''].filter(Boolean).join(' · ');
      const chips = entry.results.map(r => {
        const cls   = r.points === 3 ? 'pts-3' : r.points === 1 ? 'pts-1' : 'pts-0';
        const emoji = r.points === 3 ? '🎯'     : r.points === 1 ? '✅'    : '❌';
        return `<div class="feed-chip ${cls}">
          <span class="fc-name">${r.user_name}</span>
          <span class="fc-score">${r.home_score}×${r.away_score}</span>
          <span class="fc-pts">${r.points}pt</span>
          <span>${emoji}</span>
        </div>`;
      }).join('');
      const n = entry.results.length;
      const toggleBtn = n > 0
        ? `<button class="all-bets-toggle" onclick="const s=this.nextElementSibling;const open=s.style.display==='';s.style.display=open?'none':'';this.textContent=(open?'▼ ':'▲ ')+'${getCurrentLang()==='en'?`See bets (${n})`:`Ver palpites (${n})`}'">▼ ${getCurrentLang()==='en'?`See bets (${n})`:`Ver palpites (${n})`}</button>
        <div style="display:none"><div class="feed-results">${chips}</div></div>`
        : `<p style="color:var(--text-3);font-size:.8rem;padding:4px 0">${t('feed_no_bets')}</p>`;
      return `<div class="feed-entry">
        <div class="feed-header">
          <div>
            <div class="feed-title">${hFlag} ${tTeam(entry.home_team)} <span class="feed-score">${entry.home_score}–${entry.away_score}</span> ${tTeam(entry.away_team)} ${aFlag}</div>
            <div class="feed-meta" title="${fmtDate(entry.timestamp)}">${match ? tStage(match.stage) + ' · ' : ''}${timeAgo(entry.timestamp)}</div>
          </div>
          ${summary ? `<div class="feed-summary">${summary}</div>` : ''}
        </div>
        ${toggleBtn}
      </div>`;
    }
    if (entry.type === 'champion_result') {
      const got   = entry.results.filter(r => r.points > 0).length;
      const total = entry.results.length;
      const chips = entry.results.map(r =>
        `<div class="feed-chip ${r.points>0?'pts-s':'pts-0'}">
          <span class="fc-name">${r.user_name}</span>
          <span class="fc-score">${r.pick}</span>
          ${r.points > 0 ? `<span class="fc-pts">+${r.points}pt 🏆</span>` : ''}
        </div>`).join('');
      return `<div class="feed-entry">
        <div class="feed-header">
          <div><div class="feed-title">🏆 ${tTeam(entry.team)}</div><div class="feed-meta" title="${fmtDate(entry.timestamp)}">${timeAgo(entry.timestamp)}</div></div>
          ${total > 0 ? `<div class="feed-summary">${got}/${total} ${getCurrentLang()==='en'?'got it right':'acertaram'}</div>` : ''}
        </div>
        <button class="all-bets-toggle" onclick="const s=this.nextElementSibling;const open=s.style.display==='';s.style.display=open?'none':'';this.textContent=(open?'▼ ':'▲ ')+'${getCurrentLang()==='en'?`See picks (${total})`:`Ver palpites (${total})`}'">▼ ${getCurrentLang()==='en'?`See picks (${total})`:`Ver palpites (${total})`}</button>
        <div style="display:none"><div class="feed-results">${chips}</div></div>
      </div>`;
    }
    if (entry.type === 'scorer_result') {
      const got   = entry.results.filter(r => r.points > 0).length;
      const total = entry.results.length;
      const chips = entry.results.map(r =>
        `<div class="feed-chip ${r.points>0?'pts-s':'pts-0'}">
          <span class="fc-name">${r.user_name}</span>
          <span class="fc-score">${r.pick}</span>
          ${r.points > 0 ? `<span class="fc-pts">+${r.points}pt ⚽</span>` : ''}
        </div>`).join('');
      return `<div class="feed-entry">
        <div class="feed-header">
          <div><div class="feed-title">⚽ ${entry.name}</div><div class="feed-meta" title="${fmtDate(entry.timestamp)}">${timeAgo(entry.timestamp)}</div></div>
          ${total > 0 ? `<div class="feed-summary">${got}/${total} ${getCurrentLang()==='en'?'got it right':'acertaram'}</div>` : ''}
        </div>
        <button class="all-bets-toggle" onclick="const s=this.nextElementSibling;const open=s.style.display==='';s.style.display=open?'none':'';this.textContent=(open?'▼ ':'▲ ')+'${getCurrentLang()==='en'?`See picks (${total})`:`Ver palpites (${total})`}'">▼ ${getCurrentLang()==='en'?`See picks (${total})`:`Ver palpites (${total})`}</button>
        <div style="display:none"><div class="feed-results">${chips}</div></div>
      </div>`;
    }
    return '';
  }).join('');
}

