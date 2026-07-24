// Mark JS as available so reveals work progressively
document.documentElement.classList.add('js');

// ===== VIDEO AUTOPLAY (iOS-safe) =====
(function() {
  const v = document.querySelector('.bg-video');
  if (!v) return;
  v.muted = true;
  v.setAttribute('playsinline', '');
  v.setAttribute('webkit-playsinline', '');
  v.setAttribute('preload', 'auto');

  function tryPlay() {
    v.muted = true;
    const p = v.play();
    if (p && p.catch) p.catch(() => {});
  }

  // Event-driven: play as soon as enough data is available
  v.addEventListener('loadedmetadata', tryPlay, { once: true });
  v.addEventListener('canplay',        tryPlay, { once: true });

  // Try immediately (works if video is already cached)
  if (v.readyState >= 1) tryPlay(); else tryPlay();

  // Retry on first user gesture (iOS fallback)
  ['touchstart','touchend','click'].forEach(e =>
    document.addEventListener(e, tryPlay, { once: true, passive: true })
  );
})();

// ===== LOGO INTRO ANIMATION =====
(function() {
  const logo = document.querySelector('.nav__logo-img');
  const menu = document.querySelector('.nav__right');
  if (!logo) return;

  const isMobile = window.innerWidth <= 430;

  // ── MOBILE: intro animation ──────────────────────────────────────
  if (isMobile) {
    const overlay  = document.getElementById('mobileIntro');
    const introImg = document.getElementById('introLogo');
    if (!overlay || !introImg) return;

    overlay.style.display = 'flex';
    logo.style.opacity    = '0';
    if (menu) { menu.style.transition = 'none'; menu.style.opacity = '0'; }

    // Measure safe-area-inset-top via a probe element
    const probe = document.createElement('div');
    probe.style.cssText = 'position:fixed;top:0;left:0;width:0;padding-top:env(safe-area-inset-top,44px);visibility:hidden;pointer-events:none;';
    document.body.appendChild(probe);
    const safeTop = Math.max(probe.offsetHeight, 44);
    probe.remove();

    const vh = window.innerHeight;
    // nav__right CSS: top = safeTop+14px, height 40px → centre Y = safeTop+34
    const hamburgerY  = safeTop + 34;
    const toHamburger = -(vh / 2 - hamburgerY);

    function runIntro() {
      // 1. Set invisible starting state (no transition)
      introImg.style.transition = 'none';
      introImg.style.opacity    = '0';
      introImg.style.transform  = 'translate(-50%, -50%) scale(0.12)';

      // 2. One rAF so browser paints the invisible frame first
      requestAnimationFrame(() => {
        // Phase 1 — bloom from tiny to full size
        introImg.style.transition = 'opacity 0.7s ease, transform 1.1s cubic-bezier(0.16,1,0.3,1)';
        introImg.style.opacity    = '1';
        introImg.style.transform  = 'translate(-50%, -50%) scale(1)';

        // Phase 2 (1700ms) — fly up to hamburger position
        setTimeout(() => {
          introImg.style.transition = 'transform 1s cubic-bezier(0.4,0,0.2,1)';
          introImg.style.transform  = `translate(-50%, calc(-50% + ${toHamburger}px)) scale(0.36)`;
        }, 1700);

        // Phase 3 (2800ms) — read logo's actual rendered centre, snap hamburger there
        setTimeout(() => {
          const rect = introImg.getBoundingClientRect();
          const logoCentreY = rect.top + rect.height / 2;
          if (menu) {
            // Position nav__right so its 40px button centres on the logo
            menu.style.top       = (logoCentreY - 20) + 'px';
            menu.style.left      = '50%';
            menu.style.transform = 'translateX(-50%)';
          }

          // Logo fades out
          introImg.style.transition = 'opacity 0.45s ease';
          introImg.style.opacity    = '0';
        }, 2800);

        // Phase 4 (3050ms) — hamburger fades in at exact logo position
        setTimeout(() => {
          if (menu) {
            menu.style.transition = 'opacity 0.5s ease';
            menu.style.opacity    = '1';
            menu.classList.add('show');
          }
          const h = document.getElementById('heroHeadline');
          if (h) h.classList.add('visible');
          const u = document.getElementById('upcomingBar');
          if (u) u.classList.add('visible');
        }, 3050);

        // Phase 5 (3700ms) — clean up overlay
        setTimeout(() => {
          overlay.remove();
          logo.style.opacity       = '0';
          logo.style.pointerEvents = 'none';

          // Headline is position:absolute inside hero-spacer — scrolls away naturally, no JS needed
          const upcomingBarEl = document.getElementById('upcomingBar');
          if (upcomingBarEl) upcomingBarEl.style.transition = 'opacity 0.4s ease';
        }, 3700);
      });
    }

    // Start only once the logo image is ready
    if (introImg.complete && introImg.naturalWidth > 0) {
      requestAnimationFrame(() => runIntro());
    } else {
      introImg.onload  = () => requestAnimationFrame(() => runIntro());
      introImg.onerror = () => requestAnimationFrame(() => runIntro());
    }

    return;
  }

  // ── DESKTOP: original animation ──────────────────────────────────
  logo.classList.add('center');
  setTimeout(() => logo.classList.add('show'), 100);
  setTimeout(() => { logo.classList.remove('center','show'); logo.classList.add('to-top'); }, 1000);
  setTimeout(() => { logo.classList.remove('to-top'); logo.classList.add('done'); }, 2500);
  setTimeout(() => {
    if (menu) menu.classList.add('show');
    const heroHeadlineEl = document.getElementById('heroHeadline');
    if (heroHeadlineEl) heroHeadlineEl.classList.add('visible');
    const upcomingBar = document.getElementById('upcomingBar');
    if (upcomingBar) upcomingBar.classList.add('visible');
  }, 2500);

  // Show/hide headline based on scroll position
  const heroHeadline = document.getElementById('heroHeadline');
  if (heroHeadline) {
    window.addEventListener('scroll', () => {
      if (window.scrollY < window.innerHeight * 0.3) {
        heroHeadline.classList.add('visible');
      } else {
        heroHeadline.classList.remove('visible');
      }
    }, { passive: true });
  }
})();

