# Editör Bakış — Meliha Hemedan portfolyo

Tek sayfalık statik site. Saf HTML, CSS ve JavaScript ile yazıldı; derleme adımı, `npm install` ya da framework gerektirmez.
Vercel'de "Other / statik site" olarak doğrudan yayınlanır.

## 1. Alan adını yazın (yayından önce, zorunlu)

SEO etiketleri sitenin tam adresini ister. Şu an yer tutucu olarak `https://www.ALANADI.com.tr` yazıyor.
Bunu sitenin gerçek adresiyle değiştirin. Sonuna `/` koymayın. Örnek adresler:
`https://melihahemedan.vercel.app` ya da bağlanacak özel alan adı `https://www.ornek.com`.

| Dosya | Kaç yerde |
|---|---|
| `index.html` | 15 |
| `sitemap.xml` | 7 |
| `robots.txt` | 1 |

VS Code'da projeyi açın, **Ctrl+Shift+H** (tüm dosyalarda değiştir) ile `https://www.ALANADI.com.tr` metnini aratıp değiştirin.

## 2. GitHub'a yükleme

```bash
cd site2
git init
git add .
git commit -m "Editör Bakış portfolyo sitesi"
git branch -M main
git remote add origin https://github.com/KULLANICI_ADI/REPO_ADI.git
git push -u origin main
```

## 3. Vercel'e bağlama

1. vercel.com → **Add New… → Project** → GitHub reposunu seçin → **Import**.
2. Ayarlar:
   - **Framework Preset:** `Other`
   - **Root Directory:** `./` (repo kökü bu klasörse)
   - **Build Command:** boş bırakın (veya "Override" kapalı)
   - **Output Directory:** boş bırakın (kök dizin yayınlanır)
   - **Install Command:** boş bırakın
3. **Deploy**. Sonraki her `git push` otomatik olarak yeniden yayınlanır.
4. Özel alan adı: Project → **Settings → Domains** → alan adını ekleyin, Vercel'in verdiği DNS kayıtlarını
   alan adı sağlayıcısına girin. HTTPS sertifikası otomatik gelir.
5. Alan adı belli olunca 1. adımdaki adresi güncelleyip tekrar push edin.

**Komut satırından (isteğe bağlı):** `npm i -g vercel` → klasörde `vercel` → sonra `vercel --prod`.

## 4. Yerelde çalıştırma

Herhangi bir statik sunucu yeter. Örnek: `npx serve .` → http://localhost:3000

> `index.html` dosyasını doğrudan çift tıklayarak açmayın. Yollar `/assets/...` ile başladığı için
> sunucu olmadan görseller ve stiller yüklenmez.

## 5. Yayından sonra

- **Google Search Console:** alan adını ekleyin → Site haritaları → `sitemap.xml` gönderin.
- **Paylaşım önizlemesi:** WhatsApp / LinkedIn'de linki paylaşınca kapaklı görsel (`assets/img/og-image.jpg`) çıkmalı.

## Dosya yapısı

```
index.html            Ana sayfa (tüm içerik)
404.html              Bulunamayan sayfa (Vercel otomatik kullanır)
vercel.json           Önbellek, güvenlik başlıkları, temiz URL ayarları
robots.txt, sitemap.xml
favicon.svg, favicon-32.png, apple-touch-icon.png, icon-192.png, icon-512.png, site.webmanifest
assets/css/style.css  Tasarım (renkler dosyanın başındaki :root içinde)
assets/js/main.js     Animasyon motoru, menü, görsel önizleme kutusu
assets/fonts/         Türkçe karakterlere göre küçültülmüş yazı tipleri (dış servis yok)
assets/img/           WebP görseller (her biri 2 boyut) + og-image.jpg
```

## İçerik güncelleme

- **Metinler:** `index.html` içinde bölümler `<!-- ===== BÖLÜM ... ===== -->` yorumlarıyla ayrılmış.
- **Yeni kitap:** Bir `<article class="book">…</article>` bloğunu kopyalayın. Kapağı WebP olarak
  `assets/img/` içine koyun (ör. `yeni-kitap-480.webp` ve `yeni-kitap-900.webp`). `<head>` içindeki
  JSON-LD listesine (ItemList) kitabı ekleyin.
- **Animasyon:** Bir öğeye `data-fx="in"` verip `rise`, `turn`, `flip` veya `settle` sınıflarından birini eklemek yeterli.
- **Renk:** `assets/css/style.css` → `--accent:#C8312B;`
- **CSS/JS değiştirdiyseniz:** `index.html` içindeki `?v=4` değerini artırın (`?v=5`), tarayıcı önbelleği yenilensin.

## Gizlilik

- Sertifika görsellerindeki TC kimlik no, anne-baba adı, belge/barkod numaraları ve QR kodları dosyalardan silinmiştir.
- Fotoğrafların konum/cihaz (EXIF) bilgileri temizlenmiştir.
- Site hiçbir dış servise (Google Fonts, analiz, çerez) istek atmaz; çerez bildirimi gerekmez.
