import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { AdminPageLayout, ActionRow, CardList, Field, FilterBar, FormGrid, StatusBadge } from '../../components/admin/AdminPageLayout';
import { useDernekPaketler } from '../../hooks/useDernekPaketler';
import {
  gonulluBasvuruKarar, gonulluBasvurulariniYukle, gonulluGorevEkle, gonulluGorevSil, gonulluGorevleriYukle,
  type GonulluBasvuruRow, type GonulluGorevRow,
} from '../../services/moduleOperations';

export default function VolunteersAdminPage() {
  const { firebaseUser } = useAuth();
  const { seciliDernekId, seciliDernekAd, paketler } = useDernekPaketler();
  const [tab, setTab] = useState<'basvuru' | 'gorev'>('basvuru');
  const [basvurular, setBasvurular] = useState<GonulluBasvuruRow[]>([]);
  const [gorevler, setGorevler] = useState<GonulluGorevRow[]>([]);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [hata, setHata] = useState('');
  const [form, setForm] = useState({ baslik: '', aciklama: '', tarih: '', kontenjan: '5', konum: '' });

  const yukle = useCallback(async () => {
    if (!seciliDernekId) return;
    setYukleniyor(true);
    try {
      const [b, g] = await Promise.all([gonulluBasvurulariniYukle(seciliDernekId), gonulluGorevleriYukle(seciliDernekId)]);
      setBasvurular(b);
      setGorevler(g);
    } finally { setYukleniyor(false); }
  }, [seciliDernekId]);

  useEffect(() => { void yukle(); }, [yukle]);

  const gorevEkle = async () => {
    if (!seciliDernekId || !firebaseUser || !form.baslik.trim()) return;
    await gonulluGorevEkle(seciliDernekId, firebaseUser.uid, firebaseUser.email ?? 'Yönetici', {
      baslik: form.baslik.trim(),
      aciklama: form.aciklama.trim(),
      tarih: form.tarih || new Date().toISOString().split('T')[0],
      kontenjan: Number(form.kontenjan) || 1,
      konum: form.konum.trim() || undefined,
    });
    setForm({ baslik: '', aciklama: '', tarih: '', kontenjan: '5', konum: '' });
    await yukle();
  };

  return (
    <AdminPageLayout title="Gönüllülük yönetimi" sub={seciliDernekAd ?? ''} paket="gonulluluk" paketler={paketler} yukleniyor={yukleniyor} onRefresh={yukle}>
      {hata && <div className="alert-banner alert-danger" style={{ marginBottom: 16 }}>{hata}</div>}
      <FilterBar value={tab} onChange={(v) => setTab(v as 'basvuru' | 'gorev')} options={[
        { id: 'basvuru', label: 'Başvurular' }, { id: 'gorev', label: 'Görevler' },
      ]} />
      {tab === 'gorev' ? (
        <>
          <FormGrid>
            <Field label="Görev başlığı"><input className="input" value={form.baslik} onChange={(e) => setForm({ ...form, baslik: e.target.value })} /></Field>
            <Field label="Açıklama"><textarea className="input" rows={2} value={form.aciklama} onChange={(e) => setForm({ ...form, aciklama: e.target.value })} /></Field>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
              <Field label="Tarih"><input className="input" type="date" value={form.tarih} onChange={(e) => setForm({ ...form, tarih: e.target.value })} /></Field>
              <Field label="Kontenjan"><input className="input" type="number" value={form.kontenjan} onChange={(e) => setForm({ ...form, kontenjan: e.target.value })} /></Field>
              <Field label="Konum"><input className="input" value={form.konum} onChange={(e) => setForm({ ...form, konum: e.target.value })} /></Field>
            </div>
            <button type="button" className="btn btn-primary" style={{ alignSelf: 'flex-start' }} onClick={() => void gorevEkle()}>Görev ekle</button>
          </FormGrid>
          <CardList items={gorevler} render={(g: GonulluGorevRow) => (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><strong>{g.baslik}</strong><StatusBadge durum={g.durum} /></div>
              <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 6 }}>{g.tarih} · Kontenjan: {g.kontenjan}</div>
              <ActionRow><button type="button" className="btn btn-ghost" style={{ fontSize: 12, color: 'var(--red)' }} onClick={() => void gonulluGorevSil(g.id).then(yukle)}>Sil</button></ActionRow>
            </>
          )} />
        </>
      ) : (
        <CardList items={basvurular} render={(b: GonulluBasvuruRow) => (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><div><div style={{ fontWeight: 700 }}>{b.kullaniciAdi}</div><div style={{ fontSize: 13, color: 'var(--muted)' }}>{b.gorevBaslik}</div></div><StatusBadge durum={b.durum} /></div>
            {b.durum === 'beklemede' && seciliDernekId && (
              <ActionRow>
                <button type="button" className="btn btn-primary" style={{ fontSize: 12 }} onClick={async () => {
                  setHata('');
                  try { await gonulluBasvuruKarar(b.id, 'onaylandi', b.gorevId, seciliDernekId); await yukle(); }
                  catch (e) { setHata(e instanceof Error ? e.message : 'Onaylanamadı.'); }
                }}>Onayla</button>
                <button type="button" className="btn btn-ghost" style={{ fontSize: 12 }} onClick={() => void gonulluBasvuruKarar(b.id, 'reddedildi', b.gorevId, seciliDernekId).then(yukle)}>Reddet</button>
              </ActionRow>
            )}
          </>
        )} />
      )}
    </AdminPageLayout>
  );
}
