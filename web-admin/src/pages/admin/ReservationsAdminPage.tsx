import { useCallback, useEffect, useState } from 'react';
import { AdminPageLayout, ActionRow, CardList, FilterBar, StatusBadge } from '../../components/admin/AdminPageLayout';
import { useDernekPaketler } from '../../hooks/useDernekPaketler';
import { rezervasyonDurumGuncelle, rezervasyonlariYukle, type RezervasyonRow } from '../../services/moduleOperations';

export default function ReservationsAdminPage() {
  const { seciliDernekId, seciliDernekAd, paketler } = useDernekPaketler();
  const [liste, setListe] = useState<RezervasyonRow[]>([]);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [filtre, setFiltre] = useState('beklemede');

  const yukle = useCallback(async () => {
    if (!seciliDernekId) return;
    setYukleniyor(true);
    try { setListe(await rezervasyonlariYukle(seciliDernekId)); } finally { setYukleniyor(false); }
  }, [seciliDernekId]);

  useEffect(() => { void yukle(); }, [yukle]);

  const goster = liste.filter((r) => filtre === 'tum' || r.durum === filtre);

  const guncelle = async (id: string, durum: 'onaylandi' | 'iptal') => {
    await rezervasyonDurumGuncelle(id, durum);
    await yukle();
  };

  return (
    <AdminPageLayout title="Rezervasyon yönetimi" sub={seciliDernekAd ?? ''} paket="odalar" paketler={paketler} yukleniyor={yukleniyor} onRefresh={yukle}>
      <FilterBar value={filtre} onChange={setFiltre} options={[
        { id: 'beklemede', label: 'Bekleyen' }, { id: 'onaylandi', label: 'Onaylı' },
        { id: 'iptal', label: 'İptal' }, { id: 'tum', label: 'Tümü' },
      ]} />
      <CardList items={goster} render={(r: RezervasyonRow) => (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontWeight: 700 }}>{r.odaAdi}</div>
              <div style={{ fontSize: 13, color: 'var(--muted)' }}>{r.kullaniciAdi}</div>
            </div>
            <StatusBadge durum={r.durum} />
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-dim)', marginTop: 8, lineHeight: 1.5 }}>
            {r.tarih} · {r.baslangicSaati}–{r.bitisSaati}<br />{r.amac}
          </div>
          {r.durum === 'beklemede' && (
            <ActionRow>
              <button type="button" className="btn btn-primary" style={{ fontSize: 12 }} onClick={() => void guncelle(r.id, 'onaylandi')}>Onayla</button>
              <button type="button" className="btn btn-ghost" style={{ fontSize: 12 }} onClick={() => void guncelle(r.id, 'iptal')}>İptal</button>
            </ActionRow>
          )}
        </>
      )} />
    </AdminPageLayout>
  );
}
