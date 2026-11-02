(function () {
  'use strict';
  if (location.origin !== 'https://ramazanke.github.io' || !/^\/Tvalp\/(?:index\.html)?$/.test(location.pathname)) return;
  if (window.__alpicaNativeInstalling) return;
  window.__alpicaNativeInstalling = true;
  let attempts = 0, number = '', numberTimer;
  const isTv = !window.AlpicaDevice || window.AlpicaDevice.isTv !== false;
  const send = value => window.AlpicaNative.postMessage(JSON.stringify(value));
  function install() {
    if (typeof channels !== 'function' || typeof play !== 'function' || typeof wake !== 'function' || !document.getElementById('video') || !window.AlpicaNative) {
      if (++attempts < 150) setTimeout(install, 100);
      else window.__alpicaNativeInstalling = false;
      return;
    }
    const style = document.createElement('style');
    style.textContent = 'html,body{background:transparent!important}#video{visibility:hidden!important;background:transparent!important}header,footer,.manage-link,#fullscreen,#reloadList,#listState{display:none!important}body #welcome{display:none!important}body.cinema .shade{display:none!important}';

    style.textContent += '#touchControls{display:none!important}';
    if (!isTv) {
      document.body.classList.add('native-mobile');
      style.textContent +=
        'body.native-mobile #nativeTouchControls{position:fixed;z-index:3;bottom:calc(16px + env(safe-area-inset-bottom,0px));left:50%;transform:translateX(-50%);display:flex;gap:5px;padding:6px;border-radius:15px;background:#101b2df0;border:1px solid #ffffff30;max-width:calc(100vw - 16px);box-sizing:border-box;touch-action:manipulation}' +
        'body.native-mobile #nativeTouchControls button{min-width:42px;min-height:48px;padding:9px 10px;font-size:13px;white-space:nowrap}' +
        'body.native-mobile #nativeCategories{color:#42e6bf}' +
        'body.native-mobile.menu #nativeTouchControls{display:none}' +
        'body.native-mobile.quiet #nativeTouchControls button:not(#nativeCategories){display:none}' +
        'body.native-mobile .menu-close{display:block!important}' +
        'body.native-mobile #categories{padding-top:calc(30px + env(safe-area-inset-top,0px));padding-bottom:calc(24px + env(safe-area-inset-bottom,0px));touch-action:pan-y}' +
        'body.native-mobile #channelList{touch-action:pan-x}' +
        'body.native-mobile.quiet{cursor:auto}';
    }
    document.head.append(style);
    const htmlVideo = document.getElementById('video');
    if (typeof hls !== 'undefined' && hls) { hls.destroy(); hls = null; }
    htmlVideo.pause(); htmlVideo.removeAttribute('src'); htmlVideo.load();
    document.body.classList.add('cinema');
    fullscreen = async function () { document.body.classList.add('cinema'); return true; };
    if (typeof isFullscreen === 'function') isFullscreen = () => true;
    if (typeof openingFullscreenPending !== 'undefined') openingFullscreenPending = false;
    play = function () {
      const channel = channels()[channelIndex];
      if (!channel) return;
      ++playToken;
      playbackFailed = false; sourceReady = false; usingNative = false;
      if (hls) { hls.destroy(); hls = null; }
      document.body.classList.remove('playback-error');
      document.getElementById('welcome').hidden = true;
      document.getElementById('channelName').textContent = channel.name;
      document.getElementById('categoryLabel').textContent = groups[groupIndex].name + ' · ' + (channelIndex + 1) + ' / ' + channels().length;
      document.getElementById('status').textContent = 'Yayına bağlanılıyor…';
      wake();
      // Preserve the supplied URL. Do not guess a different path or append an extension.
      send({ action: 'play', url: channel.url, token: playToken });
    };
    htmlVideo.pause = function () { send({ action: 'stop' }); };
    tryPlay = async function (token) { if (token !== undefined && token !== playToken) return; send({ action: 'resume', token: playToken }); };
    function commitNumber() {
      if (!number) return;
      const index = Number(number) - 1;
      number = '';
      if (index >= 0 && index < channels().length) { channelIndex = index; closeMenu(); play(); }
      else { document.getElementById('status').textContent = 'Bu kategoride böyle bir kanal numarası yok.'; wake(); }
    }
    window.AlpicaAndroid = {
      key(key) {
        if (key === 'Enter' && number) { clearTimeout(numberTimer); commitNumber(); return; }
        if (number) { clearTimeout(numberTimer); number = ''; }
        document.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }));
      },
      digit(value) {
        if (!channels().length) return;
        clearTimeout(numberTimer);
        number = (number + value).slice(-3);
        document.getElementById('channelName').textContent = 'Kanal ' + number;
        wake();
        numberTimer = setTimeout(commitNumber, 1300);
      },
      back() {
        if (number) { clearTimeout(numberTimer); number = ''; wake(); return true; }
        if (menu) { closeMenu(); return true; }
        return false;
      },
      state(token, state, message) {
        if (token !== playToken) return;
        document.getElementById('status').textContent = message;
        const pauseButton = document.getElementById('nativePause');
        if (pauseButton && ['playing','paused'].includes(state)) { pauseButton.textContent = state === 'paused' ? '▶' : 'Ⅱ'; pauseButton.setAttribute('aria-label', state === 'paused' ? 'Yayını oynat' : 'Yayını duraklat'); }
        if (state === 'error') {
          failPlayback(message);
        } else if (state === 'playing' || state === 'ready') {
          playbackFailed = false;
          document.body.classList.remove('playback-error');
          document.getElementById('welcome').hidden = true;
        } else if (state === 'paused') {
          wake();
        }
      }
    };

    if (!isTv) {
      const toolbar = document.createElement('nav');
      toolbar.id = 'nativeTouchControls';
      toolbar.setAttribute('aria-label', 'Dokunmatik oynatıcı kontrolleri');
      function button(id, text, label, action) {
        const item = document.createElement('button');
        item.id = id; item.type = 'button'; item.textContent = text;
        item.setAttribute('aria-label', label); item.onclick = action;
        toolbar.append(item);
      }
      function change(delta) {
        if (!channels().length) return;
        channelIndex = (channelIndex + delta + channels().length) % channels().length;
        play();
      }
      button('nativePrevious', '‹', 'Önceki kanal', () => change(-1));
      button('nativeCategories', '☰ Kategoriler', 'Kategorileri aç', () => showMenu('categories'));
      button('nativeChannels', 'Kanallar', 'Kanalları aç', () => showMenu('channels'));
      button('nativePause', 'Ⅱ', 'Oynat veya duraklat', () => send({action:'togglePause'}));
      button('nativeNext', '›', 'Sonraki kanal', () => change(1));
      document.body.append(toolbar);
      document.addEventListener('pointerdown', wake, {passive:true});
    }
    send({ action: 'ready' });
    if (channels().length) play();
  }
  install();
})();
