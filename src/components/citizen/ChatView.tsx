// ============================================================================
// ChatView — the WhatsApp-style phone UI. Pure presentation: it renders the
// chat state and raises events. The flow logic lives in CitizenApp.
// ============================================================================
import { useEffect, useRef, useState } from 'react';
import { LANGS } from '../../data/languages';
import { useSpeechRecognition } from '../../hooks/useSpeechRecognition';
import type { ChatMessage, Prompt, PromptOption } from './chatTypes';

interface ViewState {
  lang: string;
  stage: string;
  messages: ChatMessage[];
  prompt: Prompt | null;
  busy: boolean;
  langSheetOpen: boolean;
}

interface Props {
  state: ViewState;
  onBack: () => void;
  onPickLanguage: (code: string) => void;
  onSubmit: (value: string, label?: string, isVoice?: boolean) => void;
  onChangeLang: () => void;
  onCloseLangSheet: () => void;
  langCodeShort: string;
}

const GREEN = '#075E54';

export default function ChatView(p: Props) {
  const { state } = p;
  const scrollRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const fit = () => setScale(Math.min(1, (window.innerHeight - 44) / 812));
    fit();
    window.addEventListener('resize', fit);
    return () => window.removeEventListener('resize', fit);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) setTimeout(() => { el.scrollTop = el.scrollHeight; }, 30);
  }, [state.messages]);

  return (
    <div style={{
      minHeight: '100vh', width: '100%', display: 'flex', alignItems: 'center',
      justifyContent: 'center', padding: 20,
      background: 'radial-gradient(120% 90% at 50% 0%,#0e4677 0%,#082e52 60%,#061d36 100%)',
    }}>
      <button onClick={p.onBack} style={backBtn}>← Roles</button>

      <div style={{ transform: `scale(${scale})`, transformOrigin: 'center' }}>
        <div style={{
          width: 392, height: 812, background: '#0B3C6B', borderRadius: 46, padding: 11,
          boxShadow: '0 30px 80px rgba(0,0,0,.5)',
        }}>
          <div style={{
            width: '100%', height: '100%', background: '#eef3f7', borderRadius: 36,
            overflow: 'hidden', display: 'flex', flexDirection: 'column', position: 'relative',
          }}>
            <StatusBar />
            <Header lang={p.langCodeShort} onBack={p.onBack} onChangeLang={p.onChangeLang} />

            <div ref={scrollRef} style={{
              flex: 1, overflowY: 'auto', padding: '12px 14px 10px', background: '#efeae2',
              backgroundImage: 'radial-gradient(rgba(120,110,90,.05) 1px,transparent 1px),radial-gradient(rgba(120,110,90,.04) 1px,transparent 1px)',
              backgroundSize: '22px 22px,22px 22px', backgroundPosition: '0 0,11px 11px',
              display: 'flex', flexDirection: 'column', gap: 7,
            }}>
              <SystemBubble>🔒 Messages are end-to-end encrypted.</SystemBubble>
              <DayChip>TODAY</DayChip>
              {state.messages.map((m, i) => <Bubble key={i} m={m} />)}
            </div>

            <InputArea {...p} />
          </div>
        </div>
      </div>

      {state.langSheetOpen && (
        <LangSheet onPick={p.onPickLanguage} onClose={p.onCloseLangSheet} />
      )}
    </div>
  );
}

