// Mario 共用玩家名單管理
const PLAYER_KEY = 'mario_players';
const DEFAULT_PLAYERS = ["爸爸", "媽媽", "張祐晨", "張祐安"];
function getPlayers() {
  let data = localStorage.getItem(PLAYER_KEY);
  if (!data) return [...DEFAULT_PLAYERS];
  try {
    const arr = JSON.parse(data);
    if (Array.isArray(arr) && arr.length > 0) return arr;
    return [...DEFAULT_PLAYERS];
  } catch { return [...DEFAULT_PLAYERS]; }
}
function savePlayers(list) {
  localStorage.setItem(PLAYER_KEY, JSON.stringify(list));
}
function renderPlayerSelect(targetId, onSave) {
  const area = document.getElementById(targetId);
  if (!area) return;
  const players = getPlayers();
  area.innerHTML = `
    <label for="player-select" style="font-size:1.1em;">請選擇玩家：</label>
    <select id="player-select" class="mario-btn" style="font-size:1.1em;">
      ${players.map(name => `<option value="${name}">${name}</option>`).join('')}
    </select>
    <button class="mario-btn" id="save-score-btn" style="margin-left:1em;">儲存分數</button>
    <button class="mario-btn" id="add-player-btn" style="margin-left:1em;">新增玩家</button>
    <button class="mario-btn" id="clear-player-btn" style="margin-left:1em;">清除全部</button>
  `;
  const btn = document.getElementById('save-score-btn');
  btn.onclick = function() {
    const player = document.getElementById('player-select').value;
    onSave(player);
    btn.disabled = true;
    btn.textContent = '已儲存';
  };
  // 新增玩家
  document.getElementById('add-player-btn').onclick = function() {
    let name = prompt('請輸入新玩家名稱：');
    if (!name) return;
    name = name.trim();
    if (!name) return;
    let list = getPlayers();
    if (!list.includes(name)) {
      list.push(name);
      savePlayers(list);
      renderPlayerSelect(targetId, onSave);
    } else {
      alert('玩家已存在！');
    }
  };
  // 清除全部玩家
  document.getElementById('clear-player-btn').onclick = function() {
    if (confirm('確定要清除所有玩家？（將恢復預設）')) {
      savePlayers([...DEFAULT_PLAYERS]);
      renderPlayerSelect(targetId, onSave);
    }
  };
}
