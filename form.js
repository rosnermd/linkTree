// form.js
(() => {
  const ENDPOINT = 'https://load.datatruck.cc/to/LPxR6Fa2UOsMXADSrLUJ';

  const qs  = (sel, root = document) => root.querySelector(sel);
  const qsa = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  function setPanelHeight(panel) {
    // Smooth slide height
    panel.style.maxHeight = panel.classList.contains('open') ? panel.scrollHeight + 'px' : '0px';
  }

  function openPanel(panel, triggerEl) {
    panel._trigger = triggerEl || panel._trigger || null;
    panel.removeAttribute('inert');
    panel.setAttribute('aria-hidden', 'false');
    panel.classList.add('open');
    setPanelHeight(panel);

    // focus first field
    const first = qs('#cf-name', panel);
    first && first.focus();
  }

  function closePanel(panel) {
    const trigger = panel._trigger;

    // move focus OUT before hiding, to avoid aria-hidden/focus conflict
    if (panel.contains(document.activeElement)) {
      document.activeElement.blur();
    }
    if (trigger && typeof trigger.focus === 'function') {
      // return focus to the thing that opened the panel
      trigger.focus({ preventScroll: true });
    }

    panel.classList.remove('open');
    setPanelHeight(panel);

    // after transition, mark inert/hidden
    const onEnd = () => {
      panel.setAttribute('aria-hidden', 'true');
      panel.setAttribute('inert', '');
      panel.removeEventListener('transitionend', onEnd);
    };
    panel.addEventListener('transitionend', onEnd, { once: true });

    // Reset flip so it opens on front next time
    const card = qs('.contact-card', panel);
    card && card.classList.remove('flipped');
  }

  function isMailAnchor(a) {
    const href  = (a.getAttribute('href') || '').toLowerCase();
    const label = (a.getAttribute('aria-label') || '').toLowerCase();
    return href.startsWith('mailto:') || label.includes('email');
  }

  function attachMailInterceptor() {
    const socialRow = qs('.social-row');
    if (!socialRow) return;

    socialRow.addEventListener('click', (e) => {
      const a = e.target.closest('a');
      if (!a || !isMailAnchor(a)) return;

      e.preventDefault();
      const panel = qs('#contact-panel');
      if (!panel) return;

      if (panel.classList.contains('open')) {
        closePanel(panel);
      } else {
        openPanel(panel, a);
      }
    });
  }

  async function submitForm(form, card, panel) {
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
        keepalive: true, // helps in in-app browsers
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error('Network error ' + res.status);

      // Flip to thank-you
      card.classList.add('flipped');
      form.reset();

      // After 5s, slide away and reset
      setTimeout(() => {
        closePanel(panel);
        btn.disabled = false;
        btn.textContent = 'Send';
      }, 5000);

    } catch (err) {
      helper.textContent = 'Sorry — there was a problem. Please try again.';
      btn.disabled = false;
      btn.textContent = 'Send';
      console.error(err);
    }
  }

  function wireForm() {
    const panel   = qs('#contact-panel');
    if (!panel) return;

    const form    = qs('#contact-form', panel);
    const close   = qs('#cf-close', panel);
    const card    = qs('.contact-card', panel);

    close?.addEventListener('click', () => closePanel(panel));

    // Esc to close
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && panel.classList.contains('open')) {
        closePanel(panel);
      }
    });

    form?.addEventListener('submit', async (e) => {
      e.preventDefault();
      await submitForm(form, card, panel);
    });

    // Maintain height during content/viewport changes
    const ro = new ResizeObserver(() => {
      if (panel.classList.contains('open')) setPanelHeight(panel);
    });
    ro.observe(panel);

    window.addEventListener('resize', () => {
      if (panel.classList.contains('open')) setPanelHeight(panel);
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    attachMailInterceptor();
    wireForm();
  });
})();
