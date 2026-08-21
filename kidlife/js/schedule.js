import { getData, persist, uid, todayStr, addPoints } from './state.js';
import { recordCompletion } from './achievements.js';

function pad(n) {
  return String(n).padStart(2, '0');
}

function dateToStr(d) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function isWeekendDate(d) {
  const day = d.getDay();
  return day === 0 || day === 6;
}

function timeSlotsForDate(d) {
  const range = isWeekendDate(d) ? [8, 22] : [18, 22];
  const slots = [];
  for (let h = range[0]; h < range[1]; h++) {
    slots.push(`${pad(h)}:00`);
    slots.push(`${pad(h)}:30`);
  }
  slots.push(`${pad(range[1])}:00`);
  return slots;
}

function startOfWeek(d) {
  const date = new Date(d);
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day; // 週一為週首
  date.setDate(date.getDate() + diff);
  date.setHours(0, 0, 0, 0);
  return date;
}

// ---- ISO week <-> date helpers (for year/month/week jump) ----
function isoWeekInfo(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  return { year: d.getUTCFullYear(), week: weekNo };
}

function isoWeekToMonday(year, week) {
  const simple = new Date(Date.UTC(year, 0, 1 + (week - 1) * 7));
  const dow = simple.getUTCDay();
  const isoMonday = new Date(simple);
  if (dow <= 4) isoMonday.setUTCDate(simple.getUTCDate() - dow + 1);
  else isoMonday.setUTCDate(simple.getUTCDate() + 8 - dow);
  return new Date(isoMonday.getUTCFullYear(), isoMonday.getUTCMonth(), isoMonday.getUTCDate());
}

function weekInputValue(monday) {
  const info = isoWeekInfo(monday);
  return `${info.year}-W${pad(info.week)}`;
}

function weekInputValueToMonday(value) {
  const match = /^(\d{4})-W(\d{2})$/.exec(value);
  if (!match) return null;
  return isoWeekToMonday(Number(match[1]), Number(match[2]));
}

const MIN_WEEK_START = startOfWeek(new Date(2026, 0, 1));

function clampToMinWeek(d) {
  return d < MIN_WEEK_START ? new Date(MIN_WEEK_START) : d;
}

let viewWeekStart = clampToMinWeek(startOfWeek(new Date()));

const WEEKDAY_LABELS = ['日', '一', '二', '三', '四', '五', '六'];

// ---- Activity catalog CRUD ----
function getActivity(key) {
  return getData().activityCatalog.find((a) => a.key === key) || null;
}

function addCustomActivity(label, icon, points) {
  const data = getData();
  const key = uid('act');
  data.activityCatalog.push({ key, label, icon: icon || '⭐', points: Number(points) || 1, isCustom: true });
  persist();
  return key;
}

function updateActivity(key, { label, icon, points }) {
  const data = getData();
  const act = data.activityCatalog.find((a) => a.key === key);
  if (!act) return;
  act.label = label;
  act.icon = icon || '⭐';
  act.points = Number(points) || 0;
  persist();
}

function removeActivity(key) {
  const data = getData();
  data.activityCatalog = data.activityCatalog.filter((a) => a.key !== key);
  persist();
}

// ---- Slot data access ----
function getSlotActivities(kidId, dateStr, time) {
  const data = getData();
  return (data.dateSchedule[kidId] && data.dateSchedule[kidId][dateStr] && data.dateSchedule[kidId][dateStr][time]) || [];
}

function addSlotActivity(kidId, dateStr, time, activityKey) {
  const data = getData();
  if (!data.dateSchedule[kidId]) data.dateSchedule[kidId] = {};
  if (!data.dateSchedule[kidId][dateStr]) data.dateSchedule[kidId][dateStr] = {};
  if (!data.dateSchedule[kidId][dateStr][time]) data.dateSchedule[kidId][dateStr][time] = [];
  data.dateSchedule[kidId][dateStr][time].push(activityKey);
  persist();
}

function removeSlotActivity(kidId, dateStr, time, index) {
  const data = getData();
  const arr = data.dateSchedule[kidId]?.[dateStr]?.[time];
  if (!arr) return;
  arr.splice(index, 1);
  persist();
}

