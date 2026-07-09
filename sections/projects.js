document.getElementById('projects-root').outerHTML = `
<!-- ============ PROJECTS GRID ============ -->
<section id="projects" class="relative bg-base py-20 sm:py-28 md:py-36">

  <!-- Bölüm başlığı -->
  <div class="mx-auto max-w-7xl px-5 sm:px-8 mb-12 sm:mb-16 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
    <div>
      <span class="font-mono text-[10px] sm:text-[11px] tracking-[0.3em] text-accent uppercase">Selected Works</span>
      <h2 class="mt-2 font-display text-3xl sm:text-4xl md:text-5xl font-semibold tracking-tight text-ink">Projeler</h2>
    </div>
    <span class="font-mono text-[10px] sm:text-[11px] tracking-widest text-muted uppercase">
      <span id="project-count">06</span> proje · <span class="text-ink/60">2024 — 2026</span>
    </span>
  </div>

  <!-- Grid -->
  <div class="mx-auto max-w-7xl px-5 sm:px-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">

    <!-- PROJE KARTI 1 — Geniş (2 sütun kaplıyor) -->
    <div class="project-card group relative col-span-1 sm:col-span-2 aspect-[16/9] sm:aspect-[2/1] overflow-hidden bg-panel">
      <img src="photos/projects/project-1.jpg" alt="Martı — Architectural Visualization" class="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105 opacity-80 group-hover:opacity-100" />
      <div class="absolute inset-0 bg-gradient-to-t from-base/90 via-base/30 to-transparent"></div>
      <!-- Köşe çerçevesi -->
      <span class="pointer-events-none absolute inset-3 sm:inset-4 border border-white/0 transition-all duration-500 group-hover:border-accent/30"></span>
      <!-- İçerik -->
      <div class="absolute bottom-0 left-0 right-0 p-4 sm:p-6 flex flex-col gap-2">
        <div class="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span class="font-mono text-[9px] sm:text-[10px] tracking-[0.15em] text-accent">#Unity</span>
          <span class="font-mono text-[9px] sm:text-[10px] tracking-[0.15em] text-accent">#CSharp</span>
          <span class="font-mono text-[9px] sm:text-[10px] tracking-[0.15em] text-accent">#llm</span>
          <span class="font-mono text-[9px] sm:text-[10px] tracking-[0.15em] text-accent">#Photoshop</span>
          </div>
        <h3 class="font-display text-lg sm:text-xl md:text-2xl font-semibold text-ink tracking-tight leading-tight">
          Martı Kaptan — Ekolojik Simülasyon
        </h3>
        <p class="max-w-md text-xs sm:text-sm text-muted leading-relaxed hidden sm:block">
          Sıfır atık bilincini yaygınlaştırmak amacıyla gönüllü bir ekip tarafından geliştirilen; oyuncuları deniz temizliği ve atık ayrıştırma pratiğiyle buluşturan, eğitici ve etkileşimli bir mobil oyun projesidir.
        </p>
      </div>
      <!-- Oyna butonu -->
      <a href="https://emirhan-acar.itch.io/marti-kaptan" target="_blank" rel="noopener noreferrer" class="absolute bottom-4 right-4 sm:bottom-6 sm:right-6 inline-flex items-center gap-1.5 border border-white/15 px-3 py-2 sm:px-4 sm:py-2.5 font-mono text-[10px] sm:text-[11px] tracking-[0.2em] uppercase text-ink transition-all duration-300 hover:border-accent hover:bg-accent/10 focus-ring">
        Oyna
        <svg class="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M7 17L17 7M17 7H7M17 7v10"/></svg>
      </a>
    </div>

    <!-- PROJE KARTI 2 -->
    <div class="project-card group relative aspect-[3/4] overflow-hidden bg-panel">
      <img src="photos/projects/project-2.jpg" alt="Void Runner — Indie Game" class="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105 opacity-80 group-hover:opacity-100" />
      <div class="absolute inset-0 bg-gradient-to-t from-base/90 via-base/30 to-transparent"></div>
      <span class="pointer-events-none absolute inset-3 sm:inset-4 border border-white/0 transition-all duration-500 group-hover:border-accent/30"></span>
      <div class="absolute bottom-0 left-0 right-0 p-4 sm:p-6 flex flex-col gap-2">
        <div class="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span class="font-mono text-[9px] sm:text-[10px] tracking-[0.15em] text-accent">#Unity</span>
          <span class="font-mono text-[9px] sm:text-[10px] tracking-[0.15em] text-accent">#CSharp</span>
        </div>
        <h3 class="font-display text-lg sm:text-xl font-semibold text-ink tracking-tight leading-tight">
          Giga Pap — İndie Mobil Oyun
        </h3>
        <p class="text-xs sm:text-sm text-muted leading-relaxed hidden sm:block">
          Dünyayı kurtarmak için nesli tükenmekte olan arılardan son 3'ünü koruduğunuz 2 boyutlu boss fight'a sahip tadı damağınızda kalacak mobil oyun projesidir.
        </p>
      </div>
      <a href="https://yusufatasoy.itch.io/giga-pap" target="_blank" rel="noopener noreferrer" class="absolute bottom-4 right-4 sm:bottom-6 sm:right-6 inline-flex items-center gap-1.5 border border-white/15 px-3 py-2 sm:px-4 sm:py-2.5 font-mono text-[10px] sm:text-[11px] tracking-[0.2em] uppercase text-ink transition-all duration-300 hover:border-accent hover:bg-accent/10 focus-ring">
        Oyna
        <svg class="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M7 17L17 7M17 7H7M17 7v10"/></svg>
      </a>
    </div>

    <!-- PROJE KARTI 3 -->
    <div class="project-card group relative aspect-[3/4] overflow-hidden bg-panel">
      <img src="photos/projects/project-3.jpg" alt="Lumina Watch — Product Render" class="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105 opacity-80 group-hover:opacity-100" />
      <div class="absolute inset-0 bg-gradient-to-t from-base/90 via-base/30 to-transparent"></div>
      <span class="pointer-events-none absolute inset-3 sm:inset-4 border border-white/0 transition-all duration-500 group-hover:border-accent/30"></span>
      <div class="absolute bottom-0 left-0 right-0 p-4 sm:p-6 flex flex-col gap-2">
        <div class="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span class="font-mono text-[9px] sm:text-[10px] tracking-[0.15em] text-accent">#UnrealEngine</span>
          <span class="font-mono text-[9px] sm:text-[10px] tracking-[0.15em] text-accent">#Blender</span>
        </div>
        <h3 class="font-display text-lg sm:text-xl font-semibold text-ink tracking-tight leading-tight">
          Just Drive — Level Design Projesi
        </h3>
        <p class="text-xs sm:text-sm text-muted leading-relaxed hidden sm:block">
          Gece sürüşüne çıktığınız sizi bekleyen nascar pistinde ve kayıp şehirde gezebildiğiniz bu yolda garipliklerle karşılacağınız unreal projemizdir. Assetler blender'da modellenmiştir.
        </p>
      </div>
      <a href="https://emirhan-acar.itch.io/" target="_blank" rel="noopener noreferrer" class="absolute bottom-4 right-4 sm:bottom-6 sm:right-6 inline-flex items-center gap-1.5 border border-white/15 px-3 py-2 sm:px-4 sm:py-2.5 font-mono text-[10px] sm:text-[11px] tracking-[0.2em] uppercase text-ink transition-all duration-300 hover:border-accent hover:bg-accent/10 focus-ring">
        Oyna
        <svg class="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M7 17L17 7M17 7H7M17 7v10"/></svg>
      </a>
    </div>

    <!-- PROJE KARTI 4 -->
    <div class="project-card group relative aspect-[3/4] overflow-hidden bg-panel">
      <!-- Video döngü: photos/projects/project-4.mp4 (+ opsiyonel .webm), poster olarak project-4.jpg kullanılıyor -->
      <video
        class="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105 opacity-80 group-hover:opacity-100"
        autoplay
        muted
        loop
        playsinline
        poster="photos/projects/project-4.jpg"
      >
        <source src="photos/projects/project-4.webm" type="video/webm" />
        <source src="photos/projects/project-4.mp4" type="video/mp4" />
      </video>
      <div class="absolute inset-0 bg-gradient-to-t from-base/90 via-base/30 to-transparent"></div>
      <span class="pointer-events-none absolute inset-3 sm:inset-4 border border-white/0 transition-all duration-500 group-hover:border-accent/30"></span>
      <div class="absolute bottom-0 left-0 right-0 p-4 sm:p-6 flex flex-col gap-2">
        <div class="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span class="font-mono text-[9px] sm:text-[10px] tracking-[0.15em] text-accent">#AfterEffects</span>
          <span class="font-mono text-[9px] sm:text-[10px] tracking-[0.15em] text-accent">#Cinema4D</span>
        </div>
        <h3 class="font-display text-lg sm:text-xl font-semibold text-ink tracking-tight leading-tight">
          Project Minguinho — Rig, Animasyon, Modelleme
        </h3>
        <p class="text-xs sm:text-sm text-muted leading-relaxed hidden sm:block">
          Modeli, riglemesi ve animasyonu bana aittir.
        </p>
      </div>
      <a href="https://emirhan-acar.itch.io/" target="_blank" rel="noopener noreferrer" class="absolute bottom-4 right-4 sm:bottom-6 sm:right-6 inline-flex items-center gap-1.5 border border-white/15 px-3 py-2 sm:px-4 sm:py-2.5 font-mono text-[10px] sm:text-[11px] tracking-[0.2em] uppercase text-ink transition-all duration-300 hover:border-accent hover:bg-accent/10 focus-ring">
        Oyna
        <svg class="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M7 17L17 7M17 7H7M17 7v10"/></svg>
      </a>
    </div>

    <!-- PROJE KARTI 5 — Geniş (2 sütun kaplıyor) -->
    <div class="project-card group relative col-span-1 sm:col-span-2 aspect-[16/9] sm:aspect-[2/1] overflow-hidden bg-panel">
      <img src="photos/projects/project-5.jpg" alt="Lost Temple — Game Environment" class="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105 opacity-80 group-hover:opacity-100" />
      <div class="absolute inset-0 bg-gradient-to-t from-base/90 via-base/30 to-transparent"></div>
      <span class="pointer-events-none absolute inset-3 sm:inset-4 border border-white/0 transition-all duration-500 group-hover:border-accent/30"></span>
      <div class="absolute bottom-0 left-0 right-0 p-4 sm:p-6 flex flex-col gap-2">
        <div class="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span class="font-mono text-[9px] sm:text-[10px] tracking-[0.15em] text-accent">#Unity</span>
          <span class="font-mono text-[9px] sm:text-[10px] tracking-[0.15em] text-accent">#CSharp</span>
          <span class="font-mono text-[9px] sm:text-[10px] tracking-[0.15em] text-accent">#Photoshop</span>
          <span class="font-mono text-[9px] sm:text-[10px] tracking-[0.15em] text-accent">#</span>
        </div>
        <h3 class="font-display text-lg sm:text-xl md:text-2xl font-semibold text-ink tracking-tight leading-tight">
          Rabbit Hole — Roguelike İndie Oyun
        </h3>
        <p class="max-w-md text-xs sm:text-sm text-muted leading-relaxed hidden sm:block">
          Giriştiğimiz en uzun soluklu olabilecek random level generator içeren projemizdir. Karakterimiz bir buton ile dünyaya açılıp düşmanlarla savaşır. Kısıldığı labaratuvardan çıkmaya çalışır.
        </p>
      </div>
      <a href="https://red-panda-studioo.itch.io/rabbit-hole" target="_blank" rel="noopener noreferrer" class="absolute bottom-4 right-4 sm:bottom-6 sm:right-6 inline-flex items-center gap-1.5 border border-white/15 px-3 py-2 sm:px-4 sm:py-2.5 font-mono text-[10px] sm:text-[11px] tracking-[0.2em] uppercase text-ink transition-all duration-300 hover:border-accent hover:bg-accent/10 focus-ring">
        Oyna
        <svg class="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M7 17L17 7M17 7H7M17 7v10"/></svg>
      </a>
    </div>

    <!-- PROJE KARTI 6 -->
    <div class="project-card group relative aspect-square overflow-hidden bg-panel lg:col-span-1">
      <img src="photos/projects/project-6.jpg" alt="Ironclad — Character Design" class="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105 opacity-80 group-hover:opacity-100" />
      <div class="absolute inset-0 bg-gradient-to-t from-base/90 via-base/30 to-transparent"></div>
      <span class="pointer-events-none absolute inset-3 sm:inset-4 border border-white/0 transition-all duration-500 group-hover:border-accent/30"></span>
      <div class="absolute bottom-0 left-0 right-0 p-4 sm:p-6 flex flex-col gap-2">
        <div class="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span class="font-mono text-[9px] sm:text-[10px] tracking-[0.15em] text-accent">#ZBrush</span>
          <span class="font-mono text-[9px] sm:text-[10px] tracking-[0.15em] text-accent">#Substance</span>
        </div>
        <h3 class="font-display text-lg sm:text-xl font-semibold text-ink tracking-tight leading-tight">
          Siege Of Fortune - İndie Oyun
        </h3>
        <p class="text-xs sm:text-sm text-muted leading-relaxed hidden sm:block">
          Yüksek poligonlu karakter sculpt ve PBR doku çalışması.
        </p>
      </div>
      <a href="https://red-panda-studioo.itch.io/siege-of-fortune" target="_blank" rel="noopener noreferrer" class="absolute bottom-4 right-4 sm:bottom-6 sm:right-6 inline-flex items-center gap-1.5 border border-white/15 px-3 py-2 sm:px-4 sm:py-2.5 font-mono text-[10px] sm:text-[11px] tracking-[0.2em] uppercase text-ink transition-all duration-300 hover:border-accent hover:bg-accent/10 focus-ring">
        Oyna
        <svg class="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M7 17L17 7M17 7H7M17 7v10"/></svg>
      </a>
    </div>

  </div>
</section>
`;
