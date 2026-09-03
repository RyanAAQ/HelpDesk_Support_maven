const API = 'http://localhost:8080/api';

// ── session ────────────────────────────────────────────────────────────────

let currentUser = null;

function saveUser(u) {
  currentUser = u;
  try { localStorage.setItem('helpdesk_user', JSON.stringify(u)); } catch (_) {}
}

function clearUser() {
  currentUser = null;
  try { localStorage.removeItem('helpdesk_user'); } catch (_) {}
}

function loadUser() {
  try {
    const s = localStorage.getItem('helpdesk_user');
    if (s) currentUser = JSON.parse(s);
  } catch (_) {}
}

function requireAuth() {
  loadUser();
  if (!currentUser) { window.location.href = 'login.html'; return false; }
  return true;
}

// ── http helpers ───────────────────────────────────────────────────────────

async function http(method, path, body) {
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json' }
  };
  if (body !== undefined) opts.body = JSON.stringify(body);
  const res = await fetch(API + path, opts);
  // 204 No Content
  if (res.status === 204) return null;
  const text = await res.text();
  let data;
  try { data = JSON.parse(text); } catch (_) { data = text; }
  if (!res.ok) throw new Error(typeof data === 'string' ? data : JSON.stringify(data));
  return data;
}

const get  = (path)        => http('GET',    path);
const post = (path, body)  => http('POST',   path, body);
const put  = (path, body)  => http('PUT',    path, body);
const del  = (path)        => http('DELETE', path);

// ── ui helpers ─────────────────────────────────────────────────────────────

function setMsg(id, text, ok = false) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = text;
  el.className   = 'msg' + (ok ? ' ok' : '');
}

function show(id) { document.getElementById(id)?.classList.remove('hidden'); }
function hide(id) { document.getElementById(id)?.classList.add('hidden'); }

function badge(status) {
  const map = {
    OPEN:        'badge-open',
    IN_PROGRESS: 'badge-progress',
    RESOLVED:    'badge-resolved',
    CLOSED:      'badge-closed'
  };
  return `<span class="badge ${map[status] || 'badge-open'}">${status}</span>`;
}

function priorityBadge(p) {
  const map = { HIGH: 'badge-high', MEDIUM: 'badge-medium', LOW: 'badge-low' };
  return `<span class="badge ${map[p] || 'badge-medium'}">${p}</span>`;
}

function fmtDate(dt) {
  if (!dt) return '—';
  return new Date(dt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
}

// ── register page ──────────────────────────────────────────────────────────

async function register() {
  const username = document.getElementById('reg-username')?.value.trim();
  const email    = document.getElementById('reg-email')?.value.trim();
  const password = document.getElementById('reg-password')?.value;
  const role     = document.getElementById('reg-role')?.value || 'CUSTOMER';

  if (!username || !email || !password) {
    setMsg('reg-msg', 'Please fill in all fields.'); return;
  }

  try {
    await post('/users/register', { username, email, password, role });
    setMsg('reg-msg', '✓ Account created! Redirecting to login…', true);
    setTimeout(() => window.location.href = 'login.html', 1200);
  } catch (e) {
    setMsg('reg-msg', e.message || 'Registration failed.');
  }
}

// ── login page ─────────────────────────────────────────────────────────────

async function login() {
  const username = document.getElementById('login-username')?.value.trim();
  const password = document.getElementById('login-password')?.value;

  if (!username || !password) {
    setMsg('login-msg', 'Please enter your username and password.'); return;
  }

  try {
    const user = await post('/users/login', { username, password });
    // UserResponse has no 'username' field — store the 'name' field as username
    user.username = user.name;
    saveUser(user);
    window.location.href = 'dashboard.html';
  } catch (e) {
    setMsg('login-msg', e.message || 'Login failed.');
  }
}

// ── logout ─────────────────────────────────────────────────────────────────

async function logout() {
  if (!currentUser) { window.location.href = 'login.html'; return; }
  try {
    // API expects { username }
    await post('/users/logout', { username: currentUser.username });
  } catch (_) { /* best-effort */ }
  clearUser();
  window.location.href = 'login.html';
}

// ── dashboard ──────────────────────────────────────────────────────────────

// Active ticket id for the open modal
let activeTicketId = null;
// Cache of all agents (fetched once)
let agentsList = [];

async function initDashboard() {
  if (!requireAuth()) return;

  // Welcome text
  const wt = document.getElementById('welcome-text');
  if (wt) wt.textContent = `${currentUser.username} · ${currentUser.role}`;

  // Show role-specific tabs
  const role = currentUser.role;
  if (role === 'AGENT' || role === 'ADMIN') {
    document.querySelectorAll('.agent-only').forEach(el => el.classList.remove('hidden'));
  }

  // Customers only see "My Tickets", not "All Tickets" tab
  if (role === 'CUSTOMER') {
    document.querySelector('[data-tab="all-tickets"]')?.remove();
  }

  // Hide "New Ticket" tab for non-customers
  if (role !== 'CUSTOMER') {
    document.querySelector('[data-tab="new-ticket"]')?.remove();
  }

  // Wire up tabs
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
  });

  // Logout
  document.getElementById('logout-btn')?.addEventListener('click', logout);

  // Pre-load agents list for assign dropdown
  if (role === 'AGENT' || role === 'ADMIN') {
    // We don't have a GET /api/users endpoint, so the assign select is
    // populated lazily from the ticket's own agentId or typed in manually.
    // We'll use a text input instead inside the modal (see modal wiring).
  }

  // Wire new-ticket form
  document.getElementById('nt-submit')?.addEventListener('click', createTicket);
  document.getElementById('refresh-tickets-btn')?.addEventListener('click', loadMyTickets);
  document.getElementById('refresh-all-btn')?.addEventListener('click', loadAllTickets);
  // Modal close
  document.getElementById('modal-close')?.addEventListener('click', closeModal);
  document.getElementById('modal-overlay')?.addEventListener('click', e => {
    if (e.target === document.getElementById('modal-overlay')) closeModal();
  });

  // Modal actions
  document.getElementById('assign-agent-btn')?.addEventListener('click', assignAgent);
  document.getElementById('update-status-btn')?.addEventListener('click', updateStatus);
  document.getElementById('delete-ticket-btn')?.addEventListener('click', deleteTicket);
  document.getElementById('post-comment-btn')?.addEventListener('click', postComment);

  // Default tab
  if (role === 'CUSTOMER') {    switchTab('tickets');
  } else {
    switchTab('all-tickets');
  }
}

