// bio.render.js
window.Bio = window.Bio || {};

Bio.makeIconImg = function (src, alt) {
  const img = document.createElement('img');
  img.src = Bio.normaliseIconUrl(src) || (
    'data:image/svg+xml;utf8,' +
    '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">' +
    '<rect width="24" height="24" fill="%23f0f0f0"/>' +
    '<path d="M12 2a10 10 0 1 0 .001 20.001A10 10 0 0 0 12 2Zm0 18a8 8 0 1 1 0-16 8 8 0 0 1 0 16Z" fill="%23999"/></svg>'
  );
  img.alt = alt || '';
  img.width = 24; img.height = 24;
  img.loading = 'lazy'; img.decoding = 'async';
  img.referrerPolicy = 'no-referrer';
  img.onerror = () => { img.src = Bio.normaliseIconUrl('') };
  return img;
};

Bio.renderProfile = function (profile = {}) {
  const nameEl = document.querySelector('.profile-info h1');
  if (nameEl && profile.name) nameEl.textContent = profile.name;
  const userEl = document.querySelector('.profile-info p');
  if (userEl && profile.username) userEl.textContent = profile.username;
  const heroEl = document.querySelector('.hero-image');
  if (heroEl && profile.hero_image) heroEl.style.backgroundImage = `url('${profile.hero_image}')`;
};

Bio.renderSocialLinks = function (social = []) {
  const container = document.querySelector('.social-row');
  if (!container) return;
  container.innerHTML = '';
  social.forEach((link, idx) => {
    if (!link?.url) return;
    const a = document.createElement('a');
    const id = Bio.makeLinkId(link.name, link.url);
    a.href = link.url;
    a.className = 'social-icon';
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    a.setAttribute('aria-label', link.name || 'social');
    a.dataset.id = id;
    a.dataset.section = 'social';
    a.dataset.name = link.name || '';
    a.dataset.index = String(idx);
    a.dataset.description = '';
    a.appendChild(Bio.makeIconImg(link.icon, link.name));
    container.appendChild(a);
  });
};

Bio.renderCategories = function (categories = []) {
  const container = document.querySelector('.categories');
  if (!container) return;
  container.innerHTML = '';

  categories.forEach((category) => {
    const wrap = document.createElement('div');
    wrap.className = 'category';

    const title = document.createElement('h3');
    title.textContent = category.name;
    wrap.appendChild(title);

    const linksDiv = document.createElement('div');
    linksDiv.className = 'category-links';

    category.links.forEach((link, idx) => {
      if (!link?.url) return;
      const card = document.createElement('a');
      const id = Bio.makeLinkId(link.name, link.url);
      card.href = Bio.normaliseHref(link.url);
      card.className = 'link-card';
      card.target = '_blank';
      card.rel = 'noopener noreferrer';
      card.title = link.name || '';
      card.dataset.id = id;
      card.dataset.section = 'category';
      card.dataset.category = category.name || '';
      card.dataset.name = link.name || '';
      card.dataset.index = String(idx);
      card.dataset.description = link.description || '';

      const iconWrap = document.createElement('div');
      iconWrap.className = 'card-icon';
      iconWrap.appendChild(Bio.makeIconImg(link.icon, link.name));

      const content = document.createElement('div');
      content.className = 'card-content';
      content.innerHTML = `
        <div class="card-title">${link.name || ''}</div>
        <div class="card-subtitle">${link.description || ''}</div>
      `;

      card.appendChild(iconWrap);
      card.appendChild(content);
      linksDiv.appendChild(card);
    });

    wrap.appendChild(linksDiv);
    container.appendChild(wrap);
  });
};
