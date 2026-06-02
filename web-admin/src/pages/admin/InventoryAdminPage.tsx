import { useCallback, useEffect, useState } from 'react';
import { AdminPageLayout, ActionRow, CardList, Field, FilterBar, FormGrid, StatusBadge } from '../../components/admin/AdminPageLayout';
import { useDernekPaketler } from '../../hooks/useDernekPaketler';
import { dernekUyeleriniYukle, type UyeBilgi } from '../../services/operations';
import {
  envanterEkle, envanterGuncelle, envanterSil, envanterleriYukle,
  zimmetIade, zimmetVer, zimmetleriYukle,
  type EnvanterRow, type ZimmetRow,
} from '../../services/moduleOperations';

const KATEGORILER = ['Teknik', 'Oyun', 'Mobilya', 'Kırtasiye', 'Diğer'];
const DURUMLAR = [
  { id: 'kullanilabilir', label: 'Kullanılabilir' },
  { id: 'bakim', label: 'Bakımda' },
  { id: 'arizali', label: 'Arızalı' },
];

export default function InventoryAdminPage() {
  const { seciliDernekId, seciliDernekAd, paketler } = useDernekPaketler();
  const [tab, setTab] = useState<'demirbas' | 'zimmet'>('demirbas');
  const [envanterler, setEnvanterler] = useState<EnvanterRow[]>([]);
  const [zimmetler, setZimmetler] = useState<ZimmetRow[]>([]);
  const [uyeler, setUyeler] = useState<UyeBilgi[]>([]);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [hata, setHata] = useState('');
  const [form, setForm] = useState({ ad: '', kategori: 'Teknik', adet: '1', lokasyon: '', aciklama: '' });
  const [zimmetForm, setZimmetForm] = useState({ envanterId: '', uyeId: '', planlananIade: '', not: '' });

  const yukle = useCallback(async () => {
    if (!seciliDernekId) return;
    setYukleniyor(true);
    setHata('');
    try {
      const [e, z, u] = await Promise.all([
        envanterleriYukle(seciliDernekId),
        zimmetleriYukle(seciliDernekId),
        dernekUyeleriniYukle(seciliDernekId),
      ]);
      setEnvanterler(e);
      setZimmetler(z);
      setUyeler(u.filter((x) => x.uyelikDurumu === 'aktif'));
    } finally { setYukleniyor(false); }
  }, [seciliDernekId]);

  useEffect(() => { void yukle(); }, [yukle]);

  const demirbasEkle = async () => {
    if (!seciliDernekId || !form.ad.trim()) return;
    setHata('');
    try {
      await envanterEkle(seciliDernekId, {
        ad: form.ad.trim(),
        kategori: form.kategori,
        toplamAdet: Number(form.adet) || 1,
        lokasyon: form.lokasyon.trim() || undefined,
        aciklama: form.aciklama.trim() || undefined,
      });
      setForm({ ad: '', kategori: 'Teknik', adet: '1', lokasyon: '', aciklama: '' });
      await yukle();
    } catch (e) { setHata(e instanceof Error ? e.message : 'Eklenemedi.'); }
  };

  const zimmetOlustur = async () => {
    if (!seciliDernekId || !zimmetForm.envanterId || !zimmetForm.uyeId) return;
    const env = envanterler.find((e) => e.id === zimmetForm.envanterId);
    const uye = uyeler.find((u) => u.uid === zimmetForm.uyeId);
    if (!env || !uye) return;
    setHata('');
    try {
      await zimmetVer(seciliDernekId, {
        envanterId: env.id,
        envanterAd: env.ad,
        kullaniciId: uye.uid,
        kullaniciAdi: `${uye.ad} ${uye.soyad}`.trim(),
        planlananIade: zimmetForm.planlananIade || undefined,
        not: zimmetForm.not.trim() || undefined,
      });
      setZimmetForm({ envanterId: '', uyeId: '', planlananIade: '', not: '' });
      await yukle();
    } catch (e) { setHata(e instanceof Error ? e.message : 'Zimmet verilemedi.'); }
  };

  const aktifZimmetler = zimmetler.filter((z) => z.durum === 'aktif');
  const musaitEnvanter = envanterler.filter((e) => e.musaitAdet > 0 && e.durum !== 'arizali');

  return (
    <AdminPageLayout title="Envanter & zimmet" sub={seciliDernekAd ?? ''} paket="envanter" paketler={paketler} yukleniyor={yukleniyor} onRefresh={yukle}>
      {hata && <div className="alert-banner alert-danger" style={{ marginBottom: 16 }}>{hata}</div>}
      <FilterBar value={tab} onChange={(v) => setTab(v as 'demirbas' | 'zimmet')} options={[
        { id: 'demirbas', label: 'Demirbaşlar' },
        { id: 'zimmet', label: `Zimmetler (${aktifZimmetler.length})` },
      ]} />

      {tab === 'demirbas' ? (
        <>
          <FormGrid>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 80px', gap: 12 }}>
              <Field label="Ad"><input className="input" value={form.ad} onChange={(e) => setForm({ ...form, ad: e.target.value })} /></Field>
              <Field label="Kategori">
                <select className="input" value={form.kategori} onChange={(e) => setForm({ ...form, kategori: e.target.value })}>
                  {KATEGORILER.map((k) => <option key={k} value={k}>{k}</option>)}
                </select>
              </Field>
              <Field label="Adet"><input className="input" type="number" value={form.adet} onChange={(e) => setForm({ ...form, adet: e.target.value })} /></Field>
            </div>
            <Field label="Lokasyon"><input className="input" value={form.lokasyon} onChange={(e) => setForm({ ...form, lokasyon: e.target.value })} /></Field>
            <Field label="Açıklama"><textarea className="input" rows={2} value={form.aciklama} onChange={(e) => setForm({ ...form, aciklama: e.target.value })} /></Field>
            <button type="button" className="btn btn-primary" style={{ alignSelf: 'flex-start' }} onClick={() => void demirbasEkle()}>Demirbaş ekle</button>
          </FormGrid>
          <CardList items={envanterler} render={(e: EnvanterRow) => (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
                <div>
                  <div style={{ fontWeight: 700 }}>{e.ad}</div>
                  <div style={{ fontSize: 13, color: 'var(--muted)' }}>{e.kategori} · {e.musaitAdet}/{e.toplamAdet} müsait{e.lokasyon ? ` · ${e.lokasyon}` : ''}</div>
                </div>
                <StatusBadge durum={e.durum === 'kullanilabilir' ? 'aktif' : e.durum === 'arizali' ? 'iptal' : 'beklemede'} />
              </div>
              <ActionRow>
                <select
                  className="input"
                  style={{ maxWidth: 160, fontSize: 12, padding: '6px 10px' }}
                  value={e.durum}
                  onChange={(ev) => void envanterGuncelle(e.id, { durum: ev.target.value }).then(yukle)}
                >
                  {DURUMLAR.map((d) => <option key={d.id} value={d.id}>{d.label}</option>)}
                </select>
                <button type="button" className="btn btn-ghost" style={{ fontSize: 12, color: 'var(--red)' }} onClick={async () => {
                  if (!seciliDernekId || !window.confirm('Silinsin mi?')) return;
                  setHata('');
                  try { await envanterSil(e.id, seciliDernekId); await yukle(); }
                  catch (err) { setHata(err instanceof Error ? err.message : 'Silinemedi.'); }
                }}>Sil</button>
              </ActionRow>
            </>
          )} />
        </>
      ) : (
        <>
          <FormGrid>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Field label="Demirbaş">
                <select className="input" value={zimmetForm.envanterId} onChange={(e) => setZimmetForm({ ...zimmetForm, envanterId: e.target.value })}>
                  <option value="">Seçin…</option>
                  {musaitEnvanter.map((e) => <option key={e.id} value={e.id}>{e.ad} ({e.musaitAdet} müsait)</option>)}
                </select>
              </Field>
              <Field label="Üye">
                <select className="input" value={zimmetForm.uyeId} onChange={(e) => setZimmetForm({ ...zimmetForm, uyeId: e.target.value })}>
                  <option value="">Seçin…</option>
                  {uyeler.map((u) => <option key={u.uid} value={u.uid}>{u.ad} {u.soyad}</option>)}
                </select>
              </Field>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Field label="Planlanan iade"><input className="input" type="date" value={zimmetForm.planlananIade} onChange={(e) => setZimmetForm({ ...zimmetForm, planlananIade: e.target.value })} /></Field>
              <Field label="Not"><input className="input" value={zimmetForm.not} onChange={(e) => setZimmetForm({ ...zimmetForm, not: e.target.value })} /></Field>
            </div>
            <button type="button" className="btn btn-primary" style={{ alignSelf: 'flex-start' }} onClick={() => void zimmetOlustur()}>Zimmet ver</button>
          </FormGrid>
          <CardList items={aktifZimmetler} render={(z: ZimmetRow) => (
            <>
              <div style={{ fontWeight: 700 }}>{z.envanterAd}</div>
              <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 4 }}>
                {z.kullaniciAdi} · Zimmet: {z.zimmetTarihi}
                {z.planlananIade && ` · Planlanan iade: ${z.planlananIade}`}
              </div>
              {z.not && <div style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 6 }}>{z.not}</div>}
              <ActionRow>
                <button type="button" className="btn btn-primary" style={{ fontSize: 12 }} onClick={async () => {
                  if (!seciliDernekId) return;
                  setHata('');
                  try { await zimmetIade(z.id, z.envanterId, seciliDernekId); await yukle(); }
                  catch (err) { setHata(err instanceof Error ? err.message : 'İade alınamadı.'); }
                }}>İade al</button>
              </ActionRow>
            </>
          )} />
        </>
      )}
    </AdminPageLayout>
  );
}
