/* eslint-disable no-console */
/**
 * Belirli bir derneğe (varsayılan slug: ybsder) 10–15 demo üye + tüm modüllerde örnek veri.
 *
 *   npm run seed:ybs
 *   SEED_DERNEK_SLUG=ybsder npm run seed:ybs
 *   SEED_YBS_FORCE=1 npm run seed:ybs   (ybsModuleSeedAt olsa bile tekrar ekler)
 */
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });
const { initializeApp } = require("firebase/app");
const {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} = require("firebase/auth");
const {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  addDoc,
  getDocs,
  query,
  where,
} = require("firebase/firestore");

const SLUG = process.env.SEED_DERNEK_SLUG || "ybsder";
const MEMBER_PASS = process.env.SEED_MEMBER_PASSWORD || "Demo123!";
const EMAIL_DOMAIN = process.env.SEED_EMAIL_DOMAIN || "kulesakinleri.com";

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || process.env.FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || process.env.FIREBASE_APP_ID,
};

/** 13 demo üye: 10 aktif üye, 2 aday, 1 pasif */
const DEMO_UYELER = [
  { key: "01", ad: "Ali", soyad: "Yılmaz", rol: "uye", uyelikDurumu: "aktif" },
  { key: "02", ad: "Ayşe", soyad: "Kaya", rol: "uye", uyelikDurumu: "aktif" },
  { key: "03", ad: "Can", soyad: "Demir", rol: "uye", uyelikDurumu: "aktif" },
  { key: "04", ad: "Zeynep", soyad: "Arslan", rol: "uye", uyelikDurumu: "aktif" },
  { key: "05", ad: "Emre", soyad: "Aydın", rol: "uye", uyelikDurumu: "aktif" },
  { key: "06", ad: "Selin", soyad: "Koç", rol: "uye", uyelikDurumu: "aktif" },
  { key: "07", ad: "Burak", soyad: "Öztürk", rol: "uye", uyelikDurumu: "aktif" },
  { key: "08", ad: "Elif", soyad: "Şahin", rol: "uye", uyelikDurumu: "aktif" },
  { key: "09", ad: "Mert", soyad: "Çelik", rol: "uye", uyelikDurumu: "aktif" },
  { key: "10", ad: "Deniz", soyad: "Ak", rol: "uye", uyelikDurumu: "aktif" },
  { key: "11", ad: "Gamze", soyad: "Polat", rol: "aday", uyelikDurumu: "beklemede" },
  { key: "12", ad: "Kaan", soyad: "Yıldız", rol: "aday", uyelikDurumu: "beklemede" },
  { key: "13", ad: "Nur", soyad: "Eren", rol: "uye", uyelikDurumu: "pasif" },
];

function gun(n) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().split("T")[0];
}

function isoGun(n) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString();
}

function saatli(gunStr, h) {
  return `${gunStr}T${String(h).padStart(2, "0")}:00:00`;
}

async function findDernekBySlug(db, slug) {
  const snap = await getDocs(query(collection(db, "dernekler"), where("slug", "==", slug)));
  if (snap.empty) return null;
  const d = snap.docs[0];
  return { id: d.id, ...d.data() };
}

