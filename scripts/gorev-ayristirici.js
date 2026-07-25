/**
 * Görev Ayrıştırıcı — istemci tarafı
 *
 * Burada API anahtarı YOKTUR ve olmamalıdır. Sayfa yalnızca kendi proxy'mize
 * { text } gönderir; model, system prompt ve anahtar Cloudflare Worker'da durur.
 * Worker kaynağı: worker/worker.js
 */
(function () {
  'use strict';

  /* ============================================================
   * AYAR — deploy sonrası burayı doldur
   * ========================================================== */
  const CONFIG = Object.freeze({
    // `npx wrangler deploy` çıktısındaki adres. Örn:
    //   https://gorev-ayristirici-api.KULLANICI_ADIN.workers.dev
    API_ENDPOINT: 'https://gorev-ayristirici-api.emirhan-acr.workers.dev',

    STORAGE_KEY: 'gorev_ayristirici_tasks',
    MAX_INPUT_CHARS: 2000,

    CATEGORIES: Object.freeze([
      { id: 'İş',      icon: 'ph-briefcase',              tone: 'text-accent',   rule: 'from-accent/40' },
      { id: 'Kişisel', icon: 'ph-user',                   tone: 'text-accent',   rule: 'from-accent/40' },
      { id: 'Finans',  icon: 'ph-currency-circle-dollar', tone: 'text-accent',   rule: 'from-accent/40' },
      { id: 'Acil',    icon: 'ph-warning',                tone: 'text-red-400',  rule: 'from-red-500/40' },
      { id: 'Diğer',   icon: 'ph-dots-three-circle',      tone: 'text-muted',    rule: 'from-white/20' },
    ]),
  });

  const VALID_CATEGORIES = CONFIG.CATEGORIES.map((c) => c.id);
  const FALLBACK_CATEGORY = 'Diğer';

  const LABEL_BASE = 'min-w-0 flex-1 cursor-pointer break-words text-sm leading-relaxed text-ink/85 transition';
  const LABEL_DONE = 'line-through opacity-40';

  /* ============================================================
   * DOM
   * ========================================================== */
  const DOM = {
    taskInput: document.getElementById('taskInput'),
    charCount: document.getElementById('charCount'),
    parseBtn: document.getElementById('parseBtn'),
    parseBtnIcon: document.getElementById('parseBtnIcon'),
    parseBtnLabel: document.getElementById('parseBtnLabel'),

    errorBanner: document.getElementById('errorBanner'),
    errorBannerText: document.getElementById('errorBannerText'),
    errorBannerClose: document.getElementById('errorBannerClose'),

    board: document.getElementById('board'),
    statsPill: document.getElementById('statsPill'),
    statsText: document.getElementById('statsText'),

    clearCompletedBtn: document.getElementById('clearCompletedBtn'),
    clearAllBtn: document.getElementById('clearAllBtn'),
    clearAllIcon: document.getElementById('clearAllIcon'),
    clearAllLabel: document.getElementById('clearAllLabel'),

    toastContainer: document.getElementById('toastContainer'),
  };

  /* ============================================================
   * Storage — hiçbir koşulda patlamaz
   * ========================================================== */
  const Storage = {
    read(key, fallback) {
      try {
        const raw = localStorage.getItem(key);
        return raw === null ? fallback : JSON.parse(raw);
      } catch (_) {
        return fallback;
      }
    },
    write(key, value) {
      try {
        localStorage.setItem(key, JSON.stringify(value));
        return true;
      } catch (_) {
        return false;
      }
    },
  };

  /* ============================================================
   * State
   * ========================================================== */
  const State = {
    tasks: [],

    hydrate() {
      const stored = Storage.read(CONFIG.STORAGE_KEY, []);
      State.tasks = Array.isArray(stored) ? stored.filter(isValidTask).map(normalizeTask) : [];
    },

    persist() { Storage.write(CONFIG.STORAGE_KEY, State.tasks); },

    addTasks(incoming) {
      // Ham metin olduğu gibi saklanır; kaçış işlemi render sırasında yapılır.
      const created = incoming.map((item) => ({
        id: makeId(),
        task: item.task,
        category: VALID_CATEGORIES.includes(item.category) ? item.category : FALLBACK_CATEGORY,
        completed: false,
        createdAt: Date.now(),
      }));
      State.tasks = State.tasks.concat(created);
      State.persist();
      return created.length;
    },

    toggle(id) {
      const task = State.tasks.find((t) => t.id === id);
      if (!task) return null;
      task.completed = !task.completed;
      State.persist();
      return task;
    },

    remove(id) {
      const before = State.tasks.length;
      State.tasks = State.tasks.filter((t) => t.id !== id);
      if (State.tasks.length !== before) State.persist();
      return before - State.tasks.length;
    },

    clearCompleted() {
      const before = State.tasks.length;
      State.tasks = State.tasks.filter((t) => !t.completed);
      if (State.tasks.length !== before) State.persist();
      return before - State.tasks.length;
    },

    clearAll() {
      const count = State.tasks.length;
      State.tasks = [];
      State.persist();
      return count;
    },

    stats() {
      return {
        total: State.tasks.length,
        done: State.tasks.filter((t) => t.completed).length,
      };
    },
  };

  function makeId() {
    return 'g_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8);
  }

  function isValidTask(t) {
    return t && typeof t === 'object' && typeof t.task === 'string' && t.task.trim().length > 0;
  }

  function normalizeTask(t) {
    return {
      id: typeof t.id === 'string' && t.id ? t.id : makeId(),
      task: t.task.trim(),
      category: VALID_CATEGORIES.includes(t.category) ? t.category : FALLBACK_CATEGORY,
      completed: t.completed === true,
      createdAt: typeof t.createdAt === 'number' ? t.createdAt : Date.now(),
    };
  }

  /* ============================================================
   * Toast
   * ========================================================== */
  const Toast = {
    VARIANTS: {
      success: { icon: 'ph-fill ph-check-circle', border: 'border-accent/30', tone: 'text-accent' },
      error:   { icon: 'ph-fill ph-warning-circle', border: 'border-red-500/30', tone: 'text-red-400' },
      info:    { icon: 'ph-fill ph-info', border: 'border-white/15', tone: 'text-muted' },
    },

    show(message, variant, duration) {
      const style = Toast.VARIANTS[variant] || Toast.VARIANTS.info;
      const el = document.createElement('div');
      el.className =
        'pointer-events-auto flex translate-x-4 items-start gap-3 rounded-2xl border bg-panel p-4 opacity-0 shadow-[0_10px_40px_-12px_rgba(0,0,0,0.8)] transition-all duration-300 ease-out ' +
        style.border;
      el.setAttribute('role', variant === 'error' ? 'alert' : 'status');

      const icon = document.createElement('i');
      // `text-base` temada renk üretiyor (bkz. tailwind-config.js), bu yüzden
      // ikon boyutu için arbitrary değer kullanılıyor.
      icon.className = style.icon + ' mt-0.5 shrink-0 text-[16px] ' + style.tone;

      const text = document.createElement('p');
      text.className = 'min-w-0 flex-1 break-words text-sm text-ink/85';
      text.textContent = message;

      const close = document.createElement('button');
      close.type = 'button';
      close.setAttribute('aria-label', 'Kapat');
      close.className = 'shrink-0 rounded-full p-0.5 text-muted transition hover:text-ink focus-ring';
      close.innerHTML = '<i class="ph ph-x text-xs"></i>';

      let dismissed = false;
      const dismiss = () => {
        if (dismissed) return;
        dismissed = true;
        clearTimeout(timer);
        el.classList.add('translate-x-4', 'opacity-0');
        setTimeout(() => el.remove(), 300);
      };

      close.addEventListener('click', dismiss);
      el.append(icon, text, close);
      DOM.toastContainer.appendChild(el);

      requestAnimationFrame(() => el.classList.remove('translate-x-4', 'opacity-0'));
      const timer = setTimeout(dismiss, typeof duration === 'number' ? duration : 4000);
    },

    success(m) { Toast.show(m, 'success'); },
    error(m)   { Toast.show(m, 'error', 6000); },
    info(m)    { Toast.show(m, 'info'); },
  };

  /* ============================================================
   * API — kendi proxy'mize konuşur
   * ========================================================== */
  const API = {
    async parseTasks(text) {
      let response;
      try {
        response = await fetch(CONFIG.API_ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text }),
        });
      } catch (_) {
        throw new Error('Sunucuya ulaşılamadı. İnternet bağlantını kontrol edip tekrar dene.');
      }

      let data = null;
      try {
        data = await response.json();
      } catch (_) { /* gövde JSON değil — aşağıda status'a göre mesaj üretilir */ }

      if (!response.ok) {
        throw new Error((data && data.error) || 'İstek başarısız oldu (' + response.status + ').');
      }

      if (!data || !Array.isArray(data.tasks)) {
        throw new Error('Sunucudan beklenmeyen bir yanıt geldi.');
      }

      return data.tasks;
    },
  };

  /* ============================================================
   * UI
   * ========================================================== */
  const UI = {
    renderBoard() {
      const grouped = State.tasks.reduce((acc, task) => {
        const key = VALID_CATEGORIES.includes(task.category) ? task.category : FALLBACK_CATEGORY;
        (acc[key] = acc[key] || []).push(task);
        return acc;
      }, {});

      const fragment = document.createDocumentFragment();
      CONFIG.CATEGORIES.forEach((meta) => {
        fragment.appendChild(UI.createColumn(meta, grouped[meta.id] || []));
      });

      DOM.board.replaceChildren(fragment);
      UI.updateStats();
    },

    createColumn(meta, tasks) {
      const column = document.createElement('div');
      column.className = 'flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-panel';

      const rule = document.createElement('div');
      rule.className = 'h-px w-full bg-gradient-to-r to-transparent ' + meta.rule;

      const header = document.createElement('div');
      header.className = 'flex items-center gap-2.5 border-b border-white/10 px-4 py-3';

      const icon = document.createElement('i');
      icon.className = 'ph-bold ' + meta.icon + ' text-sm ' + meta.tone;

      const title = document.createElement('h2');
      title.className = 'flex-1 truncate font-mono text-[11px] uppercase tracking-[0.15em] text-ink';
      title.textContent = meta.id;

      const badge = document.createElement('span');
      badge.className = 'rounded-full bg-white/5 px-2 py-0.5 font-mono text-[10px] tabular-nums text-muted';
      badge.textContent = String(tasks.length);

      header.append(icon, title, badge);

      const body = document.createElement('div');
      body.className = 'flex-1 p-2';

      if (tasks.length === 0) {
        const empty = document.createElement('p');
        empty.className = 'px-2 py-8 text-center font-mono text-[10px] uppercase tracking-[0.15em] text-muted/40';
        empty.textContent = 'Boş';
        body.appendChild(empty);
      } else {
        const list = document.createElement('ul');
        list.className = 'space-y-0.5';
        tasks.forEach((task) => list.appendChild(UI.createTaskEl(task)));
        body.appendChild(list);
      }

      column.append(rule, header, body);
      return column;
    },

    createTaskEl(task) {
      const item = document.createElement('li');
      item.className = 'group flex items-start gap-2.5 rounded-xl px-2 py-2 transition-colors hover:bg-white/5';
      item.dataset.id = task.id;

      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.id = task.id;
      checkbox.checked = task.completed;
      checkbox.dataset.action = 'toggle';
      checkbox.className = 'mt-0.5 h-4 w-4 shrink-0 cursor-pointer rounded border-white/20 bg-base accent-accent focus-ring';

      const label = document.createElement('label');
      label.htmlFor = task.id;
      label.dataset.role = 'label';
      label.className = LABEL_BASE + (task.completed ? ' ' + LABEL_DONE : '');
      // Görev metninin DOM'a girdiği TEK yer. innerHTML asla kullanılmaz.
      label.textContent = task.task;

      const del = document.createElement('button');
      del.type = 'button';
      del.dataset.action = 'delete';
      del.setAttribute('aria-label', 'Görevi sil');
      del.className = 'shrink-0 rounded-full p-1 text-muted/50 opacity-0 transition hover:bg-red-500/10 hover:text-red-400 focus:opacity-100 group-hover:opacity-100 focus-ring';
      del.innerHTML = '<i class="ph ph-trash pointer-events-none text-xs"></i>';

      item.append(checkbox, label, del);
      return item;
    },

    /** Tek satırı yerinde günceller — tüm panoyu yeniden çizmez. */
    paintTask(id, completed) {
      const row = DOM.board.querySelector('[data-id="' + CSS.escape(id) + '"]');
      if (!row) return;
      const label = row.querySelector('[data-role="label"]');
      if (label) label.className = LABEL_BASE + (completed ? ' ' + LABEL_DONE : '');
      UI.updateStats();
    },

    updateStats() {
      const { total, done } = State.stats();
      DOM.statsText.textContent = done + ' / ' + total;
      DOM.statsPill.classList.toggle('hidden', total === 0);
      DOM.statsPill.classList.toggle('inline-flex', total > 0);
    },

    updateCharCount() {
      const len = DOM.taskInput.value.length;
      DOM.charCount.textContent = len + ' / ' + CONFIG.MAX_INPUT_CHARS;
      DOM.charCount.classList.toggle('text-red-400', len >= CONFIG.MAX_INPUT_CHARS);
    },

    setLoading(isLoading) {
      DOM.parseBtn.disabled = isLoading;
      DOM.parseBtnIcon.className = isLoading
        ? 'ph-bold ph-spinner animate-spin text-sm'
        : 'ph-bold ph-sparkle text-sm';
      DOM.parseBtnLabel.textContent = isLoading ? 'Ayrıştırılıyor' : 'Ayrıştır';
    },

    showError(message) {
      DOM.errorBannerText.textContent = message;
      DOM.errorBanner.classList.remove('hidden');
    },

    hideError() {
      DOM.errorBanner.classList.add('hidden');
      DOM.errorBannerText.textContent = '';
    },
  };

  /* ============================================================
   * Ana akış
   * ========================================================== */
  async function processText() {
    const text = DOM.taskInput.value.trim();

    if (CONFIG.API_ENDPOINT.includes('DEGISTIR')) {
      const msg = 'API adresi henüz ayarlanmamış. scripts/gorev-ayristirici.js içindeki API_ENDPOINT değerini Worker adresinle değiştir.';
      UI.showError(msg);
      Toast.error(msg);
      return;
    }

    if (!text) {
      Toast.info('Önce ayrıştırılacak bir şeyler yaz.');
      DOM.taskInput.focus();
      return;
    }

    UI.hideError();
    UI.setLoading(true);

    try {
      const parsed = await API.parseTasks(text);

      if (parsed.length === 0) {
        Toast.info('Metinde ayrıştırılabilir bir görev bulunamadı.');
        return;
      }

      const added = State.addTasks(parsed);
      UI.renderBoard();
      DOM.taskInput.value = '';
      UI.updateCharCount();
      Toast.success(added + ' görev eklendi.');
    } catch (error) {
      const message = error && error.message ? error.message : 'Beklenmeyen bir hata oluştu.';
      UI.showError(message);
      Toast.error(message);
    } finally {
      UI.setLoading(false);
    }
  }

  /* ============================================================
   * Olaylar
   * ========================================================== */
  function bindEvents() {
    DOM.parseBtn.addEventListener('click', processText);

    DOM.taskInput.addEventListener('input', UI.updateCharCount);

    DOM.taskInput.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        if (!DOM.parseBtn.disabled) processText();
      }
    });

    DOM.errorBannerClose.addEventListener('click', UI.hideError);

    /* --- pano (olay delegasyonu) --- */
    DOM.board.addEventListener('change', (e) => {
      if (!e.target || e.target.dataset.action !== 'toggle') return;
      const row = e.target.closest('[data-id]');
      if (!row) return;
      const task = State.toggle(row.dataset.id);
      if (task) UI.paintTask(task.id, task.completed);
    });

    DOM.board.addEventListener('click', (e) => {
      const button = e.target.closest('[data-action="delete"]');
      if (!button) return;
      const row = button.closest('[data-id]');
      if (row && State.remove(row.dataset.id)) {
        UI.renderBoard();
        Toast.info('Görev silindi.');
      }
    });

    /* --- toplu işlemler --- */
    DOM.clearCompletedBtn.addEventListener('click', () => {
      const removed = State.clearCompleted();
      if (removed === 0) {
        Toast.info('Tamamlanmış görev yok.');
        return;
      }
      UI.renderBoard();
      Toast.success(removed + ' görev temizlendi.');
    });

    /* İki adımlı onay — native confirm() kullanılmaz. */
    let disarmTimer = null;
    const disarm = () => {
      clearTimeout(disarmTimer);
      disarmTimer = null;
      DOM.clearAllBtn.dataset.armed = 'false';
      DOM.clearAllLabel.textContent = 'Tümünü Sil';
      DOM.clearAllIcon.className = 'ph ph-trash text-xs';
      DOM.clearAllBtn.classList.remove('border-red-500/50', 'text-red-400');
    };

    DOM.clearAllBtn.addEventListener('click', () => {
      if (State.tasks.length === 0) {
        Toast.info('Pano zaten boş.');
        return;
      }

      if (DOM.clearAllBtn.dataset.armed !== 'true') {
        DOM.clearAllBtn.dataset.armed = 'true';
        DOM.clearAllLabel.textContent = 'Emin misin?';
        DOM.clearAllIcon.className = 'ph ph-warning text-xs';
        DOM.clearAllBtn.classList.add('border-red-500/50', 'text-red-400');
        disarmTimer = setTimeout(disarm, 3000);
        return;
      }

      const removed = State.clearAll();
      disarm();
      UI.renderBoard();
      Toast.success(removed + ' görev silindi.');
    });
  }

  /* ============================================================
   * init
   * ========================================================== */
  function init() {
    State.hydrate();
    bindEvents();
    UI.renderBoard();
    UI.updateCharCount();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
