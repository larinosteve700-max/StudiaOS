/* ==============================
   STUDIAOS — Application Logic
   ============================== */

/* ===== STORAGE MANAGER ===== */
const Store = {
  prefix: 'studiaos_',
  get(key, def) {
    try {
      const d = localStorage.getItem(this.prefix + key);
      return d ? JSON.parse(d) : def;
    } catch { return def; }
  },
  set(key, data) {
    localStorage.setItem(this.prefix + key, JSON.stringify(data));
  },
  remove(key) {
    localStorage.removeItem(this.prefix + key);
  },
  getAll() {
    const o = {};
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(this.prefix)) {
        try { o[k.slice(this.prefix.length)] = JSON.parse(localStorage.getItem(k)); }
        catch { o[k.slice(this.prefix.length)] = localStorage.getItem(k); }
      }
    }
    return o;
  },
  exportJSON() {
    return JSON.stringify(this.getAll(), null, 2);
  },
  importJSON(json) {
    try {
      const data = JSON.parse(json);
      for (const [k, v] of Object.entries(data)) {
        this.set(k, v);
      }
      return true;
    } catch { return false; }
  },
  createBackup() {
    const data = this.getAll();
    data._backupDate = new Date().toISOString();
    data._version = '1.0';
    return data;
  },
  restoreBackup(backup) {
    try {
      for (const k of Object.keys(this.getAll())) {
        this.remove(k);
      }
      for (const [k, v] of Object.entries(backup)) {
        if (!k.startsWith('_')) this.set(k, v);
      }
      return true;
    } catch { return false; }
  },
  clearAll() {
    const keys = Object.keys(localStorage);
    for (const k of keys) {
      if (k.startsWith(this.prefix)) localStorage.removeItem(k);
    }
  },
  getSize() {
    let total = 0;
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(this.prefix)) {
        total += (localStorage.getItem(k) || '').length * 2;
      }
    }
    return total;
  },
  getSizeMB() {
    return (this.getSize() / (1024 * 1024)).toFixed(2);
  }
};

/* ===== TOAST SYSTEM ===== */
const Toast = {
  show(msg, type = 'info', duration = 3000) {
    const c = document.getElementById('toastContainer');
    const icons = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };
    const t = document.createElement('div');
    t.className = `toast toast-${type}`;
    t.innerHTML = `<span class="toast-icon">${icons[type] || 'ℹ️'}</span><span>${msg}</span>`;
    c.appendChild(t);
    setTimeout(() => { t.style.opacity = '0'; t.style.transform = 'translateX(100px)'; t.style.transition = '0.3s'; setTimeout(() => t.remove(), 300); }, duration);
  },
  success(msg) { this.show(msg, 'success'); },
  error(msg) { this.show(msg, 'error', 5000); },
  warning(msg) { this.show(msg, 'warning', 4000); },
  info(msg) { this.show(msg, 'info'); }
};

/* ===== MODAL HELPER ===== */
const Modal = {
  show({ title, body, footer }) {
    const overlay = document.getElementById('modalOverlay');
    document.getElementById('modalTitle').textContent = title || '';
    document.getElementById('modalBody').innerHTML = body || '';
    const f = document.getElementById('modalFooter');
    f.innerHTML = footer || '<button class="btn btn-ghost" onclick="Modal.close()">Close</button>';
    overlay.classList.remove('hidden');
  },
  close() {
    document.getElementById('modalOverlay').classList.add('hidden');
  },
  confirm(title, msg) {
    return new Promise(resolve => {
      this.show({
        title,
        body: `<p style="color:var(--text-secondary);line-height:1.6">${msg}</p>`,
        footer: `
          <button class="btn btn-ghost" onclick="Modal.close()">Cancel</button>
          <button class="btn btn-danger" id="confirmBtn">Confirm</button>
        `
      });
      document.getElementById('confirmBtn').onclick = () => { this.close(); resolve(true); };
      document.querySelector('#modalOverlay .modal-close').onclick = () => { this.close(); resolve(false); };
    });
  }
};
document.getElementById('modalClose').onclick = () => Modal.close();
document.getElementById('modalOverlay').onclick = (e) => { if (e.target === e.currentTarget) Modal.close(); };

