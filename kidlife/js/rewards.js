import { getData, persist, uid, addPoints } from './state.js';
import { checkAndUnlockBadges } from './achievements.js';

function addReward(kidId, title, cost) {
  const data = getData();
  data.rewards.push({ id: uid('r'), kidId, title, cost: Number(cost) || 2, isCustom: true });
  persist();
}

function removeReward(rewardId) {
  const data = getData();
  data.rewards = data.rewards.filter((r) => r.id !== rewardId);
  persist();
}

function updateReward(rewardId, { title, cost }) {
  const data = getData();
  const reward = data.rewards.find((r) => r.id === rewardId);
  if (!reward) return;
  reward.title = title;
  reward.cost = Number(cost) || 0;
  persist();
}

function redeem(kidId, rewardId) {
  const data = getData();
  const kid = data.kids.find((k) => k.id === kidId);
  const reward = data.rewards.find((r) => r.id === rewardId);
  if (!kid || !reward) return { ok: false, message: '找不到獎勵' };
  if (kid.points < reward.cost) return { ok: false, message: '點數不夠喔，再加油！' };
  kid.points -= reward.cost;
  data.redemptions.push({
    kidId,
    rewardId,
    title: reward.title,
    cost: reward.cost,
    timestamp: new Date().toISOString(),
    confirmedByParent: true,
  });
  persist();
  checkAndUnlockBadges(kidId);
  return { ok: true, message: `兌換成功：${reward.title}` };
}

function renderRewardEditor(container, kidId) {
  container.innerHTML = '';
  const data = getData();
  const list = document.createElement('div');
  list.className = 'reward-editor-list';
  data.rewards.filter((r) => r.kidId === kidId).forEach((reward) => {
    const row = document.createElement('div');
    row.className = 'task-editor-row';
    row.innerHTML = `<span>${reward.title}（${reward.cost}點）${reward.isCustom ? '' : '<em>預設</em>'}</span>`;

    const btnGroup = document.createElement('span');
    const editBtn = document.createElement('button');
    editBtn.type = 'button';
    editBtn.textContent = '編輯';
    editBtn.addEventListener('click', () => {
      row.innerHTML = `
        <input type="text" class="edit-reward-title" value="${reward.title}" />
        <input type="number" class="edit-reward-cost" value="${reward.cost}" />
      `;
      const saveBtn = document.createElement('button');
      saveBtn.type = 'button';
      saveBtn.textContent = '儲存';
      saveBtn.addEventListener('click', () => {
        const title = row.querySelector('.edit-reward-title').value.trim();
        const cost = row.querySelector('.edit-reward-cost').value;
        if (!title) return;
        updateReward(reward.id, { title, cost });
        renderRewardEditor(container, kidId);
      });
      const cancelBtn = document.createElement('button');
      cancelBtn.type = 'button';
      cancelBtn.textContent = '取消';
      cancelBtn.addEventListener('click', () => renderRewardEditor(container, kidId));
      row.appendChild(saveBtn);
      row.appendChild(cancelBtn);
    });
    btnGroup.appendChild(editBtn);

    const del = document.createElement('button');
    del.type = 'button';
    del.textContent = '刪除';
    del.addEventListener('click', () => {
      removeReward(reward.id);
      renderRewardEditor(container, kidId);
    });
    btnGroup.appendChild(del);

    row.appendChild(btnGroup);
    list.appendChild(row);
  });
  container.appendChild(list);

  const form = document.createElement('div');
  form.className = 'add-task-form';
  form.innerHTML = `
    <input type="text" class="new-reward-title" placeholder="獎勵名稱" />
    <input type="number" class="new-reward-cost" placeholder="所需點數" value="2" />
    <button type="button" class="new-reward-btn">新增獎勵</button>
  `;
  form.querySelector('.new-reward-btn').addEventListener('click', () => {
    const title = form.querySelector('.new-reward-title').value.trim();
    const cost = form.querySelector('.new-reward-cost').value;
    if (!title) return;
    addReward(kidId, title, cost);
    renderRewardEditor(container, kidId);
  });
  container.appendChild(form);
}

function setWishlistGoal(kidId, rewardId) {
  const data = getData();
  data.wishlistGoal[kidId] = rewardId || null;
  persist();
}

function renderWishlistGoal(container, kidId) {
  container.innerHTML = '';
  const data = getData();
  const kid = data.kids.find((k) => k.id === kidId);
  const rewards = data.rewards.filter((r) => r.kidId === kidId);
  const goalId = data.wishlistGoal[kidId];
  const goal = rewards.find((r) => r.id === goalId);

  const box = document.createElement('div');
  box.className = 'wishlist-box';

  const select = document.createElement('select');
  select.className = 'wishlist-select';
  select.innerHTML = '<option value="">— 選擇願望目標 —</option>' +
    rewards.map((r) => `<option value="${r.id}" ${r.id === goalId ? 'selected' : ''}>${r.title}（${r.cost}點）</option>`).join('');
  select.addEventListener('change', () => {
    setWishlistGoal(kidId, select.value);
    renderWishlistGoal(container, kidId);
  });
  box.appendChild(select);

  if (goal) {
    const percent = Math.min(100, Math.round(((kid ? kid.points : 0) / goal.cost) * 100));
    const progressWrap = document.createElement('div');
    progressWrap.className = 'wishlist-progress-wrap';
    progressWrap.innerHTML = `
      <div class="wishlist-label">🎯 目標：${goal.title}（${kid ? kid.points : 0} / ${goal.cost} 點）</div>
      <div class="hp-bar-track wishlist-track"><div class="hp-bar-fill" style="width:${percent}%"></div></div>
      ${percent >= 100 ? '<div class="wishlist-ready">🎉 點數已足夠，可以去兌換囉！</div>' : ''}
    `;
    box.appendChild(progressWrap);
  }
  container.appendChild(box);
}

