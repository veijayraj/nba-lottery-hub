// ── Tab routing ──────────────────────────────────────────────────────────────

function initTabs() {
  const tabs = document.getElementById('tabs');

  function activateTab(panelId) {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
    const btn = document.querySelector(`.tab[data-panel="${panelId}"]`);
    const panel = document.getElementById('panel-' + panelId);
    if (btn) btn.classList.add('active');
    if (panel) panel.classList.add('active');
  }

  // Click handler — update hash on tab click
  tabs.addEventListener('click', e => {
    const btn = e.target.closest('.tab');
    if (!btn) return;
    const panelId = btn.dataset.panel;
    activateTab(panelId);
    history.replaceState(null, '', '#' + panelId);
  });

  // On load — read hash and activate correct tab
  const hash = window.location.hash.replace('#', '');
  const validPanels = ['odds','y2025','y2024','y2023','y2022','y2021','y2020','y2019','proposed','mock','tanking'];
  if (hash && validPanels.includes(hash)) {
    activateTab(hash);
  }
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function heatClass(val) {
  if (!val || val === 0) return 'h0';
  if (val < 2)  return 'h1';
  if (val < 5)  return 'h2';
  if (val < 10) return 'h3';
  if (val < 15) return 'h4';
  if (val < 22) return 'h5';
  if (val < 32) return 'h6';
  if (val < 45) return 'h7';
  if (val < 60) return 'h8';
  if (val < 75) return 'h9';
  return 'h10';
}

function moveBadge(preSeed, pick) {
  const diff = preSeed - pick;
  if (diff > 0)  return `<span class="move-badge move-up">▲ +${diff}</span>`;
  if (diff < 0)  return `<span class="move-badge move-down">▼ ${Math.abs(diff)}</span>`;
  return `<span class="move-badge move-stay">—</span>`;
}

function avgPick(row) {
  return row.reduce((sum, val, i) => sum + (i + 1) * (val / 100), 0).toFixed(1);
}

// ── 2026 Odds table ──────────────────────────────────────────────────────────

async function buildOddsTable() {
  const res  = await fetch('data/odds.json?v=2');
  const data = await res.json();

  let html = '<table class="odds-table"><thead><tr>';
  html += '<th class="team-th">Team</th>';
  for (let p = 1; p <= 14; p++) {
    html += `<th>P${p}</th>`;
  }
  html += '<th style="color:var(--gold)">Avg</th>';
  html += '</tr></thead><tbody>';

  const TEAM_AVGS = [3.7, 3.9, 4.1, 4.6, 4.8, 5.5, 6.4, 6.9, 8.0, 9.2, 10.3, 11.4, 12.5, 13.7];

  data.probabilities.forEach((row, si) => {
    const team = data.teams[si];
    html += '<tr>';
    html += `
      <td class="team-td">
        <div class="abbr">${team.abbr}</div>
        <div class="full">${team.team}</div>
      </td>
    `;
    row.forEach(val => {
      if (!val || val === 0) {
        html += `<td class="h0 odds-blank">—</td>`;
      } else {
        html += `<td class="${heatClass(val)}">${val}%</td>`;
      }
    });
    html += `<td class="avg-td">${TEAM_AVGS[si]}</td>`;
    html += '</tr>';
  });

  html += '</tbody></table>';
  document.getElementById('odds-table-wrap').innerHTML = html;
}

// ── Historical year panels ────────────────────────────────────────────────────

async function buildHistoryPanels() {
  const res  = await fetch('data/history.json?v=2');
  const data = await res.json();

  data.years.forEach(year => {
    const panel = document.getElementById(`panel-y${year.year}`);
    if (!panel) return;

    // Info bar
    let html = `<div class="section-label">${year.year} NBA Draft Lottery</div>`;
    html += `
      <div class="info-bar">
        <div class="info-bar-item">
          <div class="val">${year.winner}</div>
          <div class="lbl">Lottery Winner</div>
        </div>
        <div class="info-bar-item">
          <div class="val">Seed ${year.winnerPreSeed}</div>
          <div class="lbl">Pre-Lottery Seed</div>
        </div>
        <div class="info-bar-item">
          <div class="val">${year.winnerOdds}%</div>
          <div class="lbl">Pick-1 Odds</div>
        </div>
        <div class="info-bar-item">
          <div class="val">${year.top4ToSeed5Plus}</div>
          <div class="lbl">Top-4 Upsets</div>
        </div>
        <div class="info-bar-item">
          <span class="system-badge">${year.system}</span>
        </div>
      </div>
    `;

    // Before / After side-by-side
    html += `
      <div class="before-after">
        <div class="ba-col">
          <div class="ba-header left">Pre-Lottery Order</div>
          ${year.preLottery.map(t => `
            <div class="seed-row">
              <span class="seed-num">${t.seed}</span>
              <span class="seed-abbr">${t.abbr}</span>
              <span class="seed-full">${t.team}</span>
              <span class="seed-odds">${t.odds}%</span>
            </div>
          `).join('')}
        </div>

        <div class="ba-divider-col">
          <div class="ba-divider-header"></div>
          <div class="ba-divider-line"></div>
        </div>

        <div class="ba-col">
          <div class="ba-header right">Actual Draft Order</div>
          ${year.results.map(r => `
            <div class="pick-row ${r.pick <= 4 ? 'top4' : ''}">
              <span class="pick-num">${r.pick}</span>
              <span class="pick-abbr">${r.abbr}</span>
              <div class="pick-info">
                <div class="pick-prospect">${r.prospect}</div>
              </div>
              ${moveBadge(r.preSeed, r.pick)}
            </div>
          `).join('')}
        </div>
      </div>
    `;

    // Note
    html += `<div class="note">${year.seed1Note}</div>`;

    panel.innerHTML = html;
  });
}

// ── 2027 Proposed tab ─────────────────────────────────────────────────────────

async function buildProposedTab() {
  const res  = await fetch('data/proposed.json?v=2');
  const data = await res.json();

  // Rule box
  document.getElementById('rule-list').innerHTML =
    data.rules.map(r => `<li>${r}</li>`).join('');

  // Table
  const total = data.totalBalls;
  let html = `
    <table class="proposed-table">
      <thead><tr>
        <th>Zone</th>
        <th>Seed</th>
        <th>Balls</th>
        <th>Pick-1 Odds</th>
      </tr></thead>
      <tbody>
  `;

  data.teams.forEach(t => {
    const odds    = ((t.balls / total) * 100).toFixed(1);
    const zoneKey = t.zone.replace(/[^a-z]/gi, '').toLowerCase();
    const zoneCls = zoneKey === 'relegation' ? 'zone-relegation'
                  : zoneKey === 'midlottery' ? 'zone-midlottery'
                  : 'zone-playin';

    html += `
      <tr>
        <td><span class="zone-badge ${zoneCls}">${t.zone}</span></td>
        <td style="font-family:'Barlow Condensed',sans-serif;font-weight:800;font-size:15px">${t.seed}</td>
        <td style="font-family:'Barlow Condensed',sans-serif;font-weight:700">${t.balls}</td>
        <td style="font-family:'Barlow Condensed',sans-serif;font-weight:800;color:var(--gold);font-size:15px">${odds}%</td>
      </tr>
    `;
  });

  html += '</tbody></table>';
  document.getElementById('proposed-table-wrap').innerHTML = html;
}

// ── Init ─────────────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  initTabs();
  buildOddsTable();
  buildHistoryPanels();
  buildProposedTab();
  initMock();
  initTanking();
});