// ===== BACKGROUND RING PARTICLES =====
(function() {
  const canvas = document.getElementById('particles');
  if (!canvas) return;
  // Particles are too GPU-expensive on mobile — skip entirely
  if (window.innerWidth <= 430) return;
  const ctx = canvas.getContext('2d');
  let W, H;

  function resize() {
    W = canvas.width = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  const COLORS = [
    'rgba(139,26,43,0.2)',
    'rgba(139,26,43,0.12)',
    'rgba(165,40,56,0.15)',
    'rgba(255,255,255,0.06)',
    'rgba(255,255,255,0.04)',
  ];

  class Ring {
    constructor() { this.reset(true); }
    reset(init) {
      this.x = Math.random() * W;
      this.y = init ? Math.random() * H * 3 : H + 60;
      this.size = 8 + Math.random() * 28;
      this.speedY = 0.15 + Math.random() * 0.4;
      this.speedX = (Math.random() - 0.5) * 0.3;
      this.rot = Math.random() * Math.PI * 2;
      this.rotSpeed = (Math.random() - 0.5) * 0.008;
      this.opacity = 0.08 + Math.random() * 0.18;
      this.color = COLORS[Math.floor(Math.random() * COLORS.length)];
      this.tilt = 0.4 + Math.random() * 0.6;
    }
    draw() {
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.rotate(this.rot);
      ctx.globalAlpha = this.opacity;
      ctx.strokeStyle = this.color;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.ellipse(-this.size * 0.22, 0, this.size, this.size * this.tilt, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.ellipse(this.size * 0.22, 0, this.size, this.size * this.tilt, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
    update() {
      this.y -= this.speedY;
      this.x += this.speedX + Math.sin(Date.now() * 0.0005 + this.size) * 0.15;
      this.rot += this.rotSpeed;
      if (this.y < -80) this.reset(false);
    }
  }

  class Sparkle {
    constructor() { this.reset(true); }
    reset(init) {
      this.x = Math.random() * W;
      this.y = init ? Math.random() * H * 3 : H + 30;
      this.size = 1 + Math.random() * 2.5;
      this.speedY = 0.2 + Math.random() * 0.5;
      this.speedX = (Math.random() - 0.5) * 0.2;
      this.twinkle = Math.random() * Math.PI * 2;
      this.twinkleSpeed = 0.02 + Math.random() * 0.04;
      this.baseOpacity = 0.1 + Math.random() * 0.25;
    }
    draw() {
      const op = this.baseOpacity * (0.5 + 0.5 * Math.sin(this.twinkle));
      ctx.save();
      ctx.globalAlpha = op;
      ctx.fillStyle = '#8B1A2B';
      ctx.translate(this.x, this.y);
      ctx.beginPath();
      const s = this.size;
      ctx.moveTo(0, -s * 2.5);
      ctx.lineTo(s * 0.4, -s * 0.4);
      ctx.lineTo(s * 2.5, 0);
      ctx.lineTo(s * 0.4, s * 0.4);
      ctx.lineTo(0, s * 2.5);
      ctx.lineTo(-s * 0.4, s * 0.4);
      ctx.lineTo(-s * 2.5, 0);
      ctx.lineTo(-s * 0.4, -s * 0.4);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
    update() {
      this.y -= this.speedY;
      this.x += this.speedX;
      this.twinkle += this.twinkleSpeed;
      if (this.y < -30) this.reset(false);
    }
  }

  class Dot {
    constructor() { this.reset(true); }
    reset(init) {
      this.x = Math.random() * W;
      this.y = init ? Math.random() * H * 3 : H + 20;
      this.size = 0.8 + Math.random() * 1.5;
      this.speedY = 0.1 + Math.random() * 0.35;
      this.drift = Math.random() * Math.PI * 2;
      this.opacity = 0.06 + Math.random() * 0.12;
    }
    draw() {
      ctx.save();
      ctx.globalAlpha = this.opacity;
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    update() {
      this.y -= this.speedY;
      this.x += Math.sin(this.drift + Date.now() * 0.0003) * 0.2;
      if (this.y < -20) this.reset(false);
    }
  }

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReducedMotion) return;

  const count = Math.min(Math.floor(W / 50), 30);
  const rings = Array.from({ length: Math.floor(count * 0.4) }, () => new Ring());
  const sparkles = Array.from({ length: Math.floor(count * 0.35) }, () => new Sparkle());
  const dots = Array.from({ length: Math.floor(count * 0.5) }, () => new Dot());

  let scrollY = 0;
  window.addEventListener('scroll', () => scrollY = window.scrollY, { passive: true });

  function animate() {
    ctx.clearRect(0, 0, W, H);
    ctx.save();
    ctx.translate(0, scrollY * 0.08);
    rings.forEach(r => { r.update(); r.draw(); });
    sparkles.forEach(s => { s.update(); s.draw(); });
    dots.forEach(d => { d.update(); d.draw(); });
    ctx.restore();
    requestAnimationFrame(animate);
  }
  animate();
})();

// ===== RING CURSOR =====
(function() {
  const cursor = document.getElementById('ringCursor');
  const decor = document.getElementById('ringsDecor');
  if (!cursor) return;

  const isTouch = window.matchMedia('(hover: none)').matches;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (isTouch || reducedMotion) {
    cursor.style.display = 'none';
    if (decor) decor.style.display = 'none';
    return;
  }

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
    mx = e.clientX;
    my = e.clientY;
  }, { passive: true });

  const interactiveEls = 'a, button, [role="button"], .btn, .event-type, .nav__cta';
  document.addEventListener('mouseover', e => {
    if (e.target.closest(interactiveEls)) {
      cursor.classList.add('hovering');
    }
  }, { passive: true });
  document.addEventListener('mouseout', e => {
    if (e.target.closest(interactiveEls)) {
      cursor.classList.remove('hovering');
    }
  }, { passive: true });

  // Decorative floating rings
  if (decor) {
    const docH = () => document.documentElement.scrollHeight - window.innerHeight;
    let dx = window.innerWidth * 0.85, dy = 80;
    let dtx = dx, dty = dy, drot = 0;

    window.addEventListener('scroll', () => {
      const f = window.scrollY / (docH() || 1);
      dty = 80 + f * (window.innerHeight - 180);
      dtx = window.innerWidth * 0.85 - f * window.innerWidth * 0.55;
      drot = f * 180;
      if (!decor.classList.contains('visible')) decor.classList.add('visible');
    }, { passive: true });

    (function decorLoop() {
      dx += (dtx - dx) * 0.03;
      dy += (dty - dy) * 0.03;
      const bob = Math.sin(Date.now() * 0.0008) * 8;
      decor.style.transform = `translate(${dx - 70}px, ${dy - 50 + bob}px) rotate(${drot}deg)`;
      decor.style.left = '0';
      decor.style.top = '0';

      const el = document.elementFromPoint(dx, dy);
      if (el) {
        const onLight = el.closest('.about,.team,.cta');
        decor.style.opacity = onLight ? '0.15' : '0.4';
      }
      requestAnimationFrame(decorLoop);
    })();
  }

  // Glitter emitter
  let glitterTimer = 0;
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

  // Click pop burst
  document.addEventListener('click', (e) => {
    cursor.classList.add('clicked');
    spawnGlitter(e.clientX, e.clientY, 15);
    setTimeout(() => cursor.classList.remove('clicked'), 300);
  });

  (function loop() {
    cx += (mx - cx) * 0.15;
    cy += (my - cy) * 0.15;
    cursor.style.left = cx + 'px';
    cursor.style.top = cy + 'px';

    // Emit glitter while moving
    glitterTimer++;
    if (visible && glitterTimer % 4 === 0) {
      spawnGlitter(cx, cy, 1);
    }

    const el = document.elementFromPoint(mx, my);
    if (el) {
      const onLight = el.closest('.about,.team,.cta');
      cursor.classList.toggle('on-light', !!onLight);
    }

    for (let i = trail.length - 1; i > 0; i--) {
      trail[i].x += (trail[i - 1].x - trail[i].x) * 0.3;
      trail[i].y += (trail[i - 1].y - trail[i].y) * 0.3;
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

// ===== HERO — show text, fade on scroll =====
(function() {
  const heroContent = document.querySelector('.hero__content');
  const beats = document.querySelectorAll('.hero__beat');
  const indicator = document.querySelector('.hero__scroll-indicator');
  if (!heroContent) return;

  // Show all beats immediately
  beats.forEach(b => b.classList.add('active'));

  // Keep hero text visible, no fade
  window.addEventListener('scroll', () => {
    const scrollY = window.scrollY;

    if (indicator) {
      indicator.classList.toggle('faded', scrollY > 50);
    }
  }, { passive: true });
})();

// ===== NAV =====
const nav = document.getElementById('nav');
window.addEventListener('scroll', () => nav.classList.toggle('scrolled', scrollY > 60), { passive: true });

// ===== DROPDOWN MENU =====
const dropBtn = document.getElementById('dropdownBtn');
const dropMenu = document.getElementById('dropdownMenu');
if (dropBtn && dropMenu) {
  const backdrop = document.getElementById('navBackdrop');

  const closeMenu = () => {
    dropMenu.classList.remove('open');
    dropBtn.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
    if (backdrop) backdrop.classList.remove('open');
    // Restore hamburger after menu collapse animation finishes
    setTimeout(() => { dropBtn.style.display = ''; }, 400);
  };

  const menuCloseBtn = document.getElementById('menuCloseBtn');
  if (menuCloseBtn) menuCloseBtn.addEventListener('click', (e) => { e.stopPropagation(); closeMenu(); });

  dropBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    // Immediately hide the button element so iOS doesn't render its box
    dropBtn.style.display = 'none';
    dropMenu.classList.add('open');
    dropBtn.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
    if (backdrop) backdrop.classList.add('open');
  });

  dropMenu.querySelectorAll('a').forEach(a => a.addEventListener('click', closeMenu));
  if (backdrop) backdrop.addEventListener('click', closeMenu);
  document.addEventListener('click', (e) => {
    if (!dropMenu.contains(e.target) && !dropBtn.contains(e.target)) closeMenu();
  });

  window.addEventListener('scroll', () => {
    if (window.scrollY > 20) closeMenu();
  }, { passive: true });
}

// ===== MOBILE MENU (subpages) =====
const burger = document.getElementById('burger'), mm = document.getElementById('mobileMenu');
if (burger && mm) {
  burger.addEventListener('click', () => {
    const isOpen = mm.classList.toggle('open');
    burger.classList.toggle('active');
    document.body.style.overflow = isOpen ? 'hidden' : '';
  });
  mm.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
    burger.classList.remove('active'); mm.classList.remove('open');
    document.body.style.overflow = '';
  }));
}

// ===== SCROLL REVEAL =====
const revealEls = document.querySelectorAll('.section-label,.heading-lg,.about__desc,.about__pills,.service-item,.event-type,.stat-block,.cta__title,.cta__sub,.cta__buttons');
revealEls.forEach(el => el.classList.add('reveal'));

const revealObs = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.classList.add('visible');
      revealObs.unobserve(e.target);
    }
  });
}, { threshold: 0.12 });
revealEls.forEach(el => revealObs.observe(el));