function switchTab(name) {
  // Update buttons
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tab === name);
  });
  // Show correct section
  document.querySelectorAll('.tab-content').forEach(s => s.classList.add('hidden'));
  show('tab-' + name);

  // Lazy-load content
  if (name === 'tickets')      loadMyTickets();
  if (name === 'all-tickets')  loadAllTickets();
}

// ── tickets ────────────────────────────────────────────────────────────────

async function loadMyTickets() {
  const el = document.getElementById('tickets-list');
  el.innerHTML = '<p class="muted">Loading…</p>';
  try {
    const tickets = await get(`/tickets/customer/${currentUser.id}`);
    renderTicketList(tickets, el);
  } catch (e) {
    el.innerHTML = `<p class="msg">${e.message}</p>`;
  }
}

async function loadAllTickets() {
  const el = document.getElementById('all-tickets-list');
  el.innerHTML = '<p class="muted">Loading…</p>';
  try {
    const tickets = await get('/tickets');
    renderTicketList(tickets, el);
  } catch (e) {
    el.innerHTML = `<p class="msg">${e.message}</p>`;
  }
}

function renderTicketList(tickets, container) {
  if (!tickets || tickets.length === 0) {
    container.innerHTML = '<p class="muted">No tickets found.</p>';
    return;
  }

  container.innerHTML = tickets.map(t => `
    <div class="ticket-row" data-id="${t.id}">
      <div class="ticket-row-main">
        <span class="ticket-title">${escHtml(t.title)}</span>
        <span class="ticket-meta">${fmtDate(t.createdAt)}</span>
      </div>
      <div class="ticket-row-badges">
        ${badge(t.status)}
        ${priorityBadge(t.priority)}
      </div>
    </div>
  `).join('');

  container.querySelectorAll('.ticket-row').forEach(row => {
    row.addEventListener('click', () => openTicket(row.dataset.id));
  });
}

async function createTicket() {
  const title       = document.getElementById('nt-title')?.value.trim();
  const description = document.getElementById('nt-desc')?.value.trim();
  const priority    = document.getElementById('nt-priority')?.value;

  if (!title || !description) {
    setMsg('nt-msg', 'Please fill in all fields.'); return;
  }

  if (!currentUser?.id) {
    setMsg('nt-msg', 'Session expired — please log out and log in again.');
    return;
  }

  try {
    await post('/tickets', {
      title, description, priority,
      customerId: currentUser.id
    });
    setMsg('nt-msg', '✓ Ticket created!', true);
    document.getElementById('nt-title').value = '';
    document.getElementById('nt-desc').value  = '';
    setTimeout(() => switchTab('tickets'), 900);
  } catch (e) {
    setMsg('nt-msg', e.message || 'Failed to create ticket.');
  }
}

// ── ticket modal ───────────────────────────────────────────────────────────