/* ===== NOTIFICATIONS ===== */
const Notify = {
  async requestPermission() {
    if (!('Notification' in window)) return false;
    if (Notification.permission === 'granted') return true;
    if (Notification.permission === 'denied') return false;
    const p = await Notification.requestPermission();
    return p === 'granted';
  },
  send(title, opts = {}) {
    if (!('Notification' in window)) return;
    if (Notification.permission === 'granted') {
      new Notification(title, { icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">🎓</text></svg>', ...opts });
    }
  }
};

/* ===== UTILITY HELPERS ===== */
function formatDate(date) {
  const d = new Date(date);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}
function formatTime(date) {
  return new Date(date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}
function today() { return new Date().toISOString().split('T')[0]; }
function isToday(d) { return new Date(d).toISOString().split('T')[0] === today(); }
function daysBetween(a, b) {
  return Math.ceil((new Date(b) - new Date(a)) / (1000 * 60 * 60 * 24));
}
function getWeekDates() {
  const dates = [];
  const now = new Date();
  const day = now.getDay();
  const start = new Date(now);
  start.setDate(now.getDate() - day);
  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    dates.push(d.toISOString().split('T')[0]);
  }
  return dates;
}
function getMonthDates(year, month) {
  const dates = [];
  const days = new Date(year, month + 1, 0).getDate();
  for (let i = 1; i <= days; i++) {
    const d = new Date(year, month, i);
    dates.push(d.toISOString().split('T')[0]);
  }
  return dates;
}

/* ===== QUOTES ===== */
const QUOTES = [
  { text: "The secret of getting ahead is getting started.", author: "Mark Twain" },
  { text: "Don't let yesterday take up too much of today.", author: "Will Rogers" },
  { text: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
  { text: "Success is not final, failure is not fatal: it is the courage to continue that counts.", author: "Winston Churchill" },
  { text: "Believe you can and you're halfway there.", author: "Theodore Roosevelt" },
  { text: "It does not matter how slowly you go as long as you do not stop.", author: "Confucius" },
  { text: "The future belongs to those who believe in the beauty of their dreams.", author: "Eleanor Roosevelt" },
  { text: "Your limitation—it's only your imagination.", author: "Unknown" },
  { text: "Push yourself, because no one else is going to do it for you.", author: "Unknown" },
  { text: "Great things never come from comfort zones.", author: "Unknown" },
  { text: "Dream it. Wish it. Do it.", author: "Unknown" },
  { text: "Stay hungry, stay foolish.", author: "Steve Jobs" },
  { text: "Education is the most powerful weapon which you can use to change the world.", author: "Nelson Mandela" },
  { text: "The beautiful thing about learning is that nobody can take it away from you.", author: "B.B. King" },
  { text: "The mind is not a vessel to be filled, but a fire to be kindled.", author: "Plutarch" },
  { text: "Study hard what interests you the most in the most undisciplined, irreverent and original manner possible.", author: "Richard Feynman" },
  { text: "Success is the sum of small efforts, repeated day in and day out.", author: "Robert Collier" },
  { text: "You don't have to be great to start, but you have to start to be great.", author: "Zig Ziglar" }
];

/* ===== ACHIEVEMENTS ===== */
const Achievements = {
  list: [
    { id: 'first_task', name: 'First Task', desc: 'Complete your first task', icon: '📝', check: s => s.tasksDone >= 1 },
    { id: 'task_10', name: 'Task Master', desc: 'Complete 10 tasks', icon: '📋', check: s => s.tasksDone >= 10 },
    { id: 'habit_7', name: 'Habit Builder', desc: '7-day habit streak', icon: '🔥', check: s => s.longestStreak >= 7 },
    { id: 'habit_30', name: 'Habit Legend', desc: '30-day habit streak', icon: '💪', check: s => s.longestStreak >= 30 },
    { id: 'focus_10', name: 'Focus Seeker', desc: 'Complete 10 focus sessions', icon: '⏱️', check: s => s.focusSessions >= 10 },
    { id: 'focus_50', name: 'Focus Machine', desc: 'Complete 50 focus sessions', icon: '⚡', check: s => s.focusSessions >= 50 },
    { id: 'goal_1', name: 'First Goal', desc: 'Complete your first goal', icon: '🎯', check: s => s.goalsDone >= 1 },
    { id: 'goal_5', name: 'Goal Crusher', desc: 'Complete 5 goals', icon: '🏆', check: s => s.goalsDone >= 5 },
    { id: 'note_5', name: 'Note Taker', desc: 'Create 5 notes', icon: '📖', check: s => s.notesCreated >= 5 },
    { id: 'score_80', name: 'Productivity Pro', desc: 'Reach productivity score of 80', icon: '💎', check: s => s.score >= 80 },
    { id: 'score_90', name: 'Productivity Master', desc: 'Reach productivity score of 90', icon: '👑', check: s => s.score >= 90 },
    { id: 'budget_first', name: 'Budgeter', desc: 'Track your first expense', icon: '💰', check: s => s.expensesTracked >= 1 },
  ],
  getUnlocked() {
    return Store.get('achievements', []);
  },
  checkAll(stats) {
    const unlocked = this.getUnlocked();
    let newBadges = [];
    for (const a of this.list) {
      if (!unlocked.includes(a.id) && a.check(stats)) {
        unlocked.push(a.id);
        newBadges.push(a);
      }
    }
    if (newBadges.length) {
      Store.set('achievements', unlocked);
      newBadges.forEach(b => Toast.success(`Achievement unlocked: ${b.name}! ${b.icon}`));
    }
    return newBadges;
  }
};

/* ===== DAILY CHALLENGES ===== */
const Challenges = {
  pool: [
    { name: 'Task Trio', desc: 'Complete 3 tasks today', icon: '📋', check: s => s.todayTasks >= 3, xp: 20 },
    { name: 'Focus Hour', desc: 'Focus for 60 minutes today', icon: '⏱️', check: s => s.todayFocus >= 60, xp: 25 },
    { name: 'Habit Hero', desc: 'Complete all your habits today', icon: '✅', check: s => s.allHabitsDone, xp: 15 },
    { name: 'Note Master', desc: 'Write a note today', icon: '📝', check: s => s.todayNotes >= 1, xp: 10 },
    { name: 'Goal Getter', desc: 'Update goal progress today', icon: '🎯', check: s => s.todayGoalUpdates >= 1, xp: 15 },
    { name: 'Budget Check', desc: 'Log a transaction today', icon: '💰', check: s => s.todayTransactions >= 1, xp: 10 },
    { name: 'Five Tasks', desc: 'Complete 5 tasks today', icon: '📋', check: s => s.todayTasks >= 5, xp: 30 },
    { name: 'Double Focus', desc: 'Complete 2 focus sessions today', icon: '⚡', check: s => s.todayFocusSessions >= 2, xp: 20 },
  ],
  getDaily() {
    let challenge = Store.get('dailyChallenge');
    const todayStr = today();
    if (!challenge || challenge.date !== todayStr) {
      const idx = Math.floor(Math.random() * this.pool.length);
      challenge = { date: todayStr, idx, done: false };
      Store.set('dailyChallenge', challenge);
    }
    return { ...this.pool[challenge.idx], done: challenge.done };
  },
  markDone() {
    const c = Store.get('dailyChallenge');
    if (c && !c.done) {
      c.done = true;
      Store.set('dailyChallenge', c);
      const ch = this.pool[c.idx];
      Toast.success(`Daily challenge complete! +${ch.xp} XP ${ch.icon}`);
      const xp = parseInt(Store.get('xp', 0)) + ch.xp;
      Store.set('xp', xp);
    }
  },
  check(stats) {
    const c = Store.get('dailyChallenge');
    if (!c || c.done) return;
    const ch = this.pool[c.idx];
    if (ch.check(stats)) this.markDone();
  }
};

/* ===== RECOMMENDATIONS ===== */
const Recommendations = {
  get() {
    const tips = [];
    const tasks = Store.get('tasks', []);
    const habits = Store.get('habits', []);
    const todayHabits = Store.get('habitLog', {});
    const pomodoro = Store.get('pomodoro', { sessions: 0 });
    const budget = Store.get('transactions', []);
    const goals = Store.get('goals', []);

    const overdue = tasks.filter(t => !t.completed && t.deadline && new Date(t.deadline) < new Date());
    const due = tasks.filter(t => !t.completed && t.deadline && isToday(t.deadline));
    const todayDate = today();

    if (overdue.length) tips.push({ icon: '⚠️', text: `You have ${overdue.length} overdue task${overdue.length > 1 ? 's' : ''}. Complete them first!` });
    if (due.length) tips.push({ icon: '📅', text: `${due.length} task${due.length > 1 ? 's are' : ' is'} due today!` });
    if (pomodoro.sessions < 2) tips.push({ icon: '⏱️', text: 'Schedule a Pomodoro session to boost focus.' });
    if (habits.length) {
      const unchecked = habits.filter(h => !todayHabits[todayDate] || !todayHabits[todayDate].includes(h.id));
      if (unchecked.length) tips.push({ icon: '✅', text: `${unchecked.length} habit${unchecked.length > 1 ? 's' : ''} not checked today.` });
    }
    if (goals.length) {
      const active = goals.filter(g => g.progress < 100);
      if (active.length) tips.push({ icon: '🎯', text: `Make progress on ${active.length} active goal${active.length > 1 ? 's' : ''}.` });
    }
    if (budget.length > 0) {
      const thisMonth = budget.filter(t => t.date && t.date.startsWith(todayDate.slice(0, 7)));
      const expenses = thisMonth.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
      const income = thisMonth.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
      if (expenses > income * 0.8 && income > 0) tips.push({ icon: '💰', text: 'You\'ve spent over 80% of your income. Review expenses.' });
    }
    if (tips.length === 0) tips.push({ icon: '🎉', text: 'You\'re on track! Keep up the great work.' });

    return tips.slice(0, 4);
  }
};

/* =====================
   CANVAS CHART HELPERS
   ===================== */
const Charts = {
  bar(canvas, data, { label, color = '#6366f1', bg = 'rgba(99,102,241,0.2)' } = {}) {
    if (!canvas || !data.length) return;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
    const w = rect.width, h = rect.height;
    ctx.clearRect(0, 0, w, h);
    const pad = { top: 10, bottom: 20, left: 10, right: 10 };
    const chartW = w - pad.left - pad.right;
    const chartH = h - pad.top - pad.bottom;
    const max = Math.max(...data.map(d => d.value), 1);
    const barW = Math.min(chartW / data.length * 0.7, 40);
    const gap = chartW / data.length;

    data.forEach((d, i) => {
      const x = pad.left + i * gap + (gap - barW) / 2;
      const barH = (d.value / max) * chartH;
      const y = pad.top + chartH - barH;
      ctx.fillStyle = d.color || color;
      ctx.beginPath();
      ctx.roundRect(x, y, barW, barH, [4, 4, 0, 0]);
      ctx.fill();
      ctx.fillStyle = getComputedStyle(document.body).getPropertyValue('--text-muted').trim() || '#94a3b8';
      ctx.font = '9px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(d.label || '', x + barW / 2, h - pad.bottom + 14);
    });
  },

  line(canvas, data, { color = '#6366f1', fill = true } = {}) {
    if (!canvas || !data.length) return;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
    const w = rect.width, h = rect.height;
    ctx.clearRect(0, 0, w, h);
    const pad = { top: 10, bottom: 20, left: 10, right: 10 };
    const chartW = w - pad.left - pad.right;
    const chartH = h - pad.top - pad.bottom;
    const max = Math.max(...data.map(d => d.value), 1);
    const stepX = chartW / Math.max(data.length - 1, 1);

    ctx.beginPath();
    data.forEach((d, i) => {
      const x = pad.left + i * stepX;
      const y = pad.top + chartH - (d.value / max) * chartH;
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    });
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.stroke();

    if (fill) {
      const last = data.length - 1;
      ctx.lineTo(pad.left + last * stepX, pad.top + chartH);
      ctx.lineTo(pad.left, pad.top + chartH);
      ctx.closePath();
      const grad = ctx.createLinearGradient(0, pad.top, 0, pad.top + chartH);
      grad.addColorStop(0, color + '40');
      grad.addColorStop(1, color + '05');
      ctx.fillStyle = grad;
      ctx.fill();
    }

    data.forEach((d, i) => {
      const x = pad.left + i * stepX;
      const y = pad.top + chartH - (d.value / max) * chartH;
      ctx.beginPath();
      ctx.arc(x, y, 3, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
      ctx.fillStyle = getComputedStyle(document.body).getPropertyValue('--text-muted').trim() || '#94a3b8';
      ctx.font = '9px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(d.label || '', x, h - pad.bottom + 14);
    });
  },

  donut(canvas, data) {
    if (!canvas || !data.length) return;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
    const w = rect.width, h = rect.height;
    ctx.clearRect(0, 0, w, h);
    const cx = w / 2, cy = h / 2;
    const r = Math.min(cx, cy) - 10;
    const total = data.reduce((s, d) => s + d.value, 0) || 1;
    let start = -Math.PI / 2;

    data.forEach(d => {
      const angle = (d.value / total) * Math.PI * 2;
      ctx.beginPath();
      ctx.arc(cx, cy, r, start, start + angle);
      ctx.arc(cx, cy, r * 0.6, start + angle, start, true);
      ctx.closePath();
      ctx.fillStyle = d.color || '#6366f1';
      ctx.fill();
      start += angle;
    });

    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.6, 0, Math.PI * 2);
    ctx.fillStyle = getComputedStyle(document.body).getPropertyValue('--surface').trim() || '#fff';
    ctx.fill();
  },

  initRoundRect() {
    if (!CanvasRenderingContext2D.prototype.roundRect) {
      CanvasRenderingContext2D.prototype.roundRect = function (x, y, w, h, radii) {
        const r = Array.isArray(radii) ? radii : [radii, radii, radii, radii];
        const [tl, tr, br, bl] = r.map(v => Math.min(v || 0, Math.min(w, h) / 2));
        this.moveTo(x + tl, y);
        this.lineTo(x + w - tr, y);
        this.quadraticCurveTo(x + w, y, x + w, y + tr);
        this.lineTo(x + w, y + h - br);
        this.quadraticCurveTo(x + w, y + h, x + w - br, y + h);
        this.lineTo(x + bl, y + h);
        this.quadraticCurveTo(x, y + h, x, y + h - bl);
        this.lineTo(x, y + tl);
        this.quadraticCurveTo(x, y, x + tl, y);
        this.closePath();
      };
    }
  }
};
Charts.initRoundRect();

/* =====================
   DASHBOARD MODULE
   ===================== */
const Dashboard = {
  init() {
    this.render();
    this.startClock();
  },
  render() {
    const el = document.getElementById('appContent');
    const tasks = Store.get('tasks', []);
    const goals = Store.get('goals', []);
    const habits = Store.get('habits', []);
    const habitLog = Store.get('habitLog', {});
    const pomodoro = Store.get('pomodoro', { sessions: 0, totalMinutes: 0 });
    const transactions = Store.get('transactions', []);
    const todayStr = today();

    const totalTasks = tasks.length;
    const doneTasks = tasks.filter(t => t.completed).length;
    const todayTaskCount = tasks.filter(t => t.completed && t.completedDate === todayStr).length;

    const activeGoals = goals.filter(g => g.progress < 100).length;
    const doneGoals = goals.filter(g => g.progress >= 100).length;

    let longestStreak = 0;
    for (const h of habits) {
      const log = habitLog[h.id] || {};
      let streak = 0;
      for (let i = 0; i < 365; i++) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const ds = d.toISOString().split('T')[0];
        if (log[ds]) streak++;
        else break;
      }
      if (streak > longestStreak) longestStreak = streak;
    }

    const allHabitsDone = habits.length > 0 && habits.every(h => habitLog[h.id] && habitLog[h.id][todayStr]);

    const score = this.calcScore({ doneTasks, totalTasks, pomodoro, longestStreak, activeGoals, doneGoals, allHabitsDone });
    const quote = QUOTES[Math.floor(Math.random() * QUOTES.length)];
    const xp = Store.get('xp', 0);
    const challenge = Challenges.getDaily();
    const tips = Recommendations.get();

    const thisMonthExpenses = transactions.filter(t => t.date && t.date.startsWith(todayStr.slice(0, 7)) && t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    const thisMonthIncome = transactions.filter(t => t.date && t.date.startsWith(todayStr.slice(0, 7)) && t.type === 'income').reduce((s, t) => s + t.amount, 0);

    el.innerHTML = `
      <div class="dashboard-grid">
        <div class="dashboard-card dashboard-welcome">
          <div class="dashboard-card-header">
            <span class="dashboard-card-title">Welcome Back</span>
            <span class="dashboard-card-icon">🎓</span>
          </div>
          <div class="dashboard-card-value" id="liveClock"></div>
          <div class="dashboard-card-sub" id="liveDate"></div>
        </div>
        <div class="dashboard-card">
          <div class="dashboard-card-header">
            <span class="dashboard-card-title">Tasks</span>
            <span class="dashboard-card-icon">📋</span>
          </div>
          <div class="dashboard-card-value">${doneTasks}/${totalTasks}</div>
          <div class="dashboard-card-sub">${totalTasks ? Math.round(doneTasks/totalTasks*100) : 0}% completion</div>
          <div class="progress-bar"><div class="progress-bar-fill" style="width:${totalTasks ? doneTasks/totalTasks*100 : 0}%"></div></div>
        </div>
        <div class="dashboard-card">
          <div class="dashboard-card-header">
            <span class="dashboard-card-title">Goals</span>
            <span class="dashboard-card-icon">🎯</span>
          </div>
          <div class="dashboard-card-value">${doneGoals}</div>
          <div class="dashboard-card-sub">${activeGoals} active, ${doneGoals} done</div>
        </div>
        <div class="dashboard-card">
          <div class="dashboard-card-header">
            <span class="dashboard-card-title">Habit Streak</span>
            <span class="dashboard-card-icon">🔥</span>
          </div>
          <div class="dashboard-card-value">${longestStreak}</div>
          <div class="dashboard-card-sub">day${longestStreak !== 1 ? 's' : ''} longest streak</div>
        </div>
        <div class="dashboard-card">
          <div class="dashboard-card-header">
            <span class="dashboard-card-title">Focus Time</span>
            <span class="dashboard-card-icon">⏱️</span>
          </div>
          <div class="dashboard-card-value">${pomodoro.totalMinutes || 0}m</div>
          <div class="dashboard-card-sub">${pomodoro.sessions || 0} sessions total</div>
        </div>
        <div class="dashboard-card">
          <div class="dashboard-card-header">
            <span class="dashboard-card-title">Budget</span>
            <span class="dashboard-card-icon">💰</span>
          </div>
          <div class="dashboard-card-value" style="color:${thisMonthIncome - thisMonthExpenses >= 0 ? 'var(--success)' : 'var(--danger)'}">₱${(thisMonthIncome - thisMonthExpenses).toFixed(0)}</div>
          <div class="dashboard-card-sub">This month balance</div>
        </div>
        <div class="dashboard-card" style="text-align:center">
          <div class="dashboard-card-header" style="justify-content:center">
            <span class="dashboard-card-title">Productivity Score</span>
          </div>
          <div style="display:flex;justify-content:center;margin-top:8px">
            <div class="score-circle ${score >= 80 ? 'excellent' : score >= 60 ? 'good' : score >= 40 ? 'fair' : 'poor'}">${score}</div>
          </div>
        </div>
        <div class="dashboard-card">
          <div class="dashboard-card-header">
            <span class="dashboard-card-title">XP</span>
            <span class="dashboard-card-icon">⭐</span>
          </div>
          <div class="dashboard-card-value">${xp}</div>
          <div class="dashboard-card-sub">Total experience points</div>
        </div>
        <div class="dashboard-card">
          <div class="dashboard-card-header">
            <span class="dashboard-card-title">Daily Challenge</span>
            <span class="dashboard-card-icon">${challenge.icon}</span>
          </div>
          <div style="font-size:0.9rem;font-weight:500;margin-bottom:4px">${challenge.name}</div>
          <div style="font-size:0.85rem;color:var(--text-secondary)">${challenge.desc}</div>
          <div style="margin-top:8px;font-size:0.8rem;color:var(--text-muted)">${challenge.done ? '✅ Completed!' : 'Not yet done'}</div>
        </div>
        <div class="dashboard-card dashboard-quote">
          <div class="dashboard-quote-text">"${quote.text}"</div>
          <div class="dashboard-quote-author">— ${quote.author}</div>
        </div>
      </div>
      <div style="margin-top:16px">
        <h3 style="font-size:0.9rem;font-weight:600;margin-bottom:8px;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.5px">Recommendations</h3>
        <div style="display:grid;gap:8px;grid-template-columns:repeat(auto-fill,minmax(280px,1fr))">
          ${tips.map(t => `<div class="card" style="padding:12px 16px;display:flex;align-items:center;gap:10px"><span style="font-size:1.2rem">${t.icon}</span><span style="font-size:0.85rem;color:var(--text-secondary)">${t.text}</span></div>`).join('')}
        </div>
      </div>
    `;

    this.checkAchievementsAndChallenges({ doneTasks, totalTasks, pomodoro, longestStreak, activeGoals, doneGoals, allHabitsDone, todayTasks: todayTaskCount });
  },
  startClock() {
    if (this.clockInterval) clearInterval(this.clockInterval);
    const update = () => {
      const now = new Date();
      const c = document.getElementById('liveClock');
      const d = document.getElementById('liveDate');
      if (c) c.textContent = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      if (d) d.textContent = now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
      const hd = document.getElementById('headerDate');
      if (hd) hd.textContent = now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    };
    update();
    this.clockInterval = setInterval(update, 1000);
  },
  calcScore({ doneTasks, totalTasks, pomodoro, longestStreak, activeGoals, doneGoals, allHabitsDone }) {
    let s = 0;
    if (totalTasks) s += (doneTasks / totalTasks) * 25;
    s += Math.min(pomodoro.sessions || 0, 20) * 1;
    s += Math.min(longestStreak, 30) * 1.5;
    if (doneGoals) s += Math.min(doneGoals * 5, 20);
    if (allHabitsDone) s += 5;
    return Math.min(Math.round(s), 100);
  },
  checkAchievementsAndChallenges(stats) {
    Achievements.checkAll(stats);
    Challenges.check(stats);
  },
  sync() {
    if (App.currentModule !== 'dashboard') return;
    this.render();
  }
};

/* =====================
   PLANNER MODULE
   ===================== */
const Planner = {
  view: 'list',
  calendarDate: new Date(),
  init() {
    this.render();
  },
  getTasks() { return Store.get('tasks', []); },
  saveTasks(t) { Store.set('tasks', t); },
  render() {
    const el = document.getElementById('appContent');
    const tasks = this.getTasks();
    const total = tasks.length;
    const done = tasks.filter(t => t.completed).length;
    const pending = total - done;
    const pct = total ? Math.round(done / total * 100) : 0;

    el.innerHTML = `
      <div class="planner-header">
        <div>
          <h2 style="font-size:1.2rem;font-weight:600">Study Planner</h2>
          <p style="font-size:0.85rem;color:var(--text-muted);margin-top:4px">Manage your tasks and deadlines</p>
        </div>
        <div style="display:flex;gap:8px;flex-wrap:wrap">
          <button class="btn btn-outline btn-sm ${this.view === 'list' ? 'active' : ''}" onclick="Planner.switchView('list')">📋 List</button>
          <button class="btn btn-outline btn-sm ${this.view === 'calendar' ? 'active' : ''}" onclick="Planner.switchView('calendar')">📅 Calendar</button>
          <button class="btn btn-primary" onclick="Planner.showForm()">+ New Task</button>
        </div>
      </div>
      <div class="planner-stats">
        <div class="planner-stat"><div class="planner-stat-value" style="color:var(--text)">${total}</div><div class="planner-stat-label">Total</div></div>
        <div class="planner-stat"><div class="planner-stat-value" style="color:var(--success)">${done}</div><div class="planner-stat-label">Done</div></div>
        <div class="planner-stat"><div class="planner-stat-value" style="color:var(--warning)">${pending}</div><div class="planner-stat-label">Pending</div></div>
        <div class="planner-stat"><div class="planner-stat-value" style="color:var(--primary)">${pct}%</div><div class="planner-stat-label">Rate</div></div>
      </div>
      <div id="plannerView">
        ${this.view === 'list' ? this.renderListView(tasks) : this.renderCalendarView(tasks)}
      </div>
    `;
  },
  switchView(v) {
    this.view = v;
    this.render();
  },
  renderListView(tasks) {
    if (!tasks.length) return `<div class="empty-state"><div class="empty-state-icon">📋</div><div class="empty-state-text">No tasks yet</div><div class="empty-state-hint">Create your first task!</div></div>`;
    return `<div class="task-list">${tasks.map((t, i) => `
      <div class="task-item ${t.completed ? 'completed' : ''}">
        <div class="task-check ${t.completed ? 'checked' : ''}" onclick="Planner.toggleTask(${i})"></div>
        <div class="task-info">
          <div class="task-title">${this.esc(t.title)}</div>
          <div class="task-subject">${t.subject ? this.esc(t.subject) : 'No subject'}${t.description ? ' — ' + this.esc(t.description) : ''}</div>
        </div>
        <div class="task-meta">
          ${t.deadline ? `<span class="task-deadline">📅 ${formatDate(t.deadline)}</span>` : ''}
          <span class="task-priority ${t.priority || 'medium'}">${t.priority || 'medium'}</span>
          <button class="btn btn-ghost btn-icon" onclick="Planner.editForm(${i})">✏️</button>
          <button class="btn btn-ghost btn-icon" onclick="Planner.deleteTask(${i})">🗑️</button>
        </div>
      </div>
    `).join('')}</div>`;
  },
  renderCalendarView(tasks) {
    const y = this.calendarDate.getFullYear();
    const m = this.calendarDate.getMonth();
    const firstDay = new Date(y, m, 1).getDay();
    const daysInMonth = new Date(y, m + 1, 0).getDate();
    const prevMonthDays = new Date(y, m, 0).getDate();
    const todayNum = new Date().getDate();
    const todayMonth = new Date().getMonth();
    const todayYear = new Date().getFullYear();

    const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];

    let cells = '';
    for (let i = firstDay - 1; i >= 0; i--) {
      cells += `<div class="calendar-day other-month"><span class="day-number">${prevMonthDays - i}</span></div>`;
    }
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${y}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
      const hasTask = tasks.some(t => t.deadline && t.deadline.startsWith(dateStr));
      const isToday = d === todayNum && m === todayMonth && y === todayYear;
      cells += `<div class="calendar-day ${isToday ? 'today' : ''} ${hasTask ? 'has-tasks' : ''}"><span class="day-number">${d}</span></div>`;
    }
    const totalCells = firstDay + daysInMonth;
    const remaining = 7 - (totalCells % 7);
    if (remaining < 7) {
      for (let d = 1; d <= remaining; d++) {
        cells += `<div class="calendar-day other-month"><span class="day-number">${d}</span></div>`;
      }
    }

    return `
      <div class="calendar-view">
        <div class="calendar-header">
          <button class="btn btn-ghost" onclick="Planner.prevMonth()">◀</button>
          <span class="calendar-title">${monthNames[m]} ${y}</span>
          <button class="btn btn-ghost" onclick="Planner.nextMonth()">▶</button>
        </div>
        <div class="calendar-grid">
          <div class="calendar-day-header">Sun</div>
          <div class="calendar-day-header">Mon</div>
          <div class="calendar-day-header">Tue</div>
          <div class="calendar-day-header">Wed</div>
          <div class="calendar-day-header">Thu</div>
          <div class="calendar-day-header">Fri</div>
          <div class="calendar-day-header">Sat</div>
          ${cells}
        </div>
      </div>
      <div style="margin-top:16px">
        <h3 style="font-size:0.9rem;font-weight:600;margin-bottom:8px;color:var(--text-muted)">Tasks with deadlines</h3>
        <div class="task-list">${tasks.filter(t => t.deadline).map((t, i) => `
          <div class="task-item ${t.completed ? 'completed' : ''}">
            <div class="task-check ${t.completed ? 'checked' : ''}" onclick="Planner.toggleTask(${tasks.indexOf(t)})"></div>
            <div class="task-info">
              <div class="task-title">${this.esc(t.title)}</div>
              <div class="task-subject">📅 ${formatDate(t.deadline)}${t.completedDate ? ' ✓' : ''}</div>
            </div>
            <div class="task-meta">
              <span class="task-priority ${t.priority || 'medium'}">${t.priority || 'medium'}</span>
            </div>
          </div>
        `).join('')}</div>
      </div>
    `;
  },
  prevMonth() {
    this.calendarDate.setMonth(this.calendarDate.getMonth() - 1);
    this.render();
  },
  nextMonth() {
    this.calendarDate.setMonth(this.calendarDate.getMonth() + 1);
    this.render();
  },
  toggleTask(idx) {
    const tasks = this.getTasks();
    tasks[idx].completed = !tasks[idx].completed;
    if (tasks[idx].completed) tasks[idx].completedDate = today();
    else delete tasks[idx].completedDate;
    this.saveTasks(tasks);
    this.render();
    Dashboard.sync();
  },
  deleteTask(idx) {
    const tasks = this.getTasks();
    tasks.splice(idx, 1);
    this.saveTasks(tasks);
    this.render();
    Dashboard.sync();
  },
  showForm(data, idx) {
    const isEdit = data !== undefined;
    const t = data || { title: '', subject: '', description: '', priority: 'medium', deadline: '' };
    Modal.show({
      title: isEdit ? 'Edit Task' : 'New Task',
      body: `
        <div style="display:grid;gap:12px">
          <div>
            <label style="font-size:0.85rem;font-weight:500;display:block;margin-bottom:4px;color:var(--text-secondary)">Title *</label>
            <input class="input" id="taskTitle" value="${this.esc(t.title)}" placeholder="What do you need to do?" />
          </div>
          <div>
            <label style="font-size:0.85rem;font-weight:500;display:block;margin-bottom:4px;color:var(--text-secondary)">Subject</label>
            <input class="input" id="taskSubject" value="${this.esc(t.subject || '')}" placeholder="e.g. Math, Science" />
          </div>
          <div>
            <label style="font-size:0.85rem;font-weight:500;display:block;margin-bottom:4px;color:var(--text-secondary)">Description</label>
            <textarea class="textarea" id="taskDesc" placeholder="Add details...">${this.esc(t.description || '')}</textarea>
          </div>
          <div>
            <label style="font-size:0.85rem;font-weight:500;display:block;margin-bottom:4px;color:var(--text-secondary)">Priority</label>
            <select class="select" id="taskPriority">
              <option value="low" ${t.priority === 'low' ? 'selected' : ''}>Low</option>
              <option value="medium" ${t.priority === 'medium' || !t.priority ? 'selected' : ''}>Medium</option>
              <option value="high" ${t.priority === 'high' ? 'selected' : ''}>High</option>
            </select>
          </div>
          <div>
            <label style="font-size:0.85rem;font-weight:500;display:block;margin-bottom:4px;color:var(--text-secondary)">Deadline</label>
            <input class="input" type="date" id="taskDeadline" value="${t.deadline || ''}" />
          </div>
        </div>
      `,
      footer: `
        <button class="btn btn-ghost" onclick="Modal.close()">Cancel</button>
        <button class="btn btn-primary" id="saveTaskBtn">${isEdit ? 'Update' : 'Create'}</button>
      `
    });
    document.getElementById('saveTaskBtn').onclick = () => this.saveForm(idx);
    setTimeout(() => document.getElementById('taskTitle').focus(), 100);
  },
  editForm(idx) {
    const tasks = this.getTasks();
    this.showForm(tasks[idx], idx);
  },
  saveForm(idx) {
    const title = document.getElementById('taskTitle').value.trim();
    if (!title) { Toast.warning('Title is required'); return; }
    const tasks = this.getTasks();
    const data = {
      title,
      subject: document.getElementById('taskSubject').value.trim(),
      description: document.getElementById('taskDesc').value.trim(),
      priority: document.getElementById('taskPriority').value,
      deadline: document.getElementById('taskDeadline').value || null
    };
    if (idx !== undefined) {
      tasks[idx] = { ...tasks[idx], ...data };
    } else {
      data.completed = false;
      data.createdAt = new Date().toISOString();
      tasks.push(data);
    }
    this.saveTasks(tasks);
    Modal.close();
    this.render();
    Dashboard.sync();
    Toast.success(idx !== undefined ? 'Task updated!' : 'Task created!');
  },
  esc(s) {
    if (!s) return '';
    return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');
  }
};

/* =====================
   POMODORO MODULE
   ===================== */
const Pomodoro = {
  state: 'idle', // idle, running, paused
  mode: 'focus', // focus, shortBreak, longBreak
  timeLeft: 25 * 60,
  totalTime: 25 * 60,
  timer: null,
  interval: null,
  history: [],

  modes: {
    focus: { label: 'Focus', minutes: 25 },
    shortBreak: { label: 'Short Break', minutes: 5 },
    longBreak: { label: 'Long Break', minutes: 15 }
  },

  init() {
    const d = Store.get('pomodoro', { sessions: 0, totalMinutes: 0, history: [] });
    this.history = d.history || [];
    this.render();
  },

  render() {
    const el = document.getElementById('appContent');
    const d = Store.get('pomodoro', { sessions: 0, totalMinutes: 0 });
    const totalMinutes = d.totalMinutes || 0;
    const sessions = d.sessions || 0;
    const todaySessions = this.history.filter(h => h.date === today()).length;
    const todayMinutes = this.history.filter(h => h.date === today()).reduce((s, h) => s + h.duration, 0);

    const radius = 120;
    const circumference = 2 * Math.PI * radius;
    const progress = this.totalTime > 0 ? (this.totalTime - this.timeLeft) / this.totalTime : 0;
    const offset = circumference * (1 - progress);
    const mins = Math.floor(this.timeLeft / 60);
    const secs = this.timeLeft % 60;

    el.innerHTML = `
      <div class="pomodoro-container">
        <div class="pomodoro-modes">
          ${Object.entries(this.modes).map(([k, v]) => `
            <button class="pomodoro-mode-btn ${this.mode === k ? 'active' : ''}" onclick="Pomodoro.setMode('${k}')">${v.label}</button>
          `).join('')}
        </div>
        <div class="pomodoro-timer">
          <svg width="100%" height="100%" viewBox="0 0 260 260">
            <circle class="pomodoro-timer-bg" cx="130" cy="130" r="${radius}"/>
            <circle class="pomodoro-timer-progress" cx="130" cy="130" r="${radius}"
              stroke-dasharray="${circumference}" stroke-dashoffset="${offset}" style="stroke: ${this.mode === 'focus' ? 'var(--primary)' : this.mode === 'shortBreak' ? 'var(--success)' : 'var(--warning)'}"/>
          </svg>
          <div class="pomodoro-time">
            <div class="pomodoro-time-display">${String(mins).padStart(2,'0')}:${String(secs).padStart(2,'0')}</div>
            <div class="pomodoro-time-label">${this.modes[this.mode].label}</div>
          </div>
        </div>
        <div class="pomodoro-controls">
          ${this.state === 'idle' ? `<button class="pomodoro-btn pomodoro-btn-primary" onclick="Pomodoro.start()">▶️</button>` : ''}
          ${this.state === 'running' ? `<button class="pomodoro-btn pomodoro-btn-secondary" onclick="Pomodoro.pause()">⏸️</button>` : ''}
          ${this.state === 'paused' ? `<button class="pomodoro-btn pomodoro-btn-primary" onclick="Pomodoro.resume()">▶️</button>` : ''}
          ${this.state !== 'idle' ? `<button class="pomodoro-btn pomodoro-btn-secondary" onclick="Pomodoro.reset()">⏹️</button>` : ''}
        </div>
        <div class="pomodoro-stats">
          <div class="pomodoro-stat"><div class="pomodoro-stat-value">${sessions}</div><div class="pomodoro-stat-label">Total Sessions</div></div>
          <div class="pomodoro-stat"><div class="pomodoro-stat-value">${totalMinutes}</div><div class="pomodoro-stat-label">Total Min</div></div>
          <div class="pomodoro-stat"><div class="pomodoro-stat-value">${todaySessions}</div><div class="pomodoro-stat-label">Today</div></div>
          <div class="pomodoro-stat"><div class="pomodoro-stat-value">${todayMinutes}</div><div class="pomodoro-stat-label">Today Min</div></div>
        </div>
        <div style="margin-top:20px">
          <h3 style="font-size:0.85rem;font-weight:600;margin-bottom:8px;color:var(--text-muted)">Settings</h3>
          <div style="display:flex;gap:8px;flex-wrap:wrap;justify-content:center">
            ${Object.entries(this.modes).map(([k, v]) => `
              <div style="display:flex;align-items:center;gap:6px">
                <label style="font-size:0.8rem;color:var(--text-secondary)">${v.label}:</label>
                <input class="input" type="number" style="width:70px;padding:6px 10px" value="${v.minutes}" min="1" max="120"
                  onchange="Pomodoro.updateMode('${k}', this.value)" />
              </div>
            `).join('')}
          </div>
        </div>
        ${this.history.length ? `
          <div class="pomodoro-history">
            <h3 style="font-size:0.85rem;font-weight:600;margin-bottom:8px;color:var(--text-muted)">Recent Sessions</h3>
            ${this.history.slice(-10).reverse().map(h => `
              <div class="pomodoro-history-item">
                <span>${formatDate(h.date)} ${formatTime(h.startTime)}</span>
                <span>${h.duration} min ${h.mode}</span>
              </div>
            `).join('')}
          </div>
        ` : ''}
      </div>
    `;
  },

  setMode(mode) {
    if (this.state === 'running') return;
    this.mode = mode;
    this.timeLeft = this.modes[mode].minutes * 60;
    this.totalTime = this.timeLeft;
    this.state = 'idle';
    this.render();
  },

  start() {
    this.state = 'running';
    this.startTime = new Date();
    this.render();
    this.timer = setInterval(() => this.tick(), 1000);
    try {
      if (!this.audioCtx || this.audioCtx.state === 'closed') {
        this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      }
      this._scheduleAlarm(this.audioCtx, this.timeLeft);
    } catch {}
  },

  _scheduleAlarm(ctx, delaySec) {
    const now = ctx.currentTime;
    const alarm = now + Math.max(delaySec, 0);
    const tones = [800, 600];
    for (let cycle = 0; cycle < 3; cycle++) {
      for (let t = 0; t < tones.length; t++) {
        const start = alarm + cycle * 1.2 + t * 0.55;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = tones[t];
        gain.gain.setValueAtTime(0.3, start);
        gain.gain.exponentialRampToValueAtTime(0.01, start + 0.4);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(start);
        osc.stop(start + 0.4);
      }
    }
  },

  pause() {
    this.state = 'paused';
    clearInterval(this.timer);
    if (this.audioCtx && this.audioCtx.state !== 'closed') {
      try { this.audioCtx.close(); } catch {}
      this.audioCtx = null;
    }
    this.render();
  },

  resume() {
    this.state = 'running';
    this.render();
    this.timer = setInterval(() => this.tick(), 1000);
    try {
      if (!this.audioCtx || this.audioCtx.state === 'closed') {
        this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      }
      this._scheduleAlarm(this.audioCtx, this.timeLeft);
    } catch {}
  },

  reset() {
    clearInterval(this.timer);
    this.state = 'idle';
    this.timeLeft = this.modes[this.mode].minutes * 60;
    this.totalTime = this.timeLeft;
    if (this.audioCtx && this.audioCtx.state !== 'closed') {
      try { this.audioCtx.close(); } catch {}
      this.audioCtx = null;
    }
    this.render();
  },

  tick() {
    if (this.timeLeft <= 0) {
      clearInterval(this.timer);
      this.complete();
      return;
    }
    this.timeLeft--;
    this.render();
  },

  complete() {
    const duration = this.modes[this.mode].minutes;
    const d = Store.get('pomodoro', { sessions: 0, totalMinutes: 0, history: [] });
    d.sessions++;
    d.totalMinutes += duration;
    this.history.push({
      date: today(),
      startTime: this.startTime || new Date(),
      duration,
      mode: this.mode
    });
    d.history = this.history;
    Store.set('pomodoro', d);

    if (this.mode === 'focus') {
      Toast.success(`Focus session complete! ${duration} min`);
      Notify.send('Pomodoro Complete', { body: `Great focus session! ${duration} minutes done.` });
    }

    if (this.mode === 'focus') {
      this.mode = 'shortBreak';
    } else {
      this.mode = 'focus';
    }
    this.timeLeft = this.modes[this.mode].minutes * 60;
    this.totalTime = this.timeLeft;
    this.state = 'idle';
    this.render();
    Dashboard.sync();
  },

  updateMode(mode, val) {
    const mins = parseInt(val) || 1;
    this.modes[mode].minutes = mins;
    if (this.mode === mode && this.state === 'idle') {
      this.timeLeft = mins * 60;
      this.totalTime = this.timeLeft;
      this.render();
    }
  }
};

/* =====================
   GOALS MODULE
   ===================== */
const Goals = {
  init() { this.render(); },
  getGoals() { return Store.get('goals', []); },
  saveGoals(g) { Store.set('goals', g); },
  render() {
    const el = document.getElementById('appContent');
    const goals = this.getGoals();
    const active = goals.filter(g => g.progress < 100).length;
    const done = goals.filter(g => g.progress >= 100).length;
    const total = goals.length;

    el.innerHTML = `
      <div class="goals-header">
        <div>
          <h2 style="font-size:1.2rem;font-weight:600">Goal Tracker</h2>
          <p style="font-size:0.85rem;color:var(--text-muted);margin-top:4px">Set and track your goals</p>
        </div>
        <button class="btn btn-primary" onclick="Goals.showForm()">+ New Goal</button>
      </div>
      <div class="goals-stats">
        <div class="planner-stat"><div class="planner-stat-value">${total}</div><div class="planner-stat-label">Total</div></div>
        <div class="planner-stat"><div class="planner-stat-value" style="color:var(--primary)">${active}</div><div class="planner-stat-label">Active</div></div>
        <div class="planner-stat"><div class="planner-stat-value" style="color:var(--success)">${done}</div><div class="planner-stat-label">Done</div></div>
        <div class="planner-stat"><div class="planner-stat-value" style="color:var(--primary)">${total ? Math.round(done/total*100) : 0}%</div><div class="planner-stat-label">Success Rate</div></div>
      </div>
      ${!goals.length ? `<div class="empty-state"><div class="empty-state-icon">🎯</div><div class="empty-state-text">No goals yet</div><div class="empty-state-hint">Set your first goal!</div></div>` : `
        <div>${goals.map((g, i) => `
          <div class="goal-card">
            <div class="goal-card-header">
              <div>
                <div class="goal-name">${g.name}</div>
                ${g.description ? `<div class="goal-description">${g.description}</div>` : ''}
                <div class="goal-dates">${g.startDate ? formatDate(g.startDate) : 'Start'} → ${g.targetDate ? formatDate(g.targetDate) : 'No deadline'} ${g.targetDate ? '(' + daysBetween(new Date(), g.targetDate) + ' days left)' : ''}</div>
              </div>
              <div style="display:flex;gap:4px">
                <button class="btn btn-ghost btn-icon" onclick="Goals.showForm(${i})">✏️</button>
                <button class="btn btn-ghost btn-icon" onclick="Goals.delete(${i})">🗑️</button>
              </div>
            </div>
            <div class="goal-progress-section">
              <div class="goal-progress-label">
                <span>Progress</span>
                <span>${g.progress || 0}%</span>
              </div>
              <div class="progress-bar"><div class="progress-bar-fill ${g.progress >= 100 ? 'success' : ''}" style="width:${g.progress || 0}%"></div></div>
              <input type="range" class="goal-progress-input" min="0" max="100" value="${g.progress || 0}" onchange="Goals.updateProgress(${i}, this.value)" style="margin-top:8px" />
              ${g.progress >= 100 ? '<div class="goal-badges"><span class="goal-badge completed">✅ Completed</span></div>' : ''}
            </div>
          </div>
        `).join('')}</div>
      `}
    `;
  },
  showForm(idx) {
    const goals = this.getGoals();
    const g = idx !== undefined ? goals[idx] : { name: '', description: '', startDate: today(), targetDate: '' };
    Modal.show({
      title: idx !== undefined ? 'Edit Goal' : 'New Goal',
      body: `
        <div style="display:grid;gap:12px">
          <div><label style="font-size:0.85rem;font-weight:500;display:block;margin-bottom:4px;color:var(--text-secondary)">Name *</label>
            <input class="input" id="goalName" value="${g.name}" placeholder="e.g. Finish Thesis" /></div>
          <div><label style="font-size:0.85rem;font-weight:500;display:block;margin-bottom:4px;color:var(--text-secondary)">Description</label>
            <textarea class="textarea" id="goalDesc" placeholder="Describe your goal...">${g.description || ''}</textarea></div>
          <div><label style="font-size:0.85rem;font-weight:500;display:block;margin-bottom:4px;color:var(--text-secondary)">Start Date</label>
            <input class="input" type="date" id="goalStart" value="${g.startDate || today()}" /></div>
          <div><label style="font-size:0.85rem;font-weight:500;display:block;margin-bottom:4px;color:var(--text-secondary)">Target Date</label>
            <input class="input" type="date" id="goalTarget" value="${g.targetDate || ''}" /></div>
        </div>
      `,
      footer: `<button class="btn btn-ghost" onclick="Modal.close()">Cancel</button><button class="btn btn-primary" id="saveGoalBtn">${idx !== undefined ? 'Update' : 'Create'}</button>`
    });
    document.getElementById('saveGoalBtn').onclick = () => this.saveForm(idx);
  },
  saveForm(idx) {
    const name = document.getElementById('goalName').value.trim();
    if (!name) { Toast.warning('Name is required'); return; }
    const goals = this.getGoals();
    const data = {
      name,
      description: document.getElementById('goalDesc').value.trim(),
      startDate: document.getElementById('goalStart').value || today(),
      targetDate: document.getElementById('goalTarget').value || null,
      progress: 0
    };
    if (idx !== undefined) {
      goals[idx] = { ...goals[idx], ...data };
    } else {
      data.createdAt = new Date().toISOString();
      goals.push(data);
    }
    this.saveGoals(goals);
    Modal.close();
    this.render();
    Dashboard.sync();
    Toast.success(idx !== undefined ? 'Goal updated!' : 'Goal created!');
  },
  updateProgress(idx, val) {
    const goals = this.getGoals();
    goals[idx].progress = parseInt(val);
    this.saveGoals(goals);
    this.render();
    Dashboard.sync();
  },
  delete(idx) {
    Modal.confirm('Delete Goal', 'Are you sure you want to delete this goal?').then(ok => {
      if (ok) {
        const goals = this.getGoals();
        goals.splice(idx, 1);
        this.saveGoals(goals);
        this.render();
        Dashboard.sync();
        Toast.success('Goal deleted');
      }
    });
  }
};

/* =====================
   HABITS MODULE
   ===================== */
const Habits = {
  init() { this.render(); },
  getHabits() { return Store.get('habits', []); },
  saveHabits(h) { Store.set('habits', h); },
  getLog() { return Store.get('habitLog', {}); },
  saveLog(l) { Store.set('habitLog', l); },
  render() {
    const el = document.getElementById('appContent');
    const habits = this.getHabits();
    const log = this.getLog();
    const todayStr = today();
    const total = habits.length;
    const done = habits.filter(h => log[h.id] && log[h.id][todayStr]).length;

    let longestStreak = 0;
    let currentStreaks = [];
    for (const h of habits) {
      let streak = 0;
      for (let i = 0; i < 365; i++) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const ds = d.toISOString().split('T')[0];
        if (log[h.id] && log[h.id][ds]) streak++;
        else break;
      }
      currentStreaks.push({ id: h.id, streak });
      if (streak > longestStreak) longestStreak = streak;
    }

    el.innerHTML = `
      <div class="habits-header">
        <div>
          <h2 style="font-size:1.2rem;font-weight:600">Habit Tracker</h2>
          <p style="font-size:0.85rem;color:var(--text-muted);margin-top:4px">Build and maintain your habits</p>
        </div>
        <button class="btn btn-primary" onclick="Habits.showForm()">+ New Habit</button>
      </div>
      <div class="habits-stats">
        <div class="planner-stat"><div class="planner-stat-value">${total}</div><div class="planner-stat-label">Habits</div></div>
        <div class="planner-stat"><div class="planner-stat-value" style="color:var(--success)">${done}/${total}</div><div class="planner-stat-label">Today</div></div>
        <div class="planner-stat"><div class="planner-stat-value" style="color:var(--warning)">${longestStreak}</div><div class="planner-stat-label">Best Streak</div></div>
        <div class="planner-stat"><div class="planner-stat-value" style="color:var(--primary)">${total ? Math.round(done/total*100) : 0}%</div><div class="planner-stat-label">Today %</div></div>
      </div>
      ${!habits.length ? `<div class="empty-state"><div class="empty-state-icon">✅</div><div class="empty-state-text">No habits yet</div><div class="empty-state-hint">Create your first habit!</div></div>` : `
        <div class="habit-list">${habits.map((h, i) => {
          const s = currentStreaks.find(c => c.id === h.id);
          return `
          <div class="habit-item">
            <div class="habit-check ${log[h.id] && log[h.id][todayStr] ? 'checked' : ''}" onclick="Habits.toggle(${i})"></div>
            <div class="habit-info">
              <div class="habit-name">${h.name}</div>
              <div class="habit-streak">🔥 Streak: <strong>${s ? s.streak : 0}</strong> days</div>
            </div>
            <div class="habit-actions">
              <button class="btn btn-ghost btn-icon" onclick="Habits.delete(${i})">🗑️</button>
            </div>
          </div>`;
        }).join('')}</div>
        ${this.renderHeatmap(habits, log)}
      `}
    `;
  },
  toggle(idx) {
    const habits = this.getHabits();
    const log = this.getLog();
    const todayStr = today();
    const h = habits[idx];
    if (!log[h.id]) log[h.id] = {};
    if (log[h.id][todayStr]) {
      delete log[h.id][todayStr];
    } else {
      log[h.id][todayStr] = true;
    }
    this.saveLog(log);
    this.render();
    Dashboard.sync();
  },
  renderHeatmap(habits, log) {
    if (!habits.length) return '';
    const todayStr = today();
    const d = new Date();
    const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    let html = '<div class="heatmap-section"><div class="heatmap-title">Monthly Overview</div><div class="heatmap-grid">';
    html += ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => `<div class="heatmap-day-label">${d}</div>`).join('');
    const y = d.getFullYear();
    const m = d.getMonth();
    const firstDay = new Date(y, m, 1).getDay();
    const daysInMonth = new Date(y, m + 1, 0).getDate();
    for (let i = 0; i < firstDay; i++) html += '<div></div>';
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${y}-${String(m+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
      let allDone = 0, totalCheck = 0;
      for (const h of habits) {
        if (log[h.id] && log[h.id][dateStr]) allDone++;
        totalCheck++;
      }
      const cls = allDone === totalCheck ? 'done' : allDone > 0 ? '' : '';
      html += `<div class="heatmap-day ${cls}">${day}</div>`;
    }
    html += '</div></div>';
    return html;
  },
  showForm() {
    Modal.show({
      title: 'New Habit',
      body: `<div><label style="font-size:0.85rem;font-weight:500;display:block;margin-bottom:4px;color:var(--text-secondary)">Habit Name *</label>
        <input class="input" id="habitName" placeholder="e.g. Read 30 minutes" /></div>`,
      footer: `<button class="btn btn-ghost" onclick="Modal.close()">Cancel</button><button class="btn btn-primary" id="saveHabitBtn">Create</button>`
    });
    document.getElementById('saveHabitBtn').onclick = () => {
      const name = document.getElementById('habitName').value.trim();
      if (!name) { Toast.warning('Name is required'); return; }
      const habits = this.getHabits();
      habits.push({ id: Date.now().toString(36), name, createdAt: new Date().toISOString() });
      this.saveHabits(habits);
      Modal.close();
      this.render();
      Dashboard.sync();
      Toast.success('Habit created!');
    };
  },
  delete(idx) {
    Modal.confirm('Delete Habit', 'Are you sure?').then(ok => {
      if (ok) {
        const habits = this.getHabits();
        habits.splice(idx, 1);
        this.saveHabits(habits);
        this.render();
        Dashboard.sync();
        Toast.success('Habit deleted');
      }
    });
  }
};

