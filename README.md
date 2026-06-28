# AdhikarAI — Complete Setup Guide

This guide assumes you have **never coded or deployed a website before**. Follow
it top to bottom. Every step says exactly what to click, type, and paste, and
what you should see when it works. Take your time — none of this is dangerous,
and you can't break anything permanently.

**Total time: about 30–40 minutes the first time.**

---

## What you are building

A website with two sides:
- **Citizen side** — a person types or speaks a complaint about a government
  benefit in their own language, and AI files it as a proper ticket.
- **Officer side** — a dashboard where officials see those tickets with an
  AI-written analysis of each one.

To make it work, you'll connect three free services:
1. **Anthropic** — the AI brain (understands the complaints).
2. **Supabase** — the database (stores the tickets).
3. **Netlify** — the web host (puts your site on the internet).

You'll create an account on each, copy a few secret "keys," and paste them in.
That's the whole job.

---

## A few words you'll see a lot

- **Key** — a long secret password for a service (looks like `sk-ant-abc123...`).
  Treat keys like passwords: never post them publicly or put them in screenshots.
- **Terminal** (or "command line") — a text window where you type commands.
  On Mac it's an app called **Terminal**; on Windows use **PowerShell**.
- **Repo / repository** — a folder of code stored online (on GitHub).
- **Deploy** — to publish your site so anyone can open it in a browser.

---

# PART 1 — Install the tools (one time only)

You need two free programs on your computer: **Node.js** and **Git**.

### 1.1 Install Node.js

1. Go to **https://nodejs.org**.
2. Click the big button that says **LTS** (it'll show a version number like
   "20.x.x LTS"). LTS means the stable version — always pick that one.
3. Open the downloaded file and click **Next / Continue / Install** until done.
   Accept all the defaults.

**Check it worked:** open your Terminal (Mac) or PowerShell (Windows) and type:
```
node --version
```
Press Enter. You should see something like `v20.11.0`. If you see a version
number, Node is installed. If you see "command not found," restart your computer
and try again.

> **How to open the Terminal**
> - **Mac:** press `Cmd + Space`, type `Terminal`, press Enter.
> - **Windows:** click Start, type `PowerShell`, press Enter.

### 1.2 Install Git

1. Go to **https://git-scm.com/downloads**.
2. Click your operating system (Mac or Windows) and run the installer. Accept
   all defaults (just keep clicking Next).

**Check it worked:** in the Terminal type:
```
git --version
```
You should see something like `git version 2.43.0`.

---

# PART 2 — Get the project onto your computer

1. **Unzip the project.** You downloaded `adhikar-ai.zip`. Double-click it to
   unzip. You'll get a folder called `adhikar-ai`. Move it somewhere easy to
   find, like your **Desktop**.

2. **Open the Terminal inside that folder.** This is important — the commands
   below only work if the Terminal is "pointing at" the project folder.

   The easy way: type `cd ` (the letters c, d, then a space), then **drag the
   `adhikar-ai` folder from your Desktop into the Terminal window** and press
   Enter. It will look something like:
   ```
   cd /Users/yourname/Desktop/adhikar-ai
   ```

   **Check you're in the right place** by typing:
   ```
   ls
   ```
   (On Windows PowerShell, `ls` also works.) You should see a list that includes
   `package.json`, `src`, `netlify`, and `README.md`. If you do, you're in the
   right folder.

3. **Install the project's building blocks.** Type:
   ```
   npm install
   ```
   Press Enter and **wait** — this downloads everything the project needs and can
   take 1–3 minutes. You'll see lots of text scroll by. When it stops and you can
   type again, it's done. (A few yellow "warning" lines are normal and fine to
   ignore. Only red "error" lines matter.)

---

# PART 3 — Create the AI account (Anthropic)

This is the AI that reads the complaints.

1. Go to **https://console.anthropic.com** and sign up (free to start; the AI
   calls cost a small amount per use, often covered by free starting credit).
