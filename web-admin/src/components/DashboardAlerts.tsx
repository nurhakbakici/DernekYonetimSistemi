import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { dernekPaketAktif } from '../utils/paketler';
import type { DashboardStats, FeaturePaketId } from '../types';

type AlertType = 'warn' | 'danger' | 'info';

interface AlertItem {
  id: string;
  type: AlertType;
  icon: string;
  content: ReactNode;
}

function storageKey(dernekId: string) {
  return `webadmin_dismissed_alerts_${dernekId}`;
}

function loadDismissed(dernekId: string): Set<string> {
  try {
    const raw = localStorage.getItem(storageKey(dernekId));
    if (!raw) return new Set();
    const arr = JSON.parse(raw) as string[];
    return new Set(Array.isArray(arr) ? arr : []);
  } catch {
    return new Set();
  }
}

function saveDismissed(dernekId: string, ids: Set<string>) {
  localStorage.setItem(storageKey(dernekId), JSON.stringify([...ids]));
}

function buildAlerts(
  s: DashboardStats,
  paketler: FeaturePaketId[] | undefined,
): AlertItem[] {
  const p = (id: FeaturePaketId) => dernekPaketAktif(paketler, id);
  const list: AlertItem[] = [];

  if (p('uyelik') && s.adayBekleyen > 0) {
    list.push({
      id: `uyelik-${s.adayBekleyen}`,
      type: 'warn',
      icon: '👤',
      content: (
        <>
          <strong>{s.adayBekleyen} üye başvurusu</strong> onay bekliyor. Üye Yönetimi sayfasından inceleyebilirsiniz.
        </>
      ),
    });
  }
  if (p('odalar') && s.bekleyenRezervasyon > 0) {
    list.push({
      id: `rezervasyon-${s.bekleyenRezervasyon}`,
      type: 'warn',
      icon: '🏠',
      content: (
        <>
          <strong>{s.bekleyenRezervasyon} rezervasyon</strong> onay bekliyor.{' '}
          <a href="/yonetim/rezervasyonlar" style={{ color: 'var(--primary-light)', textDecoration: 'underline' }}>Yönet →</a>
        </>
      ),
    });
  }
  if (p('kutuphane') && s.gecikliOdunc > 0) {
    list.push({
      id: `odunc-${s.gecikliOdunc}`,
      type: 'danger',
      icon: '📚',
      content: (
        <>
          <strong>{s.gecikliOdunc} ödünç kitap</strong> gecikmiş durumda.{' '}
          <a href="/hatirlatmalar" style={{ color: 'var(--primary-light)', textDecoration: 'underline' }}>
            Hatırlatma gönder →
          </a>
        </>
      ),
    });
  }
  if (p('burslar') && s.bekleyenBurs > 0) {
    list.push({
      id: `burs-${s.bekleyenBurs}`,
      type: 'info',
      icon: '🎓',
      content: (
        <>
          <strong>{s.bekleyenBurs} burs başvurusu</strong> değerlendirme bekliyor.{' '}
          <a href="/yonetim/burslar" style={{ color: 'var(--primary-light)', textDecoration: 'underline' }}>Yönet →</a>
        </>
      ),
    });
  }
  if (p('gonulluluk') && s.bekleyenGonulluBasvuru > 0) {
    list.push({
      id: `gonullu-${s.bekleyenGonulluBasvuru}`,
      type: 'info',
      icon: '🤝',
      content: (
        <>
          <strong>{s.bekleyenGonulluBasvuru} gönüllü başvurusu</strong> onay bekliyor.{' '}
          <a href="/yonetim/gonulluluk" style={{ color: 'var(--primary-light)', textDecoration: 'underline' }}>Yönet →</a>
        </>
      ),
    });
  }

  return list;
}

export default function DashboardAlerts({
  dernekId,
  stats,
  paketler,
}: {
  dernekId: string;
  stats: DashboardStats;
  paketler: FeaturePaketId[] | undefined;
}) {
  const allAlerts = useMemo(() => buildAlerts(stats, paketler), [stats, paketler]);
  const [dismissed, setDismissed] = useState<Set<string>>(() => loadDismissed(dernekId));
  const [acik, setAcik] = useState(true);

  useEffect(() => {
    setDismissed(loadDismissed(dernekId));
    setAcik(true);
  }, [dernekId]);

  const dismiss = useCallback((id: string) => {
    setDismissed((prev) => {
      const next = new Set(prev).add(id);
      saveDismissed(dernekId, next);
      return next;
    });
  }, [dernekId]);

  const dismissAll = useCallback(() => {
    const next = new Set(allAlerts.map((a) => a.id));
    setDismissed(next);
    saveDismissed(dernekId, next);
    setAcik(false);
  }, [allAlerts, dernekId]);

  const visible = allAlerts.filter((a) => !dismissed.has(a.id));

  if (allAlerts.length === 0) return null;

  return (
    <div className="alert-panel fade-up" style={{ marginBottom: 24 }}>
      <button
        type="button"
        className="alert-panel-header"
        onClick={() => setAcik((v) => !v)}
        aria-expanded={acik}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 18 }} aria-hidden>🔔</span>
          <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)' }}>Bildirimler & uyarılar</span>
          {visible.length > 0 && (
            <span className="badge badge-amber" style={{ fontSize: 11, padding: '2px 8px' }}>
              {visible.length}
            </span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {visible.length > 0 && (
            <span
              role="button"
              tabIndex={0}
              className="alert-panel-link"
              onClick={(e) => { e.stopPropagation(); dismissAll(); }}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.stopPropagation(); dismissAll(); } }}
            >
              Tümünü kapat
            </span>
          )}
          <span className="alert-panel-chevron" style={{ transform: acik ? 'rotate(180deg)' : 'none' }} aria-hidden>
            ▾
          </span>
        </div>
      </button>

      {acik && (
        <div className="alert-panel-body">
          {visible.length === 0 ? (
            <p style={{ margin: 0, fontSize: 13, color: 'var(--muted)', padding: '4px 2px' }}>
              Tüm uyarılar kapatıldı. Sayı değişirse yeni bildirimler tekrar görünür.
            </p>
          ) : (
            visible.map((item) => (
              <AlertBanner
                key={item.id}
                type={item.type}
                icon={item.icon}
                onDismiss={() => dismiss(item.id)}
              >
                {item.content}
              </AlertBanner>
            ))
          )}
        </div>
      )}
    </div>
  );
}

function AlertBanner({
  type,
  icon,
  children,
  onDismiss,
}: {
  type: AlertType;
  icon: string;
  children: ReactNode;
  onDismiss: () => void;
}) {
  const cssType = type === 'warn' ? 'warn' : type === 'info' ? 'info' : 'danger';
  return (
    <div className={`alert-banner alert-${cssType}`}>
      <span className="alert-banner-icon" aria-hidden>{icon}</span>
      <span className="alert-banner-text">{children}</span>
      <button
        type="button"
        className="alert-banner-close"
        onClick={onDismiss}
        title="Kapat"
        aria-label="Uyarıyı kapat"
      >
        ×
      </button>
    </div>
  );
}
