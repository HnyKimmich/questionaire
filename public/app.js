const questionnaire = window.PEERLY_QUESTIONNAIRE;
const form = document.querySelector('#questionnaire');
const chaptersView = document.querySelector('#chapters');
const navView = document.querySelector('#chapter-nav');
const message = document.querySelector('#form-message');
const previousButton = document.querySelector('#previous-step');
const nextButton = document.querySelector('#next-step');
const submitButton = document.querySelector('#submit-form');
const draftKey = `peerly-draft:${questionnaire.version}`;
const allQuestions = questionnaire.chapters.flatMap((chapter) => chapter.questions);
let answers = {};
let currentStep = 0;
let saveTimer;

function escapeHtml(value) {
  const element = document.createElement('div');
  element.textContent = value ?? '';
  return element.innerHTML;
}

function optionData(option) {
  return typeof option === 'string' ? { value: option, label: option } : option;
}

function isAnswered(question) {
  const value = answers[question.id];
  if (question.type === 'multi' || question.type === 'rank') return Array.isArray(value) && value.length > 0;
  return typeof value === 'string' && value.trim().length > 0;
}

function isVisible(question) {
  return !question.condition || answers[question.condition.question] === question.condition.equals;
}

function answerText(question) {
  if (Array.isArray(question.tutorAnswer)) return `<ol>${question.tutorAnswer.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ol>`;
  return `<p>${escapeHtml(question.tutorAnswer)}</p>`;
}

function detailField(question, option, selected) {
  if (!option.detail && !option.custom) return '';
  const details = answers[`${question.id}__detail`] || {};
  const value = details[option.value] || '';
  return `<input class="option-detail${selected ? '' : ' hidden'}" data-question="${question.id}" data-option="${escapeHtml(option.value)}" value="${escapeHtml(value)}" maxlength="160" placeholder="${option.custom ? '写下你想补充的内容' : '具体是？'}">`;
}

function renderChoice(question) {
  const selectedValues = question.type === 'multi' ? (answers[question.id] || []) : [answers[question.id]];
  const inputType = question.type === 'multi' ? 'checkbox' : 'radio';
  return `<div class="answer-options">${question.options.map((raw) => {
    const option = optionData(raw);
    const selected = selectedValues.includes(option.value);
    return `<label class="answer-choice"><input type="${inputType}" name="${question.id}" value="${escapeHtml(option.value)}" ${selected ? 'checked' : ''}><span>${escapeHtml(option.label)}</span>${detailField(question, option, selected)}</label>`;
  }).join('')}</div>`;
}

function renderRank(question) {
  const byValue = new Map(question.options.map((raw) => { const option = optionData(raw); return [option.value, option]; }));
  const stored = Array.isArray(answers[question.id]) ? answers[question.id] : [];
  const order = [...stored, ...question.options.map((raw) => optionData(raw).value).filter((value) => !stored.includes(value))];
  return `<div class="rank-help">用箭头调整顺序，排好后点击确认。</div><ol class="rank-list" data-question="${question.id}">${order.map((value, index) => {
    const option = byValue.get(value);
    const details = answers[`${question.id}__detail`] || {};
    return `<li data-value="${escapeHtml(value)}"><span class="rank-number">${index + 1}</span><div class="rank-content"><strong>${escapeHtml(option.label)}</strong>${option.detail || option.custom ? `<input class="rank-detail" data-question="${question.id}" data-option="${escapeHtml(value)}" value="${escapeHtml(details[value] || '')}" maxlength="160" placeholder="${option.custom ? '写下自定义内容' : '具体是？'}">` : ''}</div><div class="rank-controls"><button type="button" class="rank-up" aria-label="上移" ${index === 0 ? 'disabled' : ''}>↑</button><button type="button" class="rank-down" aria-label="下移" ${index === order.length - 1 ? 'disabled' : ''}>↓</button></div></li>`;
  }).join('')}</ol><button class="confirm-rank${isAnswered(question) ? ' confirmed' : ''}" type="button" data-question="${question.id}">${isAnswered(question) ? '✓ 已确认，可继续调整' : '确认这个排序'}</button>`;
}

function renderQuestion(question) {
  const hidden = !isVisible(question);
  const answerControl = question.type === 'rank' ? renderRank(question) : question.type === 'text'
    ? `<input class="text-answer" name="${question.id}" value="${escapeHtml(answers[question.id] || '')}" maxlength="500" placeholder="${escapeHtml(question.placeholder || '写下你的回答')}">`
    : renderChoice(question);
  return `<article class="question-card${hidden ? ' hidden' : ''}" data-question-card="${question.id}">${question.group ? `<p class="question-group">${escapeHtml(question.group)}</p>` : ''}<div class="question-heading"><h3>${escapeHtml(question.prompt)}</h3><span>选答</span></div>${answerControl}<label class="question-note"><span>还想补充的话</span><textarea data-note="${question.id}" maxlength="600" rows="2" placeholder="可以留空">${escapeHtml(answers[`${question.id}__note`] || '')}</textarea></label>${question.tutorAnswer ? `<aside class="tutor-answer${isAnswered(question) ? '' : ' hidden'}" data-tutor="${question.id}"><p class="tutor-label">轮到我回答</p>${answerText(question)}</aside>` : ''}</article>`;
}

