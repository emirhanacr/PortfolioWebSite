Hero arka planı artık video loop kullanıyor (sections/hero.js). Buraya şu dosyaları koy:

  hero-reel.mp4      (zorunlu — tüm tarayıcılarda çalışır)
  hero-reel.webm     (opsiyonel — daha küçük dosya boyutu, tarayıcı destekliyorsa bu kullanılır)
  hero-poster.jpg    (video yüklenene kadar görünecek kapak karesi)

Notlar:
- Video sessiz (muted) ve otomatik döngüde (loop) oynuyor, bu yüzden ses track'i gerekmez.
- Performans için videoyu web'e uygun sıkıştır (ör. Handbrake / ffmpeg ile ~5-15 Mbps,
  1080p'yi geçmeyen çözünürlük) — ham render dosyasını doğrudan koyma.
- Eskiden burada duran hero-1.jpg .. hero-5.jpg dosyaları artık hero bölümünde
  KULLANILMIYOR (slayt gösterisi yerini videoya bıraktı). Silmedim, isterseniz
  ileride About/Projeler bölümlerinde görsel olarak kullanabilirsiniz ya da
  silebilirsiniz.
