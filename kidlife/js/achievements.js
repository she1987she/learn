import { getData, persist, todayStr, addPoints } from './state.js';

function pad(n) {
  return String(n).padStart(2, '0');
}

function dateToStr(d) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function addDaysToStr(dateStr, delta) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() + delta);
  return dateToStr(dt);
}

function startOfWeek(d) {
  const date = new Date(d);
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + diff);
  date.setHours(0, 0, 0, 0);
  return date;
}

const MILESTONES = [3, 7, 14, 30];
const MILESTONE_BONUS = { 3: 5, 7: 10, 14: 20, 30: 50 };

const BADGE_DEFS = [
  { key: 'first_checkin', icon: '🥇', label: '初次打卡', check: (ctx) => ctx.totalCompletions >= 1 },
  { key: 'checkin_10', icon: '🔟', label: '累積10次', check: (ctx) => ctx.totalCompletions >= 10 },
  { key: 'checkin_50', icon: '🏅', label: '累積50次', check: (ctx) => ctx.totalCompletions >= 50 },
  { key: 'checkin_100', icon: '🏆', label: '累積100次', check: (ctx) => ctx.totalCompletions >= 100 },
  { key: 'streak_3', icon: '🔥', label: '連續3天', check: (ctx) => ctx.longestStreak >= 3 },
  { key: 'streak_7', icon: '🔥🔥', label: '連續7天', check: (ctx) => ctx.longestStreak >= 7 },
  { key: 'streak_14', icon: '🔥🔥🔥', label: '連續14天', check: (ctx) => ctx.longestStreak >= 14 },
  { key: 'first_redeem', icon: '🎁', label: '首次兌換', check: (ctx) => ctx.redemptionCount >= 1 },
];

function ensureStreak(kidId) {
  const data = getData();
  if (!data.streaks[kidId]) data.streaks[kidId] = { current: 0, longest: 0, lastDate: null, awardedMilestones: [] };
  return data.streaks[kidId];
}

function ensureBadges(kidId) {
  const data = getData();
  if (!data.badges[kidId]) data.badges[kidId] = [];
  return data.badges[kidId];
}

function getContext(kidId) {
  const data = getData();
  const totalCompletions =
    data.routineLog.filter((l) => l.kidId === kidId && l.done).length +
    data.scheduleLog.filter((l) => l.kidId === kidId && l.done).length;
  const longestStreak = ensureStreak(kidId).longest;
  const redemptionCount = data.redemptions.filter((r) => r.kidId === kidId).length;
  return { totalCompletions, longestStreak, redemptionCount };
}

function checkAndUnlockBadges(kidId) {
  const badges = ensureBadges(kidId);
  const ctx = getContext(kidId);
  let changed = false;
  BADGE_DEFS.forEach((b) => {
    if (!badges.includes(b.key) && b.check(ctx)) {
      badges.push(b.key);
      changed = true;
    }
  });
  if (changed) persist();
}

function recordCompletion(kidId) {
  const streak = ensureStreak(kidId);
  const today = todayStr();
  if (streak.lastDate === today) {
    // 今天已經記錄過，不重複累加天數
  } else if (streak.lastDate === addDaysToStr(today, -1)) {
    streak.current += 1;
    streak.lastDate = today;
  } else {
    streak.current = 1;
    streak.lastDate = today;
  }
  streak.longest = Math.max(streak.longest, streak.current);
  persist();

  MILESTONES.forEach((m) => {
    if (streak.current >= m && !streak.awardedMilestones.includes(m)) {
      streak.awardedMilestones.push(m);
      persist();
      addPoints(kidId, MILESTONE_BONUS[m], `連續達成${m}天獎勵`);
    }
  });

  checkAndUnlockBadges(kidId);
}

function renderStreakCard(container, kidId) {
  container.innerHTML = '';
  const streak = ensureStreak(kidId);
  const card = document.createElement('div');
  card.className = 'streak-card';
  card.innerHTML = `🔥 目前連續 <strong>${streak.current}</strong> 天　（最長紀錄 ${streak.longest} 天）`;
  container.appendChild(card);
}

function renderBadgeGrid(container, kidId) {
  container.innerHTML = '';
  const badges = ensureBadges(kidId);
  const grid = document.createElement('div');
  grid.className = 'badge-grid';
  BADGE_DEFS.forEach((b) => {
    const unlocked = badges.includes(b.key);
    const card = document.createElement('div');
    card.className = `badge-card${unlocked ? ' unlocked' : ' locked'}`;
    card.innerHTML = `<div class="badge-icon">${unlocked ? b.icon : '🔒'}</div><div class="badge-label">${b.label}</div>`;
    grid.appendChild(card);
  });
  container.appendChild(grid);
}