// ===== ABOUT SCROLL-DRIVEN REVEAL =====
(function() {
  const steps = [
    document.getElementById('aboutTitle'),
    document.getElementById('aboutDesc'),
    document.getElementById('aboutPills'),
    document.getElementById('aboutImages'),
  ];
  if (!steps[0]) return;

  const thresholds = [0.08, 0.22, 0.35, 0.48];

  var aboutTicking = false;
  window.addEventListener('scroll', function() {
    if (aboutTicking) return;
    aboutTicking = true;
    requestAnimationFrame(function() {
      var box = document.getElementById('aboutBox');
      if (box) {
        var rect = box.getBoundingClientRect();
        var windowH = window.innerHeight;
        var progress = Math.min(Math.max((windowH - rect.top) / (windowH + rect.height), 0), 1);
        steps.forEach(function(step, i) {
          if (step) step.classList.toggle('show', progress >= thresholds[i]);
        });
      }
      aboutTicking = false;
    });
  }, { passive: true });
})();

// ===== ABOUT DESCRIPTION LANGUAGE ROTATION =====
(function() {
  const slides = document.querySelectorAll('#aboutDescRotate .lang-slide');
  const section = document.getElementById('aboutDesc');
  if (!slides.length) return;
  let idx = 0;
  let hovered = false;
  let timer = null;
  function rotate() {
    slides[idx].classList.remove('active');
    idx = (idx + 1) % slides.length;
    slides[idx].classList.add('active');
    schedule();
  }
  function schedule() {
    clearTimeout(timer);
    if (!hovered) timer = setTimeout(rotate, 6000);
  }
  if (section) {
    section.addEventListener('mouseenter', () => { hovered = true; clearTimeout(timer); });
    section.addEventListener('mouseleave', () => { hovered = false; schedule(); });
  }
  schedule();
})();


