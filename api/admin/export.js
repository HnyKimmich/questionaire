const { isAdmin } = require('../../lib/auth');
const { allowMethods, handleError, requireAdmin } = require('../../lib/http');
const { fromDatabase } = require('../../lib/submissions');
const { supabaseRequest } = require('../../lib/supabase');
const questionnaire = require('../../public/questionnaire');

function csvCell(value) { return `"${String(value ?? '').replaceAll('"', '""')}"`; }
function optionData(option) { return typeof option === 'string' ? { value: option, label: option } : option; }
function answerText(question, answers) {
  const value = answers[question.id]; const details = answers[`${question.id}__detail`] || {};
  if (value == null || value === '') return '';
  if (Array.isArray(value)) return value.map((item, index) => `${question.type === 'rank' ? `${index + 1}. ` : ''}${item}${details[item] ? `（${details[item]}）` : ''}`).join(question.type === 'rank' ? ' > ' : '、');
  return `${value}${details[value] ? `（${details[value]}）` : ''}`;
}

module.exports = async function handler(req, res) {
  if (!allowMethods(req, res, ['GET'])) return;
  if (!requireAdmin(req, res, isAdmin)) return;
  try {
    const records = (await supabaseRequest('submissions?select=*&order=updated_at.desc')).map(fromDatabase);
    const questions = questionnaire.chapters.flatMap((chapter) => chapter.questions);
    const columns = ['更新时间', '姓名', ...questions.flatMap((question) => [question.prompt, `${question.prompt}（补充）`])];
    const rows = records.map((record) => [record.updatedAt, record.name, ...questions.flatMap((question) => [answerText(question, record.answers), record.answers[`${question.id}__note`] || ''])]);
    const csv = '\uFEFF' + [columns, ...rows].map((row) => row.map(csvCell).join(',')).join('\r\n');
    res.statusCode = 200; res.setHeader('Content-Type', 'text/csv; charset=utf-8'); res.setHeader('Content-Disposition', `attachment; filename="submissions-${new Date().toISOString().slice(0, 10)}.csv"`); res.setHeader('Cache-Control', 'no-store'); res.end(csv);
  } catch (error) { handleError(res, error); }
};
