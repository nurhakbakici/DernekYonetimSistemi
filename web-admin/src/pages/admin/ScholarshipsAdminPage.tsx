import { useCallback, useEffect, useState } from 'react';
import { AdminPageLayout, ActionRow, CardList, Field, FilterBar, FormGrid, StatusBadge } from '../../components/admin/AdminPageLayout';
import { useDernekPaketler } from '../../hooks/useDernekPaketler';
import {
  bursBasvuruKarar, bursBasvurulariniYukle, bursEkle, bursOdemeGuncelle, bursSil, burslariYukle,
  type BursBasvuruRow, type BursRow,
} from '../../services/moduleOperations';

export default function ScholarshipsAdminPage() {
  const { seciliDernekId, seciliDernekAd, paketler } = useDernekPaketler();
  const [tab, setTab] = useState<'basvuru' | 'program'>('basvuru');
  const [basvurular, setBasvurular] = useState<BursBasvuruRow[]>([]);
  const [burslar, setBurslar] = useState<BursRow[]>([]);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [hata, setHata] = useState('');
  const [form, setForm] = useState({ ad: '', aciklama: '', miktar: '3000', saglayanKurum: '', sonBasvuru: '' });

  const yukle = useCallback(async () => {
    if (!seciliDernekId) return;
    setYukleniyor(true);
    try {
      const [b, p] = await Promise.all([bursBasvurulariniYukle(seciliDernekId), burslariYukle(seciliDernekId)]);
      setBasvurular(b);
      setBurslar(p);
    } finally { setYukleniyor(false); }
  }, [seciliDernekId]);

  useEffect(() => { void yukle(); }, [yukle]);

  const programEkle = async () => {
    if (!seciliDernekId || !form.ad.trim()) return;
    setHata('');
    try {
      await bursEkle(seciliDernekId, {
        ad: form.ad.trim(),
        aciklama: form.aciklama.trim(),
        miktar: Number(form.miktar) || 0,
        saglayanKurum: form.saglayanKurum.trim() || seciliDernekAd || 'Dernek',
        sonBasvuruTarihi: form.sonBasvuru || new Date().toISOString().split('T')[0],
        gereksinimler: [],
      });
      setForm({ ad: '', aciklama: '', miktar: '3000', saglayanKurum: '', sonBasvuru: '' });
      await yukle();
    } catch { setHata('Program eklenemedi.'); }
  };

  return (
    <AdminPageLayout title="Burs yönetimi" sub={seciliDernekAd ?? ''} paket="burslar" paketler={paketler} yukleniyor={yukleniyor} onRefresh={yukle}>
      <FilterBar value={tab} onChange={(v) => setTab(v as 'basvuru' | 'program')} options={[
        { id: 'basvuru', label: 'Başvurular' }, { id: 'program', label: 'Programlar' },
      ]} />
      {hata && <div className="alert-banner alert-danger" style={{ marginBottom: 16 }}>{hata}</div>}

      {tab === 'program' ? (
        <>
          <FormGrid>
            <Field label="Program adı"><input className="input" value={form.ad} onChange={(e) => setForm({ ...form, ad: e.target.value })} /></Field>
            <Field label="Açıklama"><textarea className="input" rows={3} value={form.aciklama} onChange={(e) => setForm({ ...form, aciklama: e.target.value })} /></Field>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Field label="Miktar (₺)"><input className="input" type="number" value={form.miktar} onChange={(e) => setForm({ ...form, miktar: e.target.value })} /></Field>
              <Field label="Son başvuru"><input className="input" type="date" value={form.sonBasvuru} onChange={(e) => setForm({ ...form, sonBasvuru: e.target.value })} /></Field>
            </div>
            <Field label="Sağlayan kurum"><input className="input" value={form.saglayanKurum} onChange={(e) => setForm({ ...form, saglayanKurum: e.target.value })} placeholder={seciliDernekAd ?? 'Dernek'} /></Field>
            <button type="button" className="btn btn-primary" style={{ alignSelf: 'flex-start' }} onClick={() => void programEkle()}>Program ekle</button>
          </FormGrid>
          <CardList items={burslar} render={(b: BursRow) => (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                <strong>{b.ad}</strong>
                <StatusBadge durum={b.durum} />
              </div>
              <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 6 }}>{b.miktar} ₺ · Son: {b.sonBasvuruTarihi}</div>
              <ActionRow>
                <button type="button" className="btn btn-ghost" style={{ fontSize: 12, color: 'var(--red)' }} onClick={() => void bursSil(b.id).then(yukle)}>Sil</button>
              </ActionRow>
            </>
          )} />
        </>
      ) : (
        <CardList items={basvurular} render={(b: BursBasvuruRow) => (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
              <div><div style={{ fontWeight: 700 }}>{b.kullaniciAdi}</div><div style={{ fontSize: 13, color: 'var(--muted)' }}>{b.bursAdi}</div></div>
              <StatusBadge durum={b.durum} />
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-dim)', marginTop: 8 }}>Başvuru: {b.basvuruTarihi}</div>
            {b.durum === 'onaylandi' && (
              <div style={{ fontSize: 13, marginTop: 8 }}>
                IBAN: {b.iban ? <code>{b.iban}</code> : <span style={{ color: 'var(--amber)' }}>Henüz girilmedi</span>}
                {' · '}Ödeme: {b.bursOdemeDurumu === 'yatirildi' ? 'Yatırıldı' : 'Bekliyor'}
              </div>
            )}
            {(b.belgelerUri && Object.keys(b.belgelerUri).length > 0) && (
              <div style={{ marginTop: 8, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {Object.entries(b.belgelerUri).map(([k, uri]) => (
                  <a key={k} href={uri} target="_blank" rel="noreferrer" className="btn btn-ghost" style={{ fontSize: 11 }}>{k}</a>
                ))}
              </div>
            )}
            {b.durum === 'beklemede' && (
              <ActionRow>
                <button type="button" className="btn btn-primary" style={{ fontSize: 12 }} onClick={() => void bursBasvuruKarar(b.id, 'onaylandi').then(yukle)}>Onayla</button>
                <button type="button" className="btn btn-ghost" style={{ fontSize: 12 }} onClick={() => void bursBasvuruKarar(b.id, 'reddedildi').then(yukle)}>Reddet</button>
              </ActionRow>
            )}
            {b.durum === 'onaylandi' && (
              <ActionRow>
                {b.bursOdemeDurumu !== 'yatirildi' ? (
                  <button type="button" className="btn btn-primary" style={{ fontSize: 12 }} onClick={async () => {
                    try { await bursOdemeGuncelle(b.id, true, b.iban); await yukle(); }
                    catch (e) { setHata(e instanceof Error ? e.message : 'Ödeme güncellenemedi.'); }
                  }}>Yatırıldı işaretle</button>
                ) : (
                  <button type="button" className="btn btn-ghost" style={{ fontSize: 12 }} onClick={() => void bursOdemeGuncelle(b.id, false, b.iban).then(yukle)}>Ödemeyi beklemede al</button>
                )}
              </ActionRow>
            )}
          </>
        )} />
      )}
    </AdminPageLayout>
  );
}
