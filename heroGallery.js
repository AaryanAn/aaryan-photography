import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';

// Rotating cylindrical photo gallery, adapted from ThreeUI's Gallery
// component (github.com/MengTo/threeui). Uses real photo URLs instead
// of static demo assets.
export default function initHeroGallery(host, canvas, imageUrls) {
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
  camera.position.z = 18;

  const gallery = new THREE.Group();
  scene.add(gallery);

  const geometry = new THREE.CylinderGeometry(5, 5, 1.8, 64, 1, true, 0, Math.PI * 0.4);
  const loader = new THREE.TextureLoader();
  let disposed = false;
  let frame = 0;
  let elapsed = 0;
  let previousTime = 0;
  let hostVisible = true;
  let documentVisible = !document.hidden;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const textures = imageUrls.map((url) => {
    const texture = loader.load(url, () => {
      if (disposed) { texture.dispose(); return; }
      renderer.render(scene, camera);
    });
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
    return texture;
  });

  const materials = Array.from({ length: 16 }, (_, index) => new THREE.MeshBasicMaterial({
    map: textures[index % textures.length],
    opacity: 0.9,
    side: THREE.DoubleSide,
    toneMapped: false,
    transparent: true,
  }));

  materials.forEach((material, index) => {
    const panel = new THREE.Mesh(geometry, material);
    panel.position.y = (index - 8) * 2.4;
    panel.rotation.y = (index / 16) * Math.PI * 4;
    gallery.add(panel);
  });

  const render = (time = performance.now()) => {
    if (previousTime) elapsed += Math.min((time - previousTime) / 1000, 0.05);
    previousTime = time;
    gallery.rotation.y = elapsed * 0.18;
    gallery.position.y = Math.sin(elapsed) * 1.5;
    renderer.render(scene, camera);
  };

  const tick = (time) => {
    if (disposed || !hostVisible || !documentVisible) { frame = 0; previousTime = 0; return; }
    render(time);
    frame = window.requestAnimationFrame(tick);
  };

  const start = () => {
    if (reducedMotion) { render(0); return; }
    if (!frame && hostVisible && documentVisible) frame = window.requestAnimationFrame(tick);
  };
  const stop = () => { if (frame) window.cancelAnimationFrame(frame); frame = 0; previousTime = 0; };

  const resize = () => {
    const bounds = host.getBoundingClientRect();
    const width = Math.max(1, Math.round(bounds.width));
    const height = Math.max(1, Math.round(bounds.height));
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    render();
  };

  const resizeObserver = new ResizeObserver(resize);
  const intersectionObserver = new IntersectionObserver(([entry]) => {
    hostVisible = entry?.isIntersecting ?? true;
    if (hostVisible) start(); else stop();
  });
  const handleVisibility = () => {
    documentVisible = !document.hidden;
    if (documentVisible) start(); else stop();
  };

  resizeObserver.observe(host);
  intersectionObserver.observe(host);
  document.addEventListener('visibilitychange', handleVisibility);
  resize();
  start();

  return () => {
    disposed = true;
    stop();
    resizeObserver.disconnect();
    intersectionObserver.disconnect();
    document.removeEventListener('visibilitychange', handleVisibility);
    gallery.clear();
    geometry.dispose();
    materials.forEach((m) => m.dispose());
    textures.forEach((t) => t.dispose());
    renderer.dispose();
  };
}