/* =====================
   NOTES MODULE
   ===================== */
const Notes = {
  editId: null,
  init() { this.render(); },
  getNotes() { return Store.get('notes', []); },
  saveNotes(n) { Store.set('notes', n); },
  render() {
    const el = document.getElementById('appContent');
    const notes = this.getNotes();
    const pinned = notes.filter(n => n.pinned);
    const unpinned = notes.filter(n => !n.pinned);
    const sorted = [...pinned, ...unpinned];

    el.innerHTML = `
      <div class="notes-header">
        <div>
          <h2 style="font-size:1.2rem;font-weight:600">Notes</h2>
          <p style="font-size:0.85rem;color:var(--text-muted);margin-top:4px">Write and organize your thoughts</p>
        </div>
        <div style="display:flex;gap:8px;flex-wrap:wrap">
          <input class="input" style="width:200px" id="noteSearch" placeholder="🔍 Search notes..." oninput="Notes.search(this.value)" />
          <button class="btn btn-primary" onclick="Notes.newNote()">+ New Note</button>
        </div>
      </div>
      ${this.editId !== null ? this.renderEditor() : ''}
      ${sorted.length ? `<div class="notes-list">${sorted.map((n, i) => {
        const idx = notes.indexOf(n);
        const preview = n.content ? n.content.replace(/<[^>]+>/g, '').slice(0, 100) : '';
        return `
        <div class="note-card ${n.pinned ? 'pinned' : ''}" onclick="Notes.openNote(${idx})">
          <div class="note-card-tools">
            ${n.pinned ? '<span class="note-card-pin">📌</span>' : ''}
            <button class="note-card-delete" onclick="event.stopPropagation();Notes.deleteNote(${idx})" title="Delete Note">🗑️</button>
          </div>
          <div class="note-card-title">${n.title || 'Untitled'}</div>
          <div class="note-card-preview">${preview || 'No content...'}</div>
          <div class="note-card-meta">
            <span class="note-card-category ${n.category || 'personal'}">${n.category || 'personal'}</span>
            <span>${n.updatedAt ? formatDate(n.updatedAt) : ''}</span>
          </div>
        </div>`;
      }).join('')}</div>` : `<div class="empty-state"><div class="empty-state-icon">📝</div><div class="empty-state-text">No notes yet</div><div class="empty-state-hint">Create your first note!</div></div>`}
    `;
  },
  renderEditor() {
    const notes = this.getNotes();
    const n = this.editId !== null ? notes[this.editId] : { title: '', content: '', category: 'personal' };
    return `
      <div class="card" style="margin-bottom:16px">
        <div style="display:flex;gap:8px;margin-bottom:8px;flex-wrap:wrap">
          <input class="input" id="noteTitle" style="flex:1;font-weight:600" value="${n.title || ''}" placeholder="Note title..." />
          <select class="select" id="noteCategory" style="width:140px">
            <option value="school" ${n.category === 'school' ? 'selected' : ''}>School</option>
            <option value="personal" ${n.category === 'personal' || !n.category ? 'selected' : ''}>Personal</option>
            <option value="projects" ${n.category === 'projects' ? 'selected' : ''}>Projects</option>
            <option value="ideas" ${n.category === 'ideas' ? 'selected' : ''}>Ideas</option>
          </select>
          <button class="btn btn-ghost btn-icon" onclick="Notes.togglePin()">📌</button>
          <button class="btn btn-danger" onclick="Notes.deleteNote(Notes.editId)">🗑️ Delete</button>
          <button class="btn btn-primary" onclick="Notes.saveNote()">Save</button>
          <button class="btn btn-ghost" onclick="Notes.closeEditor()">✕</button>
        </div>
        <div class="notes-toolbar">
          <button onclick="document.execCommand('bold')" title="Bold"><b>B</b></button>
          <button onclick="document.execCommand('italic')" title="Italic"><i>I</i></button>
          <button onclick="document.execCommand('underline')" title="Underline"><u>U</u></button>
          <button onclick="document.execCommand('insertUnorderedList')" title="List">•</button>
          <button onclick="document.execCommand('insertOrderedList')" title="Numbered">1.</button>
          <button onclick="document.execCommand('formatBlock', false, 'h3')" title="Heading">H</button>
          <button onclick="document.execCommand('removeFormat')" title="Clear">✕</button>
          <span style="width:1px;height:24px;background:var(--border);margin:0 4px"></span>
          <button onclick="Notes.insertImage()" title="Insert Image">🖼️</button>
          <span style="font-size:0.8rem;color:var(--text-muted);margin-left:auto" id="noteChars">0 chars</span>
        </div>
        <div class="notes-editor" id="noteContent" contenteditable="true">${n.content || ''}</div>
      </div>
    `;
  },
  newNote() {
    const notes = this.getNotes();
    notes.push({ title: '', content: '', category: 'personal', pinned: false, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
    this.saveNotes(notes);
    this.editId = notes.length - 1;
    this.render();
    setTimeout(() => {
      const title = document.getElementById('noteTitle');
      if (title) title.focus();
      this.setupAutoSave();
    }, 50);
  },
  openNote(idx) {
    this.editId = idx;
    this.render();
    setTimeout(() => this.setupAutoSave(), 50);
  },
  closeEditor() {
    this.editId = null;
    this.render();
  },
  saveNote() {
    const notes = this.getNotes();
    if (this.editId === null) return;
    const title = document.getElementById('noteTitle')?.value.trim() || 'Untitled';
    const content = document.getElementById('noteContent')?.innerHTML || '';
    const category = document.getElementById('noteCategory')?.value || 'personal';
    notes[this.editId] = { ...notes[this.editId], title, content, category, updatedAt: new Date().toISOString() };
    this.saveNotes(notes);
    this.editId = null;
    this.render();
    Dashboard.sync();
    Toast.success('Note saved!');
  },
  togglePin() {
    const notes = this.getNotes();
    if (this.editId !== null) {
      notes[this.editId].pinned = !notes[this.editId].pinned;
      this.saveNotes(notes);
      this.render();
    }
  },
  deleteNote(idx) {
    Modal.confirm('Delete Note', 'Are you sure?').then(ok => {
      if (ok) {
        const notes = this.getNotes();
        notes.splice(idx, 1);
        this.saveNotes(notes);
        if (this.editId === idx) this.editId = null;
        else if (this.editId > idx) this.editId--;
        this.render();
        Toast.success('Note deleted');
      }
    });
  },
  search(q) {
    const notes = this.getNotes();
    const cards = document.querySelectorAll('.note-card');
    cards.forEach((card, i) => {
      const n = notes[i];
      if (!n) return;
      const match = !q || n.title.toLowerCase().includes(q.toLowerCase()) || (n.content || '').toLowerCase().includes(q.toLowerCase());
      card.style.display = match ? '' : 'none';
    });
  },
  insertImage() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/jpeg,image/png,image/webp';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let w = img.width, h = img.height;
          const maxDim = 800;
          if (w > maxDim || h > maxDim) {
            const r = Math.min(maxDim / w, maxDim / h);
            w *= r; h *= r;
          }
          canvas.width = w; canvas.height = h;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, w, h);
          const dataUrl = canvas.toDataURL('image/webp', 0.7);
          const content = document.getElementById('noteContent');
          if (content) {
            content.focus();
            document.execCommand('insertImage', false, dataUrl);
            const notes = this.getNotes();
            if (this.editId !== null) {
              notes[this.editId].content = content.innerHTML;
              notes[this.editId].updatedAt = new Date().toISOString();
              this.saveNotes(notes);
            }
            Toast.success('Image inserted');
          }
        };
        img.src = ev.target.result;
      };
      reader.readAsDataURL(file);
    };
    input.click();
  },

  setupAutoSave() {
    const content = document.getElementById('noteContent');
    if (!content) return;
    content.oninput = () => {
      const ch = document.getElementById('noteChars');
      if (ch) ch.textContent = (content.textContent || '').length + ' chars';
      clearTimeout(this._saveTimer);
      const capturedId = this.editId;
      this._saveTimer = setTimeout(() => {
        const notes = this.getNotes();
        if (capturedId !== null && capturedId < notes.length && capturedId === this.editId) {
          notes[capturedId].content = content.innerHTML;
          notes[capturedId].title = document.getElementById('noteTitle')?.value.trim() || 'Untitled';
          notes[capturedId].updatedAt = new Date().toISOString();
          this.saveNotes(notes);
        }
      }, 1000);
    };
  }
};

