document.getElementById('footer-root').outerHTML = `
<!-- ============ FOOTER ============ -->
<footer id="contact" class="relative bg-base border-t border-white/10 px-5 sm:px-8 md:px-16 py-24 sm:py-32">
  <div class="mx-auto max-w-5xl flex flex-col items-start gap-8 sm:gap-10">

    <span class="font-mono text-[10px] sm:text-[11px] tracking-[0.3em] text-accent uppercase">İletişim</span>

    <h2 class="font-display font-semibold leading-[0.95] tracking-tight text-ink text-[9vw] sm:text-4xl md:text-5xl lg:text-6xl max-w-4xl">
      Yeni Projeler ve<br />Profesyonel Fırsatlar
    </h2>

    <p class="max-w-lg text-sm sm:text-base text-muted leading-relaxed" style="color:#8A8D93">
      Oyun geliştirme süreçlerinize teknik ve görsel katkı sağlamaya hazırım. İş birliği,
      staj veya açık pozisyonlar için benimle iletişime geçebilirsiniz.
    </p>

    <a
      href="mailto:emirhan.acr@gmail.com"
      class="group inline-flex items-center gap-3 font-mono text-lg sm:text-2xl md:text-3xl text-ink tracking-tight border-b border-white/15 pb-2 transition-colors duration-300 hover:text-accent hover:border-accent focus-ring"
    >
      emirhan.acr@gmail.com
      <svg class="w-4 h-4 sm:w-5 sm:h-5 shrink-0 transition-transform duration-300 group-hover:translate-x-1 group-hover:-translate-y-1" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M7 17L17 7M17 7H7M17 7v10"/></svg>
    </a>

    <div class="flex flex-wrap items-center gap-3 pt-2">
      <a href="https://emirhan-acar.itch.io/" target="_blank" rel="noopener noreferrer" class="border border-white/15 px-4 py-2 font-mono text-[11px] tracking-[0.2em] uppercase text-muted transition-colors duration-300 hover:text-ink hover:border-accent focus-ring">itch.io</a>
      <a href="https://www.linkedin.com/in/emirhan-acar-972429223" target="_blank" rel="noopener noreferrer" class="border border-white/15 px-4 py-2 font-mono text-[11px] tracking-[0.2em] uppercase text-muted transition-colors duration-300 hover:text-ink hover:border-accent focus-ring">LinkedIn</a>
      <a href="https://github.com/emirhanacr" target="_blank" rel="noopener noreferrer" class="border border-white/15 px-4 py-2 font-mono text-[11px] tracking-[0.2em] uppercase text-muted transition-colors duration-300 hover:text-ink hover:border-accent focus-ring">GitHub</a>
      <!-- Site içi araç. Header menüsü mobilde gizli olduğu için asıl mobil giriş noktası burası. -->
      <a href="gorev-ayristirici.html" class="border border-white/15 px-4 py-2 font-mono text-[11px] tracking-[0.2em] uppercase text-muted transition-colors duration-300 hover:text-ink hover:border-accent focus-ring">Ayrıştırıcı</a>
    </div>

    <div class="pt-10 w-full flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-t border-white/10 font-mono text-[10px] sm:text-[11px] tracking-widest text-muted uppercase">
      <span>Emirhan Acar &copy; 2026</span>
      <span>Game Developer &amp; 3D Artist</span>
    </div>

  </div>
</footer>
`;