2. Once logged in, find **Settings** then **API Keys** (or go straight to
   **https://console.anthropic.com/settings/keys**).
3. Click **Create Key**, give it any name (e.g. "AdhikarAI"), and click create.
4. **Copy the key immediately** — it starts with `sk-ant-`. You can only see it
   once. Paste it somewhere safe for a minute (a blank note). This is your
   `ANTHROPIC_API_KEY`.

---

# PART 4 — Create the database (Supabase)

This stores all the tickets.

### 4.1 Make the project
1. Go to **https://supabase.com** and click **Start your project** / sign up
   (free).
2. Click **New project**. Give it a name (e.g. "adhikar-ai"), set a database
   password (save it somewhere — you won't need it for this guide but it's good
   practice), pick the region closest to you, and click **Create new project**.
3. Wait about 2 minutes while it sets up. You'll see a progress screen.

### 4.2 Create the tickets table
1. In the left sidebar, click **SQL Editor** (an icon that looks like a database
   or terminal).
2. Click **New query**.
3. Open the file `supabase/schema.sql` from your project folder (use any text
   editor, even Notepad/TextEdit). Select **all** the text (`Cmd+A` / `Ctrl+A`)
   and copy it.
4. Paste it into the big empty box in the Supabase SQL Editor.
5. Click **Run** (bottom-right, or press `Cmd/Ctrl + Enter`).
6. You should see **"Success. No rows returned"** at the bottom. That's correct —
   it means the table and the 5 demo tickets were created.

### 4.3 Copy the database keys
1. In the left sidebar, click the **gear icon (Settings)** then **API**.
2. You'll see three things you need. Copy each into your safe note:
   - **Project URL** — looks like `https://abcdefgh.supabase.co`. This is both
     your `SUPABASE_URL` **and** `VITE_SUPABASE_URL` (same value, used twice).
   - **`anon` `public`** key — a very long string. This is your
     `VITE_SUPABASE_ANON_KEY`.
   - **`service_role`** key — another long string, usually hidden behind a
     "Reveal" button. This is your `SUPABASE_SERVICE_KEY`. **Keep this one
     especially secret** — it has full access to your database.

You now have **5 values** saved in your note:

| What it's called | Where it came from |
|---|---|
| `ANTHROPIC_API_KEY` | Anthropic (starts `sk-ant-`) |
| `SUPABASE_URL` | Supabase Project URL |
| `SUPABASE_SERVICE_KEY` | Supabase service_role key |
| `VITE_SUPABASE_URL` | Supabase Project URL (same as above) |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon public key |

---

# PART 5 — Run the site on your own computer (test it first)

Before publishing to the world, let's make sure it runs on your machine.

### 5.1 Create your secret settings file

The project has a template file called `.env.example`. You'll make a real copy
called `.env` and fill in your 5 values.

In the Terminal (still inside the `adhikar-ai` folder), type:

- **Mac:**
  ```
  cp .env.example .env
  ```
- **Windows PowerShell:**
  ```
  Copy-Item .env.example .env
  ```

Now **open the new `.env` file** in a text editor (Notepad / TextEdit / VS Code).
You'll see lines like `ANTHROPIC_API_KEY=sk-ant-xxxx...`. Replace the `xxxx`
placeholder part after each `=` with your real value from your note. **No spaces
around the `=`, no quotes.** When done it should look like:

```
ANTHROPIC_API_KEY=sk-ant-api03-REAL-KEY-HERE
SUPABASE_URL=https://abcdefgh.supabase.co
SUPABASE_SERVICE_KEY=eyJ-REAL-SERVICE-KEY-HERE
VITE_SUPABASE_URL=https://abcdefgh.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ-REAL-ANON-KEY-HERE
```

Save the file. (This `.env` file stays on your computer only — it is never
uploaded, which keeps your keys safe.)

### 5.2 Install one more helper and start the site

The site has two halves (the page and the AI functions) that need to run
together. A free tool called the **Netlify CLI** runs both at once.

1. Install it (one time):
   ```
   npm install -g netlify-cli
   ```
   > If this gives a "permission denied" error on Mac, retry with:
   > `sudo npm install -g netlify-cli` and enter your computer password.

2. Start everything:
   ```
   netlify dev
   ```
   The first time, it may ask you to log in / authorize in your browser — click
   through and allow it.

3. After a few seconds you'll see a message with a local web address, usually
   **http://localhost:8888**. Open that address in your browser (Chrome works
   best).

**You should now see the AdhikarAI landing page** with two cards: "I am a
Citizen" and "District Officer." Click "I am a Citizen," pick a language, and try
typing a complaint like *"my ration has stopped, I haven't gotten grain for two
months"* — the AI should understand it and file a ticket. Then go back and open
the "District Officer" dashboard to see it.

> **To stop the site:** click in the Terminal and press `Ctrl + C`.

If it works locally, you're ready to publish. If something's wrong, see
**Troubleshooting** at the bottom.

---

# PART 6 — Publish to the internet (Netlify)

Now we put your site online so you can share a link. This has two parts: putting
your code on GitHub, then connecting Netlify to it.

### 6.1 Put your code on GitHub

1. Go to **https://github.com** and sign up (free).
2. Click the **+** in the top-right then **New repository**.
3. Give it a name (e.g. `adhikar-ai`), leave everything else as default, and
   click **Create repository**. **Do not** add a README or .gitignore (your
   project already has them).