// ---- message bubbles -------------------------------------------------------
function Bubble({ m }: { m: ChatMessage }) {
  if (m.kind === 'typing') {
    return (
      <div style={{ alignSelf: 'flex-start', background: '#fff', borderRadius: '16px 16px 16px 4px', padding: '13px 16px', boxShadow: '0 1px 3px rgba(11,60,107,.1)', display: 'flex', gap: 4 }}>
        {[0, .2, .4].map((d) => (
          <span key={d} style={{ width: 7, height: 7, borderRadius: '50%', background: '#9bb1c4', animation: `adhblink 1.2s infinite ${d}s` }} />
        ))}
      </div>
    );
  }
  if (m.kind === 'bot') {
    return (
      <div style={{ ...botBubble, animation: 'adhup .2s ease' }}>
        <span style={tailLeft} />
        <span className="adh-native" style={{ fontSize: 14.2, lineHeight: 1.4, color: '#111b21' }}>{m.text}</span>
        <Time t={m.time} />
      </div>
    );
  }
  if (m.kind === 'user' || m.kind === 'voice') {
    return (
      <div style={userBubble}>
        <span style={tailRight} />
        {m.kind === 'voice' && (
          <span style={{ marginRight: 6, color: GREEN }}>🎙</span>
        )}
        <span className="adh-native" style={{ fontSize: 14.2, lineHeight: 1.4, color: '#111b21' }}>{m.text}</span>
        <Time t={m.time} sent />
      </div>
    );
  }
  if (m.kind === 'summary') {
    return (
      <div style={{ ...cardBubble, animation: 'adhup .25s ease' }}>
        <div style={{ fontWeight: 700, fontSize: 13.5, color: '#0B3C6B', marginBottom: 8 }}>{m.text}</div>
        {(m.rows || []).map(([k, v], i) => (
          <div key={i} style={{ display: 'flex', gap: 8, padding: '4px 0', borderBottom: i < (m.rows!.length - 1) ? '1px solid #eef2f6' : 'none' }}>
            <span style={{ fontSize: 12, color: '#6a8199', minWidth: 92, fontWeight: 600 }}>{k}</span>
            <span className="adh-native" style={{ fontSize: 12.5, color: '#23323f', flex: 1 }}>{v}</span>
          </div>
        ))}
      </div>
    );
  }
  if (m.kind === 'ticket') {
    return (
      <div style={{ ...ticketCard, animation: 'adhup .3s ease' }}>
        <div style={{ background: m.headBg, color: '#fff', padding: '9px 14px', fontWeight: 700, fontSize: 13 }}>
          {m.tpriority ? '⚡ ' : '✓ '}{m.headLabel}
        </div>
        <div style={{ padding: '12px 14px' }}>
          <div style={{ fontSize: 11, color: '#6a8199', fontWeight: 600 }}>TICKET ID</div>
          <div style={{ fontSize: 17, fontWeight: 800, color: '#0B3C6B', letterSpacing: '.5px', margin: '2px 0 8px' }}>{m.tid}</div>
          <div className="adh-native" style={{ fontSize: 13, color: '#3a4d5d', lineHeight: 1.45 }}>{m.text}</div>
        </div>
      </div>
    );
  }
  return null;
}

function Time({ t, sent }: { t?: string; sent?: boolean }) {
  if (!t) return null;
  return (
    <span style={{ fontSize: 10, color: '#8aa0b4', marginLeft: 8, alignSelf: 'flex-end', whiteSpace: 'nowrap' }}>
      {t}{sent && <span style={{ color: '#34B7F1', marginLeft: 3 }}>✓✓</span>}
    </span>
  );
}

