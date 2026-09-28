const form = document.querySelector('#questionnaire');
const message = document.querySelector('#form-message');

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  const button = form.querySelector('button[type="submit"]');
  const data = Object.fromEntries(new FormData(form));
  data.consent = form.elements.consent.checked;
  button.disabled = true;
  button.firstElementChild.textContent = '正在提交…';
  message.textContent = '';
  message.classList.remove('error');
  try {
    const response = await fetch('/api/submissions', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || '提交失败');
    form.reset();
    message.textContent = '✓ 已收到你的登记，谢谢！我们会尽快与你联系。';
    message.scrollIntoView({ behavior: 'smooth', block: 'center' });
  } catch (error) {
    message.textContent = `提交失败：${error.message}`;
    message.classList.add('error');
  } finally {
    button.disabled = false;
    button.firstElementChild.textContent = '提交我的登记';
  }
});
