'use strict';
const $ = id => document.getElementById(id);
let data = { version: 1, channels: [] }, editing = -1;
function message(text) { $('message').textContent = text; }
function source(local) { $('source').textContent = local ? 'Kaynak: Bu tarayıcıdaki yerel liste. Diğer cihazlar için JSON dosyasını GitHub’a yükle.' : 'Kaynak: GitHub’da yayınlanan channels.json'; }
let editedSinceLoad = false;
function commit(next) { editedSinceLoad = true; data = ChannelStore.save(next); source(true); render(); }
function clearForm() { editing = -1; $('form').reset(); $('formTitle').textContent = 'Kanal ekle'; $('submit').textContent = 'Bu tarayıcıya kaydet'; $('cancel').hidden = true; }
function render() {
  $('count').textContent = data.channels.length; $('list').replaceChildren(); $('groupNames').replaceChildren();
  [...new Set(data.channels.map(c => c.group))].forEach(group => { const option = document.createElement('option'); option.value = group; $('groupNames').append(option); });
  if (!data.channels.length) { const p = document.createElement('p'); p.textContent = 'Henüz kanal yok. İlk kanalını ekle.'; $('list').append(p); }
  data.channels.forEach((c, i) => {
    const row = document.createElement('div'); row.className = 'row';
    if (c.logo) { const img = document.createElement('img'); img.src = c.logo; img.alt = ''; img.onerror = () => img.remove(); row.append(img); }
    const detail = document.createElement('div'); detail.className = 'details'; const name = document.createElement('strong'); name.textContent = c.name; const group = document.createElement('small'); group.textContent = c.group; detail.append(name, group); row.append(detail);
    const actions = document.createElement('div'); actions.className = 'actions';
    const button = (text, action, disabled = false) => { const b = document.createElement('button'); b.type = 'button'; b.className = 'secondary'; b.textContent = text; b.disabled = disabled; b.onclick = () => { try { action(); } catch (e) { message(e.message); } }; actions.append(b); };
    button('↑', () => move(i, -1), i === 0); button('↓', () => move(i, 1), i === data.channels.length - 1);
    button('Düzenle', () => { editing = i; ['name','url','logo','group'].forEach(key => $(key).value = c[key]); $('formTitle').textContent = 'Kanalı düzenle'; $('submit').textContent = 'Değişiklikleri bu tarayıcıya kaydet'; $('cancel').hidden = false; $('name').focus(); });
    button('Sil', () => { commit({ ...data, channels: data.channels.filter((_, index) => index !== i) }); clearForm(); message('Kanal silindi.'); });
    row.append(actions); $('list').append(row);
  });
}
function move(index, delta) { const channels = [...data.channels]; [channels[index], channels[index + delta]] = [channels[index + delta], channels[index]]; commit({ ...data, channels }); clearForm(); }
$('form').onsubmit = event => { event.preventDefault(); try { const channel = {}; ['name','url','logo','group'].forEach(key => channel[key] = $(key).value.trim()); const channels = [...data.channels]; if (editing < 0) channels.push(channel); else channels[editing] = channel; commit({ version: 1, channels }); clearForm(); if (event.submitter && event.submitter.id === 'saveWatch') { location.href = new URL('index.html', location.href).href; return; } message('Bu tarayıcıya kaydedildi. GitHub henüz güncellenmedi; diğer cihazlar için JSON indirip yükleyin.'); } catch (e) { message(e.message); } };
$('cancel').onclick = clearForm;
$('download').onclick = () => { const blob = new Blob([JSON.stringify(ChannelStore.validate(data), null, 2)], { type: 'application/json' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'channels.json'; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); message('İndirilen channels.json dosyasını GitHub deponun ana klasörüne yükle.'); };
$('import').onchange = async event => { try { const file = event.target.files[0]; if (!file) return; if (file.size > 5e6) throw new Error('Dosya 5 MB sınırını aşıyor.'); commit(JSON.parse(await file.text())); clearForm(); message('Liste içe aktarıldı.'); } catch (e) { message(e.message); } finally { event.target.value = ''; } };
$('reset').onclick = async () => { if (!confirm('Yerel liste kaldırılacak ve GitHub listesi kullanılacak. Saklamak için önce JSON indir. Devam edilsin mi?')) return; try { ChannelStore.reset(); data = await ChannelStore.load(); clearForm(); render(); source(false); message('GitHub listesi açıldı.'); } catch (e) { message(e.message); } };
(async () => { try { const initial = await ChannelStore.load(); if (!editedSinceLoad) { data = initial; source(data.local); render(); } } catch (e) { render(); message('Liste yüklenemedi: ' + e.message + ' Yeni kanal ekleyebilir veya JSON içe aktarabilirsin.'); } })();
