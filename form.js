// form.js
(() => {
  const ENDPOINT = 'https://load.datatruck.cc/to/LPxR6Fa2UOsMXADSrLUJ';
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
    const btn    = qs('#cf-submit', form);
    const helper = qs('#cf-helper', form);

    const payload = {
      name:    qs('#cf-name', form)?.value?.trim() || '',
      email:   qs('#cf-email', form)?.value?.trim() || '',
      message: qs('#cf-message', form)?.value?.trim() || '',
      source:  location.hostname || 'clikkable.me',
      ts:      new Date().toISOString()
    };

    if (!payload.name || !payload.email || !payload.message) {
      helper.textContent = 'Please complete all fields.';
      return;
    }

    helper.textContent = '';
    btn.disabled = true;
    btn.textContent = 'Sending…';

    const bodyStr = JSON.stringify(payload);
    let queued = false;

    // 1) Try Beacon (no response read; reliable in many WebViews)
    try {
      if (navigator.sendBeacon) {
        const blob = new Blob([bodyStr], { type: 'application/json' });
        queued = navigator.sendBeacon(ENDPOINT, blob);
      }
    } catch (_) {}

    // 2) Fallback: no-cors fetch using text/plain to avoid preflight
    if (!queued) {
      try {
        await fetch(ENDPOINT, {
          method: 'POST',
          mode: 'no-cors',
          keepalive: true,
          headers: { 'Content-Type': 'text/plain;charset=UTF-8' },
          body: bodyStr
        });
        queued = true; // if it didn't throw, assume queued
      } catch (_) {}
    }

    if (queued) {
      // Treat as success
      card.classList.add('flipped');
      form.reset();
      sizeFlip();
      setTimeout(() => {
        card.classList.remove('flipped');
        btn.disabled = false;
        btn.textContent = 'Send';
        sizeFlip();
      }, 5000);
    } else {
      // Could not queue at all
      helper.textContent = 'Sorry — there was a problem. Please try again.';
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
