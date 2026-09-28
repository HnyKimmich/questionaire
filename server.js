const http = require('node:http');
const fs = require('node:fs/promises');
const path = require('node:path');
const crypto = require('node:crypto');
const { cleanSubmission: cleanQuestionnaireSubmission, fromDatabase } = require('./lib/submissions');
const questionnaire = require('./public/questionnaire');

loadEnvFile();

const PORT = Number(process.env.PORT || 3000);
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'change-me-now';
const SESSION_SECRET = process.env.SESSION_SECRET || 'development-secret-change-before-deploy';
const PUBLIC_DIR = path.join(__dirname, 'public');
const DATA_DIR = path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'submissions.json');
const MAX_BODY = 64 * 1024;
const COOKIE_NAME = 'questionnaire_admin';

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

function loadEnvFile() {
  try {
    const content = require('node:fs').readFileSync(path.join(__dirname, '.env'), 'utf8');
    for (const line of content.split(/\r?\n/)) {
      const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
      if (!match || process.env[match[1]] !== undefined) continue;
      let value = match[2];
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      process.env[match[1]] = value;
    }
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
}

function json(res, status, payload, headers = {}) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', ...headers });
  res.end(JSON.stringify(payload));
}

async function readJson(req) {
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > MAX_BODY) throw Object.assign(new Error('请求内容过大'), { status: 413 });
    chunks.push(chunk);
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}');
  } catch {
    throw Object.assign(new Error('请求格式不正确'), { status: 400 });
  }
}

async function loadSubmissions() {
  try {
    return JSON.parse(await fs.readFile(DATA_FILE, 'utf8'));
  } catch (error) {
    if (error.code === 'ENOENT') return [];
    throw error;
  }
}

let writeQueue = Promise.resolve();
function updateSubmissions(updater) {
  const operation = writeQueue.then(async () => {
    const records = await loadSubmissions();
    const next = await updater(records);
    await fs.mkdir(DATA_DIR, { recursive: true });
    const temporary = `${DATA_FILE}.tmp`;
    await fs.writeFile(temporary, JSON.stringify(next, null, 2), 'utf8');
    await fs.rename(temporary, DATA_FILE);
    return next;
  });
  writeQueue = operation.catch(() => {});
  return operation;
}

function cleanSubmission(body) {
  return cleanQuestionnaireSubmission(body);
}

function sign(value) {
  return crypto.createHmac('sha256', SESSION_SECRET).update(value).digest('base64url');
}

function createSession() {
  const expires = Date.now() + 12 * 60 * 60 * 1000;
  const value = String(expires);
  return `${value}.${sign(value)}`;
}

function isAdmin(req) {
  const cookie = (req.headers.cookie || '').split(';').map((item) => item.trim()).find((item) => item.startsWith(`${COOKIE_NAME}=`));
  if (!cookie) return false;
  const [expires, signature] = decodeURIComponent(cookie.slice(COOKIE_NAME.length + 1)).split('.');
  if (!expires || !signature || Number(expires) < Date.now()) return false;
  const expected = sign(expires);
  if (signature.length !== expected.length) return false;
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
}

function safeEqualText(a, b) {
  const left = crypto.createHash('sha256').update(String(a)).digest();
  const right = crypto.createHash('sha256').update(String(b)).digest();
  return crypto.timingSafeEqual(left, right);
}

function csvCell(value) {
  return `"${String(value ?? '').replaceAll('"', '""')}"`;
}

async function serveStatic(req, res, pathname) {
  let relative = pathname === '/' ? 'index.html' : pathname.slice(1);
  if (pathname === '/admin') relative = 'admin.html';
  const resolved = path.resolve(PUBLIC_DIR, relative);
  if (!resolved.startsWith(`${PUBLIC_DIR}${path.sep}`)) return false;
  try {
    const content = await fs.readFile(resolved);
    res.writeHead(200, {
      'Content-Type': mimeTypes[path.extname(resolved)] || 'application/octet-stream',
      'X-Content-Type-Options': 'nosniff',
      'Content-Security-Policy': "default-src 'self'; style-src 'self'; script-src 'self'; img-src 'self' data:; base-uri 'none'; form-action 'self'; frame-ancestors 'none'"
    });
    res.end(content);
    return true;
  } catch (error) {
    if (error.code === 'ENOENT') return false;
    throw error;
  }
}

