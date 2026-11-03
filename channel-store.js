(function () {
  'use strict';
  const KEY = 'alpica.channels.v1';
  const CACHE_KEY = 'alpica.github-cache.v1';
  const SOURCE_KEY = 'alpica.source.v1';
  const LIMIT = 5 * 1024 * 1024;
  const ROOT = new URL('.', location.href).href;
  function url(value, optional, base) {
    if (optional && !value) return '';
    const parsed = new URL(String(value || '').trim(), base);
    if (!['https:', 'http:'].includes(parsed.protocol)) throw new Error('Adres http:// veya https:// ile başlamalı.');
    return parsed.href;
  }
  function validate(data, base) {
    if (!data || !Array.isArray(data.channels)) throw new Error('Geçersiz kanal dosyası: channels listesi bulunamadı.');
    return {version:1, channels:data.channels.map(c => {
      if (!c || typeof c.name !== 'string' || !c.name.trim()) throw new Error('Kanal adı boş olamaz.');
      let logo = ''; try { logo = url(c.logo || '', true, base); } catch {}
      return {name:c.name.trim(), url:url(c.url, false, base), logo,
        group:typeof c.group === 'string' && c.group.trim() ? c.group.trim() : 'Ulusal'};
    })};
  }
  function parseList(input, base) {
    const text = input.replace(/^\uFEFF/, '').trim();
    if (!text || text.length > LIMIT) throw new Error('Liste boş veya 5 MB sınırını aşıyor.');
    if (/^\s*</.test(text)) throw new Error('Bu adres kanal listesi yerine bir web sayfası döndürüyor. Doğrudan M3U veya JSON adresi kullanın.');
    if (/^[\[{]/.test(text)) {
      let data;
      try { data = JSON.parse(text); } catch { throw new Error('JSON listesi okunamadı.'); }
      const result = validate(Array.isArray(data) ? {channels:data} : data, base);
      if (!result.channels.length) throw new Error('Listede kanal bulunamadı.');
      return {...result, format:'json', skipped:0};
    }
    if (/^#EXT-X-/m.test(text)) throw new Error('Bu adres tek bir HLS yayınıdır. Kanal listesi için M3U/JSON adresi girin; tek yayını Kanal yönetimi sayfasından ekleyin.');
    if (!/^#EXT(?:M3U|INF:)/m.test(text)) throw new Error('Adres geçerli bir M3U veya JSON kanal listesi döndürmüyor.');
    const channels = []; let pending = null, skipped = 0;
    for (const raw of text.split(/\r?\n/)) {
      const line = raw.trim();
      if (line.startsWith('#EXTINF:')) {
        if (pending) skipped++;
        const attrs = {}, pattern = /([\w-]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g; let match;
        while ((match = pattern.exec(line))) attrs[match[1]] = match[2] ?? match[3];
        let quote = null, comma = -1;
        for (let i=0; i<line.length; i++) {
          if (quote) { if (line[i] === quote) quote = null; }
          else if (line[i] === '"' || line[i] === "'") quote = line[i];
          else if (line[i] === ',') { comma=i; break; }
        }
        pending = {name:(comma >= 0 ? line.slice(comma+1).trim() : '') || attrs['tvg-name'] || 'İsimsiz kanal',
          logo:attrs['tvg-logo'] || '', group:(attrs['group-title'] || '').trim()};
      } else if (line.startsWith('#EXTGRP:') && pending) {
        if (!pending.group) pending.group = line.slice(8).trim();
      } else if (line && !line.startsWith('#') && pending) {
        try {
          const stream = url(line, false, base); let logo='';
          try { logo=url(pending.logo, true, base); } catch { /* Bad logos never discard valid channels. */ }
          channels.push({...pending, url:stream, logo, group:pending.group || 'Ulusal'});
        } catch { skipped++; }
        pending = null;
      }
    }
    if (pending) skipped++;
    if (!channels.length) throw new Error('Listede HTTP/HTTPS adresli kanal bulunamadı.');
    return {version:1,channels,format:'m3u',skipped};
  }
  function readSource() {
    try {
      const data = JSON.parse(localStorage.getItem(SOURCE_KEY) || 'null');
      return data && ['remote','github','local'].includes(data.mode) ? data : null;
    } catch { return null; }
  }
  function describe() {
    const source = readSource();
    if (source) return {mode:source.mode, url:source.url || '', count:source.channels?.length || 0, updatedAt:source.updatedAt || null};
    try {
      const local = localStorage.getItem(KEY);
      if (local !== null) return {mode:'local',url:'',count:validate(JSON.parse(local)).channels.length};
    } catch {}
    return {mode:'github',url:'',count:0};
  }
  function sourceUrl(value) {
    const parsed = new URL(String(value || '').trim());
    if (!['https:','http:'].includes(parsed.protocol) || parsed.username || parsed.password) throw new Error('Geçerli bir HTTP/HTTPS kanal listesi adresi girin.');
    if (location.protocol === 'https:' && parsed.protocol === 'http:') throw new Error('Bu HTTPS sayfa HTTP listesini okuyamaz. HTTPS liste adresi kullanın.');
    if (parsed.hostname === 'github.com') {
      const parts=parsed.pathname.split('/').filter(Boolean);
      if (parts[2] === 'blob' && parts.length >= 5) {
        return 'https://raw.githubusercontent.com/' + parts.slice(0,2).concat(parts.slice(3)).join('/');
      }
    }
    return parsed.href;
  }
  async function requestText(address) {
    const controller = new AbortController(), timer=setTimeout(() => controller.abort(),20000);
    try {
      const response=await fetch(address, {cache:'no-store',signal:controller.signal});
      if (!response.ok) throw new Error('Liste sunucusu HTTP ' + response.status + ' yanıtı verdi.');
      if (location.protocol === 'https:' && response.url && new URL(response.url).protocol !== 'https:') throw new Error('Liste adresi HTTP bağlantısına yönlendiriliyor; HTTPS liste gerekiyor.');
      if (Number(response.headers?.get('Content-Length')) > LIMIT) throw new Error('Liste 5 MB sınırını aşıyor.');
      let text='';
      if (response.body?.getReader) {
        const reader=response.body.getReader(), decoder=new TextDecoder(); let bytes=0;
        try {
          while (true) {
            const {done,value}=await reader.read(); if(done)break;
            bytes+=value.byteLength;
            if(bytes>LIMIT){await reader.cancel();throw new Error('Liste 5 MB sınırını aşıyor.');}
            text+=decoder.decode(value,{stream:true});
          }
          text+=decoder.decode();
        } finally { reader.releaseLock(); }
      } else text=await response.text();
      return {text,base:response.url || address};
    } catch(error) {
      if(error.name==='AbortError')throw new Error('Liste sunucusu 20 saniye içinde yanıt vermedi.');
      if(error instanceof TypeError)throw new Error('Liste okunamadı. Sunucu CORS izni vermiyor, HTTP’ye yönlendiriyor veya erişilemiyor olabilir.');
      throw error;
    } finally {clearTimeout(timer);}
  }
  async function testSource(value) {
    const address=sourceUrl(value), response=await requestText(address);
    return {...parseList(response.text,response.base),source:'remote',sourceUrl:address,local:false,stale:false};
  }
  async function setSource(value) {
    const result=await testSource(value);
    // One atomic storage write; failed validation leaves all previous choices intact.
    localStorage.setItem(SOURCE_KEY,JSON.stringify({mode:'remote',url:result.sourceUrl,channels:result.channels,format:result.format,updatedAt:Date.now()}));
    return result;
  }
  async function githubList() {
    const addresses = [new URL('channels.json',ROOT).href,
      'https://raw.githubusercontent.com/ramazanke/Tvalp/main/channels.json'];
    let failure;
    for (const address of [...new Set(addresses)]) {
      try {
        const response = await requestText(address);
        const valid = validate(JSON.parse(response.text), response.base);
        if (!valid.channels.length) throw new Error('Kanal listesi boş.');
        try { localStorage.setItem(CACHE_KEY, JSON.stringify(valid)); } catch {}
        return {...valid, source:'github', local:false, stale:false};
      } catch (error) { failure = error; }
    }
    try {
      const cached = validate(JSON.parse(localStorage.getItem(CACHE_KEY)));
      if (cached.channels.length) return {...cached, source:'github', local:false, stale:true, warning:failure.message};
    } catch {}
    throw failure;
  }
  async function useGitHub() {
    const result=await githubList();
    localStorage.setItem(SOURCE_KEY,JSON.stringify({mode:'github'}));
    return result;
  }
  async function load() {
    const selected=readSource();
    if (selected?.mode === 'remote') {
      try {
        const result=await testSource(selected.url), current=readSource();
        if (current?.mode==='remote' && current.url===selected.url &&
            JSON.stringify(current.channels)!==JSON.stringify(result.channels)) {
          try {localStorage.setItem(SOURCE_KEY,JSON.stringify({...current,channels:result.channels,format:result.format,updatedAt:Date.now()}));}catch{}
        }
        return result;
      } catch(error) {
        if (selected.channels?.length) return {...validate({channels:selected.channels}),source:'remote',sourceUrl:selected.url,local:false,stale:true,warning:error.message};
        throw error;
      }
    }
    if (selected?.mode !== 'github') {
      let local;
      try {local=localStorage.getItem(KEY);}catch{}
      if(local!==null && local!==undefined) {
        try { return {...validate(JSON.parse(local)),source:'local',local:true,stale:false}; }
        catch { /* A damaged local list must not block the default list. */ }
      }
    }
    return githubList();
  }
  function save(data) {
    const valid=validate(data);
    localStorage.setItem(KEY,JSON.stringify(valid));
    localStorage.setItem(SOURCE_KEY,JSON.stringify({mode:'local'}));
    return valid;
  }
  function reset(){localStorage.removeItem(KEY);localStorage.removeItem(SOURCE_KEY);}
  window.ChannelStore={load,save,validate,reset,describe,sourceUrl,parseList,testSource,setSource,useGitHub,key:KEY,sourceKey:SOURCE_KEY};
})();
