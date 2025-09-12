// bio.analytics.js
window.Bio = window.Bio || {};

// Build payload for anchors
Bio.buildLinkPayload = function (a) {
  const url = a.getAttribute('href') || '';
  const isMailto = /^mailto:/i.test(url);
  const isTel = /^tel:/i.test(url);
  let sameOrigin = false;
  try { sameOrigin = new URL(url, location.href).origin === location.origin; } catch {}
  const section = a.dataset.section || (a.closest('.social-row') ? 'social' :
                    a.closest('.category') ? 'category' : 'unknown');
  const category =
    a.dataset.category || a.closest('.category')?.querySelector('h3')?.textContent?.trim() || '';
  const name =
    a.dataset.name || a.querySelector('.card-title')?.textContent?.trim() ||
    a.getAttribute('aria-label') || a.title || a.textContent.trim() || '';
  const index =
    a.dataset.index || (a.parentElement ? Array.from(a.parentElement.children).indexOf(a) : -1);

  return {
    link_id: a.dataset.id || Bio.makeLinkId(name, url),
    link_name: name,
    link_url: url,
    link_description: a.dataset.description || '',
    link_protocol: isMailto ? 'mailto' : isTel ? 'tel' : (sameOrigin ? 'internal' : 'https'),
    link_section: section,
    link_category: category,
    link_index: Number(index),
    page_title: document.title,
    page_location: location.href
  };
};

// Generic non-anchor payload
Bio.buildElementPayload = function (el) {
  const tag = (el.tagName || '').toLowerCase();
  const role = (el.getAttribute && el.getAttribute('role')) || '';
  const id = (el.id || '').trim();
  const classes = (el.className || '').toString().trim();
  const textSnippet = (() => {
    const t = (el.innerText || el.textContent || '').trim().replace(/\s+/g, ' ');
    return t.length > 80 ? t.slice(0, 77) + '…' : t;
  })();
  const cssPath = (() => {
    const parts = [];
    let n = el, depth = 0;
    while (n && n.nodeType === 1 && depth < 5) {
      let part = n.tagName.toLowerCase();
      if (n.id) { part += `#${n.id}`; parts.unshift(part); break; }
      if (n.classList && n.classList.length) part += '.' + Array.from(n.classList).slice(0, 2).join('.');
      parts.unshift(part);
      n = n.parentElement; depth++;
    }
    return parts.join(' > ');
  })();

  return {
    tag, role, id, classes, text: textSnippet, path: cssPath,
    page_title: document.title, page_location: location.href
  };
};

// Attach one delegated listener that fires for every click
Bio.bindAnalytics = function () {
  let lastSig = '';
  document.addEventListener('click', (evt) => {
    const target = evt.target && evt.target.nodeType === 1
      ? evt.target
      : (evt.target && evt.target.closest ? evt.target.closest('*') : null);
    if (!target) return;

    const a = target.closest('a');
    let eventName, payload;
    if (a && a.href) {
      eventName = 'link_click';
      payload = Bio.buildLinkPayload(a);
    } else {
      const btn = target.closest('button,[role="button"],.btn,.btn-primary,.link-card');
      eventName = btn ? 'button_click' : 'element_click';
      payload = Bio.buildElementPayload(btn || target);
    }

    const sig = eventName + '|' + JSON.stringify(payload);
    if (sig === lastSig) return;
    lastSig = sig;
    setTimeout(() => { if (lastSig === sig) lastSig = ''; }, 250);

    Bio.umamiSafe(eventName, payload);
  }, { capture: true });
};