async function openTicket(id) {
  activeTicketId = id;
  setMsg('agent-action-msg', '');
  setMsg('delete-msg', '');
  setMsg('comment-msg', '');

  try {
    const t = await get(`/tickets/${id}`);

    document.getElementById('modal-title').textContent = t.title;
    document.getElementById('modal-desc').textContent  = t.description;
    document.getElementById('modal-meta').innerHTML    = `
      <span>${badge(t.status)}</span>
      <span>${priorityBadge(t.priority)}</span>
      <span class="muted">${fmtDate(t.createdAt)}</span>
      ${t.agentId ? `<span class="muted">Agent ID: ${t.agentId}</span>` : ''}
    `;

    // Role-specific actions
    const role = currentUser.role;
    if (role === 'AGENT' || role === 'ADMIN') {
      show('agent-actions');
      // Pre-select current status
      const sel = document.getElementById('status-select');
      if (sel) sel.value = t.status || 'OPEN';
      // Populate agent assign field (simple text input for agent id)
      const agentSel = document.getElementById('assign-agent-select');
      if (agentSel) {
        agentSel.innerHTML = `<option value="">— enter agent id —</option>`;
        if (t.agentId) {
          const opt = document.createElement('option');
          opt.value = t.agentId;
          opt.textContent = `Current: ${t.agentId}`;
          agentSel.appendChild(opt);
          agentSel.value = t.agentId;
        }
      }
    } else {
      hide('agent-actions');
    }

    if (role === 'ADMIN') {
      show('admin-delete');
    } else {
      hide('admin-delete');
    }

    // Load comments
    await loadComments(id);

    show('modal-overlay');
    document.body.style.overflow = 'hidden';
  } catch (e) {
    alert('Could not load ticket: ' + e.message);
  }
}

function closeModal() {
  hide('modal-overlay');
  document.body.style.overflow = '';
  activeTicketId = null;
}

async function assignAgent() {
  if (!activeTicketId) return;
  const agentId = document.getElementById('assign-agent-select')?.value.trim();
  if (!agentId) {
    setMsg('agent-action-msg', 'Enter an agent ID.'); return;
  }
  try {
    await put(`/tickets/${activeTicketId}/assign`, { agentId });
    setMsg('agent-action-msg', '✓ Agent assigned.', true);
  } catch (e) {
    setMsg('agent-action-msg', e.message || 'Failed to assign agent.');
  }
}

async function updateStatus() {
  if (!activeTicketId) return;
  const status = document.getElementById('status-select')?.value;
  try {
    await put(`/tickets/${activeTicketId}/status`, { status });
    setMsg('agent-action-msg', `✓ Status updated to ${status}.`, true);
    // Refresh ticket lists in background
    if (currentUser.role === 'CUSTOMER') loadMyTickets();
    else loadAllTickets();
  } catch (e) {
    setMsg('agent-action-msg', e.message || 'Failed to update status.');
  }
}

async function deleteTicket() {
  if (!activeTicketId) return;
  if (!confirm('Delete this ticket? This cannot be undone.')) return;
  try {
    await del(`/tickets/${activeTicketId}`);
    closeModal();
    loadAllTickets();
  } catch (e) {
    setMsg('delete-msg', e.message || 'Failed to delete ticket.');
  }
}

// ── comments ───────────────────────────────────────────────────────────────

async function loadComments(ticketId) {
  const el = document.getElementById('comments-list');
  el.innerHTML = '<p class="muted" style="font-size:.85rem;">Loading comments…</p>';
  try {
    const comments = await get(`/comments/ticket/${ticketId}`);
    if (!comments || comments.length === 0) {
      el.innerHTML = '<p class="muted" style="font-size:.85rem;">No comments yet.</p>';
      return;
    }
    el.innerHTML = comments.map(c => `
      <div class="comment-item">
        <div class="comment-body">${escHtml(c.body)}</div>
        <div class="comment-meta">${fmtDate(c.createdAt)}</div>
      </div>
    `).join('');
  } catch (e) {
    el.innerHTML = `<p class="msg" style="font-size:.85rem;">${e.message}</p>`;
  }
}

async function postComment() {
  if (!activeTicketId) return;
  const body = document.getElementById('comment-body')?.value.trim();
  if (!body) { setMsg('comment-msg', 'Comment cannot be empty.'); return; }
  try {
    await post('/comments', { body, ticketId: activeTicketId, userId: currentUser.id });
    document.getElementById('comment-body').value = '';
    setMsg('comment-msg', '');
    await loadComments(activeTicketId);
  } catch (e) {
    setMsg('comment-msg', e.message || 'Failed to post comment.');
  }
}

// ── utility ────────────────────────────────────────────────────────────────

function escHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ── boot ───────────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  loadUser();

  const page = location.pathname.split('/').pop();

  if (page === 'dashboard.html') {
    initDashboard();
    return;
  }

  // login.html
  document.getElementById('login-btn')?.addEventListener('click', login);
  document.getElementById('login-password')?.addEventListener('keydown', e => {
    if (e.key === 'Enter') login();
  });

  // register.html
  document.getElementById('reg-btn')?.addEventListener('click', register);
});