function renderRewardShop(container, kidId) {
  container.innerHTML = '';
  const data = getData();
  const kid = data.kids.find((k) => k.id === kidId);

  const wishlistInner = document.createElement('div');
  container.appendChild(wishlistInner);
  renderWishlistGoal(wishlistInner, kidId);

  const pointsBar = document.createElement('div');
  pointsBar.className = 'points-bar';
  pointsBar.textContent = `目前點數：${kid ? kid.points : 0} 點`;
  container.appendChild(pointsBar);

  const rewards = data.rewards.filter((r) => r.kidId === kidId);
  if (rewards.length === 0) {
    const empty = document.createElement('p');
    empty.className = 'empty-hint';
    empty.textContent = '還沒有獎勵，請家長到設定頁新增。';
    container.appendChild(empty);
    return;
  }

  const grid = document.createElement('div');
  grid.className = 'reward-grid';
  rewards.forEach((reward) => {
    const card = document.createElement('div');
    card.className = 'reward-card';
    card.innerHTML = `<h4>${reward.title}</h4><p>${reward.cost} 點</p>`;
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = '兌換';
    btn.addEventListener('click', () => {
      openConfirmModal(reward, () => {
        const result = redeem(kidId, reward.id);
        alert(result.message);
        renderRewardShop(container, kidId);
      });
    });
    card.appendChild(btn);
    grid.appendChild(card);
  });
  container.appendChild(grid);
}

function openConfirmModal(reward, onConfirm) {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  const a = Math.floor(Math.random() * 8) + 2;
  const b = Math.floor(Math.random() * 8) + 2;
  overlay.innerHTML = `
    <div class="modal-box">
      <h3>家長確認兌換</h3>
      <p>小朋友想兌換「${reward.title}」（${reward.cost}點）</p>
      <p>請家長計算並輸入答案以確認：${a} + ${b} = ?</p>
      <input type="number" class="confirm-input" />
      <div class="modal-actions">
        <button type="button" class="confirm-btn">確認兌換</button>
        <button type="button" class="cancel-btn">取消</button>
      </div>
    </div>
  `;
  overlay.querySelector('.cancel-btn').addEventListener('click', () => overlay.remove());
  overlay.querySelector('.confirm-btn').addEventListener('click', () => {
    const val = Number(overlay.querySelector('.confirm-input').value);
    if (val === a + b) {
      overlay.remove();
      onConfirm();
    } else {
      alert('答案不正確，請家長再確認一次');
    }
  });
  document.body.appendChild(overlay);
}

function renderPointsAdjuster(container, kidId) {
  container.innerHTML = '';
  const form = document.createElement('div');
  form.className = 'add-task-form points-adjust-form';
  form.innerHTML = `
    <input type="number" class="adjust-delta" placeholder="點數(可正可負)" />
    <input type="text" class="adjust-reason" placeholder="原因" />
    <button type="button" class="adjust-btn">套用</button>
  `;
  form.querySelector('.adjust-btn').addEventListener('click', () => {
    const delta = Number(form.querySelector('.adjust-delta').value);
    const reason = form.querySelector('.adjust-reason').value.trim() || '家長手動調整';
    if (!delta) return;
    addPoints(kidId, delta, `家長手動調整：${reason}`);
    form.querySelector('.adjust-delta').value = '';
    form.querySelector('.adjust-reason').value = '';
    alert(`已${delta > 0 ? '增加' : '減少'} ${Math.abs(delta)} 點`);
  });
  container.appendChild(form);
}

function renderRedemptionHistory(container, kidId) {
  container.innerHTML = '';
  const data = getData();
  const history = data.redemptions
    .filter((r) => r.kidId === kidId)
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  if (history.length === 0) {
    const empty = document.createElement('p');
    empty.className = 'empty-hint';
    empty.textContent = '還沒有兌換紀錄。';
    container.appendChild(empty);
    return;
  }

  const list = document.createElement('div');
  list.className = 'history-list';
  history.forEach((r) => {
    const row = document.createElement('div');
    row.className = 'history-row';
    const dt = new Date(r.timestamp);
    const dateLabel = `${dt.getFullYear()}/${dt.getMonth() + 1}/${dt.getDate()} ${String(dt.getHours()).padStart(2, '0')}:${String(dt.getMinutes()).padStart(2, '0')}`;
    row.innerHTML = `
      <span class="history-date">${dateLabel}</span>
      <span class="history-title">${r.title || '（獎勵已刪除）'}</span>
      <span class="history-cost">-${r.cost}點</span>
    `;
    list.appendChild(row);
  });
  container.appendChild(list);
}

export {
  addReward,
  removeReward,
  updateReward,
  redeem,
  renderRewardEditor,
  renderRewardShop,
  renderPointsAdjuster,
  renderRedemptionHistory,
  setWishlistGoal,
  renderWishlistGoal,
};
