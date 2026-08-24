const SECTIONS = ['travel', 'portraits', 'everyday'];
const IMAGE_EXT = /\.(jpe?g|png|webp)$/i;

const state = {
  photos: {},   // section -> [{name, url, city, country, title}]
  lightboxSection: null,
  lightboxIndex: 0,
};

async function fetchBrowse(section) {
  try {
    const res = await fetch(`images/${section}/`, { headers: { Accept: 'application/json' } });
    if (!res.ok) return [];
    const items = await res.json();
    if (!items) return [];
    return items
      .filter((item) => !item.is_dir && IMAGE_EXT.test(item.name))
      .sort((a, b) => a.name.localeCompare(b.name));
  } catch (e) {
    console.error(`Failed to list ${section}:`, e);
    return [];
  }
}

async function fetchMetadata(section) {
  try {
    const res = await fetch(`images/${section}/metadata.json`, { cache: 'no-store' });
    if (!res.ok) return {};
    return await res.json();
  } catch (e) {
    return {};
  }
}

function buildFilterBar(allCountries) {
  const bar = document.getElementById('filterBar');
  const countries = [...new Set(allCountries)].sort();
  countries.forEach((country) => {
    const btn = document.createElement('button');
    btn.className = 'filter-btn';
    btn.type = 'button';
    btn.dataset.country = country.toLowerCase();
    btn.textContent = country;
    bar.appendChild(btn);
  });

  bar.addEventListener('click', (e) => {
    const btn = e.target.closest('.filter-btn');
    if (!btn) return;
    bar.querySelectorAll('.filter-btn').forEach((b) => b.classList.remove('is-active'));
    btn.classList.add('is-active');
    applyFilter(btn.dataset.country);
  });
}

function applyFilter(country) {
  document.querySelectorAll('.photo-card').forEach((card) => {
    const cardCountry = (card.dataset.country || '').toLowerCase();
    const show = country === 'all' || cardCountry === country;
    card.style.display = show ? '' : 'none';
  });
}

function renderSection(section, entries, metadata) {
  const strip = document.getElementById(`strip-${section}`);
  const dots = document.getElementById(`dots-${section}`);
  if (!strip) return;

  const photos = entries.map((entry) => {
    const meta = metadata[entry.name] || {};
    return { name: entry.name, url: `images/${section}/${entry.name}`, ...meta };
  });
  state.photos[section] = photos;

  photos.forEach((photo, i) => {
    const card = document.createElement('div');
    card.className = 'photo-card';
    if (photo.country) card.dataset.country = photo.country.toLowerCase();

    const frame = document.createElement('div');
    frame.className = 'photo-frame';
    const img = document.createElement('img');
    img.loading = 'lazy';
    img.src = photo.url;
    img.alt = photo.title || photo.city || `${section} photo`;
    img.addEventListener('load', () => img.classList.add('is-loaded'));
    frame.appendChild(img);
    card.appendChild(frame);

    if (photo.city || photo.country || photo.title) {
      const caption = document.createElement('div');
      caption.className = 'photo-caption';
      if (photo.city) {
        const city = document.createElement('span');
        city.className = 'photo-city';
        city.textContent = photo.city;
        caption.appendChild(city);
      } else if (photo.title) {
        const title = document.createElement('span');
        title.className = 'photo-city';
        title.textContent = photo.title;
        caption.appendChild(title);
      }
      if (photo.country) {
        const country = document.createElement('span');
        country.className = 'photo-country';
        country.textContent = photo.country;
        caption.appendChild(country);
      }
      card.appendChild(caption);
    }

    card.addEventListener('click', () => openLightbox(section, i));
    strip.appendChild(card);

    const dot = document.createElement('button');
    dot.className = 'dot';
    dot.type = 'button';
    dot.setAttribute('aria-label', `Go to photo ${i + 1}`);
    dot.addEventListener('click', () => card.scrollIntoView({ behavior: 'smooth', inline: 'start', block: 'nearest' }));
    dots.appendChild(dot);
  });

  if (photos.length === 0) {
    const section_el = document.getElementById(`section-${section}`);
    if (section_el) section_el.style.display = 'none';
    return;
  }

  const countEl = document.getElementById(`count-${section}`);
  if (countEl) countEl.textContent = `1 / ${photos.length}`;

  wireProgressDots(section, strip, dots);
}

