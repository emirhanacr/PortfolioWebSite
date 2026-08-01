/**
 * Görev Ayrıştırıcı API — OpenRouter proxy (Cloudflare Worker)
 *
 * Bu dosyada SIR YOKTUR. API anahtarı Cloudflare secret'ı olarak tutulur:
 *   npx wrangler secret put OPENROUTER_API_KEY
 *
 * Tasarım kuralı: istemciden SADECE { text } kabul edilir. Model, system prompt
 * ve temperature burada sabittir — aksi halde bu endpoint herkese açık, bedava
 * bir genel amaçlı LLM'e dönüşür.
 */

/* ============================ AYARLAR ============================ */

const ALLOWED_ORIGINS = new Set([
  'https://www.emirhanacr.com',
  'https://emirhanacr.com',
  // Yerel geliştirme için (gerekmiyorsa silinebilir):
  'http://localhost:8000',
  'http://127.0.0.1:8000',
]);

const MODEL = 'deepseek/deepseek-chat';
const TEMPERATURE = 0.1;

const MAX_INPUT_CHARS = 2000;   // maliyet tavanı
const MAX_TASKS = 40;           // tek yanıtta kabul edilen azami görev

const RATE_LIMIT_MAX = 15;      // pencere başına istek
const RATE_LIMIT_WINDOW = 3600; // saniye (1 saat)

/* ---------- pano (oda) depolama ayarları ---------- */

