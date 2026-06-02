import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  bekleyenDernekleriYukle, dernekBasvurusunuOnayla, dernekBasvurusunuReddet,
  type DernekBasvuru,
} from '../services/operations';
import { firebaseHataMetni, platformYoneticiMi } from '../services/platform';

export default function PlatformApprovalPage() {
  const { firebaseUser } = useAuth();
  const [basvurular, setBasvurular] = useState<DernekBasvuru[]>([]);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [islemYukleniyor, setIslemYukleniyor] = useState<string | null>(null);
  const [redMesaj, setRedMesaj] = useState<Record<string, string>>({});
  const [hata, setHata] = useState('');
  const [basarili, setBasarili] = useState('');
  const [platformYetkili, setPlatformYetkili] = useState<boolean | null>(null);

  const yukle = async () => {
    if (!firebaseUser) return;
    setYukleniyor(true);
    setHata('');
    try {
      const yetkili = await platformYoneticiMi(firebaseUser.uid, firebaseUser.email);
      setPlatformYetkili(yetkili);
      if (!yetkili) {
        setHata(
          'Platform yöneticisi değilsiniz. Firebase Console → platformYoneticiler koleksiyonuna '
          + `UID’nizi (${firebaseUser.uid}) ekleyin veya SEED_ADMIN e-postası ile giriş yapın.`,
        );
        setBasvurular([]);
        return;
      }
      setBasvurular(await bekleyenDernekleriYukle());
    } catch (e) {
      setHata(firebaseHataMetni(e));
      setBasvurular([]);
    } finally {
      setYukleniyor(false);
    }
  };

  useEffect(() => {
    if (firebaseUser) void yukle();
  }, [firebaseUser?.uid]);

  const onayla = async (dernekId: string, dernekAd: string) => {
    if (!firebaseUser) return;
    setIslemYukleniyor(dernekId);
    setHata('');
    try {
      await dernekBasvurusunuOnayla(dernekId, firebaseUser.uid);
      setBasvurular((prev) => prev.filter((b) => b.id !== dernekId));
      setBasarili(`"${dernekAd}" onaylandı.`);
      setTimeout(() => setBasarili(''), 4000);
    } catch (e) {
      setHata(firebaseHataMetni(e));
    } finally {
      setIslemYukleniyor(null);
    }
  };

  const reddet = async (dernekId: string, dernekAd: string) => {
    if (!firebaseUser) return;
    const mesaj = redMesaj[dernekId] ?? '';
    setIslemYukleniyor(dernekId);
    setHata('');
    try {
      await dernekBasvurusunuReddet(dernekId, mesaj, firebaseUser.uid);
      setBasvurular((prev) => prev.filter((b) => b.id !== dernekId));
      setBasarili(`"${dernekAd}" reddedildi.`);
      setTimeout(() => setBasarili(''), 4000);
    } catch (e) {
      setHata(firebaseHataMetni(e));
    } finally {
      setIslemYukleniyor(null);
    }
  };

  if (yukleniyor) return <p style={{ color: 'var(--muted)', padding: 32 }}>Yükleniyor…</p>;

  return (
    <div style={{ padding: '28px 32px', maxWidth: 900, margin: '0 auto' }}>
      <header style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800 }}>Platform — Dernek Onayı</h1>
        <p style={{ color: 'var(--muted)', fontSize: 14, marginTop: 4 }}>
          Sisteme yeni dernek açmak isteyen başvuruları değerlendirin.
        </p>
      </header>

      {hata && <div className="alert-banner alert-danger" style={{ marginBottom: 16 }}>{hata}</div>}
      {platformYetkili === false && (
        <div className="alert-banner alert-warn" style={{ marginBottom: 16 }}>
          Onay/red için Firestore kurallarında tanımlı platform hesabı veya{' '}
          <code style={{ fontSize: 12 }}>platformYoneticiler/{'{uid}'}</code> kaydı gerekir.
          Değişiklikten sonra: <code style={{ fontSize: 12 }}>firebase deploy --only firestore</code>
        </div>
      )}
      {basarili && <div className="alert-banner alert-info" style={{ marginBottom: 16 }}>✓ {basarili}</div>}

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
        <button type="button" className="btn btn-ghost" onClick={yukle} style={{ fontSize: 13 }}>↻ Yenile</button>
      </div>

      {basvurular.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: 40 }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>✓</div>
          <p style={{ color: 'var(--muted)' }}>Onay bekleyen dernek başvurusu yok.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {basvurular.map((b) => (
            <div key={b.id} className="card-elevated" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
                <div>
                  <div style={{ fontSize: 17, fontWeight: 700 }}>{b.ad}</div>
                  <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4, fontFamily: 'monospace' }}>{b.slug} · {b.id}</div>
                  {b.derbisNo && (
                    <div style={{ fontSize: 13, color: 'var(--primary-light)', marginTop: 6, fontWeight: 600 }}>
                      DERBİS: {b.derbisNo}
                    </div>
                  )}
                  <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>
                    Başvuru: {new Date(b.olusturulmaTarihi).toLocaleString('tr-TR')}
                  </div>
                </div>
                <span className="badge badge-amber">Onay bekliyor</span>
              </div>

              <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className="btn btn-primary"
                  style={{ fontSize: 13 }}
                  disabled={islemYukleniyor === b.id}
                  onClick={() => onayla(b.id, b.ad)}
                >
                  {islemYukleniyor === b.id ? '…' : '✓ Onayla'}
                </button>
                <input
                  className="input"
                  style={{ flex: 1, minWidth: 200, fontSize: 13, padding: '8px 12px' }}
                  placeholder="Red gerekçesi (isteğe bağlı)"
                  value={redMesaj[b.id] ?? ''}
                  onChange={(e) => setRedMesaj((p) => ({ ...p, [b.id]: e.target.value }))}
                />
                <button
                  type="button"
                  className="btn btn-ghost"
                  style={{ fontSize: 13, color: 'var(--red)', borderColor: 'var(--red)' }}
                  disabled={islemYukleniyor === b.id}
                  onClick={() => reddet(b.id, b.ad)}
                >
                  ✗ Reddet
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