function copyWeek(kidId, sourceMonday, targetMonday) {
  const data = getData();
  if (!data.dateSchedule[kidId]) data.dateSchedule[kidId] = {};
  for (let i = 0; i < 7; i++) {
    const src = new Date(sourceMonday);
    src.setDate(src.getDate() + i);
    const dst = new Date(targetMonday);
    dst.setDate(dst.getDate() + i);
    const srcStr = dateToStr(src);
    const dstStr = dateToStr(dst);
    const srcDay = data.dateSchedule[kidId][srcStr];
    if (srcDay) {
      data.dateSchedule[kidId][dstStr] = JSON.parse(JSON.stringify(srcDay));
    }
  }
  persist();
}

function getTodayEntries(kidId) {
  const dateStr = todayStr();
  const today = new Date();
  const slots = timeSlotsForDate(today);
  const entries = [];
  slots.forEach((time) => {
    const keys = getSlotActivities(kidId, dateStr, time);
    keys.forEach((activityKey, idx) => {
      entries.push({ time, activityKey, idx, activity: getActivity(activityKey) });
    });
  });
  return entries;
}

function isDone(kidId, date, time, activityKey) {
  return getData().scheduleLog.some(
    (l) => l.kidId === kidId && l.date === date && l.time === time && l.activityKey === activityKey && l.done
  );
}

function checkOff(kidId, time, activityKey) {
  const data = getData();
  const date = todayStr();
  if (isDone(kidId, date, time, activityKey)) return false;
  const activity = getActivity(activityKey);
  data.scheduleLog.push({ kidId, date, time, activityKey, done: true });
  persist();
  addPoints(kidId, activity ? activity.points : 0, `完成作息：${activity ? activity.label : activityKey}`);
  recordCompletion(kidId);
  return true;
}

// ---- Activity catalog management UI (新增/編輯/刪除) ----
function renderActivityManager(container) {
  container.innerHTML = '';
  const data = getData();
  const list = document.createElement('div');
  list.className = 'task-editor-list';

  data.activityCatalog.forEach((act) => {
    const row = document.createElement('div');
    row.className = 'task-editor-row';

    const info = document.createElement('span');
    info.textContent = `${act.icon} ${act.label}（+${act.points}點）`;
    row.appendChild(info);

    const btnGroup = document.createElement('span');
    const editBtn = document.createElement('button');
    editBtn.type = 'button';
    editBtn.textContent = '編輯';
    editBtn.addEventListener('click', () => renderActivityEditRow(row, act, container));
    btnGroup.appendChild(editBtn);

    const delBtn = document.createElement('button');
    delBtn.type = 'button';
    delBtn.textContent = '刪除';
    delBtn.addEventListener('click', () => {
      removeActivity(act.key);
      renderActivityManager(container);
    });
    btnGroup.appendChild(delBtn);

    row.appendChild(btnGroup);
    list.appendChild(row);
  });
  container.appendChild(list);

  const addForm = document.createElement('div');
  addForm.className = 'add-activity-form';
  addForm.innerHTML = `
    <input type="text" placeholder="活動名稱" class="new-act-label" size="8" />
    <input type="text" placeholder="圖示(emoji)" class="new-act-icon" size="4" />
    <input type="number" placeholder="點數" class="new-act-points" size="4" value="1" />
    <button type="button" class="new-act-btn">新增活動</button>
  `;
  addForm.querySelector('.new-act-btn').addEventListener('click', () => {
    const label = addForm.querySelector('.new-act-label').value.trim();
    const icon = addForm.querySelector('.new-act-icon').value.trim();
    const points = addForm.querySelector('.new-act-points').value;
    if (!label) return;
    addCustomActivity(label, icon, points);
    renderActivityManager(container);
  });
  container.appendChild(addForm);
}

