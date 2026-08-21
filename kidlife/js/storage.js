const STORAGE_KEY = 'kidlife_data';

const DEFAULT_ACTIVITIES = [
  { key: 'zh', label: '學習中文', icon: '📖', points: 1, isCustom: false },
  { key: 'en', label: '學習英文', icon: '🔤', points: 1, isCustom: false },
  { key: 'read', label: '閱讀', icon: '📚', points: 1, isCustom: false },
  { key: 'tv', label: '看電視', icon: '📺', points: 1, isCustom: false },
  { key: 'sport', label: '運動', icon: '🏃', points: 1, isCustom: false },
  { key: 'game', label: '打電動', icon: '🎮', points: 1, isCustom: false },
  { key: 'bath', label: '洗澡', icon: '🛁', points: 1, isCustom: false },
  { key: 'meal', label: '吃飯', icon: '🍚', points: 1, isCustom: false },
  { key: 'toys', label: '收拾玩具', icon: '🧸', points: 1, isCustom: false },
  { key: 'bag', label: '收拾書包', icon: '🎒', points: 1, isCustom: false },
];

const DEFAULT_REWARDS = [
  { title: '看電視30分鐘', cost: 2, isCustom: false },
  { title: '玩遊戲30分鐘', cost: 2, isCustom: false },
  { title: '買禮物', cost: 100, isCustom: false },
];

function uid(prefix) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function defaultData() {
  return {
    version: 3,
    kids: [],
    activeKidId: null,
    routineTasks: [],
    routineLog: [],
    activityCatalog: DEFAULT_ACTIVITIES.map((a) => ({ ...a })),
    dateSchedule: {},
    scheduleLog: [],
    pointsLedger: [],
    rewards: [],
    redemptions: [],
    streaks: {},
    badges: {},
    wishlistGoal: {},
  };
}

function load() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    const data = defaultData();
    save(data);
    return data;
  }
  try {
    const parsed = JSON.parse(raw);
    const data = Object.assign(defaultData(), parsed);
    return data;
  } catch (e) {
    console.warn('KidLife: 資料損毀，重置為預設值', e);
    const data = defaultData();
    save(data);
    return data;
  }
}

function save(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function exportJSON(data) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const today = new Date().toISOString().slice(0, 10);
  a.href = url;
  a.download = `kidlife-backup-${today}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function importJSON(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result);
        if (typeof parsed !== 'object' || parsed === null || !Array.isArray(parsed.kids)) {
          throw new Error('檔案格式不正確');
        }
        const data = Object.assign(defaultData(), parsed);
        save(data);
        resolve(data);
      } catch (e) {
        reject(e);
      }
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file, 'utf-8');
  });
}

export { STORAGE_KEY, DEFAULT_ACTIVITIES, DEFAULT_REWARDS, uid, defaultData, load, save, exportJSON, importJSON };
