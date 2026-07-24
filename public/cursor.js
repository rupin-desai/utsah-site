(function() {
  const cursor = document.getElementById('ringCursor');
  if (!cursor) return;

  const isTouch = window.matchMedia('(hover: none)').matches;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (isTouch || reducedMotion) { cursor.style.display = 'none'; return; }

  let mx = -100, my = -100, cx = -100, cy = -100;
  let visible = false;
  const trail = [];
  const TRAIL_COUNT = 5;

  for (let i = 0; i < TRAIL_COUNT; i++) {
    const dot = document.createElement('div');
    dot.className = 'ring-trail';
    dot.style.opacity = '0';
    document.body.appendChild(dot);
    trail.push({ el: dot, x: -100, y: -100 });
  }

  cursor.classList.add('visible');
  visible = true;

  document.addEventListener('mousemove', e => {
    mx = e.clientX; my = e.clientY;
  }, { passive: true });

  const interactiveEls = 'a, button, [role="button"], input, textarea, select, label, .btn, .ig-mini__grid-item, .ig-mini__follow, .event-card, [data-src]';
  document.addEventListener('mouseover', e => {
    if (e.target.closest(interactiveEls)) cursor.classList.add('hovering');
  }, { passive: true });
  document.addEventListener('mouseout', e => {
    if (e.target.closest(interactiveEls)) cursor.classList.remove('hovering');
  }, { passive: true });

  function spawnGlitter(x, y, count) {
    for (let i = 0; i < count; i++) {
      const g = document.createElement('div');
      g.className = 'cursor-glitter';
      const angle = Math.random() * Math.PI * 2;
      const dist = 10 + Math.random() * 40;
      const size = 2 + Math.random() * 4;
      g.style.cssText = `left:${x}px;top:${y}px;width:${size}px;height:${size}px;--dx:${Math.cos(angle)*dist}px;--dy:${Math.sin(angle)*dist}px;`;
      document.body.appendChild(g);
      setTimeout(() => g.remove(), 800);
    }
  }

  document.addEventListener('click', e => {
    cursor.classList.add('clicked');
    spawnGlitter(e.clientX, e.clientY, 15);
    setTimeout(() => cursor.classList.remove('clicked'), 300);
  });

  let glitterTimer = 0;
  (function loop() {
    cx += (mx - cx) * 0.15;
    cy += (my - cy) * 0.15;
    cursor.style.left = cx + 'px';
    cursor.style.top = cy + 'px';

    glitterTimer++;
    if (visible && glitterTimer % 4 === 0) spawnGlitter(cx, cy, 1);

    const el = document.elementFromPoint(mx, my);
    if (el) cursor.classList.toggle('on-light', !!el.closest('.about,.team,.cta'));

    for (let i = trail.length - 1; i > 0; i--) {
      trail[i].x += (trail[i-1].x - trail[i].x) * 0.3;
      trail[i].y += (trail[i-1].y - trail[i].y) * 0.3;
    }
    trail[0].x += (cx - trail[0].x) * 0.4;
    trail[0].y += (cy - trail[0].y) * 0.4;

    trail.forEach((t, i) => {
      const scale = 1 - (i / TRAIL_COUNT) * 0.6;
      const op = visible ? (0.35 - (i / TRAIL_COUNT) * 0.3) : 0;
      t.el.style.transform = `translate(${t.x - 3}px, ${t.y - 3}px) scale(${scale})`;
      t.el.style.opacity = op;
    });

    requestAnimationFrame(loop);
  })();
})();