/* =====================
   BUDGET MODULE
   ===================== */
const Budget = {
  init() { this.render(); },
  getTransactions() { return Store.get('transactions', []); },
  saveTransactions(t) { Store.set('transactions', t); },
  render() {
    const el = document.getElementById('appContent');
    const tx = this.getTransactions();
    const totalIncome = tx.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const totalExpenses = tx.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    const balance = totalIncome - totalExpenses;

    const thisMonth = tx.filter(t => t.date && t.date.startsWith(today().slice(0, 7)));
    const monthIncome = thisMonth.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const monthExpenses = thisMonth.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);

    el.innerHTML = `
      <div class="budget-header">
        <div>
          <h2 style="font-size:1.2rem;font-weight:600">Budget Tracker</h2>
          <p style="font-size:0.85rem;color:var(--text-muted);margin-top:4px">Track your income and expenses</p>
        </div>
        <div style="display:flex;gap:8px;flex-wrap:wrap">
          <button class="btn btn-success" onclick="Budget.showForm('income')">+ Income</button>
          <button class="btn btn-danger" onclick="Budget.showForm('expense')">- Expense</button>
        </div>
      </div>
      <div class="budget-summary">
        <div class="budget-summary-card">
          <div class="budget-summary-label">Balance</div>
          <div class="budget-summary-value ${balance >= 0 ? 'positive' : 'negative'}">₱${balance.toFixed(2)}</div>
        </div>
        <div class="budget-summary-card">
          <div class="budget-summary-label">Income</div>
          <div class="budget-summary-value positive">₱${totalIncome.toFixed(2)}</div>
        </div>
        <div class="budget-summary-card">
          <div class="budget-summary-label">Expenses</div>
          <div class="budget-summary-value negative">₱${totalExpenses.toFixed(2)}</div>
        </div>
        <div class="budget-summary-card">
          <div class="budget-summary-label">Savings</div>
          <div class="budget-summary-value ${balance >= 0 ? 'positive' : 'negative'}">₱${Math.max(balance, 0).toFixed(2)}</div>
        </div>
      </div>
      ${tx.length ? `
        <div class="budget-charts">
          <div class="budget-chart-container">
            <div class="budget-chart-title">Expense Breakdown</div>
            <canvas id="budgetPieChart" style="width:100%;height:200px"></canvas>
          </div>
          <div class="budget-chart-container">
            <div class="budget-chart-title">Monthly Spending</div>
            <canvas id="budgetBarChart" style="width:100%;height:200px"></canvas>
          </div>
        </div>
      ` : ''}
      <div class="budget-transactions">
        <h3 style="font-size:0.9rem;font-weight:600;margin-bottom:8px;color:var(--text-muted)">Transactions</h3>
        ${!tx.length ? `<div class="empty-state"><div class="empty-state-icon">💰</div><div class="empty-state-text">No transactions yet</div><div class="empty-state-hint">Add your first income or expense!</div></div>` :
        tx.slice().reverse().map((t, i) => {
          const idx = tx.length - 1 - i;
          return `
          <div class="budget-transaction">
            <span class="budget-tx-icon">${t.type === 'income' ? '📈' : '📉'}</span>
            <div class="budget-tx-info">
              <div class="budget-tx-title">${t.title}</div>
              <div class="budget-tx-category">${t.category || t.type}</div>
            </div>
            <div style="text-align:right">
              <div class="budget-tx-amount ${t.type}">${t.type === 'income' ? '+' : '-'}₱${t.amount.toFixed(2)}</div>
              <div class="budget-tx-date">${t.date ? formatDate(t.date) : ''}</div>
            </div>
            <button class="btn btn-ghost btn-icon" onclick="Budget.delete(${idx})">🗑️</button>
          </div>`;
        }).join('')}
      </div>
    `;
    if (tx.length) {
      setTimeout(() => {
        this.renderCharts();
      }, 100);
    }
  },
  renderCharts() {
    const tx = this.getTransactions();
    const expenses = tx.filter(t => t.type === 'expense');
    const categories = {};
    expenses.forEach(t => {
      const cat = t.category || 'Other';
      if (!categories[cat]) categories[cat] = 0;
      categories[cat] += t.amount;
    });
    const colors = ['#6366f1','#10b981','#f59e0b','#ef4444','#06b6d4','#8b5cf6','#ec4899','#14b8a6'];
    const pieData = Object.entries(categories).map(([k, v], i) => ({ label: k, value: v, color: colors[i % colors.length] }));
    Charts.donut(document.getElementById('budgetPieChart'), pieData);

    const monthly = {};
    tx.filter(t => t.type === 'expense').forEach(t => {
      if (t.date) {
        const m = t.date.slice(0, 7);
        if (!monthly[m]) monthly[m] = 0;
        monthly[m] += t.amount;
      }
    });
    const barData = Object.entries(monthly).slice(-6).map(([k, v]) => ({ label: k.slice(5), value: v }));
    Charts.bar(document.getElementById('budgetBarChart'), barData, { color: '#ef4444' });
  },
  showForm(type) {
    Modal.show({
      title: type === 'income' ? 'Add Income' : 'Add Expense',
      body: `
        <div style="display:grid;gap:12px">
          <div><label style="font-size:0.85rem;font-weight:500;display:block;margin-bottom:4px;color:var(--text-secondary)">Title *</label>
            <input class="input" id="txTitle" placeholder="e.g. Allowance, Lunch" /></div>
          <div><label style="font-size:0.85rem;font-weight:500;display:block;margin-bottom:4px;color:var(--text-secondary)">Category</label>
            <input class="input" id="txCategory" placeholder="${type === 'income' ? 'e.g. Salary, Freelance' : 'e.g. Food, Transport'}" /></div>
          <div><label style="font-size:0.85rem;font-weight:500;display:block;margin-bottom:4px;color:var(--text-secondary)">Amount *</label>
            <input class="input" type="number" id="txAmount" placeholder="0.00" min="0" step="0.01" /></div>
          <div><label style="font-size:0.85rem;font-weight:500;display:block;margin-bottom:4px;color:var(--text-secondary)">Date</label>
            <input class="input" type="date" id="txDate" value="${today()}" /></div>
        </div>
      `,
      footer: `<button class="btn btn-ghost" onclick="Modal.close()">Cancel</button><button class="btn btn-${type === 'income' ? 'success' : 'danger'}" id="saveTxBtn">Add</button>`
    });
    document.getElementById('saveTxBtn').onclick = () => {
      const title = document.getElementById('txTitle').value.trim();
      const amount = parseFloat(document.getElementById('txAmount').value);
      if (!title) { Toast.warning('Title is required'); return; }
      if (!amount || amount <= 0) { Toast.warning('Enter a valid amount'); return; }
      const tx = this.getTransactions();
      tx.push({
        title,
        category: document.getElementById('txCategory').value.trim() || (type === 'income' ? 'Income' : 'Expense'),
        amount,
        date: document.getElementById('txDate').value || today(),
        type
      });
      this.saveTransactions(tx);
      Modal.close();
      this.render();
      Dashboard.sync();
      Toast.success(type === 'income' ? 'Income added!' : 'Expense added!');
    };
  },
  delete(idx) {
    Modal.confirm('Delete Transaction', 'Are you sure?').then(ok => {
      if (ok) {
        const tx = this.getTransactions();
        tx.splice(idx, 1);
        this.saveTransactions(tx);
        this.render();
        Dashboard.sync();
        Toast.success('Transaction deleted');
      }
    });
  }
};

