// Original hero design, inspired by the general mood of bold shadowed
// editorial type + small archive photo strip + minimal data-readout
// footer (a common landing-page pattern, not copied from any specific
// site) — built fresh with real photos and original CSS/JS.
export default function initHeroArchive(container, photos) {
  const sample = photos.filter((_, i) => i % 8 === 0).slice(0, 5);

  const wrap = document.createElement('div');
  wrap.className = 'hero-archive';

  wrap.innerHTML = `
    <p class="archive-eyebrow" aria-hidden="true">Roll 001 &middot; Field Archive</p>
    <h2 class="archive-title" aria-hidden="true">
      <span data-text="AARYAN">AARYAN</span>
      <span data-text="ANAND">ANAND</span>
    </h2>
    <p class="archive-tagline" aria-hidden="true">Photographer &middot; moments worth keeping</p>
    <div class="archive-strip"></div>
    <div class="archive-footer">
      <span class="archive-footer-item" id="archiveCoords">— &deg; N, — &deg; W</span>
      <span class="archive-footer-signal" aria-hidden="true"><span class="archive-footer-signal-fill"></span></span>
      <span class="archive-footer-item" id="archiveCount">0 frames</span>
    </div>
  `;

  const strip = wrap.querySelector('.archive-strip');
  sample.forEach((photo, i) => {
    const card = document.createElement('div');
    card.className = 'archive-card';
    card.style.setProperty('--tilt', `${(i % 2 === 0 ? 1 : -1) * (3 + i * 1.5)}deg`);
    const img = document.createElement('img');
    img.src = photo.url;
    img.alt = photo.city || photo.title || 'archive photo';
    img.loading = 'eager';
    card.appendChild(img);
    const label = document.createElement('span');
    label.className = 'archive-card-label';
    label.textContent = String(i + 1).padStart(2, '0');
    card.appendChild(label);
    strip.appendChild(card);
  });

  const coordsEl = wrap.querySelector('#archiveCoords');
  const firstWithCity = photos.find((p) => p.city);
  if (firstWithCity) {
    coordsEl.textContent = [firstWithCity.city, firstWithCity.country].filter(Boolean).join(', ').toUpperCase();
  }
  const countEl = wrap.querySelector('#archiveCount');
  countEl.textContent = `${photos.length} frames`;

  container.appendChild(wrap);

  return () => { container.innerHTML = ''; };
}