// ── Mock Lottery ──────────────────────────────────────────────────────────────
//
// The real NBA lottery uses 14 ping-pong balls (numbered 1-14).
// Four balls are drawn without regard to order — giving 1,001 possible
// combinations (14 choose 4). 1,000 of those are assigned to teams
// proportional to their odds. The 1,001st is unassigned (void).
//
// We simulate this exactly: generate all C(14,4) = 1,001 combinations,
// assign 1,000 to teams, then draw one at random.
// The process repeats for picks 2-4 (same balls back in, same pool,
// but winning team's combinations are excluded for that pick).
//
// For 2027 proposed: the mechanism is the same but ball counts per team
// differ by zone (relegation=2, mid-lottery=3, play-in=1-2).
// We simulate it the same way but with a different number of balls (e.g. 16 or 20)
// and different combination assignments. Since the proposed rules don't specify
// the exact ball/combination setup, we approximate using weighted probability.
//
// Sources: ESPN, RealGM

// 2026 teams with pick-1 odds
const TEAMS_2026 = [
  { abbr: "WAS", team: "Washington Wizards",              seed: 1,  odds: 14.0 },
  { abbr: "IND", team: "Indiana Pacers",                  seed: 2,  odds: 14.0 },
  { abbr: "BKN", team: "Brooklyn Nets",                   seed: 3,  odds: 14.0 },
  { abbr: "UTA", team: "Utah Jazz",                       seed: 4,  odds: 11.5 },
  { abbr: "SAC", team: "Sacramento Kings",                seed: 5,  odds: 11.5 },
  { abbr: "MEM", team: "Memphis Grizzlies",               seed: 6,  odds: 8.0  },
  { abbr: "ATL", team: "Atlanta Hawks (via NOP)",         seed: 7,  odds: 6.8  },
  { abbr: "DAL", team: "Dallas Mavericks",                seed: 8,  odds: 6.7  },
  { abbr: "CHI", team: "Chicago Bulls",                   seed: 9,  odds: 4.5  },
  { abbr: "MIL", team: "Milwaukee Bucks",                 seed: 10, odds: 3.0  },
  { abbr: "GSW", team: "Golden State Warriors",           seed: 11, odds: 2.0  },
  { abbr: "OKC", team: "OKC Thunder (via LAC)",           seed: 12, odds: 1.5  },
  { abbr: "MIA", team: "Miami Heat",                      seed: 13, odds: 1.0  },
  { abbr: "CHA", team: "Charlotte Hornets",               seed: 14, odds: 0.5  },
];

