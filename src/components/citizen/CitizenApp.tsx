// ============================================================================
// CitizenApp — the WhatsApp-style grievance flow.
//
// Flow: language → name → state → district → FREE-TEXT (live NLU) → follow-ups
//       for any fields the AI couldn't extract → summary → ticket.
//
// The AI is CENTRAL here: the citizen describes the problem in their own words
// and the model classifies scheme + issue and extracts fields. If confidence
// is low or the model is unavailable, we fall back to the guided menus so the
// flow never dead-ends.
// ============================================================================
import { useEffect, useReducer, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { LANGS, langCodeShort, resolveLang } from '../../data/languages';
import { STATES, districtsFor } from '../../data/geography';
import { SCHEMES, ISSUES, schemeLong, issueLabel } from '../../data/schemes';
import { strings, WELCOME } from '../../data/i18n';
import { classifyGrievance, createTicket } from '../../lib/api';
import type {
  ExtractedFields, IssueCode, LangCode, SchemeCode,
} from '../../lib/types';
import ChatView from './ChatView';
import type { ChatMessage, Prompt } from './chatTypes';

// ---- follow-up question definitions (only asked if AI didn't extract) ------
type FollowKey =
  | 'duration' | 'location' | 'amount' | 'person_age'
  | 'occupation' | 'bank_linked' | 'detail_field' | 'paid';

interface State {
  lang: string;
  stage: 'lang' | 'chat';
  messages: ChatMessage[];
  step: string;
  data: Record<string, any>;
  prompt: Prompt | null;
  pendingFollows: FollowKey[];
  busy: boolean;        // AI call in flight
  langSheetOpen: boolean;
}

type Action =
  | { type: 'set'; patch: Partial<State> }
  | { type: 'pushUser'; text: string; voice?: boolean }
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
      return { ...s, messages: [...s.messages, { kind: a.voice ? 'voice' : 'user', text: a.text, time: now() }] };
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
    const arr = Array.isArray(lines) ? lines : [lines];
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

  // ---- boot ----------------------------------------------------------------
  useEffect(() => {
    botSay([WELCOME], () => {
      setPrompt({
        type: 'lang-list',
        options: LANGS.map((L) => ({ value: L.code, label: L.native, sub: L.roman })),
      });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---- language pick -------------------------------------------------------
  const pickLanguage = (code: string) => {
    const real = resolveLang(code);
    const L = LANGS.find((x) => x.code === code);
    dispatch({ type: 'pushUser', text: L ? L.native : 'English' });
    dispatch({ type: 'set', patch: { lang: real, stage: 'chat', step: 'name', langSheetOpen: false } });
    dispatch({ type: 'mergeData', data: { lang: real } });
    const S = strings(real);
    botSay([S.greet, S.askName], () => setPrompt({ type: 'text', placeholder: S.namePh, mic: true }));
  };

  // ---- the main engine -----------------------------------------------------
  const goTo = (step: string) => {
    const S = strings(stateRef.current.lang);
    dispatch({ type: 'set', patch: { step } });
    switch (step) {
      case 'state':
        botSay(S.askState, () => setPrompt({ type: 'chips', options: STATES.map((s) => ({ value: s, label: s })) }));
        break;
      case 'district':
        botSay(S.askDistrict, () => setPrompt({
          type: 'chips',
          options: districtsFor(stateRef.current.data.state).map((s) => ({ value: s, label: s })),
        }));
        break;
      case 'describe':
        // THE AI MOMENT: free text instead of a scheme menu.
        botSay(S.voicePrompt, () => setPrompt({ type: 'voicetext', placeholder: '…or type it instead' }));
        break;
      // ---- follow-ups (only those the AI couldn't extract) ----
      case 'duration':
        botSay(S.askDur, () => setPrompt({ type: 'chips', options: chips([
          { value: '<1m', label: 'Less than 1 month' }, { value: '1-3m', label: '1–3 months' },
          { value: '3-6m', label: '3–6 months' }, { value: '>6m', label: 'More than 6 months' },
          { value: 'ns', label: 'Not sure' },
        ]) }));
        break;
      case 'location':
        botSay(S.askBioLoc, () => setPrompt({ type: 'chips', options: chips([
          { value: 'fps', label: 'Ration shop' }, { value: 'bank', label: 'Bank' },
          { value: 'csc', label: 'CSC / Aadhaar centre' }, { value: 'hosp', label: 'Hospital' },
          { value: 'office', label: 'Govt office' },
        ]) }));
        break;
      case 'amount':
        botSay(S.askBribeAmt, () => setPrompt({ type: 'chips', options: chips([
          { value: '<100', label: 'Under ₹100' }, { value: '100-500', label: '₹100–500' },
          { value: '500-1000', label: '₹500–1000' }, { value: '>1000', label: 'Over ₹1000' },
          { value: 'ns', label: 'Not sure' },
        ]) }));
        break;
      case 'person_age':
        botSay(S.askBioAge, () => setPrompt({ type: 'chips', options: chips([
          { value: 'u60', label: 'Below 60' }, { value: '60-70', label: '60–70' }, { value: 'a70', label: 'Above 70' },
        ]) }));
        break;
      case 'occupation':
        botSay(S.askBioOcc, () => setPrompt({ type: 'chips', options: chips([
          { value: 'agri', label: 'Agricultural labour' }, { value: 'domestic', label: 'Domestic work' },
          { value: 'trade', label: 'Trade / shop' }, { value: 'other', label: 'Other' },
        ]) }));
        break;
      case 'bank_linked':
        botSay(S.askBank, () => setPrompt({ type: 'chips', options: chips([
          { value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }, { value: 'ns', label: 'Not sure' },
        ]) }));
        break;
      case 'paid':
        botSay(S.askBribePaid, () => setPrompt({ type: 'chips', options: chips([
          { value: 'yes', label: 'Yes, I paid' }, { value: 'no', label: "No, I couldn't" }, { value: 'refused', label: 'I refused' },
        ]) }));
        break;
      case 'scheme': // fallback menu
        botSay(S.askScheme, () => setPrompt({
          type: 'menu', title: 'Which benefit?',
          options: SCHEMES.map((s) => ({ value: s.value, label: s.label, sub: s.sub, mono: s.mono, tint: s.tint, fg: s.fg })),
        }));
        break;
      case 'issue': // fallback menu
        botSay(S.askIssue, () => setPrompt({
          type: 'menu', title: 'What issue are you facing?',
          options: ISSUES.map((s) => ({ value: s.value, label: s.label })),
        }));
        break;
    }
  };

  const chips = (arr: { value: string; label: string }[]) => arr;

  // ---- field key -> follow-up step relevance per issue ---------------------
  const followsForIssue = (issue: IssueCode): FollowKey[] => {
    switch (issue) {
      case 'stopped': return ['duration', 'bank_linked'];
      case 'biometric': return ['location', 'person_age', 'occupation'];
      case 'payment': return ['bank_linked'];
      case 'denied': return ['location'];
      case 'bribe': return ['location', 'amount', 'paid'];
      case 'details': return ['detail_field'];
      default: return [];
    }
  };

  // ---- handle submit -------------------------------------------------------
  const submit = (value: string, label?: string, isVoice?: boolean) => {
    dispatch({ type: 'pushUser', text: label || value, voice: isVoice });
    advance(value, label || value);
  };

  const advance = async (value: string, label: string) => {
    const step = stateRef.current.step;
    switch (step) {
      case 'name':
        dispatch({ type: 'mergeData', data: { name: label } });
        goTo('state'); break;
      case 'state':
        dispatch({ type: 'mergeData', data: { state: value } });
        goTo('district'); break;
      case 'district':
        dispatch({ type: 'mergeData', data: { district: value } });
        goTo('describe'); break;
      case 'describe':
        await handleDescribe(label); break;
      case 'scheme':
        dispatch({ type: 'mergeData', data: { scheme: value } });
        goTo('issue'); break;
      case 'issue': {
        dispatch({ type: 'mergeData', data: { issue: value, priority: value === 'bribe' } });
        const follows = followsForIssue(value as IssueCode);
        dispatch({ type: 'set', patch: { pendingFollows: follows } });
        nextFollow(follows); break;
      }
      // follow-up answers
      case 'duration': case 'location': case 'amount': case 'person_age':
      case 'occupation': case 'bank_linked': case 'paid': {
        dispatch({ type: 'mergeData', data: { [step]: label } });
        const remaining = stateRef.current.pendingFollows.filter((f) => f !== step);
        dispatch({ type: 'set', patch: { pendingFollows: remaining } });
        nextFollow(remaining); break;
      }
      case 'confirm':
        if (value === 'yes') finalize();
        else goTo('describe');
        break;
    }
  };

  // ---- the live-NLU step ---------------------------------------------------
  const handleDescribe = async (text: string) => {
    dispatch({ type: 'set', patch: { busy: true } });
    dispatch({ type: 'pushTyping' });

    const result = await classifyGrievance(text, stateRef.current.lang);

    dispatch({ type: 'popTyping' });
    dispatch({ type: 'set', patch: { busy: false } });

    if (!result) {
      // Low confidence / unavailable → graceful fallback to guided menus.
      dispatch({ type: 'mergeData', data: { original_text: text } });
      botSay(
        "Let me make sure I route this correctly — a couple of quick taps:",
        () => goTo('scheme'),
      );
      return;
    }

    // Map AI output onto the data object.
    const ext: ExtractedFields = result.extracted || {};
    dispatch({
      type: 'mergeData',
      data: {
        scheme: result.scheme, issue: result.issue, priority: result.priority,
        original_text: text, english_summary: result.english_summary,
        ...ext,
      },
    });

    // Only ask the follow-ups the AI couldn't already fill.
    const relevant = followsForIssue(result.issue);
    const have = new Set(Object.keys(ext));
    const missing = relevant.filter((k) => !have.has(k));
    dispatch({ type: 'set', patch: { pendingFollows: missing } });

    botSay(
      `Understood — this looks like a ${issueLabel(result.issue).toLowerCase()} issue with ${schemeLong(result.scheme)}.`,
      () => nextFollow(missing),
    );
  };

  const nextFollow = (queue: FollowKey[]) => {
    if (queue.length === 0) { showSummary(); return; }
    goTo(queue[0]);
  };

  // ---- summary + ticket ----------------------------------------------------
  const showSummary = () => {
    const S = strings(stateRef.current.lang);
    const rows = buildSummaryRows(stateRef.current.data);
    dispatch({ type: 'pushTyping' });
    setTimeout(() => {
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
        lang: (d.lang || 'en') as LangCode,
        state: d.state || '',
        district: d.district || '',
        scheme: (d.scheme || 'other') as SchemeCode,
        issue: (d.issue || 'other') as IssueCode,
        priority: !!d.priority,
        original_text: d.original_text || '',
        english_summary: d.english_summary || d.original_text || '',
        extracted: {},
        detail_rows: buildSummaryRows(d),
      });
      dispatch({ type: 'popTyping' });
      dispatch({ type: 'set', patch: { busy: false } });
      dispatch({ type: 'pushCard', msg: {
        kind: 'ticket', tid: res.id, tpriority: res.priority,
        text: res.priority ? S.ticketPri : S.ticketStd,
        headBg: res.priority ? '#6E3FA3' : '#1E9E4A',
        headLabel: res.priority ? 'Priority complaint registered' : 'Complaint registered',
      } });
      dispatch({ type: 'set', patch: { step: 'done' } });
    } catch {
      dispatch({ type: 'popTyping' });
      dispatch({ type: 'set', patch: { busy: false } });
      botSay('Something went wrong saving your complaint. Please try again in a moment.');
    }
  };

  // ---- render --------------------------------------------------------------
  return (
    <ChatView
      state={state}
      onBack={() => nav('/')}
      onPickLanguage={pickLanguage}
      onSubmit={submit}
      onChangeLang={() => dispatch({ type: 'set', patch: { langSheetOpen: true } })}
      onCloseLangSheet={() => dispatch({ type: 'set', patch: { langSheetOpen: false } })}
      langCodeShort={langCodeShort(state.lang)}
    />
  );
}

// ---- summary rows from collected data --------------------------------------
function buildSummaryRows(d: Record<string, any>): Array<[string, string]> {
  const rows: Array<[string, string]> = [];
  rows.push(['Issue', issueLabel(d.issue)]);
  rows.push(['Scheme', schemeLong(d.scheme)]);
  if (d.duration) rows.push(['Duration', labelFor('duration', d.duration)]);
  if (d.location) rows.push(['Location', labelFor('location', d.location)]);
  if (d.person_age) rows.push(['Person age', labelFor('person_age', d.person_age)]);
  if (d.occupation) rows.push(['Occupation', labelFor('occupation', d.occupation)]);
  if (d.bank_linked) rows.push(['Bank account', d.bank_linked === 'yes' ? 'Linked' : d.bank_linked === 'no' ? 'Not linked' : 'Unsure']);
  if (d.amount) rows.push(['Amount', labelFor('amount', d.amount)]);
  if (d.paid) rows.push(['Paid?', d.paid]);
  if (d.original_text) rows.push(['In their words', d.original_text]);
  return rows;
}

function labelFor(_k: string, v: string): string {
  const map: Record<string, string> = {
    '<1m': 'Less than 1 month', '1-3m': '1–3 months', '3-6m': '3–6 months', '>6m': 'More than 6 months',
    ns: 'Not sure', fps: 'Ration shop', bank: 'Bank', csc: 'CSC / Aadhaar centre', hosp: 'Hospital',
    office: 'Govt office', u60: 'Below 60', '60-70': '60–70', a70: 'Above 70',
    agri: 'Agricultural labour', domestic: 'Domestic work', trade: 'Trade / shop', other: 'Other',
    '<100': 'Under ₹100', '100-500': '₹100–500', '500-1000': '₹500–1000', '>1000': 'Over ₹1000',
  };
  return map[v] || v;
}