const BOARD_CODE_RE = /^[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{8}$/; // 0/O/1/I/L hariç
const BOARD_MAX_TASKS = 300;
const BOARD_MAX_BYTES = 150_000;
const BOARD_TTL_SECONDS = 60 * 60 * 24 * 60; // 60 gün hareketsizlik sonrası silinir

const BOARD_WRITE_RATE_LIMIT_MAX = 60;
const BOARD_WRITE_RATE_LIMIT_WINDOW = 3600;
const BOARD_READ_RATE_LIMIT_MAX = 1000;
const BOARD_READ_RATE_LIMIT_WINDOW = 3600;

// On üç kategori, üç bölüm: ilk beşi kişisel, sonraki üçü geliştirme, son beşi
// sanat panosuna düşer. Bölüm bilgisi ayrıca taşınmaz — istemci kategoriden türetir.
const CATEGORIES = [
  'İş', 'Kişisel', 'Finans', 'Acil', 'Diğer',
  'Bug', 'Eklenecek', 'Test',
  'Konsept', 'Modelleme', 'Doku', 'Rig & Animasyon', 'Entegrasyon',
];
const FALLBACK_CATEGORY = 'Diğer';

/**
 * Kategori sayısı arttıkça modelin sözlüğü birebir tutturma olasılığı düşüyor.
 * Yaygın varyantları doğru kategoriye çekiyoruz; eşleşmeyen yine 'Diğer'e düşer.
 * Anahtarlar küçük harfe indirgenmiş halde tutulur.
 */
const CATEGORY_ALIASES = {
  'rig': 'Rig & Animasyon',
  'animasyon': 'Rig & Animasyon',
  'rig ve animasyon': 'Rig & Animasyon',
  'rig&animasyon': 'Rig & Animasyon',
  'rigging': 'Rig & Animasyon',
  'doku ve materyal': 'Doku',
  'doku & materyal': 'Doku',
  'materyal': 'Doku',
  'texture': 'Doku',
  'tekstür': 'Doku',
  'konsept sanat': 'Konsept',
  'referans': 'Konsept',
  'model': 'Modelleme',
  'modelling': 'Modelleme',
  'entegre': 'Entegrasyon',
  'entegrasyon işi': 'Entegrasyon',
  'hata': 'Bug',
  'özellik': 'Eklenecek',
};

// Tek paragrafın üç panoyu birden besleyebilmesi için birleşik prompt.
const SYSTEM_PROMPT = "Sen yalnızca yapılandırılmış veri üreten bir veri ayrıştırma motorusun. Sohbet etme, açıklama yapma. Girdi metnindeki görevleri çıkar, eğer birden fazlaysa böl. Her görevi şu kategorilerden birine ata. Günlük işler: 'İş', 'Kişisel', 'Finans', 'Acil', 'Diğer'. Oyun kodu ve mekanikleri: 'Bug' (düzeltilmesi gereken hata veya arıza), 'Eklenecek' (yeni özellik, mekanik veya sistem), 'Test' (denenmesi veya doğrulanması gereken şey). Görsel varlık üretimi: 'Konsept' (referans toplama, eskiz, moodboard), 'Modelleme' (high poly, low poly, retopoloji), 'Doku' (UV açma, bake, materyal, PBR), 'Rig & Animasyon' (iskelet, skinning, animasyon klipleri), 'Entegrasyon' (motora aktarma, prefab kurulumu, LOD). Ayrım kuralı: iş kod veya oyun mekaniğiyle ilgiliyse 'Eklenecek' kullan; görsel bir varlık üretmekle ilgiliyse üretim aşamasına göre sanat kategorilerinden birini kullan. Kategorisi belirsizse 'Diğer' kullan. SADECE VE SADECE geçerli bir JSON array formatında yanıt ver. Markdown (```json) KULLANMA. Şablon: [{'task': 'görev tanımı', 'category': 'Kategori'}]. Görev yoksa [] dön.";

/* ============================ GİRİŞ ============================ */

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') || '';
    const cors = corsHeaders(origin);

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: cors });
    }

    const url = new URL(request.url);
    if (url.pathname.startsWith('/board/')) {
      return handleBoard(request, env, cors, origin, url.pathname.slice('/board/'.length));
    }

    if (request.method !== 'POST') {
      return json({ error: 'Yalnızca POST destekleniyor.' }, 405, cors);
    }

    // Origin allowlist. Tarayıcı zaten CORS ile engeller; bu ikinci katman.
    // Spoof edilebilir, tek başına güvenlik önlemi sayılmaz.
    if (!ALLOWED_ORIGINS.has(origin)) {
      return json({ error: 'Bu origin yetkili değil.' }, 403, cors);
    }

    if (!env.OPENROUTER_API_KEY) {
      console.error('OPENROUTER_API_KEY secret tanımlı değil');
      return json({ error: 'Sunucu yapılandırması eksik.' }, 500, cors);
    }

    /* ---------- rate limit ---------- */
    const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
    const rl = await checkRateLimit(`parse:${ip}`, RATE_LIMIT_MAX, RATE_LIMIT_WINDOW);
    if (!rl.ok) {
      return json(
        { error: `Çok fazla istek gönderdin. ${Math.ceil(rl.retryAfter / 60)} dakika sonra tekrar dene.` },
        429,
        { ...cors, 'Retry-After': String(rl.retryAfter) }
      );
    }

    /* ---------- girdi doğrulama ---------- */
    let payload;
    try {
      payload = await request.json();
    } catch (_) {
      return json({ error: 'Geçersiz istek gövdesi.' }, 400, cors);
    }

    const text = typeof payload?.text === 'string' ? payload.text.trim() : '';

    if (!text) {
      return json({ error: 'Ayrıştırılacak metin boş.' }, 400, cors);
    }
    if (text.length > MAX_INPUT_CHARS) {
      return json(
        { error: `Metin çok uzun (${text.length} karakter). En fazla ${MAX_INPUT_CHARS} karakter gönderebilirsin.` },
        413,
        cors
      );
    }

    /* ---------- OpenRouter çağrısı ---------- */
    let upstream;
    try {
      upstream = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${env.OPENROUTER_API_KEY}`,
          'HTTP-Referer': 'https://www.emirhanacr.com',
          'X-Title': 'Gorev Ayristirici',
        },
        body: JSON.stringify({
          model: MODEL,               // istemci seçemez
          temperature: TEMPERATURE,   // istemci değiştiremez
          messages: [
            { role: 'system', content: SYSTEM_PROMPT }, // istemci ezemez
            { role: 'user', content: text },
          ],
        }),
      });
    } catch (err) {
      console.error('upstream fetch failed', err);
      return json({ error: 'Yapay zeka servisine ulaşılamadı. Birazdan tekrar dene.' }, 502, cors);
    }

    if (!upstream.ok) {
      // Upstream'in ham hatasını istemciye SIZDIRMA — hesap/anahtar detayı içerebilir.
      const detail = await upstream.text().catch(() => '');
      console.error('openrouter error', upstream.status, detail.slice(0, 500));
      return json({ error: upstreamMessage(upstream.status) }, 502, cors);
    }

    let data;
    try {
      data = await upstream.json();
    } catch (_) {
      return json({ error: 'Yapay zekadan okunamayan bir yanıt geldi.' }, 502, cors);
    }

    if (data?.error) {
      console.error('openrouter payload error', JSON.stringify(data.error).slice(0, 500));
      return json({ error: 'Yapay zeka isteği reddetti. Birazdan tekrar dene.' }, 502, cors);
    }

    const content = data?.choices?.[0]?.message?.content;
    if (typeof content !== 'string' || !content.trim()) {
      return json({ error: 'Yapay zeka boş bir yanıt döndürdü. Tekrar dene.' }, 502, cors);
    }

    /* ---------- ayrıştırma (sunucu tarafında) ---------- */
    let tasks;
    try {
      tasks = normalizeTasks(extractJson(content));
    } catch (err) {
      console.error('parse failed', String(err), content.slice(0, 300));
      return json({ error: 'Yanıt ayrıştırılamadı. Metni sadeleştirip tekrar dene.' }, 502, cors);
    }

    return json({ tasks, remaining: rl.remaining }, 200, cors);
  },
};

/* ============================ YARDIMCILAR ============================ */

function corsHeaders(origin) {
  const headers = {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    Vary: 'Origin',
  };
  if (ALLOWED_ORIGINS.has(origin)) {
    headers['Access-Control-Allow-Origin'] = origin;
    headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, OPTIONS';
    headers['Access-Control-Allow-Headers'] = 'Content-Type';
    headers['Access-Control-Max-Age'] = '86400';
  }
  return headers;
}

function json(body, status, headers) {
  return new Response(JSON.stringify(body), { status, headers });
}

function upstreamMessage(status) {
  if (status === 401 || status === 403) return 'Servis kimlik doğrulaması başarısız. Site sahibiyle iletişime geç.';
  if (status === 402) return 'Servis kotası dolmuş. Site sahibiyle iletişime geç.';
  if (status === 429) return 'Servis şu an yoğun. Birazdan tekrar dene.';
  return 'Yapay zeka servisi şu an yanıt veremiyor. Birazdan tekrar dene.';
}

/**
 * Anahtar başına kayan pencere sayacı — Cache API üzerinde.
 *
 * Not: Cloudflare cache'i veri merkezi (colo) bazlıdır, yani limit global değil
 * colo başınadır. Kötüye kullanımı yavaşlatmak için yeterlidir; asıl güvenlik
 * ağı OpenRouter tarafındaki sert kredi limitidir.
 */
async function checkRateLimit(key, max, windowSeconds) {
  const cache = caches.default;
  const cacheKey = new Request(`https://rate-limit.internal/${encodeURIComponent(key)}`);
  const now = Math.floor(Date.now() / 1000);

  let count = 0;
  let resetAt = now + windowSeconds;

  const hit = await cache.match(cacheKey);
  if (hit) {
    try {
      const prev = await hit.json();
      if (typeof prev.resetAt === 'number' && prev.resetAt > now) {
        count = Number(prev.count) || 0;
        resetAt = prev.resetAt;
      }
    } catch (_) { /* bozuk kayıt — sıfırdan say */ }
  }

  if (count >= max) {
    return { ok: false, retryAfter: Math.max(1, resetAt - now) };
  }

  const ttl = Math.max(1, resetAt - now);
  await cache.put(
    cacheKey,
    new Response(JSON.stringify({ count: count + 1, resetAt }), {
      headers: { 'Content-Type': 'application/json', 'Cache-Control': `max-age=${ttl}` },
    })
  );

  return { ok: true, remaining: max - count - 1 };
}

