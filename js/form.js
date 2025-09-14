// form.js
(() => {
  const ENDPOINT = 'ADD YOUR OWN ENDPOINT HERE';
  const qs = (sel, root = document) => root.querySelector(sel);
  const on = (el, ev, fn, opts) => el && el.addEventListener(ev, fn, opts);

  // -------- robust scroll helper (works in flaky in-app webviews) --------
  function scrollToEl(target, opts = {}) {
    if (!target) return;
    const pad = typeof opts.offset === 'number' ? opts.offset : 0;

    const top =
      target.getBoundingClientRect().top +
      (window.pageYOffset || document.documentElement.scrollTop) +
      pad;

    try {
      window.scrollTo({ top, behavior: 'smooth' });
      return;
    } catch (_) {}

    // Fallbacks for older WebViews
    document.documentElement.scrollTop = top;
    document.body.scrollTop = top;
  }

  // -------- detect mail icon clicks and scroll to form --------
  function isMailAnchor(a) {
    const href  = (a.getAttribute('href') || '').toLowerCase();
    const label = (a.getAttribute('aria-label') || '').toLowerCase();
    return href.startsWith('mailto:') || label.includes('email') || label.includes('mail');
  }

  function attachMailScroll() {
    const socialRow = qs('.social-row');
    const contact   = qs('#contact');
    if (!socialRow || !contact) return;

    socialRow.addEventListener('click', (e) => {
      const a = e.target.closest('a');
      if (!a || !isMailAnchor(a)) return;
      e.preventDefault();

      // robust scroll with small top padding
      scrollToEl(contact, { offset: -8 });

      // focus the first field after the scroll has likely started
      const first = qs('#cf-name', contact);
      setTimeout(() => first && first.focus({ preventScroll: true }), 350);
    }, { capture: true });
  }

  // -------- size the flip container --------
  function sizeFlip() {
    const card  = qs('#contact .contact-card');
    const front = qs('#contact .flip-face.front');
    const back  = qs('#contact .flip-face.back');
    if (!card || !front || !back) return;

    const h = Math.max(front.scrollHeight, back.scrollHeight);
    card.style.setProperty('--flip-height', `${h}px`);
  }

  // -------- POST handler (beacon / no-cors fallback for WebViews) --------
async function submitForm(form, card) {
  const btn    = document.getElementById('cf-submit');
  const helper = document.getElementById('cf-helper');

  const payload = {
    name:    document.getElementById('cf-name')?.value?.trim() || '',
    email:   document.getElementById('cf-email')?.value?.trim() || '',
    message: document.getElementById('cf-message')?.value?.trim() || '',
    source:  location.origin,
    ts:      new Date().toISOString(),
    ua:      navigator.userAgent
  };

  if (!payload.name || !payload.email || !payload.message) {
    helper.textContent = 'Please complete all fields.';
    return;
  }

  helper.textContent = '';
  btn.disabled = true;
  btn.textContent = 'Sending…';

  const bodyStr = JSON.stringify(payload);
  const ua = navigator.userAgent.toLowerCase();
  const isConstrainedWebView = /\btiktok|instagram|fb_iab|line\//.test(ua);

  let delivered = false;

  // 1) Preferred in capable browsers: proper JSON CORS
  if (!isConstrainedWebView) {
    try {
      const res = await fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: bodyStr,
        keepalive: true,
        credentials: 'omit',
        mode: 'cors'
      });
      if (res.ok) delivered = true;
    } catch (_) { /* fall through */ }
  }

  // 2) Try Beacon
  if (!delivered && navigator.sendBeacon) {
    try {
      const blob = new Blob([bodyStr], { type: 'application/json' });
      delivered = navigator.sendBeacon(ENDPOINT, blob);
    } catch (_) { /* fall through */ }
  }

  // 3) Last resort: no-CORS fallback
  if (!delivered) {
    try {
      await fetch(ENDPOINT, {
        method: 'POST',
        mode: 'no-cors',
        keepalive: true,
        headers: { 'Content-Type': 'text/plain;charset=UTF-8' },
        body: bodyStr,
        credentials: 'omit'
      });
      delivered = true;
    } catch (_) { /* fall through */ }
  }

  // ---- Umami tracking for form submit ----
  try {
    if (typeof window.umami === 'function') {
      window.umami.track('form_submit', {
        form_id: 'contact-form',
        page_title: document.title,
        page_location: location.href,
        name: payload.name ? 'filled' : 'empty',
        email: payload.email ? 'filled' : 'empty',
        message: payload.message ? 'filled' : 'empty'
      });
    }
  } catch (_) { /* never block UX */ }

  // UX: success path regardless of readable response
  if (delivered) {
    const cardEl = document.querySelector('#contact .contact-card');
    cardEl?.classList.add('flipped');
    form.reset();

    (function sizeFlipOnce() {
      const card  = document.querySelector('#contact .contact-card');
      const front = document.querySelector('#contact .flip-face.front');
      const back  = document.querySelector('#contact .flip-face.back');
      if (!card || !front || !back) return;
      const h = Math.max(front.scrollHeight, back.scrollHeight);
      card.style.setProperty('--flip-height', `${h}px`);
    })();

    setTimeout(() => {
      document.querySelector('#contact .contact-card')?.classList.remove('flipped');
      btn.disabled = false;
      btn.textContent = 'Send';
    }, 5000);
  } else {
    helper.textContent = 'Send failed (origin likely not allowed). Please try again later.';
    btn.disabled = false;
    btn.textContent = 'Send';
  }
}



  // -------- wire up form --------
  function wireForm() {
    const form = qs('#contact-form');
    const card = qs('#contact .contact-card');
    if (!form || !card) return;

    sizeFlip();

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      await submitForm(form, card);
    });

    // Re-measure for dynamic content / font load
    window.addEventListener('resize', sizeFlip);
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(sizeFlip).catch(() => {});
    }
  }

  // -------- CSS sanity check for stale WebView cache --------
  function ensureContactStylesApplied() {
    const contact = qs('#contact');
    if (!contact) return;

    const cs = getComputedStyle(contact);
    const looksUnstyled =
      (!cs.backgroundColor || cs.backgroundColor === 'rgba(0, 0, 0, 0)') &&
      (parseInt(cs.paddingTop, 10) || 0) === 0;

    if (looksUnstyled) {
      const existing = document.querySelector('link[rel="stylesheet"][href*="styles.css"]');
      if (existing) {
        const fresh = existing.cloneNode();
        const url = new URL(existing.href, location.href);
        url.searchParams.set('v', String(Date.now())); // bust cache
        fresh.href = url.toString();
        existing.insertAdjacentElement('afterend', fresh);
        fresh.addEventListener('load', () => {
          requestAnimationFrame(() => existing.remove());
        });
      }
    }
  }

  // --- keyboard-safe padding using VisualViewport (where available)
  function bindViewportPadding(){
    const vv = window.visualViewport;
    const root = document.documentElement;
    const contact = document.getElementById('contact');
    if (!vv || !root || !contact) return;

    const update = () => {
      // amount of keyboard overlap
      const obscured = Math.max(0, window.innerHeight - vv.height);
      root.style.setProperty('--kb-safe-area', obscured ? `${obscured}px` : '0px');
    };

    on(vv, 'resize', update);
    on(vv, 'scroll', update);
    update();

    // nudge into view on focus
    ['cf-name','cf-email','cf-message'].forEach(id => {
      const el = document.getElementById(id);
      on(el, 'focus', () => {
        setTimeout(() => {
          try { el.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); }
          catch { el.scrollIntoView(); }
        }, 150);
      });
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    attachMailScroll();
    wireForm();
    ensureContactStylesApplied();
    bindViewportPadding(); // ← you were missing this call
  });
})();