// 2027 proposed — same teams mapped to zones with ball counts
// Uses 2025-26 season standings as proxy for what "would" qualify
const TEAMS_2027 = [
  { abbr: "WAS", team: "Washington Wizards",          seed: 1,  zone: "Relegation",   balls: 2 },
  { abbr: "IND", team: "Indiana Pacers",              seed: 2,  zone: "Relegation",   balls: 2 },
  { abbr: "BKN", team: "Brooklyn Nets",               seed: 3,  zone: "Relegation",   balls: 2 },
  { abbr: "UTA", team: "Utah Jazz",                   seed: 4,  zone: "Mid-Lottery",  balls: 3 },
  { abbr: "SAC", team: "Sacramento Kings",            seed: 5,  zone: "Mid-Lottery",  balls: 3 },
  { abbr: "MEM", team: "Memphis Grizzlies",           seed: 6,  zone: "Mid-Lottery",  balls: 3 },
  { abbr: "ATL", team: "Atlanta Hawks (via NOP)",     seed: 7,  zone: "Mid-Lottery",  balls: 3 },
  { abbr: "DAL", team: "Dallas Mavericks",            seed: 8,  zone: "Mid-Lottery",  balls: 3 },
  { abbr: "CHI", team: "Chicago Bulls",               seed: 9,  zone: "Mid-Lottery",  balls: 3 },
  { abbr: "MIL", team: "Milwaukee Bucks",             seed: 10, zone: "Mid-Lottery",  balls: 3 },
  { abbr: "CHA", team: "Charlotte Hornets (9/10 E)",  seed: 11, zone: "Play-In 9/10", balls: 2 },
  { abbr: "MIA", team: "Miami Heat (9/10 E)",         seed: 12, zone: "Play-In 9/10", balls: 2 },
  { abbr: "LAC", team: "LA Clippers (9/10 W)",        seed: 13, zone: "Play-In 9/10", balls: 2 },
  { abbr: "GSW", team: "Golden State Warriors (9/10 W)", seed: 14, zone: "Play-In 9/10", balls: 2 },
  { abbr: "PHX", team: "Phoenix Suns (7/8 loser W)",  seed: 15, zone: "Play-In 7/8",  balls: 1 },
  { abbr: "ORL", team: "Orlando Magic (7/8 loser E)", seed: 16, zone: "Play-In 7/8",  balls: 1 },
];

