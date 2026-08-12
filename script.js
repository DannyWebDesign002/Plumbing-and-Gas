(() => {
  'use strict';

  /* ---------- Mobile nav ---------- */
  const menuToggle = document.getElementById('menuToggle');
  const mobileNav = document.getElementById('mobileNav');

  if (menuToggle && mobileNav) {
    menuToggle.addEventListener('click', () => {
      const isOpen = mobileNav.classList.toggle('is-open');
      menuToggle.setAttribute('aria-expanded', String(isOpen));
    });

    mobileNav.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => {
        mobileNav.classList.remove('is-open');
        menuToggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  /* ---------- Recent reviews sort (Why Us) ---------- */
  const recentReviewsGrid = document.getElementById('recentReviewsGrid');

  if (recentReviewsGrid) {
    const sortBtns = Array.from(document.querySelectorAll('.review-sort-btn'));

    function sortReviews(order) {
      const cards = Array.from(recentReviewsGrid.querySelectorAll('.recent-review-card'));
      cards.sort((a, b) => {
        const diff = new Date(a.dataset.date) - new Date(b.dataset.date);
        return order === 'newest' ? -diff : diff;
      });
      cards.forEach((card) => recentReviewsGrid.appendChild(card));
    }

    sortBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        sortBtns.forEach((b) => b.classList.toggle('is-active', b === btn));
        sortReviews(btn.dataset.sort);
      });
    });
  }

  /* ---------- Footer year ---------- */
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------- Route map (pause SMIL ute animation for reduced motion) ---------- */
  const routeMap = document.getElementById('routeMap');
  if (routeMap && window.matchMedia('(prefers-reduced-motion: reduce)').matches && routeMap.pauseAnimations) {
    routeMap.pauseAnimations();
  }

  /* ---------- Route map zoom & pan ---------- */
  const mapViewport = document.getElementById('routeMapViewport');

  if (routeMap && mapViewport) {
    const zoomInBtn = document.getElementById('mapZoomIn');
    const zoomOutBtn = document.getElementById('mapZoomOut');
    const resetBtn = document.getElementById('mapZoomReset');

    const MIN_SCALE = 1;
    const MAX_SCALE = 4;
    let scale = 1;
    let x = 0;
    let y = 0;

    function clampPan() {
      const rect = mapViewport.getBoundingClientRect();
      const maxX = 0;
      const minX = Math.min(0, rect.width - rect.width * scale);
      const maxY = 0;
      const minY = Math.min(0, rect.height - rect.height * scale);
      x = Math.min(maxX, Math.max(minX, x));
      y = Math.min(maxY, Math.max(minY, y));
    }

    function apply() {
      clampPan();
      routeMap.style.transform = `translate(${x}px, ${y}px) scale(${scale})`;
    }

    function zoomTo(nextScale, originX, originY) {
      const clamped = Math.min(MAX_SCALE, Math.max(MIN_SCALE, nextScale));
      const rect = mapViewport.getBoundingClientRect();
      const px = originX !== undefined ? originX - rect.left : rect.width / 2;
      const py = originY !== undefined ? originY - rect.top : rect.height / 2;

      const ratio = clamped / scale;
      x = px - (px - x) * ratio;
      y = py - (py - y) * ratio;
      scale = clamped;
      apply();
    }

    function reset() {
      scale = 1;
      x = 0;
      y = 0;
      apply();
    }

    zoomInBtn?.addEventListener('click', () => zoomTo(scale * 1.5));
    zoomOutBtn?.addEventListener('click', () => zoomTo(scale / 1.5));
    resetBtn?.addEventListener('click', reset);

    mapViewport.addEventListener(
      'wheel',
      (event) => {
        event.preventDefault();
        const delta = event.deltaY < 0 ? 1.15 : 1 / 1.15;
        zoomTo(scale * delta, event.clientX, event.clientY);
      },
      { passive: false }
    );

    let dragging = false;
    let startX = 0;
    let startY = 0;
    let startPanX = 0;
    let startPanY = 0;

    mapViewport.addEventListener('pointerdown', (event) => {
      if (scale <= 1) return;
      dragging = true;
      mapViewport.classList.add('is-dragging');
      startX = event.clientX;
      startY = event.clientY;
      startPanX = x;
      startPanY = y;
      mapViewport.setPointerCapture(event.pointerId);
    });

    mapViewport.addEventListener('pointermove', (event) => {
      if (!dragging) return;
      x = startPanX + (event.clientX - startX);
      y = startPanY + (event.clientY - startY);
      apply();
    });

    function endDrag(event) {
      if (!dragging) return;
      dragging = false;
      mapViewport.classList.remove('is-dragging');
      if (event?.pointerId !== undefined && mapViewport.hasPointerCapture?.(event.pointerId)) {
        mapViewport.releasePointerCapture(event.pointerId);
      }
    }

    mapViewport.addEventListener('pointerup', endDrag);
    mapViewport.addEventListener('pointercancel', endDrag);

    window.addEventListener('resize', apply);
  }

  /* ---------- Review carousel ---------- */
  const carousel = document.getElementById('reviewCarousel');

  if (carousel) {
    const slides = Array.from(carousel.querySelectorAll('.review-slide'));
    const dots = Array.from(carousel.querySelectorAll('.review-dot'));
    const intervalMs = Number(carousel.dataset.autoplay) || 4000;
    let index = slides.findIndex((slide) => slide.classList.contains('is-active'));
    if (index < 0) index = 0;
    let timer = null;

    function show(nextIndex) {
      index = (nextIndex + slides.length) % slides.length;
      slides.forEach((slide, i) => slide.classList.toggle('is-active', i === index));
      dots.forEach((dot, i) => {
        dot.classList.toggle('is-active', i === index);
        dot.setAttribute('aria-selected', String(i === index));
      });
    }

    function start() {
      stop();
      timer = window.setInterval(() => show(index + 1), intervalMs);
    }

    function stop() {
      if (timer) window.clearInterval(timer);
      timer = null;
    }

    dots.forEach((dot, i) => {
      dot.addEventListener('click', () => {
        show(i);
        start();
      });
    });

    carousel.addEventListener('mouseenter', stop);
    carousel.addEventListener('mouseleave', start);
    carousel.addEventListener('focusin', stop);
    carousel.addEventListener('focusout', start);
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) stop();
      else start();
    });

    if (slides.length > 1) start();
  }

  /* ---------- Reveal-on-scroll ---------- */
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (!prefersReducedMotion && 'IntersectionObserver' in window) {
    document.documentElement.classList.add('js-reveal-ready');

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
    );

    document.querySelectorAll('.reveal').forEach((el, i) => {
      el.style.transitionDelay = `${Math.min(i % 6, 5) * 40}ms`;
      observer.observe(el);
    });
  }

  /* ---------- Contact form ---------- */
  // NOTE: replace CONTACT_ENDPOINT with the real backend/API route (or a
  // form service like Formspree/Netlify Forms) before going live. Until
  // then this will fail gracefully and the status message points the
  // visitor to the phone/email instead.
  const CONTACT_ENDPOINT = '/api/contact';

  class ApiError extends Error {
    constructor(message, status) {
      super(message);
      this.name = 'ApiError';
      this.status = status;
    }
  }

  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  async function submitWithRetry(payload, signal, retries = 2, delay = 400) {
    try {
      const res = await fetch(CONTACT_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal,
      });

      if (!res.ok) {
        throw new ApiError(`Request failed with ${res.status}`, res.status);
      }

      return res.status === 204 ? null : res.json().catch(() => null);
    } catch (err) {
      if (err.name === 'AbortError') throw err;

      const isRetryable = !(err instanceof ApiError) || err.status >= 500;
      if (retries <= 0 || !isRetryable) throw err;

      await sleep(delay);
      return submitWithRetry(payload, signal, retries - 1, delay * 2);
    }
  }

  const form = document.getElementById('contactForm');
  const statusEl = document.getElementById('formStatus');
  const submitBtn = document.getElementById('submitBtn');
  let activeController = null;

  function setStatus(message, kind) {
    statusEl.textContent = message;
    statusEl.classList.remove('is-success', 'is-error');
    if (kind) statusEl.classList.add(kind === 'success' ? 'is-success' : 'is-error');
    statusEl.classList.toggle('is-visible', Boolean(message));
  }

  if (form) {
    form.addEventListener('submit', async (event) => {
      event.preventDefault();

      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }

      activeController?.abort();
      activeController = new AbortController();

      const data = Object.fromEntries(new FormData(form).entries());

      submitBtn.disabled = true;
      submitBtn.textContent = 'Sending…';
      setStatus('', null);

      try {
        await submitWithRetry(data, activeController.signal);
        setStatus('Thanks — we’ve got your request and will be in touch shortly. For anything urgent, please call 0438 187 650.', 'success');
        form.reset();
      } catch (err) {
        if (err.name === 'AbortError') return;
        setStatus('Something went wrong sending that. Please call us on 0438 187 650 or email admin@plumbersbunbury.com.au instead.', 'error');
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Send Request';
      }
    });
  }
})();
