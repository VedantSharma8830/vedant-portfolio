# Vedant J. Sharma · Portfolio

My personal portfolio website: who I am, my education, industrial training, projects, skills and a way to contact me.

It has two parts:

- **Frontend**: the website itself (HTML, CSS and plain JavaScript, no framework). It works on its own as a static site.
- **Backend**: a small **Node.js + Express** server that serves the site and adds a REST API, a working contact form that saves messages, a visit counter and a password-protected admin inbox. No database server is needed; data is stored in JSON files.

![Preview](frontend/assets/img/og.png)

---

## Features

- Dark / light theme with a sun-moon switch (remembers your choice)
- Rotating role pill in the hero, smooth scroll reveal animations
- "Doors" section that opens into About / Skills / Training / Strengths
- Project showcase with interactive phone demos
- Education timeline
- Contact section with Email / Call toggle, copy button and a **contact form**
- Fully responsive (tested at 390 px phone width and desktop)
- Respects "reduce motion" settings
- Owner-only Customise panel (accent colour, font, sections), unlocked with a private link
- Backend: REST API, contact form with validation + rate limit + honeypot, admin inbox, visit counter
- API tests with Node's built-in test runner

## Tech stack

| Part     | Tech                                              |
| -------- | ------------------------------------------------- |
| Frontend | HTML5, CSS3 (custom properties, grid), vanilla JS |
| Backend  | Node.js, Express 4, dotenv                        |
| Storage  | JSON files in `backend/data/`                     |
| Tooling  | nodemon, ESLint, Prettier, Node test runner       |

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

| Command          | What it does                                 |
| ---------------- | -------------------------------------------- |
| `npm start`      | Start the server on <http://localhost:3000>  |
| `npm run dev`    | Start with nodemon (auto-restart on changes) |
| `npm test`       | Run the API tests                            |
| `npm run lint`   | Check the code with ESLint                   |
| `npm run format` | Format all files with Prettier               |

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
├── scripts/
│   └── ensure-env.js         # creates .env on first start
├── .vscode/                  # recommended extensions, debug config
├── .github/workflows/        # GitHub Pages deploy for the frontend
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
(or update `cvFile` in `data.js`). To change the photo, replace `frontend/assets/img/portrait.webp`.

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

On GitHub Pages the contact form uses the email fallback (no server there).

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
