// The plain-text hero (no treatment) — the control variant.
export default function initHeroDefault(container) {
  container.innerHTML = `
    <div class="hero-default">
      <h2 class="hero-name" aria-hidden="true">Aaryan<br>Anand</h2>
      <p class="hero-subtitle" aria-hidden="true">Photography</p>
    </div>
  `;
  return () => { container.innerHTML = ''; };
}
