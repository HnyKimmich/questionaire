const test = require('node:test');
const assert = require('node:assert/strict');

process.env.SESSION_SECRET = 'test-session-secret-that-is-long-enough';
process.env.ADMIN_PASSWORD = 'test-admin-password';
process.env.SUPABASE_URL = 'https://example.supabase.co';
process.env.SUPABASE_SECRET_KEY = 'sb_secret_test';

const { createSession, isAdmin, passwordMatches } = require('../lib/auth');
const submitHandler = require('../api/submissions');

function responseMock() {
  return {
    headers: {},
    setHeader(name, value) { this.headers[name.toLowerCase()] = value; },
    end(value) { this.body = value; }
  };
}

const valid = { name:'小林', contact:'test@example.com', identity:'我想找辅导', subjects:'数学', goal:'准备考试', availability:'周末', mode:'线上', notes:'', consent:true };

test('creates and verifies an admin session', () => {
  const token = createSession();
  assert.equal(isAdmin({ headers:{ cookie:`peerly_admin=${encodeURIComponent(token)}` } }), true);
  assert.equal(passwordMatches('test-admin-password'), true);
  assert.equal(passwordMatches('wrong'), false);
});

test('cloud submit handler writes through the secret Supabase API', async () => {
  const originalFetch = global.fetch;
  let request;
  global.fetch = async (url, options) => {
    request = { url, options };
    return { ok:true, text:async () => JSON.stringify([{ id:'0b045d69-57b5-4621-b479-eeb6e9c2d888' }]) };
  };
  try {
    const req = { method:'POST', body:valid, headers:{} };
    const res = responseMock();
    await submitHandler(req, res);
    assert.equal(res.statusCode, 201);
    assert.equal(JSON.parse(res.body).ok, true);
    assert.equal(request.url, 'https://example.supabase.co/rest/v1/submissions');
    assert.equal(request.options.headers.apikey, 'sb_secret_test');
    assert.equal(JSON.parse(request.options.body).name, '小林');
  } finally {
    global.fetch = originalFetch;
  }
});
