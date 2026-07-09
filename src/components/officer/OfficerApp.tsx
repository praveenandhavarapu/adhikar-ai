// ============================================================================
// OfficerApp — the district officer surface. Now a multi-screen, localized,
// gamified tool:
//   Entry flow (O2):  select office → enter phone → select scheme/category
//   Workspace:        left-nav Home / Tickets, with an editable scope breadcrumb
//     • Home (O5):    completion ring, office leaderboard, personal stats,
//                     30-day sparkline, badges, SLA-aging nudge — all derived
//                     from stored tickets + ticket_events (no new API calls).
//     • Tickets:      localized queue + detail; AI analysis read from stored
//                     fields (O1) with an officer-only "Regenerate" button;
//                     routing with recommendation + mandatory comment (O3).
//   Every screen carries a language selector (O4) reusing the citizen i18n.
// ============================================================================
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchTickets, updateTicketStatus, routeTicket, regenerateAnalysis } from '../../lib/api';
import { SCHEMES, schemeLabel, schemeLabelLocalized } from '../../data/schemes';
import { OFFICES, officeLabel, officeName, type OfficeCode } from '../../data/offices';
import { LANGS } from '../../data/languages';
import {
  LocaleContext, useLocale, t as tr, getOfficerLang, saveOfficerLang,
} from '../../data/ui';
import type { Ticket, TicketStatus, SchemeCode } from '../../lib/types';

// ---- scope (persisted for the session) -------------------------------------
interface Scope { office: OfficeCode | 'ALL'; phone: string; category: SchemeCode | 'ALL'; }
const SCOPE_KEY = 'adhikar.officer.scope.v1';

function loadScope(): Scope | null {
  try { const raw = sessionStorage.getItem(SCOPE_KEY); return raw ? JSON.parse(raw) : null; } catch { return null; }
}
function saveScope(s: Scope): void {
  try { sessionStorage.setItem(SCOPE_KEY, JSON.stringify(s)); } catch { /* no-op */ }
}

const C = {
  navy: '#0B3C6B', ink: '#23323f', sub: '#5b7488', line: '#e7edf3',
  bg: '#f4f6f9', green: '#1E9E4A', purple: '#6E3FA3', amber: '#b9770a', red: '#c0392b',
};

// ============================================================================
export default function OfficerApp() {
  const nav = useNavigate();
  const [lang, setLangState] = useState<string>(() => getOfficerLang());
  const [scope, setScope] = useState<Scope | null>(() => loadScope());

  const setLang = (l: string) => { setLangState(l); saveOfficerLang(l); };
  const ctx = useMemo(() => ({ lang, setLang, t: (k: any, v?: any) => tr(lang, k, v) }), [lang]);

  const commitScope = (s: Scope) => { saveScope(s); setScope(s); };
  const clearScope = () => { try { sessionStorage.removeItem(SCOPE_KEY); } catch { /* no-op */ } setScope(null); };

  return (
    <LocaleContext.Provider value={ctx}>
      {scope
        ? <Workspace scope={scope} onChangeScope={clearScope} onBack={() => nav('/')} />
        : <EntryFlow onDone={commitScope} onBack={() => nav('/')} />}
    </LocaleContext.Provider>
  );
}

// ---- language selector (on every screen, O4) -------------------------------
function LangSelect() {
  const { lang, setLang, t } = useLocale();
  return (
    <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#bcd6ef' }}>
      <span>{t('language')}</span>
      <select
        value={lang}
        onChange={(e) => setLang(e.target.value)}
        style={{ background: 'rgba(255,255,255,.15)', color: '#fff', border: 'none', borderRadius: 8, padding: '5px 8px', fontSize: 12.5, fontWeight: 600 }}
      >
        {LANGS.filter((l) => l.code !== 'other').map((l) => (
          <option key={l.code} value={l.code} style={{ color: '#000' }}>{l.native} · {l.roman}</option>
        ))}
      </select>
    </label>
  );
}

