const API = 'http://localhost:8080/api';

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

async function http(method, path, body) {
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json' }
  };
  if (body !== undefined) opts.body = JSON.stringify(body);
  const res = await fetch(API + path, opts);
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


async function register() {
  const username = document.getElementById('reg-username')?.value.trim();
  const email    = document.getElementById('reg-email')?.value.trim();
  const password = document.getElementById('reg-password')?.value;

  if (!username || !email || !password) {
    setMsg('reg-msg', 'Please fill in all fields.'); return;
  }

  if (username.length < 3) {
    setMsg('reg-msg', 'Username must be at least 3 characters long.'); return;
  }

  const atIndex = email.indexOf('@');
  if (atIndex < 1) {
    setMsg('reg-msg', 'Email must have text before @'); return;
  }
  const dotIndex = email.indexOf('.', atIndex);
  if (dotIndex < atIndex + 2 || dotIndex >= email.length - 1) {
    setMsg('reg-msg', 'Email must be valid (e.g., user@domain.com)'); return;
  }

  if (password.length < 6) {
    setMsg('reg-msg', 'Password must be at least 6 characters long.'); return;
  }
  if (!/\d/.test(password)) {
    setMsg('reg-msg', 'Password must contain at least one digit (0-9).'); return;
  }

  try {
    await post('/users/register', { username, email, password, role: 'CUSTOMER' });
    setMsg('reg-msg', '✓ Account created! Redirecting to login…', true);
    setTimeout(() => window.location.href = 'login.html', 1200);
  } catch (e) {
    setMsg('reg-msg', e.message || 'Registration failed.');
  }
}


async function registerAgent() {
  const username = document.getElementById('reg-username')?.value.trim();
  const email    = document.getElementById('reg-email')?.value.trim();
  const password = document.getElementById('reg-password')?.value;
  const code     = document.getElementById('reg-code')?.value.trim();

  if (!username || !email || !password || !code) {
    setMsg('reg-msg', 'Please fill in all fields.'); return;
  }

  if (username.length < 3) {
    setMsg('reg-msg', 'Username must be at least 3 characters long.'); return;
  }

  const atIndex = email.indexOf('@');
  if (atIndex < 1) {
    setMsg('reg-msg', 'Email must have text before @'); return;
  }
  const dotIndex = email.indexOf('.', atIndex);
  if (dotIndex < atIndex + 2 || dotIndex >= email.length - 1) {
    setMsg('reg-msg', 'Email must be valid (e.g., user@domain.com)'); return;
  }

  if (password.length < 6) {
    setMsg('reg-msg', 'Password must be at least 6 characters long.'); return;
  }
  if (!/\d/.test(password)) {
    setMsg('reg-msg', 'Password must contain at least one digit (0-9).'); return;
  }

  if (code !== 'reggin') {
    setMsg('reg-msg', 'Invalid registration code.'); return;
  }

  try {
    await post('/users/register', { username, email, password, role: 'AGENT' });
    setMsg('reg-msg', '✓ Agent account created! Redirecting to login…', true);
    setTimeout(() => window.location.href = 'login.html', 1200);
  } catch (e) {
    setMsg('reg-msg', e.message || 'Registration failed.');
  }
}


async function login() {
  const username = document.getElementById('login-username')?.value.trim();
  const password = document.getElementById('login-password')?.value;

  if (!username || !password) {
    setMsg('login-msg', 'Please enter your username and password.'); return;
  }

  try {
    const user = await post('/users/login', { username, password });
    saveUser(user);
    window.location.href = 'dashboard.html';
  } catch (e) {
    setMsg('login-msg', e.message || 'Login failed.');
  }
}


async function logout() {
  if (!currentUser) { window.location.href = 'login.html'; return; }
  try {
    await post('/users/logout', { username: currentUser.username });
  } catch (_) { /* best-effort */ }
  clearUser();
  window.location.href = 'login.html';
}


let activeTicketId = null;
let agentsList = [];