// ---- input area ------------------------------------------------------------
function InputArea(p: Props) {
  const { prompt, lang, busy } = p.state;
  const [draft, setDraft] = useState('');

  const speech = useSpeechRecognition(lang, (text) => {
    setDraft((d) => (d ? d + ' ' : '') + text);
  });

  if (!prompt) {
    return <div style={{ height: 8, background: '#f0f0f0', flexShrink: 0 }} />;
  }

  const send = (value: string, label?: string, voice?: boolean) => {
    p.onSubmit(value, label, voice);
    setDraft('');
  };

  // chips / menu / lang-list
  if (prompt.type === 'chips' || prompt.type === 'menu' || prompt.type === 'lang-list') {
    return (
      <div style={{ flexShrink: 0, background: '#f0f0f0', padding: '10px 12px', maxHeight: 230, overflowY: 'auto' }}>
        {prompt.title && <div style={{ fontSize: 12, fontWeight: 700, color: '#0B3C6B', marginBottom: 8 }}>{prompt.title}</div>}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
          {(prompt.options || []).map((o) => (
            <OptionChip key={o.value} o={o} type={prompt.type}
              onClick={() => prompt.type === 'lang-list' ? p.onPickLanguage(o.value) : send(o.value, o.label)} />
          ))}
        </div>
      </div>
    );
  }

  // text / voicetext
  const showMic = (prompt.type === 'voicetext' || prompt.mic) && speech.supported;
  return (
    <div style={{ flexShrink: 0, background: '#f0f0f0', padding: '9px 10px', display: 'flex', alignItems: 'center', gap: 8 }}>
      <input
        className="adh-native"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter' && draft.trim() && !busy) send(draft.trim(), draft.trim()); }}
        placeholder={speech.listening ? 'Listening…' : (prompt.placeholder || 'Type a message')}
        disabled={busy}
        style={{
          flex: 1, border: 'none', borderRadius: 22, padding: '11px 16px', fontSize: 14,
          background: '#fff', outline: 'none', boxShadow: '0 1px 2px rgba(0,0,0,.08)',
        }}
      />
      {showMic && (
        <button
          onClick={() => speech.listening ? speech.stop() : speech.start()}
          aria-label="Speak"
          style={{
            all: 'unset', cursor: 'pointer', width: 44, height: 44, borderRadius: '50%',
            background: speech.listening ? '#d62828' : GREEN, color: '#fff', display: 'flex',
            alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            animation: speech.listening ? 'adhpulse 1.2s infinite' : 'none',
          }}
        >🎙</button>
      )}
      <button
        onClick={() => draft.trim() && !busy && send(draft.trim(), draft.trim())}
        aria-label="Send"
        disabled={busy}
        style={{
          all: 'unset', cursor: busy ? 'default' : 'pointer', width: 44, height: 44, borderRadius: '50%',
          background: GREEN, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}
      >{busy ? <span className="adh-spinner" /> : '➤'}</button>
    </div>
  );
}

function OptionChip({ o, type, onClick }: { o: PromptOption; type: string; onClick: () => void }) {
  if (type === 'menu' || type === 'lang-list') {
    return (
      <button onClick={onClick} style={{
        all: 'unset', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10,
        background: '#fff', border: '1.5px solid #dfe7ee', borderRadius: 12, padding: '10px 12px',
        width: '100%', boxSizing: 'border-box',
      }}>
        {o.mono && (
          <span style={{ width: 30, height: 30, borderRadius: 8, background: o.tint || '#eef1f5', color: o.fg || '#5b7488', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 11, flexShrink: 0 }}>{o.mono}</span>
        )}
        <span style={{ display: 'flex', flexDirection: 'column' }}>
          <span className="adh-native" style={{ fontSize: 13.5, fontWeight: 600, color: '#0B3C6B' }}>{o.label}</span>
          {o.sub && <span style={{ fontSize: 11, color: '#8aa0b4' }}>{o.sub}</span>}
        </span>
      </button>
    );
  }
  return (
    <button onClick={onClick} className="adh-native" style={{
      all: 'unset', cursor: 'pointer', background: '#fff', border: '1.5px solid #cfe2f3',
      borderRadius: 18, padding: '8px 14px', fontSize: 13, fontWeight: 600, color: '#0B3C6B',
    }}>{o.label}</button>
  );
}

// ---- chrome ----------------------------------------------------------------
function StatusBar() {
  return (
    <div style={{ height: 30, background: GREEN, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', fontSize: 12.5, fontWeight: 600, flexShrink: 0 }}>
      <span>9:41</span>
      <span style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
        <span style={{ fontSize: 10, opacity: .85 }}>2G</span>
        <span style={{ width: 22, height: 11, border: '1.5px solid #fff', borderRadius: 3, position: 'relative', display: 'inline-block' }}>
          <span style={{ position: 'absolute', left: 1, top: 1, bottom: 1, width: '62%', background: '#fff', borderRadius: 1 }} />
        </span>
      </span>
    </div>
  );
}

function Header({ lang, onBack, onChangeLang }: { lang: string; onBack: () => void; onChangeLang: () => void }) {
  return (
    <div style={{ background: GREEN, color: '#fff', padding: '7px 8px 9px 6px', display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
      <button onClick={onBack} style={{ all: 'unset', cursor: 'pointer', fontSize: 25, color: '#fff', padding: '0 2px' }}>‹</button>
      <div style={{ width: 38, height: 38, borderRadius: '50%', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <div style={{ width: 18, height: 18, borderRadius: '50%', border: '2.5px solid #075E54', borderTopColor: '#FF9933', borderRightColor: '#138808' }} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 600, fontSize: 15.5, display: 'flex', alignItems: 'center', gap: 5 }}>
          AdhikarAI <span style={{ width: 14, height: 14, borderRadius: '50%', background: '#34B7F1', color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 8.5, fontWeight: 900 }}>✓</span>
        </div>
        <div className="adh-native" style={{ fontSize: 12, color: '#cfe9e3', marginTop: 1 }}>online</div>
      </div>
      <button onClick={onChangeLang} title="Change language" style={{ all: 'unset', cursor: 'pointer', fontSize: 10, fontWeight: 800, color: '#fff', background: 'rgba(255,255,255,.2)', padding: '3px 8px', borderRadius: 6, letterSpacing: '.4px' }}>{lang}</button>
    </div>
  );
}

function LangSheet({ onPick, onClose }: { onPick: (c: string) => void; onClose: () => void }) {
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.4)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 50 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: '#fff', borderRadius: '20px 20px 0 0', padding: 20, width: 392, maxWidth: '100%', maxHeight: '70vh', overflowY: 'auto' }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: '#0B3C6B', marginBottom: 14 }}>Change language</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {LANGS.map((L) => (
            <button key={L.code} onClick={() => onPick(L.code)} className="adh-native" style={{
              all: 'unset', cursor: 'pointer', background: '#fff', border: '1.5px solid #dfe7ee',
              borderRadius: 12, padding: '12px', display: 'flex', flexDirection: 'column', gap: 2,
            }}>
              <span style={{ fontSize: 17, fontWeight: 700, color: '#0B3C6B' }}>{L.native}</span>
              <span style={{ fontSize: 11, color: '#8aa0b4' }}>{L.roman}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

const SystemBubble = ({ children }: { children: React.ReactNode }) => (
  <div style={{ alignSelf: 'center', maxWidth: '90%', textAlign: 'center', background: '#fdf6cf', color: '#54656f', fontSize: 10, fontWeight: 500, padding: '5px 12px', borderRadius: 8, marginBottom: 2 }}>{children}</div>
);
const DayChip = ({ children }: { children: React.ReactNode }) => (
  <div style={{ alignSelf: 'center', background: '#fff', color: '#54656f', fontSize: 10.5, fontWeight: 600, padding: '4px 11px', borderRadius: 8 }}>{children}</div>
);

// ---- style objects ---------------------------------------------------------
const backBtn: React.CSSProperties = { all: 'unset', cursor: 'pointer', position: 'fixed', top: 16, left: 16, zIndex: 30, color: '#bcd6ef', fontSize: 12.5, fontWeight: 600, background: 'rgba(255,255,255,.08)', padding: '7px 12px', borderRadius: 8 };
const botBubble: React.CSSProperties = { alignSelf: 'flex-start', maxWidth: '83%', position: 'relative', background: '#fff', borderRadius: '0 8px 8px 8px', padding: '6px 9px 6px 10px', boxShadow: '0 1px .5px rgba(11,20,26,.13)', display: 'flex', flexWrap: 'wrap' };
const userBubble: React.CSSProperties = { alignSelf: 'flex-end', maxWidth: '83%', position: 'relative', background: '#d9fdd3', borderRadius: '8px 0 8px 8px', padding: '6px 9px 6px 10px', boxShadow: '0 1px .5px rgba(11,20,26,.13)', display: 'flex', flexWrap: 'wrap' };
const cardBubble: React.CSSProperties = { alignSelf: 'flex-start', maxWidth: '88%', background: '#fff', borderRadius: 10, padding: '12px 14px', boxShadow: '0 1px 3px rgba(11,60,107,.12)' };
const ticketCard: React.CSSProperties = { alignSelf: 'flex-start', maxWidth: '88%', background: '#fff', borderRadius: 12, overflow: 'hidden', boxShadow: '0 2px 8px rgba(11,60,107,.15)' };
const tailLeft: React.CSSProperties = { position: 'absolute', top: 0, left: -8, width: 0, height: 0, borderTop: '9px solid #fff', borderLeft: '8px solid transparent' };
const tailRight: React.CSSProperties = { position: 'absolute', top: 0, right: -8, width: 0, height: 0, borderTop: '9px solid #d9fdd3', borderRight: '8px solid transparent' };
