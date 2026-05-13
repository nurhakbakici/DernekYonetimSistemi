# Kule Sakinleri

**Kule Sakinleri Rol Yapma ve Masa Üstü Strateji Oyunları Derneği** için geliştirilmiş, **Expo (SDK 54)** ve **React Native** tabanlı mobil uygulama. Üyeler dernek işlemlerini (oda, kütüphane, burs, etkinlik, aidat vb.) tek uygulamadan takip eder; yöneticiler onay ve içerik yönetimini aynı kod tabanı üzerinden yapar.

---

## İçindekiler

- [Özellikler](#özellikler)
- [Mimari özeti](#mimari-özeti)
- [Gereksinimler](#gereksinimler)
- [Kurulum ve çalıştırma](#kurulum-ve-çalıştırma)
- [Yapılandırma: Firebase ve yerel mod](#yapılandırma-firebase-ve-yerel-mod)
- [Firestore veri modeli](#firestore-veri-modeli)
- [Örnek veri ve demo hesaplar](#örnek-veri-ve-demo-hesaplar)
- [Firestore tohum (seed) scripti](#firestore-tohum-seed-scripti)
- [Proje yapısı](#proje-yapısı)
- [Teknoloji yığını](#teknoloji-yığını)
- [Geliştirme notları](#geliştirme-notları)
- [Sorun giderme](#sorun-giderme)
- [Lisans ve sorumluluk reddi](#lisans-ve-sorumluluk-reddi)

---

## Özellikler

| Alan | Üye / tam üye | Yönetici |
|------|----------------|----------|
| **Kimlik** | E-posta ile giriş ve kayıt; şifre sıfırlama ve değiştirme (Firebase etkinse) | — |
| **Ana sayfa** | Dernek durumu, duyurular, kısayollar | — |
| **Odalar** | Oda listesi, rezervasyon talebi, kendi rezervasyonları, **doluluk takvimi** (takvim + oda filtresi) | Oda ekleme |
| **Rezervasyon** | Tarih ve saat seçimi, çakışma önizlemesi | Onay / iptal |
| **Kütüphane** | Kitap listesi, arama, kategori, ödünç al / iade, **gecikme senkronu** | Kitap ekleme |
| **Burslar** | Program listesi, başvuru (isteğe bağlı **çoklu belge** yükleme), başvurularım | Program ekleme (**süre ay**, zorunlu belge seçimi), başvuru onayı, **IBAN** görüntüleme ve kopyalama, ödeme işaretleme |
| **Burs başvurusu (onay sonrası)** | Onaylı başvuruda **TR IBAN** kaydı ve güncelleme | Ödeme “yatırıldı” için IBAN zorunluluğu |
| **Etkinlikler** | Liste ve **takvim** görünümü, detay, katılım | Ekleme / düzenleme / onay |
| **Aidat** | Aylık özet, dekont yükleme | Onay / red, aylık tutar |
| **Duyurular** | Liste ve okuma | Yönetim ekranı |
| **Profil** | Üyelik, kısayollar | Yönetici paneli, üye listesi |

---

## Mimari özeti

- **Durum yönetimi:** `AuthContext` (oturum, kullanıcı profili), `DataContext` (iş verisi: odalar, rezervasyonlar, kitaplar, burslar, etkinlikler, aidat, duyurular vb.).
- **İki çalışma modu:**
  - **Yerel (demo):** `.env` yok veya `EXPO_PUBLIC_FIREBASE_*` değerleri yer tutucu (`YOUR_*`) ise Firebase devre dışı; veri **AsyncStorage** üzerinde tutulur, ilk açılışta `mockData` ile doldurulur.
  - **Firebase:** `.env` içinde geçerli `EXPO_PUBLIC_FIREBASE_*` değerleri varsa **Firebase Auth** + **Firestore** kullanılır; kullanıcı profilleri `users/{uid}` dokümanlarında tutulur.
- **Navigasyon:** `AuthNavigator` (giriş/kayıt) → `MainNavigator` (alt sekmeler + stack ekranları). Tam üye olmayan rollerde bazı sekmeler gizlenir (`userAccess`).

---

## Gereksinimler

| Araç | Önerilen |
|------|-----------|
| Node.js | **20 LTS** veya **18+** |
| Paket yöneticisi | npm (projede `package-lock.json` ile sabitlenmiş) |
| Mobil geliştirme | **Expo Go** (fiziksel cihaz) ve/veya Android Studio / Xcode (emülatör) |

Resmi Expo sürümü `package.json` içindeki `expo` alanına bağlıdır (şu an **SDK 54**).

---

## Kurulum ve çalıştırma

Depo kökünde `KuleSakinleri` klasörüne girin:

```bash
cd KuleSakinleri
npm install
```

| Komut | Açıklama |
|--------|----------|
| `npm run start` | Metro + Expo geliştirme sunucusu |
| `npm run start -- --clear` | Önbelleği temizleyerek başlatır |
| `npm run start:tunnel` | Tunnel modu (ör. fiziksel cihazda uzaktan test) |
| `npm run android` | Android hedefi |
| `npm run ios` | iOS hedefi (macOS + Xcode) |
| `npm run web` | Web derlemesi |
| `npm run seed:firestore` | Firestore’a örnek veri (Firebase yapılandırılmış ve ortam değişkenleri tanımlı olmalı) |

**Expo Go:** Terminalde görünen QR kodu Expo Go ile tarayın.

**Uygulama kimliği (derleme için):** `app.json` — Android `com.kulesakinleri.app`, iOS `com.kulesakinleri.app`.

---

## Yapılandırma: Firebase ve yerel mod

### Ortam değişkenleri (`.env`)

1. Proje kökünde `copy .env.example .env` (macOS/Linux: `cp .env.example .env`) çalıştırın.
2. [Firebase Console](https://console.firebase.google.com) → Proje ayarları → Genel → **Web uygulaması** snippet’indeki değerleri `.env` içindeki `EXPO_PUBLIC_FIREBASE_*` alanlarına yapıştırın.
3. Expo, `EXPO_PUBLIC_` ile başlayan değişkenleri istemci paketine gömer; değişiklikten sonra Metro’yu yeniden başlatın (`npm start`).

`src/config/firebase.ts` yalnızca bu değişkenleri okur; repoda gerçek anahtar tutulmaz.

### Yerel (demo) mod

`.env` yoksa veya `EXPO_PUBLIC_FIREBASE_API_KEY` / `EXPO_PUBLIC_FIREBASE_PROJECT_ID` yer tutucu (`YOUR_*`) ise `IS_FIREBASE_CONFIGURED` false kalır; uygulama **çevrimdışı demo** olarak çalışır.

### Firebase modu

1. [Firebase Console](https://console.firebase.google.com) üzerinde proje oluşturun.
2. **Authentication** → E-posta/şifre sağlayıcısını etkinleştirin.
3. **Firestore Database** oluşturun (üretimde güvenlik kurallarını mutlaka sıkılaştırın; bu repo kuralları içermez).
4. Web uygulaması yapılandırmasını `.env` dosyasındaki `EXPO_PUBLIC_FIREBASE_*` değişkenlerine yansıtın.

**Güvenlik:** `.env` `.gitignore` içindedir; commit etmeyin. `EXPO_PUBLIC_*` değerleri derlenmiş uygulamada görülebilir; koruma için Firestore kuralları ve (mümkünse) App Check kullanın. Eski anahtarlar repoda paylaşıldıysa Firebase konsolundan **yenileyin**.

---

## Firestore veri modeli

Uygulama aşağıdaki **koleksiyon** adlarını kullanır (özet):

| Koleksiyon | İçerik |
|------------|--------|
| `users` | Kullanıcı profili (`User`), doküman ID = Auth `uid` |
| `odalar`, `rezervasyonlar`, `kitaplar`, `oduncAlmalar` | Oda ve kütüphane |
| `burslar`, `bursBasvurulari` | Burs programları ve başvurular (belgeler, IBAN, ödeme durumu vb.) |
| `etkinlikler` | Etkinlikler |
| `duyurular` | Duyurular |
| `aidatOdemeleri` | Aidat ödemeleri |
| `ayarlar` (sabit dokümanlar) | `dernekDurumu`, `aidatAylikMiktar` |

---

## Örnek veri ve demo hesaplar

**Yerel mod** ilk çalıştırmada `mockData` ile örnek odalar, kitaplar, burslar, rezervasyonlar vb. yüklenir.

Aşağıdaki hesaplar **yalnızca yerel demo** içindir; üretimde kullanılmamalıdır:

| Rol | E-posta | Şifre |
|-----|---------|--------|
| Yönetici | `admin@kulesakinleri.com` | `admin123` |
| Üye | `uye@kulesakinleri.com` | `123456` |
| Aday üye | `aday@kulesakinleri.com` | `123456` |

Firebase modunda aynı e-postalar yalnızca seed veya manuel kullanıcı oluşturma ile varsa geçerlidir.

---

## Firestore tohum (seed) scripti

`npm run seed:firestore` komutu `scripts/seed-firestore.js` dosyasını çalıştırır. Özet akış:

1. Kök dizindeki `.env` yüklenir (`dotenv`); Firebase için `EXPO_PUBLIC_FIREBASE_*` veya `FIREBASE_*` değişkenleri okunur.
2. Yönetici hesabı için `.env` içindeki `SEED_ADMIN_EMAIL` ve `SEED_ADMIN_PASSWORD` (veya aynı adlarla shell ortam değişkenleri) kullanılır.

Ayrıntılı kullanım için `scripts/seed-firestore.js` dosyasındaki üst bilgi yorumlarına bakın.

---

## Proje yapısı

```
KuleSakinleri/
├── app.json                 # Expo uygulama meta verisi, izinler, eklentiler
├── assets/                  # İkon, splash, favicon
├── scripts/
│   └── seed-firestore.js    # Firestore örnek veri (opsiyonel)
├── src/
│   ├── App.tsx              # Kök bileşen
│   ├── config/
│   │   ├── firebase.ts      # Firebase config (process.env; yer tutucu = yerel mod)
│   │   ├── mockData.ts      # Demo veri şablonları
│   │   └── storage.ts       # AsyncStorage anahtarları ve yardımcılar
│   ├── constants/           # Renkler, tema, aidat sabitleri
│   ├── context/
│   │   ├── AuthContext.tsx  # Oturum ve kullanıcı
│   │   └── DataContext.tsx  # Firestore / yerel veri işlemleri
│   ├── navigation/          # Auth + ana sekme/stack navigasyonu
│   ├── screens/
│   │   ├── auth/            # Giriş, kayıt, şifre unuttum
│   │   ├── home/
│   │   ├── rooms/           # Odalar, rezervasyon formu, takvim, oda ekleme
│   │   ├── library/         # Kütüphane, detay, kitap ekleme
│   │   ├── scholarships/    # Burs listesi, detay, başvuru, admin ekleme
│   │   ├── events/          # Etkinlikler, takvim, admin
│   │   ├── membership/      # Aidat ve üyelik akışı
│   │   ├── profile/         # Profil, şifre değişimi
│   │   ├── announcements/   # Duyurular
│   │   └── admin/           # Yönetim ekranları
│   ├── components/          # Ortak UI (ScreenHeader, EmptyState, …)
│   ├── types/index.ts       # TypeScript arayüzleri
│   └── utils/               # IBAN, aidat, burs belgeleri, galeri, vb.
├── index.ts
├── package.json
└── tsconfig.json
```

---

## Teknoloji yığını

| Katman | Teknoloji |
|--------|-----------|
| Çatı | **Expo ~54**, **React Native 0.81**, **React 19** |
| Dil | **TypeScript** |
| Navigasyon | **React Navigation** (native stack, bottom tabs, stack) |
| Arka uç (opsiyonel) | **Firebase** 12 — Auth, Firestore |
| Yerel depolama | **AsyncStorage** |
| Tarih | **date-fns** |
| Takvim UI | **react-native-calendars** |
| Diğer | **expo-image-picker**, **expo-file-system**, **expo-notifications**, **expo-clipboard**, **react-native-paper**, **Reanimated** |

---

## Geliştirme notları

- Tip kontrolü: proje kökünde `npx tsc --noEmit`
- İş kuralları büyük ölçüde `DataContext` içinde; yeni koleksiyon veya alan eklerken hem Firestore hem `AsyncStorage` dallarını güncelleyin.
- Hassas kişisel veri (ör. IBAN): üretimde Firestore güvenlik kuralları, alan düzeyi şifreleme veya uyumluluk gereksinimlerinize göre ek önlemler değerlendirilmelidir.

---

## Sorun giderme

| Sorun | Öneri |
|--------|--------|
| Metro / önbellek hataları | `npm run start -- --clear` |
| Tunnel ile cihaz bağlanmıyor | `npm run start:tunnel`; güvenlik duvarı ve aynı Wi‑Fi’yi kontrol edin |
| Firebase “permission denied” | Firestore kurallarını ve kullanıcının giriş yapmış olduğunu doğrulayın |
| Yerel veri karıştı | Geliştirme sırasında uygulama verisini silmek için cihazda uygulamayı kaldırıp yeniden kurun veya AsyncStorage anahtarlarını (`storage.ts`) göz önünde bulundurun |

---

## Lisans ve sorumluluk reddi

Bu yazılım **Kule Sakinleri Rol Yapma ve Masa Üstü Strateji Oyunları Derneği** ihtiyaçları doğrultusunda geliştirilmiştir. Ticari lisans metni eklenmemişse, kullanım koşulları dernek ve geliştirici ekibi arasındaki anlaşmaya tabidir.

**Sorumluluk reddi:** Bu README bir operasyon veya hukuk rehberi değildir. Firebase güvenlik kuralları, KVKK/GDPR ve finansal işlemler için ilgili uzman görüşü alınmalıdır.
