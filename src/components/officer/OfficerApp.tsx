// ============================================================================
// OfficerApp — triage dashboard. Reads live tickets from Supabase (via the
// tickets function) and shows the officer-side AI analysis that was generated
// once at intake and persisted. Resolve / escalate writes back to the DB.
// ============================================================================
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchTickets, updateTicketStatus } from '../../lib/api';
import { schemeLabel } from '../../data/schemes';
import type { Ticket, TicketStatus } from '../../lib/types';

const STATUS_META: Record<TicketStatus, { label: string; bg: string; fg: string }> = {
  open: { label: 'Open', bg: '#e9f2fb', fg: '#1F84D6' },
  progress: { label: 'In progress', bg: '#fff4e0', fg: '#b9770a' },
  escalated: { label: 'Escalated', bg: '#efeaf6', fg: '#6E3FA3' },
  resolved: { label: 'Resolved', bg: '#e6f5ec', fg: '#1E9E4A' },
};

export default function OfficerApp() {
  const nav = useNavigate();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [fStatus, setFStatus] = useState<'all' | TicketStatus>('all');
  const [toast, setToast] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const t = await fetchTickets();
      setTickets(t);
      setError('');
      if (!selectedId && t.length) setSelectedId(t[0].id);
    } catch {
      setError('Could not load tickets. Check that the database is configured.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  const filtered = useMemo(() => {
    return tickets.filter((t) => {
      if (fStatus !== 'all' && t.status !== fStatus) return false;
      if (search) {
        const q = search.toLowerCase();
        return (t.name + t.id + t.district + t.english_summary).toLowerCase().includes(q);
      }
      return true;
    });
  }, [tickets, fStatus, search]);

  const selected = tickets.find((t) => t.id === selectedId) || null;

  const changeStatus = async (id: string, status: TicketStatus) => {
    setTickets((prev) => prev.map((t) => (t.id === id ? { ...t, status } : t)));
    try {
      await updateTicketStatus(id, status);
      setToast(`${id} → ${STATUS_META[status].label}`);
      setTimeout(() => setToast(''), 2200);
    } catch {
      setToast('Update failed — reverting');
      load();
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f4f6f9', display: 'flex', flexDirection: 'column' }}>
      <TopBar onBack={() => nav('/')} onRefresh={load} counts={countByStatus(tickets)} />

      <div style={{ flex: 1, display: 'flex', maxWidth: 1280, margin: '0 auto', width: '100%', gap: 16, padding: 16, boxSizing: 'border-box' }}>
        {/* Queue */}
        <div style={{ width: 380, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <input
            placeholder="Search name, district, ID…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ border: '1px solid #dce3ea', borderRadius: 10, padding: '10px 14px', fontSize: 13.5, outline: 'none' }}
          />
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {(['all', 'open', 'progress', 'escalated', 'resolved'] as const).map((s) => (
              <button key={s} onClick={() => setFStatus(s)} style={{
                all: 'unset', cursor: 'pointer', fontSize: 12, fontWeight: 600, padding: '5px 11px', borderRadius: 14,
                background: fStatus === s ? '#0B3C6B' : '#fff', color: fStatus === s ? '#fff' : '#5b7488',
                border: '1px solid ' + (fStatus === s ? '#0B3C6B' : '#dce3ea'),
              }}>{s === 'all' ? 'All' : STATUS_META[s].label}</button>
            ))}
          </div>

          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {loading && <Empty>Loading tickets…</Empty>}
            {error && <Empty error>{error}</Empty>}
            {!loading && !error && filtered.length === 0 && <Empty>No tickets match this filter.</Empty>}
            {filtered.map((t) => (
              <QueueCard key={t.id} t={t} active={t.id === selectedId} onClick={() => setSelectedId(t.id)} />
            ))}
          </div>
        </div>

        {/* Detail */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {selected
            ? <TicketDetail t={selected} onStatus={changeStatus} />
            : <Empty>Select a ticket to view details.</Empty>}
        </div>
      </div>

      {toast && (
        <div style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', background: '#0B3C6B', color: '#fff', padding: '11px 20px', borderRadius: 10, fontSize: 13.5, fontWeight: 600, boxShadow: '0 8px 30px rgba(0,0,0,.3)', zIndex: 60 }}>{toast}</div>
      )}
    </div>
  );
}

// ---- queue card ------------------------------------------------------------
function QueueCard({ t, active, onClick }: { t: Ticket; active: boolean; onClick: () => void }) {
  const sm = STATUS_META[t.status];
  const sla = slaInfo(t);
  return (
    <button onClick={onClick} style={{
      all: 'unset', cursor: 'pointer', background: '#fff', borderRadius: 12, padding: '12px 14px',
      border: '1.5px solid ' + (active ? '#0B3C6B' : '#e7edf3'), boxShadow: active ? '0 4px 14px rgba(11,60,107,.12)' : 'none',
      display: 'flex', flexDirection: 'column', gap: 6,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 12.5, fontWeight: 800, color: '#0B3C6B', letterSpacing: '.3px' }}>{t.id}</span>
        {t.priority && <span style={{ fontSize: 10, fontWeight: 800, color: '#fff', background: '#6E3FA3', padding: '2px 7px', borderRadius: 10 }}>PRIORITY</span>}
      </div>
      <div style={{ fontSize: 13.5, color: '#23323f', fontWeight: 600 }}>{t.name} · {t.district}</div>
      <div style={{ fontSize: 12, color: '#5b7488', lineHeight: 1.4, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as any }}>{t.english_summary}</div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 2 }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: sm.fg, background: sm.bg, padding: '2px 9px', borderRadius: 10 }}>{sm.label}</span>
        <span style={{ fontSize: 11, fontWeight: 600, color: sla.fg }}>{sla.text}</span>
      </div>
    </button>
  );
}