function renderWeeklyStats(container, kidId) {
  container.innerHTML = '';
  const data = getData();
  const weekStart = startOfWeek(new Date());
  const today = todayStr();
  const routineTaskCount = data.routineTasks.filter((t) => t.kidId === kidId).length;
  const WEEKDAY_LABELS = ['一', '二', '三', '四', '五', '六', '日'];

  const chart = document.createElement('div');
  chart.className = 'weekly-chart';

  let weekPointsDelta = 0;
  const weekStartStr = dateToStr(weekStart);

  for (let i = 0; i < 7; i++) {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    const dateStr = dateToStr(d);
    if (dateStr > today) break; // 尚未到來的日子不計算

    const scheduledCount = Object.values(
      (data.dateSchedule[kidId] && data.dateSchedule[kidId][dateStr]) || {}
    ).reduce((sum, arr) => sum + arr.length, 0);
    const totalScheduled = scheduledCount + routineTaskCount;

    const completedCount =
      data.scheduleLog.filter((l) => l.kidId === kidId && l.date === dateStr && l.done).length +
      data.routineLog.filter((l) => l.kidId === kidId && l.date === dateStr && l.done).length;

    const rate = totalScheduled > 0 ? Math.round((completedCount / totalScheduled) * 100) : 0;

    const bar = document.createElement('div');
    bar.className = 'chart-bar-col';
    bar.innerHTML = `
      <div class="chart-bar-track"><div class="chart-bar-fill" style="height:${rate}%"></div></div>
      <div class="chart-bar-label">週${WEEKDAY_LABELS[i]}</div>
      <div class="chart-bar-value">${rate}%</div>
    `;
    chart.appendChild(bar);
  }
  container.appendChild(chart);

  data.pointsLedger
    .filter((p) => p.kidId === kidId && p.timestamp.slice(0, 10) >= weekStartStr)
    .forEach((p) => {
      weekPointsDelta += p.delta;
    });
  const summary = document.createElement('p');
  summary.className = 'week-points-summary';
  summary.textContent = `本週點數異動合計：${weekPointsDelta >= 0 ? '+' : ''}${weekPointsDelta} 點`;
  container.appendChild(summary);
}

function monthInputValue(d) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
}

function getMonthStats(kidId, monthStr) {
  const data = getData();
  const completions =
    data.routineLog.filter((l) => l.kidId === kidId && l.done && l.date.startsWith(monthStr)).length +
    data.scheduleLog.filter((l) => l.kidId === kidId && l.done && l.date.startsWith(monthStr)).length;
  const pointsDelta = data.pointsLedger
    .filter((p) => p.kidId === kidId && p.timestamp.slice(0, 7) === monthStr)
    .reduce((sum, p) => sum + p.delta, 0);
  return { completions, pointsDelta };
}

function renderMonthlyComparison(container) {
  const data = getData();
  let selectedMonth = monthInputValue(new Date());

  function draw() {
    container.innerHTML = '';

    const picker = document.createElement('div');
    picker.className = 'month-picker-bar';
    picker.innerHTML = `
      <span>選擇月份：</span>
      <input type="month" class="month-compare-input" value="${selectedMonth}" min="2026-01" />
    `;
    picker.querySelector('.month-compare-input').addEventListener('change', (e) => {
      if (e.target.value) {
        selectedMonth = e.target.value;
        draw();
      }
    });
    container.appendChild(picker);

    if (data.kids.length === 0) {
      const empty = document.createElement('p');
      empty.className = 'empty-hint';
      empty.textContent = '還沒有其他小朋友資料可以比較。';
      container.appendChild(empty);
      return;
    }

    const stats = data.kids.map((kid) => ({ kid, ...getMonthStats(kid.id, selectedMonth) }));
    const maxCompletions = Math.max(1, ...stats.map((s) => s.completions));
    const maxPoints = Math.max(1, ...stats.map((s) => Math.abs(s.pointsDelta)));

    const compareGrid = document.createElement('div');
    compareGrid.className = 'compare-grid';

    stats.forEach(({ kid, completions, pointsDelta }) => {
      const row = document.createElement('div');
      row.className = 'compare-row';
      const completionPct = Math.round((completions / maxCompletions) * 100);
      const pointsPct = Math.round((Math.abs(pointsDelta) / maxPoints) * 100);
      row.innerHTML = `
        <div class="compare-kid-label">${kid.avatar} ${kid.name}</div>
        <div class="compare-metric">
          <span class="compare-metric-label">完成次數 ${completions}</span>
          <div class="compare-bar-track"><div class="compare-bar-fill completions-fill" style="width:${completionPct}%"></div></div>
        </div>
        <div class="compare-metric">
          <span class="compare-metric-label">點數變化 ${pointsDelta >= 0 ? '+' : ''}${pointsDelta}</span>
          <div class="compare-bar-track"><div class="compare-bar-fill points-fill" style="width:${pointsPct}%"></div></div>
        </div>
      `;
      compareGrid.appendChild(row);
    });
    container.appendChild(compareGrid);
  }

  draw();
}

export {
  recordCompletion,
  checkAndUnlockBadges,
  renderStreakCard,
  renderBadgeGrid,
  renderWeeklyStats,
  renderMonthlyComparison,
};
