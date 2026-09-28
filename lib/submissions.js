const MAX_ANSWERS_SIZE = 48 * 1024;

function badRequest(message) {
  return Object.assign(new Error(message), { status: 400 });
}

function normalizeName(value) {
  return String(value || '').normalize('NFKC').trim().toLocaleLowerCase('zh-CN');
}

function cleanValue(value, depth = 0) {
  if (depth > 4) throw badRequest('回答内容格式不正确');
  if (typeof value === 'string') return value.trim().slice(0, 1200);
  if (Array.isArray(value)) return value.slice(0, 50).map((item) => cleanValue(item, depth + 1));
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).slice(0, 100).map(([key, item]) => [String(key).slice(0, 100), cleanValue(item, depth + 1)]));
  }
  if (value == null) return '';
  throw badRequest('回答内容格式不正确');
}

function cleanSubmission(body = {}) {
  if (body.website) throw badRequest('提交失败');
  const name = typeof body.name === 'string' ? body.name.normalize('NFKC').trim() : '';
  if (!name) throw badRequest('请填写姓名');
  if (name.length > 60) throw badRequest('姓名过长，请适当精简');
  if (!body.answers || typeof body.answers !== 'object' || Array.isArray(body.answers)) throw badRequest('回答内容格式不正确');
  const answers = cleanValue(body.answers);
  if (Buffer.byteLength(JSON.stringify(answers), 'utf8') > MAX_ANSWERS_SIZE) throw badRequest('回答内容过长，请适当精简');
  const questionnaireVersion = typeof body.questionnaireVersion === 'string' ? body.questionnaireVersion.trim().slice(0, 40) : '';
  return { name, normalized_name: normalizeName(name), questionnaire_version: questionnaireVersion, answers };
}

function fromDatabase(row) {
  return {
    id: row.id,
    submittedAt: row.submitted_at,
    updatedAt: row.updated_at || row.submitted_at,
    name: row.name,
    questionnaireVersion: row.questionnaire_version || '',
    answers: row.answers || {}
  };
}

module.exports = { cleanSubmission, fromDatabase, normalizeName };
