const rules = {
  name: { max: 60, required: true },
  contact: { max: 120, required: true },
  identity: { max: 30, required: true },
  subjects: { max: 200, required: true },
  goal: { max: 1200, required: true },
  availability: { max: 500, required: true },
  mode: { max: 30, required: true },
  notes: { max: 1200, required: false }
};

function cleanSubmission(body) {
  if (body.website) throw Object.assign(new Error('提交失败'), { status: 400 });
  const result = {};
  for (const [key, rule] of Object.entries(rules)) {
    const value = typeof body[key] === 'string' ? body[key].trim() : '';
    if (rule.required && !value) throw Object.assign(new Error('请完整填写必填项'), { status: 400 });
    if (value.length > rule.max) throw Object.assign(new Error('填写内容过长，请适当精简'), { status: 400 });
    result[key] = value;
  }
  if (body.consent !== true) throw Object.assign(new Error('请先同意信息使用说明'), { status: 400 });
  return result;
}

function fromDatabase(row) {
  return {
    id: row.id,
    submittedAt: row.submitted_at,
    name: row.name,
    contact: row.contact,
    identity: row.identity,
    subjects: row.subjects,
    goal: row.goal,
    availability: row.availability,
    mode: row.mode,
    notes: row.notes || ''
  };
}

module.exports = { cleanSubmission, fromDatabase };