// ============================================================================
// Entry flow (O2)
// ============================================================================
function EntryFlow({ onDone, onBack }: { onDone: (s: Scope) => void; onBack: () => void }) {
  const { t } = useLocale();
  const [step, setStep] = useState<'office' | 'phone' | 'category'>('office');
  const [office, setOffice] = useState<OfficeCode | 'ALL'>('ALL');
  const [phone, setPhone] = useState('');
  const { lang } = useLocale();

  return (
    <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', flexDirection: 'column' }}>
      <div style={{ background: C.navy, color: '#fff', padding: '12px 22px', display: 'flex', alignItems: 'center', gap: 18 }}>
        <button onClick={onBack} style={linkBtn}>← {t('back')}</button>
        <div style={{ fontSize: 16, fontWeight: 800 }}>{t('appTitle')}</div>
        <div style={{ marginLeft: 'auto' }}><LangSelect /></div>
      </div>

      <div style={{ flex: 1, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: 28 }}>
        <div style={{ width: 560, maxWidth: '100%', background: '#fff', borderRadius: 16, border: `1px solid ${C.line}`, padding: 26 }}>
          <Steps step={step} />

          {step === 'office' && (
            <>
              <H2>{t('selectOfficeTitle')}</H2>
              <P>{t('selectOfficeSub')}</P>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
                <PickChip active={office === 'ALL'} onClick={() => setOffice('ALL')}>{t('allOffices')}</PickChip>
                {OFFICES.map((o) => (
                  <PickChip key={o} active={office === o} onClick={() => setOffice(o)}>{officeLabel(lang, o)}</PickChip>
                ))}
              </div>
              <Next onClick={() => setStep('phone')} label={t('continue')} />
            </>
          )}

          {step === 'phone' && (
            <>
              <H2>{t('officerPhoneTitle')}</H2>
              <P>{t('officerPhoneSub')}</P>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder={t('officerPhonePh')}
                inputMode="numeric"
                style={{ width: '100%', boxSizing: 'border-box', marginTop: 12, border: `1px solid ${C.line}`, borderRadius: 10, padding: '11px 14px', fontSize: 14, outline: 'none' }}
              />
              <Next onClick={() => setStep('category')} label={t('continue')} disabled={phone.replace(/\D/g, '').length < 10} />
            </>
          )}

          {step === 'category' && (
            <>
              <H2>{t('selectCategoryTitle')}</H2>
              <P>{t('selectCategorySub')}</P>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
                <PickChip active onClick={() => onDone({ office, phone: phone.replace(/\D/g, ''), category: 'ALL' })}>
                  {t('allCategories')}
                </PickChip>
                {SCHEMES.filter((s) => s.value !== 'other').map((s) => (
                  <PickChip key={s.value} active={false}
                    onClick={() => onDone({ office, phone: phone.replace(/\D/g, ''), category: s.value })}>
                    {schemeLabelLocalized(lang, s.value)}
                  </PickChip>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function Steps({ step }: { step: string }) {
  const order = ['office', 'phone', 'category'];
  const idx = order.indexOf(step);
  return (
    <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
      {order.map((s, i) => (
        <div key={s} style={{ flex: 1, height: 4, borderRadius: 2, background: i <= idx ? C.navy : C.line }} />
      ))}
    </div>
  );
}

// ============================================================================
// Workspace: nav + breadcrumb + Home / Tickets
// ============================================================================
function Workspace({ scope, onChangeScope, onBack }: { scope: Scope; onChangeScope: () => void; onBack: () => void }) {
  const { lang, t } = useLocale();
  const [tab, setTab] = useState<'home' | 'tickets'>('home');
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    try { setTickets(await fetchTickets()); setError(''); }
    catch { setError(t('loadError')); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  const officeStr = scope.office === 'ALL' ? null : officeName(scope.office);
  const scopeLabel = scope.office === 'ALL' ? t('allOffices') : officeLabel(lang, scope.office);
  const catLabel = scope.category === 'ALL' ? t('allCategories') : schemeLabelLocalized(lang, scope.category);

  return (
    <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', flexDirection: 'column' }}>
      {/* top bar */}
      <div style={{ background: C.navy, color: '#fff', padding: '12px 22px', display: 'flex', alignItems: 'center', gap: 16 }}>
        <button onClick={onBack} style={linkBtn}>← {t('back')}</button>
        <div style={{ fontSize: 16, fontWeight: 800 }}>{t('appTitle')}</div>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 14 }}>
          <button onClick={load} style={linkBtn}>↻ {t('refresh')}</button>
          <LangSelect />
        </div>
      </div>

      {/* breadcrumb scope */}
      <div style={{ background: '#fff', borderBottom: `1px solid ${C.line}`, padding: '9px 22px', display: 'flex', alignItems: 'center', gap: 10, fontSize: 12.5 }}>
        <span style={{ fontWeight: 700, color: C.sub }}>{t('scope')}:</span>
        <Crumb>{scopeLabel}</Crumb><span style={{ color: '#c3ced8' }}>›</span><Crumb>{catLabel}</Crumb>
        {scope.phone && <span style={{ color: '#a8b6c2' }}>· 📞 {scope.phone}</span>}
        <button onClick={onChangeScope} style={{ marginLeft: 'auto', ...smallBtn }}>{t('change')}</button>
      </div>

      <div style={{ flex: 1, display: 'flex', maxWidth: 1280, margin: '0 auto', width: '100%' }}>
        {/* left nav */}
        <div style={{ width: 150, flexShrink: 0, padding: '16px 10px', display: 'flex', flexDirection: 'column', gap: 6 }}>
          <NavItem active={tab === 'home'} onClick={() => setTab('home')} icon="◎" label={t('navHome')} />
          <NavItem active={tab === 'tickets'} onClick={() => setTab('tickets')} icon="≣" label={t('navTickets')} />
        </div>

        <div style={{ flex: 1, minWidth: 0, padding: '16px 16px 16px 0' }}>
          {tab === 'home'
            ? <Home tickets={tickets} officeStr={officeStr} loading={loading} error={error} />
            : <Tickets tickets={tickets} setTickets={setTickets} scope={scope} officeStr={officeStr}
                loading={loading} error={error} reload={load} />}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Home (O5) — everything aggregated from tickets, no new API calls
// ============================================================================
const MONTHLY_TARGET = 200;

interface OfficeAgg { office: string; raised: number; resolved: number; rate: number; }

function useHomeStats(tickets: Ticket[], officeStr: string | null) {
  return useMemo(() => {
    const now = Date.now();
    const thisMonth = new Date().toISOString().slice(0, 7);
    const scoped = officeStr ? tickets.filter((t) => t.current_office === officeStr) : tickets;
    const resolved = scoped.filter((t) => t.status === 'resolved');
    const pending = scoped.filter((t) => t.status !== 'resolved');
    const resolvedThisMonth = resolved.filter((t) => (t.resolved_at || '').slice(0, 7) === thisMonth).length;

    // completion ring
    const pct = Math.min(1, resolvedThisMonth / MONTHLY_TARGET);
    const remaining = Math.max(0, MONTHLY_TARGET - resolvedThisMonth);

    // avg resolution time (ms)
    const durs = resolved
      .filter((t) => t.resolved_at)
      .map((t) => new Date(t.resolved_at as string).getTime() - new Date(t.created_at).getTime())
      .filter((d) => d >= 0);
    const avgMs = durs.length ? durs.reduce((a, b) => a + b, 0) / durs.length : 0;

    // streak: consecutive days (ending today, today may still be in progress)
    const days = new Set(resolved.map((t) => (t.resolved_at || '').slice(0, 10)).filter(Boolean));
    let streak = 0;
    for (let i = 0; i < 400; i++) {
      const d = new Date(now - i * 86400000).toISOString().slice(0, 10);
      if (days.has(d)) streak++;
      else if (i === 0) continue; // today not over — don't break the streak yet
      else break;
    }

    // 30-day resolved sparkline
    const spark: number[] = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now - i * 86400000).toISOString().slice(0, 10);
      spark.push(resolved.filter((t) => (t.resolved_at || '').slice(0, 10) === d).length);
    }

    // SLA aging (pending beyond threshold)
    const aging = pending.filter((t) => (t.sla === 'pri' ? t.age_days >= 1 : t.age_days >= 2)).length;

    // leaderboard across ALL offices
    const map = new Map<string, OfficeAgg>();
    for (const t of tickets) {
      const o = t.current_office || '—';
      const a = map.get(o) || { office: o, raised: 0, resolved: 0, rate: 0 };
      a.raised++;
      if (t.status === 'resolved') a.resolved++;
      map.set(o, a);
    }
    const board = [...map.values()].map((a) => ({ ...a, rate: a.raised ? a.resolved / a.raised : 0 }))
      .sort((a, b) => b.rate - a.rate || b.resolved - a.resolved);
    const rank = officeStr ? board.findIndex((b) => b.office === officeStr) + 1 : 0;

    return {
      resolvedThisMonth, pct, remaining, avgMs, streak, spark, aging, board, rank,
      resolvedTotal: resolved.length, pendingTotal: pending.length,
    };
  }, [tickets, officeStr]);
}

function Home({ tickets, officeStr, loading, error }: { tickets: Ticket[]; officeStr: string | null; loading: boolean; error: string }) {
  const { lang, t } = useLocale();
  const s = useHomeStats(tickets, officeStr);
  if (loading) return <Panel><Muted>{t('loading')}</Muted></Panel>;
  if (error) return <Panel><Muted err>{error}</Muted></Panel>;

  const badges: string[] = [];
  if (s.resolvedTotal >= 100) badges.push('🏅 ' + '100 ' + t('resolved').toLowerCase());
  if (s.streak >= 7) badges.push('🔥 ' + t('streakDays', { n: 7 }));
  if (s.rank > 0 && s.rank <= 3) badges.push('🏆 Top 3');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* row 1: ring + personal stats */}
      <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: 14 }}>
        <Card>
          <CardTitle>{t('monthlyTarget')}</CardTitle>
          <div style={{ display: 'flex', justifyContent: 'center', padding: '6px 0' }}>
            <Ring pct={s.pct} center={`${Math.round(s.pct * 100)}%`} sub={t('resolvedOfTarget', { n: s.resolvedThisMonth, target: MONTHLY_TARGET })} />
          </div>
          <div style={{ textAlign: 'center', fontSize: 12.5, color: C.sub, fontWeight: 600 }}>
            {t('remaining', { n: s.remaining })}
          </div>
        </Card>

        <Card>
          <CardTitle>{officeStr ? t('yourOffice') : t('allOffices')}</CardTitle>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginTop: 8 }}>
            <Stat n={s.rank > 0 ? `#${s.rank}` : '—'} label={t('rank')} />
            <Stat n={String(s.streak)} label={t('streak')} />
            <Stat n={fmtDur(s.avgMs, t)} label={t('avgResolution')} />
            <Stat n={String(s.resolvedThisMonth)} label={t('resolvedThisMonth')} />
          </div>
          {badges.length > 0 && (
            <>
              <div style={{ fontSize: 11, fontWeight: 800, color: C.sub, letterSpacing: '.5px', marginTop: 14 }}>{t('badges').toUpperCase()}</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
                {badges.map((b, i) => (
                  <span key={i} style={{ fontSize: 12, fontWeight: 700, color: C.navy, background: '#eef4fb', border: '1px solid #d6e6f5', padding: '5px 11px', borderRadius: 14 }}>{b}</span>
                ))}
              </div>
            </>
          )}
          {s.aging > 0 && (
            <div style={{ marginTop: 14, background: '#fff6e9', border: '1px solid #f0dcae', borderRadius: 10, padding: '9px 12px', fontSize: 12.5, color: C.amber, fontWeight: 600 }}>
              ⏰ {t('slaAgingNudge', { n: s.aging })}
            </div>
          )}
        </Card>
      </div>

      {/* row 2: sparkline */}
      <Card>
        <CardTitle>{t('trend30')}</CardTitle>
        <Sparkline values={s.spark} />
      </Card>

      {/* row 3: leaderboard */}
      <Card>
        <CardTitle>{t('officeLeaderboard')}</CardTitle>
        <div style={{ marginTop: 8 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '28px 1fr 70px 70px 90px', gap: 8, fontSize: 11, fontWeight: 800, color: C.sub, padding: '4px 0' }}>
            <span>#</span><span /><span style={{ textAlign: 'right' }}>{t('raised')}</span>
            <span style={{ textAlign: 'right' }}>{t('resolved')}</span><span style={{ textAlign: 'right' }}>{t('resolutionRate')}</span>
          </div>
          {s.board.map((b, i) => {
            const mine = officeStr && b.office === officeStr;
            const officeCode = OFFICES.find((o) => officeName(o) === b.office);
            return (
              <div key={b.office} style={{ display: 'grid', gridTemplateColumns: '28px 1fr 70px 70px 90px', gap: 8, alignItems: 'center', padding: '7px 8px', borderRadius: 8, background: mine ? '#eef4fb' : 'transparent', border: mine ? '1px solid #d6e6f5' : '1px solid transparent' }}>
                <span style={{ fontWeight: 800, color: i < 3 ? C.navy : C.sub }}>{i + 1}</span>
                <span style={{ fontSize: 13, fontWeight: mine ? 800 : 600, color: C.ink }}>
                  {officeCode ? officeLabel(lang, officeCode) : b.office}{mine ? ' ★' : ''}
                </span>
                <span style={{ textAlign: 'right', fontSize: 13, color: C.sub }}>{b.raised}</span>
                <span style={{ textAlign: 'right', fontSize: 13, color: C.green, fontWeight: 700 }}>{b.resolved}</span>
                <span style={{ textAlign: 'right', fontSize: 13, fontWeight: 700, color: C.navy }}>{Math.round(b.rate * 100)}%</span>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}

// ---- hand-rolled SVG ring + sparkline --------------------------------------
function Ring({ pct, center, sub }: { pct: number; center: string; sub: string }) {
  const size = 150, stroke = 14, r = (size - stroke) / 2, circ = 2 * Math.PI * r;
  const dash = circ * pct;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#eef2f6" strokeWidth={stroke} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={C.green} strokeWidth={stroke}
        strokeLinecap="round" strokeDasharray={`${dash} ${circ - dash}`}
        transform={`rotate(-90 ${size / 2} ${size / 2})`} />
      <text x="50%" y="47%" textAnchor="middle" dominantBaseline="middle" fontSize="26" fontWeight="800" fill={C.navy}>{center}</text>
      <text x="50%" y="63%" textAnchor="middle" dominantBaseline="middle" fontSize="9.5" fill={C.sub}>{sub}</text>
    </svg>
  );
}

function Sparkline({ values }: { values: number[] }) {
  const w = 640, h = 70, pad = 4;
  const max = Math.max(1, ...values);
  const step = (w - pad * 2) / Math.max(1, values.length - 1);
  const pts = values.map((v, i) => `${pad + i * step},${h - pad - (v / max) * (h - pad * 2)}`).join(' ');
  const area = `${pad},${h - pad} ${pts} ${pad + (values.length - 1) * step},${h - pad}`;
  return (
    <svg width="100%" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" style={{ marginTop: 8, display: 'block' }}>
      <polygon points={area} fill="rgba(30,158,74,.10)" />
      <polyline points={pts} fill="none" stroke={C.green} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

// ============================================================================
// Tickets workspace (localized queue + detail, O1 regenerate, O3 routing)
// ============================================================================
const STATUS_META: Record<TicketStatus, { key: any; bg: string; fg: string }> = {
  open: { key: 'open', bg: '#e9f2fb', fg: '#1F84D6' },
  progress: { key: 'inProgress', bg: '#fff4e0', fg: '#b9770a' },
  escalated: { key: 'escalated', bg: '#efeaf6', fg: '#6E3FA3' },
  resolved: { key: 'resolved', bg: '#e6f5ec', fg: '#1E9E4A' },
};

function Tickets({ tickets, setTickets, scope, officeStr, loading, error, reload }: {
  tickets: Ticket[]; setTickets: React.Dispatch<React.SetStateAction<Ticket[]>>;
  scope: Scope; officeStr: string | null; loading: boolean; error: string; reload: () => void;
}) {
  const { t } = useLocale();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [fStatus, setFStatus] = useState<'all' | TicketStatus>('all');
  const [toast, setToast] = useState('');

  const filtered = useMemo(() => tickets.filter((tk) => {
    if (officeStr && tk.current_office !== officeStr) return false;
    if (scope.category !== 'ALL' && tk.scheme !== scope.category) return false;
    if (fStatus !== 'all' && tk.status !== fStatus) return false;
    if (search) {
      const q = search.toLowerCase();
      return (tk.name + tk.id + tk.district + tk.english_summary).toLowerCase().includes(q);
    }
    return true;
  }), [tickets, officeStr, scope.category, fStatus, search]);

  const selected = tickets.find((tk) => tk.id === selectedId)
    || (filtered.length ? filtered[0] : null);

  const patchTicket = (id: string, patch: Partial<Ticket>) =>
    setTickets((prev) => prev.map((tk) => (tk.id === id ? { ...tk, ...patch } : tk)));

  const changeStatus = async (id: string, status: TicketStatus) => {
    patchTicket(id, { status });
    try {
      await updateTicketStatus(id, status);
      setToast(`${id} → ${t(STATUS_META[status].key)}`);
      setTimeout(() => setToast(''), 2200);
    } catch { setToast('Update failed — reverting'); reload(); }
  };

  return (
    <div style={{ display: 'flex', gap: 16 }}>
      {/* queue */}
      <div style={{ width: 360, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <input placeholder={t('searchPh')} value={search} onChange={(e) => setSearch(e.target.value)}
          style={{ border: `1px solid ${C.line}`, borderRadius: 10, padding: '10px 14px', fontSize: 13.5, outline: 'none' }} />
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {(['all', 'open', 'progress', 'escalated', 'resolved'] as const).map((s) => (
            <button key={s} onClick={() => setFStatus(s)} style={{
              all: 'unset', cursor: 'pointer', fontSize: 12, fontWeight: 600, padding: '5px 11px', borderRadius: 14,
              background: fStatus === s ? C.navy : '#fff', color: fStatus === s ? '#fff' : C.sub,
              border: '1px solid ' + (fStatus === s ? C.navy : C.line),
            }}>{s === 'all' ? t('all') : t(STATUS_META[s].key)}</button>
          ))}
        </div>
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8, maxHeight: '70vh' }}>
          {loading && <Muted>{t('loading')}</Muted>}
          {error && <Muted err>{error}</Muted>}
          {!loading && !error && filtered.length === 0 && <Muted>{t('noMatch')}</Muted>}
          {filtered.map((tk) => (
            <QueueCard key={tk.id} tk={tk} active={tk.id === selected?.id} onClick={() => setSelectedId(tk.id)} />
          ))}
        </div>
      </div>

      {/* detail */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {selected
          ? <TicketDetail key={selected.id} t={selected} scope={scope} onStatus={changeStatus} onPatch={patchTicket} onReload={reload} />
          : <Muted>{t('selectTicket')}</Muted>}
      </div>

      {toast && (
        <div style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', background: C.navy, color: '#fff', padding: '11px 20px', borderRadius: 10, fontSize: 13.5, fontWeight: 600, boxShadow: '0 8px 30px rgba(0,0,0,.3)', zIndex: 60 }}>{toast}</div>
      )}
    </div>
  );
}

function QueueCard({ tk, active, onClick }: { tk: Ticket; active: boolean; onClick: () => void }) {
  const { t } = useLocale();
  const sm = STATUS_META[tk.status];
  return (
    <button onClick={onClick} style={{
      all: 'unset', cursor: 'pointer', background: '#fff', borderRadius: 12, padding: '12px 14px',
      border: '1.5px solid ' + (active ? C.navy : C.line), boxShadow: active ? '0 4px 14px rgba(11,60,107,.12)' : 'none',
      display: 'flex', flexDirection: 'column', gap: 6,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 12.5, fontWeight: 800, color: C.navy }}>{tk.id}</span>
        {tk.priority && <span style={{ fontSize: 10, fontWeight: 800, color: '#fff', background: C.purple, padding: '2px 7px', borderRadius: 10 }}>PRIORITY</span>}
      </div>
      <div style={{ fontSize: 13.5, color: C.ink, fontWeight: 600 }}>{tk.name} · {tk.district}</div>
      <div style={{ fontSize: 12, color: C.sub, lineHeight: 1.4, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as any }}>{tk.english_summary}</div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 2 }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: sm.fg, background: sm.bg, padding: '2px 9px', borderRadius: 10 }}>{t(sm.key)}</span>
        <span style={{ fontSize: 11, color: '#8aa0b4' }}>{tk.current_office || tk.route}</span>
      </div>
    </button>
  );
}

function TicketDetail({ t: tk, scope, onStatus, onPatch, onReload }: {
  t: Ticket; scope: Scope; onStatus: (id: string, s: TicketStatus) => void;
  onPatch: (id: string, p: Partial<Ticket>) => void; onReload: () => void;
}) {
  const { lang, t } = useLocale();
  const [routing, setRouting] = useState(false);
  const [regen, setRegen] = useState<'idle' | 'busy' | 'error'>('idle');

  const regenerate = async () => {
    setRegen('busy');
    try {
      const r = await regenerateAnalysis(tk.id);
      onPatch(tk.id, { ai_root_cause: r.ai_root_cause, ai_suggested_resolution: r.ai_suggested_resolution, ai_cross_scheme: r.ai_cross_scheme, ai_generated_at: r.ai_generated_at });
      setRegen('idle');
    } catch { setRegen('error'); }
  };

  return (
    <div style={{ background: '#fff', borderRadius: 14, border: `1px solid ${C.line}`, overflow: 'hidden' }}>
      <div style={{ padding: '18px 22px', borderBottom: '1px solid #eef2f6', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontSize: 19, fontWeight: 800, color: C.navy }}>{tk.id}</div>
          <div style={{ fontSize: 13, color: C.sub, marginTop: 2 }}>{tk.name} · {tk.district}, {tk.state} · {schemeLabel(tk.scheme)}</div>
        </div>
        {tk.priority && <span style={{ fontSize: 11, fontWeight: 800, color: '#fff', background: C.purple, padding: '4px 11px', borderRadius: 12 }}>PRIORITY · 24h</span>}
      </div>

      <div style={{ padding: '18px 22px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 22 }}>
        {/* left */}
        <div>
          <Label>{t('citizenWords')} ({tk.lang_label})</Label>
          <p className="adh-native" style={{ fontSize: 13.5, color: C.ink, lineHeight: 1.5, background: '#f7f9fb', padding: '10px 12px', borderRadius: 8, margin: '6px 0 14px' }}>{tk.original_text || '—'}</p>
          <Label>{t('officerSummary')}</Label>
          <p style={{ fontSize: 13.5, color: C.ink, lineHeight: 1.5, margin: '6px 0 14px' }}>{tk.english_summary}</p>
          <Label>{t('structured')}</Label>
          <div style={{ marginTop: 6 }}>
            {tk.detail_rows.map(([k, v], i) => (
              <div key={i} style={{ display: 'flex', gap: 10, padding: '6px 0', borderBottom: '1px solid #f0f3f6' }}>
                <span style={{ fontSize: 12, color: '#6a8199', minWidth: 110, fontWeight: 600 }}>{k}</span>
                <span className="adh-native" style={{ fontSize: 13, color: C.ink }}>{v}</span>
              </div>
            ))}
          </div>
        </div>

        {/* right */}
        <div>
          <div style={{ background: 'linear-gradient(135deg,#f3eefc,#eef4fc)', borderRadius: 12, padding: '14px 16px', border: '1px solid #e3dcf3' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: C.purple, letterSpacing: '.5px' }}>✦ {t('aiAnalysis')}</div>
              {tk.ai_confidence > 0 && <span style={{ fontSize: 10.5, fontWeight: 700, color: C.sub }}>{Math.round(tk.ai_confidence * 100)}%</span>}
            </div>
            {tk.ai_root_cause ? (
              <>
                <AiBlock title={t('rootCause')} body={tk.ai_root_cause} />
                <AiBlock title={t('suggestedAction')} body={tk.ai_suggested_resolution} />
                {tk.ai_cross_scheme.length > 0 && (
                  <div style={{ marginTop: 12 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#6a8199' }}>{t('crossScheme')}</div>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 6 }}>
                      {tk.ai_cross_scheme.map((s) => (
                        <span key={s} style={{ fontSize: 11, fontWeight: 700, color: C.navy, background: '#fff', border: '1px solid #cfe2f3', padding: '3px 9px', borderRadius: 10 }}>{schemeLabel(s)}</span>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : <p style={{ fontSize: 12.5, color: '#6a8199', marginTop: 10 }}>{t('noAnalysis')}</p>}
            <button onClick={regenerate} disabled={regen === 'busy'} style={{ all: 'unset', cursor: regen === 'busy' ? 'default' : 'pointer', marginTop: 12, fontSize: 11.5, fontWeight: 700, color: C.purple, background: '#fff', border: '1px solid #e3dcf3', padding: '5px 11px', borderRadius: 8 }}>
              {regen === 'busy' ? '⏳ ' + t('regenerating') : '↻ ' + t('regenerate')}
            </button>
            {regen === 'error' && <div style={{ fontSize: 11, color: C.red, marginTop: 6 }}>{t('regenError')}</div>}
          </div>

          {/* holding office + routing */}
          <div style={{ marginTop: 16 }}>
            <Label>{t('currentlyWith')}</Label>
            <p style={{ fontSize: 13, color: C.ink, margin: '6px 0 8px', fontWeight: 700 }}>{tk.current_office || tk.route}</p>
            {!routing && <button onClick={() => setRouting(true)} style={actBtn(false)}>↪ {t('route')}</button>}
            {routing && <RoutePanel tk={tk} scope={scope} onDone={() => { setRouting(false); onReload(); }} onCancel={() => setRouting(false)} />}
          </div>

          {/* tracking trail */}
          {tk.events && tk.events.length > 0 && (
            <div style={{ marginTop: 16 }}>
              <Label>{t('trail')}</Label>
              <div style={{ marginTop: 6 }}>
                {[...tk.events].sort((a, b) => a.created_at.localeCompare(b.created_at)).map((e) => (
                  <div key={e.id} style={{ borderLeft: `2px solid ${C.line}`, paddingLeft: 10, marginLeft: 4, paddingBottom: 8 }}>
                    <div style={{ fontSize: 12, color: C.ink, fontWeight: 600 }}>
                      {officeDisplay(lang, e.from_office)} → {officeDisplay(lang, e.to_office)}
                    </div>
                    <div className="adh-native" style={{ fontSize: 12, color: C.sub }}>“{e.comment}”</div>
                    <div style={{ fontSize: 10.5, color: '#a8b6c2' }}>{fmtDateTime(e.created_at)}{e.actor_phone ? ` · ${e.actor_phone}` : ''}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tk.voice_clips && tk.voice_clips.length > 0 && (
            <div style={{ marginTop: 16 }}>
              <Label>{t('voiceNote')}</Label>
              {tk.voice_clips.map((c) => (
                <div key={c.id} style={{ marginTop: 6 }}>
                  <audio controls src={c.url} style={{ width: '100%', height: 38 }} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div style={{ padding: '14px 22px', borderTop: '1px solid #eef2f6', display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        {tk.status !== 'progress' && <button onClick={() => onStatus(tk.id, 'progress')} style={actBtn(false)}>{t('markProgress')}</button>}
        {tk.status !== 'resolved' && <button onClick={() => onStatus(tk.id, 'resolved')} style={actBtn(true)}>{t('resolve')}</button>}
        {tk.status !== 'escalated' && <button onClick={() => onStatus(tk.id, 'escalated')} style={actBtn(false, true)}>{t('escalate')}</button>}
      </div>
    </div>
  );
}

// ---- routing panel (O3): recommendation + override + mandatory comment ------
function RoutePanel({ tk, scope, onDone, onCancel }: { tk: Ticket; scope: Scope; onDone: () => void; onCancel: () => void }) {
  const { lang, t } = useLocale();
  const rec = tk.ai_recommended_office || tk.current_office || '';
  const [target, setTarget] = useState<string>(rec);
  const [comment, setComment] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!comment.trim()) { setErr(t('commentRequired')); return; }
    setBusy(true); setErr('');
    try {
      await routeTicket({ id: tk.id, to_office: target, comment: comment.trim(), actor_phone: scope.phone, from_office: tk.current_office });
      onDone();
    } catch (e: any) { setErr(e?.message || t('regenError')); setBusy(false); }
  };

  return (
    <div style={{ background: '#f7f9fb', border: `1px solid ${C.line}`, borderRadius: 10, padding: 12, marginTop: 8 }}>
      {rec && (
        <div style={{ fontSize: 12.5, color: C.ink, marginBottom: 8 }}>
          <span style={{ fontWeight: 800, color: C.navy }}>{t('recommended')}: </span>
          {t('recommendedRoute', { office: officeDisplay(lang, rec) })}
          <button onClick={() => setTarget(rec)} style={{ all: 'unset', cursor: 'pointer', marginLeft: 8, fontSize: 11.5, fontWeight: 700, color: target === rec ? C.green : C.navy }}>
            {target === rec ? '✓ ' : ''}{t('acceptRec')}
          </button>
        </div>
      )}
      <div style={{ fontSize: 11, fontWeight: 700, color: C.sub, marginBottom: 4 }}>{t('overrideOffice')}</div>
      <select value={target} onChange={(e) => setTarget(e.target.value)}
        style={{ width: '100%', boxSizing: 'border-box', border: `1px solid ${C.line}`, borderRadius: 8, padding: '8px 10px', fontSize: 13, marginBottom: 10 }}>
        {OFFICES.map((o) => <option key={o} value={officeName(o)}>{officeLabel(lang, o)}</option>)}
      </select>
      <div style={{ fontSize: 11, fontWeight: 700, color: C.sub, marginBottom: 4 }}>{t('commentLabel')}</div>
      <textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder={t('commentPh')} rows={2}
        style={{ width: '100%', boxSizing: 'border-box', border: `1px solid ${err ? C.red : C.line}`, borderRadius: 8, padding: '8px 10px', fontSize: 13, resize: 'vertical', fontFamily: 'inherit' }} />
      {err && <div style={{ fontSize: 11.5, color: C.red, marginTop: 4 }}>{err}</div>}
      <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
        <button onClick={submit} disabled={busy} style={actBtn(true)}>{busy ? '…' : t('confirmRoute')}</button>
        <button onClick={onCancel} style={actBtn(false)}>{t('cancel')}</button>
      </div>
    </div>
  );
}

// ---- shared little pieces ---------------------------------------------------
function officeDisplay(lang: string, englishName: string): string {
  const code = OFFICES.find((o) => officeName(o) === englishName);
  return code ? officeLabel(lang, code) : (englishName || '—');
}
function AiBlock({ title, body }: { title: string; body: string }) {
  return (
    <div style={{ marginTop: 12 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: '#6a8199' }}>{title}</div>
      <div style={{ fontSize: 13, color: '#2a2140', lineHeight: 1.5, marginTop: 3 }}>{body}</div>
    </div>
  );
}
function fmtDur(ms: number, t: (k: any, v?: any) => string): string {
  if (!ms) return '—';
  const h = ms / 3600000;
  if (h < 48) return `${Math.round(h)}${t('hours')}`;
  return `${Math.round(h / 24)} ${t('days')}`;
}
function fmtDateTime(iso: string): string {
  try { return new Date(iso).toLocaleString(undefined, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }); }
  catch { return iso; }
}

const linkBtn: React.CSSProperties = { all: 'unset', cursor: 'pointer', fontSize: 12.5, fontWeight: 600, color: '#bcd6ef' };
const smallBtn: React.CSSProperties = { cursor: 'pointer', fontSize: 12, fontWeight: 700, color: C.navy, background: '#eef4fb', border: '1px solid #d6e6f5', padding: '4px 12px', borderRadius: 14 };
function actBtn(primary: boolean, purple = false): React.CSSProperties {
  const bg = primary ? C.green : purple ? C.purple : '#fff';
  const fg = primary || purple ? '#fff' : C.navy;
  const bd = primary ? C.green : purple ? C.purple : '#cfe2f3';
  return { all: 'unset', cursor: 'pointer', background: bg, color: fg, border: '1.5px solid ' + bd, padding: '9px 16px', borderRadius: 10, fontSize: 13, fontWeight: 700 };
}
const Panel = ({ children }: { children: React.ReactNode }) => <div style={{ padding: 8 }}>{children}</div>;
const Card = ({ children }: { children: React.ReactNode }) => (
  <div style={{ background: '#fff', borderRadius: 14, border: `1px solid ${C.line}`, padding: '16px 18px' }}>{children}</div>
);
const CardTitle = ({ children }: { children: React.ReactNode }) => (
  <div style={{ fontSize: 11.5, fontWeight: 800, color: C.sub, letterSpacing: '.5px', textTransform: 'uppercase' }}>{children}</div>
);
const H2 = ({ children }: { children: React.ReactNode }) => <div style={{ fontSize: 19, fontWeight: 800, color: C.navy }}>{children}</div>;
const P = ({ children }: { children: React.ReactNode }) => <div style={{ fontSize: 13.5, color: C.sub, marginTop: 4 }}>{children}</div>;
const Label = ({ children }: { children: React.ReactNode }) => (
  <div style={{ fontSize: 11, fontWeight: 800, color: '#8aa0b4', letterSpacing: '.5px', textTransform: 'uppercase' }}>{children}</div>
);
const Muted = ({ children, err }: { children: React.ReactNode; err?: boolean }) => (
  <div style={{ background: '#fff', borderRadius: 12, border: '1px dashed ' + (err ? '#e0b4b4' : C.line), padding: 28, textAlign: 'center', color: err ? C.red : '#8aa0b4', fontSize: 13.5 }}>{children}</div>
);
const Stat = ({ n, label }: { n: string; label: string }) => (
  <div style={{ textAlign: 'center', background: '#f7f9fb', borderRadius: 10, padding: '10px 6px' }}>
    <div style={{ fontSize: 18, fontWeight: 800, color: C.navy }}>{n}</div>
    <div style={{ fontSize: 10.5, color: C.sub, marginTop: 2, lineHeight: 1.2 }}>{label}</div>
  </div>
);
const Crumb = ({ children }: { children: React.ReactNode }) => (
  <span style={{ fontWeight: 700, color: C.ink }}>{children}</span>
);
function NavItem({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: string; label: string }) {
  return (
    <button onClick={onClick} style={{
      all: 'unset', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 9, padding: '10px 12px', borderRadius: 10,
      background: active ? '#fff' : 'transparent', border: '1px solid ' + (active ? C.line : 'transparent'),
      color: active ? C.navy : C.sub, fontWeight: active ? 800 : 600, fontSize: 13.5,
      boxShadow: active ? '0 2px 8px rgba(11,60,107,.06)' : 'none',
    }}><span style={{ fontSize: 16 }}>{icon}</span>{label}</button>
  );
}
function PickChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} style={{
      all: 'unset', cursor: 'pointer', fontSize: 13, fontWeight: 600, padding: '9px 14px', borderRadius: 12,
      background: active ? C.navy : '#fff', color: active ? '#fff' : C.navy,
      border: '1.5px solid ' + (active ? C.navy : '#cfe2f3'),
    }}>{children}</button>
  );
}
function Next({ onClick, label, disabled }: { onClick: () => void; label: string; disabled?: boolean }) {
  return (
    <button onClick={() => !disabled && onClick()} disabled={disabled} style={{
      all: 'unset', cursor: disabled ? 'default' : 'pointer', marginTop: 20, background: disabled ? '#b8c6d3' : C.navy,
      color: '#fff', padding: '11px 22px', borderRadius: 10, fontSize: 14, fontWeight: 700, display: 'inline-block',
    }}>{label} →</button>
  );
}
