/**
 * Görev Ayrıştırıcı — istemci tarafı
 *
 * Burada API anahtarı YOKTUR ve olmamalıdır. Sayfa yalnızca kendi proxy'mize
 * { text } gönderir; model, system prompt ve anahtar Cloudflare Worker'da durur.
 * Worker kaynağı: worker/worker.js
 *
 * İki pano tek sayfada: üstte kişisel (5 kategori), altta geliştirme (3 kategori).
 * Hangi görevin hangi panoya ait olduğu KATEGORİDEN TÜRETİLİR — kayıtlarda ayrıca
 * saklanmaz. Bu sayede eski kayıtlar şema değişmeden geçerli kalır ve sürükle-bırak
 * yalnızca `category` alanını değiştirir.
 */
(function () {
  'use strict';

  /* ============================================================
   * AYAR
   * ========================================================== */
  const CONFIG = Object.freeze({
    // Kendi zone'umuzdaki özel alan adı (worker/wrangler.toml → [[routes]]).
    // Paylaşılan workers.dev alan adında tekrarlayan bağlantı kopmaları (ERR_CONNECTION_RESET)
    // yaşandığı için buraya taşındı; workers.dev route'u yedek olarak hâlâ açık.
    API_ENDPOINT: 'https://api.emirhanacr.com',
    // Aynı Worker'daki paylaşılan pano uçları — worker/worker.js → handleBoard.
    BOARD_ENDPOINT: 'https://api.emirhanacr.com/board',

    STORAGE_KEY: 'gorev_ayristirici_tasks',
    ROOM_CODE_KEY: 'gorev_ayristirici_room_code',
    COLLAPSE_PREFIX: 'gorev_ayristirici_collapsed_',
    MAX_INPUT_CHARS: 2000,
    SYNC_POLL_MS: 5000,
    SYNC_PUSH_DEBOUNCE_MS: 600,

    // DOM id'leri bölüm adından türetilir: board-X / count-X / toggle-X /
    // toggleIcon-X / toggleLabel-X. Yeni bölüm eklerken HTML'de aynı kalıba uy.
    BOARDS: Object.freeze([
      {
        id: 'kisisel',
        label: 'Kişisel',
        categories: Object.freeze([
          { id: 'İş',      icon: 'ph-briefcase',              tone: 'text-accent',  rule: 'from-accent/40' },
          { id: 'Kişisel', icon: 'ph-user',                   tone: 'text-accent',  rule: 'from-accent/40' },
          { id: 'Finans',  icon: 'ph-currency-circle-dollar', tone: 'text-accent',  rule: 'from-accent/40' },
          { id: 'Acil',    icon: 'ph-warning',                tone: 'text-red-400', rule: 'from-red-500/40' },
          { id: 'Diğer',   icon: 'ph-dots-three-circle',      tone: 'text-muted',   rule: 'from-white/20' },
        ]),
      },
      {
        id: 'gelistirme',
        label: 'geliştirme',
        categories: Object.freeze([
          { id: 'Bug',       icon: 'ph-bug',         tone: 'text-red-400', rule: 'from-red-500/40' },
          { id: 'Eklenecek', icon: 'ph-plus-circle', tone: 'text-accent',  rule: 'from-accent/40' },
          { id: 'Test',      icon: 'ph-flask',       tone: 'text-accent',  rule: 'from-accent/40' },
        ]),
      },
      {
        // Üretim boru hattı — kolon sırası bilinçli olarak iş akışını izler.
        id: 'sanat',
        label: 'sanat',
        categories: Object.freeze([
          { id: 'Konsept',        icon: 'ph-pencil-simple',     tone: 'text-accent', rule: 'from-accent/40' },
          { id: 'Modelleme',      icon: 'ph-cube',              tone: 'text-accent', rule: 'from-accent/40' },
          { id: 'Doku',           icon: 'ph-paint-brush',       tone: 'text-accent', rule: 'from-accent/40' },
          // `id` worker sözlüğüyle birebir eşleşmek zorunda; `label` sadece kolon
          // başlığında görünür — tam adı 5 kolonlu ızgaraya sığmıyor.
          { id: 'Rig & Animasyon', label: 'Rig & Anim', icon: 'ph-person-simple-run', tone: 'text-accent', rule: 'from-accent/40' },
          { id: 'Entegrasyon',    icon: 'ph-package',           tone: 'text-accent', rule: 'from-accent/40' },
        ]),
      },
    ]),
  });

  const FALLBACK_CATEGORY = 'Diğer';

  // Kategori -> meta ve kategori -> pano eşlemeleri, tek kaynaktan türetilir.
  const CATEGORY_META = {};
  const BOARD_OF = {};
  CONFIG.BOARDS.forEach((board) => {
    board.categories.forEach((cat) => {
      CATEGORY_META[cat.id] = cat;
      BOARD_OF[cat.id] = board.id;
    });
  });
  const VALID_CATEGORIES = Object.keys(CATEGORY_META);

  // worker.js → BOARD_CODE_RE ile birebir aynı alfabe (0/O/1/I/L karışabildiği için hariç).
  const ROOM_CODE_ALPHABET = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';
  const ROOM_CODE_RE = /^[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{8}$/;

  /** 256 % 32 === 0 olduğu için modulo önyargısı (bias) yok. */
  function generateRoomCode() {
    const bytes = new Uint8Array(8);
    crypto.getRandomValues(bytes);
    let code = '';
    for (let i = 0; i < bytes.length; i++) code += ROOM_CODE_ALPHABET[bytes[i] % ROOM_CODE_ALPHABET.length];
    return code;
  }

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

    statsPill: document.getElementById('statsPill'),
    statsText: document.getElementById('statsText'),

    roomCodePill: document.getElementById('roomCodePill'),
    roomCodeText: document.getElementById('roomCodeText'),
    roomCodeCopyBtn: document.getElementById('roomCodeCopyBtn'),

    joinCodeBtn: document.getElementById('joinCodeBtn'),
    joinCodePanel: document.getElementById('joinCodePanel'),
    joinCodeInput: document.getElementById('joinCodeInput'),
    joinCodeConfirmBtn: document.getElementById('joinCodeConfirmBtn'),
    joinCodeCancelBtn: document.getElementById('joinCodeCancelBtn'),

    clearCompletedBtn: document.getElementById('clearCompletedBtn'),
    clearAllBtn: document.getElementById('clearAllBtn'),
    clearAllIcon: document.getElementById('clearAllIcon'),
    clearAllLabel: document.getElementById('clearAllLabel'),

    toastContainer: document.getElementById('toastContainer'),
  };

  /** Bir bölümün DOM elemanlarını id kalıbından toplar. */
  function boardEls(boardId) {
    return {
      mount: document.getElementById('board-' + boardId),
      count: document.getElementById('count-' + boardId),
      toggle: document.getElementById('toggle-' + boardId),
      icon: document.getElementById('toggleIcon-' + boardId),
      label: document.getElementById('toggleLabel-' + boardId),
    };
  }

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

    persist() {
      Storage.write(CONFIG.STORAGE_KEY, State.tasks);
      Sync.schedulePush();
    },

    /** Sunucudan gelen veriyi yerel önbelleğe yazar — bulut yazımını TEKRAR tetiklemez. */
    persistFromRemote() { Storage.write(CONFIG.STORAGE_KEY, State.tasks); },

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
      return created;
    },

    toggle(id) {
      const task = State.tasks.find((t) => t.id === id);
      if (!task) return null;
      task.completed = !task.completed;
      State.persist();
      return task;
    },

    /** Sürükle-bırak sonucu: sadece kategori değişir, pano ondan türetilir. */
    move(id, category) {
      if (!VALID_CATEGORIES.includes(category)) return null;
      const task = State.tasks.find((t) => t.id === id);
      if (!task || task.category === category) return null;
      task.category = category;
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

    countForBoard(boardId) {
      return State.tasks.filter((t) => BOARD_OF[t.category] === boardId).length;
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
   * Sync — paylaşılan pano (oda kodu üzerinden Worker + KV)
   *
   * Her cihaz localStorage'da bir oda kodu tutar (yoksa otomatik üretilir).
   * Yerel State değiştikçe debounce'lu olarak sunucuya PUT edilir; sekme
   * görünürken birkaç saniyede bir GET ile diğer tarayıcılardaki değişiklikler
   * çekilir. Sunucu = son yazan kazanır modeliyle "doğru" kabul edilir; bekleyen
   * yerel bir yazım varken gelen poll sonucu uygulanmaz (yarım kalmasın diye).
   * ========================================================== */
  const Sync = {
    code: null,
    pushTimer: null,
    pushQueued: false,
    pushInFlight: false,
    pollTimer: null,
    lastKnownUpdatedAt: null,
    failCount: 0,

    init() {
      let code = Storage.read(CONFIG.ROOM_CODE_KEY, null);
      if (typeof code !== 'string' || !ROOM_CODE_RE.test(code)) {
        code = generateRoomCode();
        Storage.write(CONFIG.ROOM_CODE_KEY, code);
      }
      Sync.code = code;
      UI.renderRoomCode(code);

      Sync.pullInitial();
      Sync.startPolling();

      document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
          Sync.stopPolling();
        } else {
          Sync.startPolling();
          Sync.pull();
        }
      });
    },

    url() { return CONFIG.BOARD_ENDPOINT + '/' + Sync.code; },

    async pullInitial() {
      try {
        const response = await fetch(Sync.url());
        if (response.status === 404) {
          // Bu kod sunucuda henüz yok — yereldeki (varsa) görevler ilk kayıt olur.
          Sync.schedulePush(0);
          return;
        }
        if (!response.ok) return;
        const data = await response.json();
        Sync.applyRemote(data);
      } catch (_) { /* sessiz — yerel veriyle devam edilir */ }
    },

    async pull() {
      if (Sync.pushInFlight || Sync.pushQueued) return;
      try {
        const response = await fetch(Sync.url());
        if (!response.ok) return;
        const data = await response.json();
        if (data.updatedAt !== Sync.lastKnownUpdatedAt) Sync.applyRemote(data);
      } catch (_) { /* sessiz */ }
    },

    applyRemote(data) {
      if (!data || !Array.isArray(data.tasks)) return;
      Sync.lastKnownUpdatedAt = data.updatedAt;
      State.tasks = data.tasks.filter(isValidTask).map(normalizeTask);
      State.persistFromRemote();
      UI.renderBoards();
    },

    schedulePush(delay) {
      Sync.pushQueued = true;
      clearTimeout(Sync.pushTimer);
      Sync.pushTimer = setTimeout(
        Sync.push,
        typeof delay === 'number' ? delay : CONFIG.SYNC_PUSH_DEBOUNCE_MS
      );
    },

    async push() {
      if (Sync.pushInFlight) { Sync.pushQueued = true; return; }
      Sync.pushQueued = false;
      Sync.pushInFlight = true;

      try {
        const response = await fetch(Sync.url(), {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tasks: State.tasks }),
        });
        if (response.ok) {
          const data = await response.json();
          Sync.lastKnownUpdatedAt = data.updatedAt;
          Sync.failCount = 0;
        } else {
          Sync.failCount++;
        }
      } catch (_) {
        Sync.failCount++;
      } finally {
        Sync.pushInFlight = false;
        if (Sync.failCount === 3) {
          Toast.error('Değişiklikler buluta kaydedilemiyor. İnternet bağlantını kontrol et.');
        }
        if (Sync.pushQueued) Sync.push();
      }
    },

    startPolling() {
      if (Sync.pollTimer) return;
      Sync.pollTimer = setInterval(Sync.pull, CONFIG.SYNC_POLL_MS);
    },

    stopPolling() {
      clearInterval(Sync.pollTimer);
      Sync.pollTimer = null;
    },

    /**
     * Farklı bir oda koduna geçer — mevcut kodun verisi sunucuda olduğu gibi kalır.
     * `pullInitial()`'dan KASITLI olarak farklı davranır: orada 404, "ilk açılış,
     * yereldeki görevleri buluta taşı" anlamına gelir. Burada ise kullanıcı bilerek
     * başka bir odaya geçiyor — hedef kod boşsa (henüz kimse yazmamışsa) panoyu
     * BOŞALTMALIYIZ, yoksa önceki odanın görevleri sessizce yeni koda kopyalanır ve
     * ekranda hiçbir şey değişmemiş gibi görünür (tam da bildirilen hata buydu).
     */
    async joinCode(newCode) {
      Sync.stopPolling();
      clearTimeout(Sync.pushTimer);
      Sync.pushQueued = false;
      Sync.failCount = 0;
      Sync.lastKnownUpdatedAt = null;
      Sync.code = newCode;
      Storage.write(CONFIG.ROOM_CODE_KEY, newCode);
      UI.renderRoomCode(newCode);

      try {
        const response = await fetch(Sync.url());
        if (response.status === 404) {
          State.tasks = [];
          State.persistFromRemote();
          UI.renderBoards();
          Sync.schedulePush(0); // boş panoyu sunucuda oluştur
        } else if (response.ok) {
          Sync.applyRemote(await response.json());
        }
      } catch (_) { /* sessiz — bir sonraki poll dener */ }

      Sync.startPolling();
    },
  };

  /* ============================================================
   * Kısaltma (üst bölüm)
   * ========================================================== */
  const Collapse = {
    key(boardId) { return CONFIG.COLLAPSE_PREFIX + boardId; },

    isCollapsed(boardId) { return Storage.read(Collapse.key(boardId), false) === true; },

    apply(boardId, collapsed) {
      const els = boardEls(boardId);
      if (!els.mount || !els.toggle) return;
      els.mount.classList.toggle('hidden', collapsed);
      els.icon.className = 'ph ' + (collapsed ? 'ph-caret-down' : 'ph-caret-up') + ' text-xs';
      els.label.textContent = collapsed ? 'Göster' : 'Kısalt';
      els.toggle.setAttribute('aria-expanded', String(!collapsed));
    },

    toggle(boardId) {
      const next = !Collapse.isCollapsed(boardId);
      Storage.write(Collapse.key(boardId), next);
      Collapse.apply(boardId, next);
    },

    applyAll() {
      CONFIG.BOARDS.forEach((b) => Collapse.apply(b.id, Collapse.isCollapsed(b.id)));
    },
  };

  /* ============================================================
   * UI
   * ========================================================== */
  const UI = {
    renderBoards() {
      CONFIG.BOARDS.forEach((board) => {
        const mount = boardEls(board.id).mount;
        if (!mount) return;

        const grouped = {};
        board.categories.forEach((cat) => { grouped[cat.id] = []; });
        State.tasks.forEach((task) => {
          if (grouped[task.category]) grouped[task.category].push(task);
        });

        const fragment = document.createDocumentFragment();
        board.categories.forEach((cat) => {
          fragment.appendChild(UI.createColumn(cat, grouped[cat.id]));
        });
        mount.replaceChildren(fragment);
      });

      UI.updateStats();
    },

    createColumn(meta, tasks) {
      const column = document.createElement('div');
      column.className = 'flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-panel transition-colors';
      // Sürükle-bırak hedefi olarak bu öznitelik kullanılıyor.
      column.dataset.category = meta.id;

      const rule = document.createElement('div');
      rule.className = 'h-px w-full bg-gradient-to-r to-transparent ' + meta.rule;

      const header = document.createElement('div');
      header.className = 'flex items-center gap-2.5 border-b border-white/10 px-4 py-3';

      const icon = document.createElement('i');
      icon.className = 'ph-bold ' + meta.icon + ' text-sm ' + meta.tone;

      const title = document.createElement('h3');
      title.className = 'flex-1 truncate font-mono text-[11px] uppercase tracking-[0.15em] text-ink';
      title.textContent = meta.label || meta.id;
      if (meta.label) title.title = meta.id;   // kısaltılmışsa tam adı ipucunda göster

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
      const row = document.querySelector('[data-id="' + CSS.escape(id) + '"]');
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

      CONFIG.BOARDS.forEach((board) => {
        const el = boardEls(board.id).count;
        if (el) el.textContent = String(State.countForBoard(board.id));
      });
    },

    renderRoomCode(code) {
      DOM.roomCodeText.textContent = code;
      DOM.roomCodePill.classList.remove('hidden');
      DOM.roomCodePill.classList.add('inline-flex');
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
   * Sürükle-bırak — Pointer Events (fare + dokunmatik)
   *
   * Fare:       ~6px hareket eşiği aşılınca başlar.
   * Dokunmatik: ~250ms basılı tutulunca başlar; erken hareket olursa sayfa
   *             kaydırması olarak yorumlanıp sürükleme iptal edilir.
   * ========================================================== */
  const DRAG_THRESHOLD = 6;
  const HOLD_MS = 250;
  const EDGE_ZONE = 70;   // kenara bu kadar yaklaşınca otomatik kaydır
  const EDGE_SPEED = 12;

  const DragDrop = {
    pending: null,
    active: null,
    lastDragEnd: 0,

    onPointerDown(e) {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      if (DragDrop.active) return;

      const row = e.target.closest('li[data-id]');
      if (!row) return;
      // Onay kutusu ve silme butonu sürüklemeyi başlatmaz.
      if (e.target.closest('input, button')) return;

      const rect = row.getBoundingClientRect();
      const pending = {
        row,
        id: row.dataset.id,
        pointerId: e.pointerId,
        startX: e.clientX,
        startY: e.clientY,
        offsetX: e.clientX - rect.left,
        offsetY: e.clientY - rect.top,
        width: rect.width,
        touch: e.pointerType !== 'mouse',
        holdTimer: null,
      };
      DragDrop.pending = pending;

      if (pending.touch) {
        pending.holdTimer = setTimeout(() => {
          if (DragDrop.pending === pending) DragDrop.start(pending, pending.startX, pending.startY);
        }, HOLD_MS);
      }
    },

    onPointerMove(e) {
      const p = DragDrop.pending;
      if (p && e.pointerId === p.pointerId) {
        const dist = Math.hypot(e.clientX - p.startX, e.clientY - p.startY);
        if (p.touch) {
          // Basılı tutma dolmadan hareket = kaydırma niyeti, sürüklemeyi iptal et.
          if (dist > 10) DragDrop.clearPending();
        } else if (dist > DRAG_THRESHOLD) {
          DragDrop.start(p, e.clientX, e.clientY);
        }
        return;
      }

      const a = DragDrop.active;
      if (!a || e.pointerId !== a.pointerId) return;

      e.preventDefault();
      DragDrop.moveGhost(e.clientX, e.clientY);
      DragDrop.updateTarget(e.clientX, e.clientY);
      DragDrop.edgeScroll(e.clientY);
    },

    onPointerUp(e) {
      const p = DragDrop.pending;
      if (p && e.pointerId === p.pointerId) DragDrop.clearPending();

      const a = DragDrop.active;
      if (!a || e.pointerId !== a.pointerId) return;

      const targetCategory = a.target ? a.target.dataset.category : null;
      DragDrop.finish();

      if (targetCategory) {
        const moved = State.move(a.id, targetCategory);
        if (moved) {
          UI.renderBoards();
          Toast.success('"' + shorten(moved.task) + '" → ' + targetCategory);
        }
      }
    },

    onPointerCancel(e) {
      const p = DragDrop.pending;
      if (p && e.pointerId === p.pointerId) DragDrop.clearPending();
      if (DragDrop.active && e.pointerId === DragDrop.active.pointerId) DragDrop.finish();
    },

    clearPending() {
      if (DragDrop.pending && DragDrop.pending.holdTimer) clearTimeout(DragDrop.pending.holdTimer);
      DragDrop.pending = null;
    },

    start(pending, x, y) {
      DragDrop.clearPending();

      const ghost = pending.row.cloneNode(true);
      // Klon zaten textContent ile kurulmuş düğümlerden geliyor — XSS yüzeyi yok.
      ghost.style.position = 'fixed';
      ghost.style.width = pending.width + 'px';
      ghost.style.left = (x - pending.offsetX) + 'px';
      ghost.style.top = (y - pending.offsetY) + 'px';
      ghost.style.pointerEvents = 'none';
      ghost.style.zIndex = '70';
      ghost.style.transform = 'rotate(1.5deg) scale(1.02)';
      ghost.className += ' rounded-xl border border-accent/50 bg-panel shadow-[0_20px_50px_-12px_rgba(0,0,0,0.9)]';
      document.body.appendChild(ghost);

      pending.row.classList.add('opacity-30');
      document.body.style.userSelect = 'none';
      document.body.style.cursor = 'grabbing';

      DragDrop.active = {
        id: pending.id,
        row: pending.row,
        ghost,
        pointerId: pending.pointerId,
        offsetX: pending.offsetX,
        offsetY: pending.offsetY,
        target: null,
      };

      try { pending.row.setPointerCapture(pending.pointerId); } catch (_) { /* önemsiz */ }

      DragDrop.updateTarget(x, y);
    },

    moveGhost(x, y) {
      const a = DragDrop.active;
      a.ghost.style.left = (x - a.offsetX) + 'px';
      a.ghost.style.top = (y - a.offsetY) + 'px';
    },

    /**
     * Hedef kolonu her harekette yeniden hesaplar. Kolon sayısı en fazla 8
     * olduğu için maliyeti önemsiz; kaydırma sırasında bayatlamayı önler.
     */
    updateTarget(x, y) {
      const a = DragDrop.active;
      const columns = document.querySelectorAll('[data-category]');
      let found = null;

      for (const col of columns) {
        if (col.offsetParent === null) continue;   // kısaltılmış bölüm
        const r = col.getBoundingClientRect();
        if (x >= r.left && x <= r.right && y >= r.top && y <= r.bottom) { found = col; break; }
      }

      if (found === a.target) return;
      if (a.target) a.target.classList.remove('border-accent', 'bg-accent/5');
      a.target = found;
      if (found) found.classList.add('border-accent', 'bg-accent/5');
    },

    edgeScroll(y) {
      if (y < EDGE_ZONE) window.scrollBy(0, -EDGE_SPEED);
      else if (y > window.innerHeight - EDGE_ZONE) window.scrollBy(0, EDGE_SPEED);
    },

    finish() {
      const a = DragDrop.active;
      if (!a) return;
      try { a.row.releasePointerCapture(a.pointerId); } catch (_) { /* önemsiz */ }
      if (a.target) a.target.classList.remove('border-accent', 'bg-accent/5');
      a.ghost.remove();
      a.row.classList.remove('opacity-30');
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
      DragDrop.active = null;
      DragDrop.lastDragEnd = Date.now();
    },

    /** Sürükleme bittikten hemen sonraki tık, etiketin kutuyu işaretlemesini engellemek için yutulur. */
    swallowsClick() {
      return Date.now() - DragDrop.lastDragEnd < 250;
    },
  };

  function shorten(text) {
    return text.length > 32 ? text.slice(0, 32) + '…' : text;
  }

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

      const created = State.addTasks(parsed);
      UI.renderBoards();
      DOM.taskInput.value = '';
      UI.updateCharCount();

      // Hangi bölüme kaç madde düştüğünü bildir — biri kısaltılmışsa fark edilsin.
      const perBoard = {};
      created.forEach((t) => {
        const b = BOARD_OF[t.category];
        perBoard[b] = (perBoard[b] || 0) + 1;
      });
      const parts = CONFIG.BOARDS
        .filter((b) => perBoard[b.id])
        .map((b) => perBoard[b.id] + ' ' + b.label.toLocaleLowerCase('tr'));
      Toast.success(created.length + ' görev eklendi (' + parts.join(', ') + ').');
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

    /* --- oda kodu: kopyala / farklı koda katıl --- */
    DOM.roomCodeCopyBtn.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(Sync.code);
        Toast.success('Kod kopyalandı.');
      } catch (_) {
        Toast.error('Kopyalanamadı. Kodu elle seç: ' + Sync.code);
      }
    });

    DOM.joinCodeBtn.addEventListener('click', () => {
      const opening = DOM.joinCodePanel.classList.contains('hidden');
      DOM.joinCodePanel.classList.toggle('hidden');
      DOM.joinCodePanel.classList.toggle('flex');
      if (opening) DOM.joinCodeInput.focus();
    });

    DOM.joinCodeCancelBtn.addEventListener('click', () => {
      DOM.joinCodePanel.classList.add('hidden');
      DOM.joinCodePanel.classList.remove('flex');
      DOM.joinCodeInput.value = '';
    });

    const confirmJoinCode = async () => {
      const raw = DOM.joinCodeInput.value.trim().toUpperCase();
      if (!ROOM_CODE_RE.test(raw)) {
        Toast.error('Kod 8 karakter olmalı (0, O, 1, I, L kullanılmaz).');
        return;
      }
      if (raw === Sync.code) {
        Toast.info('Zaten bu kodun panosundasın.');
        return;
      }
      DOM.joinCodePanel.classList.add('hidden');
      DOM.joinCodePanel.classList.remove('flex');
      DOM.joinCodeInput.value = '';
      await Sync.joinCode(raw);
      UI.renderBoards();
      Toast.success('"' + raw + '" panosuna geçildi.');
    };

    DOM.joinCodeConfirmBtn.addEventListener('click', confirmJoinCode);
    DOM.joinCodeInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { e.preventDefault(); confirmJoinCode(); }
      if (e.key === 'Escape') DOM.joinCodeCancelBtn.click();
    });

    /* --- panolar (olay delegasyonu, her bölüm için) --- */
    CONFIG.BOARDS.forEach((board) => {
      const els = boardEls(board.id);
      const mount = els.mount;
      if (!mount) return;

      if (els.toggle) {
        els.toggle.addEventListener('click', () => Collapse.toggle(board.id));
      }

      // Sürükleme biter bitmez gelen tık, etiketin onay kutusunu işaretlemesine
      // yol açmasın diye yakalama aşamasında yutulur.
      mount.addEventListener('click', (e) => {
        if (DragDrop.swallowsClick()) {
          e.preventDefault();
          e.stopPropagation();
        }
      }, true);

      mount.addEventListener('change', (e) => {
        if (!e.target || e.target.dataset.action !== 'toggle') return;
        const row = e.target.closest('[data-id]');
        if (!row) return;
        const task = State.toggle(row.dataset.id);
        if (task) UI.paintTask(task.id, task.completed);
      });

      mount.addEventListener('click', (e) => {
        const button = e.target.closest('[data-action="delete"]');
        if (!button) return;
        const row = button.closest('[data-id]');
        if (row && State.remove(row.dataset.id)) {
          UI.renderBoards();
          Toast.info('Görev silindi.');
        }
      });

      mount.addEventListener('pointerdown', DragDrop.onPointerDown);
    });

    document.addEventListener('pointermove', DragDrop.onPointerMove, { passive: false });
    document.addEventListener('pointerup', DragDrop.onPointerUp);
    document.addEventListener('pointercancel', DragDrop.onPointerCancel);

    // Dokunmatikte sürükleme aktifken sayfa kaydırmasını kesin olarak engelle.
    document.addEventListener('touchmove', (e) => {
      if (DragDrop.active) e.preventDefault();
    }, { passive: false });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && DragDrop.active) DragDrop.finish();
    });

    /* --- toplu işlemler --- */
    DOM.clearCompletedBtn.addEventListener('click', () => {
      const removed = State.clearCompleted();
      if (removed === 0) {
        Toast.info('Tamamlanmış görev yok.');
        return;
      }
      UI.renderBoards();
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
      UI.renderBoards();
      Toast.success(removed + ' görev silindi.');
    });
  }

  /* ============================================================
   * init
   * ========================================================== */
  function init() {
    State.hydrate();
    bindEvents();
    Collapse.applyAll();
    UI.renderBoards();
    UI.updateCharCount();
    Sync.init();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
