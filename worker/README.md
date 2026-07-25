# Görev Ayrıştırıcı API — Cloudflare Worker

Statik site (GitHub Pages) sunucu tarafı kod çalıştıramaz. Bu yüzden OpenRouter
anahtarını saklayan proxy ayrı olarak Cloudflare Workers üzerinde çalışır.

```
www.emirhanacr.com          →   *.workers.dev              →   OpenRouter
(GitHub Pages, statik)          (bu Worker, anahtar burada)
```

Bu klasördeki dosyalarda **hiçbir sır yoktur** — anahtar Cloudflare secret'ı olarak
saklanır, koda girmez. Dolayısıyla repoda durması sakıncasızdır.

---

## Kurulum

### 1. OpenRouter'da ayrı ve limitli bir anahtar oluştur

**Bu adımı atlama.** Ana anahtarını kullanma; bu iş için yeni bir anahtar üret ve
üzerine sert bir kredi limiti koy (örn. $5).

Sen anahtarı sağladığın için siteyi kullanan herkes senin paranı harcıyor.
Koddaki rate limit ve uzunluk sınırları kötüye kullanımı yavaşlatır, ama **asıl
güvenlik ağı bu kredi limitidir.** En kötü senaryoda kaybın bu rakamla sınırlı kalır.

### 2. Worker'ı deploy et

Bu makinede **Node.js kurulu değil**, dolayısıyla `npx wrangler` şu an çalışmaz.
İki seçeneğin var:

#### Seçenek A — Cloudflare paneli (Node gerekmez, önerilen)

1. [dash.cloudflare.com](https://dash.cloudflare.com) → **Workers & Pages** → **Create** → **Create Worker**
2. İsim: `gorev-ayristirici-api` → **Deploy** (şablon kodla)
3. **Edit code** → editördeki her şeyi sil → bu klasördeki `worker.js` içeriğini
   olduğu gibi yapıştır → **Deploy**
4. Worker sayfası → **Settings** → **Variables and Secrets** → **Add**
   - Type: **Secret**
   - Name: `OPENROUTER_API_KEY`
   - Value: OpenRouter anahtarın
   - **Deploy**

> `wrangler.toml` bu yolda kullanılmaz; sadece CLI ile deploy edenler için duruyor.

#### Seçenek B — Wrangler CLI

Önce [nodejs.org](https://nodejs.org) üzerinden Node.js kur, sonra:

```bash
cd worker
npx wrangler login
npx wrangler secret put OPENROUTER_API_KEY     # anahtarı sorunca yapıştır
npx wrangler deploy
```

Her iki yolda da sonuçta şu adresi alırsın:

```
https://gorev-ayristirici-api.<kullanıcı-adın>.workers.dev
```

### 3. Adresi siteye tanıt

`scripts/gorev-ayristirici.js` içindeki `API_ENDPOINT` değerini yukarıdaki
adresle değiştir (`DEGISTIR` yazan yer):

```js
API_ENDPOINT: 'https://gorev-ayristirici-api.<kullanıcı-adın>.workers.dev',
```

### 4. Siteyi yayınla

```bash
git add .
git commit -m "Görev ayrıştırıcı aracı eklendi"
git push
```

GitHub Pages birkaç dakika içinde yayına alır.

---

## Doğrulama

Deploy sonrası terminalden dene:

```bash
# Geçerli istek (200 + tasks dizisi dönmeli)
curl -X POST https://gorev-ayristirici-api.<kullanıcı-adın>.workers.dev \
  -H "Content-Type: application/json" \
  -H "Origin: https://www.emirhanacr.com" \
  -d '{"text":"yarin sunumu yolla, elektrik faturasini ode"}'

# Yetkisiz origin (403 dönmeli)
curl -X POST https://gorev-ayristirici-api.<kullanıcı-adın>.workers.dev \
  -H "Content-Type: application/json" \
  -H "Origin: https://kotu-site.com" \
  -d '{"text":"test"}'
```

Tarayıcıda `gorev-ayristirici.html` sayfasını aç, DevTools → Network sekmesinde
isteğe bak: **`Authorization` başlığı görünmemeli.** Görünüyorsa bir şey yanlış.

---

## Güvenlik tasarımı

| Önlem | Nerede | Ne işe yarar |
|---|---|---|
| Anahtar sunucuda | Cloudflare secret | Tarayıcıya hiç inmez |
| Model sabit | `worker.js` → `MODEL` | Pahalı model seçilemez |
| System prompt sabit | `worker.js` → `SYSTEM_PROMPT` | Bedava genel LLM'e dönüşemez |
| Girdi sınırı | `MAX_INPUT_CHARS` (2000) | İstek başına maliyet tavanı |
| Rate limit | `RATE_LIMIT_MAX` (15/saat/IP) | Otomatik kötüye kullanımı yavaşlatır |
| Origin allowlist | `ALLOWED_ORIGINS` | Başka sitelerden gömülmeyi zorlaştırır |
| Kredi limiti | OpenRouter paneli | **Asıl güvenlik ağı** |

**Kritik tasarım kuralı:** Worker istemciden gelen gövdeyi OpenRouter'a asla
olduğu gibi iletmez. Sadece `text` alanını alır, isteği kendisi kurar. Bu kural
bozulursa (örn. "model'i de istemci göndersin" denirse) endpoint herkese açık
bedava bir LLM'e dönüşür.

### Bilinen sınırlar

- **Rate limit colo bazlı.** Cloudflare cache'i veri merkezi başına çalıştığı için
  limit global değil. Kararlı bir saldırgan farklı bölgelerden daha fazla istek
  atabilir. Global limit gerekirse Workers KV veya Durable Objects'e geçilmeli.
- **Origin başlığı spoof edilebilir.** curl ile taklit edilebilir; tarayıcı
  tarafında işe yarar, gerçek bir kimlik doğrulama değildir.
- **Bot koruması yok.** Trafik artarsa Cloudflare Turnstile eklemek en etkili
  sonraki adım olur.

---

## İzleme

Cloudflare panelinde Worker → **Logs** (canlı istekler) ve **Metrics** (istek
sayısı) sekmelerini takip et. CLI kullanıyorsan `npx wrangler tail` aynı işi görür.

Harcamayı OpenRouter panelinden izle. Anormal artış görürsen **acil durdurma**:

1. **En hızlısı:** OpenRouter panelinden anahtarı iptal et — harcamayı anında keser.
2. Cloudflare panelinden Worker'ı sil (veya `npx wrangler delete`).

İlk seçenek yeterlidir; anahtar iptal edilince Worker çalışsa bile para harcanmaz.

---

## Ayar noktaları

Hepsi `worker.js` dosyasının başında:

| Sabit | Varsayılan | Not |
|---|---|---|
| `MODEL` | `deepseek/deepseek-chat` | Değiştirirsen fiyatı kontrol et |
| `MAX_INPUT_CHARS` | 2000 | Sayfadaki `maxlength` ile eşleşmeli |
| `RATE_LIMIT_MAX` | 15 | Pencere başına istek |
| `RATE_LIMIT_WINDOW` | 3600 | Saniye |
| `ALLOWED_ORIGINS` | emirhanacr.com | Alan adı değişirse güncelle |
