import { getData, getActiveKid, addKid, setActiveKid } from './state.js';
import { exportJSON, importJSON } from './storage.js';
import { renderCalendarEditor, renderActivityManager, renderTodaySchedule } from './schedule.js';
import { renderTaskEditor, renderTodayTasks } from './routines.js';
import { renderRewardEditor, renderRewardShop, renderPointsAdjuster, renderRedemptionHistory } from './rewards.js';
import { renderStreakCard, renderBadgeGrid, renderWeeklyStats, renderMonthlyComparison } from './achievements.js';

const AVATARS = ['🦁', '🐯', '🐰', '🐼', '🦊', '🐸', '🐵', '🐶', '🐱', '🦄'];

const app = document.getElementById('app');

function render() {
  const data = getData();
  const kid = getActiveKid();
  if (!kid) {
    renderKidPicker();
  } else {
    renderMain(kid.id);
  }
}

function renderKidPicker() {
  app.innerHTML = '';
  const data = getData();
  const wrap = document.createElement('div');
  wrap.className = 'kid-picker';

  const hero = document.createElement('div');
  hero.className = 'hero-banner';
  hero.innerHTML = `
    <div class="hero-pokeball hero-pokeball-1"></div>
    <div class="hero-pokeball hero-pokeball-2"></div>
    <div class="hero-pokeball hero-pokeball-3"></div>
    <h1 class="pixel-title">KidLife</h1>
    <p class="hero-subtitle">生活作息學習樂園 · 打卡拿點數，養成好習慣！</p>
  `;
  wrap.appendChild(hero);

  const selectHeading = document.createElement('h2');
  selectHeading.className = 'section-heading';
  selectHeading.textContent = '👋 選擇你的訓練家';
  wrap.appendChild(selectHeading);

  const cards = document.createElement('div');
  cards.className = 'kid-cards';
  if (data.kids.length === 0) {
    const empty = document.createElement('p');
    empty.className = 'empty-hint';
    empty.textContent = '還沒有小朋友，先在下面新增一位吧！';
    cards.appendChild(empty);
  }
  data.kids.forEach((kid) => {
    const card = document.createElement('div');
    card.className = 'kid-card';
    const hpPercent = Math.min(100, kid.points);
    card.innerHTML = `
      <div class="kid-avatar">${kid.avatar}</div>
      <div class="kid-card-name">${kid.name}</div>
      <div class="hp-bar-track kid-card-hp"><div class="hp-bar-fill" style="width:${hpPercent}%"></div></div>
      <div class="kid-card-points">⭐ ${kid.points} 點</div>
    `;
    card.addEventListener('click', () => {
      setActiveKid(kid.id);
      render();
    });
    cards.appendChild(card);
  });
  wrap.appendChild(cards);

  const addCard = document.createElement('div');
  addCard.className = 'add-kid-card';
  const avatarPicker = AVATARS.map((a) => `<option value="${a}">${a}</option>`).join('');
  addCard.innerHTML = `
    <h3>✨ 新增小朋友</h3>
    <div class="add-kid-form">
      <input type="text" class="new-kid-name" placeholder="姓名" />
      <select class="new-kid-avatar">${avatarPicker}</select>
      <button type="button" class="new-kid-btn">新增</button>
    </div>
  `;
  addCard.querySelector('.new-kid-btn').addEventListener('click', () => {
    const name = addCard.querySelector('.new-kid-name').value.trim();
    const avatar = addCard.querySelector('.new-kid-avatar').value;
    if (!name) return;
    addKid(name, avatar);
    render();
  });
  wrap.appendChild(addCard);
  app.appendChild(wrap);
}

const TABS = [
  { key: 'today', label: '今日作息' },
  { key: 'schedule', label: '📅 課表日曆設定' },
  { key: 'rewards', label: '點數兌換' },
  { key: 'achievements', label: '🏆成就' },
  { key: 'settings', label: '設定' },
];

let currentTab = 'today';

