import { useCallback, useEffect, useState, type ReactNode } from 'react';
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, CartesianGrid, Legend,
} from 'recharts';
import { useAuth } from '../context/AuthContext';
import { dernekGetir } from '../services/dernek';
import { dernekIstatistikleriYukle } from '../services/analytics';
import { FEATURE_PAKETLERI } from '../constants/modules';
import { dernekPaketAktif, dashboardOzetMetni } from '../utils/paketler';
import type { DashboardStats, DernekDoc, FeaturePaketId } from '../types';
import DashboardAlerts from '../components/DashboardAlerts';

const DONUT_COLORS = ['#22c55e', '#f59e0b', '#7a86a0'];
const BURS_DONUT_COLORS = ['#22c55e', '#f59e0b', '#ef4444'];
const CHART_TOOLTIP = { background: '#0f1422', border: '1px solid #252d45', borderRadius: 10, fontSize: 13 };

// ── Custom Tooltip ──────────────────────────────────────
function ChartTooltip({ active, payload, label }: {
  active?: boolean; payload?: { name: string; value: number; fill?: string; color?: string }[]; label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ ...CHART_TOOLTIP, padding: '10px 14px', boxShadow: '0 4px 20px rgba(0,0,0,0.5)' }}>
      <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 8 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text)' }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: p.fill ?? p.color, display: 'inline-block', flexShrink: 0 }} />
          <span style={{ color: 'var(--muted)' }}>{p.name}:</span>
          <strong>{p.value}</strong>
        </div>
      ))}
    </div>
  );
}

// ── Progress ring for aidat ─────────────────────────────
function RingProgress({ value, size = 80 }: { value: number; size?: number }) {
  const r = (size - 12) / 2;
  const circ = 2 * Math.PI * r;
  const filled = circ * (value / 100);
  const color = value >= 80 ? 'var(--green)' : value >= 50 ? 'var(--amber)' : 'var(--red)';
  return (
    <svg width={size} height={size}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--surface3)" strokeWidth={8} />
      <circle
        cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke={color} strokeWidth={8} strokeLinecap="round"
        strokeDasharray={`${filled} ${circ}`}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ transition: 'stroke-dasharray 0.7s ease' }}
      />
      <text x="50%" y="50%" dominantBaseline="middle" textAnchor="middle" fill="var(--text)" fontSize={16} fontWeight={700}>
        {value}%
      </text>
    </svg>
  );
}

// ── KPI Card ────────────────────────────────────────────
function KpiCard({
  label, value, icon, color, sub, subType = 'neutral',
}: {
  label: string;
  value: number | string;
  icon: string;
  color: 'blue' | 'green' | 'amber' | 'red' | 'purple' | 'cyan';
  sub?: string;
  subType?: 'up' | 'down' | 'warn' | 'neutral';
}) {
  return (
    <div className={`kpi-card kpi-${color} fade-up`}>
      <div className="kpi-icon">{icon}</div>
      <div className="kpi-value">{value}</div>
      <div className="kpi-label">{label}</div>
      {sub && (
        <div className={`kpi-sub kpi-sub-${subType}`}>
          {subType === 'up' && '▲'}
          {subType === 'down' && '▼'}
          {subType === 'warn' && '⚠'}
          <span>{sub}</span>
        </div>
      )}
    </div>
  );
}

// ── Section header ──────────────────────────────────────
function SectionHeader({ title, sub }: { title: string; sub?: string }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>{title}</h2>
      {sub && <p style={{ fontSize: 13, color: 'var(--muted)', marginTop: 3 }}>{sub}</p>}
    </div>
  );
}

