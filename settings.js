'use strict';
const $=id=>document.getElementById(id);
const example='https://sultanios.alwaysdata.net/vavoTV.php?ID=Turkey';
function message(text){$('message').textContent=text;}
function renderSource(){
  const state=ChannelStore.describe();
  $('activeSource').textContent=state.mode==='remote' ? 'Etkin kaynak: Eklediğin liste adresi · son kayıtta '+state.count+' kanal' :
    state.mode==='local' ? 'Etkin kaynak: Bu tarayıcıdaki yerel kanallar' : 'Etkin kaynak: GitHub channels.json listesi';
  if(state.mode==='remote')$('sourceUrl').value=state.url;
}
function busy(value){document.querySelectorAll('button,input').forEach(el=>el.disabled=value);$('sourceForm').setAttribute('aria-busy',String(value));}
function resultText(data){
  const groups=new Set(data.channels.map(c=>c.group)).size;
  const http=data.channels.filter(c=>c.url.startsWith('http:')).length;
  return data.channels.length+' kanal, '+groups+' kategori bulundu.'+
    (data.skipped?' '+data.skipped+' geçersiz kayıt atlandı.':'')+
    (http?' '+http+' yayın HTTP kullanıyor; HTML oynatmada engellenebilir.':'');
}
$('sourceForm').onsubmit=async event=>{
  event.preventDefault();
  const action=event.submitter?.value || 'test';
  busy(true);message('Liste kontrol ediliyor…');
  try{
    const value=$('sourceUrl').value.trim();
    const data=action==='test'?await ChannelStore.testSource(value):await ChannelStore.setSource(value);
    if(action==='test')message(resultText(data)+' Kontrol başarılı; kaydetmek için Kaydet ve kullan düğmesine bas.');
    else {renderSource();message(resultText(data)+' Kaynak bu tarayıcıya kaydedildi.');if(action==='watch')location.href='index.html';}
  }catch(error){message(error.message+' Önceki kaynak korunuyor.');}
  finally{busy(false);}
};
$('exampleSource').onclick=()=>{$('sourceUrl').value=example;$('sourceUrl').focus();message('Örnek adres dolduruldu. Bağlantıyı kontrol et düğmesiyle doğrulayabilirsin.');};
$('githubSource').onclick=async()=>{
  busy(true);message('GitHub listesi kontrol ediliyor…');
  try{const data=await ChannelStore.useGitHub();$('sourceUrl').value='';renderSource();message(data.channels.length+' kanallı GitHub listesi seçildi. Yerel kanalların korundu.');}
  catch(error){message(error.message+' Önceki kaynak korunuyor.');}finally{busy(false);}
};
renderSource();

$('openSource').onclick=()=>{
  try{window.open(ChannelStore.sourceUrl($('sourceUrl').value),'_blank','noopener,noreferrer');}
  catch(error){message(error.message);}
};
$('sourceFile').onchange=async event=>{
  const file=event.target.files[0];if(!file)return;
  busy(true);message('Dosya okunuyor…');
  try{
    if(file.size>5*1024*1024)throw new Error('Dosya 5 MB sınırını aşıyor.');
    let base=location.href;
    try{if($('sourceUrl').value.trim())base=ChannelStore.sourceUrl($('sourceUrl').value);}catch{}
    const data=ChannelStore.parseList(await file.text(),base);
    ChannelStore.save(data);
    renderSource();message(resultText(data)+' Dosyadan bu tarayıcıya aktarıldı. Oynatıcıya dönerek izleyebilirsin; bu liste uzaktan otomatik güncellenmez.');
  }catch(error){message(error.message+' Önceki kaynak korunuyor.');}
  finally{event.target.value='';busy(false);}
};
