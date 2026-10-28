(function () {
  'use strict';
  const KEY = 'alpica.channels.v1';
  function url(value, optional) {
    if (optional && !value) return '';
    const parsed = new URL(value);
    if (!['https:', 'http:'].includes(parsed.protocol)) throw new Error('Yayın ve logo adresleri http:// veya https:// ile başlamalı.');
    return parsed.href;
  }
  function validate(data) {
    if (!data || !Array.isArray(data.channels)) throw new Error('Geçersiz kanal dosyası.');
    return { version: 1, channels: data.channels.map(c => {
      if (!c || typeof c.name !== 'string' || !c.name.trim()) throw new Error('Kanal adı boş olamaz.');
      return { name: c.name.trim(), url: url(c.url), logo: url(c.logo || '', true), group: typeof c.group === 'string' && c.group.trim() ? c.group.trim() : 'Ulusal' };
    }) };
  }
  async function load() {
    let local;
    try { local = localStorage.getItem(KEY); } catch { /* Published list remains available without browser storage. */ }
    if (local !== null && local !== undefined) return { ...validate(JSON.parse(local)), local: true };
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 15000);
    try {
      const response = await fetch('channels.json', { cache: 'no-store', signal: controller.signal });
      if (!response.ok) throw new Error('channels.json okunamadı (HTTP ' + response.status + ').');
      return { ...validate(await response.json()), local: false };
    } finally { clearTimeout(timer); }
  }
  function save(data) { const valid = validate(data); localStorage.setItem(KEY, JSON.stringify(valid)); return valid; }
  window.ChannelStore = { load, save, validate, reset() { localStorage.removeItem(KEY); }, key: KEY };
})();
