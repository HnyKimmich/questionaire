const { allowMethods, handleError, readBody, sendJson } = require('../lib/http');
const { cleanSubmission } = require('../lib/submissions');
const { supabaseRequest } = require('../lib/supabase');

module.exports = async function handler(req, res) {
  if (!allowMethods(req, res, ['POST'])) return;
  try {
    const submission = cleanSubmission(readBody(req));
    const rows = await supabaseRequest('submissions', {
      method: 'POST',
      headers: { Prefer: 'return=representation' },
      body: JSON.stringify(submission)
    });
    sendJson(res, 201, { ok: true, id: rows[0].id });
  } catch (error) { handleError(res, error); }
};
