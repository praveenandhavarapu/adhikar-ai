# AdhikarAI — Testing SOP (for the new features)

A step-by-step guide to run the app on your own computer and check that every
new feature works. Written for someone new to coding — just follow it top to
bottom. You can't break anything.

> ✅ You have already done the one prerequisite: re-running `supabase/schema.sql`
> in Supabase. Good. Everything below assumes that's done.

---

## Part 1 — Start the app (the RIGHT way)

The app has two halves that must run together: the **web page** and the **AI +
database functions**. A single command runs both: `netlify dev`.

> ⚠️ Do NOT use `npm run dev` for this testing. That only runs the web page, so
> voice notes, saving tickets, and tracking will fail. Always use `netlify dev`.

1. **Open the Terminal.**
   - Press `Cmd + Space`, type `Terminal`, press Enter.

2. **Point the Terminal at the project folder.** Type `cd ` (the letters c, d,
   then a space), then drag the `projectaa` folder into the Terminal window and
   press Enter. It will look like:
   ```
   cd /Users/praveenandhavarapu/Desktop/projectaa
   ```

3. **Start everything.** Type:
   ```
   netlify dev
   ```
   Press Enter and wait ~15 seconds. When it's ready you'll see a line with a
   web address, usually:
   ```
   ◈ Server now ready on http://localhost:8888
   ```

4. **Open that address in Google Chrome.** Type `http://localhost:8888` into
   Chrome's address bar. (Use **Chrome** — voice recording needs it.)

You should see the AdhikarAI landing page with two cards: **I am a Citizen** and
**District Officer**.

> **To stop the app later:** click in the Terminal and press `Ctrl + C`.

---

## Part 2 — Test the Citizen side

Click **I am a Citizen**.

### Test A — A non-Hindi language works fully  *(the original bug)*
1. Pick **മലയാളം (Malayalam)** — or Marathi, Kannada, any language.
2. **What to look for:** every message the bot sends — the greeting, the phone
   question, the name question, the follow-up questions, the summary — is in
   that language. Nothing should suddenly appear in English mid-conversation.

### Test B — First-time phone + name
1. On this first run it will ask for your **phone number**. Type any 10 digits
   (e.g. `9876543210`) and send.
2. It asks your **name**. Type a name (e.g. `Ramesh`) and send.
3. **What to look for:** it goes straight into raising a complaint (asks your
   state). That's correct — a brand-new user has nothing to track yet.

### Test C — Voice note  *(record → yes/no → clip)*
1. Continue until it says *"Tell me in your own words…"* and shows a text box
   with a **🎙 mic button**.
2. Tap the **🎙 mic**. The bot asks *"Shall I record this as a voice note?"*
   with **Yes / No** buttons.
3. Tap **Yes**. If Chrome asks to **Allow the microphone**, click **Allow**.
4. Tap the big round record button, **speak your complaint** (in your chosen
   language), then tap it again to stop.
5. **What to look for:**
   - A voice bubble appears with a **play button** — you can play back your own
     recording. (It does NOT dump your words into the text box — that was the
     old behaviour we removed.)
   - The bot then understands the complaint and continues asking follow-ups.
   - If you tap **No** instead, it lets you type — that's the fallback.

> If nothing gets understood after recording (e.g. a very short/quiet clip), the
> bot politely asks you to type instead. That's expected.

### Test D — Answer the deeper questions & file the ticket
1. Answer the 4–5 multiple-choice follow-up questions.
2. Review the summary card, tap **Yes, that's right**.
3. **What to look for:** a **Ticket ID** card, then a **thank-you message** in
   your language, then a hint to *say "hi" to start again*.

### Test E — Restart & track your old ticket
1. In the text box type `hi` and send.
2. **What to look for:** it returns to the **New complaint / Track old complaint**
   menu (it does NOT ask your language or name again — it remembers you).
3. Tap **Track an old complaint**.
4. **What to look for:** your ticket from Test D is listed. Tap it and you'll see
   its **status**, **which office it's with**, and any **updates**.

### Test F — Returning user remembers your name
1. Refresh the Chrome page (`Cmd + R`) and click **I am a Citizen** again.
2. Pick a language.
3. **What to look for:** instead of asking your phone/name, it says
   *"Welcome back, Ramesh. Shall we continue with this name?"* with **Yes / No**.
   - **Yes** keeps the name. **No** lets you set a new one (and remembers the
     new one from then on).

---

## Part 3 — Test the Officer side

1. Click **District Officer** (from the landing page — open
   `http://localhost:8888` in a new tab if needed).
2. Find the ticket you just created (newest are near the top).
3. Click it and, in the detail panel, **what to look for:**
   - A **▶ audio player** to play the citizen's voice note (if you recorded one).
   - The **phone number** shown under "Routed to".
   - A **Status history** timeline.
4. Click **Mark in progress** or **Resolve**, then go back to the citizen side,
   track the ticket again, and confirm the new status + timestamp show up there
   too.

---

## If something doesn't work

- **"Failed to load" / voice won't save / ticket won't save:** almost always a
  key or a database issue. Check the Terminal running `netlify dev` for a red
  error line, and confirm your `.env` file has all 5 keys filled in.
- **No mic button, or recording does nothing:** use **Google Chrome** and click
  **Allow** when it asks for the microphone.
- **The AI reply is slow:** normal — it's thinking. The typing dots show while
  it works.
- **You changed code and want to see it:** `netlify dev` reloads automatically;
  just refresh Chrome.

---

## Quick reference

| Do this | Command |
|---|---|
| Start the app (page + AI + DB) | `netlify dev` |
| Stop the app | `Ctrl + C` in the Terminal |
| Open it | `http://localhost:8888` in Chrome |
