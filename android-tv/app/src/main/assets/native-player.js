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
        'body.native-mobile #info{bottom:110px!important}' +
        'body.native-mobile.menu #nativeTouchControls{display:none}' +
        'body.native-mobile.quiet #nativeTouchControls button:not(#nativeCategories){display:none}' +
        'body.native-mobile .menu-close{display:block!important}' +
        'body.native-mobile #categories{padding-top:calc(30px + env(safe-area-inset-top,0px));padding-bottom:calc(24px + env(safe-area-inset-bottom,0px));touch-action:pan-y}' +
        'body.native-mobile #channelList{touch-action:pan-x}' +
        'body.native-mobile.quiet{cursor:auto}';
    }
    if (isTv) {
      document.body.classList.add('alpica-tv');
      style.textContent += "body.alpica-tv.cinema #info{left:4vw;bottom:5vh;display:grid;grid-template-columns:3ch clamp(42px,5vw,78px) minmax(0,1fr);align-items:center;column-gap:clamp(9px,1.2vw,20px);max-width:42vw;padding:clamp(10px,1.4vh,19px) clamp(12px,1.5vw,24px);border:1px solid #ffffff25;border-radius:14px;background:#102741c9;box-shadow:0 8px 28px #0005}\nbody.alpica-tv #tvChannelNumber{font-weight:700;font-variant-numeric:tabular-nums;text-align:center}\nbody.alpica-tv #tvChannelLogo{display:grid;place-items:center;min-height:36px;border-inline:1px solid #ffffff30;color:#d7eaff;font-weight:700}\nbody.alpica-tv #tvChannelLogo img{width:85%;height:clamp(26px,4.5vh,48px);object-fit:contain}\nbody.alpica-tv.cinema #channelName{font-size:clamp(15px,1.7vw,30px);line-height:1.15;margin:0;overflow-wrap:anywhere}\nbody.alpica-tv #status{grid-column:1/-1;margin-top:6px;font-size:clamp(11px,1.15vw,18px)}\nbody.alpica-tv #tvClock{position:fixed;top:4vh;right:4vw;padding:7px 13px;border-radius:10px;background:#102741c9;font-size:clamp(14px,1.65vw,29px);font-weight:700;font-variant-numeric:tabular-nums;z-index:3;pointer-events:none;transition:opacity .2s}\nbody.alpica-tv.quiet #tvClock,body.alpica-tv.menu #tvClock{opacity:0}\nbody.alpica-tv #categories,body.alpica-tv #strip{position:fixed;inset:4vh auto 4vh 3vw;width:clamp(180px,30vw,620px);display:flex;flex-direction:column;box-sizing:border-box;padding:clamp(10px,1.3vw,22px);border:1px solid #ffffff28;border-radius:16px;background:#0c1c31b8;box-shadow:0 8px 36px #0006;overflow:hidden;backdrop-filter:none}\nbody.alpica-tv #strip{left:auto;right:3vw}\nbody.alpica-tv #categoryList,body.alpica-tv #channelList{display:flex;flex-direction:column;gap:6px;min-height:0;overflow:auto;padding:3px;scrollbar-width:none}\nbody.alpica-tv #categories .panel-title,body.alpica-tv #strip .strip-title{font-size:clamp(15px,1.6vw,29px);margin:0 0 10px}\nbody.alpica-tv #categories .panel-title small,body.alpica-tv #strip .strip-title small{display:none}\nbody.alpica-tv #categoryList button,body.alpica-tv #channelList button{flex:0 0 clamp(44px,10vh,112px);width:100%;height:auto;display:flex;flex-direction:row;align-items:center;justify-content:flex-start;gap:clamp(8px,1vw,18px);padding:6px 10px;color:#fff;background:#101e32a1;border:2px solid transparent;text-align:left}\nbody.alpica-tv #categoryList button{justify-content:space-between}\nbody.alpica-tv #categoryList button.selected,body.alpica-tv #channelList button.selected{border:2px solid #fff;background:#d6eaff38;box-shadow:none}\nbody.alpica-tv #channelList img,body.alpica-tv #channelList .initials{width:clamp(34px,5vw,87px);height:clamp(26px,6vh,60px);flex-shrink:0;border-radius:8px;background:#102741a6;padding:4px}\nbody.alpica-tv #channelList .name{max-width:none;font-size:clamp(13px,1.3vw,23px)}\nbody.alpica-tv #channelList .name::before{content:attr(data-number);display:inline-block;margin-right:.65em;color:#b9d2e8;font-variant-numeric:tabular-nums}\nbody.alpica-tv #channelList button:nth-child(n){min-width:0}";
    }
    if (isTv) style.textContent +=
      'body.alpica-tv #categories,body.alpica-tv #strip{bottom:20vh}' +
      'body.alpica-tv #tvChannelBar{position:fixed;left:3vw;right:3vw;bottom:3vh;height:14vh;display:flex;justify-content:center;align-items:center;gap:1vw;padding:1vh 2vw;border-radius:14px;background:#102741c9;z-index:6;pointer-events:none}' +
      'body.alpica-tv #tvChannelBar span{display:grid;place-items:center;width:10vw;height:9vh;padding:4px;border:2px solid transparent;border-radius:9px;color:#fff;text-align:center;font-size:clamp(11px,1.2vw,21px);overflow:hidden}' +
      'body.alpica-tv #channelList .tv-row-logo img{width:100%;height:100%;padding:0;background:none}' +
      'body.alpica-tv #channelList button[aria-current="true"]:not(.selected),body.alpica-tv #categoryList button[aria-current="true"]:not(.selected){border:2px solid transparent}' +
      'body.alpica-tv #tvChannelBar .selected{border-color:#fff;background:#ffffff24}' +
      'body.alpica-tv #tvChannelBar img{width:100%;height:6vh;object-fit:contain}';
    document.head.append(style);
    const info = isTv && document.getElementById('info');
    let badgeNumber, badgeLogo, badgeClock;
    if (info) {
      badgeNumber = document.createElement('span');
      badgeNumber.id = 'tvChannelNumber';
      badgeLogo = document.createElement('span');
      badgeLogo.id = 'tvChannelLogo';
      info.prepend(badgeNumber, badgeLogo);
      badgeClock = document.createElement('time');
      badgeClock.id = 'tvClock';
      document.body.append(badgeClock);
      const bar = document.createElement('div');
      bar.id = 'tvChannelBar';
      bar.hidden = true;
      document.body.append(bar);
      const groupList = document.getElementById('categoryList');
      const channelList = document.getElementById('channelList');
      const originalClose = closeMenu;
      let renderedGroups, renderedChannels, barChannels, barStart = 0;
      closeMenu = function () {
        originalClose();
        bar.hidden = true;
      };
      function addLogo(container, channel, fallback) {
        container.textContent = fallback;
        if (!channel.logo) return;
        const image = document.createElement('img');
        image.alt = '';
        image.onload = () => container.replaceChildren(image);
        image.src = channel.logo;
      }
      function buildRows(list, items, type) {
        list.replaceChildren();
        items.forEach((item, index) => {
          const row = document.createElement('button');
          row.type = 'button';
          row.setAttribute('aria-label', item.name);
          const name = document.createElement('span');
          name.textContent = item.name;
          if (type === 'channels') {
            const logo = document.createElement('span');
            logo.className = 'initials tv-row-logo';
            addLogo(logo, item, item.name.slice(0, 2).toLocaleUpperCase('tr-TR'));
            name.className = 'name';
            name.dataset.number = String(index + 1);
            row.append(logo, name);
          } else {
            const count = document.createElement('span');
            count.textContent = String(item.channels.length);
            row.append(name, count);
          }
          row.onclick = () => {
            menu = type;
            cursor = index;
            select();
          };
          list.append(row);
        });
        list.scrollTop = 0;
      }
      function highlight(list, index, current) {
        Array.from(list.children).forEach((row, position) => {
          row.classList.toggle('selected', position === index);
          const value = String(position === current);
          if (row.getAttribute('aria-current') !== value) row.setAttribute('aria-current', value);
        });
        const selected = list.children[index];
        if (!selected) return;
        const viewport = list.getBoundingClientRect();
        const row = selected.getBoundingClientRect();
        if (row.top < viewport.top) list.scrollTop += row.top - viewport.top;
        else if (row.bottom > viewport.bottom) list.scrollTop += row.bottom - viewport.bottom;
      }
      renderMenu = function () {
        const previewGroup = menu === 'categories' ? cursor : groupIndex;
        const previewChannels = groups[previewGroup].channels;
        const previewChannel = menu === 'channels' ? cursor : previewGroup === groupIndex ? channelIndex : 0;
        const browsingChannels = menu === 'channels';
        document.getElementById('categories').hidden = browsingChannels;
        document.getElementById('strip').hidden = !browsingChannels;
        document.getElementById('stripTitle').textContent = groups[previewGroup].name;
        if (renderedGroups !== groups) {
          buildRows(groupList, groups, 'categories');
          renderedGroups = groups;
        }
        if (renderedChannels !== previewChannels) {
          buildRows(channelList, previewChannels, 'channels');
          renderedChannels = previewChannels;
        }
        highlight(groupList, previewGroup, groupIndex);
        highlight(channelList, previewChannel, previewGroup === groupIndex ? channelIndex : -1);
        if (barChannels !== previewChannels || previewChannel < barStart || previewChannel >= barStart + 7) {
          barChannels = previewChannels;
          barStart = Math.floor(previewChannel / 7) * 7;
          bar.replaceChildren();
          previewChannels.slice(barStart, barStart + 7).forEach(channel => {
            const tile = document.createElement('span');
            tile.setAttribute('aria-label', channel.name);
            addLogo(tile, channel, channel.name);
            bar.append(tile);
          });
        }
        Array.from(bar.children).forEach((tile, index) => {
          tile.classList.toggle('selected', barStart + index === previewChannel);
        });
        bar.hidden = !browsingChannels;
      };
    }
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
      const token = ++playToken;
      playbackFailed = false; sourceReady = false; usingNative = false;
      if (hls) { hls.destroy(); hls = null; }
      document.body.classList.remove('playback-error');
      document.getElementById('welcome').hidden = true;
      document.getElementById('channelName').textContent = channel.name;
      document.getElementById('categoryLabel').textContent = groups[groupIndex].name + ' · ' + (channelIndex + 1) + ' / ' + channels().length;
      document.getElementById('status').textContent = 'Yayına bağlanılıyor…';
      if (info) {
        badgeNumber.textContent = String(channelIndex + 1);
        badgeLogo.textContent = channel.name.slice(0, 2).toLocaleUpperCase('tr-TR');
        if (channel.logo) {
          const image = document.createElement('img');
          image.alt = '';
          image.onload = () => {
            if (token === playToken) badgeLogo.replaceChildren(image);
          };
          image.src = channel.logo;
        }
        badgeClock.textContent = new Date().toLocaleTimeString('tr-TR', {hour:'2-digit', minute:'2-digit'});
      }
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
