const { requireEnv } = require('./config');

async function supabaseRequest(resource, options = {}) {
  const base = requireEnv('SUPABASE_URL').replace(/\/$/, '');
  const key = requireEnv('SUPABASE_SECRET_KEY');
  const response = await fetch(`${base}/rest/v1/${resource}`, {
    ...options,
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
      ...options.headers
    }
  });
  const text = await response.text();
  if (!response.ok) {
    console.error('Supabase error:', response.status, text);
    throw new Error('数据库请求失败');
  }
  return text ? JSON.parse(text) : null;
}

module.exports = { supabaseRequest };
