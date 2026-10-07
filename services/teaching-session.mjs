import { GroupStore } from './question-groups.mjs';
import { PreparationStore, resolvePreparation } from './classroom-preparation.mjs';

export function loadPrepared(storage, questions, version) {
  if (!storage) return { ok: false, reason: 'read' };
  const bank = new GroupStore(storage, questions, version);
  const preparation = new PreparationStore(storage);
  if (bank.readError || preparation.readError) return { ok: false, reason: 'read' };
  const group = resolvePreparation(preparation.current, bank);
  if (!group) return { ok: false, reason: 'missing' };
  const byId = new Map(questions.map(q => [q.id, q]));
  return { ok: true, lesson: { ...preparation.current }, group,
    questions: group.ids.map(id => byId.get(id)) };
}

export function normalizeIndex(value, length) {
  if (!/^\d+$/.test(String(value))) return 0;
  const index = Number(value);
  return Number.isSafeInteger(index) && index < length ? index : 0;
}

export function responseParts(question) {
  const original = question.parts.join('');
  if (question.type === '判断') return {kind:'judgment',stem:original,
    options:[{value:'正确',html:'正确'},{value:'错误',html:'错误'}]};
  if (question.type === '填空') return {kind:'written',stem:original,options:[]};
  const stem=[], options=[];
  for (const part of question.parts) {
    const inner = part.replace(/^<p>|<\/p>$/g,'');
    const markers = [...inner.matchAll(/(?<![A-Za-z])([A-D])(?:[.．]\s*|(?=\s*(?:[\u3400-\u9fff]|<math)))/g)];
    if (!markers.length) { stem.push(part); continue; }
    if (markers[0].index > 0 && inner.slice(0,markers[0].index).trim())
      stem.push('<p>'+inner.slice(0,markers[0].index)+'</p>');
    for (let i=0; i<markers.length; i++) options.push({value:markers[i][1],
      html:inner.slice(markers[i].index,markers[i+1]?.index ?? inner.length).trim()});
  }
  if (options.map(o=>o.value).join('') !== 'ABCD')
    return {kind:'unavailable',stem:original,options:[]};
  return {kind:'single',stem:stem.join(''),options};
}