function renderActivityEditRow(row, act, container) {
  row.innerHTML = `
    <input type="text" class="edit-act-label" value="${act.label}" size="8" />
    <input type="text" class="edit-act-icon" value="${act.icon}" size="3" />
    <input type="number" class="edit-act-points" value="${act.points}" size="4" />
  `;
  const btnGroup = document.createElement('span');
  const saveBtn = document.createElement('button');
  saveBtn.type = 'button';
  saveBtn.textContent = '儲存';
  saveBtn.addEventListener('click', () => {
    const label = row.querySelector('.edit-act-label').value.trim();
    const icon = row.querySelector('.edit-act-icon').value.trim();
    const points = row.querySelector('.edit-act-points').value;
    if (!label) return;
    updateActivity(act.key, { label, icon, points });
    renderActivityManager(container);
  });
  btnGroup.appendChild(saveBtn);

  const cancelBtn = document.createElement('button');
  cancelBtn.type = 'button';
  cancelBtn.textContent = '取消';
  cancelBtn.addEventListener('click', () => renderActivityManager(container));
  btnGroup.appendChild(cancelBtn);
  row.appendChild(btnGroup);
}

// ---- Parent editor (drag & drop week view) ----
function renderCalendarEditor(container, kidId) {
  container.innerHTML = '';

  const paletteLabel = document.createElement('h4');
  paletteLabel.textContent = '拖拉下方活動到格子安排課表';
  container.appendChild(paletteLabel);

  const palette = document.createElement('div');
  palette.className = 'activity-palette';
  const data = getData();
  data.activityCatalog.forEach((act) => {
    const chip = document.createElement('div');
    chip.className = 'activity-chip';
    chip.draggable = true;
    chip.textContent = `${act.icon} ${act.label}`;
    chip.dataset.key = act.key;
    chip.addEventListener('dragstart', (e) => {
      e.dataTransfer.setData('text/plain', act.key);
    });
    palette.appendChild(chip);
  });
  container.appendChild(palette);

  const weekNav = document.createElement('div');
  weekNav.className = 'week-nav';
  const weekEnd = new Date(viewWeekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);
  const rangeLabel = `${viewWeekStart.getFullYear()}/${viewWeekStart.getMonth() + 1}/${viewWeekStart.getDate()} - ${weekEnd.getMonth() + 1}/${weekEnd.getDate()}`;
  const isAtMinWeek = dateToStr(viewWeekStart) === dateToStr(MIN_WEEK_START);
  weekNav.innerHTML = `
    <button type="button" class="week-prev-btn" ${isAtMinWeek ? 'disabled' : ''}>〈 上一週</button>
    <span class="week-range-label">${rangeLabel}</span>
    <button type="button" class="week-next-btn">下一週 〉</button>
    <button type="button" class="week-today-btn">回到本週</button>
    <label class="week-jump-label">年/月/週篩選：
      <input type="week" class="week-jump-input" value="${weekInputValue(viewWeekStart)}" min="${weekInputValue(MIN_WEEK_START)}" />
    </label>
  `;
  weekNav.querySelector('.week-prev-btn').addEventListener('click', () => {
    const prev = new Date(viewWeekStart);
    prev.setDate(prev.getDate() - 7);
    viewWeekStart = clampToMinWeek(prev);
    renderCalendarEditor(container, kidId);
  });
  weekNav.querySelector('.week-next-btn').addEventListener('click', () => {
    viewWeekStart.setDate(viewWeekStart.getDate() + 7);
    renderCalendarEditor(container, kidId);
  });
  weekNav.querySelector('.week-today-btn').addEventListener('click', () => {
    viewWeekStart = clampToMinWeek(startOfWeek(new Date()));
    renderCalendarEditor(container, kidId);
  });
  weekNav.querySelector('.week-jump-input').addEventListener('change', (e) => {
    const monday = weekInputValueToMonday(e.target.value);
    if (monday) {
      viewWeekStart = clampToMinWeek(monday);
      renderCalendarEditor(container, kidId);
    }
  });
  container.appendChild(weekNav);

  const copyBar = document.createElement('div');
  copyBar.className = 'copy-week-bar';
  copyBar.innerHTML = `
    <span>複製本週課表到：</span>
    <input type="week" class="copy-target-week" min="${weekInputValue(MIN_WEEK_START)}" />
    <button type="button" class="copy-week-btn">複製</button>
  `;
  copyBar.querySelector('.copy-week-btn').addEventListener('click', () => {
    const targetMonday = weekInputValueToMonday(copyBar.querySelector('.copy-target-week').value);
    if (!targetMonday) {
      alert('請先選擇要複製到的週次');
      return;
    }
    if (targetMonday < MIN_WEEK_START) {
      alert('日曆從2026年開始，請選擇2026年以後的週次');
      return;
    }
    if (!confirm('確定要把本週課表複製過去嗎？目標週原有排課將被覆蓋。')) return;
    copyWeek(kidId, viewWeekStart, targetMonday);
    alert('複製完成！');
    renderCalendarEditor(container, kidId);
  });
  container.appendChild(copyBar);

  const grid = document.createElement('div');
  grid.className = 'schedule-grid';

  for (let i = 0; i < 7; i++) {
    const colDate = new Date(viewWeekStart);
    colDate.setDate(colDate.getDate() + i);
    const dateStr = dateToStr(colDate);
    const isToday = dateStr === todayStr();

    const col = document.createElement('div');
    col.className = `schedule-day-col${isToday ? ' is-today' : ''}`;
    const header = document.createElement('div');
    header.className = 'schedule-day-header';
    header.innerHTML = `<div>週${WEEKDAY_LABELS[colDate.getDay()]}</div><div class="schedule-day-date">${colDate.getMonth() + 1}/${colDate.getDate()}</div>`;
    col.appendChild(header);

    timeSlotsForDate(colDate).forEach((time) => {
      const cell = document.createElement('div');
      cell.className = 'schedule-cell';

      const timeLabel = document.createElement('span');
      timeLabel.className = 'schedule-cell-time';
      timeLabel.textContent = time;
      cell.appendChild(timeLabel);

      const tagsWrap = document.createElement('div');
      tagsWrap.className = 'schedule-cell-tags';
      const keys = getSlotActivities(kidId, dateStr, time);
      keys.forEach((activityKey, idx) => {
        const activity = getActivity(activityKey);
        const tag = document.createElement('span');
        tag.className = 'schedule-tag';
        tag.innerHTML = `${activity ? activity.icon : ''} ${activity ? activity.label : activityKey} <button type="button" class="schedule-tag-remove">✕</button>`;
        tag.querySelector('.schedule-tag-remove').addEventListener('click', () => {
          removeSlotActivity(kidId, dateStr, time, idx);
          renderCalendarEditor(container, kidId);
        });
        tagsWrap.appendChild(tag);
      });
      cell.appendChild(tagsWrap);

      cell.addEventListener('dragover', (e) => e.preventDefault());
      cell.addEventListener('drop', (e) => {
        e.preventDefault();
        const key = e.dataTransfer.getData('text/plain');
        if (key) {
          addSlotActivity(kidId, dateStr, time, key);
          renderCalendarEditor(container, kidId);
        }
      });

      col.appendChild(cell);
    });

    grid.appendChild(col);
  }

  container.appendChild(grid);
}

