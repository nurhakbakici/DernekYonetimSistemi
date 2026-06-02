import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import type { FeaturePaketId } from '../../types';
import { dernekPaketAktif } from '../../utils/paketler';

export function AdminPageLayout({
  title,
  sub,
  yukleniyor,
  onRefresh,
  paket,
  paketler,
  children,
}: {
  title: string;
  sub?: string;
  yukleniyor?: boolean;
  onRefresh?: () => void;
  paket: FeaturePaketId;
  paketler: FeaturePaketId[] | undefined;
  children: ReactNode;
}) {
  if (!dernekPaketAktif(paketler, paket)) {
    return (
      <div style={{ padding: '28px 32px', maxWidth: 900, margin: '0 auto' }}>
        <div className="card" style={{ padding: 24, textAlign: 'center' }}>
          <p style={{ color: 'var(--muted)' }}>Bu modül bu dernek için kapalı.</p>
          <Link to="/moduller" className="btn btn-primary" style={{ marginTop: 14, fontSize: 13 }}>Modülleri aç →</Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '28px 32px', maxWidth: 1200, margin: '0 auto' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800 }}>{title}</h1>
          {sub && <p style={{ color: 'var(--muted)', fontSize: 14, marginTop: 4 }}>{sub}</p>}
        </div>
        {onRefresh && (
          <button type="button" className="btn btn-ghost" onClick={onRefresh} disabled={yukleniyor}>
            ↻ Yenile
          </button>
        )}
      </header>
      {yukleniyor ? <p style={{ color: 'var(--muted)' }}>Yükleniyor…</p> : children}
    </div>
  );
}

export function FilterBar({ options, value, onChange }: {
  options: { id: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          className={`btn ${value === o.id ? 'btn-primary' : 'btn-ghost'}`}
          style={{ padding: '8px 14px', fontSize: 13 }}
          onClick={() => onChange(o.id)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function StatusBadge({ durum }: { durum: string }) {
  const map: Record<string, { cls: string; label: string }> = {
    beklemede: { cls: 'badge-amber', label: 'Beklemede' },
    onaylandi: { cls: 'badge-green', label: 'Onaylı' },
    iptal: { cls: 'badge-red', label: 'İptal' },
    reddedildi: { cls: 'badge-red', label: 'Reddedildi' },
    aktif: { cls: 'badge-green', label: 'Aktif' },
    kapali: { cls: 'badge-muted', label: 'Kapalı' },
    acik: { cls: 'badge-green', label: 'Açık' },
    tamamlandi: { cls: 'badge-blue', label: 'Tamamlandı' },
    gecikti: { cls: 'badge-red', label: 'Gecikmiş' },
  };
  const m = map[durum] ?? { cls: 'badge-muted', label: durum };
  return <span className={`badge ${m.cls}`} style={{ fontSize: 11 }}>{m.label}</span>;
}

export function ActionRow({ children }: { children: ReactNode }) {
  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10 }}>
      {children}
    </div>
  );
}

export function CardList<T extends { id?: string }>({ items, render }: {
  items: T[];
  render: (item: T, i: number) => ReactNode;
}) {
  if (!items.length) {
    return <p style={{ color: 'var(--muted)', fontSize: 14 }}>Kayıt bulunamadı.</p>;
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {items.map((item, i) => (
        <div key={item.id ?? i} className="card fade-up" style={{ padding: 16 }}>
          {render(item, i)}
        </div>
      ))}
    </div>
  );
}

export function FormGrid({ children }: { children: ReactNode }) {
  return (
    <div className="card fade-up" style={{ padding: 20, marginBottom: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
      {children}
    </div>
  );
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <span style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 600 }}>{label}</span>
      {children}
    </label>
  );
}
