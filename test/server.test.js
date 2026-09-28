const test = require('node:test');
const assert = require('node:assert/strict');
const { cleanSubmission } = require('../lib/submissions');

const valid = { name:'小林', contact:'test@example.com', identity:'我想找辅导', subjects:'数学', goal:'准备考试', availability:'周末', mode:'线上', notes:'', consent:true };

test('accepts and trims a valid submission', () => {
  const result = cleanSubmission({ ...valid, name:'  小林  ' });
  assert.equal(result.name, '小林');
});

test('rejects missing required fields', () => {
  assert.throws(() => cleanSubmission({ ...valid, goal:'' }), /请完整填写必填项/);
});

test('requires explicit consent', () => {
  assert.throws(() => cleanSubmission({ ...valid, consent:false }), /信息使用说明/);
});

test('rejects the honeypot field used by bots', () => {
  assert.throws(() => cleanSubmission({ ...valid, website:'spam.example' }), /提交失败/);
});