/* =====================
   IMAGES MODULE
   ===================== */
const Images = {
  init() {
    this.render();
    this.setupDropzone();
  },
  getImages() { return Store.get('images', []); },
  saveImages(imgs) { Store.set('images', imgs); },
  render() {
    const el = document.getElementById('appContent');
    const images = this.getImages();
    const size = Store.getSizeMB();
    const warningSize = 5; // 5MB warning

    el.innerHTML = `
      <div class="images-header">
        <div>
          <h2 style="font-size:1.2rem;font-weight:600">Image Center</h2>
          <p style="font-size:0.85rem;color:var(--text-muted);margin-top:4px">Store and organize your images</p>
        </div>
        <span style="font-size:0.8rem;color:var(--text-muted)">${size} MB used</span>
      </div>
      <div class="images-dropzone" id="imageDropzone">
        <div class="images-dropzone-icon">📁</div>
        <div class="images-dropzone-text">Drag & drop images here or click to upload</div>
        <div class="images-dropzone-hint">Supports JPG, PNG, WEBP</div>
        <input type="file" id="imageInput" accept="image/jpeg,image/png,image/webp" style="display:none" multiple />
      </div>
      <div class="images-storage-warning" id="storageWarning" style="${size > warningSize ? 'display:block' : 'display:none'}">
        ⚠️ Storage is getting large (${size} MB). Consider exporting and clearing images.
      </div>
      ${!images.length ? `<div class="empty-state"><div class="empty-state-icon">🖼️</div><div class="empty-state-text">No images yet</div><div class="empty-state-hint">Upload your first image!</div></div>` : `
        <div style="margin-bottom:12px">
          <input class="input" style="max-width:300px" id="imageSearch" placeholder="🔍 Search images..." oninput="Images.search(this.value)" />
        </div>
        <div class="images-gallery" id="imageGallery">
          ${images.map((img, i) => `
            <div class="images-gallery-item" data-name="${img.name.toLowerCase()}">
              <img src="${img.data}" alt="${img.name}" onclick="Images.openLightbox(${i})" />
              <button class="image-delete" onclick="event.stopPropagation();Images.delete(${i})">🗑️</button>
            </div>
          `).join('')}
        </div>
      `}
      <div class="lightbox" id="lightbox" onclick="Images.closeLightbox()">
        <button class="lightbox-close">✕</button>
        <img id="lightboxImg" src="" alt="" />
      </div>
    `;
  },
  setupDropzone() {
    setTimeout(() => {
      const dz = document.getElementById('imageDropzone');
      const input = document.getElementById('imageInput');
      if (!dz) return;
      dz.onclick = () => input.click();
      input.onchange = (e) => this.handleFiles(e.target.files);
      dz.ondragover = (e) => { e.preventDefault(); dz.classList.add('dragover'); };
      dz.ondragleave = () => dz.classList.remove('dragover');
      dz.ondrop = (e) => { e.preventDefault(); dz.classList.remove('dragover'); this.handleFiles(e.dataTransfer.files); };
    }, 50);
  },
  handleFiles(files) {
    for (const file of files) {
      if (!file.type.startsWith('image/')) continue;
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
        Toast.warning(`Unsupported format: ${file.type}`);
        continue;
      }
      const reader = new FileReader();
      reader.onload = (e) => {
        this.compressAndSave(e.target.result, file.name);
      };
      reader.readAsDataURL(file);
    }
  },
  compressAndSave(dataUrl, name) {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let w = img.width, h = img.height;
      const maxDim = 1200;
      if (w > maxDim || h > maxDim) {
        const ratio = Math.min(maxDim / w, maxDim / h);
        w *= ratio; h *= ratio;
      }
      canvas.width = w; canvas.height = h;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, w, h);
      const compressed = canvas.toDataURL('image/webp', 0.7);
      const images = this.getImages();
      images.push({
        id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
        name: name.replace(/\.[^.]+$/, '') + '.webp',
        data: compressed,
        createdAt: new Date().toISOString()
      });
      this.saveImages(images);
      this.render();
      this.setupDropzone();
      Dashboard.sync();
      Toast.success(`Image saved: ${name}`);
    };
    img.src = dataUrl;
  },
  delete(idx) {
    Modal.confirm('Delete Image', 'Are you sure?').then(ok => {
      if (ok) {
        const images = this.getImages();
        images.splice(idx, 1);
        this.saveImages(images);
        this.render();
        this.setupDropzone();
        Toast.success('Image deleted');
      }
    });
  },
  openLightbox(idx) {
    const images = this.getImages();
    const lb = document.getElementById('lightbox');
    const img = document.getElementById('lightboxImg');
    if (lb && img) {
      img.src = images[idx].data;
      lb.classList.add('active');
    }
  },
  closeLightbox() {
    document.getElementById('lightbox')?.classList.remove('active');
  },
  search(q) {
    const items = document.querySelectorAll('.images-gallery-item');
    items.forEach(item => {
      const name = item.dataset.name || '';
      item.style.display = !q || name.includes(q.toLowerCase()) ? '' : 'none';
    });
  }
};

