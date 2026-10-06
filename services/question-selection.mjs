const storageKey = 'seu-teacher-selection-v1';

export function filterQuestions(questions, { group = 'all', type = 'all', search = '' } = {}) {
  const term = search.trim();
  return questions.filter(q => (group === 'all' || q.groupId === group)
    && (type === 'all' || q.type === type)
    && `${q.type}${q.sourceNumber}${q.groupName}${q.searchText}`.includes(term));
}

export function restoreSelection(storage, questions) {
  try {
    const ids = JSON.parse(storage?.getItem(storageKey) ?? '[]');
    const known = new Set(questions.map(q => q.id));
    return new Set(Array.isArray(ids) ? ids.filter(id => known.has(id)) : []);
  } catch { return new Set(); }
}

export function persistSelection(storage, selected) {
  try { storage.setItem(storageKey, JSON.stringify([...selected])); return true; }
  catch { return false; }
}