async function ensureMember(auth, db, dernekId, adminEmail, adminPassword, { key, ad, soyad, rol, uyelikDurumu }) {
  const email = `ybs.${key}@${EMAIL_DOMAIN}`.toLowerCase();
  const iso = new Date().toISOString();
  let uid;

  try {
    const cred = await createUserWithEmailAndPassword(auth, email, MEMBER_PASS);
    uid = cred.user.uid;
    // Auth şu an yeni kullanıcıda — profil ve aday üyelik kendi adına oluşturulabilir
    await setDoc(doc(db, "users", uid), {
      ad,
      soyad,
      email,
      telefon: `053${key} 000 00${key}`,
      olusturulmaTarihi: iso,
    });
    await setDoc(doc(db, "uyelikler", `${uid}_${dernekId}`), {
      userId: uid,
      dernekId,
      rol: "aday",
      uyelikDurumu: "beklemede",
      uyelikBaslangic: "2024-09-01",
      olusturulmaTarihi: iso,
    });
  } catch (e) {
    if (e.code === "auth/email-already-in-use") {
      const cred = await signInWithEmailAndPassword(auth, email, MEMBER_PASS);
      uid = cred.user.uid;
      await setDoc(
        doc(db, "users", uid),
        { ad, soyad, email, telefon: `053${key} 000 00${key}`, olusturulmaTarihi: iso },
        { merge: true },
      );
    } else {
      throw e;
    }
  }

  // Yönetici oturumuna dön; rol/durum güncelle (platform veya dernek admini)
  await signInWithEmailAndPassword(auth, adminEmail, adminPassword);
  const uyelikRef = doc(db, "uyelikler", `${uid}_${dernekId}`);
  const uySnap = await getDoc(uyelikRef);
  if (!uySnap.exists()) {
    await setDoc(uyelikRef, {
      userId: uid,
      dernekId,
      rol,
      uyelikDurumu,
      uyelikBaslangic: "2024-09-01",
      olusturulmaTarihi: iso,
    });
  } else if (rol !== "aday" || uyelikDurumu !== "beklemede") {
    await updateDoc(uyelikRef, { rol, uyelikDurumu });
  }

  return { uid, adSoyad: `${ad} ${soyad}`, email, rol, uyelikDurumu };
}

async function countCollection(db, col, dernekId) {
  const snap = await getDocs(query(collection(db, col), where("dernekId", "==", dernekId)));
  return snap.size;
}