function wireProgressDots(section, strip, dots) {
  const dotEls = [...dots.children];
  const cards = [...strip.children];
  const countEl = document.getElementById(`count-${section}`);

  let activeIndex = -1;
  const setActive = (idx) => {
    if (idx === activeIndex) return;
    activeIndex = idx;
    dotEls.forEach((d) => d.classList.remove('is-active'));
    dotEls[idx]?.classList.add('is-active');
    if (countEl) countEl.textContent = `${idx + 1} / ${cards.length}`;
  };

  // Deterministic: find whichever card's left edge is closest to the
  // strip's current scroll position (cards use scroll-snap-align: start).
  let ticking = false;
  const updateActiveCard = () => {
    ticking = false;
    const pos = strip.scrollLeft;
    let closest = 0;
    let closestDist = Infinity;
    cards.forEach((card, i) => {
      const dist = Math.abs(card.offsetLeft - strip.offsetLeft - pos);
      if (dist < closestDist) {
        closestDist = dist;
        closest = i;
      }
    });
    setActive(closest);
  };

  strip.addEventListener('scroll', () => {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(updateActiveCard);
    }
  });

  setActive(0);
}

function openLightbox(section, index) {
  state.lightboxSection = section;
  state.lightboxIndex = index;
  renderLightbox();
  document.getElementById('lightbox').classList.add('is-open');
  document.getElementById('lightbox').setAttribute('aria-hidden', 'false');
}

function closeLightbox() {
  document.getElementById('lightbox').classList.remove('is-open');
  document.getElementById('lightbox').setAttribute('aria-hidden', 'true');
}

function renderLightbox() {
  const photos = state.photos[state.lightboxSection] || [];
  const photo = photos[state.lightboxIndex];
  if (!photo) return;
  const img = document.getElementById('lightboxImage');
  img.src = photo.url;
  img.alt = photo.title || photo.city || '';
  const captionParts = [photo.city, photo.country].filter(Boolean);
  document.getElementById('lightboxCaption').textContent = photo.title || captionParts.join(', ');
}

function stepLightbox(delta) {
  const photos = state.photos[state.lightboxSection] || [];
  if (!photos.length) return;
  state.lightboxIndex = (state.lightboxIndex + delta + photos.length) % photos.length;
  renderLightbox();
}

function wireLightbox() {
  document.getElementById('lightboxClose').addEventListener('click', closeLightbox);
  document.getElementById('lightboxPrev').addEventListener('click', () => stepLightbox(-1));
  document.getElementById('lightboxNext').addEventListener('click', () => stepLightbox(1));
  document.getElementById('lightbox').addEventListener('click', (e) => {
    if (e.target.id === 'lightbox') closeLightbox();
  });

  document.addEventListener('keydown', (e) => {
    const lightbox = document.getElementById('lightbox');
    if (!lightbox.classList.contains('is-open')) return;
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowLeft') stepLightbox(-1);
    if (e.key === 'ArrowRight') stepLightbox(1);
  });

  // Swipe support
  let touchStartX = null;
  const lightbox = document.getElementById('lightbox');
  lightbox.addEventListener('touchstart', (e) => { touchStartX = e.touches[0].clientX; });
  lightbox.addEventListener('touchend', (e) => {
    if (touchStartX === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX;
    if (Math.abs(dx) > 50) stepLightbox(dx > 0 ? -1 : 1);
    touchStartX = null;
  });
}

function wireCustomCursor() {
  const dot = document.getElementById('cursorDot');
  if (!dot || window.matchMedia('(hover: none), (pointer: coarse)').matches) return;

  window.addEventListener('mousemove', (e) => {
    dot.style.left = `${e.clientX}px`;
    dot.style.top = `${e.clientY}px`;
    dot.classList.add('is-visible');
  });

  document.addEventListener('mouseover', (e) => {
    if (e.target.closest('.photo-card, button, a')) dot.classList.add('is-hovering');
  });
  document.addEventListener('mouseout', (e) => {
    if (e.target.closest('.photo-card, button, a')) dot.classList.remove('is-hovering');
  });
}

function wireScrollReveal() {
  const targets = document.querySelectorAll('.reveal');
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.2 }
  );
  targets.forEach((t) => observer.observe(t));
}

async function init() {
  wireLightbox();
  wireCustomCursor();

  const allCountries = [];

  for (const section of SECTIONS) {
    const [entries, metadata] = await Promise.all([fetchBrowse(section), fetchMetadata(section)]);
    Object.values(metadata).forEach((m) => { if (m.country) allCountries.push(m.country); });
    renderSection(section, entries, metadata);

    const header = document.querySelector(`#section-${section} .section-header`);
    if (header) header.classList.add('reveal');
  }

  buildFilterBar(allCountries);
  wireScrollReveal();
}

init();