/* ============================ PANO (ODA) ============================ */

/**
 * Paylaşılabilir bir oda kodu altında tam görev dizisini saklar/döner.
 * Kod = tek erişim kontrolü (parola gibi düşün) — gerçek bir kimlik doğrulama
 * değil. Herhangi bir yazım kaydı bir öncekinin üzerine yazar (son yazan kazanır).
 */
async function handleBoard(request, env, cors, origin, code) {
  if (!ALLOWED_ORIGINS.has(origin)) {
    return json({ error: 'Bu origin yetkili değil.' }, 403, cors);
  }

  if (!BOARD_CODE_RE.test(code)) {
    return json({ error: 'Geçersiz oda kodu.' }, 400, cors);
  }

  if (!env.BOARDS) {
    console.error('BOARDS KV binding tanımlı değil');
    return json({ error: 'Sunucu yapılandırması eksik.' }, 500, cors);
  }

  const ip = request.headers.get('CF-Connecting-IP') || 'unknown';

  if (request.method === 'GET') {
    const rl = await checkRateLimit(`board-read:${ip}`, BOARD_READ_RATE_LIMIT_MAX, BOARD_READ_RATE_LIMIT_WINDOW);
    if (!rl.ok) {
      return json({ error: 'Çok fazla istek. Birazdan tekrar dene.' }, 429, { ...cors, 'Retry-After': String(rl.retryAfter) });
    }

    const stored = await env.BOARDS.get(code, { type: 'json' });
    if (!stored) {
      return json({ error: 'Oda bulunamadı.' }, 404, cors);
    }
    return json(stored, 200, cors);
  }

  if (request.method === 'PUT') {
    const rl = await checkRateLimit(`board-write:${ip}`, BOARD_WRITE_RATE_LIMIT_MAX, BOARD_WRITE_RATE_LIMIT_WINDOW);
    if (!rl.ok) {
      return json(
        { error: `Çok fazla istek gönderdin. ${Math.ceil(rl.retryAfter / 60)} dakika sonra tekrar dene.` },
        429,
        { ...cors, 'Retry-After': String(rl.retryAfter) }
      );
    }

    let payload;
    try {
      payload = await request.json();
    } catch (_) {
      return json({ error: 'Geçersiz istek gövdesi.' }, 400, cors);
    }

    let tasks;
    try {
      tasks = normalizeBoardTasks(payload?.tasks);
    } catch (err) {
      return json({ error: String(err.message || err) }, 400, cors);
    }

    const body = JSON.stringify({ tasks, updatedAt: Date.now() });
    if (body.length > BOARD_MAX_BYTES) {
      return json({ error: 'Liste çok büyük.' }, 413, cors);
    }

    await env.BOARDS.put(code, body, { expirationTtl: BOARD_TTL_SECONDS });
    return json(JSON.parse(body), 200, cors);
  }

  return json({ error: 'Yalnızca GET ve PUT destekleniyor.' }, 405, cors);
}

