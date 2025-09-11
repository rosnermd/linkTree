// script.js
class BiolinkLoader {
  constructor() {
    this.data = null;
    this.FALLBACK_ICON =
      'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><rect width="24" height="24" fill="%23f0f0f0"/><path d="M12 2a10 10 0 1 0 .001 20.001A10 10 0 0 0 12 2Zm0 18a8 8 0 1 1 0-16 8 8 0 0 1 0 16Z" fill="%23999"/></svg>';
  }

  async init() {
    try {
      await this.loadConfig();
      this.renderProfile();
      this.renderSocialLinks();
      this.renderCategories();
    } catch (error) {
      console.error('Failed to initialise biolink:', error);
    }
  }

  async loadConfig() {
    const res = await fetch('data.md');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const markdown = await res.text();
    this.data = this.parseMarkdown(markdown);
  }

  normaliseIconUrl(url) {
    if (!url) return '';
    let clean = url.trim();
    // Fix common paste mistake
    clean = clean.replace('flaticon.png', 'flaticon.com');
    // Ensure protocol if protocol-relative
    if (clean.startsWith('//')) clean = 'https:' + clean;
    return clean;
  }

  // Take everything after the FIRST colon, preserving schemes like https:// and mailto:
  afterFirstColon(line) {
    const i = line.indexOf(':');
    return i === -1 ? '' : line.slice(i + 1).trim();
  }

parseMarkdown(markdown) {
  const lines = markdown.split('\n');
  const data = { profile: {}, social: [], categories: [] };

  let currentSection = null;
  let currentCategory = null;
  let currentItem = null;

  for (let raw of lines) {
    const line = raw.trim();
    if (!line) continue;

    // Profile and social headers
    if (line === '## Profile') { currentSection = 'profile'; continue; }

    if (line === '## Social Links') {
      // flush any previous item before moving into Social
      if (currentItem && currentSection === 'category' && currentCategory) {
        currentCategory.links.push(currentItem);
        currentItem = null;
      }
      currentSection = 'social';
      continue;
    }

    // Any ### heading becomes a category
    if (line.startsWith('### ')) {
      // flush any leftover social item before leaving social
      if (currentItem && currentSection === 'social') {
        data.social.push(currentItem);
        currentItem = null;
      }
      // flush last category item
      if (currentItem && currentSection === 'category' && currentCategory) {
        currentCategory.links.push(currentItem);
        currentItem = null;
      }
      if (currentCategory) data.categories.push(currentCategory);
      currentCategory = { name: line.substring(4).trim(), links: [] };
      currentSection = 'category';
      continue;
    }

    // Profile key/value
    if (currentSection === 'profile' && line.startsWith('- **')) {
      const m = line.match(/- \*\*(.+)\*\*: (.+)/);
      if (m) {
        const key = m[1].toLowerCase().replace(/\s+/g, '_');
        data.profile[key] = m[2];
      }
      continue;
    }

    // Social links
    if (currentSection === 'social') {
      if (line.startsWith('- **') && line.endsWith('**:')) {
        if (currentItem) data.social.push(currentItem);
        currentItem = { name: line.substring(4, line.length - 3), icon: '', url: '' };
        continue;
      }
      if (currentItem && /icon:/i.test(line)) {
        currentItem.icon = this.normaliseIconUrl(this.afterFirstColon(line));
        continue;
      }
      if (currentItem && /url:/i.test(line)) {
        currentItem.url = this.afterFirstColon(line);
        continue;
      }
    }

    // Category items
    if (currentSection === 'category') {
      if (line.startsWith('- **') && line.endsWith('**:')) {
        if (currentItem) currentCategory.links.push(currentItem);
        currentItem = { name: line.substring(4, line.length - 3), icon: '', url: '', description: '' };
        continue;
      }
      if (currentItem && /icon:/i.test(line)) {
        currentItem.icon = this.normaliseIconUrl(this.afterFirstColon(line));
        continue;
      }
      if (currentItem && /url:/i.test(line)) {
        currentItem.url = this.afterFirstColon(line);
        continue;
      }
      if (currentItem && /description:/i.test(line)) {
        currentItem.description = this.afterFirstColon(line);
        continue;
      }
    }
  }

  // Final flushes
  if (currentItem && currentSection === 'social') data.social.push(currentItem);
  if (currentItem && currentSection === 'category' && currentCategory) currentCategory.links.push(currentItem);
  if (currentCategory) data.categories.push(currentCategory);

  return data;
}



  renderProfile() {
    if (!this.data?.profile) return;
    const p = this.data.profile;

    const nameEl = document.querySelector('.profile-info h1');
    if (nameEl && p.name) nameEl.textContent = p.name;

    const userEl = document.querySelector('.profile-info p');
    if (userEl && p.username) userEl.textContent = p.username;

    const heroEl = document.querySelector('.hero-image');
    if (heroEl && p.hero_image) heroEl.style.backgroundImage = `url('${p.hero_image}')`;
  }

  makeIconImg(src, alt) {
    const img = document.createElement('img');
    img.src = this.normaliseIconUrl(src) || this.FALLBACK_ICON;
    img.alt = alt || '';
    img.width = 24;
    img.height = 24;
    img.loading = 'lazy';
    img.decoding = 'async';
    img.referrerPolicy = 'no-referrer';
    img.onerror = () => { img.src = this.FALLBACK_ICON; };
    return img;
  }

  renderSocialLinks() {
    const socialContainer = document.querySelector('.social-row');
    if (!socialContainer || !this.data?.social) return;
    socialContainer.innerHTML = '';

    this.data.social.forEach(link => {
      if (!link?.url) return;
      const a = document.createElement('a');
      a.href = link.url;
      a.className = 'social-icon';
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      a.setAttribute('aria-label', link.name || 'social');
      a.appendChild(this.makeIconImg(link.icon, link.name));
      socialContainer.appendChild(a);
    });
  }

  renderCategories() {
    const categoriesContainer = document.querySelector('.categories');
    if (!categoriesContainer || !this.data?.categories) return;
    categoriesContainer.innerHTML = '';

    this.data.categories.forEach(category => {
      const categoryDiv = document.createElement('div');
      categoryDiv.className = 'category';

      const categoryTitle = document.createElement('h3');
      categoryTitle.textContent = category.name;
      categoryDiv.appendChild(categoryTitle);

      const linksDiv = document.createElement('div');
      linksDiv.className = 'category-links';

      category.links.forEach(link => {
        if (!link?.url) return;

        const linkCard = document.createElement('a');
        linkCard.href = link.url;
        linkCard.className = 'link-card';
        linkCard.target = '_blank';
        linkCard.rel = 'noopener noreferrer';

        const iconWrap = document.createElement('div');
        iconWrap.className = 'card-icon';
        iconWrap.appendChild(this.makeIconImg(link.icon, link.name));

        const content = document.createElement('div');
        content.className = 'card-content';
        content.innerHTML = `
          <div class="card-title">${link.name || ''}</div>
          <div class="card-subtitle">${link.description || ''}</div>
        `;

        linkCard.appendChild(iconWrap);
        linkCard.appendChild(content);
        linksDiv.appendChild(linkCard);
      });

      categoryDiv.appendChild(linksDiv);
      categoriesContainer.appendChild(categoryDiv);
    });
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new BiolinkLoader().init();
});


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
