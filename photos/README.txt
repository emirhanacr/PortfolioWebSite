Buraya hero arka planında dönecek fotoğrafları koy:

  hero-1.jpg
  hero-2.jpg
  hero-3.jpg

Sadece 1 fotoğrafın varsa diğer <img> satırlarını portfolio.html'deki
#hero-bg bölümünden sil (veya hero-2.jpg / hero-3.jpg olarak aynı dosyayı
kopyalayabilirsin, script tek fotoğrafta otomatik durur).

Daha fazla fotoğraf eklemek istersen hero-4.jpg gibi devam edip
portfolio.html içindeki #hero-bg div'ine aynı formatta bir <img> satırı daha ekle:

  <img src="photos/hero-4.jpg" alt="" class="hero-bg-photo absolute inset-0 h-full w-full object-cover transition-opacity duration-[1800ms] ease-in-out" style="opacity:0" />

Script otomatik olarak kaç tane <img class="hero-bg-photo"> varsa onların arasında
sırayla geçiş yapar, ekstra bir ayar gerekmez.
