import { Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import ModulesPage from './pages/ModulesPage';
import MembersPage from './pages/MembersPage';
import RemindersPage from './pages/RemindersPage';
import PlatformApprovalPage from './pages/PlatformApprovalPage';
import ReservationsAdminPage from './pages/admin/ReservationsAdminPage';
import ScholarshipsAdminPage from './pages/admin/ScholarshipsAdminPage';
import AidatAdminPage from './pages/admin/AidatAdminPage';
import VolunteersAdminPage from './pages/admin/VolunteersAdminPage';
import LibraryAdminPage from './pages/admin/LibraryAdminPage';
import RoomsAdminPage from './pages/admin/RoomsAdminPage';
import EventsAdminPage from './pages/admin/EventsAdminPage';
import AnnouncementsAdminPage from './pages/admin/AnnouncementsAdminPage';
import InventoryAdminPage from './pages/admin/InventoryAdminPage';

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}

function AppRoutes() {
  const {
    firebaseUser, yukleniyor, yetkisiz, seciliDernekId, yoneticiDernekleri, cikisYap,
  } = useAuth();

  if (yukleniyor) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
      >
        <p style={{ color: 'var(--muted)' }}>Yükleniyor…</p>
      </div>
    );
  }

  if (!firebaseUser) {
    return (
      <Routes>
        <Route path="/giris" element={<LoginPage />} />
        <Route path="*" element={<Navigate to="/giris" replace />} />
      </Routes>
    );
  }

  if (yetkisiz) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
      }}
      >
        <div className="card" style={{ maxWidth: 440, textAlign: 'center' }}>
          <h1 style={{ fontSize: 22, marginBottom: 12 }}>Erişim yok</h1>
          <p style={{ color: 'var(--muted)', fontSize: 14 }}>
            Bu hesap herhangi bir dernekte aktif yönetici olarak tanımlı değil.
            Dernek yöneticisi yetkisi için mevcut yöneticinizle iletişime geçin.
          </p>
          <button type="button" className="btn btn-ghost" style={{ marginTop: 20 }} onClick={() => cikisYap()}>
            Çıkış yap
          </button>
        </div>
      </div>
    );
  }

  if (yoneticiDernekleri.length > 1 && !seciliDernekId) {
    return <DernekSecimEkrani />;
  }

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<DashboardPage />} />
        <Route path="uyeler" element={<MembersPage />} />
        <Route path="hatirlatmalar" element={<RemindersPage />} />
        <Route path="moduller" element={<ModulesPage />} />
        <Route path="platform-onay" element={<PlatformOnayRoute />} />
        <Route path="yonetim/rezervasyonlar" element={<ReservationsAdminPage />} />
        <Route path="yonetim/burslar" element={<ScholarshipsAdminPage />} />
        <Route path="yonetim/aidat" element={<AidatAdminPage />} />
        <Route path="yonetim/gonulluluk" element={<VolunteersAdminPage />} />
        <Route path="yonetim/kutuphane" element={<LibraryAdminPage />} />
        <Route path="yonetim/odalar" element={<RoomsAdminPage />} />
        <Route path="yonetim/etkinlikler" element={<EventsAdminPage />} />
        <Route path="yonetim/duyurular" element={<AnnouncementsAdminPage />} />
        <Route path="yonetim/envanter" element={<InventoryAdminPage />} />
      </Route>
      <Route path="/giris" element={<Navigate to="/" replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function PlatformOnayRoute() {
  const { platformYonetici } = useAuth();
  if (!platformYonetici) {
    return <Navigate to="/" replace />;
  }
  return <PlatformApprovalPage />;
}

function DernekSecimEkrani() {
  const { yoneticiDernekleri, dernekSec } = useAuth();
  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
    }}
    >
      <div className="card" style={{ maxWidth: 400, width: '100%' }}>
        <h1 style={{ fontSize: 22, marginBottom: 8 }}>Dernek seçin</h1>
        <p style={{ color: 'var(--muted)', fontSize: 14, marginBottom: 20 }}>
          Birden fazla dernekte yöneticisiniz. Panelde hangi derneği yöneteceğinizi seçin.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {yoneticiDernekleri.map((d) => (
            <button
              key={d.dernekId}
              type="button"
              className="btn btn-primary"
              style={{ width: '100%' }}
              onClick={() => dernekSec(d.dernekId)}
            >
              {d.dernekAd}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
