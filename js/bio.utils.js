// bio.utils.js
window.Bio = window.Bio || {};

Bio.normaliseIconUrl = function (url = '') {
  let clean = url.trim();
  clean = clean.replace('flaticon.png', 'flaticon.com');
  if (clean.startsWith('//')) clean = 'https:' + clean;
  return clean;
};

Bio.normaliseHref = function (url = '') {
  let u = url.trim();
  u = u.replace(/^hhttps:\/\//i, 'https://'); // fix known typo
  if (u.startsWith('//')) u = 'https:' + u;
  return u;
};

// Stable ID from name+url (FNV-1a 32-bit → 8 hex)
Bio.makeLinkId = function (name = '', url = '') {
  const s = String(name) + '|' + String(url);
  let h = 0x811c9dc5 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return 'l_' + h.toString(16).padStart(8, '0');
};

Bio.afterFirstColon = function (line = '') {
  const i = line.indexOf(':');
  return i === -1 ? '' : line.slice(i + 1).trim();
};

Bio.domainAsName = function (u) {
  try { return new URL(u, location.href).hostname.replace(/^www\./i, ''); }
  catch { return u; }
};

// Safe Umami tracking (works if umami is fn or object)
Bio.umamiSafe = function (eventName, params = {}) {
  try {
    const u = window.umami;
    if (!u) return;
    if (typeof u === 'function') u(eventName, params);
    else if (typeof u.track === 'function') u.track(eventName, params);
  } catch {}
};
