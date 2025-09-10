// script.js
class BiolinkLoader {
  constructor() {
    this.data = null;
    this.FALLBACK_ICON =
      'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><rect width="24" height="24" fill="%23f0f0f0"/><path d="M9.5 12a2.5 2.5 0 0 1 2.5-2.5h2V8h-2A4 4 0 0 0 8 12a4 4 0 0 0 4 4h2v-1.5h-2A2.5 2.5 0 0 1 9.5 12zm5-4H16a4 4 0 0 1 0 8h-1.5V14.5H16a2.5 2.5 0 0 0 0-5h-1.5V8z" fill="%23666"/></svg>';
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
    // Fix common typo
    url = url.replace('flaticon.png', 'flaticon.com');
    // Ensure https
    if (url.startsWith('//')) url = 'https:' + url;
    return url;
  }

  parseMarkdown(markdown) {
    const lines = markdown.split('\n');
    const data = { profile: {}, social: [], categories: [] };

    let currentSection = null;
    let currentCategory = null;
    let currentSocialLink = null;
    let currentCategoryLink = null;

    for (let line of lines) {
      line = line.trim();
      if (!line) continue;

      // Sections
      if (line === '## Profile') { currentSection = 'profile'; continue; }
      if (line === '## Social Links') { currentSection = 'social'; continue; }
      if (line === '## Categories') { currentSection = 'categories'; continue; }

      // Profile
      if (currentSection === 'profile' && line.startsWith('- **')) {
        const m = line.match(/- \*\*(.+)\*\*: (.+)/);
        if (m) {
          const key = m[1].toLowerCase().replace(/\s+/g, '_');
          data.profile[key] = m[2];
        }
        continue;
      }

      // Social
      if (currentSection === 'social') {
        if (line.startsWith('- **') && line.endsWith('**:')) {
          if (currentSocialLink) data.social.push(currentSocialLink);
          currentSocialLink = { name: line.substring(4, line.length - 3), icon: '', url: '' };
          continue;
        }
        if (currentSocialLink && line.startsWith('- Icon:') || currentSocialLink && line.startsWith('  - Icon:')) {
          currentSocialLink.icon = this.normaliseIconUrl(line.substring(line.indexOf(':') + 1).trim());
          continue;
        }
        if (currentSocialLink && line.startsWith('- URL:') || currentSocialLink && line.startsWith('  - URL:')) {
          currentSocialLink.url = line.substring(line.indexOf(':') + 1).trim();
          continue;
        }
      }

      // Categories
      if (currentSection === 'categories') {
        if (line.startsWith('### ')) {
          if (currentCategory) data.categories.push(currentCategory);
          currentCategory = { name: line.substring(4), links: [] };
          continue;
        }
        if (currentCategory && line.startsWith('- **') && line.endsWith('**:')) {
          if (currentCategoryLink) currentCategory.links.push(currentCategoryLink);
          currentCategoryLink = { name: line.substring(4, line.length - 3), icon: '', url: '', description: '' };
          continue;
        }
        if (currentCategoryLink && (line.startsWith('  - Icon:') || line.startsWith('- Icon:'))) {
          currentCategoryLink.icon = this.normaliseIconUrl(line.substring(line.indexOf(':') + 1).trim());
          continue;
        }
        if (currentCategoryLink && (line.startsWith('  - URL:') || line.startsWith('- URL:'))) {
          currentCategoryLink.url = line.substring(line.indexOf(':') + 1).trim();
          continue;
        }
        if (currentCategoryLink && (line.startsWith('  - Description:') || line.startsWith('- Description:'))) {
          currentCategoryLink.description = line.substring(line.indexOf(':') + 1).trim();
          continue;
        }
      }
    }

    if (currentSocialLink) data.social.push(currentSocialLink);
    if (currentCategoryLink && currentCategory) currentCategory.links.push(currentCategoryLink);
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