/** İstemciden gelen tam görev dizisini doğrular (pano PUT). Uydurma alanlar atılır. */
function normalizeBoardTasks(list) {
  if (!Array.isArray(list)) throw new Error('tasks bir dizi olmalı.');
  if (list.length > BOARD_MAX_TASKS) throw new Error(`En fazla ${BOARD_MAX_TASKS} görev gönderebilirsin.`);

  return list
    .filter((item) => item && typeof item === 'object' && typeof item.task === 'string' && item.task.trim())
    .map((item) => ({
      id: typeof item.id === 'string' && item.id ? item.id.slice(0, 64) : makeId(),
      task: item.task.trim().slice(0, 300),
      category: canonicalCategory(item.category),
      completed: item.completed === true,
      createdAt: typeof item.createdAt === 'number' && Number.isFinite(item.createdAt) ? item.createdAt : Date.now(),
    }));
}

function makeId() {
  return 'b_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8);
}

/** Fenced veya geveze yanıtın içinden JSON dizisini çeker. */
function extractJson(raw) {
  const cleaned = raw
    .replace(/^﻿/, '')
    .replace(/```(?:json)?/gi, '')
    .replace(/```/g, '')
    .trim();

  try {
    return JSON.parse(cleaned);
  } catch (_) { /* köşeli parantez aramasına düş */ }

  const start = cleaned.indexOf('[');
  const end = cleaned.lastIndexOf(']');
  if (start !== -1 && end > start) {
    return JSON.parse(cleaned.slice(start, end + 1));
  }

  throw new Error('JSON bulunamadı');
}

/**
 * Kategoriyi sözlüğe oturtur: önce birebir, sonra büyük/küçük harf duyarsız,
 * sonra takma ad tablosu. Hiçbiri tutmazsa 'Diğer'.
 */
function canonicalCategory(raw) {
  if (typeof raw !== 'string') return FALLBACK_CATEGORY;

  const trimmed = raw.trim();
  if (CATEGORIES.includes(trimmed)) return trimmed;

  const key = trimmed.toLocaleLowerCase('tr');
  const caseless = CATEGORIES.find((c) => c.toLocaleLowerCase('tr') === key);
  if (caseless) return caseless;

  return CATEGORY_ALIASES[key] || FALLBACK_CATEGORY;
}

/** Her kaydı doğrular, uydurma kategorileri "Diğer"e düşürür. */
function normalizeTasks(parsed) {
  let list = parsed;
  if (!Array.isArray(list) && Array.isArray(list?.tasks)) list = list.tasks;
  if (!Array.isArray(list)) throw new Error('Dizi değil');

  return list
    .filter((item) => item && typeof item === 'object' && typeof item.task === 'string' && item.task.trim())
    .slice(0, MAX_TASKS)
    .map((item) => ({
      task: item.task.trim().slice(0, 300),
      category: canonicalCategory(item.category),
    }));
}
