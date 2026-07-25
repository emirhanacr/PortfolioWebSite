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

// Sekiz kategori, iki bölüm: ilk beşi kişisel panoya, son üçü geliştirme panosuna
// düşer. Bölüm bilgisi ayrıca taşınmaz — istemci kategoriden türetir.
const CATEGORIES = ['İş', 'Kişisel', 'Finans', 'Acil', 'Diğer', 'Bug', 'Eklenecek', 'Test'];
const FALLBACK_CATEGORY = 'Diğer';

// Tek paragrafın her iki panoyu birden besleyebilmesi için birleşik prompt.
const SYSTEM_PROMPT = "Sen yalnızca yapılandırılmış veri üreten bir veri ayrıştırma motorusun. Sohbet etme, açıklama yapma. Girdi metnindeki görevleri çıkar, eğer birden fazlaysa böl. Her görevi şu kategorilerden birine ata: günlük işler için 'İş', 'Kişisel', 'Finans', 'Acil', 'Diğer'; oyun geliştirme işleri için 'Bug', 'Eklenecek', 'Test'. 'Bug' = düzeltilmesi gereken hata veya arıza. 'Eklenecek' = yeni özellik, içerik veya iyileştirme. 'Test' = denenmesi veya doğrulanması gereken şey. Kategorisi belirsizse 'Diğer' kullan. SADECE VE SADECE geçerli bir JSON array formatında yanıt ver. Markdown (```json) KULLANMA. Şablon: [{'task': 'görev tanımı', 'category': 'Kategori'}]. Görev yoksa [] dön.";

/* ============================ GİRİŞ ============================ */

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') || '';
    const cors = corsHeaders(origin);

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: cors });
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
    const rl = await checkRateLimit(ip);
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
    headers['Access-Control-Allow-Methods'] = 'POST, OPTIONS';
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
 * IP başına kayan pencere sayacı — Cache API üzerinde.
 *
 * Not: Cloudflare cache'i veri merkezi (colo) bazlıdır, yani limit global değil
 * colo başınadır. Kötüye kullanımı yavaşlatmak için yeterlidir; asıl güvenlik
 * ağı OpenRouter tarafındaki sert kredi limitidir.
 */
async function checkRateLimit(ip) {
  const cache = caches.default;
  const key = new Request(`https://rate-limit.internal/${encodeURIComponent(ip)}`);
  const now = Math.floor(Date.now() / 1000);

  let count = 0;
  let resetAt = now + RATE_LIMIT_WINDOW;

  const hit = await cache.match(key);
  if (hit) {
    try {
      const prev = await hit.json();
      if (typeof prev.resetAt === 'number' && prev.resetAt > now) {
        count = Number(prev.count) || 0;
        resetAt = prev.resetAt;
      }
    } catch (_) { /* bozuk kayıt — sıfırdan say */ }
  }

  if (count >= RATE_LIMIT_MAX) {
    return { ok: false, retryAfter: Math.max(1, resetAt - now) };
  }

  const ttl = Math.max(1, resetAt - now);
  await cache.put(
    key,
    new Response(JSON.stringify({ count: count + 1, resetAt }), {
      headers: { 'Content-Type': 'application/json', 'Cache-Control': `max-age=${ttl}` },
    })
  );

  return { ok: true, remaining: RATE_LIMIT_MAX - count - 1 };
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
      category: CATEGORIES.includes(item.category) ? item.category : FALLBACK_CATEGORY,
    }));
}
