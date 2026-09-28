const { allowMethods, handleError, readBody, sendJson } = require('../lib/http');
const { cleanSubmission } = require('../lib/submissions');
const { supabaseRequest } = require('../lib/supabase');

module.exports = async function handler(req, res) {
  if (!allowMethods(req, res, ['POST'])) return;
  try {
    const submission = cleanSubmission(readBody(req));
    const now = new Date().toISOString();
    const rows = await supabaseRequest('submissions?on_conflict=normalized_name', {
      method: 'POST',
      headers: { Prefer: 'resolution=merge-duplicates,return=representation' },
      body: JSON.stringify({ ...submission, submitted_at: now, updated_at: now })
    });
    sendJson(res, 201, { ok: true, id: rows[0].id });
  } catch (error) { handleError(res, error); }
};