// ---- Child view ----
function renderTodaySchedule(container, kidId) {
  container.innerHTML = '';
  const today = new Date();
  const entries = getTodayEntries(kidId);
  const date = todayStr();

  const heading = document.createElement('h3');
  heading.textContent = `今天是週${WEEKDAY_LABELS[today.getDay()]}（${today.getMonth() + 1}/${today.getDate()}）的作息`;
  container.appendChild(heading);

  if (entries.length === 0) {
    const empty = document.createElement('p');
    empty.className = 'empty-hint';
    empty.textContent = '今天沒有安排課表，好好休息！';
    container.appendChild(empty);
    return;
  }

  const list = document.createElement('div');
  list.className = 'today-list';
  entries
    .sort((a, b) => a.time.localeCompare(b.time))
    .forEach(({ time, activityKey, activity }) => {
      const row = document.createElement('div');
      const done = isDone(kidId, date, time, activityKey);
      row.className = `today-item${done ? ' done' : ''}`;
      row.innerHTML = `
        <span class="today-time">${time}</span>
        <span class="today-activity">${activity ? activity.icon : ''} ${activity ? activity.label : activityKey}</span>
        <span class="today-points">+${activity ? activity.points : 0}點</span>
      `;
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'checkoff-btn';
      btn.textContent = done ? '已完成 ✓' : '打卡';
      btn.disabled = done;
      btn.addEventListener('click', () => {
        checkOff(kidId, time, activityKey);
        renderTodaySchedule(container, kidId);
      });
      row.appendChild(btn);
      list.appendChild(row);
    });
  container.appendChild(list);
}

export { renderCalendarEditor, renderActivityManager, renderTodaySchedule, getActivity, timeSlotsForDate };
