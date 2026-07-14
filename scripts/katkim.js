(function () {
  const params = new URLSearchParams(window.location.search);
  const id = params.get('proje');
  const project = KATKIM_PROJECTS[id];
  const root = document.getElementById('katkim-root');

  if (!project) {
    root.innerHTML = `
      <div class="mx-auto max-w-3xl px-5 sm:px-8 text-center">
        <span class="font-mono text-[10px] sm:text-[11px] tracking-[0.3em] text-accent uppercase">404</span>
        <h1 class="mt-3 font-display text-3xl sm:text-4xl font-semibold tracking-tight text-ink">Proje bulunamadı</h1>
        <p class="mt-4 text-sm sm:text-[15px] text-muted leading-relaxed">Aradığın proje detay sayfası mevcut değil.</p>
        <a href="index.html#projects" class="mt-8 inline-flex items-center gap-2 border border-white/15 px-5 py-3 font-mono text-[11px] tracking-[0.2em] uppercase text-ink transition-colors duration-300 hover:border-accent hover:bg-accent/10 focus-ring">
          Projelere Dön
        </a>
      </div>
    `;
    return;
  }

  const toolTags = project.tools.map(
    (tool) => `<span class="font-mono text-[10px] sm:text-[11px] tracking-[0.15em] text-accent border border-accent/30 px-2.5 py-1">#${tool}</span>`
  ).join('');

  const processSteps = project.process.map(
    (step) => `
      <li class="flex gap-3 sm:gap-4">
        <span class="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-accent"></span>
        <span class="text-sm sm:text-[15px] text-muted leading-relaxed">${step}</span>
      </li>
    `
  ).join('');

  root.innerHTML = `
    <div class="mx-auto max-w-4xl px-5 sm:px-8">

      <a href="index.html#projects" class="inline-flex items-center gap-2 font-mono text-[10px] sm:text-[11px] tracking-[0.2em] uppercase text-muted transition-colors duration-300 hover:text-ink focus-ring">
        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M17 7L7 17M7 17H17M7 17V7"/></svg>
        Projelere Dön
      </a>

      <span class="mt-8 block font-mono text-[10px] sm:text-[11px] tracking-[0.3em] text-accent uppercase">Katkım</span>
      <h1 class="mt-3 font-display text-3xl sm:text-4xl md:text-5xl font-semibold tracking-tight text-ink">${project.title}</h1>

      <div class="mt-5 flex flex-wrap gap-2">${toolTags}</div>

      <div class="mt-8 sm:mt-10 aspect-[16/9] overflow-hidden bg-panel">
        ${project.video ? `
          <video class="h-full w-full object-cover" autoplay muted loop playsinline>
            <source src="${project.video.webm}" type="video/webm" />
            <source src="${project.video.mp4}" type="video/mp4" />
          </video>
        ` : `
          <img src="${project.image}" alt="${project.title}" class="h-full w-full object-cover" />
        `}
      </div>

      <p class="mt-8 sm:mt-10 text-sm sm:text-[15px] text-muted leading-relaxed max-w-2xl">${project.summary}</p>

      <h2 class="mt-12 sm:mt-16 font-display text-xl sm:text-2xl font-semibold tracking-tight text-ink">Nasıl Yaptım</h2>
      <ul class="mt-5 flex flex-col gap-3 sm:gap-4 max-w-2xl">${processSteps}</ul>

      <a href="${project.link}" target="_blank" rel="noopener noreferrer" class="mt-12 inline-flex items-center gap-2 border border-white/15 px-5 py-3 font-mono text-[11px] tracking-[0.2em] uppercase text-ink transition-colors duration-300 hover:border-accent hover:bg-accent/10 focus-ring">
        Projeyi Gör
        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M7 17L17 7M17 7H7M17 7v10"/></svg>
      </a>

    </div>
  `;
})();
