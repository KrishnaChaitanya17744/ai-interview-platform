// server/middleware/validate.js
// Schema-based validation for body, query, and params.

const { stripDangerousKeys } = require('../utils/sanitize');

/**
 * @param {import('zod').ZodType} schema
 * @param {'body'|'query'|'params'} source
 */
const validate = (schema, source = 'body') => (req, res, next) => {
  const raw = stripDangerousKeys(req[source] ?? {});
  const result = schema.safeParse(raw);

  if (!result.success) {
    const first = result.error.issues[0];
    const message = first?.message || 'Validation failed';
    const field = first?.path?.join('.') || source;
    return res.status(400).json({
      success: false,
      message,
      field,
    });
  }

  req[source] = result.data;
  next();
};

module.exports = { validate };