const TOTAL_BALLS_2027 = 37; // 3×2 + 7×3 + 4×2 + 2×1 = 6+21+8+2 = 37

// Pre-2019 system odds for the same teams (by slot, not team-specific)
// Old system gave seed 1 = 25%, seed 2 = 19.9%, seed 3 = 15.6% etc.
const PRE2019_ODDS = [25.0, 19.9, 15.6, 11.9, 8.8, 6.3, 4.3, 2.8, 1.7, 1.1, 0.8, 0.7, 0.6, 0.5];

// Map 2026 teams into pre-2019 odds by their seed slot
const TEAMS_PRE2019 = TEAMS_2026.map((t, i) => ({
  ...t,
  odds: PRE2019_ODDS[i],
}));

let currentMode = '2026';
let lotteryRunning = false;

// ── Build horizontal bar charts for each era ──────────────────────────────────

function buildCharts() {
  const maxPct = 25.0; // pre-2019 max, used as scale reference

  const configs = [
    {
      id: 'chart-pre2019',
      teams: TEAMS_PRE2019,
      color: '#7a4a2a',
      getOdds: t => t.odds,
    },
    {
      id: 'chart-2026',
      teams: TEAMS_2026,
      color: 'var(--rust)',
      getOdds: t => t.odds,
    },
    {
      id: 'chart-2027',
      teams: TEAMS_2027,
      color: 'var(--green-lt)',
      getOdds: t => parseFloat(((t.balls / TOTAL_BALLS_2027) * 100).toFixed(1)),
    },
  ];

  configs.forEach(({ id, teams, color, getOdds }) => {
    const container = document.getElementById(id);
    let html = '';

    teams.forEach(t => {
      const pct    = getOdds(t);
      const width  = (pct / maxPct) * 100;
      const label  = t.zone
        ? `${t.seed}`  // 2027: show seed number
        : `${t.seed}`; // others: seed number

      html += `
        <div class="chart-row">
          <div class="chart-seed">${label}</div>
          <div class="chart-bar-wrap">
            <div class="chart-bar" style="width:${width}%;background:${color};opacity:0.85"></div>
          </div>
          <div class="chart-pct">${pct}%</div>
        </div>
      `;
    });

    container.innerHTML = html;
  });
}

// ── Lottery algorithm ─────────────────────────────────────────────────────────
//
// 2026 system: exact simulation of the NBA combination draw.
//   - Generate all C(14,4) = 1,001 four-ball combinations
//   - Assign 1,000 to teams based on their combination counts
//     (e.g. WAS/IND/BKN get 140 each at 14% odds, etc.)
//   - Draw one combination at random — that team wins the pick
//   - Replace balls, exclude that team's combinations, repeat for picks 2-4
//
// 2027 proposed: same logic adapted for the ball-based system.
//   Since the exact combination table isn't published yet, we use weighted
//   probability draw which converges to the same result.

// Generate all C(n, k) combinations
function getCombinations(n, k) {
  const result = [];
  const combo = [];

  function helper(start) {
    if (combo.length === k) {
      result.push([...combo]);
      return;
    }
    for (let i = start; i <= n; i++) {
      combo.push(i);
      helper(i + 1);
      combo.pop();
    }
  }

  helper(1);
  return result;
}

