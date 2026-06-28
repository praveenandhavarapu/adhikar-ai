import type { SchemeCode, IssueCode } from '../lib/types';

// ---- Welfare schemes (ported from the prototype) ---------------------------
export interface Scheme {
  value: SchemeCode;
  label: string;
  sub: string;
  mono: string;
  tint: string;
  fg: string;
}

export const SCHEMES: Scheme[] = [
  { value: 'pds', label: 'Ration / Food grains', sub: 'PDS', mono: 'PD', tint: '#fdeede', fg: '#c2660a' },
  { value: 'mgnrega', label: 'Employment wages', sub: 'MGNREGA', mono: 'MG', tint: '#e7f0fb', fg: '#1F84D6' },
  { value: 'nsap', label: 'Pension (old age / widow / disability)', sub: 'NSAP', mono: 'PE', tint: '#efeaf6', fg: '#6E3FA3' },
  { value: 'pmkisan', label: 'Farmer income support', sub: 'PM-KISAN', mono: 'KI', tint: '#e6f5ec', fg: '#1E9E4A' },
  { value: 'pmjay', label: 'Health coverage', sub: 'Ayushman Bharat PM-JAY', mono: 'JA', tint: '#fdecec', fg: '#c0392b' },
  { value: 'ujjwala', label: 'LPG connection', sub: 'PM Ujjwala', mono: 'UJ', tint: '#fff4e0', fg: '#b9770a' },
  { value: 'awas', label: 'Housing assistance', sub: 'PM Awas Yojana', mono: 'AW', tint: '#e9eef4', fg: '#0B3C6B' },
  { value: 'other', label: 'Something else', sub: '', mono: '…', tint: '#eef1f5', fg: '#5b7488' },
];

export const schemeLabel = (v: string) => {
  const s = SCHEMES.find((x) => x.value === v);
  return s ? s.sub || s.label : '—';
};
export const schemeLong = (v: string) => {
  const s = SCHEMES.find((x) => x.value === v);
  return s ? s.label : '—';
};

// ---- Issue categories ------------------------------------------------------
export interface Issue {
  value: IssueCode;
  label: string;
}

export const ISSUES: Issue[] = [
  { value: 'stopped', label: 'Benefit has stopped or never arrived' },
  { value: 'biometric', label: 'Fingerprint / iris authentication fails' },
  { value: 'payment', label: 'Payment missing or going to wrong account' },
  { value: 'denied', label: 'I was denied access at the shop / hospital / office' },
  { value: 'bribe', label: 'A bribe or unofficial payment was demanded' },
  { value: 'details', label: 'My personal details are recorded incorrectly' },
  { value: 'other', label: 'Other' },
];

export const issueLabel = (v: string) => {
  const i = ISSUES.find((x) => x.value === v);
  return i ? i.label : '—';
};

// Which government cell handles a (scheme, issue) — used to set ticket route.
export function routeFor(scheme: SchemeCode, issue: IssueCode, district: string): string {
  if (issue === 'bribe') return 'State Anti-Corruption Cell';
  const cell: Record<SchemeCode, string> = {
    pds: 'FPS / CSC',
    mgnrega: 'MGNREGA Cell',
    nsap: 'Pension Cell',
    pmkisan: 'PM-KISAN PMU',
    pmjay: 'PM-JAY District Grievance',
    ujjwala: 'Oil Marketing Co. / District Supply',
    awas: 'PMAY Cell',
    other: 'District Grievance Cell',
  };
  return `${cell[scheme]}, ${district}`;
}
