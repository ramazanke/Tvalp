'use strict';
const $ = id => document.getElementById(id);
const video = $('video');
let groups = [], groupIndex = 0, channelIndex = 0, cursor = 0, menu = null, hls = null, hideTimer, menuTimer, playToken = 0, playbackFailed = false, retryCount = 0, sourceReady = false, usingNative = false, fallbackTried = false;
const channels = () => groups[groupIndex]?.channels || [];
const toHls = u => /^https?:\/\/[^\/?#]+\/[^\/?#]+\/[^\/?#]+\/\d+$/.test(u) ? u + '.m3u8' : u;
const normalize = s => s.toLocaleLowerCase('tr-TR').normalize('NFD').replace(/[\u0300-\u036f]/g, '');
function wake() { clearTimeout(menuTimer); if (menu) menuTimer = setTimeout(closeMenu, 8000); document.body.classList.remove('quiet'); clearTimeout(hideTimer); if (!menu && $('welcome').hidden && !playbackFailed) hideTimer = setTimeout(() => document.body.classList.add('quiet'), 3000); }
function closeMenu() { clearTimeout(menuTimer); menu = null; $('categories').hidden = true; $('strip').hidden = true; document.body.classList.remove('menu'); wake(); }
function showMenu(type) { if (!groups.length) return; menu = type; cursor = type === 'categories' ? groupIndex : channelIndex; $('categories').hidden = type !== 'categories'; $('strip').hidden = type !== 'channels'; document.body.classList.add('menu'); wake(); renderMenu(); }
function renderMenu() {
  const list = menu === 'categories' ? $('categoryList') : $('channelList'); list.replaceChildren();
  const items = menu === 'categories' ? groups : channels(); $('stripTitle').textContent = groups[groupIndex].name;
  items.forEach((item, i) => {
    const button = document.createElement('button'); button.classList.toggle('selected', i === cursor); button.setAttribute('aria-label', item.name); button.setAttribute('aria-current', String(i === (menu === 'categories' ? groupIndex : channelIndex)));
    if (menu === 'categories') { const name = document.createElement('span'); name.textContent = item.name; const count = document.createElement('span'); count.textContent = item.channels.length; button.append(name, count); }
    else { const fallback = document.createElement('span'); fallback.className = 'initials'; fallback.textContent = item.name.slice(0, 2).toLocaleUpperCase('tr-TR'); button.append(fallback); if (item.logo) { const img = document.createElement('img'); img.src = item.logo; img.alt = ''; img.onload = () => { fallback.hidden = true; }; img.onerror = () => img.remove(); button.prepend(img); } const name = document.createElement('span'); name.className = 'name'; name.textContent = item.name; button.append(name); }
    button.onpointermove = () => { if (cursor !== i) { cursor = i; list.querySelector('.selected')?.classList.remove('selected'); button.classList.add('selected'); } wake(); }; button.onclick = () => { cursor = i; select(); }; list.append(button);
  });
  list.children[cursor]?.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' });
}
function select() { if (menu === 'categories') { groupIndex = cursor; channelIndex = 0; play(); showMenu('channels'); } else { channelIndex = cursor; play(); closeMenu(); } }
async function tryPlay(token) { if (!sourceReady || token !== playToken) return; try { await video.play(); if (token === playToken) { $('welcome').hidden = true; wake(); } } catch (error) { if (token !== playToken || error.name === 'AbortError') return; if (error.name === 'NotSupportedError' && fallbackToHls(token)) return; if (error.name === 'NotAllowedError') { $('welcome').hidden = false; $('status').textContent = 'Yayını başlatmak için OK veya İzlemeye başla tuşuna basın.'; } else failPlayback('Yayın başlatılamadı: ' + error.name + '. Sağ/sol ile başka kanal deneyin.'); } }
function failPlayback(message) {
  playbackFailed = true;
  document.body.classList.add('playback-error');
  $('welcome').hidden = true;
  $('status').textContent = message;
  wake();
}
function play() {
  const channel = channels()[channelIndex]; if (!channel) return; const token = ++playToken; playbackFailed = false; retryCount = 0; sourceReady = false; usingNative = false; fallbackTried = false; document.body.classList.remove('playback-error');
  if (hls) { hls.destroy(); hls = null; } video.pause(); video.removeAttribute('src'); video.load();
  $('channelName').textContent = channel.name; $('categoryLabel').textContent = `${groups[groupIndex].name} · ${channelIndex + 1} / ${channels().length}`; $('status').textContent = 'Yayına bağlanılıyor…'; wake();
  if (location.protocol === 'https:' && channel.url.startsWith('http:')) {
    failPlayback('Bu kanal HTTP kullanıyor. GitHub Pages HTTPS üzerinde bu yayını engeller. Kanal için HTTPS yayın adresi gerekir.');
    return;
  }
  const directFile = /\.(mp4|webm|ogg)(?:[?#]|$)/i.test(channel.url);
  if (directFile || video.canPlayType('application/vnd.apple.mpegurl')) {
    usingNative = !directFile; sourceReady = true; video.src = channel.url; tryPlay(token);
  } else if (window.Hls && Hls.isSupported()) {
    attachHls(channel, token);
  } else {
    failPlayback(window.Hls ? 'Bu tarayıcı HLS oynatmayı desteklemiyor.' : 'HLS oynatma kütüphanesi yüklenemedi. İnternet bağlantısını kontrol edip sayfayı yenileyin.');
  }
}
function attachHls(channel, token) {
  sourceReady = false; usingNative = false;
    const engine = hls = new Hls();
    engine.on(Hls.Events.MANIFEST_PARSED, () => { if (token === playToken) { sourceReady = true; tryPlay(token); } });
    engine.on(Hls.Events.ERROR, (_, data) => {
      if (!data.fatal || token !== playToken) return;
      if (retryCount++ < 2 && data.type === Hls.ErrorTypes.NETWORK_ERROR) { engine.startLoad(); return; }
      if (retryCount <= 2 && data.type === Hls.ErrorTypes.MEDIA_ERROR) { engine.recoverMediaError(); return; }
      const status = data.response && data.response.code;
      failPlayback('Yayın açılamadı: ' + data.details + (status ? ' (HTTP ' + status + ')' : '') + '. Sağ/sol ile başka kanal deneyin. Sunucu CORS izni veya uygun codec gerekebilir.');
    });
    engine.attachMedia(video);
    engine.loadSource(channel.url);
}
function fallbackToHls(token) {
  if (token !== playToken || !usingNative || fallbackTried || !window.Hls || !Hls.isSupported()) return false;
  fallbackTried = true; sourceReady = false; usingNative = false;
  video.pause(); video.removeAttribute('src'); video.load();
  attachHls(channels()[channelIndex], token);
  return true;
}
let openingFullscreenPending = true;
function isFullscreen() { return !!(document.fullscreenElement || document.webkitFullscreenElement); }
async function fullscreen(automatic = false) {
  if (isFullscreen()) { openingFullscreenPending = false; return true; }
  const rootElement = document.documentElement;
  const request = rootElement.requestFullscreen || rootElement.webkitRequestFullscreen;
  if (!request) return false;
  try {
    await request.call(rootElement);
    openingFullscreenPending = false;
    return true;
  } catch {
    if (!automatic) $('status').textContent = 'Tam ekran için ekrana tıklayın veya OK tuşuna basın.';
    return false;
  }
}
function openingGesture(event) {
  if (!openingFullscreenPending || isFullscreen()) return;
  if (event.type === 'keydown' && !['Enter', 'Accept', 'Select', ' '].includes(event.key) && event.keyCode !== 13) return;
  if (event.target && event.target.closest && event.target.closest('a')) return;
  fullscreen(true);
}
document.addEventListener('keydown', openingGesture, true);
document.addEventListener('click', openingGesture, true);
// Kiosk/installed browsers may permit fullscreen on load; normal browsers require a gesture.
fullscreen(true);
async function start() { fullscreen(); if (channels().length) { if (playbackFailed) play(); else await tryPlay(playToken); } }
$('start').onclick = start; $('fullscreen').onclick = () => fullscreen();
video.addEventListener('playing', () => { playbackFailed = false; document.body.classList.remove('playback-error'); $('welcome').hidden = true; $('status').textContent = 'CANLI'; wake(); });
video.addEventListener('waiting', () => { $('status').textContent = 'Yayın yükleniyor…'; });
video.addEventListener('error', () => { if (video.error?.code === 4 && fallbackToHls(playToken)) return; if (video.currentSrc) { failPlayback('Yayın oynatılamadı (video hata kodu: ' + video.error?.code + '). Sağ/sol ile başka kanal deneyin.'); } });
document.addEventListener('keydown', event => {
  const key = event.key || ''; const code = event.keyCode || event.which;
  const back = ['Escape', 'Esc', 'Backspace', 'BrowserBack', 'GoBack', 'Back', 'Return', 'XF86Back'].includes(key) || [4, 8, 27, 166, 461, 10009].includes(code);
  const ok = ['Enter', 'Accept', 'Select', ' '].includes(key) || code === 13;
  if (!ok && !back && !['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'f', 'F', 'MediaChannelUp', 'MediaChannelDown'].includes(key) && ![427, 428].includes(code)) return;
  event.preventDefault(); wake();
  if (key.toLowerCase() === 'f') { fullscreen(); return; }
  if (back) { event.stopPropagation(); closeMenu(); return; }
  if (ok && !menu && !$('welcome').hidden && channels().length) { start(); return; }
  if (!groups.length) return;
  if (menu) { if (ok) { select(); return; } const delta = ['ArrowRight', 'ArrowDown'].includes(key) ? 1 : ['ArrowLeft', 'ArrowUp'].includes(key) ? -1 : 0; const length = menu === 'categories' ? groups.length : channels().length; cursor = (cursor + delta + length) % length; renderMenu(); return; }
  if (ok || key === 'ArrowUp') showMenu('categories');
  else if (key === 'ArrowDown') showMenu('channels');
  else { const delta = key === 'ArrowRight' || key === 'MediaChannelUp' || code === 427 ? 1 : -1; channelIndex = (channelIndex + delta + channels().length) % channels().length; play(); }
}, true);

function syncFullscreen() { document.body.classList.toggle('cinema', isFullscreen()); if (isFullscreen()) { openingFullscreenPending = false; closeMenu(); } }
document.addEventListener('fullscreenchange', syncFullscreen);
document.addEventListener('webkitfullscreenchange', syncFullscreen);
document.addEventListener('mousemove', () => { if (menu || !document.fullscreenElement) wake(); }); video.addEventListener('click', () => showMenu('channels'));
function clock() { $('clock').textContent = new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }); } clock(); setInterval(clock, 10000);
let loadGeneration = 0, loadedListSignature = null;
async function loadChannels() {
  const generation = ++loadGeneration;
  try {
    const data = await ChannelStore.load();
    if (generation !== loadGeneration) return;
    const signature = JSON.stringify(data.channels);
    $('listState').textContent = data.channels.length + ' kanal · ' + (data.local ? 'Bu tarayıcıdaki liste' : 'GitHub listesi');
    if (signature === loadedListSignature) return;
    const previous = channels()[channelIndex];
    const map = new Map();
    for (const c of data.channels) { if (!map.has(c.group)) map.set(c.group, []); map.get(c.group).push(c); }
    const nextGroups = [...map].map(([name, channels]) => ({ name, channels }));
    if (hls) { hls.destroy(); hls = null; }
    ++playToken; sourceReady = false; video.pause(); video.removeAttribute('src'); video.load();
    closeMenu(); groups = nextGroups; groupIndex = 0; channelIndex = 0;
    if (!groups.length) {
      $('channelName').textContent = 'Henüz kanal eklenmedi';
      $('categoryLabel').textContent = 'ALPICA TV';
      loadedListSignature = signature;
      failPlayback('Kanal yönetimi sayfasından kanal ekleyin.');
      return;
    }
    const oldGroup = previous ? groups.findIndex(g => g.channels.some(c => c.url === previous.url)) : -1;
    const national = groups.findIndex(g => normalize(g.name).includes('ulusal'));
    groupIndex = oldGroup >= 0 ? oldGroup : national >= 0 ? national : 0;
    channelIndex = oldGroup >= 0 ? channels().findIndex(c => c.url === previous.url) : 0;
    play();
    loadedListSignature = signature;
  } catch (error) {
    if (generation !== loadGeneration) return;
    $('listState').textContent = 'Liste okunamadı';
    $('channelName').textContent = 'Kanal listesi yüklenemedi';
    failPlayback(error.message + ' Kanal yönetimi sayfasından liste oluşturun.');
  }
}
window.addEventListener('storage', event => { if (event.key === ChannelStore.key || event.key === null) loadChannels(); });
loadChannels();

// Returning from the editor may restore this page from the browser's page cache.
window.addEventListener('pageshow', () => loadChannels());
window.addEventListener('focus', () => loadChannels());
document.addEventListener('visibilitychange', () => { if (!document.hidden) loadChannels(); });
$('reloadList').onclick = () => { loadedListSignature = null; loadChannels(); };
