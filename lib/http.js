function sendJson(res, status, payload) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(payload));
}

function readBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string') {
    try { return JSON.parse(req.body); } catch { return {}; }
  }
  return {};
}

function allowMethods(req, res, methods) {
  if (methods.includes(req.method)) return true;
  res.setHeader('Allow', methods.join(', '));
  sendJson(res, 405, { error: '不支持此请求方法' });
  return false;
}

function requireAdmin(req, res, isAdmin) {
  if (isAdmin(req)) return true;
  sendJson(res, 401, { error: '请先登录' });
  return false;
}

function handleError(res, error) {
  console.error(error);
  sendJson(res, error.status || 500, { error: error.status ? error.message : '服务器暂时出错，请稍后重试' });
}

module.exports = { sendJson, readBody, allowMethods, requireAdmin, handleError };
