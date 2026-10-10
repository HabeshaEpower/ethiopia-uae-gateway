// Directory card motion: reveal on scroll and a subtle depth tilt on hover.
// Off with reduced motion; tilt only with a mouse.
(function () {
  if (window.__gwCards) return; window.__gwCards = true;
  const RM = window.matchMedia ? matchMedia('(prefers-reduced-motion: reduce)') : { matches:false };
  const FINE = window.matchMedia ? matchMedia('(hover: hover) and (pointer: fine)').matches : false;
  const seen = new WeakSet();
  const io = window.IntersectionObserver ? new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return; io.unobserve(e.target);
    e.target.style.opacity = '1'; e.target.style.transform = 'none';
  }), { rootMargin:'0px 0px -6% 0px' }) : null;
  function enhance(el) {
    if (seen.has(el)) return; seen.add(el);
    if (RM.matches || !io) return;
    el.style.transition = 'opacity .55s ease, transform .55s cubic-bezier(.2,.7,.2,1)';
    el.style.opacity = '0'; el.style.transform = 'translateY(14px)';
    io.observe(el);
    if (!FINE) return;
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect(), px = (e.clientX - r.left) / r.width - .5, py = (e.clientY - r.top) / r.height - .5;
      el.style.transition = 'transform .12s ease-out, box-shadow .2s';
      el.style.transform = 'perspective(900px) rotateX(' + (-py * 4).toFixed(2) + 'deg) rotateY(' + (px * 5).toFixed(2) + 'deg) translateY(-3px)';
      el.style.boxShadow = '0 18px 40px rgba(7,29,53,.14), 0 0 0 1px rgba(215,166,42,.18)';
      el.style.borderRadius = el.style.borderRadius || '16px';
    });
    el.addEventListener('pointerleave', () => { el.style.transition = 'transform .4s ease, box-shadow .4s'; el.style.transform = 'none'; el.style.boxShadow = ''; });
  }
  const scan = () => document.querySelectorAll('[data-gw-card]').forEach(enhance);
  new MutationObserver(scan).observe(document.documentElement, { childList:true, subtree:true });
  scan();
})();