async function initDashboard() {
  if (!requireAuth()) return;

  const role = currentUser.role;

  document.getElementById('account-name').textContent = currentUser.username;
  document.getElementById('account-email').textContent = currentUser.email || '—';
  document.getElementById('account-role').textContent = role.toLowerCase();

  if (role === 'AGENT' || role === 'ADMIN') {
    document.querySelectorAll('.agent-only').forEach(el => el.classList.remove('hidden'));
  }

  if (role === 'CUSTOMER') {
    document.querySelector('[data-tab="all-tickets"]')?.remove();
  }

  if (role !== 'CUSTOMER') {
    document.querySelector('[data-tab="new-ticket"]')?.remove();
  }

  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
  });

  document.getElementById('logout-btn')?.addEventListener('click', logout);

  if (role === 'AGENT' || role === 'ADMIN') {
    try {
      agentsList = await get('/users/agents');
    } catch (_) {
      agentsList = [];
    }
  }

  document.getElementById('nt-submit')?.addEventListener('click', createTicket);
  document.getElementById('refresh-tickets-btn')?.addEventListener('click', loadMyTickets);
  document.getElementById('refresh-sidebar-btn')?.addEventListener('click', loadMyTickets);
  document.getElementById('refresh-all-btn')?.addEventListener('click', loadAllTickets);

  document.getElementById('modal-close')?.addEventListener('click', closeModal);
  document.getElementById('modal-overlay')?.addEventListener('click', e => {
    if (e.target === document.getElementById('modal-overlay')) closeModal();
  });

  document.getElementById('assign-agent-btn')?.addEventListener('click', assignAgent);
  document.getElementById('update-status-btn')?.addEventListener('click', updateStatus);
  document.getElementById('delete-ticket-btn')?.addEventListener('click', deleteTicket);
  document.getElementById('post-comment-btn')?.addEventListener('click', postComment);

  if (role === 'CUSTOMER') {
    switchTab('tickets');
  } else {
    switchTab('all-tickets');
  }
}

function switchTab(name) {
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tab === name);
  });
  document.querySelectorAll('.tab-content').forEach(s => s.classList.add('hidden'));
  show('tab-' + name);

  if (name === 'tickets')     loadMyTickets();
  if (name === 'all-tickets') loadAllTickets();
}


async function loadMyTickets() {
  const el = document.getElementById('tickets-list');
  el.innerHTML = '<p class="muted">Loading…</p>';
  try {
    const tickets = await get(`/tickets/customer/${currentUser.id}`);
    renderTicketList(tickets, el);
    updateStats(tickets);
  } catch (e) {
    el.innerHTML = `<p class="msg">${escHtml(e.message)}</p>`;
  }
}

function updateStats(tickets) {
  if (!tickets || !Array.isArray(tickets)) return;
  const total = tickets.length;
  const open = tickets.filter(t => t.status === 'OPEN').length;
  const high = tickets.filter(t => t.priority === 'HIGH').length;
  const resolved = tickets.filter(t => t.status === 'RESOLVED' || t.status === 'CLOSED').length;
  document.getElementById('stat-total').textContent = total;
  document.getElementById('stat-open').textContent = open;
  document.getElementById('stat-high').textContent = high;
  document.getElementById('stat-resolved').textContent = resolved;
}

async function loadAllTickets() {
  const el = document.getElementById('all-tickets-list');
  el.innerHTML = '<p class="muted">Loading…</p>';
  try {
    const tickets = await get('/tickets');
    renderTicketList(tickets, el);
  } catch (e) {
    el.innerHTML = `<p class="msg">${escHtml(e.message)}</p>`;
  }
}