function renderMain(kidId) {
  const data = getData();
  const kid = data.kids.find((k) => k.id === kidId);
  app.innerHTML = '';

  const header = document.createElement('div');
  header.className = 'app-header';
  const hpPercent = Math.min(100, kid.points);
  header.innerHTML = `
    <div class="current-kid">
      <span class="kid-avatar-badge">${kid.avatar}</span>
      <div class="kid-hp-block">
        <div class="kid-name-row"><span>${kid.name}</span><span class="hp-label">PT</span></div>
        <div class="hp-bar-track"><div class="hp-bar-fill" style="width:${hpPercent}%"></div></div>
        <div class="hp-value">${kid.points} 點</div>
      </div>
    </div>
    <button type="button" class="switch-kid-btn">切換小朋友</button>
  `;
  header.querySelector('.switch-kid-btn').addEventListener('click', () => {
    setActiveKid(null);
    render();
  });
  app.appendChild(header);

  const nav = document.createElement('div');
  nav.className = 'tab-nav';
  TABS.forEach((tab) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = tab.label;
    btn.className = `tab-btn${currentTab === tab.key ? ' active' : ''}`;
    btn.addEventListener('click', () => {
      currentTab = tab.key;
      renderMain(kidId);
    });
    nav.appendChild(btn);
  });
  app.appendChild(nav);

  const content = document.createElement('div');
  content.className = 'tab-content';
  app.appendChild(content);

  if (currentTab === 'today') renderTodayTab(content, kidId);
  else if (currentTab === 'schedule') renderScheduleTab(content, kidId);
  else if (currentTab === 'rewards') renderRewardsTab(content, kidId);
  else if (currentTab === 'achievements') renderAchievementsTab(content, kidId);
  else if (currentTab === 'settings') renderSettingsTab(content, kidId);
}

function renderTodayTab(content, kidId) {
  const scheduleBox = document.createElement('div');
  scheduleBox.className = 'section-box';
  content.appendChild(scheduleBox);
  renderTodaySchedule(scheduleBox, kidId);

  const taskBox = document.createElement('div');
  taskBox.className = 'section-box';
  taskBox.innerHTML = '<h3>每日小任務</h3>';
  const taskInner = document.createElement('div');
  taskBox.appendChild(taskInner);
  content.appendChild(taskBox);
  renderTodayTasks(taskInner, kidId);
}

const SCHEDULE_SUBTABS = [
  { key: 'calendar', label: '📅 課表日曆' },
  { key: 'activities', label: '🗂 活動設定' },
];

let currentScheduleSubtab = 'calendar';

function renderScheduleTab(content, kidId) {
  content.innerHTML = '';
  const subNav = document.createElement('div');
  subNav.className = 'tab-nav settings-subnav';
  SCHEDULE_SUBTABS.forEach((tab) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = tab.label;
    btn.className = `tab-btn${currentScheduleSubtab === tab.key ? ' active' : ''}`;
    btn.addEventListener('click', () => {
      currentScheduleSubtab = tab.key;
      renderScheduleTab(content, kidId);
    });
    subNav.appendChild(btn);
  });
  content.appendChild(subNav);

  const pane = document.createElement('div');
  content.appendChild(pane);

  if (currentScheduleSubtab === 'calendar') {
    const section = document.createElement('div');
    section.className = 'section-box';
    section.innerHTML = '<h3>課表日曆（拖拉活動到格子，可疊加多個）</h3>';
    const inner = document.createElement('div');
    section.appendChild(inner);
    pane.appendChild(section);
    renderCalendarEditor(inner, kidId);
  } else {
    const section = document.createElement('div');
    section.className = 'section-box';
    section.innerHTML = '<h3>活動素材管理（新增／編輯／刪除）</h3>';
    const inner = document.createElement('div');
    section.appendChild(inner);
    pane.appendChild(section);
    renderActivityManager(inner);
  }
}

function renderAchievementsTab(content, kidId) {
  const streakBox = document.createElement('div');
  streakBox.className = 'section-box';
  content.appendChild(streakBox);
  renderStreakCard(streakBox, kidId);

  const statsBox = document.createElement('div');
  statsBox.className = 'section-box';
  statsBox.innerHTML = '<h3>本週完成率</h3>';
  const statsInner = document.createElement('div');
  statsBox.appendChild(statsInner);
  content.appendChild(statsBox);
  renderWeeklyStats(statsInner, kidId);

  const badgeBox = document.createElement('div');
  badgeBox.className = 'section-box';
  badgeBox.innerHTML = '<h3>成就徽章</h3>';
  const badgeInner = document.createElement('div');
  badgeBox.appendChild(badgeInner);
  content.appendChild(badgeBox);
  renderBadgeGrid(badgeInner, kidId);

  const compareBox = document.createElement('div');
  compareBox.className = 'section-box';
  compareBox.innerHTML = '<h3>👨‍👩‍👧‍👦 每月手足比較</h3>';
  const compareInner = document.createElement('div');
  compareBox.appendChild(compareInner);
  content.appendChild(compareBox);
  renderMonthlyComparison(compareInner);
}