// ===== FULLSCREEN GALLERY =====
(function() {
  const section = document.getElementById('fsGallery');
  if (!section) return;
  const slide = document.getElementById('fsSlide');
  if (!slide) return;
  const photoA = document.getElementById('fsPhotoA');
  const photoB = document.getElementById('fsPhotoB');

  const photos = [
    'assets/events/wedding/pw1.jpeg','assets/events/wedding/pw2.jpeg','assets/events/wedding/pw3.jpeg','assets/events/wedding/pw4.jpeg','assets/events/wedding/pw5.jpeg','assets/events/wedding/pw6.jpeg','assets/events/wedding/pw7.jpeg','assets/events/wedding/pw8.jpeg','assets/events/wedding/pw9.jpeg','assets/events/wedding/pw10.jpeg','assets/events/wedding/pw11.jpeg','assets/events/wedding/pw12.jpeg','assets/events/wedding/pw13.jpeg','assets/events/wedding/pw14.jpeg','assets/events/wedding/pw15.jpeg','assets/events/wedding/pw16.jpeg','assets/events/wedding/pw17.jpeg','assets/events/wedding/pw18.jpeg','assets/events/wedding/pw19.jpeg','assets/events/wedding/pw20.jpeg','assets/events/wedding/pw21.jpeg','assets/events/wedding/pw22.jpeg','assets/events/wedding/pw23.jpeg','assets/events/wedding/pw24.jpeg','assets/events/wedding/pw25.jpeg','assets/events/wedding/pw26.jpeg','assets/events/wedding/pw27.jpeg',
    'assets/events/corporate/pc1.jpeg','assets/events/corporate/pc2.jpeg','assets/events/corporate/pc3.jpeg','assets/events/corporate/pc4.jpeg','assets/events/corporate/pc5.jpeg','assets/events/corporate/pc6.jpeg','assets/events/corporate/pc7.jpeg','assets/events/corporate/pc8.jpeg','assets/events/corporate/pc9.jpeg','assets/events/corporate/pc10.jpeg','assets/events/corporate/pc11.jpeg','assets/events/corporate/pc12.jpeg','assets/events/corporate/pc13.jpeg','assets/events/corporate/pc14.jpeg','assets/events/corporate/pc15.jpeg','assets/events/corporate/pc16.jpeg','assets/events/corporate/pc17.jpeg','assets/events/corporate/pc18.jpeg','assets/events/corporate/pc19.jpeg','assets/events/corporate/pc20.jpeg','assets/events/corporate/pc21.jpeg','assets/events/corporate/pc22.jpeg','assets/events/corporate/pc23.jpeg','assets/events/corporate/pc24.jpeg','assets/events/corporate/pc25.jpeg','assets/events/corporate/pc26.jpeg','assets/events/corporate/pc27.jpeg','assets/events/corporate/pc28.jpeg','assets/events/corporate/pc29.jpeg','assets/events/corporate/pc30.jpeg','assets/events/corporate/pc31.jpeg','assets/events/corporate/pc32.jpeg','assets/events/corporate/pc33.jpeg','assets/events/corporate/pc34.jpeg','assets/events/corporate/pc35.jpeg','assets/events/corporate/pc36.jpeg','assets/events/corporate/pc37.jpeg','assets/events/corporate/pc38.jpeg','assets/events/corporate/pc39.jpeg','assets/events/corporate/pc40.jpeg','assets/events/corporate/pc41.jpeg','assets/events/corporate/pc42.jpeg','assets/events/corporate/pc43.jpeg','assets/events/corporate/pc44.jpeg','assets/events/corporate/pc45.jpeg',
    'assets/events/live/pl1.jpeg','assets/events/live/pl2.jpeg','assets/events/live/pl3.jpeg','assets/events/live/pl4.jpeg','assets/events/live/pl5.jpeg','assets/events/live/pl6.jpeg','assets/events/live/pl7.jpeg','assets/events/live/pl8.jpeg','assets/events/live/pl9.jpeg','assets/events/live/pl10.jpeg','assets/events/live/pl11.jpeg','assets/events/live/pl12.jpeg','assets/events/live/pl13.jpeg','assets/events/live/pl14.jpeg','assets/events/live/pl15.jpeg','assets/events/live/pl16.jpeg','assets/events/live/pl17.jpeg','assets/events/live/pl18.jpeg','assets/events/live/pl19.jpeg'
  ];
  let photoIdx = 0;
  let useA = true;
  photoA.style.backgroundImage = `url('${photos[0]}')`;
  photoB.style.backgroundImage = `url('${photos[1]}')`;

  const isMobileGallery = window.innerWidth <= 430;

  setInterval(() => {
    photoIdx = (photoIdx + 1) % photos.length;
    if (useA) {
      photoB.style.backgroundImage = `url('${photos[photoIdx]}')`;
      photoA.style.opacity = 0;
      photoB.style.opacity = 1;
    } else {
      photoA.style.backgroundImage = `url('${photos[photoIdx]}')`;
      photoB.style.opacity = 0;
      photoA.style.opacity = 1;
    }
    useA = !useA;
  }, isMobileGallery ? 3500 : 2000);

  const slides = [slide];
  const total = 1;

  function lerp(a, b, t) { return a + (b - a) * t; }
  function clamp(v, lo, hi) { return Math.min(Math.max(v, lo), hi); }
  function ease(t) { return t < 0.5 ? 2*t*t : -1+(4-2*t)*t; }

  function update() {
    const rect = section.getBoundingClientRect();
    const scrollable = section.offsetHeight - window.innerHeight;
    const progress = clamp(-rect.top / scrollable, 0, 1);
    const slotSize = 1 / total;

    slides.forEach((slide, i) => {
      const local = clamp((progress - i * slotSize) / slotSize, 0, 1);

      if (progress < i * slotSize) {
        slide.style.opacity = 0;
        slide.style.width = Math.min(820, window.innerWidth * 0.9) + 'px';
        slide.style.height = Math.min(460, window.innerHeight * 0.55) + 'px';
        slide.style.borderRadius = '18px';
        slide.style.transform = 'translate(-50%, -50%) scale(0.96)';
        return;
      }

      const expandT = ease(clamp(local / 0.4, 0, 1));
      const collapseT = ease(clamp((local - 0.6) / 0.4, 0, 1));
      const netT = expandT - collapseT;

      const startW = Math.min(820, window.innerWidth * 0.9);
      const startH = Math.min(460, window.innerHeight * 0.55);
      const w = lerp(startW, window.innerWidth, netT);
      const h = lerp(startH, window.innerHeight, netT);
      const br = lerp(18, 0, netT);
      const scale = lerp(0.96, 1, netT);

      let opacity = 1;
      if (local < 0.06) opacity = local / 0.06;
      else if (local > 0.92) opacity = 1 - (local - 0.92) / 0.08;

      slide.style.width = w + 'px';
      slide.style.height = h + 'px';
      slide.style.borderRadius = br + 'px';
      slide.style.opacity = opacity;
      slide.style.transform = `translate(-50%, -50%) scale(${scale})`;
      slide.style.boxShadow = `0 ${lerp(12, 0, netT)}px ${lerp(48, 0, netT)}px rgba(0,0,0,${lerp(0.55, 0, netT)})`;
    });
  }

  if (isMobileGallery) {
    // On mobile: static full-bleed image, no scroll-driven width/height changes
    slide.style.width = '100%';
    slide.style.height = '100%';
    slide.style.borderRadius = '0';
    slide.style.opacity = '1';
    slide.style.transform = 'translate(-50%, -50%) scale(1)';
    slide.style.boxShadow = 'none';
  } else {
    let galleryTicking = false;
    window.addEventListener('scroll', () => {
      if (!galleryTicking) {
        galleryTicking = true;
        requestAnimationFrame(() => { update(); galleryTicking = false; });
      }
    }, { passive: true });
    window.addEventListener('resize', update, { passive: true });
    update();
  }
})();

