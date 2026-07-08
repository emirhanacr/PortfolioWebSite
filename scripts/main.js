// Bu script, sections/hero.js DOM'a eklendikten SONRA çalışmalı
// (index.html'de <script> sırası bunu garanti ediyor).

// Sahte "REC" sayaç animasyonu — hero'ya canlılık katmak için
(function () {
  const el = document.getElementById('rec-timer');
  if (!el) return;
  let seconds = 0;
  setInterval(() => {
    seconds++;
    const h = String(Math.floor(seconds / 3600)).padStart(2, '0');
    const m = String(Math.floor((seconds % 3600) / 60)).padStart(2, '0');
    const s = String(seconds % 60).padStart(2, '0');
    el.textContent = `${h}:${m}:${s}`;
  }, 1000);
})();
