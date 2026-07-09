-- ============================================================================
-- AdhikarAI — Supabase schema
-- Run this in: Supabase Dashboard -> SQL Editor -> New query -> Run
-- ============================================================================

create extension if not exists "pgcrypto";

-- ---- tickets ----------------------------------------------------------------
create table if not exists public.tickets (
  id                      text primary key,           -- ADH-2026-#####
  name                    text not null,
  lang                    text not null,
  lang_label              text not null,
  state                   text not null,
  district                text not null,
  scheme                  text not null,
  issue                   text not null,
  status                  text not null default 'open'
                            check (status in ('open','progress','escalated','resolved')),
  priority                boolean not null default false,
  sla                     text not null default 'std' check (sla in ('std','pri')),
  contact_masked          text not null default '•••• •••• ••',
  route                   text not null,
  original_text           text not null default '',
  english_summary         text not null default '',
  detail_rows             jsonb not null default '[]'::jsonb,
  -- Officer-side AI, generated once at intake and stored (stable + auditable):
  ai_root_cause           text not null default '',
  ai_suggested_resolution text not null default '',
  ai_cross_scheme         jsonb not null default '[]'::jsonb,
  created_at              timestamptz not null default now()
);

create index if not exists tickets_status_idx   on public.tickets (status);
create index if not exists tickets_district_idx on public.tickets (district);
create index if not exists tickets_scheme_idx   on public.tickets (scheme);
create index if not exists tickets_created_idx  on public.tickets (created_at desc);

-- ---- additive columns (safe to re-run on an existing install) ----------------
-- phone: self-declared device number, used as the citizen's user id so all their
--        tickets group together and they can track past complaints.
-- updates: status-change history [{ts,status}, …] powering the tracking timeline.
alter table public.tickets add column if not exists phone   text not null default '';
alter table public.tickets add column if not exists updates jsonb not null default '[]'::jsonb;

create index if not exists tickets_phone_idx on public.tickets (phone);

-- ---- Phase 3 (O1): AI analysis stored once at intake + routing/aggregation ---
-- All ai_* fields come from the SINGLE classifier call at intake (no per-view API
-- call). current_office powers the tracking trail; resolved_at + target_month_key
-- power the gamified Home aggregates.
alter table public.tickets add column if not exists ai_summary          text not null default '';
alter table public.tickets add column if not exists ai_category         text not null default '';
alter table public.tickets add column if not exists ai_issue_family     text not null default '';
alter table public.tickets add column if not exists ai_recommended_office text not null default '';
alter table public.tickets add column if not exists ai_confidence       real not null default 0;
alter table public.tickets add column if not exists ai_generated_at     timestamptz;
alter table public.tickets add column if not exists current_office      text not null default '';
alter table public.tickets add column if not exists resolved_at         timestamptz;
alter table public.tickets add column if not exists target_month_key    text not null default '';

create index if not exists tickets_current_office_idx on public.tickets (current_office);
create index if not exists tickets_month_idx          on public.tickets (target_month_key);

-- ---- Row Level Security -----------------------------------------------------
-- Functions use the service_role key and bypass RLS. The browser uses the anon
-- key. For this no-auth demo we allow the anon role to read tickets (the
-- dashboard is open) but NOT to write — all writes go through the secured
-- create-ticket function. Tighten read access here when you add officer auth.
alter table public.tickets enable row level security;

drop policy if exists "anon can read tickets" on public.tickets;
create policy "anon can read tickets"
  on public.tickets for select
  to anon
  using (true);

-- (No insert/update/delete policy for anon: writes happen via service_role only.)

-- ---- voice_clips ------------------------------------------------------------
-- Real audio voice notes recorded by the citizen. The file itself lives in the
-- "voice-clips" Storage bucket; this table holds the metadata + public URL and
-- links the clip to its ticket so the officer dashboard can play it.
create table if not exists public.voice_clips (
  id          uuid primary key default gen_random_uuid(),
  ticket_id   text references public.tickets (id) on delete set null,
  phone       text not null default '',
  lang        text not null default 'en',
  url         text not null,
  transcript  text not null default '',
  created_at  timestamptz not null default now()
);
create index if not exists voice_clips_ticket_idx on public.voice_clips (ticket_id);
create index if not exists voice_clips_phone_idx  on public.voice_clips (phone);

