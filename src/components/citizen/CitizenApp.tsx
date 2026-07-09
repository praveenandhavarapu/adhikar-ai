// ============================================================================
// CitizenApp — the WhatsApp-style grievance flow.
//
// Flow: language → (first visit: phone + name │ return visit: confirm name)
//       → choose: raise new complaint OR track an old one
//   New:   state → district → FREE-TEXT / voice note (live NLU) → follow-ups
//          for fields the AI couldn't extract → summary → ticket → thank-you.
//   Track: pick a past complaint → see its status, office and update history.
//
// Everything the citizen hears/reads is localized to their selected language
// (data/i18n.ts + data/schemes.ts); the dynamic "here's what I understood"
// acknowledgment is written by the AI directly in that language.
// ============================================================================
import { useEffect, useReducer, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { LANGS, langCodeShort, resolveLang } from '../../data/languages';
import { STATES, districtsFor } from '../../data/geography';
import { stateLabelLocalized } from '../../data/states_i18n';
import {
  SCHEMES, ISSUES, schemeLabelLocalized, issueLabelLocalized,
} from '../../data/schemes';
import { strings, optLabel, rowLabel, fmt, xstr, WELCOME, type StrKey } from '../../data/i18n';
import {
  classifyGrievance, createTicket, uploadVoiceClip, fetchTicketsByPhone, translateTexts,
} from '../../lib/api';
import {
  getDeviceIdentity, saveDeviceIdentity, normalizePhone,
  getStoredLang, saveStoredLang, parseSpokenName,
} from '../../lib/identity';
import { blobToBase64, type VoiceResult } from '../../hooks/useVoiceCapture';
import type {
  ExtractedFields, IssueCode, LangCode, SchemeCode, Ticket, TicketStatus,
} from '../../lib/types';
import ChatView from './ChatView';
import type { ChatMessage, Prompt } from './chatTypes';

// ---- follow-up question definitions (only asked if AI didn't extract) ------
type FollowKey =
  | 'duration' | 'location' | 'amount' | 'person_age' | 'occupation'
  | 'bank_linked' | 'ekyc_done' | 'reason_given' | 'docs_status'
  | 'attempts' | 'alt_auth_offered' | 'recent_bank_change' | 'which_bank'
  | 'denial_reason' | 'card_status' | 'repeat_demand' | 'official_role'
  | 'paid' | 'detail_field' | 'docs_available';

// Each follow-up: the question string key + either chip option values or a
// free-text placeholder key. Chip labels come from optLabel() so they render
// in the citizen's language.
const FOLLOW_CFG: Record<FollowKey, { q: StrKey; opts?: string[]; textPh?: StrKey }> = {
  duration: { q: 'askDur', opts: ['<1m', '1-3m', '3-6m', '>6m', 'ns'] },
  location: { q: 'askBioLoc', opts: ['fps', 'bank', 'csc', 'hosp', 'office'] },
  amount: { q: 'askBribeAmt', opts: ['<100', '100-500', '500-1000', '>1000', 'ns'] },
  person_age: { q: 'askBioAge', opts: ['u60', '60-70', 'a70'] },
  occupation: { q: 'askBioOcc', opts: ['agri', 'domestic', 'trade', 'other'] },
  bank_linked: { q: 'askBank', opts: ['yes', 'no', 'ns'] },
  ekyc_done: { q: 'askEkyc', opts: ['yes', 'no', 'ns'] },
  reason_given: { q: 'askReason', opts: ['yes', 'no', 'ns'] },
  docs_status: { q: 'askDocs', opts: ['aadhaar', 'ration_card', 'job_card', 'bank_passbook', 'all_docs', 'none'] },
  attempts: { q: 'askAttempts', opts: ['once', 'few', 'many'] },
  alt_auth_offered: { q: 'askAltAuth', opts: ['yes', 'no'] },
  recent_bank_change: { q: 'askPayNew', opts: ['yes', 'no', 'ns'] },
  which_bank: { q: 'askPayBank', textPh: 'payBankPh' },
  denial_reason: { q: 'askDenReason', textPh: 'denReasonPh' },
  card_status: { q: 'askCard', opts: ['valid', 'expired', 'none', 'ns'] },
  repeat_demand: { q: 'askRepeat', opts: ['yes', 'no'] },
  official_role: { q: 'askRole', opts: ['dealer', 'operator', 'official', 'other'] },
  paid: { q: 'askBribePaid', opts: ['yes', 'no', 'refused'] },
  detail_field: { q: 'askDetWhat', opts: ['fld_name', 'fld_dob', 'fld_address', 'fld_bank', 'fld_aadhaar'] },
  docs_available: { q: 'askDetDocs', opts: ['aadhaar', 'ration_card', 'job_card', 'bank_passbook', 'all_docs', 'none'] },
};

// "All of the above" for the document questions expands to this full set, so the
// value stored on the ticket (and read by the officer) is the complete list —
// not an opaque "all" marker. (C3: server-facing expansion at submit time.)
const ALL_DOC_SET = ['aadhaar', 'ration_card', 'job_card', 'bank_passbook'];

const FOLLOW_KEYS = new Set(Object.keys(FOLLOW_CFG));

// Order the collected fields appear in the summary card / officer detail rows.
const ROW_ORDER: string[] = [
  'duration', 'location', 'person_age', 'occupation', 'bank_linked', 'ekyc_done',
  'reason_given', 'docs_status', 'attempts', 'alt_auth_offered', 'recent_bank_change',
  'which_bank', 'amount', 'paid', 'repeat_demand', 'official_role', 'denial_reason',
  'card_status', 'detail_field', 'docs_available',
];

interface State {
  lang: string;
  stage: 'lang' | 'chat';
  messages: ChatMessage[];
  step: string;
  data: Record<string, any>;
  prompt: Prompt | null;
  pendingFollows: FollowKey[];
  busy: boolean;
  langSheetOpen: boolean;
}

type Action =
  | { type: 'set'; patch: Partial<State> }
  | { type: 'pushUser'; text: string; voice?: boolean; lang?: string; free?: boolean }
  | { type: 'pushBot'; text: string }
  | { type: 'pushTyping' }
  | { type: 'popTyping' }
  | { type: 'pushCard'; msg: ChatMessage }
  | { type: 'mergeData'; data: Record<string, any> };

function reducer(s: State, a: Action): State {
  switch (a.type) {
    case 'set': return { ...s, ...a.patch };
    case 'mergeData': return { ...s, data: { ...s.data, ...a.data } };
    case 'pushUser':
      return {
        ...s,
        messages: [...s.messages, {
          kind: a.voice ? 'voice' : 'user',
          text: a.text,
          time: now(),
          // Track origin so free text can be re-translated on a later lang switch.
          originalText: a.free ? a.text : undefined,
          originalLang: a.free ? (a.lang || s.lang) : undefined,
          translatable: !!a.free,
        }],
      };
    case 'pushBot':
      return { ...s, messages: [...s.messages, { kind: 'bot', text: a.text, time: now() }] };
    case 'pushTyping':
      return { ...s, messages: [...s.messages, { kind: 'typing' }] };
    case 'popTyping': {
      const m = s.messages.slice();
      for (let i = m.length - 1; i >= 0; i--) { if (m[i].kind === 'typing') { m.splice(i, 1); break; } }
      return { ...s, messages: m };
    }
    case 'pushCard':
      return { ...s, messages: [...s.messages, a.msg] };
    default: return s;
  }
}

let _clock = 9 * 60 + 41;
function now(): string {
  _clock += 1;
  const h = Math.floor(_clock / 60) % 24, m = _clock % 60;
  return (h % 12 || 12) + ':' + (m < 10 ? '0' : '') + m;
}

const initial: State = {
  lang: 'en', stage: 'lang', messages: [], step: 'language', data: {},
  prompt: null, pendingFollows: [], busy: false, langSheetOpen: false,
};

export default function CitizenApp() {
  const nav = useNavigate();
  const [state, dispatch] = useReducer(reducer, initial);
  const stateRef = useRef(state);
  stateRef.current = state;

  // ---- bot helpers ---------------------------------------------------------
  const botSay = (lines: string | string[], then?: () => void) => {
    const arr = (Array.isArray(lines) ? lines : [lines]).filter(Boolean);
    const run = (i: number) => {
      if (i >= arr.length) { then?.(); return; }
      dispatch({ type: 'pushTyping' });
      setTimeout(() => {
        dispatch({ type: 'popTyping' });
        dispatch({ type: 'pushBot', text: arr[i] });
        run(i + 1);
      }, 720);
    };
    run(0);
  };

  const setPrompt = (p: Prompt | null) => dispatch({ type: 'set', patch: { prompt: p } });
  const chipsFor = (values: string[]) =>
    values.map((v) => ({ value: v, label: optLabel(stateRef.current.lang, v) }));

  // ---- boot ----------------------------------------------------------------
  useEffect(() => {
    // We only ask for a language once. If the citizen chose one on a previous
    // visit, reuse it and go straight into the chat — they can still switch it
    // any time from the toggle in the top-right of the chat header.
    const saved = getStoredLang();
    if (saved) {
      applyLanguage(saved, false);
    } else {
      botSay([WELCOME], () => {
        setPrompt({
          type: 'lang-list',
          options: LANGS.map((L) => ({ value: L.code, label: L.native, sub: L.roman })),
        });
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---- language pick -------------------------------------------------------
  // `announce` echoes the chosen language as a user bubble (true when the
  // citizen actively taps a language); on an automatic reuse at boot we stay
  // silent and drop straight into the greeting.
  const applyLanguage = (code: string, announce: boolean) => {
    const real = resolveLang(code);
    const L = LANGS.find((x) => x.code === code);
    if (announce) dispatch({ type: 'pushUser', text: L ? L.native : 'English' });
    saveStoredLang(real);
    dispatch({ type: 'set', patch: { lang: real, stage: 'chat', langSheetOpen: false } });
    dispatch({ type: 'mergeData', data: { lang: real } });
    const S = strings(real);
    const id = getDeviceIdentity();
    if (id) {
      // Returning citizen — reuse phone, confirm the name.
      dispatch({ type: 'mergeData', data: { phone: id.phone, name: id.name, _returning: true } });
      dispatch({ type: 'set', patch: { step: 'continueName' } });
      botSay([S.greet, fmt(S.askContinueName, { n: id.name })], () => setPrompt({
        type: 'chips',
        options: [
          { value: 'keep', label: fmt(S.keepName, { n: id.name }) },
          { value: 'change', label: S.changeName },
        ],
      }));
    } else {
      // First visit on this device — ask for the phone number.
      dispatch({ type: 'set', patch: { step: 'phone' } });
      botSay([S.greet, S.askPhone], () => setPrompt({ type: 'text', placeholder: S.phonePh }));
    }
  };

  // ---- language pick / change ----------------------------------------------
  const pickLanguage = (code: string) => {
    // First choice at the language screen → greet + start the flow.
    if (stateRef.current.step === 'language') { applyLanguage(code, true); return; }
    // Mid-conversation change via the top-right toggle: switch language, re-render
    // prior free text in the new script (C4), then re-ask the current step — the
    // conversation is not restarted.
    const real = resolveLang(code);
    const L = LANGS.find((x) => x.code === code);
    saveStoredLang(real);
    dispatch({ type: 'pushUser', text: L ? L.native : 'English' });
    dispatch({ type: 'set', patch: { lang: real, langSheetOpen: false } });
    dispatch({ type: 'mergeData', data: { lang: real } });
    retranslateMessages(real);
    setTimeout(() => reAsk(), 0);
  };

  // C4 — re-render previously typed/spoken free text in the newly selected
  // language. Enum chip labels are skipped (translatable=false); the canonical
  // stored value on any ticket is unaffected. Cached per (text, targetLang).
  const retranslateMessages = async (targetLang: string) => {
    const items = stateRef.current.messages
      .map((m, i) => ({ m, i }))
      .filter(({ m }) => m.translatable && m.originalText && (m.originalLang || 'en') !== targetLang);
    if (!items.length) return;
    const translated = await translateTexts(items.map(({ m }) => m.originalText as string), targetLang);
    const next = stateRef.current.messages.slice();
    items.forEach(({ i }, k) => { next[i] = { ...next[i], text: translated[k] }; });
    dispatch({ type: 'set', patch: { messages: next } });
  };

  // Re-issue the current step's question in the (now updated) language.
  const reAsk = () => {
    const step = stateRef.current.step;
    const S = strings(stateRef.current.lang);
    if (FOLLOW_KEYS.has(step) || ['state', 'district', 'describe', 'scheme', 'issue'].includes(step)) {
      goTo(step); return;
    }
    switch (step) {
      case 'phone': botSay(S.askPhone, () => setPrompt({ type: 'text', placeholder: S.phonePh })); break;
      case 'name': botSay(S.askName, () => setPrompt({ type: 'text', placeholder: S.namePh, mic: true })); break;
      case 'continueName': {
        const n = stateRef.current.data.name || '';
        botSay(fmt(S.askContinueName, { n }), () => setPrompt({
          type: 'chips',
          options: [{ value: 'keep', label: fmt(S.keepName, { n }) }, { value: 'change', label: S.changeName }],
        }));
        break;
      }
      case 'flowChoice': goToFlowChoice(); break;
      case 'confirm': showSummary(); break;
      case 'trackSelect': handleTrack(); break;
      case 'voiceConsent':
        botSay(S.askVoiceConsent, () => setPrompt({
          type: 'chips',
          options: [{ value: 'yes', label: S.vYes }, { value: 'no', label: S.vNo }],
        }));
        break;
      case 'done': botSay([S.thanks, S.restartHint], () => setPrompt({ type: 'text', placeholder: 'hi' })); break;
      default: break;
    }
  };

  // ---- the main engine -----------------------------------------------------
  const goTo = (step: string) => {
    const S = strings(stateRef.current.lang);
    dispatch({ type: 'set', patch: { step } });

    // Generic follow-up handling first.
    if (FOLLOW_KEYS.has(step)) {
      const cfg = FOLLOW_CFG[step as FollowKey];
      botSay(S[cfg.q], () => {
        if (cfg.opts) setPrompt({ type: 'chips', options: chipsFor(cfg.opts) });
        else setPrompt({ type: 'text', placeholder: cfg.textPh ? S[cfg.textPh] : '' });
      });
      return;
    }

    switch (step) {
      case 'state':
        botSay(S.askState, () => setPrompt({
          type: 'chips',
          options: STATES.map((s) => ({ value: s, label: stateLabelLocalized(stateRef.current.lang, s) })),
        }));
        break;
      case 'district':
        botSay(S.askDistrict, () => setPrompt({
          type: 'chips',
          options: districtsFor(stateRef.current.data.state).map((s) => ({ value: s, label: s })),
        }));
        break;
      case 'describe':
        botSay(S.voicePrompt, () => setPrompt({ type: 'voicetext', mic: true }));
        break;
      case 'scheme': // fallback menu (low AI confidence)
        botSay(S.askScheme, () => setPrompt({
          type: 'menu', title: S.askScheme,
          options: SCHEMES.map((s) => ({
            value: s.value, label: schemeLabelLocalized(stateRef.current.lang, s.value),
            sub: s.sub, mono: s.mono, tint: s.tint, fg: s.fg,
          })),
        }));
        break;
      case 'issue': // fallback menu
        botSay(S.askIssue, () => setPrompt({
          type: 'menu', title: S.askIssue,
          options: ISSUES.map((s) => ({ value: s.value, label: issueLabelLocalized(stateRef.current.lang, s.value) })),
        }));
        break;
    }
  };

  const goToFlowChoice = () => {
    const S = strings(stateRef.current.lang);
    dispatch({ type: 'set', patch: { step: 'flowChoice' } });
    botSay(S.askFlowChoice, () => setPrompt({
      type: 'chips',
      options: [
        { value: 'new', label: S.optNewTicket },
        { value: 'track', label: S.optTrackTicket },
      ],
    }));
  };

  // Store the citizen's name and move on. Used by both the typed answer and the
  // spoken answer (the caller has already shown the user bubble).
  const finishName = (name: string) => {
    const d = stateRef.current.data;
    dispatch({ type: 'mergeData', data: { name } });
    saveDeviceIdentity({ phone: d.phone || '', name });
    // Returning citizen who changed their name → back to the choice menu.
    // First-time citizen → straight into raising their first complaint.
    if (d._returning) goToFlowChoice();
    else goTo('state');
  };

  // ---- field key -> follow-up steps relevant per issue ---------------------
  const followsForIssue = (issue: IssueCode): FollowKey[] => {
    switch (issue) {
      case 'stopped': return ['duration', 'bank_linked', 'ekyc_done', 'reason_given', 'docs_status'];
      case 'biometric': return ['location', 'person_age', 'occupation', 'attempts', 'alt_auth_offered'];
      case 'payment': return ['bank_linked', 'recent_bank_change', 'amount', 'which_bank', 'duration'];
      case 'denied': return ['location', 'denial_reason', 'card_status', 'duration'];
      case 'bribe': return ['location', 'amount', 'paid', 'repeat_demand', 'official_role'];
      case 'details': return ['detail_field', 'docs_available', 'duration'];
      default: return ['duration', 'location', 'bank_linked'];
    }
  };

  // ---- handle submit -------------------------------------------------------
  const submit = (value: string, label?: string, isVoice?: boolean, free?: boolean) => {
    dispatch({ type: 'pushUser', text: label || value, voice: isVoice, lang: stateRef.current.lang, free });
    advance(value, label || value);
  };

  const advance = async (value: string, label: string) => {
    const step = stateRef.current.step;

    // Follow-up answers (chips store the value/code, text stores typed text).
    if (FOLLOW_KEYS.has(step)) {
      // C3: "All of the above" expands to the full document set before storage.
      const stored = value === 'all_docs' ? ALL_DOC_SET.join(',') : value;
      dispatch({ type: 'mergeData', data: { [step]: stored } });
      const remaining = stateRef.current.pendingFollows.filter((f) => f !== step);
      dispatch({ type: 'set', patch: { pendingFollows: remaining } });
      nextFollow(remaining);
      return;
    }

    switch (step) {
      case 'phone': {
        const phone = normalizePhone(value);
        dispatch({ type: 'mergeData', data: { phone } });
        const S = strings(stateRef.current.lang);
        dispatch({ type: 'set', patch: { step: 'name' } });
        botSay(S.askName, () => setPrompt({ type: 'text', placeholder: S.namePh, mic: true }));
        break;
      }
      case 'continueName':
        if (value === 'keep') {
          goToFlowChoice();
        } else {
          const S = strings(stateRef.current.lang);
          dispatch({ type: 'set', patch: { step: 'name' } });
          botSay(S.askName, () => setPrompt({ type: 'text', placeholder: S.namePh, mic: true }));
        }
        break;
      case 'name':
        // Handles "My name is Praveen" / "मेरा नाम प्रवीण है" → "Praveen".
        finishName(parseSpokenName(label) || label);
        break;
      case 'flowChoice':
        if (value === 'track') handleTrack();
        else goTo('state');
        break;
      case 'trackSelect':
        showTicketStatus(value);
        break;
      case 'state':
        dispatch({ type: 'mergeData', data: { state: value } });
        goTo('district'); break;
      case 'district':
        dispatch({ type: 'mergeData', data: { district: value } });
        goTo('describe'); break;
      case 'describe':
        await handleDescribe(label); break;
      case 'voiceConsent':
        if (value === 'yes') startVoiceRecording();
        else goTo('describe');
        break;
      case 'scheme':
        dispatch({ type: 'mergeData', data: { scheme: value } });
        goTo('issue'); break;
      case 'issue': {
        dispatch({ type: 'mergeData', data: { issue: value, priority: value === 'bribe' } });
        const follows = followsForIssue(value as IssueCode);
        dispatch({ type: 'set', patch: { pendingFollows: follows } });
        nextFollow(follows); break;
      }
      case 'confirm':
        if (value === 'yes') finalize();
        else goTo('describe');
        break;
      case 'done':
        // Restart: any input after the thank-you returns to the choice menu,
        // keeping the stored identity + language.
        goToFlowChoice();
        break;
    }
  };

  // ---- voice note capture --------------------------------------------------
  const onMicRequest = () => {
    if (stateRef.current.busy) return;
    const step = stateRef.current.step;
    const S = strings(stateRef.current.lang);

    // Voice answer for the name question — record, transcribe, extract the name.
    // No consent/upload here; a name is short and never stored as audio.
    if (step === 'name') {
      dispatch({ type: 'set', patch: { step: 'nameRecord' } });
      setPrompt({ type: 'voice-record', recordHint: S.recTap, stopLabel: S.recStop });
      return;
    }

    if (step !== 'describe') return;
    dispatch({ type: 'set', patch: { step: 'voiceConsent' } });
    botSay(S.askVoiceConsent, () => setPrompt({
      type: 'chips',
      options: [{ value: 'yes', label: S.vYes }, { value: 'no', label: S.vNo }],
    }));
  };

  const startVoiceRecording = () => {
    const S = strings(stateRef.current.lang);
    dispatch({ type: 'set', patch: { step: 'voiceRecord' } });
    setPrompt({ type: 'voice-record', recordHint: S.recTap, stopLabel: S.recStop });
  };

  const onVoiceRecorded = async (result: VoiceResult) => {
    const S = strings(stateRef.current.lang);

    // Spoken name answer — pull the name out of the transcript and continue.
    if (stateRef.current.step === 'nameRecord') {
      const name = parseSpokenName(result.transcript || '');
      if (name) {
        dispatch({ type: 'pushUser', text: name });
        dispatch({ type: 'set', patch: { step: 'name' } });
        finishName(name);
      } else {
        dispatch({ type: 'set', patch: { step: 'name' } });
        botSay(S.recFail, () => setPrompt({ type: 'text', placeholder: S.namePh, mic: true }));
      }
      return;
    }

    const d = stateRef.current.data;
    const url = URL.createObjectURL(result.blob);
    dispatch({ type: 'pushCard', msg: { kind: 'voice', audioUrl: url, time: now() } });

    // Upload the actual clip (backend stores it + the silent transcript).
    dispatch({ type: 'set', patch: { busy: true, prompt: null } });
    dispatch({ type: 'pushTyping' });
    try {
      const b64 = await blobToBase64(result.blob);
      const clip = await uploadVoiceClip({
        audioBase64: b64, mime: result.mime, lang: stateRef.current.lang,
        phone: d.phone || '', transcript: result.transcript,
      });
      if (clip?.id) dispatch({ type: 'mergeData', data: { voice_clip_id: clip.id } });
    } catch (err) {
      console.error('voice upload failed:', err);
    }
    dispatch({ type: 'popTyping' });
    dispatch({ type: 'set', patch: { busy: false } });

    // C2 — never auto-submit or eject the citizen. Drop the transcript into an
    // editable box they confirm (or fix). On a failed/empty transcript, keep the
    // box open with a gentle retry hint — the mic (retry) and typing both stay
    // available; we do not fall back to a dead-end error.
    const heard = result.transcript.trim();
    dispatch({ type: 'set', patch: { step: 'describe' } });
    if (heard) {
      botSay(xstr(stateRef.current.lang, 'voiceReview'), () =>
        setPrompt({ type: 'voicetext', mic: true, prefill: heard }));
    } else {
      botSay(xstr(stateRef.current.lang, 'voiceRetry'), () =>
        setPrompt({ type: 'voicetext', mic: true, prefill: '' }));
    }
  };

  // ---- the live-NLU step ---------------------------------------------------
  const handleDescribe = async (text: string) => {
    const S = strings(stateRef.current.lang);
    dispatch({ type: 'set', patch: { busy: true } });
    dispatch({ type: 'pushTyping' });

    const result = await classifyGrievance(text, stateRef.current.lang);

    dispatch({ type: 'popTyping' });
    dispatch({ type: 'set', patch: { busy: false } });

    if (!result) {
      dispatch({ type: 'mergeData', data: { original_text: text } });
      botSay(S.fallbackRoute, () => goTo('scheme'));
      return;
    }

    const ext: ExtractedFields = result.extracted || {};
    dispatch({
      type: 'mergeData',
      data: {
        scheme: result.scheme, issue: result.issue, priority: result.priority,
        original_text: text, english_summary: result.english_summary,
        confidence: result.confidence,
        ...ext,
      },
    });

    const relevant = followsForIssue(result.issue);
    const have = new Set(Object.keys(ext));
    const missing = relevant.filter((k) => !have.has(k));
    dispatch({ type: 'set', patch: { pendingFollows: missing } });

    // The acknowledgment is written by the AI in the citizen's own language.
    botSay(result.citizen_ack || S.ackFallback, () => nextFollow(missing));
  };

  const nextFollow = (queue: FollowKey[]) => {
    if (queue.length === 0) { showSummary(); return; }
    goTo(queue[0]);
  };

  // ---- summary + ticket ----------------------------------------------------
  const showSummary = () => {
    const S = strings(stateRef.current.lang);
    dispatch({ type: 'pushTyping' });
    setTimeout(() => {
      // Build rows here (not before the timeout) so the just-answered final
      // follow-up has flushed into stateRef and appears in the summary.
      const rows = buildRows(stateRef.current.lang, stateRef.current.data);
      dispatch({ type: 'popTyping' });
      dispatch({ type: 'pushCard', msg: { kind: 'summary', text: S.summaryTitle, rows } });
      botSay(S.confirmQ, () => {
        dispatch({ type: 'set', patch: { step: 'confirm' } });
        setPrompt({ type: 'chips', options: [
          { value: 'yes', label: S.yes }, { value: 'no', label: S.noFix },
        ] });
      });
    }, 700);
  };

  const finalize = async () => {
    const d = stateRef.current.data;
    const S = strings(stateRef.current.lang);
    setPrompt(null);
    dispatch({ type: 'set', patch: { busy: true } });
    dispatch({ type: 'pushTyping' });
    try {
      const res = await createTicket({
        name: d.name || 'Citizen',
        phone: d.phone || '',
        lang: (d.lang || 'en') as LangCode,
        state: d.state || '',
        district: d.district || '',
        scheme: (d.scheme || 'other') as SchemeCode,
        issue: (d.issue || 'other') as IssueCode,
        priority: !!d.priority,
        original_text: d.original_text || '',
        english_summary: d.english_summary || d.original_text || '',
        extracted: {},
        detail_rows: buildRows('en', d), // officer dashboard stays English
        voice_clip_id: d.voice_clip_id,
        confidence: typeof d.confidence === 'number' ? d.confidence : undefined,
      });
      dispatch({ type: 'popTyping' });
      dispatch({ type: 'set', patch: { busy: false } });
      dispatch({ type: 'pushCard', msg: {
        kind: 'ticket', tid: res.id, tpriority: res.priority,
        text: res.priority ? S.ticketPri : S.ticketStd,
        headBg: res.priority ? '#6E3FA3' : '#1E9E4A',
        headLabel: res.priority ? 'Priority complaint registered' : 'Complaint registered',
      } });
      // Thank-you + restart hint, then park at the terminal 'done' step.
      botSay([S.thanks, S.restartHint], () => {
        dispatch({ type: 'set', patch: { step: 'done' } });
        setPrompt({ type: 'text', placeholder: 'hi' });
      });
    } catch {
      dispatch({ type: 'popTyping' });
      dispatch({ type: 'set', patch: { busy: false } });
      botSay(S.saveError);
    }
  };

  // ---- tracking old complaints ---------------------------------------------
  const handleTrack = async () => {
    const S = strings(stateRef.current.lang);
    const phone = stateRef.current.data.phone || '';
    dispatch({ type: 'set', patch: { busy: true, prompt: null } });
    dispatch({ type: 'pushTyping' });
    let tickets: Ticket[] = [];
    try {
      tickets = await fetchTicketsByPhone(phone);
    } catch (err) {
      console.error('fetchTicketsByPhone failed:', err);
    }
    dispatch({ type: 'popTyping' });
    dispatch({ type: 'set', patch: { busy: false } });

    if (!tickets.length) {
      botSay(S.noTickets, () => goTo('state'));
      return;
    }
    dispatch({ type: 'mergeData', data: { _trackTickets: tickets } });
    dispatch({ type: 'set', patch: { step: 'trackSelect' } });
    setPrompt({
      type: 'menu', title: S.trackSelectTitle,
      options: tickets.map((t) => ({
        value: t.id,
        label: `${t.id} · ${issueLabelLocalized(stateRef.current.lang, t.issue)}`,
        sub: `${fmtDate(t.created_at)} · ${statusLabel(stateRef.current.lang, t.status)}`,
      })),
    });
  };

  const showTicketStatus = (id: string) => {
    const lang = stateRef.current.lang;
    const S = strings(lang);
    const tickets: Ticket[] = stateRef.current.data._trackTickets || [];
    const t = tickets.find((x) => x.id === id);
    if (!t) { goToFlowChoice(); return; }

    const rows: Array<[string, string]> = [
      [S.tStatusLabel, statusLabel(lang, t.status)],
      [S.tOfficeLabel, t.current_office || t.route],
      [S.tOpenedOn, fmtDate(t.created_at)],
    ];
    const history = Array.isArray(t.updates) ? t.updates : [];
    if (history.length) {
      rows.push([S.tUpdatesLabel, history.map((u) => `${fmtDate(u.ts)} — ${statusLabel(lang, u.status)}`).join('\n')]);
    } else {
      rows.push([S.tUpdatesLabel, S.tNoUpdates]);
    }
    // O3 — the routing trail: which office it moved to and why (citizen-visible).
    const events = Array.isArray(t.events) ? t.events : [];
    if (events.length) {
      const trail = [...events]
        .sort((a, b) => a.created_at.localeCompare(b.created_at))
        .map((e) => `${e.to_office} — “${e.comment}”`)
        .join('\n');
      rows.push([xstr(lang, 'trailLabel'), trail]);
    }

    dispatch({ type: 'pushCard', msg: { kind: 'summary', text: t.id, rows } });
    // Offer the choice menu again so they can track another or raise a new one.
    goToFlowChoice();
  };

  // ---- render --------------------------------------------------------------
  return (
    <ChatView
      state={state}
      onBack={() => nav('/')}
      onPickLanguage={pickLanguage}
      onSubmit={submit}
      onMicRequest={onMicRequest}
      onVoiceRecorded={onVoiceRecorded}
      onChangeLang={() => dispatch({ type: 'set', patch: { langSheetOpen: true } })}
      onCloseLangSheet={() => dispatch({ type: 'set', patch: { langSheetOpen: false } })}
      langCodeShort={langCodeShort(state.lang)}
    />
  );
}

// ---- summary/detail rows from collected data -------------------------------
// Localized when lang is the citizen's; English when lang === 'en' (officer).
function buildRows(lang: string, d: Record<string, any>): Array<[string, string]> {
  const rows: Array<[string, string]> = [];
  if (d.issue) rows.push([rowLabel(lang, 'issue'), issueLabelLocalized(lang, d.issue)]);
  if (d.scheme) rows.push([rowLabel(lang, 'scheme'), schemeLabelLocalized(lang, d.scheme)]);
  for (const key of ROW_ORDER) {
    const v = d[key];
    if (v === undefined || v === null || v === '') continue;
    // A comma-joined value (e.g. expanded "All of the above") renders each part.
    const s = String(v);
    const label = s.includes(',')
      ? s.split(',').map((x) => optLabel(lang, x.trim())).join(', ')
      : optLabel(lang, s);
    rows.push([rowLabel(lang, key), label]);
  }
  if (d.original_text) rows.push([rowLabel(lang, 'original_text'), d.original_text]);
  return rows;
}

function statusLabel(lang: string, status: TicketStatus): string {
  const S = strings(lang);
  const map: Record<TicketStatus, string> = {
    open: S.stOpen, progress: S.stProgress, escalated: S.stEscalated, resolved: S.stResolved,
  };
  return map[status] || status;
}

function fmtDate(iso: string): string {
  try { return new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }); }
  catch { return iso; }
}
