// form.js
(() => {
  const ENDPOINT = 'https://load.datatruck.cc/to/LPxR6Fa2UOsMXADSrLUJ';

  const qs  = (sel, root = document) => root.querySelector(sel);

  function forceReflow(el){ void el.offsetHeight; }

  function setPanelHeight(panel, toContent) {
    const h = toContent ? panel.scrollHeight : 0;
    panel.style.maxHeight = h + 'px';
  }

  function openPanel(panel, triggerEl) {
    panel._trigger = triggerEl || panel._trigger || null;
    panel.hidden = false;
    panel.setAttribute('aria-hidden', 'false');
    panel.classList.add('open');

    // double rAF to ensure class applied before measuring in some WebViews
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setPanelHeight(panel, true);
        forceReflow(panel);
        const first = qs('#cf-name', panel);
        first && first.focus();
      });
    });
  }

  function closePanel(panel) {
    const trigger = panel._trigger;

    // move focus out BEFORE hiding
    if (panel.contains(document.activeElement)) {
      document.activeElement.blur();
    }
    if (trigger && typeof trigger.focus === 'function') {
      trigger.focus({ preventScroll: true });
    }

    setPanelHeight(panel, false);
    panel.classList.remove('open');

    let finished = false;
    const done = () => {
      if (finished) return;
      finished = true;
      panel.setAttribute('aria-hidden', 'true');
      panel.hidden = true;

      // reset flip state for next open
      const card = qs('.contact-card', panel);
      card && card.classList.remove('flipped');
    };

    const onEnd = () => { panel.removeEventListener('transitionend', onEnd); done(); };
    panel.addEventListener('transitionend', onEnd, { once: true });
    setTimeout(done, 450); // fallback if transitionend is dropped by WebView
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
        keepalive: true,
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error('Network error ' + res.status);

      // flip to thank-you
      card.classList.add('flipped');
      form.reset();

      // auto close after 5s
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
    const panel = qs('#contact-panel');
    if (!panel) return;

    const form = qs('#contact-form', panel);
    const closeBtn = qs('#cf-close', panel);
    const card = qs('.contact-card', panel);

    // ensure hidden state at start (WebView safety)
    panel.hidden = true;
    panel.setAttribute('aria-hidden','true');
    panel.style.maxHeight = '0px';

    closeBtn?.addEventListener('click', () => closePanel(panel));

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && panel.classList.contains('open')) {
        closePanel(panel);
      }
    });

    form?.addEventListener('submit', async (e) => {
      e.preventDefault();
      await submitForm(form, card, panel);
    });

    // keep height accurate while open
    const ro = new ResizeObserver(() => {
      if (panel.classList.contains('open')) setPanelHeight(panel, true);
    });
    ro.observe(panel);

    window.addEventListener('resize', () => {
      if (panel.classList.contains('open')) setPanelHeight(panel, true);
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    attachMailInterceptor();
    wireForm();
  });
})();