// ===== ABOUT SLIDESHOW =====
(function() {
  const slides = document.querySelectorAll('.about__slide');
  if (!slides.length) return;
  let idx = 0;
  setInterval(function() {
    slides[idx].classList.remove('active');
    idx = (idx + 1) % slides.length;
    slides[idx].classList.add('active');
  }, 2000);
})();

// ===== GALLERY SCATTER SECTION =====
(function() {
  const section = document.getElementById('galleryScatter');
  if (!section) return;
  const imgs = section.querySelectorAll('.scatter-img');

  // Where each image flies in from (scattered positions)
  const offsets = [
    { x: '-55vw', y: '-40vh', r: -18, s: 0.8 },
    { x:  '50vw', y: '-38vh', r:  14, s: 0.9 },
    { x: '-52vw', y:  '42vh', r: -12, s: 0.85 },
    { x:  '48vw', y:  '40vh', r:  10, s: 0.8 },
    { x:   '0vw', y: '-55vh', r:  -6, s: 0.75 },
  ];

  // Settled positions (slight offsets so they fan nicely)
  const settled = [
    { x: '-20vw', y: '-8vh',  r: -6,  s: 0.85, z: 1 },
    { x:  '18vw', y: '-6vh',  r:  5,  s: 0.85, z: 2 },
    { x:  '-8vw', y:  '10vh', r: -3,  s: 0.9,  z: 3 },
    { x:  '22vw', y:  '12vh', r:  8,  s: 0.82, z: 1 },
    { x:   '2vw', y:  '-2vh', r:  0,  s: 1.05, z: 4 },
  ];

  function lerp(a, b, t) { return a + (b - a) * t; }
  function clamp(v, lo, hi) { return Math.min(Math.max(v, lo), hi); }

  function parsePx(val, axis) {
    if (typeof val === 'string') {
      if (val.endsWith('vw')) return parseFloat(val) / 100 * window.innerWidth;
      if (val.endsWith('vh')) return parseFloat(val) / 100 * window.innerHeight;
    }
    return parseFloat(val);
  }

  function update() {
    const rect = section.getBoundingClientRect();
    const vh = window.innerHeight;
    const sectionH = section.offsetHeight;
    // progress: 0 = section just entered, 0.5 = settled, 1 = end of section
    const raw = -rect.top / (sectionH - vh);
    const progress = clamp(raw, 0, 1);
    // settle phase 0→0.5, hold 0.5→1
    const settle = clamp(progress / 0.5, 0, 1);

    imgs.forEach((img, i) => {
      const from = offsets[i] || offsets[0];
      const to   = settled[i] || settled[0];
      const tx = lerp(parsePx(from.x), parsePx(to.x), settle);
      const ty = lerp(parsePx(from.y), parsePx(to.y), settle);
      const rot = lerp(from.r, to.r, settle);
      const sc  = lerp(from.s, to.s, settle);
      img.style.transform = `translate(${tx}px, ${ty}px) rotate(${rot}deg) scale(${sc})`;
      img.style.opacity = 1;
      img.style.zIndex = settled[i]?.z || 1;
    });

    section.classList.toggle('settled', settle >= 1);
  }

  window.addEventListener('scroll', update, { passive: true });
  update();
})();


