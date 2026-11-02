/*
 * HTML for the admin pages. Plain template strings; every value coming from
 * a visitor is escaped before it goes into the page.
 */
function escapeHtml(value) {
  return String(value ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[c],
  );
}

function formatDate(iso) {
  const d = new Date(iso);
  return isNaN(d)
    ? ""
    : d.toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Kolkata" });
}

const styles = `
  :root{--bg:#0c0c10;--card:#17171f;--card2:#1e1e28;--line:rgba(255,255,255,.09);--text:#f3f0e8;--muted:#a3a1ad;--accent:#ffd23f}
  *{box-sizing:border-box}
  body{margin:0;background:var(--bg);color:var(--text);font:16px/1.55 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}
  .wrap{width:min(900px,calc(100% - 32px));margin:0 auto;padding:40px 0 60px}
  h1{font-size:28px;margin:0;letter-spacing:-.02em}
  a{color:var(--accent)}
  .card{background:var(--card);border:1px solid var(--line);border-radius:20px;padding:22px}
  .login{max-width:380px;margin:12vh auto 0}
  .login p{color:var(--muted);margin:6px 0 20px}
  input[type=password]{width:100%;font:inherit;color:var(--text);background:var(--card2);border:1px solid var(--line);border-radius:12px;padding:12px 14px;outline:none}
  input[type=password]:focus{border-color:var(--accent)}
  button{font:inherit;font-weight:600;border:0;border-radius:999px;padding:11px 18px;cursor:pointer;background:var(--accent);color:#141109}
  button.ghost{background:transparent;color:var(--text);border:1px solid var(--line);padding:7px 14px;font-size:14px}
  button.danger{color:#ff6b4a}
  .login button{width:100%;margin-top:14px}
  .error{color:#ff6b4a;margin:0 0 12px}
  .top{display:flex;justify-content:space-between;align-items:center;gap:16px;flex-wrap:wrap;margin-bottom:22px}
  .stats{display:flex;gap:12px;margin-bottom:22px;flex-wrap:wrap}
  .stat{flex:1;min-width:140px}
  .stat b{display:block;font-size:30px;line-height:1.1}
  .stat span{color:var(--muted);font-size:14px}
  .msg{margin-bottom:14px}
  .msg.unread{border-color:color-mix(in srgb,var(--accent) 55%,transparent)}
  .msg-head{display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap}
  .msg-head small{color:var(--muted)}
  .msg-body{white-space:pre-wrap;word-break:break-word;margin:12px 0 16px}
  .actions{display:flex;gap:8px;flex-wrap:wrap}
  .actions form{margin:0}
  .badge{display:inline-block;font-size:12px;font-weight:700;background:var(--accent);color:#141109;border-radius:999px;padding:1px 8px;margin-left:6px;vertical-align:middle}
  .empty{color:var(--muted);text-align:center;padding:40px 22px}
`;

function layout(title, body) {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>${escapeHtml(title)}</title>
<link rel="icon" href="/assets/img/favicon.svg" type="image/svg+xml">
<style>${styles}</style>
</head>
<body><div class="wrap">${body}</div></body>
</html>`;
}

function loginPage({ error } = {}) {
  return layout(
    "Admin login",
    `<form class="card login" method="post" action="/admin/login">
      <h1>Admin</h1>
      <p>Enter the admin password to read messages.</p>
      ${error ? `<p class="error">${escapeHtml(error)}</p>` : ""}
      <input type="password" name="password" placeholder="Password" autocomplete="current-password" required autofocus>
      <button type="submit">Log in</button>
      <p><a href="/">Back to the site</a></p>
    </form>`,
  );
}

function disabledPage() {
  return layout(
    "Admin disabled",
    `<div class="card login"><h1>Admin is disabled</h1>
      <p>Set <code>ADMIN_PASSWORD</code> in the <code>.env</code> file and restart the server.</p></div>`,
  );
}

function messageCard(m) {
  const mailto = `mailto:${encodeURIComponent(m.email)}?subject=${encodeURIComponent("Re: your message")}`;
  return `<article class="card msg ${m.read ? "" : "unread"}">
    <div class="msg-head">
      <div><strong>${escapeHtml(m.name)}</strong>${m.read ? "" : '<span class="badge">new</span>'}<br>
        <a href="${escapeHtml(mailto)}">${escapeHtml(m.email)}</a></div>
      <small>${escapeHtml(formatDate(m.createdAt))}</small>
    </div>
    <p class="msg-body">${escapeHtml(m.message)}</p>
    <div class="actions">
      <form method="post" action="/admin/messages/${encodeURIComponent(m.id)}/read">
        <button class="ghost" type="submit">${m.read ? "Mark unread" : "Mark read"}</button>
      </form>
      <form method="post" action="/admin/messages/${encodeURIComponent(m.id)}/delete" onsubmit="return confirm('Delete this message?')">
        <button class="ghost danger" type="submit">Delete</button>
      </form>
    </div>
  </article>`;
}

function inboxPage({ messages, visits }) {
  const unread = messages.filter((m) => !m.read).length;
  const list = messages.length
    ? messages.map(messageCard).join("")
    : '<div class="card empty">No messages yet.</div>';

  return layout(
    "Messages · Admin",
    `<div class="top">
      <h1>Messages</h1>
      <form method="post" action="/admin/logout"><button class="ghost" type="submit">Log out</button></form>
    </div>
    <div class="stats">
      <div class="card stat"><b>${messages.length}</b><span>Total messages</span></div>
      <div class="card stat"><b>${unread}</b><span>Unread</span></div>
      <div class="card stat"><b>${visits}</b><span>Site visits</span></div>
    </div>
    ${list}`,
  );
}

module.exports = { loginPage, disabledPage, inboxPage, escapeHtml };