async function main() {
  if (!firebaseConfig.apiKey || firebaseConfig.apiKey === "YOUR_API_KEY") {
    throw new Error(".env içinde Firebase yapılandırması eksik.");
  }

  const adminEmail = process.env.SEED_ADMIN_EMAIL;
  const adminPassword = process.env.SEED_ADMIN_PASSWORD;
  if (!adminEmail || !adminPassword) {
    throw new Error("SEED_ADMIN_EMAIL ve SEED_ADMIN_PASSWORD gerekli.");
  }

  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const db = getFirestore(app);

  const adminCred = await signInWithEmailAndPassword(auth, adminEmail, adminPassword);
  const adminUid = adminCred.user.uid;

  const dernek = await findDernekBySlug(db, SLUG);
  if (!dernek) {
    throw new Error(`Slug "${SLUG}" ile dernek bulunamadı. Firestore'da dernekler koleksiyonunu kontrol edin.`);
  }

  const DERNEK_ID = dernek.id;
  const dernekRef = doc(db, "dernekler", DERNEK_ID);

  if (dernek.ybsModuleSeedAt && process.env.SEED_YBS_FORCE !== "1") {
    console.log(`"${dernek.ad}" için modül seed zaten yapılmış (ybsModuleSeedAt).`);
    console.log("Tekrar eklemek için: SEED_YBS_FORCE=1 npm run seed:ybs");
    return;
  }

  console.log("Dernek:", dernek.ad, "| id:", DERNEK_ID, "| slug:", SLUG);

  const iso = new Date().toISOString();
  await setDoc(
    doc(db, "uyelikler", `${adminUid}_${DERNEK_ID}`),
    {
      userId: adminUid,
      dernekId: DERNEK_ID,
      rol: "admin",
      uyelikDurumu: "aktif",
      uyelikBaslangic: "2024-01-01",
      olusturulmaTarihi: iso,
    },
    { merge: true },
  );
  console.log("Seed hesabı bu dernekte yönetici olarak işaretlendi.");
  const members = [];
  if (process.env.SEED_YBS_SKIP_USERS !== "1") {
    for (const u of DEMO_UYELER) {
      const m = await ensureMember(auth, db, DERNEK_ID, adminEmail, adminPassword, u);
      members.push(m);
      console.log("  Üye:", m.email, "—", m.adSoyad, `(${m.rol}/${m.uyelikDurumu})`);
    }
  } else {
    console.log("SEED_YBS_SKIP_USERS=1 — mevcut üyelikler kullanılıyor.");
    const uySnap = await getDocs(query(collection(db, "uyelikler"), where("dernekId", "==", DERNEK_ID)));
    for (const d of uySnap.docs) {
      const uy = d.data();
      const ps = await getDoc(doc(db, "users", uy.userId));
      if (!ps.exists()) continue;
      const p = ps.data();
      members.push({
        uid: uy.userId,
        adSoyad: `${p.ad} ${p.soyad}`,
        email: p.email,
        rol: uy.rol,
        uyelikDurumu: uy.uyelikDurumu,
      });
    }
  }

  const aktifUyeler = members.filter((m) => m.uyelikDurumu === "aktif" && m.rol === "uye");
  if (aktifUyeler.length === 0) {
    throw new Error("Aktif üye oluşturulamadı. SEED_ADMIN platform/dernek yöneticisi olmalı.");
  }

  // Modül verileri admin oturumuyla yazılır
  await signInWithEmailAndPassword(auth, adminEmail, adminPassword);

  // ── Odalar ─────────────────────────────────────────────────────────────────
  console.log("Odalar ekleniyor…");
  try {
    const odaSayisi = await countCollection(db, "odalar", DERNEK_ID);
    if (odaSayisi < 4) {
    for (const oda of [
      { ad: "Ana Salon", aciklama: "Toplantı ve turnuva", kapasite: 24, ozellikler: ["Projeksiyon", "WiFi"], aktif: true },
      { ad: "Strateji Odası", aciklama: "Masa oyunları", kapasite: 8, ozellikler: ["Geniş masa"], aktif: true },
      { ad: "RPG Odası", aciklama: "Kampanya oturumları", kapasite: 6, ozellikler: ["Ses sistemi"], aktif: true },
      { ad: "Kütüphane", aciklama: "Sessiz çalışma", kapasite: 4, ozellikler: ["WiFi"], aktif: true },
      { ad: "Bahçe", aciklama: "Açık hava", kapasite: 30, ozellikler: [], aktif: true },
    ]) {
      await addDoc(collection(db, "odalar"), { ...oda, dernekId: DERNEK_ID });
    }
    console.log("Odalar eklendi.");
    }
  } catch (e) {
    console.warn("Oda sayımı atlandı, yine de oda ekleniyor:", e.message);
    for (const oda of [
      { ad: "Ana Salon", aciklama: "Toplantı", kapasite: 24, ozellikler: ["Projeksiyon"], aktif: true },
      { ad: "Strateji Odası", aciklama: "Oyun", kapasite: 8, ozellikler: ["Masa"], aktif: true },
    ]) {
      await addDoc(collection(db, "odalar"), { ...oda, dernekId: DERNEK_ID });
    }
  }

  const odalarSnap = await getDocs(query(collection(db, "odalar"), where("dernekId", "==", DERNEK_ID)));
  console.log("Odalar okundu:", odalarSnap.size);
  const odalar = odalarSnap.docs.map((d) => ({ id: d.id, ad: d.data().ad || "Oda" }));

  // ── Duyurular ──────────────────────────────────────────────────────────────
  console.log("Duyurular…");
  for (const [baslik, icerik] of [
    ["YBS Bitirme Sergisi", "3 Haziran sergisine tüm üyeler davetlidir."],
    ["Aidat Mayıs", "Son ödeme 31 Mayıs. Dekontu uygulamadan yükleyin."],
    ["Kütüphane yenilendi", "15 yeni kitap rafta. Ödünç süresi 14 gün."],
    ["Gönüllü aranıyor", "Haziran etkinliği için 8 gönüllü — uygulamadan başvurun."],
    ["Dernek açık", dernek.dernekDurumu?.mesaj || "Hafta içi 10:00–20:00 açığız."],
  ]) {
    await addDoc(collection(db, "duyurular"), {
      baslik,
      icerik,
      olusturulmaTarihi: isoGun(-Math.floor(Math.random() * 5)),
      olusturanId: members[0].uid,
      olusturanAdi: "YBS Demo",
      dernekId: DERNEK_ID,
    });
  }

  // ── Kitaplar + ödünç ───────────────────────────────────────────────────────
  const kitapRefs = [];
  for (const k of [
    { baslik: "D&D Player's Handbook", yazar: "WotC", kategori: "RPG", toplamAdet: 3, musaitAdet: 2, yayinYili: 2014 },
    { baslik: "Catan", yazar: "K. Teuber", kategori: "Strateji", toplamAdet: 4, musaitAdet: 3, yayinYili: 2018 },
    { baslik: "Ticket to Ride", yazar: "A. Moon", kategori: "Aile", toplamAdet: 2, musaitAdet: 1, yayinYili: 2020 },
    { baslik: "Dernek Yönetimi El Kitabı", yazar: "İçişleri", kategori: "Mevzuat", toplamAdet: 5, musaitAdet: 4, yayinYili: 2020 },
    { baslik: "Pathfinder Core", yazar: "Paizo", kategori: "RPG", toplamAdet: 2, musaitAdet: 2, yayinYili: 2019 },
    { baslik: "Pandemic", yazar: "M. Leacock", kategori: "Kooperatif", toplamAdet: 2, musaitAdet: 2, yayinYili: 2020 },
  ]) {
    kitapRefs.push(await addDoc(collection(db, "kitaplar"), { ...k, dernekId: DERNEK_ID }));
  }
  const oduncDurumlar = ["aktif", "gecikti", "aktif", "iade_edildi", "gecikti"];
  for (let i = 0; i < 5; i++) {
    const kRef = kitapRefs[i % kitapRefs.length];
    const kSnap = await getDoc(kRef);
    const u = aktifUyeler[i % aktifUyeler.length];
    await addDoc(collection(db, "oduncAlmalar"), {
      kitapId: kRef.id,
      kitapBaslik: kSnap.data().baslik,
      kullaniciId: u.uid,
      kullaniciAdi: u.adSoyad,
      oduncTarihi: gun(-12 - i),
      iadeTarihi: gun(2 - i),
      durum: oduncDurumlar[i],
      dernekId: DERNEK_ID,
    });
  }

  // ── Rezervasyonlar ─────────────────────────────────────────────────────────
  const rezDurumlar = ["onaylandi", "beklemede", "onaylandi", "iptal", "onaylandi", "beklemede"];
  for (let i = 0; i < 10; i++) {
    const oda = odalar[i % odalar.length];
    const u = aktifUyeler[i % aktifUyeler.length];
    await addDoc(collection(db, "rezervasyonlar"), {
      odaId: oda.id,
      odaAdi: oda.ad,
      kullaniciId: u.uid,
      kullaniciAdi: u.adSoyad,
      tarih: gun(i + 1),
      baslangicSaati: `${10 + (i % 6)}:00`,
      bitisSaati: `${12 + (i % 6)}:00`,
      amac: ["Toplantı", "Oyun gecesi", "Ders çalışması", "Kampanya"][i % 4],
      durum: rezDurumlar[i % rezDurumlar.length],
      olusturulmaTarihi: iso,
      dernekId: DERNEK_ID,
    });
  }

  // ── Burslar + başvurular ───────────────────────────────────────────────────
  const bursRefs = [];
  for (const b of [
    {
      ad: "YBS Öğrenci Destek Bursu",
      aciklama: "Bilişim / YBS öğrencileri",
      miktar: 6000,
      programSuresiAy: 8,
      saglayanKurum: dernek.ad,
      sonBasvuruTarihi: gun(35),
      gereksinimler: ["Min 2.50 GNO", "Aktif üyelik"],
      gerekliBelgeler: [{ id: "tr", baslik: "Transkript" }],
      durum: "aktif",
      olusturulmaTarihi: iso,
    },
    {
      ad: "Etkinlik Gönüllü Bursu",
      aciklama: "Etkinlik organizasyonu",
      miktar: 2500,
      programSuresiAy: 4,
      saglayanKurum: dernek.ad,
      sonBasvuruTarihi: gun(20),
      gereksinimler: ["En az 1 etkinlik katılımı"],
      durum: "aktif",
      olusturulmaTarihi: iso,
    },
  ]) {
    bursRefs.push(await addDoc(collection(db, "burslar"), { ...b, dernekId: DERNEK_ID }));
  }
  const basvuruDurumlar = ["beklemede", "onaylandi", "reddedildi", "beklemede", "onaylandi", "beklemede", "onaylandi", "beklemede"];
  for (let i = 0; i < 8; i++) {
    const u = aktifUyeler[i % aktifUyeler.length];
    const bRef = bursRefs[i % bursRefs.length];
    const bSnap = await getDoc(bRef);
    const durum = basvuruDurumlar[i % basvuruDurumlar.length];
    const row = {
      bursId: bRef.id,
      bursAdi: bSnap.data().ad,
      kullaniciId: u.uid,
      kullaniciAdi: u.adSoyad,
      basvuruTarihi: gun(-10 + i),
      durum,
      dernekId: DERNEK_ID,
    };
    if (durum === "onaylandi") {
      row.bursOdemeDurumu = i % 2 === 0 ? "yatirildi" : "beklemede";
      if (row.bursOdemeDurumu === "yatirildi") row.bursOdemeTarihi = gun(-2);
      row.iban = "TR330006100519786457841326";
    }
    if (durum === "reddedildi") row.notlar = "Belge eksik";
    await addDoc(collection(db, "bursBasvurulari"), row);
  }

  // ── Etkinlikler ────────────────────────────────────────────────────────────
  for (const [baslik, gunOff, durum, katilim] of [
    ["YBS Proje Sunumu", 5, "onaylandi", 4],
    ["Masa Oyunu Gecesi", 8, "onaylandi", 6],
    ["RPG Kampanya", 12, "beklemede", 0],
    ["Genel Kurul", 18, "onaylandi", 2],
    ["Kariyer Sohbeti", 3, "onaylandi", 8],
    ["Bahçe Pikniği", 25, "beklemede", 0],
  ]) {
    const g = gun(gunOff);
    const katilimcilar = aktifUyeler.slice(0, katilim).map((m) => m.uid);
    await addDoc(collection(db, "etkinlikler"), {
      baslik,
      aciklama: `${dernek.ad} etkinliği`,
      tarih: saatli(g, 14),
      bitisTarihi: saatli(g, 17),
      konum: odalar[0]?.ad || "Ana Salon",
      organizator: "YBS Yönetim",
      organizatorId: aktifUyeler[0].uid,
      durum,
      maxKatilimci: 20,
      katilimcilar,
      olusturulmaTarihi: iso,
      dernekId: DERNEK_ID,
    });
  }

  // ── Aidat ──────────────────────────────────────────────────────────────────
  const yil = new Date().getFullYear();
  const ay = new Date().getMonth() + 1;
  const oncAy = ay === 1 ? 12 : ay - 1;
  const oncYil = ay === 1 ? yil - 1 : yil;
  const miktar = dernek.aidatAylikMiktari || 300;
  for (const u of aktifUyeler) {
    await addDoc(collection(db, "aidatOdemeleri"), {
      kullaniciId: u.uid,
      kullaniciAdi: u.adSoyad,
      yil: oncYil,
      ay: oncAy,
      miktar,
      odendi: true,
      odemeTarihi: gun(-20),
      sonOdemeTarihi: new Date(oncYil, oncAy, 0).toISOString().split("T")[0],
      dernekId: DERNEK_ID,
    });
    await addDoc(collection(db, "aidatOdemeleri"), {
      kullaniciId: u.uid,
      kullaniciAdi: u.adSoyad,
      yil,
      ay,
      miktar,
      odendi: Math.random() > 0.45,
      odemeTarihi: gun(-3),
      sonOdemeTarihi: new Date(yil, ay, 0).toISOString().split("T")[0],
      dernekId: DERNEK_ID,
    });
  }

  // ── Gönüllülük ─────────────────────────────────────────────────────────────
  const gorevRefs = [];
  for (const g of [
    { baslik: "Sergi karşılama", kontenjan: 8, durum: "acik", gunOff: 10 },
    { baslik: "Kütüphane düzenleme", kontenjan: 4, durum: "acik", gunOff: 14 },
    { baslik: "Sosyal medya", kontenjan: 2, durum: "acik", gunOff: 7 },
    { baslik: "Turnuva hakemliği", kontenjan: 6, durum: "kapali", gunOff: -5 },
  ]) {
    gorevRefs.push(
      await addDoc(collection(db, "gonulluGorevler"), {
        baslik: g.baslik,
        aciklama: `${dernek.ad} gönüllü görevi`,
        tarih: gun(g.gunOff),
        baslangicSaati: "09:00",
        bitisSaati: "13:00",
        konum: odalar[0]?.ad || "Merkez",
        kontenjan: g.kontenjan,
        durum: g.durum,
        olusturanId: aktifUyeler[0].uid,
        olusturanAdi: aktifUyeler[0].adSoyad,
        olusturulmaTarihi: iso,
        dernekId: DERNEK_ID,
      }),
    );
  }
  const gbDurum = ["onaylandi", "onaylandi", "beklemede", "beklemede", "reddedildi", "onaylandi", "beklemede", "beklemede"];
  for (let i = 0; i < 8; i++) {
    const gRef = gorevRefs[i % 3];
    const gSnap = await getDoc(gRef);
    const u = aktifUyeler[i % aktifUyeler.length];
    await addDoc(collection(db, "gonulluBasvurular"), {
      gorevId: gRef.id,
      gorevBaslik: gSnap.data().baslik,
      kullaniciId: u.uid,
      kullaniciAdi: u.adSoyad,
      basvuruTarihi: gun(-5 + i),
      durum: gbDurum[i % gbDurum.length],
      dernekId: DERNEK_ID,
    });
  }

  console.log("Envanter…");
  // ── Envanter + zimmet ──────────────────────────────────────────────────────
  const envRefs = [];
  for (const e of [
    { ad: "Projeksiyon", kategori: "Teknik", toplamAdet: 2, musaitAdet: 1, durum: "kullanilabilir" },
    { ad: "Catan oyun kutusu", kategori: "Oyun", toplamAdet: 6, musaitAdet: 5, durum: "kullanilabilir" },
    { ad: "Hoparlör", kategori: "Teknik", toplamAdet: 2, musaitAdet: 0, durum: "bakim" },
    { ad: "Zar seti", kategori: "Oyun", toplamAdet: 20, musaitAdet: 18, durum: "kullanilabilir" },
    { ad: "Tripod", kategori: "Teknik", toplamAdet: 1, musaitAdet: 0, durum: "kullanilabilir" },
    { ad: "Katlanır masa", kategori: "Mobilya", toplamAdet: 8, musaitAdet: 6, durum: "kullanilabilir" },
  ]) {
    envRefs.push(
      await addDoc(collection(db, "envanterler"), {
        ...e,
        lokasyon: "Depo",
        olusturulmaTarihi: gun(-90),
        dernekId: DERNEK_ID,
      }),
    );
  }
  for (let i = 0; i < 4; i++) {
    const eRef = envRefs[i];
    const eSnap = await getDoc(eRef);
    const u = aktifUyeler[i];
    const aktif = i < 3;
    await addDoc(collection(db, "envanterZimmetler"), {
      envanterId: eRef.id,
      envanterAd: eSnap.data().ad,
      kullaniciId: u.uid,
      kullaniciAdi: u.adSoyad,
      zimmetTarihi: gun(-7 - i),
      planlananIade: gun(7),
      ...(aktif ? {} : { gercekIadeTarihi: gun(-1), durum: "iade_edildi" }),
      durum: aktif ? "aktif" : "iade_edildi",
      dernekId: DERNEK_ID,
    });
    if (aktif) {
      const musait = Math.max(0, (eSnap.data().musaitAdet || 1) - 1);
      await updateDoc(eRef, { musaitAdet: musait });
    }
  }

  await updateDoc(dernekRef, { ybsModuleSeedAt: iso });

  console.log("\n✓ YBS dernek modül seed tamamlandı.");
  console.log("  Dernek:", dernek.ad, `(slug: ${SLUG})`);
  console.log("  Demo üye sayısı:", members.length);
  console.log("  Tüm üyelerin şifresi:", MEMBER_PASS);
  console.log("  E-posta örneği: ybs.01@" + EMAIL_DOMAIN);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