// ===== HERO LANGUAGE ROTATION — all sections synced =====
(function() {
  const rotators = document.querySelectorAll('.lang-rotate');
  const heroTextSection = document.querySelector('.hero-text');
  if (!rotators.length || !heroTextSection) return;
  let current = 0;
  const total = 3;
  let started = false;

  function rotate() {
    rotators.forEach(r => {
      const slides = r.querySelectorAll('.lang-slide');
      if (slides[current]) slides[current].classList.remove('active');
      const next = (current + 1) % total;
      if (slides[next]) slides[next].classList.add('active');
    });
    current = (current + 1) % total;
  }

  const startObs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting && !started) {
        started = true;
        setInterval(rotate, 3000);
        startObs.disconnect();
      }
    });
  }, { threshold: 0.3 });

  startObs.observe(heroTextSection);
})();

// Fade in hero-text section
const heroText = document.querySelector('.hero-text');
if (heroText) revealObs.observe(heroText);

// ===== STATS COUNTER =====
const statNums = document.querySelectorAll('.stat-block__number');
let counted = false;
const so = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting && !counted) {
      counted = true;
      statNums.forEach(el => {
        const t = +el.dataset.target, suf = el.dataset.suffix || '';
        const dur = 2200, start = performance.now();
        (function tick(now) {
          const p = Math.min((now-start)/dur, 1);
          const eased = 1 - Math.pow(1-p, 3);
          const v = Math.floor(eased * t);
          el.textContent = (t >= 1000 ? (v/1000).toFixed(v >= t ? 0 : 1) + 'k' : v) + suf;
          if (p < 1) requestAnimationFrame(tick);
        })(performance.now());
      });
    }
  });
}, { threshold: 0.3 });
statNums.forEach(el => so.observe(el));

