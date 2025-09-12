// bio.parser.js
window.Bio = window.Bio || {};

Bio.parseMarkdown = function (markdown = '') {
  const lines = markdown.split('\n');
  const data = { profile: {}, social: [], categories: [] };

  let section = null;
  let currentCategory = null;
  let currentItem = null;

  for (let raw of lines) {
    const line = raw.trim();
    if (!line) continue;

    if (line === '## Profile') { section = 'profile'; continue; }

    if (line === '## Social Links') {
      if (currentItem && section === 'category' && currentCategory) {
        currentCategory.links.push(currentItem); currentItem = null;
      }
      section = 'social';
      continue;
    }

    if (line.startsWith('### ')) {
      if (currentItem && section === 'social') { data.social.push(currentItem); currentItem = null; }
      if (currentItem && section === 'category' && currentCategory) {
        currentCategory.links.push(currentItem); currentItem = null;
      }
      if (currentCategory) data.categories.push(currentCategory);
      currentCategory = { name: line.substring(4).trim(), links: [] };
      section = 'category';
      continue;
    }

    // Profile: - **Key**: Value
    if (section === 'profile' && line.startsWith('- **')) {
      const m = line.match(/- \*\*(.+)\*\*: (.+)/);
      if (m) {
        const key = m[1].toLowerCase().replace(/\s+/g, '_');
        data.profile[key] = m[2];
      }
      continue;
    }

    // Social items
    if (section === 'social') {
      if (line.startsWith('- **') && line.endsWith('**:')) {
        if (currentItem) data.social.push(currentItem);
        currentItem = { name: line.substring(4, line.length - 3), icon: '', url: '' };
        continue;
      }
      if (currentItem && /icon:/i.test(line)) { currentItem.icon = Bio.normaliseIconUrl(Bio.afterFirstColon(line)); continue; }
      if (currentItem && /url:/i.test(line))  { currentItem.url  = Bio.normaliseHref(Bio.afterFirstColon(line));   continue; }
    }

    // Category items
    if (section === 'category') {
      if (line.startsWith('- **') && line.endsWith('**:')) {
        if (currentItem) currentCategory.links.push(currentItem);
        currentItem = { name: line.substring(4, line.length - 3), icon: '', url: '', description: '' };
        continue;
      }
      if (currentItem && /icon:/i.test(line))         { currentItem.icon        = Bio.normaliseIconUrl(Bio.afterFirstColon(line)); continue; }
      if (currentItem && /url:/i.test(line))          { currentItem.url         = Bio.normaliseHref(Bio.afterFirstColon(line));   continue; }
      if (currentItem && /description:/i.test(line))  { currentItem.description = Bio.afterFirstColon(line);                       continue; }

      // Bare URLs
      if (/^https?:\/\//i.test(line) || /^hhttps:\/\//i.test(line) || line.startsWith('//')) {
        const fixed = Bio.normaliseHref(line);
        if (currentItem && !currentItem.url) {
          currentItem.url = fixed;
        } else {
          currentCategory.links.push({
            name: Bio.domainAsName(fixed),
            icon: '',
            url: fixed,
            description: ''
          });
        }
        continue;
      }
    }
  }

  // Flush
  if (currentItem && section === 'social') data.social.push(currentItem);
  if (currentItem && section === 'category' && currentCategory) currentCategory.links.push(currentItem);
  if (currentCategory) data.categories.push(currentCategory);

  return data;
};
