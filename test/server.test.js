const test = require('node:test');
const assert = require('node:assert/strict');
const { cleanSubmission } = require('../lib/submissions');

const valid = { name:'小林', questionnaireVersion:'2026-09-29.1', answers:{ zodiac:'双鱼座', ai_uses:['辅助学习'] } };

test('accepts and trims a valid submission', () => {
  const result = cleanSubmission({ ...valid, name:'  小林  ' });
  assert.equal(result.name, '小林');
  assert.equal(result.normalized_name, '小林');
  assert.deepEqual(result.answers.ai_uses, ['辅助学习']);
});

test('rejects missing required fields', () => {
  assert.throws(() => cleanSubmission({ ...valid, name:'' }), /请填写姓名/);
});

test('rejects the honeypot field used by bots', () => {
  assert.throws(() => cleanSubmission({ ...valid, website:'spam.example' }), /提交失败/);
});
