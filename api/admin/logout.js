const { clearCookie } = require('../../lib/auth');
const { allowMethods, sendJson } = require('../../lib/http');

module.exports = function handler(req, res) {
  if (!allowMethods(req, res, ['POST'])) return;
  const secure = !String(req.headers.host || '').startsWith('localhost');
  res.setHeader('Set-Cookie', clearCookie(secure));
  sendJson(res, 200, { ok: true });
};
