import { load, save, uid, DEFAULT_REWARDS } from './storage.js';

let data = load();

function getData() {
  return data;
}

function persist() {
  save(data);
}

function replaceData(newData) {
  data = newData;
  persist();
}

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

const DAY_KEYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

function todayDayKey() {
  return DAY_KEYS[new Date().getDay()];
}

function isWeekend(dayKey) {
  return dayKey === 'sat' || dayKey === 'sun';
}

function getActiveKid() {
  return data.kids.find((k) => k.id === data.activeKidId) || null;
}

function addKid(name, avatar) {
  const kid = { id: uid('k'), name, avatar, points: 0 };
  data.kids.push(kid);
  data.dateSchedule[kid.id] = {};
  data.streaks[kid.id] = { current: 0, longest: 0, lastDate: null, awardedMilestones: [] };
  data.badges[kid.id] = [];
  data.wishlistGoal[kid.id] = null;
  data.rewards.push(
    ...DEFAULT_REWARDS.map((r) => ({ id: uid('r'), kidId: kid.id, ...r }))
  );
  data.activeKidId = kid.id;
  persist();
  return kid;
}

function setActiveKid(kidId) {
  data.activeKidId = kidId;
  persist();
}

function addPoints(kidId, delta, reason) {
  const kid = data.kids.find((k) => k.id === kidId);
  if (!kid) return;
  kid.points = Math.max(0, kid.points + delta);
  data.pointsLedger.push({ kidId, delta, reason, timestamp: new Date().toISOString() });
  persist();
}

export {
  getData,
  persist,
  replaceData,
  todayStr,
  todayDayKey,
  isWeekend,
  DAY_KEYS,
  getActiveKid,
  addKid,
  setActiveKid,
  addPoints,
  uid,
};