function renderChapters() {
  chaptersView.innerHTML = questionnaire.chapters.map((chapter, index) => `<section class="step-panel" data-step="${index + 1}" aria-labelledby="chapter-${chapter.id}"><header class="chapter-header"><p class="kicker">${chapter.eyebrow}</p><div class="chapter-title-row"><span>${chapter.number}</span><h2 id="chapter-${chapter.id}">${escapeHtml(chapter.title)}</h2></div><p>${escapeHtml(chapter.description)}</p></header><div class="questions">${chapter.questions.map(renderQuestion).join('')}</div></section>`).join('');
  navView.innerHTML = `<button type="button" data-go="0"><span>00</span><strong>认识你</strong></button>${questionnaire.chapters.map((chapter, index) => `<button type="button" data-go="${index + 1}"><span>${chapter.number}</span><strong>${escapeHtml(chapter.title)}</strong></button>`).join('')}`;
}

function updateRankNumbers(list) {
  [...list.children].forEach((item, index) => {
    item.querySelector('.rank-number').textContent = index + 1;
    item.querySelector('.rank-up').disabled = index === 0;
    item.querySelector('.rank-down').disabled = index === list.children.length - 1;
  });
}

function storeRank(list, confirmed = false) {
  if (confirmed || answers[list.dataset.question]) {
    const question = allQuestions.find((item) => item.id === list.dataset.question);
    const details = answers[`${question.id}__detail`] || {};
    answers[list.dataset.question] = [...list.children].map((item) => item.dataset.value).filter((value) => {
      const option = optionData(question.options.find((raw) => optionData(raw).value === value));
      return !option.custom || String(details[value] || '').trim();
    });
  }
  scheduleSave();
}

function refreshQuestion(questionId) {
  const question = allQuestions.find((item) => item.id === questionId);
  const card = document.querySelector(`[data-question-card="${questionId}"]`);
  if (!question || !card) return;
  const tutor = card.querySelector(`[data-tutor="${questionId}"]`);
  if (tutor) tutor.classList.toggle('hidden', !isAnswered(question));
  allQuestions.filter((item) => item.condition && item.condition.question === questionId).forEach((dependent) => {
    const dependentCard = document.querySelector(`[data-question-card="${dependent.id}"]`);
    const visible = isVisible(dependent);
    dependentCard.classList.toggle('hidden', !visible);
    if (!visible) {
      delete answers[dependent.id]; delete answers[`${dependent.id}__detail`]; delete answers[`${dependent.id}__note`];
    }
  });
}

function collectChoice(input) {
  const question = allQuestions.find((item) => item.id === input.name);
  if (input.type === 'checkbox') answers[input.name] = [...form.querySelectorAll(`input[name="${CSS.escape(input.name)}"]:checked`)].map((item) => item.value);
  else answers[input.name] = input.value;
  const option = optionData(question.options.find((raw) => optionData(raw).value === input.value));
  const detail = input.closest('.answer-choice').querySelector('.option-detail');
  if (detail) detail.classList.toggle('hidden', !input.checked);
  if (!input.checked && (option.detail || option.custom)) {
    const details = answers[`${question.id}__detail`] || {}; delete details[option.value]; answers[`${question.id}__detail`] = details;
  }
  refreshQuestion(input.name); scheduleSave();
}

function saveDraft() {
  const name = form.elements.name.value.trim();
  localStorage.setItem(draftKey, JSON.stringify({ version: questionnaire.version, name, answers, currentStep, savedAt: Date.now() }));
  document.querySelector('#save-status').textContent = '已自动保存';
  document.querySelector('#save-dot').classList.add('saved');
}

function scheduleSave() {
  clearTimeout(saveTimer);
  document.querySelector('#save-status').textContent = '正在保存…';
  document.querySelector('#save-dot').classList.remove('saved');
  saveTimer = setTimeout(saveDraft, 250);
}

