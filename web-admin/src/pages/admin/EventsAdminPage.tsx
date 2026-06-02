import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { AdminPageLayout, ActionRow, CardList, Field, FilterBar, FormGrid, StatusBadge } from '../../components/admin/AdminPageLayout';
import { useDernekPaketler } from '../../hooks/useDernekPaketler';
import { etkinlikDurumGuncelle, etkinlikEkle, etkinlikleriYukle, type EtkinlikRow } from '../../services/moduleOperations';

export default function EventsAdminPage() {
  const { firebaseUser } = useAuth();
  const { seciliDernekId, seciliDernekAd, paketler } = useDernekPaketler();
  const [liste, setListe] = useState<EtkinlikRow[]>([]);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [filtre, setFiltre] = useState('beklemede');
  const [form, setForm] = useState({ baslik: '', aciklama: '', tarih: '', konum: '' });

  const yukle = useCallback(async () => {
    if (!seciliDernekId) return;
    setYukleniyor(true);
    try { setListe(await etkinlikleriYukle(seciliDernekId)); } finally { setYukleniyor(false); }
  }, [seciliDernekId]);

  useEffect(() => { void yukle(); }, [yukle]);

  const goster = liste.filter((e) => filtre === 'tum' || e.durum === filtre);

  const ekle = async () => {
    if (!seciliDernekId || !firebaseUser || !form.baslik.trim()) return;
    await etkinlikEkle(seciliDernekId, firebaseUser.uid, firebaseUser.email ?? 'Yönetici', {
      baslik: form.baslik.trim(),
      aciklama: form.aciklama.trim(),
      tarih: form.tarih || new Date().toISOString().split('T')[0],
      konum: form.konum.trim(),
    });
    setForm({ baslik: '', aciklama: '', tarih: '', konum: '' });
    await yukle();
  };

  return (
    <AdminPageLayout title="Etkinlik yönetimi" sub={seciliDernekAd ?? ''} paket="etkinlikler" paketler={paketler} yukleniyor={yukleniyor} onRefresh={yukle}>
      <FormGrid>
        <Field label="Başlık"><input className="input" value={form.baslik} onChange={(e) => setForm({ ...form, baslik: e.target.value })} /></Field>
        <Field label="Açıklama"><textarea className="input" rows={2} value={form.aciklama} onChange={(e) => setForm({ ...form, aciklama: e.target.value })} /></Field>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Field label="Tarih"><input className="input" type="date" value={form.tarih} onChange={(e) => setForm({ ...form, tarih: e.target.value })} /></Field>
          <Field label="Konum"><input className="input" value={form.konum} onChange={(e) => setForm({ ...form, konum: e.target.value })} /></Field>
        </div>
        <button type="button" className="btn btn-primary" style={{ alignSelf: 'flex-start' }} onClick={() => void ekle()}>Etkinlik ekle (onaylı)</button>
      </FormGrid>
      <FilterBar value={filtre} onChange={setFiltre} options={[
        { id: 'beklemede', label: 'Onay bekleyen' }, { id: 'onaylandi', label: 'Onaylı' },
        { id: 'iptal', label: 'İptal' }, { id: 'tum', label: 'Tümü' },
      ]} />
      <CardList items={goster} render={(e: EtkinlikRow) => (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
            <div><div style={{ fontWeight: 700 }}>{e.baslik}</div><div style={{ fontSize: 13, color: 'var(--muted)' }}>{e.organizator}</div></div>
            <StatusBadge durum={e.durum === 'iptal' ? 'iptal' : e.durum} />
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-dim)', marginTop: 6 }}>{e.tarih} · {e.konum} · {e.katilimcilar.length} katılımcı</div>
          {e.durum === 'beklemede' && (
            <ActionRow>
              <button type="button" className="btn btn-primary" style={{ fontSize: 12 }} onClick={() => void etkinlikDurumGuncelle(e.id, 'onaylandi').then(yukle)}>Onayla</button>
              <button type="button" className="btn btn-ghost" style={{ fontSize: 12 }} onClick={() => void etkinlikDurumGuncelle(e.id, 'iptal').then(yukle)}>İptal</button>
            </ActionRow>
          )}
          {e.durum === 'onaylandi' && (
            <ActionRow>
              <button type="button" className="btn btn-ghost" style={{ fontSize: 12 }} onClick={() => void etkinlikDurumGuncelle(e.id, 'iptal').then(yukle)}>İptal et</button>
            </ActionRow>
          )}
        </>
      )} />
    </AdminPageLayout>
  );
}