/* =====================
   VOICE RECORDER MODULE
   ===================== */
const Voice = {
  recorder: null,
  chunks: [],
  stream: null,
  state: 'idle',
  timer: null,
  seconds: 0,
  analyser: null,
  animationId: null,

  init() {
    this.render();
  },
  getRecordings() { return Store.get('voiceNotes', []); },
  saveRecordings(r) { Store.set('voiceNotes', r); },
  render() {
    const el = document.getElementById('appContent');
    const recordings = this.getRecordings();
    const mins = Math.floor(this.seconds / 60);
    const secs = this.seconds % 60;

    el.innerHTML = `
      <div class="voice-header">
        <div>
          <h2 style="font-size:1.2rem;font-weight:600">Voice Notes</h2>
          <p style="font-size:0.85rem;color:var(--text-muted);margin-top:4px">Record and manage voice memos</p>
        </div>
      </div>
      <div class="voice-recorder">
        <button class="voice-recorder-btn ${this.state === 'recording' ? 'recording' : this.state === 'paused' ? 'paused' : 'idle'}" id="recordBtn" onclick="Voice.toggleRecord()">
          ${this.state === 'recording' ? '⏹️' : this.state === 'paused' ? '▶️' : '🎤'}
        </button>
        <div class="voice-recorder-timer">${String(mins).padStart(2,'0')}:${String(secs).padStart(2,'0')}</div>
        <div class="voice-recorder-status">
          ${this.state === 'idle' ? 'Tap to start recording' : this.state === 'recording' ? '🔴 Recording...' : this.state === 'paused' ? '⏸️ Paused' : ''}
        </div>
        <canvas class="voice-waveform" id="waveform"></canvas>
        <div class="voice-controls">
          ${this.state === 'recording' ? `<button class="btn btn-warning" onclick="Voice.pauseRecord()">⏸️ Pause</button>` : ''}
          ${this.state === 'paused' ? `<button class="btn btn-primary" onclick="Voice.resumeRecord()">▶️ Resume</button>` : ''}
          ${this.state !== 'idle' ? `<button class="btn btn-danger" onclick="Voice.stopRecord()">⏹️ Stop & Save</button>` : ''}
        </div>
      </div>
      <h3 style="font-size:0.9rem;font-weight:600;margin-bottom:8px;color:var(--text-muted)">Recordings</h3>
      ${!recordings.length ? `<div class="empty-state"><div class="empty-state-icon">🎤</div><div class="empty-state-text">No recordings yet</div></div>` : `
        <div class="voice-list">${recordings.slice().reverse().map((r, i) => {
          const idx = recordings.length - 1 - i;
          return `
          <div class="voice-item">
            <span class="voice-item-icon">🎵</span>
            <div class="voice-item-info">
              <div class="voice-item-name">${r.name || 'Untitled'}</div>
              <div class="voice-item-meta">${formatDate(r.createdAt)} — ${Math.floor(r.duration)}s</div>
            </div>
            <div class="voice-item-actions">
              <button class="btn btn-ghost btn-icon" onclick="Voice.playRecording(${idx})">▶️</button>
              <button class="btn btn-ghost btn-icon" onclick="Voice.rename(${idx})">✏️</button>
              <button class="btn btn-ghost btn-icon" onclick="Voice.download(${idx})">⬇️</button>
              <button class="btn btn-ghost btn-icon" onclick="Voice.deleteRecording(${idx})">🗑️</button>
            </div>
          </div>`;
        }).join('')}</div>
      `}
      <audio id="voicePlayer" style="display:none"></audio>
    `;
    if (this.state !== 'idle') this.setupWaveform();
  },
  async toggleRecord() {
    if (this.state === 'idle') {
      await this.startRecord();
    } else if (this.state === 'recording' || this.state === 'paused') {
      this.stopRecord();
    }
  },
  async startRecord() {
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      let mimeType = '';
      const preferred = ['audio/webm;codecs=opus','audio/webm','audio/ogg;codecs=opus','audio/mp4'];
      for (const m of preferred) { if (MediaRecorder.isTypeSupported(m)) { mimeType = m; break; } }
      this.recorder = mimeType ? new MediaRecorder(this.stream, { mimeType }) : new MediaRecorder(this.stream);
      this.chunks = [];
      this.seconds = 0;
      this.recorder.ondataavailable = (e) => this.chunks.push(e.data);
      this.recorder.onstop = () => this.saveRecording();
      this.recorder.start();
      this.state = 'recording';
      this.timer = setInterval(() => { this.seconds++; this.render(); this.setupWaveform(); }, 1000);
      this.setupAnalyser();
      this.render();
      Toast.info('Recording started...');
    } catch (e) {
      const msg = e.name === 'NotAllowedError'
        ? 'Microphone access denied. Allow microphone permissions in your browser settings.'
        : e.name === 'NotFoundError'
        ? 'No microphone found on this device.'
        : 'Recording unavailable on this browser/device. Try Chrome or Edge on desktop.';
      Toast.error(msg);
    }
  },
  pauseRecord() {
    if (this.recorder && this.state === 'recording') {
      this.recorder.pause();
      this.state = 'paused';
      clearInterval(this.timer);
      this.render();
    }
  },
  resumeRecord() {
    if (this.recorder && this.state === 'paused') {
      this.recorder.resume();
      this.state = 'recording';
      this.timer = setInterval(() => { this.seconds++; this.render(); }, 1000);
      this.render();
    }
  },
  stopRecord() {
    if (this.recorder && (this.state === 'recording' || this.state === 'paused')) {
      this.recorder.stop();
      this.stream.getTracks().forEach(t => t.stop());
      clearInterval(this.timer);
      if (this.animationId) cancelAnimationFrame(this.animationId);
      this.state = 'idle';
      this.render();
    }
  },
  saveRecording() {
    if (!this.chunks.length) return;
    const blob = new Blob(this.chunks, { type: this.recorder.mimeType });
    const reader = new FileReader();
    reader.onload = () => {
      const recordings = this.getRecordings();
      recordings.push({
        id: Date.now().toString(36),
        name: `Recording ${recordings.length + 1}`,
        data: reader.result,
        duration: this.seconds,
        createdAt: new Date().toISOString()
      });
      this.saveRecordings(recordings);
      this.render();
      Toast.success('Recording saved!');
    };
    reader.readAsDataURL(blob);
  },
  playRecording(idx) {
    const recordings = this.getRecordings();
    const player = document.getElementById('voicePlayer');
    if (player) {
      player.src = recordings[idx].data;
      player.play();
      Toast.info(`Playing: ${recordings[idx].name}`);
    }
  },
  rename(idx) {
    const recordings = this.getRecordings();
    Modal.show({
      title: 'Rename Recording',
      body: `<input class="input" id="renameInput" value="${recordings[idx].name}" />`,
      footer: `<button class="btn btn-ghost" onclick="Modal.close()">Cancel</button><button class="btn btn-primary" id="renameBtn">Save</button>`
    });
    document.getElementById('renameBtn').onclick = () => {
      const name = document.getElementById('renameInput').value.trim();
      if (name) {
        recordings[idx].name = name;
        this.saveRecordings(recordings);
        Modal.close();
        this.render();
        Toast.success('Renamed!');
      }
    };
  },
  download(idx) {
    const recordings = this.getRecordings();
    const a = document.createElement('a');
    a.href = recordings[idx].data;
    a.download = recordings[idx].name + '.webm';
    a.click();
    Toast.success('Downloading...');
  },
  deleteRecording(idx) {
    Modal.confirm('Delete Recording', 'Are you sure?').then(ok => {
      if (ok) {
        const recordings = this.getRecordings();
        recordings.splice(idx, 1);
        this.saveRecordings(recordings);
        this.render();
        Toast.success('Recording deleted');
      }
    });
  },
  setupAnalyser() {
    if (!this.stream) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const audioCtx = new AudioCtx();
      if (audioCtx.state === 'suspended') audioCtx.resume();
      const source = audioCtx.createMediaStreamSource(this.stream);
      this.analyser = audioCtx.createAnalyser();
      this.analyser.fftSize = 256;
      source.connect(this.analyser);
    } catch {}
  },
  setupWaveform() {
    const canvas = document.getElementById('waveform');
    if (!canvas || !this.analyser) return;
    const draw = () => {
      if (this.state !== 'recording' && this.state !== 'paused') return;
      const ctx = canvas.getContext('2d');
      const w = canvas.offsetWidth, h = canvas.offsetHeight;
      canvas.width = w; canvas.height = h;
      const bufferLength = this.analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      this.analyser.getByteTimeDomainData(dataArray);
      ctx.clearRect(0, 0, w, h);
      ctx.lineWidth = 2;
      ctx.strokeStyle = 'var(--primary)';
      ctx.beginPath();
      const sliceWidth = w / bufferLength;
      let x = 0;
      for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] / 128.0;
        const y = v * h / 2;
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        x += sliceWidth;
      }
      ctx.lineTo(w, h / 2);
      ctx.stroke();
      this.animationId = requestAnimationFrame(draw);
    };
    draw();
  }
};

