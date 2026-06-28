import { Routes, Route, useNavigate } from 'react-router-dom';
import CitizenApp from './components/citizen/CitizenApp';
import OfficerApp from './components/officer/OfficerApp';

function Landing() {
  const nav = useNavigate();
  return (
    <div
      style={{
        minHeight: '100vh', width: '100%', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', padding: 32,
        background: 'radial-gradient(120% 90% at 50% 0%,#0e4677 0%,#082e52 55%,#061d36 100%)',
        position: 'relative',
      }}
    >
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 6, display: 'flex' }}>
        <div style={{ flex: 1, background: '#FF9933' }} />
        <div style={{ flex: 1, background: '#ffffff' }} />
        <div style={{ flex: 1, background: '#138808' }} />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 10 }}>
        <div style={{
          width: 54, height: 54, borderRadius: 14, background: '#fff', display: 'flex',
          alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 26px rgba(0,0,0,.35)',
        }}>
          <div style={{
            width: 26, height: 26, borderRadius: '50%', border: '3px solid #0B3C6B',
            borderTopColor: '#FF9933', borderRightColor: '#138808',
          }} />
        </div>
        <div>
          <div style={{ fontSize: 30, fontWeight: 800, color: '#fff', letterSpacing: '-.6px', lineHeight: 1 }}>
            AdhikarAI
          </div>
          <div style={{ fontSize: 13, color: '#9cc2e6', fontWeight: 500, letterSpacing: '.3px' }}>
            Aadhaar Grievance Redressal
          </div>
        </div>
      </div>

      <p style={{ color: '#bcd6ef', fontSize: 15, maxWidth: 430, textAlign: 'center', lineHeight: 1.5, margin: '14px 0 30px' }}>
        Voice-first welfare grievance support in your language — and a triage desk for the officers who resolve them.
      </p>

      <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', justifyContent: 'center', maxWidth: 680 }}>
        <RoleCard
          title="I am a Citizen"
          body="Report a problem with your ration, pension, payment or other welfare benefit — by voice or text."
          cta="Open chat assistant →"
          ctaColor="#1F84D6"
          onClick={() => nav('/citizen')}
          icon={
            <div style={{ width: 20, height: 30, border: '2.5px solid #0B3C6B', borderRadius: 5, position: 'relative' }}>
              <div style={{ position: 'absolute', bottom: 3, left: '50%', transform: 'translateX(-50%)', width: 6, height: 2, background: '#0B3C6B', borderRadius: 2 }} />
            </div>
          }
          iconBg="#e9f2fb"
        />
        <RoleCard
          title="District Officer"
          body="Triage incoming grievances, read original-language transcripts and resolve or escalate tickets."
          cta="Open dashboard →"
          ctaColor="#6E3FA3"
          onClick={() => nav('/officer')}
          icon={
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3 }}>
              <div style={{ width: 8, height: 8, background: '#6E3FA3', borderRadius: 2 }} />
              <div style={{ width: 8, height: 8, background: '#6E3FA3', borderRadius: 2, opacity: .5 }} />
              <div style={{ width: 8, height: 8, background: '#6E3FA3', borderRadius: 2, opacity: .5 }} />
              <div style={{ width: 8, height: 8, background: '#6E3FA3', borderRadius: 2 }} />
            </div>
          }
          iconBg="#efeaf6"
        />
      </div>
    </div>
  );
}

function RoleCard(props: {
  title: string; body: string; cta: string; ctaColor: string;
  onClick: () => void; icon: React.ReactNode; iconBg: string;
}) {
  return (
    <button
      onClick={props.onClick}
      style={{
        all: 'unset', cursor: 'pointer', width: 280, background: '#fff', borderRadius: 18,
        padding: 26, display: 'flex', flexDirection: 'column', gap: 12,
        boxShadow: '0 14px 40px rgba(0,0,0,.3)', transition: 'transform .15s',
      }}
      onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-4px)')}
      onMouseLeave={(e) => (e.currentTarget.style.transform = 'none')}
    >
      <div style={{ width: 48, height: 48, borderRadius: 12, background: props.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {props.icon}
      </div>
      <div style={{ fontSize: 19, fontWeight: 700, color: '#0B3C6B' }}>{props.title}</div>
      <div style={{ fontSize: 13.5, color: '#5b7488', lineHeight: 1.45 }}>{props.body}</div>
      <div style={{ marginTop: 4, fontSize: 13, fontWeight: 600, color: props.ctaColor }}>{props.cta}</div>
    </button>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/citizen" element={<CitizenApp />} />
      <Route path="/officer" element={<OfficerApp />} />
    </Routes>
  );
}