// Build the combination-to-team assignment table for 2026
// NBA assigns exactly these combination counts per team based on odds:
// 14.0% = 140 combos, 11.5% = 115 combos, etc. (out of 1000)
function buildComboTable2026(teams) {
  const allCombos = getCombinations(14, 4); // 1001 combos
  const table = new Map(); // combo key -> team index

  let assigned = 0;
  const shuffled = [...allCombos].sort(() => Math.random() - 0.5);

  teams.forEach((team, idx) => {
    const count = Math.round(team.odds * 10); // 14% -> 140, 6.8% -> 68 etc.
    for (let i = 0; i < count && assigned < shuffled.length; i++) {
      const key = shuffled[assigned].join('-');
      table.set(key, idx);
      assigned++;
    }
  });

  // shuffled[1000] is the void combination (unassigned)
  return { table, allCombos: shuffled };
}

// Draw one pick using the combination method (2026 rules)
function drawOnePick2026(table, allCombos, excludedTeams) {
  let attempts = 0;
  while (attempts < 5000) {
    // Pick a random combination
    const combo = allCombos[Math.floor(Math.random() * allCombos.length)];
    const key = combo.join('-');
    const teamIdx = table.get(key);

    // Void combination or already-won team -> redraw
    if (teamIdx === undefined || excludedTeams.has(teamIdx)) {
      attempts++;
      continue;
    }

    return teamIdx;
  }
  return -1; // shouldn't happen
}

// 2027: weighted probability draw (exact combination table not yet published)
function drawOnePick2027(teams, excludedTeams) {
  const eligible = teams.filter((_, i) => !excludedTeams.has(i));
  const totalBalls = eligible.reduce((s, t) => s + t.balls, 0);

  let rand = Math.random() * totalBalls;
  for (let i = 0; i < teams.length; i++) {
    if (excludedTeams.has(i)) continue;
    rand -= teams[i].balls;
    if (rand <= 0) return i;
  }
  return teams.length - 1;
}

// Run the full lottery for picks 1-4 then fill remaining by seed
function runLotteryAlgo(teams) {
  const excluded = new Set();
  const winners = [];
  const NUM_LOTTERY_PICKS = 4;

  if (currentMode === '2026') {
    // Build combination table once per run
    const { table, allCombos } = buildComboTable2026(teams);

    for (let pick = 0; pick < NUM_LOTTERY_PICKS; pick++) {
      const winner = drawOnePick2026(table, allCombos, excluded);
      if (winner === -1) break;
      winners.push(winner);
      excluded.add(winner);
    }
  } else {
    // 2027 proposed: weighted ball draw
    for (let pick = 0; pick < NUM_LOTTERY_PICKS; pick++) {
      const winner = drawOnePick2027(teams, excluded);
      winners.push(winner);
      excluded.add(winner);
    }
  }

  // Remaining teams fill picks 5+ in original seed order
  const nonWinners = teams
    .map((t, i) => ({ ...t, idx: i }))
    .filter(t => !excluded.has(t.idx))
    .sort((a, b) => b.balls !== undefined && a.balls !== undefined ? b.balls - a.balls : a.seed - b.seed);

  return [
    ...winners.map(i => ({ ...teams[i], idx: i })),
    ...nonWinners,
  ];
}

// ── Reveal animation ─────────────────────────────────────────────────────────

// ── Reveal picks into a sim column ───────────────────────────────────────────

