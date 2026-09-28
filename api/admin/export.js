const { isAdmin } = require('../../lib/auth');
const { allowMethods, handleError, requireAdmin } = require('../../lib/http');
const { fromDatabase } = require('../../lib/submissions');
const { supabaseRequest } = require('../../lib/supabase');

function csvCell(value) { return `"${String(value ?? '').replaceAll('"', '""')}"`; }

module.exports = async function handler(req, res) {
  if (!allowMethods(req, res, ['GET'])) return;
  if (!requireAdmin(req, res, isAdmin)) return;
  try {
    const records = (await supabaseRequest('submissions?select=*&order=submitted_at.desc')).map(fromDatabase);
    const columns = ['提交时间', '姓名', '联系方式', '身份', '科目', '辅导目标', '可用时间', '形式', '补充说明'];
    const keys = ['submittedAt', 'name', 'contact', 'identity', 'subjects', 'goal', 'availability', 'mode', 'notes'];
    const csv = '\uFEFF' + [columns.map(csvCell).join(','), ...records.map((record) => keys.map((key) => csvCell(record[key])).join(','))].join('\r\n');
    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="submissions-${new Date().toISOString().slice(0, 10)}.csv"`);
    res.setHeader('Cache-Control', 'no-store');
    res.end(csv);
  } catch (error) { handleError(res, error); }
};
