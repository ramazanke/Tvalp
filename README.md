# Alpica TV

GitHub Pages üzerinde çalışan, kumanda destekli HLS oynatıcı ve ayrı kanal yönetim sayfası. Eski Tv.m3u bağlantısı kullanılmaz.

## Kurulum

Bu klasördeki index.html, app.js, style.css, admin.html, admin.js, admin.css, channel-store.js ve channels.json dosyalarını aynı GitHub depo klasörüne yükleyin. Settings → Pages bölümünden main / root seçin.

## Kanal ekleme

admin.html sayfasını açın (oynatıcıdaki Kanal yönetimi bağlantısı). Kanal adı, HTTPS HLS adresi, kategori ve isteğe bağlı HTTPS logo ekleyin. Kanalları düzenleyebilir, silebilir ve sıralayabilirsiniz. Ulusal kategorisi varsa başlangıçta o açılır.

Kaydet aynı tarayıcıdaki localStorage alanına yazar. Aynı site adresindeki açık oynatıcı sekmeleri otomatik güncellenir. Tarayıcı depolaması kapalıysa kayıt hatası gösterilir. Farklı tarayıcılar, cihazlar ve gizli pencereler bu yerel listeyi paylaşmaz.

Diğer cihazlar için **channels.json indir** düğmesine basın; dosyayı deponuzdaki channels.json üzerine yükleyin. GitHub Pages güncellemesi yayınlandıktan sonra diğer cihazlarda oynatıcıyı yenileyin. Yerel liste olan cihazlar GitHub listesinin önüne onu koyar; **GitHub listesini kullan** düğmesiyle yerel kaydı kaldırabilirsiniz. Önce JSON indirerek yedek alabilirsiniz. JSON içe aktar mevcut yerel listeyi değiştirir.

GitHub Pages sunucuya yazamaz; bu bir yerel liste editörüdür, kimlik doğrulamalı ortak yönetim paneli değildir. Yayınlanan channels.json ve adresleri herkese açıktır. Gizli erişim bilgilerini yayınlamayın. Dosyaları çift tıklamak yerine GitHub Pages veya yerel HTTP sunucusundan açın.

## Oynatma

Sağ/sol: sonraki/önceki kanal. OK: kategoriler. Aşağı: kanal logoları. Geri/Esc: menüyü kapat. F: tam ekran. Tam ekranda kanal adı 3 saniye sonra kaybolur; menüler isteğe bağlı açılır.

HTTPS adresi tek başına yeterli değildir: yayın HLS biçiminde, tarayıcı codec desteğine uygun ve CORS izinli olmalıdır. Sunucudaki hatalar veya uyumsuz yayınlar liste yönetimiyle düzeltilemez. İlk sesli oynatma ve tam ekran için kullanıcı tuşuna basması gerekebilir.

Kategori ve kanal menüleri 8 saniye etkileşim olmayınca kapanır; kumanda/fare etkileşimi süreyi yeniler. Kaydet düğmeleri yalnızca bu tarayıcıya kayıt yapar. GitHub için JSON indirip depodaki channels.json dosyasının yerine yükleyin.