function renderTicketList(tickets, container) {
  if (!tickets || tickets.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">📭</div>
        <div class="empty-state-title">No tickets yet</div>
        <div class="empty-state-text">You haven't submitted any support tickets yet. Create one to get started.</div>
      </div>
    `;
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
    document.getElementById('nt-priority').value = 'MEDIUM';
    setTimeout(() => switchTab('tickets'), 900);
  } catch (e) {
    setMsg('nt-msg', e.message || 'Failed to create ticket.');
  }
}


async function openTicket(id) {
  activeTicketId = id;
  setMsg('agent-action-msg', '');
  setMsg('delete-msg', '');
  setMsg('comment-msg', '');

  try {
    const t = await get(`/tickets/${id}`);

    document.getElementById('modal-title').textContent = t.title;
    document.getElementById('modal-desc').textContent  = t.description;

    let agentLabel = '';
    if (t.agentId) {
      const a = agentsList.find(ag => ag.id === t.agentId);
      agentLabel = a ? `<span class="muted">Agent: ${escHtml(a.username)}</span>`
                     : `<span class="muted">Agent ID: ${escHtml(t.agentId)}</span>`;
    }

    document.getElementById('modal-meta').innerHTML = `
      <span>${badge(t.status)}</span>
      <span>${priorityBadge(t.priority)}</span>
      <span class="muted">${fmtDate(t.createdAt)}</span>
      ${agentLabel}
    `;

    const role = currentUser.role;

    if (role === 'AGENT' || role === 'ADMIN') {
      show('agent-actions');

      const sel = document.getElementById('status-select');
      if (sel) sel.value = t.status || 'OPEN';

      const agentSel = document.getElementById('assign-agent-select');
      if (agentSel) {
        agentSel.innerHTML = '<option value="">— select an agent —</option>';
        agentsList.forEach(agent => {
          const opt = document.createElement('option');
          opt.value       = agent.id;
          opt.textContent = agent.username;
          if (agent.id === t.agentId) opt.selected = true;
          agentSel.appendChild(opt);
        });
      }
    } else {
      hide('agent-actions');
    }

    if (role === 'ADMIN') {
      show('admin-delete');
    } else {
      hide('admin-delete');
    }

    await loadComments(id);

    const isClosed = t.status === 'CLOSED' || t.status === 'RESOLVED';
    const commentInput  = document.getElementById('comment-body');
    const commentBtn    = document.getElementById('post-comment-btn');
    const commentNotice = document.getElementById('comment-closed-notice');
    if (commentInput)  commentInput.style.display  = isClosed ? 'none' : '';
    if (commentBtn)    commentBtn.style.display    = isClosed ? 'none' : '';
    if (commentNotice) commentNotice.style.display = isClosed ? 'block' : 'none';

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
  const agentId = document.getElementById('assign-agent-select')?.value;
  if (!agentId) {
    setMsg('agent-action-msg', 'Please select an agent.'); return;
  }
  try {
    await put(`/tickets/${activeTicketId}/assign`, { agentId, callerId: currentUser.id });
    setMsg('agent-action-msg', '✓ Agent assigned.', true);
  } catch (e) {
    setMsg('agent-action-msg', e.message || 'Failed to assign agent.');
  }
}

async function updateStatus() {
  if (!activeTicketId) return;
  const status = document.getElementById('status-select')?.value;
  try {
    await put(`/tickets/${activeTicketId}/status`, { status, callerId: currentUser.id });
    setMsg('agent-action-msg', `✓ Status updated to ${status}.`, true);
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
    await del(`/tickets/${activeTicketId}?callerId=${encodeURIComponent(currentUser.id)}`);
    closeModal();
    loadAllTickets();
  } catch (e) {
    setMsg('delete-msg', e.message || 'Failed to delete ticket.');
  }
}


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
    el.innerHTML = `<p class="msg" style="font-size:.85rem;">${escHtml(e.message)}</p>`;
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


function escHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}


document.addEventListener('DOMContentLoaded', () => {
  loadUser();

  const page = location.pathname.split('/').pop();

  if (page === 'dashboard.html') {
    initDashboard();
    return;
  }

  document.getElementById('login-btn')?.addEventListener('click', login);
  document.getElementById('login-password')?.addEventListener('keydown', e => {
    if (e.key === 'Enter') login();
  });

  document.getElementById('reg-btn')?.addEventListener('click', register);

  document.getElementById('reg-agent-btn')?.addEventListener('click', registerAgent);
});