async function handleApi(req, res, pathname) {
  if (req.method === 'POST' && pathname === '/api/submissions') {
    const body = cleanSubmission(await readJson(req));
    const now = new Date().toISOString();
    const record = { id: crypto.randomUUID(), submitted_at: now, updated_at: now, ...body };
    let savedRecord = record;
    await updateSubmissions((records) => {
      const existing = records.find((item) => item.normalized_name === body.normalized_name);
      if (!existing) return [...records, record];
      savedRecord = { ...record, id: existing.id };
      return records.map((item) => item.id === existing.id ? savedRecord : item);
    });
    return json(res, 201, { ok: true, id: savedRecord.id });
  }

  if (req.method === 'POST' && pathname === '/api/admin/login') {
    const body = await readJson(req);
    if (!safeEqualText(body.password || '', ADMIN_PASSWORD)) return json(res, 401, { error: '密码不正确' });
    const cookie = `${COOKIE_NAME}=${encodeURIComponent(createSession())}; HttpOnly; SameSite=Strict; Path=/; Max-Age=43200`;
    return json(res, 200, { ok: true }, { 'Set-Cookie': cookie });
  }

  if (req.method === 'POST' && pathname === '/api/admin/logout') {
    return json(res, 200, { ok: true }, { 'Set-Cookie': `${COOKIE_NAME}=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0` });
  }

  if (pathname.startsWith('/api/admin/') && !isAdmin(req)) return json(res, 401, { error: '请先登录' });

  if (req.method === 'GET' && pathname === '/api/admin/submissions') {
    const records = await loadSubmissions();
    return json(res, 200, { submissions: records.map(fromDatabase).sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt))) });
  }

  if (req.method === 'GET' && pathname === '/api/admin/export') {
    const records = (await loadSubmissions()).map(fromDatabase);
    const questions = questionnaire.chapters.flatMap((chapter) => chapter.questions);
    const columns = ['更新时间', '姓名', ...questions.flatMap((question) => [question.prompt, `${question.prompt}（补充）`])];
    const rows = records.map((record) => [record.updatedAt, record.name, ...questions.flatMap((question) => {
      const value = record.answers[question.id];
      const text = Array.isArray(value) ? value.join(question.type === 'rank' ? ' > ' : '、') : (value || '');
      return [text, record.answers[`${question.id}__note`] || ''];
    })]);
    const csv = '\uFEFF' + [columns, ...rows].map((row) => row.map(csvCell).join(',')).join('\r\n');
    res.writeHead(200, {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="submissions-${new Date().toISOString().slice(0, 10)}.csv"`
    });
    return res.end(csv);
  }

  const deleteMatch = pathname.match(/^\/api\/admin\/submissions\/([0-9a-f-]+)$/i);
  if (req.method === 'DELETE' && deleteMatch) {
    let found = false;
    await updateSubmissions((records) => records.filter((record) => {
      if (record.id === deleteMatch[1]) found = true;
      return record.id !== deleteMatch[1];
    }));
    return found ? json(res, 200, { ok: true }) : json(res, 404, { error: '记录不存在' });
  }

  return json(res, 404, { error: '接口不存在' });
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    if (url.pathname.startsWith('/api/')) return await handleApi(req, res, url.pathname);
    if (req.method !== 'GET' && req.method !== 'HEAD') return json(res, 405, { error: '不支持此请求方法' });
    if (await serveStatic(req, res, url.pathname)) return;
    json(res, 404, { error: '页面不存在' });
  } catch (error) {
    console.error(error);
    json(res, error.status || 500, { error: error.status ? error.message : '服务器暂时出错，请稍后重试' });
  }
});

if (require.main === module) {
  server.listen(PORT, () => {
    console.log(`问卷网站已启动：http://localhost:${PORT}`);
    if (ADMIN_PASSWORD === 'change-me-now') console.warn('警告：请在 .env 中设置 ADMIN_PASSWORD 后再公开部署。');
  });
}

module.exports = { server, cleanSubmission, createSession, isAdmin };
