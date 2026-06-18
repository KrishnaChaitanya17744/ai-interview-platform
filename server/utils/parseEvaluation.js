const parseEvaluation = (text) => {
  const extract = (label, next) => {
    const m = text.match(new RegExp(`${label}:\\s*([\\s\\S]*?)(?=${next}:|$)`, 'i'));
    return m ? m[1].trim() : '';
  };

  const list = (raw) =>
    raw
      .split('\n')
      .map((l) => l.replace(/^(\s*[-*•]|\s*\d+\.)\s*/, '').trim())
      .filter(Boolean);

  const scoreMatch = extract('SCORE', 'STRENGTHS').match(/(\d+)/);
  if (!scoreMatch) {
    console.warn('Unable to parse SCORE from evaluation text; defaulting to 6/10.', {
      evaluationText: text,
    });
  }

  return {
    score:        scoreMatch ? `${scoreMatch[1]}/10` : '6/10',
    strengths:    list(extract('STRENGTHS',    'IMPROVEMENTS')),
    improvements: list(extract('IMPROVEMENTS', 'SUMMARY')),
    summary:      extract('SUMMARY', '___END___'),
  };
};

module.exports = parseEvaluation;
