const questionnaire = window.PEERLY_QUESTIONNAIRE;
const loginView = document.querySelector('#login-view');
const dashboard = document.querySelector('#dashboard');
const loginForm = document.querySelector('#login-form');
const loginMessage = document.querySelector('#login-message');
const studentView = document.querySelector('#student-view');
const questionView = document.querySelector('#question-view');
const countView = document.querySelector('#count');
const questions = questionnaire.chapters.flatMap((chapter) => chapter.questions.map((question) => ({ ...question, chapter: chapter.title })));
let submissions = [];

function escapeHtml(value) { const element = document.createElement('div'); element.textContent = value ?? ''; return element.innerHTML; }
function formatDate(value) { return new Intl.DateTimeFormat('zh-CN', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value)); }
function optionData(option) { return typeof option === 'string' ? { value: option, label: option } : option; }

function displayValue(question, answers) {
  const value = answers[question.id];
  if (value == null || value === '' || (Array.isArray(value) && !value.length)) return '';
  const details = answers[`${question.id}__detail`] || {};
  if (question.type === 'rank') return value.map((item, index) => `${index + 1}. ${item}${details[item] ? `（${details[item]}）` : ''}`).join('\n');
  if (Array.isArray(value)) return value.map((item) => `${item}${details[item] ? `（${details[item]}）` : ''}`).join('、');
  return `${value}${details[value] ? `（${details[value]}）` : ''}`;
}

function renderStudents() {
  countView.textContent = submissions.length;
  if (!submissions.length) { studentView.innerHTML = '<div class="empty">还没有收到问卷。</div>'; return; }
  studentView.innerHTML = submissions.map((record) => {
    const items = questions.map((question) => {
      const value = displayValue(question, record.answers || {});
      const note = record.answers?.[`${question.id}__note`];
      if (!value && !note) return '';
      return `<div class="record-item wide"><span>${escapeHtml(question.chapter)} · ${escapeHtml(question.prompt)}</span><p>${escapeHtml(value || '未回答')}${note ? `\n补充：${escapeHtml(note)}` : ''}</p></div>`;
    }).join('');
    return `<article class="record" data-id="${record.id}"><div class="record-head"><div><h3>${escapeHtml(record.name)}</h3><time>更新于 ${formatDate(record.updatedAt || record.submittedAt)}</time></div><button class="button-danger delete-record">删除</button></div><div class="record-grid">${items || '<div class="record-item wide"><p>除姓名外未回答其他问题。</p></div>'}</div></article>`;
  }).join('');
}

function responseValues(question, record) {
  const value = record.answers?.[question.id];
  if (question.type === 'multi') return Array.isArray(value) ? value : [];
  return value == null || value === '' ? [] : [value];
}

function renderBars(question) {
  const counts = new Map(); let answered = 0;
  submissions.forEach((record) => {
    const values = responseValues(question, record); if (values.length) answered += 1;
    values.forEach((value) => counts.set(value, (counts.get(value) || 0) + 1));
  });
  const options = [...(question.options || []).map((item) => optionData(item).value), ...[...counts.keys()].filter((value) => !(question.options || []).some((item) => optionData(item).value === value))];
  return `<div class="analysis-head"><h4>${escapeHtml(question.prompt)}</h4><span>${answered} 人回答 · ${submissions.length - answered} 人未回答</span></div>${options.map((option) => { const count = counts.get(option) || 0; const percent = answered ? Math.round(count / answered * 100) : 0; return `<div class="bar-row"><span>${escapeHtml(option)}</span><div class="bar"><i style="width:${percent}%"></i></div><strong>${count} · ${percent}%</strong></div>`; }).join('')}`;
}

function renderRanking(question) {
  const totals = new Map(); const counts = new Map(); let answered = 0;
  submissions.forEach((record) => { const ranking = record.answers?.[question.id]; if (!Array.isArray(ranking) || !ranking.length) return; answered += 1; ranking.forEach((value, index) => { totals.set(value, (totals.get(value) || 0) + index + 1); counts.set(value, (counts.get(value) || 0) + 1); }); });
  const rows = [...totals.keys()].map((value) => ({ value, average: totals.get(value) / counts.get(value) })).sort((a, b) => a.average - b.average);
  return `<div class="analysis-head"><h4>${escapeHtml(question.prompt)}</h4><span>${answered} 人回答 · ${submissions.length - answered} 人未回答</span></div>${rows.length ? rows.map((row) => `<div class="bar-row"><span>${escapeHtml(row.value)}</span><div class="bar"><i style="width:${Math.max(5,100-row.average*8)}%"></i></div><strong>平均 ${row.average.toFixed(1)}</strong></div>`).join('') : '<p>暂无排序回答</p>'}`;
}

function renderText(question) {
  const rows = submissions.map((record) => ({ name: record.name, value: displayValue(question, record.answers || {}), note: record.answers?.[`${question.id}__note`] })).filter((item) => item.value || item.note);
  return `<div class="analysis-head"><h4>${escapeHtml(question.prompt)}</h4><span>${rows.length} 人回答 · ${submissions.length - rows.length} 人未回答</span></div><div class="text-responses">${rows.length ? rows.map((row) => `<div class="text-response"><strong>${escapeHtml(row.name)}</strong>：${escapeHtml(row.value || row.note)}</div>`).join('') : '<p>暂无回答</p>'}</div>`;
}

function renderQuestions() {
  questionView.innerHTML = questionnaire.chapters.map((chapter) => `<section class="analysis-section"><h3>${escapeHtml(chapter.title)}</h3>${chapter.questions.map((question) => `<article class="analysis-card">${question.type === 'rank' ? renderRanking(question) : question.type === 'text' ? renderText(question) : renderBars(question)}</article>`).join('')}</section>`).join('');
}

function render() { renderStudents(); renderQuestions(); }
async function loadRecords() {
  const response = await fetch('/api/admin/submissions');
  if (response.status === 401) { loginView.classList.remove('hidden'); dashboard.classList.add('hidden'); return; }
  const result = await response.json(); submissions = result.submissions || [];
  loginView.classList.add('hidden'); dashboard.classList.remove('hidden'); render();
}

loginForm.addEventListener('submit', async (event) => { event.preventDefault(); loginMessage.textContent = ''; const response = await fetch('/api/admin/login', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(Object.fromEntries(new FormData(loginForm))) }); const result = await response.json(); if (!response.ok) { loginMessage.textContent = result.error || '登录失败'; return; } loginForm.reset(); await loadRecords(); });
studentView.addEventListener('click', async (event) => { const button = event.target.closest('.delete-record'); if (!button) return; if (!confirm('确定删除这份回复吗？此操作无法撤销。')) return; const card = button.closest('.record'); const response = await fetch(`/api/admin/submissions/${card.dataset.id}`, { method:'DELETE' }); if (response.ok) await loadRecords(); else alert('删除失败，请刷新后重试。'); });
document.querySelector('.view-tabs').addEventListener('click', (event) => { const button = event.target.closest('[data-view]'); if (!button) return; document.querySelectorAll('.view-tab').forEach((item) => item.classList.toggle('active', item === button)); studentView.classList.toggle('hidden', button.dataset.view !== 'students'); questionView.classList.toggle('hidden', button.dataset.view !== 'questions'); });
document.querySelector('#logout').addEventListener('click', async () => { await fetch('/api/admin/logout', { method:'POST' }); await loadRecords(); });
loadRecords();
