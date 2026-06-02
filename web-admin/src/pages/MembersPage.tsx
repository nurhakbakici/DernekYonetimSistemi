import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  dernekUyeleriniYukle, uyeRolunuGuncelle, uyeDurumunuGuncelle,
  type UyeBilgi,
} from '../services/operations';


export default function MembersPage() {
  const { seciliDernekId, seciliDernekAd, firebaseUser } = useAuth();
  const [uyeler, setUyeler] = useState<UyeBilgi[]>([]);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [islemHata, setIslemHata] = useState<Record<string, string>>({});
  const [filtre, setFiltre] = useState<'tumu' | 'beklemede' | 'aktif' | 'aday'>('tumu');
  const [arama, setArama] = useState('');

  const yukle = async () => {
    if (!seciliDernekId) return;
    setYukleniyor(true);
    try {
      setUyeler(await dernekUyeleriniYukle(seciliDernekId));
    } finally {
      setYukleniyor(false);
    }
  };

  useEffect(() => { void yukle(); }, [seciliDernekId]);

  const guncelle = async (uyelikId: string, tip: 'rol' | 'durum', deger: string) => {
    setIslemHata((p) => ({ ...p, [uyelikId]: '' }));
    try {
      if (tip === 'rol') await uyeRolunuGuncelle(uyelikId, deger as 'admin' | 'uye' | 'aday');
      else await uyeDurumunuGuncelle(uyelikId, deger as 'aktif' | 'pasif' | 'beklemede');
      setUyeler((prev) => prev.map((u) => u.uyelikId === uyelikId
        ? { ...u, [tip === 'rol' ? 'rol' : 'uyelikDurumu']: deger }
        : u));
    } catch {
      setIslemHata((p) => ({ ...p, [uyelikId]: 'Güncelleme başarısız.' }));
    }
  };

  const gosterilen = uyeler
    .filter((u) => {
      if (filtre === 'beklemede') return u.uyelikDurumu === 'beklemede' || u.rol === 'aday';
      if (filtre === 'aktif') return u.uyelikDurumu === 'aktif';
      if (filtre === 'aday') return u.rol === 'aday';
      return true;
    })
    .filter((u) => {
      if (!arama) return true;
      const q = arama.toLowerCase();
      return `${u.ad} ${u.soyad} ${u.email}`.toLowerCase().includes(q);
    });

  const bekleyenSayisi = uyeler.filter((u) => u.uyelikDurumu === 'beklemede' || u.rol === 'aday').length;

  if (!seciliDernekId) return <p style={{ color: 'var(--muted)', padding: 32 }}>Lütfen bir dernek seçin.</p>;
  if (yukleniyor) return <p style={{ color: 'var(--muted)', padding: 32 }}>Üyeler yükleniyor…</p>;

  return (
    <div style={{ padding: '28px 32px', maxWidth: 1200, margin: '0 auto' }}>
      <header style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800 }}>Üye Yönetimi</h1>
        <p style={{ color: 'var(--muted)', fontSize: 14, marginTop: 4 }}>{seciliDernekAd} — {uyeler.length} üyelik kaydı</p>
      </header>

      {bekleyenSayisi > 0 && (
        <div className="alert-banner alert-warn" style={{ marginBottom: 20 }}>
          <span style={{ fontSize: 18 }}>👤</span>
          <strong style={{ color: 'var(--text)' }}>{bekleyenSayisi} başvuru onay bekliyor.</strong>
          <button type="button" className="btn btn-ghost" style={{ marginLeft: 'auto', fontSize: 12, padding: '6px 12px' }} onClick={() => setFiltre('beklemede')}>
            Göster
          </button>
        </div>
      )}

      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <input
          className="input"
          style={{ maxWidth: 280, flex: 1 }}
          placeholder="Ad, soyad veya e-posta ara…"
          value={arama}
          onChange={(e) => setArama(e.target.value)}
        />
        <div style={{ display: 'flex', gap: 6 }}>
          {(['tumu', 'aktif', 'beklemede', 'aday'] as const).map((f) => (
            <button
              key={f}
              type="button"
              className={`btn ${filtre === f ? 'btn-primary' : 'btn-ghost'}`}
              style={{ padding: '8px 14px', fontSize: 13 }}
              onClick={() => setFiltre(f)}
            >
              {{ tumu: 'Tümü', aktif: 'Aktif', beklemede: 'Beklemede', aday: 'Aday' }[f]}
            </button>
          ))}
        </div>
        <button type="button" className="btn btn-ghost" style={{ marginLeft: 'auto' }} onClick={yukle}>
          ↻ Yenile
        </button>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              {['Üye', 'E-posta', 'Üyelik başlangıcı', 'Rol', 'Durum', ''].map((h) => (
                <th key={h} style={{ textAlign: 'left', padding: '10px 12px', color: 'var(--muted)', fontWeight: 600, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {gosterilen.map((u) => (
              <tr key={u.uyelikId} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                <td style={{ padding: '12px' }}>
                  <div style={{ fontWeight: 600 }}>{u.ad} {u.soyad}</div>
                  {u.uid === firebaseUser?.uid && <span style={{ fontSize: 11, color: 'var(--primary-light)' }}>Sen</span>}
                </td>
                <td style={{ padding: '12px', color: 'var(--muted)', fontSize: 13 }}>{u.email}</td>
                <td style={{ padding: '12px', color: 'var(--muted)', fontSize: 13 }}>{u.uyelikBaslangic || '—'}</td>
                <td style={{ padding: '12px' }}>
                  <select
                    className="input"
                    style={{ fontSize: 12, padding: '6px 8px', width: 'auto' }}
                    value={u.rol}
                    onChange={(e) => guncelle(u.uyelikId, 'rol', e.target.value)}
                    disabled={u.uid === firebaseUser?.uid}
                  >
                    <option value="admin">Yönetici</option>
                    <option value="uye">Üye</option>
                    <option value="aday">Aday</option>
                  </select>
                </td>
                <td style={{ padding: '12px' }}>
                  <select
                    className="input"
                    style={{ fontSize: 12, padding: '6px 8px', width: 'auto' }}
                    value={u.uyelikDurumu}
                    onChange={(e) => guncelle(u.uyelikId, 'durum', e.target.value)}
                    disabled={u.uid === firebaseUser?.uid}
                  >
                    <option value="aktif">Aktif</option>
                    <option value="beklemede">Beklemede</option>
                    <option value="pasif">Pasif</option>
                  </select>
                </td>
                <td style={{ padding: '12px' }}>
                  {islemHata[u.uyelikId] && (
                    <span style={{ color: 'var(--red)', fontSize: 12 }}>{islemHata[u.uyelikId]}</span>
                  )}
                </td>
              </tr>
            ))}
            {gosterilen.length === 0 && (
              <tr>
                <td colSpan={6} style={{ padding: 24, textAlign: 'center', color: 'var(--muted)' }}>
                  Üye bulunamadı.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