function kpiKartlariOlustur(
  s: DashboardStats,
  paketler: FeaturePaketId[] | undefined,
  uyeOrani: number,
): ReactNode[] {
  const p = (id: FeaturePaketId) => dernekPaketAktif(paketler, id);
  const kartlar: ReactNode[] = [];
  if (p('uyelik')) {
    kartlar.push(
      <KpiCard
        key="uyelik-toplam"
        label="Toplam üyelik"
        value={s.toplamUyelik}
        icon="👥"
        color="blue"
        sub={`%${uyeOrani} aktif`}
        subType="neutral"
      />,
      <KpiCard
        key="uyelik-aktif"
        label="Aktif üye"
        value={s.aktifUye}
        icon="✅"
        color="green"
        sub={s.adayBekleyen > 0 ? `${s.adayBekleyen} onay bekliyor` : 'Onay bekleyen yok'}
        subType={s.adayBekleyen > 0 ? 'warn' : 'neutral'}
      />,
    );
  }
  if (p('odalar')) {
    kartlar.push(
      <KpiCard
        key="rez"
        label="Toplam rezervasyon"
        value={s.toplamRezervasyon}
        icon="🏠"
        color="purple"
        sub={s.bekleyenRezervasyon > 0 ? `${s.bekleyenRezervasyon} beklemede` : 'Bekleyen yok'}
        subType={s.bekleyenRezervasyon > 0 ? 'warn' : 'neutral'}
      />,
    );
  }
  if (p('etkinlikler')) {
    kartlar.push(
      <KpiCard
        key="etk"
        label="Etkinlik"
        value={s.toplamEtkinlik}
        icon="🗓️"
        color="cyan"
        sub={`${s.yaklasanEtkinlik} yaklaşan`}
        subType={s.yaklasanEtkinlik > 0 ? 'up' : 'neutral'}
      />,
    );
  }
  if (p('burslar')) {
    kartlar.push(
      <KpiCard
        key="burs"
        label="Burs başvurusu"
        value={s.toplamBursBasvuru}
        icon="🎓"
        color="amber"
        sub={
          s.bekleyenBurs > 0
            ? `${s.bekleyenBurs} beklemede`
            : s.onaylanmisBurs > 0
              ? `${s.onaylanmisBurs} onaylı`
              : 'Bekleyen yok'
        }
        subType={s.bekleyenBurs > 0 ? 'warn' : 'neutral'}
      />,
    );
  }
  if (p('kutuphane')) {
    kartlar.push(
      <KpiCard
        key="odunc"
        label="Ödünç kitap"
        value={s.aktifOdunc}
        icon="📚"
        color={s.gecikliOdunc > 0 ? 'red' : 'green'}
        sub={s.gecikliOdunc > 0 ? `${s.gecikliOdunc} gecikmiş!` : `Toplam: ${s.toplamOdunc}`}
        subType={s.gecikliOdunc > 0 ? 'down' : 'neutral'}
      />,
    );
  }
  if (p('aidat')) {
    kartlar.push(
      <KpiCard
        key="aidat"
        label="Aidat tahsilat"
        value={`%${s.aidatOdemeOrani}`}
        icon="💳"
        color={s.odenmemisAidat > 0 ? 'amber' : 'green'}
        sub={`${s.odenmisAidat} ödendi · ${s.odenmemisAidat} bekliyor`}
        subType={s.odenmemisAidat > 0 ? 'warn' : 'neutral'}
      />,
    );
  }
  if (p('gonulluluk')) {
    kartlar.push(
      <KpiCard
        key="gonullu"
        label="Gönüllü görev"
        value={s.toplamGonulluGorev}
        icon="🤝"
        color="cyan"
        sub={s.bekleyenGonulluBasvuru > 0 ? `${s.bekleyenGonulluBasvuru} başvuru bekliyor` : `${s.acikGonulluGorev} açık görev`}
        subType={s.bekleyenGonulluBasvuru > 0 ? 'warn' : 'neutral'}
      />,
    );
  }
  if (p('envanter')) {
    kartlar.push(
      <KpiCard
        key="envanter"
        label="Demirbaş"
        value={s.toplamEnvanter}
        icon="📦"
        color="amber"
        sub={`${s.aktifZimmet} aktif zimmet`}
        subType={s.aktifZimmet > 0 ? 'warn' : 'neutral'}
      />,
    );
  }
  return kartlar;
}

