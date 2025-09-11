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
      this.bindAnalytics(); // ← GA4 click tracking
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
    clean = clean.replace('flaticon.png', 'flaticon.com');
    if (clean.startsWith('//')) clean = 'https:' + clean;
    return clean;
  }

  normaliseHref(url) {
    if (!url) return '';
    let u = url.trim();
    // fix common typos and protocol-relative
    u = u.replace(/^hhttps:\/\//i, 'https://');
    if (u.startsWith('//')) u = 'https:' + u;
    return u;
  }

  // Take everything after the FIRST colon, preserving schemes like https:// and mailto:
  afterFirstColon(line) {
    const i = line.indexOf(':');
    return i === -1 ? '' : line.slice(i + 1).trim();
  }

  domainAsName(u) {
    try {
      const { hostname } = new URL(u, location.href);
      return hostname.replace(/^www\./i, '');
    } catch {
      return u;
    }
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
          data.social.push(currentItem); currentItem = null;
        }
        // flush last category item
        if (currentItem && currentSection === 'category' && currentCategory) {
          currentCategory.links.push(currentItem); currentItem = null;
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
          currentItem.url = this.normaliseHref(this.afterFirstColon(line));
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
          currentItem.url = this.normaliseHref(this.afterFirstColon(line));
          continue;
        }
        if (currentItem && /description:/i.test(line)) {
          currentItem.description = this.afterFirstColon(line);
          continue;
        }

        // Handle stray bare URLs (e.g. a line that's just "https://…")
        if (/^https?:\/\//i.test(line) || /^hhttps:\/\//i.test(line) || line.startsWith('//')) {
          const fixed = this.normaliseHref(line);
          if (currentItem && !currentItem.url) {
            currentItem.url = fixed;
          } else {
            currentCategory.links.push({
              name: this.domainAsName(fixed),
              icon: '',
              url: fixed,
              description: ''
            });
          }
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

    this.data.social.forEach((link, idx) => {
      if (!link?.url) return;
      const a = document.createElement('a');
      a.href = link.url;
      a.className = 'social-icon';
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      a.setAttribute('aria-label', link.name || 'social');

      // Analytics metadata
      a.dataset.section = 'social';
      a.dataset.name = link.name || '';
      a.dataset.index = String(idx);

      a.appendChild(this.makeIconImg(link.icon, link.name));
      socialContainer.appendChild(a);
    });
  }

  renderCategories() {
    const categoriesContainer = document.querySelector('.categories');
    if (!categoriesContainer || !this.data?.categories) return;
    categoriesContainer.innerHTML = '';

    this.data.categories.forEach((category) => {
      const categoryDiv = document.createElement('div');
      categoryDiv.className = 'category';

      const categoryTitle = document.createElement('h3');
      categoryTitle.textContent = category.name;
      categoryDiv.appendChild(categoryTitle);

      const linksDiv = document.createElement('div');
      linksDiv.className = 'category-links';

      category.links.forEach((link, idx) => {
        if (!link?.url) return;

        const linkCard = document.createElement('a');
        linkCard.href = this.normaliseHref(link.url);
        linkCard.className = 'link-card';
        linkCard.target = '_blank';
        linkCard.rel = 'noopener noreferrer';
        linkCard.title = link.name || '';

        // Analytics metadata
        linkCard.dataset.section = 'category';
        linkCard.dataset.category = category.name || '';
        linkCard.dataset.name = link.name || '';
        linkCard.dataset.index = String(idx);

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

  // ---------- Analytics ----------
  gtagSafe(eventName, params = {}) {
    try {
      if (typeof window.gtag === 'function') {
        window.gtag('event', eventName, {
          ...params,
          transport_type: 'beacon',
          event_callback: params.event_callback || undefined
        });
      }
    } catch (_) { /* never block navigation */ }
  }

  buildLinkPayload(a) {
    const url = a.getAttribute('href') || '';
    const isMailto = /^mailto:/i.test(url);
    const isTel = /^tel:/i.test(url);
    const sameOrigin = (() => {
      try { return new URL(url, location.href).origin === location.origin; }
      catch { return false; }
    })();

    const section = a.dataset.section || (a.closest('.social-row') ? 'social' :
                     a.closest('.category') ? 'category' : 'unknown');

    const category =
      a.dataset.category ||
      a.closest('.category')?.querySelector('h3')?.textContent?.trim() ||
      '';

    const name =
      a.dataset.name ||
      a.querySelector('.card-title')?.textContent?.trim() ||
      a.getAttribute('aria-label') ||
      a.title ||
      a.textContent.trim() ||
      '';

    const index =
      a.dataset.index ||
      (a.parentElement ? Array.from(a.parentElement.children).indexOf(a) : -1);

    return {
      link_text: name,
      link_url: url,
      link_protocol: isMailto ? 'mailto' : isTel ? 'tel' : (sameOrigin ? 'internal' : 'https'),
      link_section: section,         // 'social' | 'category' | 'unknown'
      link_category: category,       // category name if present
      link_index: Number(index),     // 0-based position within its section
      page_title: document.title,
      page_location: location.href
    };
  }

  bindAnalytics() {
    // Delegated listener; captures all anchors now and future ones
    document.addEventListener('click', (evt) => {
      const a = evt.target.closest('a');
      if (!a) return;
      const payload = this.buildLinkPayload(a);
      this.gtagSafe('link_click', payload);
    }, { capture: true });
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new BiolinkLoader().init();
});
