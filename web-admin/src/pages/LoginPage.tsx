import { FormEvent, useState, type CSSProperties } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { isFirebaseConfigured } from '../firebase';

export default function LoginPage() {
  const { girisYap } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [sifre, setSifre] = useState('');
  const [hata, setHata] = useState('');
  const [yukleniyor, setYukleniyor] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setHata('');
    setYukleniyor(true);
    try {
      await girisYap(email, sifre);
      navigate('/');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Giriş başarısız';
      setHata(msg.includes('invalid-credential') || msg.includes('wrong-password')
        ? 'E-posta veya şifre hatalı.'
        : 'Giriş yapılamadı. Bilgilerinizi kontrol edin.');
    } finally {
      setYukleniyor(false);
    }
  };

  if (!isFirebaseConfigured) {
    return (
      <div style={centerStyle}>
        <div className="card" style={{ maxWidth: 420, width: '100%' }}>
          <h1 style={{ fontSize: 22, marginBottom: 12 }}>Yapılandırma eksik</h1>
          <p style={{ color: 'var(--muted)', fontSize: 14 }}>
            <code>web-admin/.env</code> dosyasına mobil uygulamadaki Firebase değerlerini
            {' '}
            <code>VITE_FIREBASE_*</code>
            {' '}
            önekiyle ekleyin.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={centerStyle}>
      <div className="card" style={{ maxWidth: 400, width: '100%' }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 1 }}>
            Dernek yöneticileri
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 700, marginTop: 8 }}>Web panel</h1>
          <p style={{ color: 'var(--muted)', fontSize: 14, marginTop: 8 }}>
            Yalnızca dernek yöneticisi hesapları giriş yapabilir.
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={labelStyle}>E-posta</label>
            <input
              className="input"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label style={labelStyle}>Şifre</label>
            <input
              className="input"
              type="password"
              autoComplete="current-password"
              required
              value={sifre}
              onChange={(e) => setSifre(e.target.value)}
            />
          </div>
          {hata && (
            <p style={{ color: 'var(--error)', fontSize: 13 }}>{hata}</p>
          )}
          <button type="submit" className="btn btn-primary" disabled={yukleniyor} style={{ marginTop: 8 }}>
            {yukleniyor ? 'Giriş yapılıyor…' : 'Giriş yap'}
          </button>
        </form>
      </div>
    </div>
  );
}

const centerStyle: CSSProperties = {
  minHeight: '100vh',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 24,
};

const labelStyle: CSSProperties = {
  display: 'block',
  fontSize: 13,
  color: 'var(--muted)',
  marginBottom: 6,
};