function showStep(step, shouldFocus = true) {
  currentStep = Math.max(0, Math.min(step, questionnaire.chapters.length));
  document.querySelectorAll('.step-panel').forEach((panel) => panel.classList.toggle('active', Number(panel.dataset.step) === currentStep));
  navView.querySelectorAll('button').forEach((button) => {
    const value = Number(button.dataset.go);
    button.classList.toggle('active', value === currentStep);
    button.classList.toggle('complete', value < currentStep);
  });
  previousButton.classList.toggle('hidden', currentStep === 0);
  nextButton.classList.toggle('hidden', currentStep === questionnaire.chapters.length);
  submitButton.classList.toggle('hidden', currentStep !== questionnaire.chapters.length);
  if (shouldFocus) document.querySelector('.questionnaire-main').scrollIntoView({ behavior: 'smooth', block: 'start' });
  scheduleSave();
}

function loadDraft(draft) {
  answers = draft.answers || {};
  form.elements.name.value = draft.name || '';
  renderChapters();
  showStep(Number(draft.currentStep) || 0, false);
}

renderChapters();
showStep(0, false);

form.elements.name.addEventListener('input', scheduleSave);
navView.addEventListener('click', (event) => { const button = event.target.closest('[data-go]'); if (button) showStep(Number(button.dataset.go)); });
previousButton.addEventListener('click', () => showStep(currentStep - 1));
nextButton.addEventListener('click', () => {
  if (currentStep === 0 && !form.elements.name.value.trim()) {
    message.textContent = '请先填写姓名。'; message.classList.add('error'); form.elements.name.focus(); return;
  }
  message.textContent = ''; message.classList.remove('error'); showStep(currentStep + 1);
});

chaptersView.addEventListener('change', (event) => {
  if (event.target.matches('input[type="radio"],input[type="checkbox"]')) collectChoice(event.target);
  if (event.target.matches('.text-answer')) { answers[event.target.name] = event.target.value.trim(); refreshQuestion(event.target.name); scheduleSave(); }
});
chaptersView.addEventListener('input', (event) => {
  if (event.target.matches('[data-note]')) { answers[`${event.target.dataset.note}__note`] = event.target.value; scheduleSave(); }
  if (event.target.matches('.option-detail,.rank-detail')) {
    const key = `${event.target.dataset.question}__detail`;
    answers[key] = { ...(answers[key] || {}), [event.target.dataset.option]: event.target.value };
    if (event.target.matches('.rank-detail') && answers[event.target.dataset.question]) storeRank(event.target.closest('.question-card').querySelector('.rank-list'), true);
    scheduleSave();
  }
  if (event.target.matches('.text-answer')) { answers[event.target.name] = event.target.value; refreshQuestion(event.target.name); scheduleSave(); }
});
chaptersView.addEventListener('click', (event) => {
  const move = event.target.closest('.rank-up,.rank-down');
  if (move) {
    const item = move.closest('li'); const sibling = move.classList.contains('rank-up') ? item.previousElementSibling : item.nextElementSibling;
    if (sibling) move.classList.contains('rank-up') ? item.parentNode.insertBefore(item, sibling) : item.parentNode.insertBefore(sibling, item);
    updateRankNumbers(item.parentNode); storeRank(item.parentNode); return;
  }
  const confirmButton = event.target.closest('.confirm-rank');
  if (confirmButton) {
    const list = document.querySelector(`.rank-list[data-question="${CSS.escape(confirmButton.dataset.question)}"]`);
    storeRank(list, true); confirmButton.textContent = '✓ 已确认，可继续调整'; confirmButton.classList.add('confirmed'); refreshQuestion(confirmButton.dataset.question);
  }
});

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  const name = form.elements.name.value.trim();
  if (!name) { showStep(0); message.textContent = '请先填写姓名。'; message.classList.add('error'); return; }
  submitButton.disabled = true; submitButton.firstElementChild.textContent = '正在提交…'; message.textContent = '';
  try {
    const response = await fetch('/api/submissions', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, answers, questionnaireVersion: questionnaire.version, website: form.elements.website.value }) });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || '提交失败');
    localStorage.removeItem(draftKey); form.classList.add('hidden'); document.querySelector('#success-view').classList.remove('hidden'); window.scrollTo({ top: 0, behavior: 'smooth' });
  } catch (error) { message.textContent = `提交失败：${error.message}`; message.classList.add('error'); }
  finally { submitButton.disabled = false; submitButton.firstElementChild.textContent = '提交问卷'; }
});

try {
  const draft = JSON.parse(localStorage.getItem(draftKey));
  if (draft && draft.version === questionnaire.version && (draft.name || Object.keys(draft.answers || {}).length)) {
    clearTimeout(saveTimer);
    const dialog = document.querySelector('#draft-dialog'); dialog.classList.remove('hidden');
    document.querySelector('#continue-draft').onclick = () => { dialog.classList.add('hidden'); loadDraft(draft); };
    document.querySelector('#restart-draft').onclick = () => { localStorage.removeItem(draftKey); dialog.classList.add('hidden'); };
  }
} catch { localStorage.removeItem(draftKey); }
