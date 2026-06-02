import { useCallback, useEffect, useState } from 'react';
import { AdminPageLayout, ActionRow, CardList, Field, FormGrid, StatusBadge } from '../../components/admin/AdminPageLayout';
import { useDernekPaketler } from '../../hooks/useDernekPaketler';
import { odaEkle, odaGuncelle, odalariYukle, type OdaRow } from '../../services/moduleOperations';

export default function RoomsAdminPage() {
  const { seciliDernekId, seciliDernekAd, paketler } = useDernekPaketler();
  const [liste, setListe] = useState<OdaRow[]>([]);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [form, setForm] = useState({ ad: '', aciklama: '', kapasite: '10', ozellik: '' });
  const [ozellikler, setOzellikler] = useState<string[]>([]);

  const yukle = useCallback(async () => {
    if (!seciliDernekId) return;
    setYukleniyor(true);
    try { setListe(await odalariYukle(seciliDernekId)); } finally { setYukleniyor(false); }
  }, [seciliDernekId]);

  useEffect(() => { void yukle(); }, [yukle]);

  const ekle = async () => {
    if (!seciliDernekId || !form.ad.trim()) return;
    await odaEkle(seciliDernekId, {
      ad: form.ad.trim(),
      aciklama: form.aciklama.trim(),
      kapasite: Number(form.kapasite) || 1,
      ozellikler,
    });
    setForm({ ad: '', aciklama: '', kapasite: '10', ozellik: '' });
    setOzellikler([]);
    await yukle();
  };

  return (
    <AdminPageLayout title="Oda yönetimi" sub={seciliDernekAd ?? ''} paket="odalar" paketler={paketler} yukleniyor={yukleniyor} onRefresh={yukle}>
      <FormGrid>
        <Field label="Oda adı"><input className="input" value={form.ad} onChange={(e) => setForm({ ...form, ad: e.target.value })} /></Field>
        <Field label="Açıklama"><textarea className="input" rows={2} value={form.aciklama} onChange={(e) => setForm({ ...form, aciklama: e.target.value })} /></Field>
        <Field label="Kapasite"><input className="input" type="number" style={{ maxWidth: 120 }} value={form.kapasite} onChange={(e) => setForm({ ...form, kapasite: e.target.value })} /></Field>
        <div style={{ display: 'flex', gap: 8 }}>
          <input className="input" placeholder="Özellik ekle (WiFi…)" value={form.ozellik} onChange={(e) => setForm({ ...form, ozellik: e.target.value })} />
          <button type="button" className="btn btn-ghost" onClick={() => { if (form.ozellik.trim()) { setOzellikler([...ozellikler, form.ozellik.trim()]); setForm({ ...form, ozellik: '' }); } }}>+</button>
        </div>
        {ozellikler.length > 0 && <div style={{ fontSize: 12, color: 'var(--muted)' }}>{ozellikler.join(', ')}</div>}
        <button type="button" className="btn btn-primary" style={{ alignSelf: 'flex-start' }} onClick={() => void ekle()}>Oda ekle</button>
      </FormGrid>
      <CardList items={liste} render={(o: OdaRow) => (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}><strong>{o.ad}</strong><StatusBadge durum={o.aktif ? 'aktif' : 'kapali'} /></div>
          <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 6 }}>Kapasite: {o.kapasite} · {o.aciklama}</div>
          <ActionRow>
            <button type="button" className="btn btn-ghost" style={{ fontSize: 12 }} onClick={() => void odaGuncelle(o.id, { aktif: !o.aktif }).then(yukle)}>
              {o.aktif ? 'Pasifleştir' : 'Aktifleştir'}
            </button>
          </ActionRow>
        </>
      )} />
    </AdminPageLayout>
  );
}
