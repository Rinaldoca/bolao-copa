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

let _lastHistory = null;
let historyChartMode = localStorage.getItem('bolao_histmode') || 'points';

function setHistoryMode(mode, btn) {
  historyChartMode = mode;
  localStorage.setItem('bolao_histmode', mode);
  if (_lastHistory) renderHistoryChart(_lastHistory);
}

function renderHistoryChart(history) {
  _lastHistory = history;
  const wrap = document.getElementById('history-container');
  if (!wrap) return;

  const modes = [
    { key: 'points', label: t('hist_mode_points') },
    { key: 'rank',   label: t('hist_mode_rank') },
    { key: 'gap',    label: t('hist_mode_gap') },
  ];
  if (!modes.some(m => m.key === historyChartMode)) historyChartMode = 'points';
  const pills = `<div class="filter-group hist-mode-pills" id="history-mode-pills">${
    modes.map(m => `<button class="pill ${historyChartMode === m.key ? 'active' : ''}" onclick="setHistoryMode('${m.key}',this)">${m.label}</button>`).join('')
  }</div>`;

  if (!history.length) {
    wrap.innerHTML = pills + `<div class="history-chart-wrap"><p class="hc-empty">${t('history_empty')}</p></div>`;
    return;
  }

  // Collect all users across snapshots
  const userIds = []; const userNames = {}; const seen = new Set();
  history.forEach(h => (h.snapshot || []).forEach(u => {
    if (!seen.has(u.id)) { seen.add(u.id); userIds.push(u.id); userNames[u.id] = u.name; }
  }));
  if (!userIds.length) {
    wrap.innerHTML = pills + `<div class="history-chart-wrap"><p class="hc-empty">${t('history_no_participants')}</p></div>`;
    return;
  }

  const series = history.map(h => { const m = {}; (h.snapshot || []).forEach(u => m[u.id] = u.pts); return m; });
  const rankAt = series.map(s => {
    const present = userIds.filter(id => id in s);
    const sorted = [...present].sort((a, b) => (s[b] || 0) - (s[a] || 0));
    const map = {}; sorted.forEach((id, i) => map[id] = i + 1); return map;
  });
  const leaderPts = series.map(s => { const v = Object.values(s); return v.length ? Math.max(...v) : 0; });

  const N = userIds.length;
  const allPts = series.flatMap(s => Object.values(s));
  const maxPts = Math.max(1, ...allPts);
  const maxGap = Math.max(1, ...series.map((s, i) => { const v = Object.values(s); return v.length ? leaderPts[i] - Math.min(...v) : 0; }));

  const valueAt = (i, id) => {
    if (!(id in series[i])) return null;
    if (historyChartMode === 'points') return series[i][id];
    if (historyChartMode === 'gap')    return leaderPts[i] - series[i][id];
    return rankAt[i][id];
  };

  const W = Math.max(400, history.length * 48);
  const PAD = { top: 16, right: 96, bottom: 34, left: 42 };
  const innerW = W - PAD.left - PAD.right;
  const innerH = Math.max(120, Math.min(N, 12) * 22);
  const H = PAD.top + innerH + PAD.bottom;
  const xScale = i => PAD.left + (history.length < 2 ? innerW / 2 : (i / (history.length - 1)) * innerW);
  const yScale = v => {
    if (historyChartMode === 'points') return PAD.top + (1 - v / maxPts) * innerH;   // high pts at top
    if (historyChartMode === 'gap')    return PAD.top + (v / maxGap) * innerH;        // leader (0) at top
    return PAD.top + ((v - 1) / Math.max(1, N - 1)) * innerH;                         // rank 1 at top
  };

  // Y-axis ticks per mode
  let yTicks = [];
  if (historyChartMode === 'points') {
    for (let k = 0; k <= 4; k++) { const v = Math.round(maxPts * k / 4); yTicks.push({ v, label: String(v) }); }
  } else if (historyChartMode === 'gap') {
    for (let k = 0; k <= 4; k++) { const v = Math.round(maxGap * k / 4); yTicks.push({ v, label: v === 0 ? '0' : '−' + v }); }
  } else {
    const stepR = Math.max(1, Math.ceil(N / 6));
    for (let r = 1; r <= N; r += stepR) yTicks.push({ v: r, label: r + 'º' });
    if (yTicks[yTicks.length - 1].v !== N) yTicks.push({ v: N, label: N + 'º' });
  }
  const gridLines = yTicks.map(tk => { const y = yScale(tk.v); return `<line x1="${PAD.left}" y1="${y.toFixed(1)}" x2="${PAD.left + innerW}" y2="${y.toFixed(1)}" stroke="var(--border)" stroke-width="1" stroke-dasharray="3,3"/>`; }).join('');
  const yLabels = yTicks.map(tk => { const y = yScale(tk.v); return `<text x="${PAD.left - 6}" y="${(y + 3).toFixed(1)}" text-anchor="end" font-size="10" fill="var(--text-3)">${tk.label}</text>`; }).join('');

  const step = Math.ceil(history.length / 10);
  const xLabels = history.map((h, i) => {
    if (i % step !== 0 && i !== history.length - 1) return '';
    const x = xScale(i); const label = (h.label || '').split(' ')[0];
    return `<text x="${x.toFixed(1)}" y="${H - 4}" text-anchor="middle" font-size="9" fill="var(--text-3)" transform="rotate(-35,${x.toFixed(1)},${H - 4})">${label}</text>`;
  }).join('');

  // Emphasis: podium (top 3 by final pts) + the logged-in user
  const finalS = series[series.length - 1];
  const finalRanked = [...userIds].filter(id => id in finalS).sort((a, b) => finalS[b] - finalS[a]);
  const highlight = new Set(finalRanked.slice(0, 3));
  if (typeof currentUser !== 'undefined' && currentUser && (currentUser.id in finalS)) highlight.add(currentUser.id);

  const COLORS = ['#FFD600', '#009C3B', '#2563eb', '#dc2626', '#7c3aed', '#f97316'];
  let ci = 0; const colorOf = {};
  finalRanked.forEach(id => { if (highlight.has(id)) { colorOf[id] = COLORS[ci % COLORS.length]; ci++; } });

  const pathFor = id => {
    let d = ''; let prevActive = false;
    for (let i = 0; i < series.length; i++) {
      const v = valueAt(i, id);
      if (v === null) { prevActive = false; continue; }
      d += `${prevActive ? 'L' : 'M'}${xScale(i).toFixed(1)},${yScale(v).toFixed(1)} `;
      prevActive = true;
    }
    return d.trim();
  };
  const lastIdxFor = id => { for (let i = series.length - 1; i >= 0; i--) if (id in series[i]) return i; return -1; };

  // Pack (everyone not highlighted) drawn faint, behind
  const packLines = userIds.filter(id => !highlight.has(id))
    .map(id => `<path d="${pathFor(id)}" fill="none" stroke="rgba(150,150,150,0.20)" stroke-width="1.4" stroke-linejoin="round"/>`).join('');

  // End-label spacing for highlighted lines
  const endInfo = [...highlight].map(id => { const li = lastIdxFor(id); return { id, li, rawY: yScale(valueAt(li, id)) }; })
    .filter(e => e.li >= 0).sort((a, b) => a.rawY - b.rawY);
  const MIN_GAP = 13;
  for (let i = 1; i < endInfo.length; i++) if (endInfo[i].rawY - endInfo[i - 1].rawY < MIN_GAP) endInfo[i].rawY = endInfo[i - 1].rawY + MIN_GAP;
  const labelY = Object.fromEntries(endInfo.map(e => [e.id, e.rawY]));

  const hiLines = finalRanked.filter(id => highlight.has(id)).map(id => {
    const color = colorOf[id];
    const isMe = (typeof currentUser !== 'undefined' && currentUser && id === currentUser.id);
    const li = lastIdxFor(id); const lx = xScale(li);
    let dots = ''; let prevV = null;
    for (let i = 0; i < series.length; i++) {
      const v = valueAt(i, id);
      if (v === null) { prevV = null; continue; }
      if (prevV === null || v !== prevV || i === series.length - 1)
        dots += `<circle cx="${xScale(i).toFixed(1)}" cy="${yScale(v).toFixed(1)}" r="3.2" fill="${color}" stroke="var(--surface)" stroke-width="1.5"/>`;
      prevV = v;
    }
    const name = (userNames[id] || '').split(' ')[0];
    return `<path d="${pathFor(id)}" fill="none" stroke="${color}" stroke-width="${isMe ? 3.2 : 2.2}" stroke-linejoin="round" stroke-linecap="round"/>${dots}<text x="${(lx + 7).toFixed(1)}" y="${(labelY[id] + 4).toFixed(1)}" font-size="10" fill="${color}" font-weight="${isMe ? 800 : 700}">${name}${isMe ? ' ◄' : ''}</text>`;
  }).join('');

  wrap.innerHTML = pills + `<div class="history-chart-wrap">
    <svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" style="min-width:${W}px">
      ${gridLines}
      ${yLabels}
      ${xLabels}
      ${packLines}
      ${hiLines}
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