// ── Main Page ───────────────────────────────────────────
export default function DashboardPage() {
  const { seciliDernekId, seciliDernekAd } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [dernek, setDernek] = useState<DernekDoc | null>(null);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [hata, setHata] = useState('');
  const [sonGuncelleme, setSonGuncelleme] = useState<Date | null>(null);

  const veriYukle = useCallback(async (id: string) => {
    setYukleniyor(true);
    setHata('');
    try {
      const d = await dernekGetir(id);
      const s = await dernekIstatistikleriYukle(id, d?.paketler ?? []);
      setDernek(d);
      setStats(s);
      setSonGuncelleme(new Date());
    } catch {
      setHata('Veriler yüklenemedi. Firestore bağlantısını ve kuralları kontrol edin.');
    } finally {
      setYukleniyor(false);
    }
  }, []);

  useEffect(() => {
    if (!seciliDernekId) return;
    let iptal = false;
    veriYukle(seciliDernekId).catch(() => { if (!iptal) setHata('Yükleme hatası.'); });
    return () => { iptal = true; };
  }, [seciliDernekId, veriYukle]);

  if (!seciliDernekId) {
    return (
      <div style={{ padding: 40, color: 'var(--muted)' }}>Lütfen sol menüden bir dernek seçin.</div>
    );
  }

  if (yukleniyor) {
    return <LoadingState />;
  }

  if (hata || !stats) {
    return (
      <div style={{ padding: 40 }}>
        <div className="alert-banner alert-danger">{hata || 'Veri bulunamadı.'}</div>
      </div>
    );
  }

  const s = stats;
  const paketler = dernek?.paketler;
  const p = (id: FeaturePaketId) => dernekPaketAktif(paketler, id);
  const uyeOrani = s.toplamUyelik > 0 ? Math.round((s.aktifUye / s.toplamUyelik) * 100) : 0;

  const kpiKartlari = kpiKartlariOlustur(s, paketler, uyeOrani);

  const grafikSatir1 = p('uyelik') || p('odalar');
  const grafikSatir2 = p('aidat') || (p('uyelik') && s.uyelikDurumDagilim.length > 0);
  const grafikSatir3 = p('odalar') && s.rezervasyonDurumDagilim.length > 0;
  const grafikSatirBurs = p('burslar');
  const bursOdemeOrani = s.onaylanmisBurs > 0
    ? Math.round((s.bursOdenmisOdeme / s.onaylanmisBurs) * 100)
    : 0;

  return (
    <div style={{ padding: '28px 32px', maxWidth: 1400, margin: '0 auto' }}>

      {/* ── Page header ──────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.5px', color: 'var(--text)' }}>
            {seciliDernekAd ?? 'Dernek'}
          </h1>
          <p style={{ color: 'var(--muted)', fontSize: 14, marginTop: 4 }}>
            {dashboardOzetMetni(paketler)}
            {p('acikKapali') && dernek?.dernekDurumu?.acik === false && (
              <span className="badge badge-amber" style={{ marginLeft: 10 }}>⚠ Dernek kapalı</span>
            )}
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {sonGuncelleme && (
            <span style={{ fontSize: 12, color: 'var(--muted)' }}>
              Güncellendi: {sonGuncelleme.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
          <button
            type="button"
            className="btn-icon"
            title="Yenile"
            onClick={() => seciliDernekId && veriYukle(seciliDernekId)}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M23 4v6h-6M1 20v-6h6" />
              <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />
            </svg>
          </button>
        </div>
      </div>

      {/* ── Bildirimler (kapatılabilir) ───────────────── */}
      <DashboardAlerts dernekId={seciliDernekId} stats={s} paketler={paketler} />

      {/* ── KPI grid (aktif modüllere göre) ───────────── */}
      {kpiKartlari.length > 0 ? (
        <>
          <SectionHeader title="Genel bakış" sub="Açık modüllere ait istatistikler" />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: 14, marginBottom: 32 }}>
            {kpiKartlari}
          </div>
        </>
      ) : (
        <div className="card fade-up" style={{ marginBottom: 24, padding: 24, textAlign: 'center' }}>
          <p style={{ color: 'var(--muted)', fontSize: 14 }}>
            Bu dernek için dashboard KPI’sı gösterecek modül seçilmemiş.
          </p>
          <a href="/moduller" className="btn btn-primary" style={{ marginTop: 14, fontSize: 13 }}>
            Modülleri yapılandır →
          </a>
        </div>
      )}

      {/* ── Charts row 1: Üyelik + Rezervasyon ─────────── */}
      {grafikSatir1 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 16, marginBottom: 16 }}>
          {p('uyelik') && (
            <div className="chart-card fade-up">
              <div className="chart-card-title">Yeni üye trendi</div>
              <div className="chart-card-sub">Son 6 aylık üyelik başvurusu</div>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={s.aylikYeniUye} margin={{ left: -20, right: 4 }}>
                  <defs>
                    <linearGradient id="gradBlue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#4f6ef7" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="#4f6ef7" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e253d" />
                  <XAxis dataKey="ay" tick={{ fill: '#7a86a0', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#7a86a0', fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip content={<ChartTooltip />} />
                  <Area type="monotone" dataKey="deger" name="Yeni üye" stroke="#4f6ef7" strokeWidth={2.5} fill="url(#gradBlue)" dot={{ r: 3, fill: '#4f6ef7', strokeWidth: 0 }} activeDot={{ r: 5 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
          {p('odalar') && (
            <div className="chart-card fade-up">
              <div className="chart-card-title">Rezervasyon trendi</div>
              <div className="chart-card-sub">Son 6 aylık rezervasyon sayısı</div>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={s.aylikRezervasyon} margin={{ left: -20, right: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e253d" />
                  <XAxis dataKey="ay" tick={{ fill: '#7a86a0', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#7a86a0', fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip content={<ChartTooltip />} />
                  <Bar dataKey="deger" name="Rezervasyon" fill="#a855f7" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}

      {/* ── Charts row 2: Aidat + Üyelik dağılımı ──────── */}
      {grafikSatir2 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 16, marginBottom: 16 }}>
          {p('aidat') && (
            <div className="chart-card fade-up">
              <div className="chart-card-title">Aidat tahsilat durumu</div>
              <div className="chart-card-sub">{s.odenmisAidat} ödendi / {s.odenmisAidat + s.odenmemisAidat} toplam kayıt</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 28, marginTop: 8 }}>
                <RingProgress value={s.aidatOdemeOrani} size={96} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, flex: 1 }}>
                  <ProgressItem
                    label="Ödendi"
                    value={s.odenmisAidat}
                    total={s.odenmisAidat + s.odenmemisAidat}
                    colorClass="progress-green"
                    badgeClass="badge-green"
                  />
                  <ProgressItem
                    label="Ödenmedi"
                    value={s.odenmemisAidat}
                    total={s.odenmisAidat + s.odenmemisAidat}
                    colorClass={s.odenmemisAidat > 0 ? 'progress-red' : 'progress-green'}
                    badgeClass={s.odenmemisAidat > 0 ? 'badge-red' : 'badge-muted'}
                  />
                </div>
              </div>
              {s.aylikAidat.some((x) => x.deger > 0) && (
                <div style={{ marginTop: 20 }}>
                  <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 8 }}>Aylık ödeme</div>
                  <ResponsiveContainer width="100%" height={90}>
                    <BarChart data={s.aylikAidat} margin={{ left: -20, right: 4 }}>
                      <XAxis dataKey="ay" tick={{ fill: '#7a86a0', fontSize: 10 }} axisLine={false} tickLine={false} />
                      <YAxis hide allowDecimals={false} />
                      <Tooltip content={<ChartTooltip />} />
                      <Bar dataKey="deger" name="Ödenen" fill="#22c55e" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          )}
          {p('uyelik') && s.uyelikDurumDagilim.length > 0 && (
            <div className="chart-card fade-up">
              <div className="chart-card-title">Üyelik durumu dağılımı</div>
              <div className="chart-card-sub">Toplam {s.toplamUyelik} üyelik kaydı</div>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={s.uyelikDurumDagilim}
                    dataKey="deger"
                    nameKey="ad"
                    cx="50%"
                    cy="50%"
                    innerRadius={58}
                    outerRadius={90}
                    paddingAngle={3}
                  >
                    {s.uyelikDurumDagilim.map((_, i) => (
                      <Cell key={i} fill={DONUT_COLORS[i % DONUT_COLORS.length]} strokeWidth={0} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={CHART_TOOLTIP}
                    itemStyle={{ color: 'var(--text)' }}
                    labelStyle={{ color: 'var(--muted)' }}
                  />
                  <Legend
                    iconType="circle"
                    iconSize={8}
                    formatter={(v) => <span style={{ color: 'var(--muted)', fontSize: 12 }}>{v}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}

      {/* ── Charts row 3: Rezervasyon dağılımı ─────────── */}
      {grafikSatir3 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 16, marginBottom: 16 }}>
          <div className="chart-card fade-up">
            <div className="chart-card-title">Rezervasyon durumu</div>
            <div className="chart-card-sub">Toplam {s.toplamRezervasyon} rezervasyon</div>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={s.rezervasyonDurumDagilim} layout="vertical" margin={{ left: 0, right: 16 }}>
                <XAxis type="number" tick={{ fill: '#7a86a0', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="ad" width={90} tick={{ fill: '#7a86a0', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="deger" name="Adet" fill="#4f6ef7" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* ── Charts row 4: Burs başvuruları ─────────────── */}
      {grafikSatirBurs && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 16, marginBottom: 16 }}>
          <div className="chart-card fade-up">
            <div className="chart-card-title">Burs başvuru trendi</div>
            <div className="chart-card-sub">Son 6 aylık başvuru sayısı</div>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={s.aylikBursBasvuru} margin={{ left: -20, right: 4 }}>
                <defs>
                  <linearGradient id="gradAmber" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#f59e0b" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e253d" />
                <XAxis dataKey="ay" tick={{ fill: '#7a86a0', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#7a86a0', fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip content={<ChartTooltip />} />
                <Area
                  type="monotone"
                  dataKey="deger"
                  name="Başvuru"
                  stroke="#f59e0b"
                  strokeWidth={2.5}
                  fill="url(#gradAmber)"
                  dot={{ r: 3, fill: '#f59e0b', strokeWidth: 0 }}
                  activeDot={{ r: 5 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {s.bursDurumDagilim.length > 0 && (
            <div className="chart-card fade-up">
              <div className="chart-card-title">Burs başvuru durumu</div>
              <div className="chart-card-sub">
                Toplam {s.toplamBursBasvuru} başvuru
                {s.reddedilenBurs > 0 && ` · ${s.reddedilenBurs} reddedildi`}
              </div>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={s.bursDurumDagilim}
                    dataKey="deger"
                    nameKey="ad"
                    cx="50%"
                    cy="50%"
                    innerRadius={58}
                    outerRadius={90}
                    paddingAngle={3}
                  >
                    {s.bursDurumDagilim.map((_, i) => (
                      <Cell key={i} fill={BURS_DONUT_COLORS[i % BURS_DONUT_COLORS.length]} strokeWidth={0} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={CHART_TOOLTIP}
                    itemStyle={{ color: 'var(--text)' }}
                    labelStyle={{ color: 'var(--muted)' }}
                  />
                  <Legend
                    iconType="circle"
                    iconSize={8}
                    formatter={(v) => <span style={{ color: 'var(--muted)', fontSize: 12 }}>{v}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}

          {s.onaylanmisBurs > 0 && (
            <div className="chart-card fade-up">
              <div className="chart-card-title">Burs ödeme durumu</div>
              <div className="chart-card-sub">
                {s.bursOdenmisOdeme} ödendi / {s.onaylanmisBurs} onaylı başvuru
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 28, marginTop: 8 }}>
                <RingProgress value={bursOdemeOrani} size={96} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, flex: 1 }}>
                  <ProgressItem
                    label="Ödeme yapıldı"
                    value={s.bursOdenmisOdeme}
                    total={s.onaylanmisBurs}
                    colorClass="progress-green"
                    badgeClass="badge-green"
                  />
                  <ProgressItem
                    label="Ödeme bekliyor"
                    value={s.bursBekleyenOdeme}
                    total={s.onaylanmisBurs}
                    colorClass={s.bursBekleyenOdeme > 0 ? 'progress-amber' : 'progress-green'}
                    badgeClass={s.bursBekleyenOdeme > 0 ? 'badge-amber' : 'badge-muted'}
                  />
                </div>
              </div>
              {s.bursOdemeDagilim.length > 1 && (
                <div style={{ marginTop: 20 }}>
                  <ResponsiveContainer width="100%" height={120}>
                    <BarChart data={s.bursOdemeDagilim} layout="vertical" margin={{ left: 0, right: 16 }}>
                      <XAxis type="number" tick={{ fill: '#7a86a0', fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                      <YAxis type="category" dataKey="ad" width={110} tick={{ fill: '#7a86a0', fontSize: 11 }} axisLine={false} tickLine={false} />
                      <Tooltip content={<ChartTooltip />} />
                      <Bar dataKey="deger" name="Adet" fill="#f59e0b" radius={[0, 6, 6, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── Active modules ────────────────────────────── */}
      <div className="card fade-up" style={{ marginTop: 8 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700 }}>Aktif modüller</div>
            <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>
              {(dernek?.paketler?.length ?? 0)} / {FEATURE_PAKETLERI.length} modül aktif
            </div>
          </div>
          <a href="/moduller" className="btn btn-ghost" style={{ fontSize: 12, padding: '7px 12px' }}>
            Düzenle →
          </a>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {FEATURE_PAKETLERI.map(({ id, etiket, icon }) => {
            const aktif = dernek?.paketler?.includes(id) ?? false;
            return (
              <span
                key={id}
                className={aktif ? 'badge badge-blue' : 'badge badge-muted'}
                style={{ fontSize: 12, padding: '5px 12px', borderRadius: 8, gap: 6, display: 'inline-flex', alignItems: 'center' }}
              >
                <span>{icon}</span> {etiket}
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Sub-components ──────────────────────────────────────

function ProgressItem({
  label, value, total, colorClass, badgeClass,
}: {
  label: string; value: number; total: number; colorClass: string; badgeClass: string;
}) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
        <span style={{ fontSize: 12, color: 'var(--muted)' }}>{label}</span>
        <span className={`badge ${badgeClass}`}>{value} <span style={{ opacity: 0.6 }}>({pct}%)</span></span>
      </div>
      <div className="progress-track">
        <div className={`progress-fill ${colorClass}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function LoadingState() {
  return (
    <div style={{ padding: '28px 32px' }}>
      <div style={{ marginBottom: 28 }}>
        <div style={{ width: 200, height: 28, background: 'var(--surface2)', borderRadius: 8, marginBottom: 10 }} />
        <div style={{ width: 300, height: 16, background: 'var(--surface2)', borderRadius: 6 }} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: 14, marginBottom: 24 }}>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} style={{ height: 110, background: 'var(--surface)', borderRadius: 14, border: '1px solid var(--border-subtle)', animation: 'fadeUp 0.3s ease both', animationDelay: `${i * 0.05}s` }} />
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 16 }}>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} style={{ height: 240, background: 'var(--surface)', borderRadius: 14, border: '1px solid var(--border-subtle)' }} />
        ))}
      </div>
    </div>
  );
}

