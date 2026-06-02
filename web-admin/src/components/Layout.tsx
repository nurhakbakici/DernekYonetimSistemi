import { useEffect, useState, type ReactNode } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { aktifYonetimNav } from '../constants/adminNav';
import { dernekGetir } from '../services/dernek';
import type { FeaturePaketId } from '../types';

const NAV_ITEMS: {
  to: string;
  end: boolean;
  icon: ReactNode;
  label: string;
  platformOnly?: boolean;
}[] = [
  {
    to: '/',
    end: true,
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" />
      </svg>
    ),
    label: 'Dashboard',
  },
  {
    to: '/uyeler',
    end: false,
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
      </svg>
    ),
    label: 'Üye Yönetimi',
  },
  {
    to: '/hatirlatmalar',
    end: false,
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 01-3.46 0" />
      </svg>
    ),
    label: 'Hatırlatmalar',
  },
  {
    to: '/moduller',
    end: false,
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2l9 4.5v11L12 22l-9-4.5v-11L12 2z" /><path d="M12 22V12" /><path d="M3 7.5l9 4.5 9-4.5" />
      </svg>
    ),
    label: 'Modüller',
  },
  {
    to: '/platform-onay',
    end: false,
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    ),
    label: 'Platform Onay',
    platformOnly: true,
  },
];

export default function Layout() {
  const {
    firebaseUser, cikisYap, seciliDernekId, seciliDernekAd, yoneticiDernekleri, dernekSec,
    platformYonetici,
  } = useAuth();
  const navigate = useNavigate();
  const [paketler, setPaketler] = useState<FeaturePaketId[] | undefined>();

  useEffect(() => {
    if (!seciliDernekId) { setPaketler(undefined); return; }
    void dernekGetir(seciliDernekId).then((d) => setPaketler(d?.paketler));
  }, [seciliDernekId]);

  const menuItems = NAV_ITEMS.filter((item) => !item.platformOnly || platformYonetici);
  const yonetimItems = aktifYonetimNav(paketler);

  const handleCikis = async () => {
    await cikisYap();
    navigate('/giris');
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)' }}>
      {/* Sidebar */}
      <aside style={{
        width: 248,
        background: 'var(--surface)',
        borderRight: '1px solid var(--border-subtle)',
        padding: '20px 12px',
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
        position: 'sticky',
        top: 0,
        height: '100vh',
      }}>
        {/* Logo */}
        <div style={{ padding: '4px 10px 16px', marginBottom: 4, borderBottom: '1px solid var(--border-subtle)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 34, height: 34,
              background: 'linear-gradient(135deg, var(--primary), #7c3aed)',
              borderRadius: 10,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 16,
            }}>
              ◈
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>Dernek</div>
              <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: -2 }}>Yönetim Paneli</div>
            </div>
          </div>
        </div>

        {/* Dernek seçimi */}
        {yoneticiDernekleri.length > 1 && (
          <div style={{ padding: '8px 10px 12px', marginBottom: 4 }}>
            <label style={{ fontSize: 11, color: 'var(--muted)', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Aktif dernek
            </label>
            <select
              className="input"
              style={{ fontSize: 13, padding: '8px 10px' }}
              value={seciliDernekId ?? ''}
              onChange={(e) => dernekSec(e.target.value)}
            >
              {yoneticiDernekleri.map((d) => (
                <option key={d.dernekId} value={d.dernekId}>{d.dernekAd}</option>
              ))}
            </select>
          </div>
        )}

        {/* Dernek adı */}
        {seciliDernekAd && yoneticiDernekleri.length === 1 && (
          <div style={{
            margin: '4px 0 8px',
            padding: '10px 12px',
            background: 'var(--surface2)',
            borderRadius: 10,
            border: '1px solid var(--border-subtle)',
          }}>
            <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 2 }}>Aktif dernek</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {seciliDernekAd}
            </div>
          </div>
        )}

        {/* Nav */}
        <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2, paddingTop: 4 }}>
          <div style={{ fontSize: 11, color: 'var(--muted)', padding: '6px 10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Menü
          </div>
          {menuItems.map(({ to, end, icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}
            >
              {icon}
              {label}
            </NavLink>
          ))}
          {yonetimItems.length > 0 && (
            <>
              <div style={{ fontSize: 11, color: 'var(--muted)', padding: '14px 10px 6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Modül yönetimi
              </div>
              {yonetimItems.map(({ to, label, icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}
                  style={{ fontSize: 13 }}
                >
                  <span style={{ width: 16, textAlign: 'center' }} aria-hidden>{icon}</span>
                  {label}
                </NavLink>
              ))}
            </>
          )}
        </nav>

        {/* Footer */}
        <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ padding: '0 6px', display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 30, height: 30,
              background: 'var(--surface3)',
              borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 12, fontWeight: 700,
              color: 'var(--primary-light)',
              flexShrink: 0,
            }}>
              {firebaseUser?.email?.[0]?.toUpperCase() ?? '?'}
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-dim)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {firebaseUser?.email ?? ''}
              </div>
              <div style={{ fontSize: 11, color: 'var(--muted)' }}>Yönetici</div>
            </div>
          </div>
          <button type="button" className="btn btn-ghost" style={{ width: '100%', fontSize: 13, padding: '8px 12px' }} onClick={handleCikis}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" />
            </svg>
            Çıkış yap
          </button>
        </div>
      </aside>

      {/* Main */}
      <main style={{ flex: 1, overflow: 'auto', minWidth: 0 }}>
        <Outlet />
      </main>
    </div>
  );
}

