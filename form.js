// form.js
(() => {
  const ENDPOINT = 'https://load.datatruck.cc/to/LPxR6Fa2UOsMXADSrLUJ';
  const qs = (sel, root = document) => root.querySelector(sel);

  function isMailAnchor(a) {
    const href  = (a.getAttribute('href') || '').toLowerCase();
    const label = (a.getAttribute('aria-label') || '').toLowerCase();
    return href.startsWith('mailto:') || label.includes('email');
  }

  function attachMailScroll() {
    const socialRow = qs('.social-row');
    const contact   = qs('#contact');
    if (!socialRow || !contact) return;

    socialRow.addEventListener('click', (e) => {
      const a = e.target.closest('a');
      if (!a || !isMailAnchor(a)) return;
      e.preventDefault();
      contact.scrollIntoView({ behavior: 'smooth', block: 'start' });
      const first = qs('#cf-name', contact);
      setTimeout(() => first && first.focus({ preventScroll: true }), 400);
    });
  }

  function sizeFlip() {
    const card  = qs('#contact .contact-card');
    const front = qs('#contact .flip-face.front');
    const back  = qs('#contact .flip-face.back');
    if (!card || !front || !back) return;

    // Measure both faces; set the CSS var to the taller one
    const h = Math.max(front.scrollHeight, back.scrollHeight);
    card.style.setProperty('--flip-height', `${h}px`);
  }

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

      // flip to thanks
      card.classList.add('flipped');
      form.reset();
      sizeFlip(); // ensure height matches the back face (and after reset)

      // auto flip back after 5s
      setTimeout(() => {
        card.classList.remove('flipped');
        btn.disabled = false;
        btn.textContent = 'Send';
        sizeFlip(); // recalc in case layout changed
      }, 5000);

    } catch (err) {
      helper.textContent = 'Sorry — there was a problem. Please try again.';
      btn.disabled = false;
      btn.textContent = 'Send';
      console.error(err);
    }
  }

  function wireForm() {
    const form = qs('#contact-form');
    const card = qs('#contact .contact-card');
    if (!form || !card) return;

    // First measurement
    sizeFlip();

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      await submitForm(form, card);
    });

    // Re-measure on resize and after fonts load (fonts can change heights)
    window.addEventListener('resize', sizeFlip);
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(sizeFlip).catch(() => {});
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    attachMailScroll();
    wireForm();
  });
})();
