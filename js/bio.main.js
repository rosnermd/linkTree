// bio.main.js
(async function () {
  try {
    const res = await fetch('data.md');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const markdown = await res.text();
    const data = Bio.parseMarkdown(markdown);

    Bio.renderProfile(data.profile);
    Bio.renderSocialLinks(data.social);
    Bio.renderCategories(data.categories);
    Bio.bindAnalytics();
  } catch (err) {
    console.error('Failed to initialise biolink:', err);
  }
})();