// ===== SMOOTH SCROLL =====
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const t = document.querySelector(a.getAttribute('href'));
    if (t) { e.preventDefault(); t.scrollIntoView({ behavior: 'smooth' }); }
  });
});

// ===== GOOGLE REVIEWS =====
(function() {
  const PLACE_ID = 'ChIJlRrJHtZn4DsR7wN-UGhArIU';
  const API_KEY = 'AIzaSyAHySBnryAALwUAt_jqQ94VAzVMXv4eFBU';
  const summaryEl = document.getElementById('reviewsSummary');
  const trackEl = document.getElementById('reviewsTrack');
  if (!trackEl) return;

  const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${PLACE_ID}&fields=name,rating,reviews,user_ratings_total&key=${API_KEY}`;

  // Google Places API doesn't support CORS from browser, so we proxy through our server
  fetch(`/google-reviews`)
    .then(r => r.json())
    .then(data => {
      if (!data.result) throw new Error('No data');
      renderReviews(data.result);
    })
    .catch(() => {
      // Fallback: use cached reviews
      renderReviews({
        rating: 5.0,
        user_ratings_total: 70,
        reviews: [
          { author_name: 'Jayesh Patel', rating: 5, text: 'We had a 1st time experience with UTSAH events & it was really Superbly organised. Pool parties, games, dancing, gifts — everything was amazing!', relative_time_description: '3 years ago', profile_photo_url: '' },
          { author_name: 'Bariya Bharat', rating: 5, text: 'Amazing Experience! Amazing Food Service, Amazing Transportation Facilities. Two trips with Utsah — Abu and Udaipur — both were excellent.', relative_time_description: '3 years ago', profile_photo_url: '' },
          { author_name: 'Kamini Patel', rating: 5, text: 'Utsah events are the best! Amazing! Never seen this type of vacation. Welcome kits, service quality, hotel hospitality, food — everything was perfect.', relative_time_description: '3 years ago', profile_photo_url: '' },
          { author_name: 'Raveena Yadav', rating: 5, text: 'Heart touched Service Provided. So thankful to Utsah Event! Exceptional care, enthusiasm, and feeling special — reasons for repeat bookings.', relative_time_description: '3 years ago', profile_photo_url: '' },
          { author_name: 'Archana Pansuriya', rating: 5, text: 'It was awesome experience with Utsah event. Enjoyed lots in our tour with wonderful welcome, surprise gifts, and excellent time management.', relative_time_description: '4 years ago', profile_photo_url: '' },
        ]
      });
    });

  function renderReviews(result) {
    const { rating, user_ratings_total, reviews } = result;

    // Summary
    if (summaryEl) {
      const stars = '★'.repeat(Math.round(rating)) + '☆'.repeat(5 - Math.round(rating));
      summaryEl.innerHTML = `
        <p class="reviews__summary-rating">${rating.toFixed(1)}</p>
        <p class="reviews__summary-stars">${stars}</p>
        <p class="reviews__summary-count">${user_ratings_total} reviews on Google</p>
        <p class="reviews__summary-badge">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
          Google Reviews
        </p>
      `;
    }

    // Review cards — duplicate for infinite scroll
    const allReviews = [...reviews, ...reviews];
    trackEl.innerHTML = allReviews.map(r => {
      const stars = '★'.repeat(r.rating) + '☆'.repeat(5 - r.rating);
      const initial = r.author_name.charAt(0).toUpperCase();
      const avatar = `<div class="t-card__avatar t-card__avatar--initial">${initial}</div>`;
      return `
        <div class="t-card">
          <div class="t-card__header">
            ${avatar}
            <div class="t-card__meta">
              <p class="t-card__name">${r.author_name}</p>
              <p class="t-card__stars">${stars}</p>
            </div>
          </div>
          <p class="t-card__text">"${r.text.length > 180 ? r.text.slice(0, 180) + '...' : r.text}"</p>
          <p class="t-card__time">${r.relative_time_description}</p>
        </div>
      `;
    }).join('');
  }
})();

// ===== EDIT MODE =====
(function() {
  let editing = false;
  const SEL = 'h1,h2,h3,h4,p:not(.t-card__stars):not(.stat-block__label),.service-item__icon,.section-label,.pill';
  const bar = document.createElement('div');
  bar.id = 'editBar';
  bar.style.cssText = 'position:fixed;bottom:20px;right:20px;z-index:9999;display:flex;gap:8px;background:rgba(26,10,14,.92);backdrop-filter:blur(12px);border:1px solid rgba(139,26,43,.4);border-radius:100px;padding:6px 10px;box-shadow:0 8px 32px rgba(0,0,0,.4)';
  bar.innerHTML = '<button id="editToggle">✏️ Edit</button><button id="editSave" style="display:none">💾 Save</button><span id="editStatus" style="display:none"></span>';
  document.body.appendChild(bar);
  const bs = 'background:none;border:1px solid rgba(255,255,255,.15);color:#fff;padding:7px 18px;border-radius:100px;font-size:.78rem;font-weight:600;cursor:pointer';
  bar.querySelectorAll('button').forEach(b => b.style.cssText = bs);
  bar.querySelector('#editStatus').style.cssText = 'font-size:.78rem;font-weight:600;padding:0 6px';

  document.getElementById('editToggle').addEventListener('click', () => {
    editing = !editing;
    document.querySelectorAll(SEL).forEach(el => el.contentEditable = editing);
    document.body.classList.toggle('edit-mode', editing);
    document.getElementById('editToggle').textContent = editing ? '🚫 Exit' : '✏️ Edit';
    document.getElementById('editSave').style.display = editing ? 'inline-block' : 'none';
  });
  document.getElementById('editSave').addEventListener('click', async () => {
    const s = document.getElementById('editStatus');
    s.style.display = 'inline-block'; s.textContent = 'Saving...'; s.style.color = '#8B1A2B';
    document.querySelectorAll('[contenteditable="true"]').forEach(el => el.removeAttribute('contenteditable'));
    bar.remove();
    const html = '<!DOCTYPE html>\n' + document.documentElement.outerHTML;
    document.body.appendChild(bar);
    document.querySelectorAll(SEL).forEach(el => el.contentEditable = true);
    try {
      const f = location.pathname.split('/').pop() || 'index.html';
      const r = await fetch('/save', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({file:f,content:html}) });
      s.textContent = r.ok ? '✓ Saved!' : '✗ Error'; s.style.color = r.ok ? '#4caf50' : '#f44336';
    } catch { s.textContent = '✗ Offline'; s.style.color = '#f44336'; }
    setTimeout(() => s.style.display = 'none', 3000);
  });
})();
