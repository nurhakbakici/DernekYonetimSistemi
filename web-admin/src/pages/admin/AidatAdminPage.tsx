import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { AdminPageLayout, ActionRow, CardList, Field, FilterBar, FormGrid, StatusBadge } from '../../components/admin/AdminPageLayout';
import { useDernekPaketler } from '../../hooks/useDernekPaketler';
import { dernekGetir } from '../../services/dernek';
import {
  aidatAylikMiktarGuncelle, aidatManuelOde, aidatOnayla, aidatReddet, aidatlariYukle, type AidatRow,
} from '../../services/moduleOperations';

const AY = ['', 'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];

export default function AidatAdminPage() {
  const { firebaseUser } = useAuth();
  const { seciliDernekId, seciliDernekAd, paketler } = useDernekPaketler();
  const [liste, setListe] = useState<AidatRow[]>([]);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [filtre, setFiltre] = useState('dekont');
  const [aylikMiktar, setAylikMiktar] = useState('300');
  const [redId, setRedId] = useState<string | null>(null);
  const [redMetin, setRedMetin] = useState('');

  const yukle = useCallback(async () => {
    if (!seciliDernekId) return;
    setYukleniyor(true);
    try {
      const [a, d] = await Promise.all([aidatlariYukle(seciliDernekId), dernekGetir(seciliDernekId)]);
      setListe(a);
      if (d?.aidatAylikMiktar) setAylikMiktar(String(d.aidatAylikMiktar));
    } finally { setYukleniyor(false); }
  }, [seciliDernekId]);

  useEffect(() => { void yukle(); }, [yukle]);

  const goster = liste.filter((a) => {
    if (filtre === 'dekont') return Boolean(a.dekontUri) && !a.odendi;
    if (filtre === 'odenmemis') return !a.odendi;
    if (filtre === 'odenmis') return a.odendi;
    return true;
  });

  const adminAdi = firebaseUser?.email ?? 'Yönetici';

  return (
    <AdminPageLayout title="Aidat yönetimi" sub={seciliDernekAd ?? ''} paket="aidat" paketler={paketler} yukleniyor={yukleniyor} onRefresh={yukle}>
      <FormGrid>
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <Field label="Aylık aidat tutarı (₺)">
            <input className="input" type="number" style={{ maxWidth: 160 }} value={aylikMiktar} onChange={(e) => setAylikMiktar(e.target.value)} />
          </Field>
          <button type="button" className="btn btn-primary" style={{ fontSize: 13 }} onClick={() => seciliDernekId && void aidatAylikMiktarGuncelle(seciliDernekId, Number(aylikMiktar)).then(yukle)}>Kaydet</button>
        </div>
      </FormGrid>
      <FilterBar value={filtre} onChange={setFiltre} options={[
        { id: 'dekont', label: 'Dekont bekleyen' }, { id: 'odenmemis', label: 'Ödenmemiş' },
        { id: 'odenmis', label: 'Ödenmiş' }, { id: 'tum', label: 'Tümü' },
      ]} />
      <CardList items={goster} render={(a: AidatRow) => (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
            <div><div style={{ fontWeight: 700 }}>{a.kullaniciAdi}</div><div style={{ fontSize: 13, color: 'var(--muted)' }}>{AY[a.ay]} {a.yil} · {a.miktar} ₺</div></div>
            <StatusBadge durum={a.odendi ? 'onaylandi' : 'beklemede'} />
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-dim)', marginTop: 6 }}>Son ödeme: {a.sonOdemeTarihi}</div>
          {a.redAciklamasi && <div style={{ fontSize: 12, color: 'var(--red)', marginTop: 6 }}>Red: {a.redAciklamasi}</div>}
          {a.dekontUri && (
            <div style={{ marginTop: 8 }}>
              <a href={a.dekontUri} target="_blank" rel="noreferrer" className="btn btn-ghost" style={{ fontSize: 12 }}>Dekontu görüntüle</a>
            </div>
          )}
          {!a.odendi && (
            <ActionRow>
              {a.dekontUri && firebaseUser && (
                <>
                  <button type="button" className="btn btn-primary" style={{ fontSize: 12 }} onClick={() => void aidatOnayla(a.id, firebaseUser.uid, adminAdi).then(yukle)}>Dekontu onayla</button>
                  <button type="button" className="btn btn-ghost" style={{ fontSize: 12 }} onClick={() => { setRedId(a.id); setRedMetin(''); }}>Reddet</button>
                </>
              )}
              <button type="button" className="btn btn-ghost" style={{ fontSize: 12 }} onClick={() => void aidatManuelOde(a.id).then(yukle)}>Manuel ödendi</button>
            </ActionRow>
          )}
        </>
      )} />
      {redId && (
        <div className="card" style={{ position: 'fixed', inset: 0, margin: 'auto', maxWidth: 420, height: 'fit-content', padding: 24, zIndex: 100, boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }}>
          <h3 style={{ marginBottom: 12 }}>Dekont reddi</h3>
          <textarea className="input" rows={3} value={redMetin} onChange={(e) => setRedMetin(e.target.value)} placeholder="Red gerekçesi" />
          <ActionRow>
            <button type="button" className="btn btn-primary" style={{ fontSize: 13 }} onClick={() => void aidatReddet(redId, redMetin).then(() => { setRedId(null); return yukle(); })}>Reddet</button>
            <button type="button" className="btn btn-ghost" style={{ fontSize: 13 }} onClick={() => setRedId(null)}>Vazgeç</button>
          </ActionRow>
        </div>
      )}
    </AdminPageLayout>
  );
}
