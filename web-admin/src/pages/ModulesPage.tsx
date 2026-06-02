import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FEATURE_PAKETLERI, TUM_PAKET_IDLERI } from '../constants/modules';
import { dernekGetir, dernekPaketleriniGuncelle } from '../services/dernek';
import type { FeaturePaketId } from '../types';

const TOPLAM_MODUL = FEATURE_PAKETLERI.length;

export default function ModulesPage() {
  const { seciliDernekId, seciliDernekAd } = useAuth();
  const [secili, setSecili] = useState<Set<FeaturePaketId>>(new Set());
  const [yukleniyor, setYukleniyor] = useState(true);
  const [kaydediliyor, setKaydediliyor] = useState(false);
  const [mesaj, setMesaj] = useState('');
  const [hata, setHata] = useState('');

  useEffect(() => {
    if (!seciliDernekId) return;
    let iptal = false;
    (async () => {
      setYukleniyor(true);
      setHata('');
      setMesaj('');
      try {
        const dernek = await dernekGetir(seciliDernekId);
        if (iptal) return;
        setSecili(new Set(dernek?.paketler ?? []));
      } catch {
        if (!iptal) setHata('Dernek bilgisi yüklenemedi.');
      } finally {
        if (!iptal) setYukleniyor(false);
      }
    })();
    return () => { iptal = true; };
  }, [seciliDernekId]);

  const aktifSayisi = secili.size;
  const yuzde = Math.round((aktifSayisi / TOPLAM_MODUL) * 100);

  const toggle = (id: FeaturePaketId) => {
    setSecili((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        if (next.size <= 1) return prev;
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
    setMesaj('');
    setHata('');
  };

  const tumunuAc = () => {
    setSecili(new Set(TUM_PAKET_IDLERI));
    setMesaj('');
  };

  const sadeceTemel = () => {
    setSecili(new Set(['duyurular', 'uyelik'] as FeaturePaketId[]));
    setMesaj('');
  };

  const kaydet = async () => {
    if (!seciliDernekId) return;
    setKaydediliyor(true);
    setHata('');
    setMesaj('');
    try {
      await dernekPaketleriniGuncelle(seciliDernekId, Array.from(secili));
      setMesaj('Modüller kaydedildi. Mobil uygulamada yeniden giriş veya uygulama yenilemesi sonrası yansır.');
    } catch {
      setHata('Kayıt başarısız. Yönetici yetkinizi ve Firestore kurallarını kontrol edin.');
    } finally {
      setKaydediliyor(false);
    }
  };

  if (!seciliDernekId) {
    return (
      <div style={{ padding: '40px 32px', color: 'var(--muted)' }}>
        Lütfen sol menüden bir dernek seçin.
      </div>
    );
  }

  if (yukleniyor) {
    return (
      <div style={{ padding: '28px 32px', maxWidth: 1100, margin: '0 auto' }}>
        <header style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.5px' }}>Modüller</h1>
          <p style={{ color: 'var(--muted)', fontSize: 14, marginTop: 4 }}>Yükleniyor…</p>
        </header>
        <div className="modules-skeleton">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="modules-skeleton-card" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '28px 32px', maxWidth: 1100, margin: '0 auto' }}>

      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.5px', color: 'var(--text)' }}>
            Modüller
          </h1>
          <p style={{ color: 'var(--muted)', fontSize: 14, marginTop: 4, maxWidth: 520 }}>
            <strong style={{ color: 'var(--text-dim)' }}>{seciliDernekAd ?? 'Dernek'}</strong>
            {' '}
            için mobil uygulamada görünen özellikleri açıp kapatın. En az bir modül seçili kalmalıdır.
          </p>
        </div>
        <Link to="/" className="btn btn-ghost" style={{ fontSize: 13, padding: '8px 14px' }}>
          ← Dashboard
        </Link>
      </header>

      {hata && (
        <div className="alert-banner alert-danger fade-up" style={{ marginBottom: 16 }}>
          <span style={{ fontSize: 18 }}>⚠</span>
          <span>{hata}</span>
        </div>
      )}
      {mesaj && (
        <div className="alert-banner alert-info fade-up" style={{ marginBottom: 16 }}>
          <span style={{ fontSize: 18 }}>✓</span>
          <span>{mesaj}</span>
        </div>
      )}

      <div className="modules-summary fade-up">
        <div className="modules-summary-stats">
          <div>
            <div className="modules-summary-count">
              {aktifSayisi}
              <span> / {TOPLAM_MODUL}</span>
            </div>
            <div className="modules-summary-label">aktif modül</div>
          </div>
          <div className="modules-summary-bar">
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 12, color: 'var(--muted)' }}>
              <span>Kapsam</span>
              <span style={{ fontWeight: 700, color: 'var(--text)' }}>%{yuzde}</span>
            </div>
            <div className="progress-track">
              <div className="progress-fill progress-blue" style={{ width: `${yuzde}%` }} />
            </div>
          </div>
        </div>
        <div className="modules-quick-actions">
          <button type="button" className="btn btn-ghost" style={{ fontSize: 13 }} onClick={tumunuAc}>
            Tümünü aç
          </button>
          <button type="button" className="btn btn-ghost" style={{ fontSize: 13 }} onClick={sadeceTemel}>
            Temel paket
          </button>
        </div>
      </div>

      <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 14 }}>
        Kartlara tıklayarak modülü açıp kapatabilirsiniz.
      </p>

      <div className="modules-grid fade-up">
        {FEATURE_PAKETLERI.map((mod, index) => {
          const aktif = secili.has(mod.id);
          const sonAktif = aktif && secili.size === 1;
          return (
            <button
              key={mod.id}
              type="button"
              className={`module-card module-accent-${mod.accent} ${aktif ? 'module-card--active' : ''}`}
              style={{ animationDelay: `${index * 40}ms` }}
              onClick={() => toggle(mod.id)}
              aria-pressed={aktif}
              title={sonAktif ? 'En az bir modül açık kalmalıdır' : undefined}
            >
              <div className="module-card-head">
                <div className="module-card-icon" aria-hidden>{mod.icon}</div>
                <span className={`module-toggle ${aktif ? 'module-toggle--on' : ''}`} aria-hidden />
              </div>
              <div>
                <div className="module-card-title">{mod.etiket}</div>
                <div className="module-card-desc">{mod.aciklama}</div>
              </div>
              <div className="module-card-foot">
                <span className="module-card-status">
                  {aktif ? 'Mobilde görünür' : 'Kapalı'}
                </span>
                {aktif && <span className="badge badge-blue">Aktif</span>}
              </div>
            </button>
          );
        })}
      </div>

      <div className="modules-footer">
        <div className="modules-footer-meta">
          <strong>{aktifSayisi}</strong>
          {' '}
          modül seçili
          {aktifSayisi < TOPLAM_MODUL && (
            <span style={{ marginLeft: 8, opacity: 0.85 }}>
              · {TOPLAM_MODUL - aktifSayisi} kapalı
            </span>
          )}
        </div>
        <button
          type="button"
          className="btn btn-primary"
          disabled={kaydediliyor || secili.size === 0}
          onClick={kaydet}
        >
          {kaydediliyor ? 'Kaydediliyor…' : 'Değişiklikleri kaydet'}
        </button>
      </div>
    </div>
  );
}