const REWARDS_SUBTABS = [
  { key: 'shop', label: '🎁 兌換商店' },
  { key: 'history', label: '📜 兌換歷程' },
];

let currentRewardsSubtab = 'shop';

function renderRewardsTab(content, kidId) {
  content.innerHTML = '';
  const subNav = document.createElement('div');
  subNav.className = 'tab-nav settings-subnav';
  REWARDS_SUBTABS.forEach((tab) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = tab.label;
    btn.className = `tab-btn${currentRewardsSubtab === tab.key ? ' active' : ''}`;
    btn.addEventListener('click', () => {
      currentRewardsSubtab = tab.key;
      renderRewardsTab(content, kidId);
    });
    subNav.appendChild(btn);
  });
  content.appendChild(subNav);

  const pane = document.createElement('div');
  content.appendChild(pane);

  if (currentRewardsSubtab === 'shop') {
    renderRewardShop(pane, kidId);
  } else {
    const section = document.createElement('div');
    section.className = 'section-box';
    section.innerHTML = '<h3>兌換歷程</h3>';
    const inner = document.createElement('div');
    section.appendChild(inner);
    pane.appendChild(section);
    renderRedemptionHistory(inner, kidId);
  }
}

const SETTINGS_SUBTABS = [
  { key: 'tasks', label: '✅ 每日任務' },
  { key: 'rewards', label: '🎁 獎勵設定' },
  { key: 'points', label: '⭐ 手動調點' },
  { key: 'backup', label: '💾 資料備份' },
];

let currentSettingsSubtab = 'tasks';

function renderSettingsTab(content, kidId) {
  const subNav = document.createElement('div');
  subNav.className = 'tab-nav settings-subnav';
  SETTINGS_SUBTABS.forEach((tab) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = tab.label;
    btn.className = `tab-btn${currentSettingsSubtab === tab.key ? ' active' : ''}`;
    btn.addEventListener('click', () => {
      currentSettingsSubtab = tab.key;
      renderSettingsTab(content, kidId);
    });
    subNav.appendChild(btn);
  });
  content.innerHTML = '';
  content.appendChild(subNav);

  const pane = document.createElement('div');
  content.appendChild(pane);

  if (currentSettingsSubtab === 'tasks') {
    const section = document.createElement('div');
    section.className = 'section-box';
    section.innerHTML = '<h3>每日小任務設定</h3>';
    const inner = document.createElement('div');
    section.appendChild(inner);
    pane.appendChild(section);
    renderTaskEditor(inner, kidId);
  } else if (currentSettingsSubtab === 'rewards') {
    const section = document.createElement('div');
    section.className = 'section-box';
    section.innerHTML = '<h3>獎勵設定</h3>';
    const inner = document.createElement('div');
    section.appendChild(inner);
    pane.appendChild(section);
    renderRewardEditor(inner, kidId);
  } else if (currentSettingsSubtab === 'points') {
    const section = document.createElement('div');
    section.className = 'section-box';
    section.innerHTML = '<h3>手動調整點數</h3>';
    const inner = document.createElement('div');
    section.appendChild(inner);
    pane.appendChild(section);
    renderPointsAdjuster(inner, kidId);
  } else if (currentSettingsSubtab === 'backup') {
    const section = document.createElement('div');
    section.className = 'section-box';
    section.innerHTML = `
      <h3>資料備份</h3>
      <button type="button" class="export-btn">匯出備份 (JSON)</button>
      <input type="file" class="import-input" accept="application/json" />
    `;
    section.querySelector('.export-btn').addEventListener('click', () => {
      exportJSON(getData());
    });
    section.querySelector('.import-input').addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      try {
        await importJSON(file);
        alert('匯入成功！');
        window.location.reload();
      } catch (err) {
        alert('匯入失敗：' + err.message);
      }
    });
    pane.appendChild(section);
  }
}

render();
