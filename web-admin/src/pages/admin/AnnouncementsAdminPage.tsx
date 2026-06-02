import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { AdminPageLayout, ActionRow, CardList, Field, FormGrid } from '../../components/admin/AdminPageLayout';
import { useDernekPaketler } from '../../hooks/useDernekPaketler';
import { duyuruEkle, duyuruGuncelle, duyuruSil, duyurulariYukle, type DuyuruRow } from '../../services/moduleOperations';

export default function AnnouncementsAdminPage() {
  const { firebaseUser } = useAuth();
  const { seciliDernekId, seciliDernekAd, paketler } = useDernekPaketler();
  const [liste, setListe] = useState<DuyuruRow[]>([]);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [form, setForm] = useState({ baslik: '', icerik: '' });
  const [duzenle, setDuzenle] = useState<DuyuruRow | null>(null);

  const yukle = useCallback(async () => {
    if (!seciliDernekId) return;
    setYukleniyor(true);
    try { setListe(await duyurulariYukle(seciliDernekId)); } finally { setYukleniyor(false); }
  }, [seciliDernekId]);

  useEffect(() => { void yukle(); }, [yukle]);

  const yayinla = async () => {
    if (!seciliDernekId || !firebaseUser || !form.baslik.trim()) return;
    await duyuruEkle(seciliDernekId, firebaseUser.uid, firebaseUser.email ?? 'Yönetici', form.baslik.trim(), form.icerik.trim());
    setForm({ baslik: '', icerik: '' });
    await yukle();
  };

  return (
    <AdminPageLayout title="Duyuru yönetimi" sub={seciliDernekAd ?? ''} paket="duyurular" paketler={paketler} yukleniyor={yukleniyor} onRefresh={yukle}>
      <FormGrid>
        <Field label="Başlık"><input className="input" value={form.baslik} onChange={(e) => setForm({ ...form, baslik: e.target.value })} /></Field>
        <Field label="İçerik"><textarea className="input" rows={4} value={form.icerik} onChange={(e) => setForm({ ...form, icerik: e.target.value })} /></Field>
        <button type="button" className="btn btn-primary" style={{ alignSelf: 'flex-start' }} onClick={() => void yayinla()}>Duyuru yayınla</button>
      </FormGrid>
      <CardList items={liste} render={(d: DuyuruRow) => (
        duzenle?.id === d.id ? (
          <>
            <input className="input" value={duzenle.baslik} onChange={(e) => setDuzenle({ ...duzenle, baslik: e.target.value })} />
            <textarea className="input" rows={3} value={duzenle.icerik} onChange={(e) => setDuzenle({ ...duzenle, icerik: e.target.value })} />
            <ActionRow>
              <button type="button" className="btn btn-primary" style={{ fontSize: 12 }} onClick={() => void duyuruGuncelle(d.id, duzenle.baslik, duzenle.icerik).then(() => { setDuzenle(null); return yukle(); })}>Kaydet</button>
              <button type="button" className="btn btn-ghost" style={{ fontSize: 12 }} onClick={() => setDuzenle(null)}>Vazgeç</button>
            </ActionRow>
          </>
        ) : (
          <>
            <div style={{ fontWeight: 700 }}>{d.baslik}</div>
            <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>{new Date(d.olusturulmaTarihi).toLocaleString('tr-TR')} · {d.olusturanAdi}</div>
            <p style={{ fontSize: 14, color: 'var(--text-dim)', marginTop: 8, whiteSpace: 'pre-wrap' }}>{d.icerik}</p>
            <ActionRow>
              <button type="button" className="btn btn-ghost" style={{ fontSize: 12 }} onClick={() => setDuzenle({ ...d })}>Düzenle</button>
              <button type="button" className="btn btn-ghost" style={{ fontSize: 12, color: 'var(--red)' }} onClick={() => window.confirm('Silinsin mi?') && void duyuruSil(d.id).then(yukle)}>Sil</button>
            </ActionRow>
          </>
        )
      )} />
    </AdminPageLayout>
  );
}
