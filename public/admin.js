const loginView = document.querySelector('#login-view');
const dashboard = document.querySelector('#dashboard');
const loginForm = document.querySelector('#login-form');
const loginMessage = document.querySelector('#login-message');
const recordsView = document.querySelector('#records');
const countView = document.querySelector('#count');

function escapeHtml(value) {
  const element = document.createElement('div');
  element.textContent = value ?? '';
  return element.innerHTML;
}

function formatDate(value) {
  return new Intl.DateTimeFormat('zh-CN', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
}

function item(label, value, wide = false) {
  return `<div class="record-item${wide ? ' wide' : ''}"><span>${label}</span><p>${escapeHtml(value) || '—'}</p></div>`;
}

function render(records) {
  countView.textContent = records.length;
  if (!records.length) {
    recordsView.innerHTML = '<div class="empty">还没有收到问卷，分享首页链接后再回来看看吧。</div>';
    return;
  }
  recordsView.innerHTML = records.map((record) => `<article class="record" data-id="${record.id}">
    <div class="record-head"><div><h3>${escapeHtml(record.name)}</h3><time>${formatDate(record.submittedAt)}</time></div><button class="button-danger delete-record">删除</button></div>
    <div class="record-grid">${item('联系方式', record.contact)}${item('身份', record.identity)}${item('相关科目', record.subjects)}${item('辅导形式', record.mode)}${item('方便时间', record.availability)}${item('目标与需求', record.goal, true)}${item('补充说明', record.notes, true)}</div>
  </article>`).join('');
}

async function loadRecords() {
  const response = await fetch('/api/admin/submissions');
  if (response.status === 401) { loginView.classList.remove('hidden'); dashboard.classList.add('hidden'); return; }
  const result = await response.json();
  loginView.classList.add('hidden'); dashboard.classList.remove('hidden');
  render(result.submissions);
}

loginForm.addEventListener('submit', async (event) => {
  event.preventDefault(); loginMessage.textContent = '';
  const response = await fetch('/api/admin/login', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(Object.fromEntries(new FormData(loginForm))) });
  const result = await response.json();
  if (!response.ok) { loginMessage.textContent = result.error || '登录失败'; return; }
  loginForm.reset(); await loadRecords();
});

recordsView.addEventListener('click', async (event) => {
  const button = event.target.closest('.delete-record'); if (!button) return;
  if (!confirm('确定删除这份登记吗？此操作无法撤销。')) return;
  const card = button.closest('.record');
  const response = await fetch(`/api/admin/submissions/${card.dataset.id}`, { method:'DELETE' });
  if (response.ok) await loadRecords(); else alert('删除失败，请刷新后重试。');
});

document.querySelector('#logout').addEventListener('click', async () => { await fetch('/api/admin/logout', { method:'POST' }); await loadRecords(); });
loadRecords();