/* =====================
   ANALYTICS MODULE
   ===================== */
const Analytics = {
  period: 'weekly',
  init() { this.render(); },
  render() {
    const el = document.getElementById('appContent');
    el.innerHTML = `
      <div class="analytics-header">
        <div>
          <h2 style="font-size:1.2rem;font-weight:600">Analytics</h2>
          <p style="font-size:0.85rem;color:var(--text-muted);margin-top:4px">Your productivity insights</p>
        </div>
        <div class="analytics-periods">
          <button class="analytics-period-btn ${this.period === 'daily' ? 'active' : ''}" onclick="Analytics.setPeriod('daily')">Daily</button>
          <button class="analytics-period-btn ${this.period === 'weekly' ? 'active' : ''}" onclick="Analytics.setPeriod('weekly')">Weekly</button>
          <button class="analytics-period-btn ${this.period === 'monthly' ? 'active' : ''}" onclick="Analytics.setPeriod('monthly')">Monthly</button>
        </div>
      </div>
      <div class="analytics-grid">
        <div class="analytics-card">
          <div class="analytics-card-title">Productivity Score</div>
          <div class="analytics-score">
            <div class="analytics-score-circle" id="scoreCircle">${this.calcProductivityScore()}</div>
            <div class="analytics-score-details">
              <div class="analytics-score-row"><span class="analytics-score-label">Tasks</span><span class="analytics-score-value" id="scoreTasks">0</span></div>
              <div class="analytics-score-row"><span class="analytics-score-label">Focus</span><span class="analytics-score-value" id="scoreFocus">0</span></div>
              <div class="analytics-score-row"><span class="analytics-score-label">Habits</span><span class="analytics-score-value" id="scoreHabits">0</span></div>
              <div class="analytics-score-row"><span class="analytics-score-label">Goals</span><span class="analytics-score-value" id="scoreGoals">0</span></div>
            </div>
          </div>
        </div>
        <div class="analytics-card">
          <div class="analytics-card-title">Focus Hours</div>
          <canvas id="focusChart" style="width:100%;height:200px"></canvas>
        </div>
        <div class="analytics-card">
          <div class="analytics-card-title">Task Completion</div>
          <canvas id="taskChart" style="width:100%;height:200px"></canvas>
        </div>
        <div class="analytics-card">
          <div class="analytics-card-title">Habit Consistency</div>
          <canvas id="habitChart" style="width:100%;height:200px"></canvas>
        </div>
      </div>
    `;
    setTimeout(() => this.renderCharts(), 100);
  },
  setPeriod(p) {
    this.period = p;
    this.render();
  },
  calcProductivityScore() {
    const tasks = Store.get('tasks', []);
    const pomodoro = Store.get('pomodoro', {});
    const habits = Store.get('habits', []);
    const log = Store.get('habitLog', {});
    const goals = Store.get('goals', []);
    let score = 0;
    if (tasks.length) score += (tasks.filter(t => t.completed).length / tasks.length) * 30;
    score += Math.min((pomodoro.sessions || 0) * 1.5, 25);
    const todayStr = today();
    const habitsDone = habits.filter(h => log[h.id] && log[h.id][todayStr]).length;
    if (habits.length) score += (habitsDone / habits.length) * 25;
    if (goals.length) score += (goals.filter(g => g.progress >= 100).length / goals.length) * 20;
    return Math.min(Math.round(score), 100);
  },
  renderCharts() {
    const tasks = Store.get('tasks', []);
    const pomodoro = Store.get('pomodoro', { history: [] });
    const habits = Store.get('habits', []);
    const log = Store.get('habitLog', {});

    const chartData = this.getPeriodData({ tasks, pomodoro, habits, log });

    Charts.bar(document.getElementById('focusChart'), chartData.focus.map(v => ({ label: v.label, value: v.value })), { color: '#6366f1' });
    Charts.bar(document.getElementById('taskChart'), chartData.tasks.map(v => ({ label: v.label, value: v.value })), { color: '#10b981' });
    Charts.line(document.getElementById('habitChart'), chartData.habits.map(v => ({ label: v.label, value: v.value })), { color: '#f59e0b' });
  },
  getPeriodData({ tasks, pomodoro, habits, log }) {
    const labels = [];
    const focus = [];
    const taskData = [];
    const habitData = [];
    const now = new Date();
    const n = this.period === 'daily' ? 7 : this.period === 'weekly' ? 8 : 12;
    const format = this.period === 'monthly' ? 'month' : 'day';

    for (let i = n - 1; i >= 0; i--) {
      let label, key;
      if (this.period === 'monthly') {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        label = d.toLocaleDateString('en-US', { month: 'short' });
        key = d.toISOString().slice(0, 7);
      } else {
        const d = new Date(now);
        d.setDate(now.getDate() - i);
        label = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }).replace(',', '');
        key = d.toISOString().split('T')[0];
      }
      labels.push(label);

      if (this.period === 'monthly') {
        const history = pomodoro.history || [];
        focus.push(history.filter(h => h.date && h.date.startsWith(key)).reduce((s, h) => s + h.duration, 0));
        taskData.push(tasks.filter(t => t.completedDate && t.completedDate.startsWith(key)).length);
        let days = 0, done = 0;
        const daysInMonth = new Date(now.getFullYear(), parseInt(key.split('-')[1]), 0).getDate();
        for (let d = 1; d <= daysInMonth; d++) {
          const ds = `${key}-${String(d).padStart(2,'0')}`;
          if (habits.length) {
            days++;
            let allDone = habits.every(h => log[h.id] && log[h.id][ds]);
            if (allDone) done++;
          }
        }
        habitData.push(days ? Math.round(done / days * 100) : 0);
      } else {
        const history = pomodoro.history || [];
        focus.push(history.filter(h => h.date === key).reduce((s, h) => s + h.duration, 0));
        taskData.push(tasks.filter(t => t.completedDate === key).length);
        if (habits.length) {
          let allDone = habits.every(h => log[h.id] && log[h.id][key]);
          habitData.push(allDone ? 100 : 0);
        } else {
          habitData.push(0);
        }
      }
    }
    const totalScore = this.calcProductivityScore();
    document.getElementById('scoreCircle').textContent = totalScore;

    return { focus, tasks: taskData, habits: habitData };
  }
};