4. GitHub now shows a page with commands. Ignore most of it — instead, in your
   Terminal (inside the `adhikar-ai` folder), run these one at a time:

   ```
   git init
   git add .
   git commit -m "First version of AdhikarAI"
   git branch -M main
   ```

   Then copy the line from GitHub that starts with `git remote add origin ...`
   (it contains your repo address) and run it, followed by:

   ```
   git push -u origin main
   ```

   If asked to log in, follow the prompts (GitHub may open a browser window to
   authorize). When it finishes, refresh your GitHub repo page — you should see
   all your files there.

   > **Important:** your `.env` file is deliberately **not** uploaded (it's listed
   > in `.gitignore`). That's correct — your secret keys must never go on GitHub.
   > You'll give them to Netlify separately in the next step.

### 6.2 Connect Netlify

1. Go to **https://netlify.com** and sign up — choose **"Sign up with GitHub"**
   so they're already linked.
2. Click **Add new site** then **Import an existing project**.
3. Choose **GitHub**, authorize if asked, and pick your `adhikar-ai` repository.
4. Netlify auto-detects the settings (build command, publish folder) from the
   project — you don't need to change them. Click **Deploy**.

### 6.3 Give Netlify your secret keys

Your site won't fully work until Netlify has the same 5 keys you put in `.env`.

1. In your new site's dashboard, go to **Site configuration** then **Environment
   variables** (sometimes under **Site settings**).
2. Click **Add a variable** then **Add a single variable**, and add each of the 5,
   one at a time. The **Key** is the name (e.g. `ANTHROPIC_API_KEY`) and the
   **Value** is your real key. Add all five:
   - `ANTHROPIC_API_KEY`
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_KEY`
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
3. After adding all five, go to the **Deploys** tab then **Trigger deploy** then
   **Deploy site**. (A re-deploy is needed so it picks up the new keys.)
4. Wait 1–2 minutes. When it says **Published**, click the site link at the top
   (something like `https://your-site-name.netlify.app`).

**That's your live website.** Share that link with anyone.

---

# Troubleshooting

**The page is blank / "failed to load tickets."**
Almost always a missing or mistyped key. Re-check that all 5 environment
variables are set (in `.env` locally, or in Netlify's Environment variables) and
that you copied the **whole** key with no extra spaces. After fixing on Netlify,
trigger a new deploy.

**"command not found: npm" (or node / git).**
The tool isn't installed or your Terminal needs restarting. Close the Terminal,
reopen it, and try `node --version` again. If still missing, reinstall from
Part 1.

**`netlify dev` won't start or the AI doesn't respond locally.**
Make sure you ran `netlify dev` (not `npm run dev`). The plain `npm run dev`
command only runs the page, not the AI functions, so complaints won't classify.

**The voice microphone button doesn't appear.**
Voice uses your browser's built-in speech feature, which works in **Chrome** but
not all browsers. Use Chrome, and allow microphone access when asked. If it's
still missing, just type the complaint — that path uses the same AI.

**The SQL step showed an error in Supabase.**
Make sure you copied the **entire** contents of `supabase/schema.sql`. If you run
it twice, you may see an "already exists" notice — that's harmless.

**I see a "git" error about authentication when pushing.**
GitHub now uses browser-based login or a "personal access token" instead of a
password. Follow the prompts GitHub gives you, or search "GitHub create personal
access token" and use that as the password when asked.

**The AI replies feel slow.**
That's normal — it's thinking. The typing dots show while it works. If it never
responds, it's a key problem (see the first item).

---

# What each part of the project is (optional reading)

You don't need this to run the site, but if you get curious:

```
src/components/citizen/   the WhatsApp-style complaint chat
src/components/officer/    the officer dashboard
src/data/                  the languages, schemes, and Indian states/districts
netlify/functions/         the AI: classify.ts (understands complaints),
                           create-ticket.ts (saves + analyzes), tickets.ts (lists)
supabase/schema.sql        sets up the database table
.env                       your secret keys (stays on your computer)
```

---

# Moving to Replit later

When you're ready to develop on Replit instead, you can import this same GitHub
repo into Replit. The code is written to move with minimal changes. Keep your
keys in Replit's **Secrets** panel (the lock icon) instead of a `.env` file —
same names, same values.

---

## Golden rules for keeping your keys safe

- Never paste a key into a chat, screenshot, email, or public post.
- Never commit your `.env` file to GitHub (the project already prevents this).
- If a key ever leaks, delete it in that service's dashboard and create a new one
  — that instantly disables the old one.
