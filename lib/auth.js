const crypto = require('node:crypto');
const { requireEnv } = require('./config');

const COOKIE_NAME = 'peerly_admin';
const SESSION_HOURS = 12;

function sign(value) {
  return crypto.createHmac('sha256', requireEnv('SESSION_SECRET')).update(value).digest('base64url');
}

function createSession() {
  const expires = Date.now() + SESSION_HOURS * 60 * 60 * 1000;
  return `${expires}.${sign(String(expires))}`;
}

function parseCookies(header = '') {
  return Object.fromEntries(header.split(';').map((part) => part.trim()).filter(Boolean).map((part) => {
    const index = part.indexOf('=');
    return [part.slice(0, index), decodeURIComponent(part.slice(index + 1))];
  }));
}

function isAdmin(req) {
  const token = parseCookies(req.headers.cookie)[COOKIE_NAME];
  if (!token) return false;
  const [expires, signature] = token.split('.');
  if (!expires || !signature || Number(expires) < Date.now()) return false;
  const expected = sign(expires);
  if (signature.length !== expected.length) return false;
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
}

function passwordMatches(value) {
  const actual = crypto.createHash('sha256').update(String(value || '')).digest();
  const expected = crypto.createHash('sha256').update(requireEnv('ADMIN_PASSWORD')).digest();
  return crypto.timingSafeEqual(actual, expected);
}

function sessionCookie(token, secure = true) {
  return `${COOKIE_NAME}=${encodeURIComponent(token)}; HttpOnly${secure ? '; Secure' : ''}; SameSite=Strict; Path=/; Max-Age=${SESSION_HOURS * 3600}`;
}

function clearCookie(secure = true) {
  return `${COOKIE_NAME}=; HttpOnly${secure ? '; Secure' : ''}; SameSite=Strict; Path=/; Max-Age=0`;
}

module.exports = { createSession, isAdmin, passwordMatches, sessionCookie, clearCookie };
