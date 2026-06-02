import { useCallback, useEffect, useState } from 'react';
import { AdminPageLayout, ActionRow, CardList, Field, FormGrid } from '../../components/admin/AdminPageLayout';
import { useDernekPaketler } from '../../hooks/useDernekPaketler';
import { kitapEkle, kitapGuncelle, kitapSil, kitaplariYukle, type KitapRow } from '../../services/moduleOperations';

const KATEGORILER = ['RPG', 'Strateji', 'Kooperatif', 'Bulmaca', 'Diğer'];

export default function LibraryAdminPage() {
  const { seciliDernekId, seciliDernekAd, paketler } = useDernekPaketler();
  const [liste, setListe] = useState<KitapRow[]>([]);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [form, setForm] = useState({ baslik: '', yazar: '', kategori: 'RPG', adet: '1' });
  const [duzenle, setDuzenle] = useState<KitapRow | null>(null);

  const yukle = useCallback(async () => {
    if (!seciliDernekId) return;
    setYukleniyor(true);
    try { setListe(await kitaplariYukle(seciliDernekId)); } finally { setYukleniyor(false); }
  }, [seciliDernekId]);

  useEffect(() => { void yukle(); }, [yukle]);

  const ekle = async () => {
    if (!seciliDernekId || !form.baslik.trim() || !form.yazar.trim()) return;
    const adet = Number(form.adet) || 1;
    await kitapEkle(seciliDernekId, { baslik: form.baslik.trim(), yazar: form.yazar.trim(), kategori: form.kategori, toplamAdet: adet });
    setForm({ baslik: '', yazar: '', kategori: 'RPG', adet: '1' });
    await yukle();
  };

  const kaydet = async () => {
    if (!duzenle) return;
    await kitapGuncelle(duzenle.id, {
      baslik: duzenle.baslik,
      yazar: duzenle.yazar,
      kategori: duzenle.kategori,
      toplamAdet: duzenle.toplamAdet,
    });
    setDuzenle(null);
    await yukle();
  };

  return (
    <AdminPageLayout title="Kütüphane yönetimi" sub={seciliDernekAd ?? ''} paket="kutuphane" paketler={paketler} yukleniyor={yukleniyor} onRefresh={yukle}>
      <FormGrid>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 2fr 1fr 80px', gap: 12 }}>
          <Field label="Başlık"><input className="input" value={form.baslik} onChange={(e) => setForm({ ...form, baslik: e.target.value })} /></Field>
          <Field label="Yazar"><input className="input" value={form.yazar} onChange={(e) => setForm({ ...form, yazar: e.target.value })} /></Field>
          <Field label="Kategori">
            <select className="input" value={form.kategori} onChange={(e) => setForm({ ...form, kategori: e.target.value })}>
              {KATEGORILER.map((k) => <option key={k} value={k}>{k}</option>)}
            </select>
          </Field>
          <Field label="Adet"><input className="input" type="number" value={form.adet} onChange={(e) => setForm({ ...form, adet: e.target.value })} /></Field>
        </div>
        <button type="button" className="btn btn-primary" style={{ alignSelf: 'flex-start' }} onClick={() => void ekle()}>Kitap ekle</button>
      </FormGrid>
      <CardList items={liste} render={(k: KitapRow) => (
        duzenle?.id === k.id ? (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <input className="input" value={duzenle.baslik} onChange={(e) => setDuzenle({ ...duzenle, baslik: e.target.value })} />
              <input className="input" value={duzenle.yazar} onChange={(e) => setDuzenle({ ...duzenle, yazar: e.target.value })} />
            </div>
            <ActionRow>
              <button type="button" className="btn btn-primary" style={{ fontSize: 12 }} onClick={() => void kaydet()}>Kaydet</button>
              <button type="button" className="btn btn-ghost" style={{ fontSize: 12 }} onClick={() => setDuzenle(null)}>Vazgeç</button>
            </ActionRow>
          </>
        ) : (
          <>
            <div style={{ fontWeight: 700 }}>{k.baslik}</div>
            <div style={{ fontSize: 13, color: 'var(--muted)' }}>{k.yazar} · {k.kategori} · {k.musaitAdet}/{k.toplamAdet} müsait</div>
            <ActionRow>
              <button type="button" className="btn btn-ghost" style={{ fontSize: 12 }} onClick={() => setDuzenle({ ...k })}>Düzenle</button>
              <button type="button" className="btn btn-ghost" style={{ fontSize: 12, color: 'var(--red)' }} onClick={() => void kitapSil(k.id).then(yukle)}>Sil</button>
            </ActionRow>
          </>
        )
      )} />
    </AdminPageLayout>
  );
}
