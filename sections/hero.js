document.getElementById('hero-root').outerHTML = `
<!-- ============ HERO ============ -->
<section class="relative w-full min-h-[100dvh] overflow-hidden bg-base">

  <!-- Arka plan: 3D render videosu (loop) -->
  <!-- photos/ klasörüne kendi render videonu hero-reel.mp4 (ve tercihen hero-reel.webm) adıyla koy -->
  <video
    class="absolute inset-0 h-full w-full object-cover opacity-40"
    autoplay
    muted
    loop
    playsinline
    poster="photos/hero-poster.jpg"
  >
    <source src="photos/hero-reel.webm" type="video/webm" />
    <source src="photos/hero-reel.mp4" type="video/mp4" />
  </video>

  <!-- Okunabilirlik için karartma katmanı (scrim) -->
  <div class="absolute inset-0 bg-gradient-to-b from-base/50 via-base/55 to-base"></div>
  <div class="absolute inset-0 bg-gradient-to-t from-base via-transparent to-transparent"></div>

  <!-- Viewport / kamera çerçevesi köşeleri (imza öğe) -->
  <div class="pointer-events-none absolute inset-4 sm:inset-6 md:inset-10 z-10">
    <span class="absolute top-0 left-0 w-6 h-6 sm:w-10 sm:h-10 border-t border-l border-accent/60"></span>
    <span class="absolute top-0 right-0 w-6 h-6 sm:w-10 sm:h-10 border-t border-r border-accent/60"></span>
    <span class="absolute bottom-0 left-0 w-6 h-6 sm:w-10 sm:h-10 border-b border-l border-accent/60"></span>
    <span class="absolute bottom-0 right-0 w-6 h-6 sm:w-10 sm:h-10 border-b border-r border-accent/60"></span>
  </div>

  <!-- Sol üst HUD: sahne bilgisi -->
  <div class="absolute top-8 left-8 sm:top-12 sm:left-12 md:top-16 md:left-16 z-10 hidden sm:flex flex-col gap-1 font-mono text-[10px] md:text-[11px] tracking-widest text-muted uppercase">
    <span>CAM_01 // 35MM</span>
    <span>RENDER — CYCLES</span>
  </div>

  <!-- Sağ üst HUD: REC göstergesi + sayaç -->
  <div class="absolute top-8 right-8 sm:top-12 sm:right-12 md:top-16 md:right-16 z-10 flex items-center gap-2 font-mono text-[10px] md:text-[11px] tracking-widest text-muted uppercase">
    <span class="w-1.5 h-1.5 rounded-full bg-accent animate-pulse"></span>
    <span>REC</span>
    <span id="rec-timer" class="text-ink/80 tabular-nums">00:00:00</span>
  </div>

  <!-- Merkez içerik -->
  <div class="relative z-10 flex min-h-[100dvh] flex-col items-start justify-center px-6 sm:px-12 md:px-16 max-w-6xl">
    <span class="font-mono text-[11px] sm:text-xs tracking-[0.3em] text-accent uppercase mb-4 sm:mb-6">
      Game Developer &amp; 3D Artist
    </span>

    <h1 class="font-display font-semibold leading-[0.95] tracking-tight text-ink text-[11vw] sm:text-5xl md:text-6xl lg:text-7xl">
      Etkileşimli Dünyalar ve<br />
      <span class="text-accent">Optimizasyon Odaklı</span><br />
      Oyun Sistemleri
    </h1>

    <p class="mt-6 sm:mt-8 max-w-md sm:max-w-lg font-body text-sm sm:text-base text-muted leading-relaxed" style="color:#8A8D93">
      3D varlık üretimi, gerçek zamanlı render ve oyun programlama disiplinlerini bir araya
      getiriyorum. Unity ve Unreal Engine kullanarak performans odaklı oyun mekanikleri ve
      teknik açıdan optimize edilmiş görsel deneyimler geliştiriyorum.
    </p>
  </div>

  <!-- Alt scroll ipucu -->
  <div class="absolute bottom-8 sm:bottom-10 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2">
    <span class="font-mono text-[9px] sm:text-[10px] tracking-[0.3em] text-muted uppercase">Scroll</span>
    <span class="h-8 sm:h-10 w-px bg-gradient-to-b from-muted to-transparent relative overflow-hidden">
      <span class="absolute top-0 left-0 w-full h-2 bg-accent animate-[scrollLine_1.8s_ease-in-out_infinite]"></span>
    </span>
  </div>

</section>
`;