function revealMiniPicks(results, containerId) {
  const container = document.getElementById(containerId);
  container.innerHTML = '';

  results.forEach((team, i) => {
    const pick    = i + 1;
    const preSeed = team.seed || team.idx + 1;
    const diff    = preSeed - pick;

    const movHtml = diff > 0
      ? `<span class="move-badge move-up" style="font-size:9px;padding:1px 4px">▲${diff}</span>`
      : diff < 0
      ? `<span class="move-badge move-down" style="font-size:9px;padding:1px 4px">▼${Math.abs(diff)}</span>`
      : `<span class="move-badge move-stay" style="font-size:9px;padding:1px 4px">—</span>`;

    const upsetHtml = pick === 1 && preSeed > 4
      ? `<span style="font-size:9px;color:var(--gold);font-weight:700">★</span>`
      : '';

    const div = document.createElement('div');
    div.className = `sim-pick${pick <= 4 ? ' top4' : ''}${pick === 1 ? ' pick1' : ''}`;
    div.innerHTML = `
      <span class="sp-num">${pick}</span>
      <span class="sp-abbr">${team.abbr}</span>
      <span class="sp-meta">S${preSeed}</span>
      <span class="sp-move">${movHtml}</span>
      ${upsetHtml}
    `;
    container.appendChild(div);
  });

  // Scroll to the results container after a short delay
  setTimeout(() => {
    container.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, 200);

  // Reveal 14→1: animate bottom row first
  const rows     = Array.from(container.querySelectorAll('.sim-pick'));
  const reversed = [...rows].reverse();
  const interval = 3000 / rows.length;

  reversed.forEach((row, i) => {
    setTimeout(() => row.classList.add('revealed'), i * interval);
  });
}

// ── Pre-2019 draw: combination-based with old odds ────────────────────────────
// Old system used same 14-ball combination mechanism but different allocations:
// Seed 1 = 250 combos (25%), seed 2 = 199 (19.9%), etc. out of 1000

function buildComboTablePre2019(teams) {
  const allCombos = getCombinations(14, 4);
  const table     = new Map();
  let assigned    = 0;
  const shuffled  = [...allCombos].sort(() => Math.random() - 0.5);

  teams.forEach((team, idx) => {
    const count = Math.round(team.odds * 10); // 25% -> 250, 19.9% -> 199 etc.
    for (let i = 0; i < count && assigned < shuffled.length; i++) {
      table.set(shuffled[assigned].join('-'), idx);
      assigned++;
    }
  });

  return { table, allCombos: shuffled };
}

// ── Run a single mode ─────────────────────────────────────────────────────────

const runningModes = new Set();

function runLotteryMode(mode) {
  if (runningModes.has(mode)) return;
  runningModes.add(mode);

  const btnMap = { pre2019: 'sim-pre2019', '2026': 'sim-2026', '2027': 'sim-2027' };
  const btn = document.querySelector(`#${btnMap[mode]} .run-btn`);
  if (btn) btn.disabled = true;

  let teams, results;

  if (mode === 'pre2019') {
    teams   = TEAMS_PRE2019;
    const { table, allCombos } = buildComboTablePre2019(teams);
    results = runWithCombos(teams, table, allCombos);
    revealMiniPicks(results, 'picks-pre2019');
  } else if (mode === '2026') {
    teams   = TEAMS_2026;
    const { table, allCombos } = buildComboTable2026(teams);
    results = runWithCombos(teams, table, allCombos);
    revealMiniPicks(results, 'picks-2026');
  } else {
    teams   = TEAMS_2027;
    results = runWith2027Balls(teams);
    revealMiniPicks(results, 'picks-2027');
  }

  // Re-enable after animation
  setTimeout(() => {
    runningModes.delete(mode);
    if (btn) btn.disabled = false;
  }, 3200);
}

function runAllModes() {
  ['pre2019', '2026', '2027'].forEach(mode => runLotteryMode(mode));
}

// Shared combination-draw runner (picks 1-4 via combinations, rest by seed)
function runWithCombos(teams, table, allCombos) {
  const excluded = new Set();
  const winners  = [];

  for (let pick = 0; pick < 4; pick++) {
    const winner = drawOnePick2026WithTable(table, allCombos, excluded);
    if (winner === -1) break;
    winners.push(winner);
    excluded.add(winner);
  }

  const nonWinners = teams
    .map((t, i) => ({ ...t, idx: i }))
    .filter(t => !excluded.has(t.idx))
    .sort((a, b) => b.balls !== undefined && a.balls !== undefined ? b.balls - a.balls : a.seed - b.seed);

  return [
    ...winners.map(i => ({ ...teams[i], idx: i })),
    ...nonWinners,
  ];
}

// Extracted draw function that accepts any table
function drawOnePick2026WithTable(table, allCombos, excludedTeams) {
  let attempts = 0;
  while (attempts < 5000) {
    const combo   = allCombos[Math.floor(Math.random() * allCombos.length)];
    const key     = combo.join('-');
    const teamIdx = table.get(key);
    if (teamIdx === undefined || excludedTeams.has(teamIdx)) { attempts++; continue; }
    return teamIdx;
  }
  return -1;
}

// 2027 ball-based draw
function runWith2027Balls(teams) {
  const excluded = new Set();
  const winners  = [];

  for (let pick = 0; pick < 4; pick++) {
    const winner = drawOnePick2027(teams, excluded);
    winners.push(winner);
    excluded.add(winner);
  }

  const nonWinners = teams
    .map((t, i) => ({ ...t, idx: i }))
    .filter(t => !excluded.has(t.idx))
    .sort((a, b) => b.balls !== undefined && a.balls !== undefined ? b.balls - a.balls : a.seed - b.seed);

  return [
    ...winners.map(i => ({ ...teams[i], idx: i })),
    ...nonWinners,
  ];
}

// ── Init mock panel ───────────────────────────────────────────────────────────

function initMock() {
  buildCharts();
}

// ── Tanking Tracker ──────────────────────────────────────────────────────────

const TANKING_SEASONS = [
  "2018-19", "2019-20", "2020-21", "2021-22",
  "2022-23", "2023-24", "2024-25", "2025-26"
];

// Distinct colors for up to 30 teams — using the Elemental palette as base
const TEAM_COLORS = [
  "#c8391a","#1a6abf","#2a8a46","#c8943a","#8a3ac8",
  "#c83a8a","#3ac8c8","#8ac83a","#3a6ac8","#c8a83a",
  "#6ac83a","#c86a3a","#3ac86a","#c83a6a","#6a3ac8",
  "#a83ac8","#3a8ac8","#c8c83a","#3ac8a8","#c8603a",
  "#603ac8","#3ac860","#c83a60","#60c83a","#3a60c8",
  "#c8a060","#60a0c8","#a0c860","#c860a0","#60c8a0",
];

let tankingData     = null;
let tankingSeason   = "2022-23";
let tankingMode     = "static";   // "static" or "animated"
let tankingSelected = new Set();
let tankingChart    = null;
let animationTimer  = null;

async function loadTankingSeason(season) {
  const year = season.split("-")[0];
  const res  = await fetch(`data/tanking_${year}.json?v=2`);
  tankingData = await res.json();

  // Default: select bottom 10 by final win %
  tankingSelected = new Set(
    tankingData.slice(0, 10).map(t => t.abbr)
  );

  buildTeamToggles();
  renderTankingChart();
}

function buildSeasonBtns() {
  const wrap = document.getElementById('season-btns');
  wrap.innerHTML = TANKING_SEASONS.map(s => `
    <button class="season-btn ${s === tankingSeason ? 'active' : ''}"
            onclick="switchTankingSeason('${s}', this)">
      ${s}
    </button>
  `).join('');
}

function buildTeamToggles() {
  if (!tankingData) return;
  const wrap = document.getElementById('team-toggles');

  wrap.innerHTML = tankingData.map((team, i) => {
    const color   = TEAM_COLORS[i % TEAM_COLORS.length];
    const active  = tankingSelected.has(team.abbr) ? 'active' : '';
    const record  = `${team.final_wins}-${team.final_losses}`;
    return `
      <button class="team-btn ${active}"
              style="border-color:${color};${active ? `background:${color}20` : ''}"
              data-abbr="${team.abbr}"
              onclick="toggleTeam('${team.abbr}', this, '${color}')">
        ${team.abbr} <span style="font-size:9px;opacity:.7">${record}</span>
      </button>
    `;
  }).join('');

  document.getElementById('team-count').textContent =
    `(${tankingSelected.size} selected)`;
}

function toggleTeam(abbr, btn, color) {
  if (tankingSelected.has(abbr)) {
    tankingSelected.delete(abbr);
    btn.classList.remove('active');
    btn.style.background = '';
  } else {
    tankingSelected.add(abbr);
    btn.classList.add('active');
    btn.style.background = color + '20';
  }
  document.getElementById('team-count').textContent =
    `(${tankingSelected.size} selected)`;
  renderTankingChart();
}

function switchTankingSeason(season, btn) {
  tankingSeason = season;
  document.querySelectorAll('.season-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  loadTankingSeason(season);
}

function setChartMode(mode, btn) {
  tankingMode = mode;
  document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  document.getElementById('animateBtn').style.display =
    mode === 'animated' ? 'block' : 'none';
  renderTankingChart();
}

function replayAnimation() {
  renderTankingChart();
}

function getChartDatasets() {
  if (!tankingData) return [];

  return tankingData
    .filter(t => tankingSelected.has(t.abbr))
    .map((team, i) => {
      // Find color index from full team list
      const colorIdx = tankingData.indexOf(team);
      const color = TEAM_COLORS[colorIdx % TEAM_COLORS.length];

      // Remove duplicate Final snapshot
      const snaps = team.snapshots.filter(s => s.label !== 'Final');

      return {
        label:           `${team.abbr} (${team.final_wins}-${team.final_losses})`,
        data:            snaps.map(s => ({ x: s.label, y: +(s.win_pct * 100).toFixed(1) })),
        borderColor:     color,
        backgroundColor: color + '18',
        borderWidth:     2,
        pointRadius:     3,
        pointHoverRadius: 5,
        tension:         0.3,
        fill:            false,
      };
    });
}

function renderTankingChart() {
  if (animationTimer) { clearTimeout(animationTimer); animationTimer = null; }

  const datasets = getChartDatasets();
  if (!datasets.length) return;

  // Get x labels from first team
  const firstTeam = tankingData.find(t => tankingSelected.has(t.abbr));
  const labels    = firstTeam
    ? firstTeam.snapshots.filter(s => s.label !== 'Final').map(s => s.label)
    : [];

  const ctx = document.getElementById('tankingChart').getContext('2d');

  if (tankingChart) { tankingChart.destroy(); tankingChart = null; }

  const isAnimated = tankingMode === 'animated';

  tankingChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: isAnimated
        ? datasets.map(d => ({ ...d, data: [] }))  // start empty for animation
        : datasets,
    },
    options: {
      responsive:          true,
      maintainAspectRatio: false,
      animation:           { duration: isAnimated ? 0 : 600 },
      interaction:         { mode: 'index', intersect: false },
      plugins: {
        legend: {
          position: 'top',
          labels: {
            font:        { family: "'Barlow Condensed', sans-serif", size: 12, weight: '700' },
            color:       '#56412f',
            boxWidth:    14,
            padding:     10,
            usePointStyle: true,
          },
        },
        tooltip: {
          backgroundColor: '#2a1f17',
          titleColor:      '#DABB9F',
          bodyColor:       '#97928A',
          borderColor:     '#9C5D41',
          borderWidth:     1,
          titleFont:       { family: "'Barlow Condensed', sans-serif", size: 13, weight: '800' },
          bodyFont:        { family: "'Barlow Condensed', sans-serif", size: 12 },
          callbacks: {
            label: ctx => ` ${ctx.dataset.label}: ${ctx.parsed.y}%`,
          },
        },
      },
      scales: {
        x: {
          grid:  { color: 'rgba(156,93,65,0.1)' },
          ticks: {
            font:  { family: "'Barlow Condensed', sans-serif", size: 11 },
            color: '#97928A',
          },
        },
        y: {
          min:   0,
          max:   100,
          grid:  { color: 'rgba(156,93,65,0.1)' },
          ticks: {
            font:     { family: "'Barlow Condensed', sans-serif", size: 11 },
            color:    '#97928A',
            callback: v => v + '%',
            stepSize: 10,
          },
        },
      },
    },
  });

  // Animate: reveal one snapshot at a time
  if (isAnimated) {
    let step = 0;
    function revealStep() {
      if (step >= labels.length) return;
      tankingChart.data.datasets.forEach((ds, di) => {
        ds.data.push(datasets[di].data[step]);
      });
      tankingChart.update('none');
      step++;
      animationTimer = setTimeout(revealStep, 300);
    }
    revealStep();
  }
}

function initTanking() {
  buildSeasonBtns();
  loadTankingSeason(tankingSeason);
}
