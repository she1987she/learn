import { getData, persist, uid, todayStr, addPoints } from './state.js';
import { recordCompletion } from './achievements.js';

function addTask(kidId, title, points) {
  const data = getData();
  data.routineTasks.push({ id: uid('t'), kidId, title, points: Number(points) || 1 });
  persist();
}

function removeTask(taskId) {
  const data = getData();
  data.routineTasks = data.routineTasks.filter((t) => t.id !== taskId);
  persist();
}

function updateTask(taskId, { title, points }) {
  const data = getData();
  const task = data.routineTasks.find((t) => t.id === taskId);
  if (!task) return;
  task.title = title;
  task.points = Number(points) || 0;
  persist();
}

function isTaskDone(kidId, taskId, date) {
  return getData().routineLog.some((l) => l.kidId === kidId && l.taskId === taskId && l.date === date && l.done);
}

function completeTask(kidId, taskId) {
  const data = getData();
  const date = todayStr();
  if (isTaskDone(kidId, taskId, date)) return false;
  const task = data.routineTasks.find((t) => t.id === taskId);
  if (!task) return false;
  data.routineLog.push({ kidId, taskId, date, done: true });
  persist();
  addPoints(kidId, task.points, `完成任務：${task.title}`);
  recordCompletion(kidId);
  return true;
}

function renderTaskEditor(container, kidId) {
  container.innerHTML = '';
  const data = getData();
  const list = document.createElement('div');
  list.className = 'task-editor-list';
  data.routineTasks.filter((t) => t.kidId === kidId).forEach((task) => {
    const row = document.createElement('div');
    row.className = 'task-editor-row';
    row.innerHTML = `<span>${task.title}（+${task.points}點）</span>`;

    const btnGroup = document.createElement('span');
    const editBtn = document.createElement('button');
    editBtn.type = 'button';
    editBtn.textContent = '編輯';
    editBtn.addEventListener('click', () => {
      row.innerHTML = `
        <input type="text" class="edit-task-title" value="${task.title}" />
        <input type="number" class="edit-task-points" value="${task.points}" />
      `;
      const saveBtn = document.createElement('button');
      saveBtn.type = 'button';
      saveBtn.textContent = '儲存';
      saveBtn.addEventListener('click', () => {
        const title = row.querySelector('.edit-task-title').value.trim();
        const points = row.querySelector('.edit-task-points').value;
        if (!title) return;
        updateTask(task.id, { title, points });
        renderTaskEditor(container, kidId);
      });
      const cancelBtn = document.createElement('button');
      cancelBtn.type = 'button';
      cancelBtn.textContent = '取消';
      cancelBtn.addEventListener('click', () => renderTaskEditor(container, kidId));
      row.appendChild(saveBtn);
      row.appendChild(cancelBtn);
    });
    btnGroup.appendChild(editBtn);

    const del = document.createElement('button');
    del.type = 'button';
    del.textContent = '刪除';
    del.addEventListener('click', () => {
      removeTask(task.id);
      renderTaskEditor(container, kidId);
    });
    btnGroup.appendChild(del);

    row.appendChild(btnGroup);
    list.appendChild(row);
  });
  container.appendChild(list);

  const form = document.createElement('div');
  form.className = 'add-task-form';
  form.innerHTML = `
    <input type="text" class="new-task-title" placeholder="任務名稱" />
    <input type="number" class="new-task-points" placeholder="點數" value="1" />
    <button type="button" class="new-task-btn">新增任務</button>
  `;
  form.querySelector('.new-task-btn').addEventListener('click', () => {
    const title = form.querySelector('.new-task-title').value.trim();
    const points = form.querySelector('.new-task-points').value;
    if (!title) return;
    addTask(kidId, title, points);
    renderTaskEditor(container, kidId);
  });
  container.appendChild(form);
}

function renderTodayTasks(container, kidId) {
  container.innerHTML = '';
  const data = getData();
  const date = todayStr();
  const tasks = data.routineTasks.filter((t) => t.kidId === kidId);

  if (tasks.length === 0) {
    const empty = document.createElement('p');
    empty.className = 'empty-hint';
    empty.textContent = '還沒有設定每日任務，請家長到設定頁新增。';
    container.appendChild(empty);
    return;
  }

  tasks.forEach((task) => {
    const done = isTaskDone(kidId, task.id, date);
    const row = document.createElement('div');
    row.className = `today-item${done ? ' done' : ''}`;
    row.innerHTML = `<span class="today-activity">${task.title}</span><span class="today-points">+${task.points}點</span>`;
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'checkoff-btn';
    btn.textContent = done ? '已完成 ✓' : '打卡';
    btn.disabled = done;
    btn.addEventListener('click', () => {
      completeTask(kidId, task.id);
      renderTodayTasks(container, kidId);
    });
    row.appendChild(btn);
    container.appendChild(row);
  });
}

export { addTask, removeTask, updateTask, completeTask, renderTaskEditor, renderTodayTasks };
