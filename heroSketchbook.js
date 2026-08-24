// Page-turning photo book, inspired by ThreeUI's Sketchbook component
// (github.com/MengTo/threeui) — same page-curl spirit, rebuilt with your
// own photos as pages instead of Meng To's Singapore illustrations
// (the original bakes in 14 specific hand-drawn plates, so this is a
// fresh build in that style rather than a literal port).
export default function initHeroSketchbook(container, photos) {
  let current = 0;
  const pages = photos.slice(0, 8);

  const book = document.createElement('div');
  book.className = 'sketchbook-book';

  const pageEls = pages.map((photo, i) => {
    const page = document.createElement('div');
    page.className = 'sketchbook-page';
    page.style.zIndex = String(pages.length - i);

    const img = document.createElement('img');
    img.src = photo.url;
    img.alt = photo.city || photo.title || 'photo';
    img.loading = i < 2 ? 'eager' : 'lazy';
    page.appendChild(img);

    if (photo.city || photo.country) {
      const cap = document.createElement('div');
      cap.className = 'sketchbook-caption';
      cap.textContent = [photo.city, photo.country].filter(Boolean).join(', ');
      page.appendChild(cap);
    }

    page.addEventListener('click', () => turnTo(i + 1));
    book.appendChild(page);
    return page;
  });

  const prevBtn = document.createElement('button');
  prevBtn.className = 'sketchbook-nav sketchbook-prev';
  prevBtn.type = 'button';
  prevBtn.setAttribute('aria-label', 'Previous page');
  prevBtn.innerHTML = '&#8249;';
  prevBtn.addEventListener('click', (e) => { e.stopPropagation(); turnTo(current - 1); });

  const nextBtn = document.createElement('button');
  nextBtn.className = 'sketchbook-nav sketchbook-next';
  nextBtn.type = 'button';
  nextBtn.setAttribute('aria-label', 'Next page');
  nextBtn.innerHTML = '&#8250;';
  nextBtn.addEventListener('click', (e) => { e.stopPropagation(); turnTo(current + 1); });

  function turnTo(index) {
    current = Math.max(0, Math.min(pages.length, index));
    pageEls.forEach((page, i) => {
      const turned = i < current;
      page.classList.toggle('is-turned', turned);
      page.style.zIndex = turned ? String(i + 1) : String(pages.length - i);
    });
  }

  const onKey = (e) => {
    if (e.key === 'ArrowRight') turnTo(current + 1);
    if (e.key === 'ArrowLeft') turnTo(current - 1);
  };
  document.addEventListener('keydown', onKey);

  container.appendChild(book);
  container.appendChild(prevBtn);
  container.appendChild(nextBtn);

  return () => {
    document.removeEventListener('keydown', onKey);
    container.innerHTML = '';
  };
}
