import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { dernekGetir } from '../services/dernek';
import {
  gecikmisAidatlariYukle,
  gecikmisOduncleriYukle,
  hatirlatmaBildirimiGonder,
  topluHatirlatmaGonder,
} from '../services/notifications';
import { dernekPaketAktif } from '../utils/paketler';
import type { FeaturePaketId, GecikmisAidatKayit, GecikmisOduncKayit } from '../types';

const AY_ADLARI = ['', 'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];

function hatirlatmaEtiketi(iso?: string) {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleString('tr-TR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

export default function RemindersPage() {
  const { seciliDernekId, seciliDernekAd, firebaseUser } = useAuth();
  const [paketler, setPaketler] = useState<FeaturePaketId[] | undefined>();
  const [oduncler, setOduncler] = useState<GecikmisOduncKayit[]>([]);
  const [aidatlar, setAidatlar] = useState<GecikmisAidatKayit[]>([]);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [hata, setHata] = useState('');
  const [mesaj, setMesaj] = useState('');
  const [gonderiliyor, setGonderiliyor] = useState<string | null>(null);
  const [topluGonderiliyor, setTopluGonderiliyor] = useState<'odunc' | 'aidat' | null>(null);

  const p = (id: FeaturePaketId) => dernekPaketAktif(paketler, id);
  const adminAdi = firebaseUser?.email ?? 'Yönetici';

  const yukle = useCallback(async () => {
    if (!seciliDernekId) return;
    setYukleniyor(true);
    setHata('');
    setMesaj('');
    try {
      const dernek = await dernekGetir(seciliDernekId);
      setPaketler(dernek?.paketler);
      const [o, a] = await Promise.all([
        dernekPaketAktif(dernek?.paketler, 'kutuphane')
          ? gecikmisOduncleriYukle(seciliDernekId)
          : Promise.resolve([]),
        dernekPaketAktif(dernek?.paketler, 'aidat')
          ? gecikmisAidatlariYukle(seciliDernekId)
          : Promise.resolve([]),
      ]);
      setOduncler(o);
      setAidatlar(a);
    } catch {
      setHata('Gecikmiş kayıtlar yüklenemedi.');
    } finally {
      setYukleniyor(false);
    }
  }, [seciliDernekId]);

  useEffect(() => { void yukle(); }, [yukle]);

  const tekGonder = async (
    tur: 'odunc_gecikme' | 'aidat_gecikme',
    kayit: GecikmisOduncKayit | GecikmisAidatKayit,
  ) => {
    if (!seciliDernekId || !firebaseUser) return;
    setGonderiliyor(kayit.id);
    setMesaj('');
    setHata('');
    try {
      await hatirlatmaBildirimiGonder({
        dernekId: seciliDernekId,
        tur,
        kayit,
        adminId: firebaseUser.uid,
        adminAdi,
      });
      setMesaj(`${kayit.kullaniciAdi} için bildirim gönderildi.`);
      await yukle();
    } catch {
      setHata('Bildirim gönderilemedi. Firestore kurallarını kontrol edin.');
    } finally {
      setGonderiliyor(null);
    }
  };

  const topluGonder = async (tur: 'odunc_gecikme' | 'aidat_gecikme') => {
    if (!seciliDernekId || !firebaseUser) return;
    const kayitlar = tur === 'odunc_gecikme' ? oduncler : aidatlar;
    if (!kayitlar.length) return;
    if (!window.confirm(`${kayitlar.length} kişiye hatırlatma bildirimi gönderilsin mi?`)) return;

    setTopluGonderiliyor(tur === 'odunc_gecikme' ? 'odunc' : 'aidat');
    setMesaj('');
    setHata('');
    try {
      const sonuc = await topluHatirlatmaGonder({
        dernekId: seciliDernekId,
        tur,
        kayitlar,
        adminId: firebaseUser.uid,
        adminAdi,
      });
      setMesaj(`${sonuc.basarili} bildirim gönderildi${sonuc.hatali ? `, ${sonuc.hatali} hata` : ''}.`);
      await yukle();
    } catch {
      setHata('Toplu bildirim gönderilemedi.');
    } finally {
      setTopluGonderiliyor(null);
    }
  };

  if (!seciliDernekId) {
    return <p style={{ color: 'var(--muted)', padding: 32 }}>Lütfen bir dernek seçin.</p>;
  }

  const modulYok = !p('kutuphane') && !p('aidat');

  return (
    <div style={{ padding: '28px 32px', maxWidth: 1200, margin: '0 auto' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800 }}>Hatırlatmalar</h1>
          <p style={{ color: 'var(--muted)', fontSize: 14, marginTop: 4 }}>
            {seciliDernekAd} — gecikmiş kitap iade ve aidat ödemeleri için üyelere bildirim gönderin
          </p>
        </div>
        <button type="button" className="btn btn-ghost" onClick={() => void yukle()} disabled={yukleniyor}>
          ↻ Yenile
        </button>
      </header>

      <div className="alert-banner alert-info" style={{ marginBottom: 20 }}>
        <span style={{ fontSize: 18 }} aria-hidden>📱</span>
        <span style={{ color: 'var(--text-dim)', lineHeight: 1.45 }}>
          Bildirimler mobil uygulamada görünür. Üyeler uygulamayı açık tutuyorsa anlık bildirim alır; ayrıca uygulama içinde hatırlatma kaydı oluşturulur.
        </span>
      </div>

      {mesaj && <div className="alert-banner alert-warn" style={{ marginBottom: 16 }}>{mesaj}</div>}
      {hata && <div className="alert-banner alert-danger" style={{ marginBottom: 16 }}>{hata}</div>}

      {yukleniyor ? (
        <p style={{ color: 'var(--muted)' }}>Yükleniyor…</p>
      ) : modulYok ? (
        <div className="card" style={{ padding: 24, textAlign: 'center' }}>
          <p style={{ color: 'var(--muted)' }}>Hatırlatma göndermek için Kütüphane veya Aidat modülünün açık olması gerekir.</p>
          <a href="/moduller" className="btn btn-primary" style={{ marginTop: 14, fontSize: 13 }}>Modülleri yapılandır →</a>
        </div>
      ) : (
        <>
          {p('kutuphane') && (
            <section className="card fade-up" style={{ marginBottom: 20, padding: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
                <div>
                  <h2 style={{ fontSize: 16, fontWeight: 700 }}>📚 Gecikmiş kitap iadeleri</h2>
                  <p style={{ fontSize: 13, color: 'var(--muted)', marginTop: 4 }}>{oduncler.length} kayıt</p>
                </div>
                {oduncler.length > 0 && (
                  <button
                    type="button"
                    className="btn btn-primary"
                    style={{ fontSize: 13 }}
                    disabled={topluGonderiliyor === 'odunc'}
                    onClick={() => void topluGonder('odunc_gecikme')}
                  >
                    {topluGonderiliyor === 'odunc' ? 'Gönderiliyor…' : 'Tümüne bildirim gönder'}
                  </button>
                )}
              </div>
              {oduncler.length === 0 ? (
                <p style={{ color: 'var(--muted)', fontSize: 14 }}>Gecikmiş ödünç kaydı yok.</p>
              ) : (
                <KayitTablosu
                  basliklar={['Üye', 'Kitap', 'Son iade', 'Son hatırlatma', '']}
                  satirlar={oduncler.map((k) => ({
                    id: k.id,
                    hucreler: [
                      k.kullaniciAdi,
                      k.kitapBaslik,
                      k.iadeTarihi,
                      hatirlatmaEtiketi(k.sonHatirlatmaTarihi) ?? '—',
                    ],
                    gonderiliyor: gonderiliyor === k.id,
                    onGonder: () => void tekGonder('odunc_gecikme', k),
                  }))}
                />
              )}
            </section>
          )}

          {p('aidat') && (
            <section className="card fade-up" style={{ padding: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
                <div>
                  <h2 style={{ fontSize: 16, fontWeight: 700 }}>💳 Gecikmiş aidat ödemeleri</h2>
                  <p style={{ fontSize: 13, color: 'var(--muted)', marginTop: 4 }}>{aidatlar.length} kayıt</p>
                </div>
                {aidatlar.length > 0 && (
                  <button
                    type="button"
                    className="btn btn-primary"
                    style={{ fontSize: 13 }}
                    disabled={topluGonderiliyor === 'aidat'}
                    onClick={() => void topluGonder('aidat_gecikme')}
                  >
                    {topluGonderiliyor === 'aidat' ? 'Gönderiliyor…' : 'Tümüne bildirim gönder'}
                  </button>
                )}
              </div>
              {aidatlar.length === 0 ? (
                <p style={{ color: 'var(--muted)', fontSize: 14 }}>Son ödeme tarihi geçmiş aidat kaydı yok.</p>
              ) : (
                <KayitTablosu
                  basliklar={['Üye', 'Dönem', 'Tutar', 'Son ödeme', 'Son hatırlatma', '']}
                  satirlar={aidatlar.map((k) => ({
                    id: k.id,
                    hucreler: [
                      k.kullaniciAdi,
                      `${AY_ADLARI[k.ay] ?? k.ay} ${k.yil}`,
                      `${k.miktar} ₺`,
                      k.sonOdemeTarihi,
                      hatirlatmaEtiketi(k.sonHatirlatmaTarihi) ?? '—',
                    ],
                    gonderiliyor: gonderiliyor === k.id,
                    onGonder: () => void tekGonder('aidat_gecikme', k),
                  }))}
                />
              )}
            </section>
          )}
        </>
      )}
    </div>
  );
}

function KayitTablosu({
  basliklar,
  satirlar,
}: {
  basliklar: string[];
  satirlar: {
    id: string;
    hucreler: (string | null)[];
    gonderiliyor: boolean;
    onGonder: () => void;
  }[];
}) {
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
        <thead>
          <tr style={{ borderBottom: '1px solid var(--border)' }}>
            {basliklar.map((h) => (
              <th
                key={h}
                style={{
                  textAlign: 'left', padding: '10px 12px', color: 'var(--muted)',
                  fontWeight: 600, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.5px',
                }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {satirlar.map((s) => (
            <tr key={s.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
              {s.hucreler.map((hucre, i) => (
                <td key={i} style={{ padding: '12px', color: i === 0 ? 'var(--text)' : 'var(--text-dim)' }}>
                  {i === 0 ? <strong>{hucre}</strong> : hucre}
                </td>
              ))}
              <td style={{ padding: '12px', textAlign: 'right' }}>
                <button
                  type="button"
                  className="btn btn-ghost"
                  style={{ fontSize: 12, padding: '6px 12px', whiteSpace: 'nowrap' }}
                  disabled={s.gonderiliyor}
                  onClick={s.onGonder}
                >
                  {s.gonderiliyor ? '…' : '🔔 Bildirim gönder'}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
