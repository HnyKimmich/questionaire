const { createSession, passwordMatches, sessionCookie } = require('../../lib/auth');
const { allowMethods, handleError, readBody, sendJson } = require('../../lib/http');

module.exports = function handler(req, res) {
  if (!allowMethods(req, res, ['POST'])) return;
  try {
    if (!passwordMatches(readBody(req).password)) return sendJson(res, 401, { error: '密码不正确' });
    const secure = !String(req.headers.host || '').startsWith('localhost');
    res.setHeader('Set-Cookie', sessionCookie(createSession(), secure));
    sendJson(res, 200, { ok: true });
  } catch (error) { handleError(res, error); }
};