// ---- ticket detail ---------------------------------------------------------
function TicketDetail({ t, onStatus }: { t: Ticket; onStatus: (id: string, s: TicketStatus) => void }) {
  return (
    <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #e7edf3', overflow: 'hidden' }}>
      <div style={{ padding: '18px 22px', borderBottom: '1px solid #eef2f6', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontSize: 19, fontWeight: 800, color: '#0B3C6B' }}>{t.id}</div>
          <div style={{ fontSize: 13, color: '#5b7488', marginTop: 2 }}>{t.name} · {t.district}, {t.state} · {schemeLabel(t.scheme)}</div>
        </div>
        {t.priority && <span style={{ fontSize: 11, fontWeight: 800, color: '#fff', background: '#6E3FA3', padding: '4px 11px', borderRadius: 12 }}>PRIORITY · 24h SLA</span>}
      </div>

      <div style={{ padding: '18px 22px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 22 }}>
        {/* left: citizen */}
        <div>
          <SectionLabel>Citizen's words ({t.lang_label})</SectionLabel>
          <p className="adh-native" style={{ fontSize: 13.5, color: '#23323f', lineHeight: 1.5, background: '#f7f9fb', padding: '10px 12px', borderRadius: 8, margin: '6px 0 14px' }}>
            {t.original_text || '—'}
          </p>
          <SectionLabel>Officer summary (English)</SectionLabel>
          <p style={{ fontSize: 13.5, color: '#23323f', lineHeight: 1.5, margin: '6px 0 14px' }}>{t.english_summary}</p>

          <SectionLabel>Structured details</SectionLabel>
          <div style={{ marginTop: 6 }}>
            {t.detail_rows.map(([k, v], i) => (
              <div key={i} style={{ display: 'flex', gap: 10, padding: '6px 0', borderBottom: '1px solid #f0f3f6' }}>
                <span style={{ fontSize: 12, color: '#6a8199', minWidth: 110, fontWeight: 600 }}>{k}</span>
                <span className="adh-native" style={{ fontSize: 13, color: '#23323f' }}>{v}</span>
              </div>
            ))}
          </div>
        </div>

        {/* right: AI analysis */}
        <div>
          <div style={{ background: 'linear-gradient(135deg,#f3eefc,#eef4fc)', borderRadius: 12, padding: '14px 16px', border: '1px solid #e3dcf3' }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: '#6E3FA3', letterSpacing: '.5px', display: 'flex', alignItems: 'center', gap: 6 }}>
              <span>✦</span> AI ANALYSIS
            </div>
            {t.ai_root_cause ? (
              <>
                <AiBlock title="Likely root cause" body={t.ai_root_cause} />
                <AiBlock title="Suggested action" body={t.ai_suggested_resolution} />
                {t.ai_cross_scheme.length > 0 && (
                  <div style={{ marginTop: 12 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#6a8199' }}>Other benefits likely affected</div>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 6 }}>
                      {t.ai_cross_scheme.map((s) => (
                        <span key={s} style={{ fontSize: 11, fontWeight: 700, color: '#0B3C6B', background: '#fff', border: '1px solid #cfe2f3', padding: '3px 9px', borderRadius: 10 }}>{schemeLabel(s)}</span>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <p style={{ fontSize: 12.5, color: '#6a8199', marginTop: 10 }}>No analysis was generated for this ticket.</p>
            )}
          </div>

          <SectionLabel>Routed to</SectionLabel>
          <p style={{ fontSize: 13, color: '#23323f', margin: '6px 0 4px' }}>{t.route}</p>
          <p style={{ fontSize: 12, color: '#8aa0b4' }}>Contact: {t.contact_masked}</p>
        </div>
      </div>

      {/* actions */}
      <div style={{ padding: '14px 22px', borderTop: '1px solid #eef2f6', display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        {t.status !== 'progress' && <ActBtn label="Mark in progress" onClick={() => onStatus(t.id, 'progress')} />}
        {t.status !== 'resolved' && <ActBtn label="Resolve" primary onClick={() => onStatus(t.id, 'resolved')} />}
        {t.status !== 'escalated' && <ActBtn label="Escalate to state" purple onClick={() => onStatus(t.id, 'escalated')} />}
      </div>
    </div>
  );
}

function AiBlock({ title, body }: { title: string; body: string }) {
  return (
    <div style={{ marginTop: 12 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: '#6a8199' }}>{title}</div>
      <div style={{ fontSize: 13, color: '#2a2140', lineHeight: 1.5, marginTop: 3 }}>{body}</div>
    </div>
  );
}

// ---- small pieces ----------------------------------------------------------
function TopBar({ onBack, onRefresh, counts }: { onBack: () => void; onRefresh: () => void; counts: Record<string, number> }) {
  return (
    <div style={{ background: '#0B3C6B', color: '#fff', padding: '12px 22px', display: 'flex', alignItems: 'center', gap: 18 }}>
      <button onClick={onBack} style={{ all: 'unset', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: '#bcd6ef' }}>← Roles</button>
      <div style={{ fontSize: 16, fontWeight: 800, letterSpacing: '-.3px' }}>AdhikarAI · District Desk</div>
      <div style={{ display: 'flex', gap: 14, marginLeft: 'auto', fontSize: 12.5 }}>
        <Stat label="Open" n={counts.open || 0} />
        <Stat label="Escalated" n={counts.escalated || 0} />
        <Stat label="Resolved" n={counts.resolved || 0} />
      </div>
      <button onClick={onRefresh} style={{ all: 'unset', cursor: 'pointer', fontSize: 12.5, fontWeight: 600, color: '#fff', background: 'rgba(255,255,255,.15)', padding: '6px 12px', borderRadius: 8 }}>↻ Refresh</button>
    </div>
  );
}
const Stat = ({ label, n }: { label: string; n: number }) => (
  <span style={{ color: '#9cc2e6' }}>{label} <b style={{ color: '#fff' }}>{n}</b></span>
);
const SectionLabel = ({ children }: { children: React.ReactNode }) => (
  <div style={{ fontSize: 11, fontWeight: 800, color: '#8aa0b4', letterSpacing: '.5px', textTransform: 'uppercase' }}>{children}</div>
);
const Empty = ({ children, error }: { children: React.ReactNode; error?: boolean }) => (
  <div style={{ background: '#fff', borderRadius: 12, border: '1px dashed ' + (error ? '#e0b4b4' : '#dce3ea'), padding: 28, textAlign: 'center', color: error ? '#c0392b' : '#8aa0b4', fontSize: 13.5 }}>{children}</div>
);
function ActBtn({ label, onClick, primary, purple }: { label: string; onClick: () => void; primary?: boolean; purple?: boolean }) {
  const bg = primary ? '#1E9E4A' : purple ? '#6E3FA3' : '#fff';
  const fg = primary || purple ? '#fff' : '#0B3C6B';
  const bd = primary ? '#1E9E4A' : purple ? '#6E3FA3' : '#cfe2f3';
  return (
    <button onClick={onClick} style={{ all: 'unset', cursor: 'pointer', background: bg, color: fg, border: '1.5px solid ' + bd, padding: '9px 18px', borderRadius: 10, fontSize: 13, fontWeight: 700 }}>{label}</button>
  );
}

// ---- helpers ---------------------------------------------------------------
function slaInfo(t: Ticket): { text: string; fg: string } {
  if (t.status === 'resolved') return { text: 'Closed', fg: '#1E9E4A' };
  if (t.sla === 'pri') return t.age_days >= 1 ? { text: 'Overdue', fg: '#c0392b' } : { text: 'Due in 24h', fg: '#6E3FA3' };
  return t.age_days >= 2 ? { text: `${t.age_days}d — due soon`, fg: '#b9770a' } : { text: `${t.age_days}d open`, fg: '#8aa0b4' };
}
function countByStatus(tickets: Ticket[]): Record<string, number> {
  return tickets.reduce((acc, t) => { acc[t.status] = (acc[t.status] || 0) + 1; return acc; }, {} as Record<string, number>);
}