/* =====================
   SETTINGS MODULE
   ===================== */
const Settings = {
  init() { this.render(); },
  render() {
    const el = document.getElementById('appContent');
    const isDark = document.body.getAttribute('data-theme') === 'dark';
    const notifications = Notification.permission;
    const size = Store.getSizeMB();

    el.innerHTML = `
      <h2 style="font-size:1.2rem;font-weight:600;margin-bottom:16px">Settings</h2>
      <div class="settings-section">
        <div class="settings-section-title">Appearance</div>
        <div class="settings-section-desc">Customize your experience</div>
        <div class="settings-row">
          <div><div class="settings-row-label">Dark Mode</div><div class="settings-row-desc">Switch between light and dark themes</div></div>
          <label class="toggle"><input type="checkbox" ${isDark ? 'checked' : ''} onchange="App.setTheme(this.checked ? 'dark' : 'light')" /><span class="toggle-slider"></span></label>
        </div>
        <div class="settings-row">
          <div><div class="settings-row-label">Auto Theme</div><div class="settings-row-desc">Follow system theme preference</div></div>
          <label class="toggle"><input type="checkbox" id="autoThemeToggle" ${Store.get('autoTheme', false) ? 'checked' : ''} onchange="App.toggleAutoTheme(this.checked)" /><span class="toggle-slider"></span></label>
        </div>
      </div>
      <div class="settings-section">
        <div class="settings-section-title">Notifications</div>
        <div class="settings-section-desc">Manage notification preferences</div>
        <div class="settings-row">
          <div><div class="settings-row-label">Browser Notifications</div><div class="settings-row-desc">${notifications === 'granted' ? '✅ Enabled' : notifications === 'denied' ? '❌ Blocked' : 'Not requested'}</div></div>
          <button class="btn btn-outline btn-sm" onclick="Notify.requestPermission().then(r => Toast.success(r ? 'Notifications enabled!' : 'Permission denied'))">Request</button>
        </div>
      </div>
      <div class="settings-section">
        <div class="settings-section-title">Data Management</div>
        <div class="settings-section-desc">Export, import, and backup your data (${size} MB used)</div>
        <div class="settings-row">
          <div><div class="settings-row-label">Export Data</div><div class="settings-row-desc">Download all data as JSON</div></div>
          <button class="btn btn-outline btn-sm" onclick="Settings.exportData()">📥 Export</button>
        </div>
        <div class="settings-row">
          <div><div class="settings-row-label">Import Data</div><div class="settings-row-desc">Restore data from a JSON file</div></div>
          <button class="btn btn-outline btn-sm" onclick="Settings.importData()">📤 Import</button>
        </div>
        <div class="settings-row">
          <div><div class="settings-row-label">Create Backup</div><div class="settings-row-desc">Save a backup snapshot</div></div>
          <button class="btn btn-outline btn-sm" onclick="Settings.createBackup()">💾 Backup</button>
        </div>
        <div class="settings-row">
          <div><div class="settings-row-label">Restore Backup</div><div class="settings-row-desc">Restore from a backup file</div></div>
          <button class="btn btn-outline btn-sm" onclick="Settings.restoreBackup()">🔄 Restore</button>
        </div>
      </div>
      <div class="settings-section settings-danger">
        <div class="settings-section-title">Danger Zone</div>
        <div class="settings-section-desc">Irreversible actions</div>
        <div class="settings-row">
          <div><div class="settings-row-label" style="color:var(--danger)">Reset All Data</div><div class="settings-row-desc">Delete all your data permanently</div></div>
          <button class="btn btn-danger btn-sm" onclick="Settings.resetAll()">🗑️ Reset</button>
        </div>
      </div>
      <div class="settings-section">
        <div class="settings-section-title">About</div>
        <div style="font-size:0.85rem;color:var(--text-secondary);line-height:1.7">
          <p><strong>StudiaOS</strong> v1.0 — Student Productivity Operating System</p>
          <p>Built with HTML, CSS, and Vanilla JavaScript.</p>
          <p>All data is stored locally in your browser.</p>
          <p style="margin-top:8px">🏆 Achievements unlocked: ${(Store.get('achievements', [])).length} / ${Achievements.list.length}</p>
          <p>⭐ Total XP: ${Store.get('xp', 0)}</p>
        </div>
      </div>
    `;
  },
  downloadFile(content, filename) {
    const blob = new Blob([content], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const isMobile = /iPad|iPhone|iPod|Android/i.test(navigator.userAgent);
    if (isMobile) {
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 200);
      Toast.success('File downloaded!');
    } else {
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
      Toast.success('File downloaded!');
    }
  },
  getFileInput() {
    let input = document.getElementById('settingsFileInput');
    if (!input) {
      input = document.createElement('input');
      input.id = 'settingsFileInput';
      input.type = 'file';
      input.accept = '.json';
      input.style.position = 'fixed';
      input.style.top = '-9999px';
      input.style.left = '-9999px';
      input.style.opacity = '0';
      input.style.zIndex = '-1';
      document.body.appendChild(input);
    }
    return input;
  },
  exportData() {
    const json = Store.exportJSON();
    this.downloadFile(json, `studiaos-export-${today()}.json`);
  },
  importData() {
    const input = this.getFileInput();
    input.value = '';
    const handler = (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        const ok = Store.importJSON(ev.target.result);
        if (ok) {
          Toast.success('Data imported!');
          App.initAll();
        } else {
          Toast.error('Invalid JSON file');
        }
      };
      reader.readAsText(file);
      input.removeEventListener('change', handler);
    };
    input.addEventListener('change', handler);
    input.click();
  },
  createBackup() {
    const backup = Store.createBackup();
    this.downloadFile(JSON.stringify(backup, null, 2), `studiaos-backup-${today()}.json`);
  },
  restoreBackup() {
    const input = this.getFileInput();
    input.value = '';
    const handler = (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const data = JSON.parse(ev.target.result);
          if (data._version) {
            Store.restoreBackup(data);
            Toast.success('Backup restored!');
            App.initAll();
          } else {
            Toast.error('Not a valid backup file');
          }
        } catch { Toast.error('Invalid file'); }
      };
      reader.readAsText(file);
      input.removeEventListener('change', handler);
    };
    input.addEventListener('change', handler);
    input.click();
  },
  resetAll() {
    Modal.confirm('Reset All Data', 'This will permanently delete ALL your data including tasks, notes, habits, goals, images, voice recordings, and settings. This action cannot be undone. Are you sure?').then(ok => {
      if (!ok) return;
      Modal.show({
        title: 'Final Confirmation',
        body: `<p style="color:var(--text-secondary);line-height:1.6;margin-bottom:12px">Type <strong>DELETE</strong> below to confirm permanent deletion of all data:</p>
          <input class="input" id="resetConfirmInput" placeholder="Type DELETE here" />`,
        footer: `<button class="btn btn-ghost" onclick="Modal.close()">Cancel</button><button class="btn btn-danger" id="resetFinalBtn">Delete Everything</button>`
      });
      document.getElementById('resetFinalBtn').onclick = () => {
        if (document.getElementById('resetConfirmInput').value.trim() === 'DELETE') {
          Store.clearAll();
          Modal.close();
          Toast.success('All data cleared!');
          App.initAll();
        } else {
          Toast.warning('Please type DELETE to confirm');
        }
      };
    });
  }
};

/* =====================
   APP CONTROLLER
   ===================== */
const App = {
  currentModule: 'dashboard',

  init() {
    this.initTheme();
    this.initSidebar();
    this.initNavigation();
    this.initKeyboardShortcuts();
    this.initAll();
  },

  initAll() {
    this.navigate('dashboard');
  },

  initTheme() {
    const autoTheme = Store.get('autoTheme', false);
    if (autoTheme) {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      document.body.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
    } else {
      const saved = Store.get('theme', 'light');
      document.body.setAttribute('data-theme', saved);
    }
    this.updateThemeBtn();
  },

  setTheme(theme) {
    document.body.setAttribute('data-theme', theme);
    Store.set('theme', theme);
    Store.set('autoTheme', false);
    const toggle = document.getElementById('autoThemeToggle');
    if (toggle) toggle.checked = false;
    this.updateThemeBtn();
  },

  toggleAutoTheme(on) {
    Store.set('autoTheme', on);
    if (on) {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      document.body.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
    } else {
      document.body.setAttribute('data-theme', Store.get('theme', 'light'));
    }
    this.updateThemeBtn();
  },

  updateThemeBtn() {
    const btn = document.getElementById('themeBtn');
    if (btn) {
      const isDark = document.body.getAttribute('data-theme') === 'dark';
      btn.textContent = isDark ? '☀️' : '🌙';
    }
  },

  initSidebar() {
    document.getElementById('hamburgerBtn').onclick = () => {
      document.getElementById('sidebar').classList.toggle('open');
    };
    document.getElementById('sidebarCollapse').onclick = () => {
      const sidebar = document.getElementById('sidebar');
      if (window.innerWidth <= 768) {
        sidebar.classList.remove('open');
      } else {
        sidebar.classList.toggle('collapsed');
      }
    };
    document.getElementById('themeBtn').onclick = () => {
      const isDark = document.body.getAttribute('data-theme') === 'dark';
      this.setTheme(isDark ? 'light' : 'dark');
    };
    document.addEventListener('click', (e) => {
      const sidebar = document.getElementById('sidebar');
      if (window.innerWidth <= 768 && sidebar.classList.contains('open') && !sidebar.contains(e.target) && !document.getElementById('hamburgerBtn').contains(e.target)) {
        sidebar.classList.remove('open');
      }
    });
  },

  initNavigation() {
    document.getElementById('sidebarNav').addEventListener('click', (e) => {
      const item = e.target.closest('.nav-item');
      if (item) {
        e.preventDefault();
        const module = item.dataset.module;
        this.navigate(module);
        if (window.innerWidth <= 768) {
          document.getElementById('sidebar').classList.remove('open');
        }
      }
    });

    window.addEventListener('hashchange', () => {
      const hash = window.location.hash.replace('#', '') || 'dashboard';
      if (hash !== this.currentModule) this.navigate(hash);
    });

    const initialHash = window.location.hash.replace('#', '') || 'dashboard';
    if (initialHash !== this.currentModule) {
      this.navigate(initialHash);
    }
  },

  navigate(module) {
    const modules = {
      dashboard: Dashboard,
      planner: Planner,
      pomodoro: Pomodoro,
      goals: Goals,
      habits: Habits,
      notes: Notes,
      budget: Budget,
      images: Images,
      voice: Voice,
      analytics: Analytics,
      settings: Settings
    };

    if (!modules[module]) return;

    if (module !== 'pomodoro' && (Pomodoro.state === 'running' || Pomodoro.state === 'paused')) {
      Pomodoro.pause();
    }
    if (module !== 'voice' && Voice.animationId) {
      cancelAnimationFrame(Voice.animationId);
      Voice.animationId = null;
    }

    this.currentModule = module;
    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
    document.querySelector(`.nav-item[data-module="${module}"]`)?.classList.add('active');
    document.getElementById('pageTitle').textContent = document.querySelector(`.nav-item[data-module="${module}"] .nav-label`)?.textContent || module;
    window.location.hash = module;

    modules[module].init();
  },

  initKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key.toLowerCase()) {
          case 'n':
            e.preventDefault();
            this.navigate('notes');
            setTimeout(() => Notes.newNote(), 100);
            break;
          case 't':
            e.preventDefault();
            this.navigate('planner');
            setTimeout(() => Planner.showForm(), 100);
            break;
          case 'p':
            e.preventDefault();
            this.navigate('pomodoro');
            break;
          case 'd':
            e.preventDefault();
            this.navigate('dashboard');
            break;
          case ',':
            e.preventDefault();
            this.navigate('settings');
            break;
        }
      }
      if (e.key === 'Escape') {
        Modal.close();
        Images.closeLightbox();
      }
    });
  }
};

/* ===== INIT ===== */
document.addEventListener('DOMContentLoaded', () => App.init());