alter table public.voice_clips enable row level security;
drop policy if exists "anon can read voice_clips" on public.voice_clips;
create policy "anon can read voice_clips"
  on public.voice_clips for select
  to anon
  using (true);
-- (Writes happen via the secured upload-voice function using service_role.)

-- ---- Storage bucket for the audio files -------------------------------------
-- Public-read bucket so the officer dashboard's <audio> player can stream clips.
insert into storage.buckets (id, name, public)
values ('voice-clips', 'voice-clips', true)
on conflict (id) do nothing;

drop policy if exists "public read voice-clips" on storage.objects;
create policy "public read voice-clips"
  on storage.objects for select
  to public
  using (bucket_id = 'voice-clips');

-- ---- Seed data (the prototype's demo tickets, so the dashboard is alive) ----
insert into public.tickets
  (id, name, lang, lang_label, state, district, scheme, issue, status, priority, sla,
   contact_masked, route, original_text, english_summary, detail_rows,
   ai_root_cause, ai_suggested_resolution, ai_cross_scheme, created_at)
values
  ('ADH-2026-00425','P. Saroja','te','Telugu','Telangana','Warangal','nsap','biometric','open',false,'std',
   '•••• ••42 17','UIDAI / Pension Cell, Warangal',
   'మా అమ్మ వేలిముద్ర పడట్లేదు, ఆమెకు డెబ్బై ఏళ్లు, పింఛను ఆగిపోయింది',
   'My mother''s fingerprint won''t register, she is 70, the pension has stopped.',
   '[["Issue","Iris authentication failing"],["Scheme","NSAP — Old-age pension"],["Person age","Above 70"],["Occupation","Agricultural labour"],["Location","Bank"]]',
   'Worn fingerprints from manual labour plus advanced age cause repeated biometric authentication failures. Person is 70+ and an agricultural labourer.',
   'Apply the biometric exception clause: authorise manual verification at the pension cell and trigger an Aadhaar biometric update at the nearest CSC.',
   '["pds","pmjay"]', now() - interval '1 day'),

  ('ADH-2026-00427','K. Ramesh','te','Telugu','Telangana','Khammam','pmkisan','payment','progress',false,'std',
   '•••• ••88 03','NPCI / District Treasury, Khammam',
   'నా కిసాన్ డబ్బులు వేరే ఖాతాలోకి వెళ్ళాయి, కొత్త బ్యాంక్ ఖాతా జోడించాను',
   'My PM-KISAN money went to someone else''s account. I had linked a new bank account.',
   '[["Issue","Payment to wrong account"],["Scheme","PM-KISAN (+2 linked)"],["Recent bank link","Yes"],["Intended bank","Grameena Bank"]]',
   'A newly linked bank account triggered the Last-Account-Linked-to-Aadhaar (LALA) rule, redirecting all DBT credits to the wrong account. Same root cause affects every DBT scheme.',
   'Reset the NPCI Aadhaar-bank mapping to the intended account, then re-trigger the held DBT credits across all three schemes.',
   '["mgnrega","nsap"]', now() - interval '2 days'),

  ('ADH-2026-00429','M. Yadaiah','hi','Hindi','Telangana','Nalgonda','pds','bribe','escalated',true,'pri',
   '•••• ••11 90','State Anti-Corruption Cell',
   'राशन की दुकान पर ₹200 मांगे गए, नहीं दिया तो अनाज नहीं दिया',
   '₹200 was demanded at the ration shop; when I refused, grain was withheld.',
   '[["Issue","Bribe demanded"],["Scheme","PDS — Ration"],["Location","Ration shop (FPS)"],["Amount","₹100–500"],["Paid?","No, refused"]]',
   'Fair Price Shop dealer is conditioning entitled rations on an unofficial payment — a direct corruption case, not a system failure.',
   'Route to Anti-Corruption Cell under 24h SLA, issue rations through an alternate FPS immediately, and share helpline 1947 with the citizen.',
   '[]', now()),

  ('ADH-2026-00430','S. Latha','te','Telugu','Telangana','Hyderabad','pmjay','denied','open',false,'std',
   '•••• ••55 21','PM-JAY District Grievance, Hyderabad',
   'ఆసుపత్రిలో కార్డు ఉన్నా చేర్చుకోలేదు, డబ్బు కట్టమన్నారు',
   'Even with a valid card the hospital refused admission and asked for payment.',
   '[["Issue","Denied admission at hospital"],["Scheme","Ayushman Bharat PM-JAY"],["Location","Empanelled hospital"],["Card status","Valid"]]',
   'An empanelled hospital is refusing a valid PM-JAY card, possibly over reimbursement disputes — a provider-compliance issue.',
   'Issue a compliance notice to the empanelled hospital and arrange admission at an alternate PM-JAY hospital in the interim.',
   '[]', now() - interval '1 day'),

  ('ADH-2026-00433','R. Devi','hi','Hindi','Bihar','Patna','ujjwala','stopped','open',false,'std',
   '•••• ••70 64','Oil Marketing Co. / District Supply, Patna',
   'गैस कनेक्शन के लिए आवेदन किया था, आज तक नहीं मिला, सिर्फ आधार है मेरे पास',
   'I applied for the gas connection but never received it. I only have Aadhaar.',
   '[["Issue","Connection never received"],["Scheme","PM Ujjwala — LPG"],["Documents","Aadhaar only"],["Bank account","Not linked"]]',
   'Connection is blocked because the subsidy cannot be paid without an Aadhaar-linked bank account; the citizen holds only Aadhaar.',
   'Recommend opening a free Jan Dhan account, then release the Ujjwala connection once the bank link is active.',
   '["pmkisan"]', now() - interval '3 days'),

  -- Resolved demo tickets spread across offices + the last 30 days so the Home
  -- dashboard (completion ring, leaderboard, streak, 30-day sparkline) has real
  -- data to aggregate. Kept terse; ai_* + offices are filled by the backfill.
  ('ADH-2026-00401','A. Kumar','hi','Hindi','Telangana','Warangal','pds','stopped','resolved',false,'std',
   '•••• ••10 01','FPS / CSC, Warangal','राशन नहीं मिल रहा था','Ration had stopped; restored after eKYC.','[]',
   '','','[]', now() - interval '2 days'),
  ('ADH-2026-00402','B. Rao','te','Telugu','Telangana','Khammam','mgnrega','payment','resolved',false,'std',
   '•••• ••10 02','MGNREGA Cell, Khammam','కూలి డబ్బు రాలేదు','Wage payment released after NPCI remap.','[]',
   '','','[]', now() - interval '4 days'),
  ('ADH-2026-00403','C. Devi','hi','Hindi','Bihar','Patna','nsap','stopped','resolved',false,'std',
   '•••• ••10 03','Pension Cell, Patna','पेंशन बंद','Pension resumed after life-certificate update.','[]',
   '','','[]', now() - interval '9 days'),
  ('ADH-2026-00404','D. Singh','hi','Hindi','Bihar','Gaya','pmkisan','payment','resolved',false,'std',
   '•••• ••10 04','PM-KISAN PMU, Gaya','किसान किश्त नहीं आई','Instalment credited after Aadhaar seeding.','[]',
   '','','[]', now() - interval '12 days'),
  ('ADH-2026-00405','E. Bai','mr','Marathi','Maharashtra','Pune','pmjay','denied','resolved',false,'std',
   '•••• ••10 05','PM-JAY District Grievance, Pune','इलाज नकारला','Admission arranged at alternate hospital.','[]',
   '','','[]', now() - interval '15 days'),
  ('ADH-2026-00406','F. Khan','hi','Hindi','Telangana','Nalgonda','pds','details','resolved',false,'std',
   '•••• ••10 06','FPS / CSC, Nalgonda','नाम गलत','Name corrected on ration card.','[]',
   '','','[]', now() - interval '20 days'),
  ('ADH-2026-00407','G. Naidu','te','Telugu','Telangana','Warangal','nsap','biometric','resolved',false,'std',
   '•••• ••10 07','Pension Cell, Warangal','వేలిముద్ర పడలేదు','Manual verification approved.','[]',
   '','','[]', now() - interval '1 day'),
  ('ADH-2026-00408','H. Lal','hi','Hindi','Bihar','Patna','mgnrega','stopped','resolved',false,'std',
   '•••• ••10 08','MGNREGA Cell, Patna','काम नहीं मिला','Work allotted under demand register.','[]',
   '','','[]', now() - interval '6 days')
on conflict (id) do nothing;

-- ---- Backfill the Phase 3 columns for existing / seed rows -------------------
-- Keeps older rows (and the demo seed) consistent with the office taxonomy so
-- the tracking trail, office filters and Home aggregates have real data. Office
-- strings MUST match src/data/offices.ts EN names exactly (grouped/filtered by
-- this string). Safe to re-run: only touches rows not yet backfilled.
update public.tickets set
  ai_summary          = coalesce(nullif(ai_summary, ''), english_summary),
  ai_category         = coalesce(nullif(ai_category, ''), scheme),
  ai_issue_family     = coalesce(nullif(ai_issue_family, ''), issue),
  ai_confidence       = case when ai_confidence = 0 then 0.9 else ai_confidence end,
  ai_generated_at     = coalesce(ai_generated_at, created_at),
  resolved_at         = coalesce(resolved_at, case when status = 'resolved' then created_at end),
  target_month_key    = coalesce(nullif(target_month_key, ''), to_char(created_at, 'YYYY-MM')),
  ai_recommended_office = coalesce(nullif(ai_recommended_office, ''),
    case
      when issue = 'bribe' then 'State Anti-Corruption Cell'
      when scheme = 'pds' then 'Civil Supplies (PDS)'
      when scheme = 'mgnrega' then 'Rural Development (MGNREGA)'
      when scheme = 'nsap' then 'Pension Cell (NSAP)'
      when scheme = 'pmkisan' then 'PM-KISAN PMU'
      when scheme = 'pmjay' then 'Health / PM-JAY Grievance'
      when scheme = 'ujjwala' then 'District Supply / LPG'
      when scheme = 'awas' then 'Housing (PMAY)'
      else 'District Grievance Cell'
    end),
  current_office = coalesce(nullif(current_office, ''),
    case
      when issue = 'bribe' then 'State Anti-Corruption Cell'
      when scheme = 'pds' then 'Civil Supplies (PDS)'
      when scheme = 'mgnrega' then 'Rural Development (MGNREGA)'
      when scheme = 'nsap' then 'Pension Cell (NSAP)'
      when scheme = 'pmkisan' then 'PM-KISAN PMU'
      when scheme = 'pmjay' then 'Health / PM-JAY Grievance'
      when scheme = 'ujjwala' then 'District Supply / LPG'
      when scheme = 'awas' then 'Housing (PMAY)'
      else 'District Grievance Cell'
    end)
where current_office = '' or ai_recommended_office = '' or target_month_key = '';

-- ---- ticket_events: routing hops with mandatory comments (O3) ----------------
create table if not exists public.ticket_events (
  id          uuid primary key default gen_random_uuid(),
  ticket_id   text not null references public.tickets (id) on delete cascade,
  from_office text not null default '',
  to_office   text not null default '',
  comment     text not null,
  actor_phone text not null default '',
  created_at  timestamptz not null default now()
);
create index if not exists ticket_events_ticket_idx on public.ticket_events (ticket_id);

alter table public.ticket_events enable row level security;
drop policy if exists "anon can read ticket_events" on public.ticket_events;
create policy "anon can read ticket_events"
  on public.ticket_events for select
  to anon
  using (true);
-- (Writes happen via the secured route-ticket function using service_role.)
