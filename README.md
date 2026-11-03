# Vedant J. Sharma · Portfolio

My personal portfolio website: who I am, my education, industrial training, projects, skills and a way to contact me.

[![CI](https://github.com/VedantSharma8830/vedant-portfolio/actions/workflows/ci.yml/badge.svg)](https://github.com/VedantSharma8830/vedant-portfolio/actions/workflows/ci.yml)
![Lighthouse](https://img.shields.io/badge/Lighthouse-100%20%7C%20100%20%7C%20100%20%7C%20100-brightgreen)
![Node](https://img.shields.io/badge/node-%3E%3D18-339933?logo=node.js&logoColor=white)
![License](https://img.shields.io/badge/license-MIT-blue)

**Live site: https://vedantsharma8830.github.io/vedant-portfolio/**

The contact form on the live site is connected to a real backend: messages are validated, rate limited,
stored in a database and read in a password-protected admin inbox.

![Desktop view](docs/screenshots/desktop-hero.jpg)

![Project card with circuit view](docs/screenshots/project-circuit.jpg)

<p>
  <img src="docs/screenshots/mobile.jpg" width="22%" alt="Phone view" />
  <img src="docs/screenshots/contact-sent.jpg" width="38%" alt="Contact form sent through the live backend" />
  <img src="docs/screenshots/admin-inbox.jpg" width="37%" alt="Password-protected admin inbox" />
</p>

---

## Features

- Dark / light theme with a sun-moon switch (remembers your choice)
- Rotating role pill in the hero, smooth scroll reveal animations
- "Doors" section that opens into About / Skills / Training / Strengths, each an animated panel (deep sea, space, sunset waves, jungle) with animated icons
- **Projects with engineering visuals**: a concept circuit schematic for the Automatic Street Light Controller
  and a system block diagram for Home Automation. Both are animated and linked to an interactive simulation
  (drag the daylight slider and watch the transistor, relay and lamp switch; turn on Smart mode and watch idle
  loads drop out)
- Education timeline
- Contact section with Email / Call toggle, copy button and a **working contact form**
- Footer badge showing the backend is online and the live visit count
- Fully responsive (tested at 390 px phone width and desktop), keyboard accessible, respects "reduce motion"
- Owner-only Customise panel (accent colour, font, sections), unlocked with a private link
- SEO: meta tags, Open Graph preview, structured data (schema.org Person)
- Backend: REST API, contact form with validation + rate limit + honeypot, admin inbox, visit counter
- Two backend versions with the same API: **Express** (run locally or on any Node host) and a
  **serverless Cloudflare Worker + D1 database** (what the live site uses)
- API tests with Node's built-in test runner, ESLint + Prettier, CI on every push

## Lighthouse

Measured on the live site (Chrome Lighthouse 13):

|         | Performance | Accessibility | Best Practices | SEO |
| ------- | :---------: | :-----------: | :------------: | :-: |
| Mobile  |     100     |      100      |      100       | 100 |
| Desktop |     100     |      100      |      100       | 100 |

![Lighthouse scores](docs/screenshots/lighthouse.png)

## Architecture

```mermaid
flowchart LR
    V[Visitor's browser] -->|HTML, CSS, JS| F[Frontend<br/>index.html + data.js]
    F -->|fetch /api/*| API{{Backend API}}
    subgraph Backend [Same API, two ways to run it]
        API --> E[Express server<br/>backend/]
        API --> W[Cloudflare Worker<br/>cloudflare/worker.js]
        E --> J[(JSON files<br/>backend/data)]
        W --> D[(D1 SQLite database)]
    end
    A[Admin] -->|/admin + password| API
    F -.->|no backend? falls back| M[mailto: / tel:]
```

- `frontend/js/data.js` is the single source of content. The page reads it directly, and the backend serves
  the same data at `GET /api/profile`.
- The frontend never depends on the backend: if the API is not reachable, the contact form opens the
  visitor's email app with the message already filled in.

## Tech stack

| Part       | Tech                                                          |
| ---------- | ------------------------------------------------------------- |
| Frontend   | HTML5, CSS3 (custom properties, grid), vanilla JS, inline SVG |
| Backend    | Node.js, Express 4, dotenv                                    |
| Serverless | Cloudflare Workers, D1 (SQLite), Web Crypto (HMAC sessions)   |
| Storage    | JSON files (Express) or D1 (Worker)                           |
| Tooling    | nodemon, ESLint, Prettier, Node test runner, GitHub Actions   |

---

## Run it on Windows (step by step)

### 1. Install Node.js

1. Go to <https://nodejs.org> and download the **LTS** version (the left button).
2. Run the installer and keep the default options (leave "Add to PATH" ticked).
3. Open **Command Prompt** or **PowerShell** and check it worked:

   ```bash
   node -v
   npm -v
   ```

   Both should print a version number (Node 18 or newer).

### 2. Install VS Code

Download it from <https://code.visualstudio.com> and install it.

### 3. Open the project

1. Unzip the project folder somewhere easy, e.g. `C:\Users\<you>\Documents\vedant-portfolio`.
2. Open VS Code → **File → Open Folder...** → choose the `vedant-portfolio` folder.
3. VS Code will suggest some extensions (Live Server, Prettier, ESLint). Click **Install**; they're optional but helpful.
4. Open the terminal inside VS Code: **Terminal → New Terminal** (or press <kbd>Ctrl</kbd> + <kbd>`</kbd>).

### 4. Install and start

In the VS Code terminal:

```bash
npm install
npm start
```

Then open **<http://localhost:3000>** in your browser.

- The first `npm start` creates a `.env` file from `.env.example` automatically.
- To stop the server press <kbd>Ctrl</kbd> + <kbd>C</kbd> in the terminal.

For development, use auto-restart instead:

```bash
npm run dev
```

nodemon restarts the server whenever a backend file, `.env` or the data file changes.

> **PowerShell error "running scripts is disabled"?** Either use **Command Prompt** as the VS Code terminal
> (click the ⌄ next to the + in the terminal panel → Command Prompt), or run this once in PowerShell:
> `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned`

### 5. Admin inbox

Open **<http://localhost:3000/admin>** and log in with the password from `.env`
(`ADMIN_PASSWORD`, which is `change-this-password` in the example file). You'll see every message sent through
the contact form, plus the visit count. Change the password in `.env` and restart the server.

### Only want the static site?

Open `frontend/index.html` with the **Live Server** extension (right-click → _Open with Live Server_), or just
double-click it. Everything works except the backend features; the contact form then opens your email app
with the message filled in instead.

---

## Available scripts

| Command                 | What it does                                 |
| ----------------------- | -------------------------------------------- |
| `npm start`             | Start the server on <http://localhost:3000>  |
| `npm run dev`           | Start with nodemon (auto-restart on changes) |
| `npm test`              | Run the API tests                            |
| `npm run lint`          | Check the code with ESLint                   |
| `npm run format`        | Format all files with Prettier               |
| `npm run build:worker`  | Prepare the Cloudflare Worker (profile JSON) |
| `npm run deploy:worker` | Build and deploy the Worker with Wrangler    |

## Debugging in VS Code

Go to **Run and Debug** (<kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>D</kbd>) and pick:

- **Debug backend**: starts the server with breakpoints enabled
- **Debug backend (nodemon)**: same, with auto-restart
- **Run API tests**

---

## Folder structure

```
vedant-portfolio/
├── frontend/                 # the website (works as a static site on its own)
│   ├── index.html
│   ├── css/
│   │   └── style.css
│   ├── js/
│   │   ├── data.js           # ALL portfolio content lives here
│   │   ├── config.js         # API settings for the frontend
│   │   ├── api.js            # small wrapper around the backend API
│   │   ├── app.js            # UI: hero, theme, doors, projects, timeline, customise panel
│   │   ├── contact.js        # contact form logic (API or email fallback)
│   │   └── theme-boot.js     # applies the saved theme before the page paints
│   └── assets/
│       ├── img/              # portrait, favicon, social preview image
│       ├── fonts/
│       └── docs/
│           └── Vedant_Sharma_CV.pdf
├── backend/
│   ├── server.js             # entry point
│   ├── app.js                # Express app setup
│   ├── config.js             # reads settings from .env
│   ├── routes/
│   │   ├── api.js            # /api/* routes
│   │   └── admin.js          # /admin pages
│   ├── middleware/           # rate limit, admin auth, CORS, security headers
│   ├── lib/                  # JSON file store, profile loader, validation
│   ├── views/
│   │   └── admin.js          # admin page HTML
│   ├── data/                 # messages.json + stats.json are created here
│   └── tests/
│       └── api.test.js
├── cloudflare/
│   ├── worker.js             # serverless version of the same API (Workers + D1)
│   └── schema.sql            # database tables
├── scripts/
│   ├── ensure-env.js         # creates .env on first start
│   └── build-worker.js       # turns data.js into JSON for the Worker
├── docs/screenshots/         # images used in this README
├── .vscode/                  # recommended extensions, debug config
├── .github/workflows/        # CI (lint + tests) and GitHub Pages deploy
├── wrangler.toml             # Cloudflare Workers settings
├── .env.example
├── package.json
└── README.md
```

---

## Editing the content

All the text on the site comes from **`frontend/js/data.js`**. Open it, change what you need and save:

- `tagline`, `location`, `email`, `phone`: basic details
- `roles`: the words that rotate in the hero pill
- `stats`: the four numbers under the hero
- `education`: the timeline (newest first)
- `experience`: training / internships
- `projects`: each project's name, tags, objective, concept and benefit
- `skills`, `interests`, `professionalSkills`, `marquee`

The backend reads the same file for `GET /api/profile`, so there is only one place to update.
Refresh the browser to see the change (with `npm run dev` the server picks it up automatically).

To replace the CV, put the new PDF in `frontend/assets/docs/` with the same name
(or update `cvFile` in `data.js`). To change the photo, replace `frontend/assets/img/avatar.webp` and `avatar-360.webp` (square, head and shoulders).

---

## API

Base URL: `http://localhost:3000`

| Method | Route          | Description                                                        |
| ------ | -------------- | ------------------------------------------------------------------ |
| GET    | `/api/health`  | Server status and uptime                                           |
| GET    | `/api/profile` | All portfolio data as JSON (from `frontend/js/data.js`)            |
| POST   | `/api/contact` | Send a message. Body: `{ "name", "email", "message" }`             |
| POST   | `/api/visit`   | Adds 1 to the visit counter (the site calls this once per session) |
| GET    | `/api/stats`   | Current visit count                                                |
| GET    | `/admin`       | Admin inbox (password protected)                                   |

### Contact form rules

- `name` 2–80 characters, a valid `email`, `message` 10–2000 characters
- Max **5 messages per visitor every 10 minutes** (`CONTACT_RATE_LIMIT` in `.env`); after that the API answers `429`
- A hidden _honeypot_ field (`company`) catches simple spam bots; those messages are silently dropped
- Valid messages are saved to `backend/data/messages.json`

Example responses:

```jsonc
// 201 Created
{ "ok": true, "message": "Thanks! Your message was sent.", "id": "…" }

// 400 Bad Request
{ "ok": false, "error": "Please check the form and try again.",
  "fields": { "email": "Please enter a valid email address." } }
```

Try it from the terminal (PowerShell):

```powershell
Invoke-RestMethod http://localhost:3000/api/health
Invoke-RestMethod -Method Post -Uri http://localhost:3000/api/contact -ContentType "application/json" `
  -Body '{"name":"Test","email":"test@example.com","message":"Hello from the terminal!"}'
```

---

## Environment variables

Copy `.env.example` to `.env` (done automatically on first start):

| Variable             | Default                | Purpose                                             |
| -------------------- | ---------------------- | --------------------------------------------------- |
| `PORT`               | `3000`                 | Server port                                         |
| `ADMIN_PASSWORD`     | `change-this-password` | Password for `/admin` (admin is off if empty)       |
| `SESSION_SECRET`     | random on each start   | Signs the admin login cookie                        |
| `CORS_ORIGIN`        | empty                  | Allowed origins if the frontend is hosted elsewhere |
| `CONTACT_RATE_LIMIT` | `5`                    | Contact messages per visitor per 10 minutes         |

`.env` is in `.gitignore`, so the real password never ends up on GitHub.

---

## Deployment

### Option A: Frontend only on GitHub Pages (free)

The repo includes a workflow (`.github/workflows/pages.yml`) that publishes the `frontend/` folder.

1. Create a new repository on GitHub and push this project:

   ```bash
   git init
   git add .
   git commit -m "Portfolio"
   git branch -M main
   git remote add origin https://github.com/<your-username>/vedant-portfolio.git
   git push -u origin main
   ```

2. On GitHub: **Settings → Pages → Build and deployment → Source: GitHub Actions**.
3. Every push to `main` deploys the site to `https://<your-username>.github.io/vedant-portfolio/`.

On GitHub Pages the contact form uses the email fallback, unless you point it at a deployed backend:
add a repository variable **API_BASE** (Settings → Secrets and variables → Actions → Variables) with the
backend URL, and the workflow writes it into `frontend/js/config.js` during the deploy.

### Option B: Full stack on Render (free tier)

1. Push the project to GitHub (step 1 above).
2. Sign in at <https://render.com> → **New → Web Service** → connect the repository.
3. Settings:
   - **Runtime:** Node
   - **Build command:** `npm install`
   - **Start command:** `npm start`
   - **Instance type:** Free
4. Under **Environment**, add `ADMIN_PASSWORD` (a strong one), `SESSION_SECRET` (a long random string) and
   `NODE_ENV=production`. Render sets `PORT` itself.
5. Deploy. The site, API and `/admin` all run at `https://<name>.onrender.com`.

### Option C: Full stack on Railway

1. <https://railway.app> → **New Project → Deploy from GitHub repo**.
2. Add the same variables under **Variables**. Railway detects Node and runs `npm start`.
3. **Settings → Networking → Generate Domain** to get a public URL.

> **Note on free tiers:** free servers go to sleep when idle (the first visit takes a few seconds), and their
> disk is reset on every redeploy, so `messages.json` doesn't survive a redeploy. Read your messages in `/admin`
> regularly; for permanent storage, attach a persistent disk and point `DATA_DIR` at it.

### Option D: Full stack on Cloudflare Workers + D1 (free, no sleeping)

This is how the live site runs. The Worker serves the frontend and the same API as the Express server,
with messages stored in a D1 (SQLite) database, so nothing is lost on redeploy and there is no cold start.

```bash
npx wrangler login
npx wrangler d1 create portfolio-db          # copy the database_id into wrangler.toml
npx wrangler secret put ADMIN_PASSWORD       # choose a strong password
npm run deploy:worker
```

The tables are created automatically on the first request (or run
`npx wrangler d1 execute portfolio-db --remote --file=cloudflare/schema.sql`).
To use it with the GitHub Pages copy too, set `CORS_ORIGIN` in `wrangler.toml` to your Pages origin.

### Frontend on GitHub Pages + backend on Render

If you want both, deploy the backend (Option B), then:

1. In `frontend/js/config.js` set `useApi: true` and `apiBase: "https://<name>.onrender.com"`.
2. On Render, set `CORS_ORIGIN=https://<your-username>.github.io`.
3. Push; the GitHub Pages site will now send contact messages to the backend.

---

## Contact

**Vedant J. Sharma**: [vedantsharma8830@gmail.com](mailto:vedantsharma8830@gmail.com) · +91 88305 88405

## License

[MIT](LICENSE) © 2026 Vedant J. Sharma
