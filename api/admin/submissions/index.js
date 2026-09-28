const { isAdmin } = require('../../../lib/auth');
const { allowMethods, handleError, requireAdmin, sendJson } = require('../../../lib/http');
const { fromDatabase } = require('../../../lib/submissions');
const { supabaseRequest } = require('../../../lib/supabase');

module.exports = async function handler(req, res) {
  if (!allowMethods(req, res, ['GET'])) return;
  if (!requireAdmin(req, res, isAdmin)) return;
  try {
    const rows = await supabaseRequest('submissions?select=*&order=updated_at.desc');
    sendJson(res, 200, { submissions: rows.map(fromDatabase) });
  } catch (error) { handleError(res, error); }
};
