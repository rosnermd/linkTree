// form.js
(() => {
  const ENDPOINT = 'https://load.datatruck.cc/to/LPxR6Fa2UOsMXADSrLUJ';
  const qs = (sel, root = document) => root.querySelector(sel);

  // -------- robust scroll helper (works in flaky in-app webviews) --------
  function scrollToEl(target, opts = {}) {
    if (!target) return;
    const pad = typeof opts.offset === 'number' ? opts.offset : 0;

    const top =
      target.getBoundingClientRect().top +
      (window.pageYOffset || document.documentElement.scrollTop) +
      pad;

    // Try modern smooth scroll
    try {
      window.scrollTo({ top, behavior: 'smooth' });
      return;
    } catch (_) { /* ignore */ }

    // Fallbacks for older WebViews
    document.documentElement.scrollTop = top;
    document.body.scrollTop = top;
  }

  // -------- detect mail icon clicks and scroll to form --------
  function isMailAnchor(a) {
    const href  = (a.getAttribute('href') || '').toLowerCase();
    const label = (a.getAttribute('aria-label') || '').toLowerCase();
    // treat the social "Email" button as mail
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

  // -------- POST handler --------
  async function submitForm(form, card) {
    const btn    = qs('#cf-submit', form);
    const helper = qs('#cf-helper', form);

    const payload = {
      name:    qs('#cf-name', form)?.value?.trim() || '',
      email:   qs('#cf-email', form)?.value?.trim() || '',
      message: qs('#cf-message', form)?.value?.trim() || '',
      source:  'clikkable.me',
      ts:      new Date().toISOString()
    };

    if (!payload.name || !payload.email || !payload.message) {
      helper.textContent = 'Please complete all fields.';
      return;
    }

    helper.textContent = '';
    btn.disabled = true;
    btn.textContent = 'Sending…';

    try {
      const res = await fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        keepalive: true,
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error('Network error ' + res.status);

      // Show thanks
      card.classList.add('flipped');
      form.reset();
      sizeFlip();

      setTimeout(() => {
        card.classList.remove('flipped');
        btn.disabled = false;
        btn.textContent = 'Send';
        sizeFlip();
      }, 5000);

    } catch (err) {
      helper.textContent = 'Sorry — there was a problem. Please try again.';
      btn.disabled = false;
      btn.textContent = 'Send';
      console.error(err);
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

  // -------- CSS sanity check just for TikTok’s stale-cache quirk --------
  function ensureContactStylesApplied() {
    const contact = qs('#contact');
    if (!contact) return;

    const cs = getComputedStyle(contact);
    // Our stylesheet sets a white background on contact-section and padding.
    // If either looks default/empty, the CSS is probably stale/cached in the WebView.
    const looksUnstyled =
      (!cs.backgroundColor || cs.backgroundColor === 'rgba(0, 0, 0, 0)') &&
      (parseInt(cs.paddingTop, 10) || 0) === 0;

    if (looksUnstyled) {
      // Force-reload the stylesheet once with a cache-buster.
      const existing = document.querySelector('link[rel="stylesheet"][href*="styles.css"]');
      if (existing) {
        const fresh = existing.cloneNode();
        const url = new URL(existing.href, location.href);
        url.searchParams.set('v', String(Date.now())); // bust cache
        fresh.href = url.toString();
        existing.insertAdjacentElement('afterend', fresh);
        // Remove the old after the new loads (best-effort)
        fresh.addEventListener('load', () => {
          requestAnimationFrame(() => existing.remove());
        });
      }
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    attachMailScroll();
    wireForm();
    // One-time check to recover if TikTok served stale CSS
    ensureContactStylesApplied();
  });
})();
