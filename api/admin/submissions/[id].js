const { isAdmin } = require('../../../lib/auth');
const { allowMethods, handleError, requireAdmin, sendJson } = require('../../../lib/http');
const { supabaseRequest } = require('../../../lib/supabase');

module.exports = async function handler(req, res) {
  if (!allowMethods(req, res, ['DELETE'])) return;
  if (!requireAdmin(req, res, isAdmin)) return;
  try {
    const id = String(req.query.id || '');
    if (!/^[0-9a-f-]{36}$/i.test(id)) return sendJson(res, 400, { error: '记录编号不正确' });
    await supabaseRequest(`submissions?id=eq.${encodeURIComponent(id)}`, { method: 'DELETE' });
    sendJson(res, 200, { ok: true });
  } catch (error) { handleError(res, error); }
};
