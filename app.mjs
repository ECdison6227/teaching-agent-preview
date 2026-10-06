import { questions } from './services/question-data.mjs';
import { filterQuestions, restoreSelection, persistSelection } from './services/question-selection.mjs';
import { buildSelectionDocument, escape } from './services/selection-export.mjs';

let storage;
try { storage = window.localStorage; } catch { /* Browsers can deny storage access. */ }
const selected = restoreSelection(storage, questions);
const pageSize = 6;
let page = 1;
let group = 'all';
let type = 'all';
let search = '';
const body = question => question.parts.join('');
const matched = () => filterQuestions(questions, { group, type, search });
const saveDraft = () => persistSelection(storage, selected);
let exporting = false;

function renderQuestions() {
  const filtered = matched();
  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  page = Math.min(page, pages);
  document.querySelector('#result-count').textContent = `${filtered.length} 道`;
  document.querySelector('#page-count').textContent = `${page} / ${pages}`;
  document.querySelector('#previous-page').disabled = page === 1;
  document.querySelector('#next-page').disabled = page === pages;
  document.querySelector('#question-list').innerHTML = filtered.slice((page - 1) * pageSize, page * pageSize).map(q => `<article class="question-card"><input type="checkbox" id="select-${q.id}" data-question="${q.id}" ${selected.has(q.id) ? 'checked' : ''}><div><div class="question-meta"><span>${q.type} · 原题 ${q.sourceNumber}</span><span>${escape(q.groupName)}</span>${q.needsReview ? '<span class="review-label">待核对</span>' : ''}</div><label for="select-${q.id}" class="question-stem">${q.parts[0]}</label>${q.parts.length > 1 ? `<details><summary>查看${q.type === '单选' ? '选项' : '完整题目'}</summary><div class="question-body">${body(q).slice(q.parts[0].length)}</div></details>` : ''}</div></article>`).join('') || '<div class="empty"><h3>没有匹配题目</h3><button type="button" id="reset-filters">清除筛选</button></div>';
  document.querySelectorAll('[data-group]').forEach(button => {
    if (button.dataset.group === group) button.setAttribute('aria-current', 'true');
    else button.removeAttribute('aria-current');
  });
}

function renderSelection() {
  document.querySelector('#selected-count').textContent = selected.size;
  document.querySelector('#save-selection').disabled = selected.size === 0 || exporting;
  document.querySelector('#clear-selection').disabled = selected.size === 0;
  document.querySelector('#selected-items').innerHTML = selected.size ? [...selected].map((id, i) => {
    const q = questions.find(q => q.id === id);
    return `<li><span class="number">${String(i + 1).padStart(2, '0')}</span><span>${q.type} · 原题 ${q.sourceNumber}<small>${escape(q.groupName)}</small></span><button type="button" class="remove-question" data-remove="${id}" aria-label="移除${q.type}原题${q.sourceNumber}">×</button></li>`;
  }).join('') : '<li class="selection-empty">尚未选题</li>';
  document.querySelector('#selection-status').textContent = '';
}

function show(view) {
  document.querySelectorAll('[data-panel]').forEach(panel => { panel.hidden = panel.dataset.panel !== view; });
  document.querySelectorAll('.primary-nav button').forEach(button => {
    if (button.dataset.view === view) button.setAttribute('aria-current', 'page');
    else button.removeAttribute('aria-current');
  });
  document.querySelector('.primary-nav').hidden = view === 'student';
  document.querySelector('[data-view=student]').hidden = view === 'student';
  document.querySelector('#teacher-return').hidden = view !== 'student';
}

async function downloadSelection() {
  if (exporting) return;
  exporting = true;
  const snapshot = [...selected].map(id => questions.find(q => q.id === id));
  renderSelection();
  try {
    const html = await buildSelectionDocument(snapshot);
    const url = URL.createObjectURL(new Blob([html], { type: 'text/html;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url; link.download = '钢筋混凝土梁-选题单.html'; link.click();
    setTimeout(() => URL.revokeObjectURL(url), 10000);
    document.querySelector('#selection-status').textContent = `已生成 ${snapshot.length} 道题的选题单`;
  } catch {
    document.querySelector('#selection-status').textContent = '选题单生成失败，请重试';
  } finally {
    exporting = false;
    document.querySelector('#save-selection').disabled = selected.size === 0;
  }
}

document.addEventListener('click', event => {
  const navigation = event.target.closest('[data-view]');
  if (navigation) { show(navigation.dataset.view); window.scrollTo(0, 0); }
  const directory = event.target.closest('[data-group]');
  if (directory) { group = directory.dataset.group; document.querySelector('#group-filter').value = group; page = 1; renderQuestions(); }
  const remove = event.target.closest('[data-remove]');
  if (remove) { selected.delete(remove.dataset.remove); saveDraft(); renderQuestions(); renderSelection(); }
  if (event.target.closest('#previous-page')) { page--; renderQuestions(); }
  if (event.target.closest('#next-page')) { page++; renderQuestions(); }
  if (event.target.closest('#clear-selection')) { selected.clear(); saveDraft(); renderQuestions(); renderSelection(); }
  if (event.target.closest('#reset-filters')) {
    group = type = 'all'; search = ''; page = 1;
    document.querySelector('#search-filter').value = '';
    document.querySelector('#group-filter').value = document.querySelector('#type-filter').value = 'all';
    renderQuestions();
  }
  if (event.target.closest('#save-selection') && selected.size) downloadSelection();
});
document.addEventListener('change', event => {
  if (event.target.dataset.question) {
    if (event.target.checked) selected.add(event.target.dataset.question);
    else selected.delete(event.target.dataset.question);
    saveDraft();
    renderSelection();
  }
  if (event.target.id === 'group-filter' || event.target.id === 'type-filter') {
    group = document.querySelector('#group-filter').value;
    type = document.querySelector('#type-filter').value;
    page = 1; renderQuestions();
  }
});
document.querySelector('#search-filter').addEventListener('input', event => { search = event.target.value.trim(); page = 1; renderQuestions(); });
renderQuestions(); renderSelection();
const state = new URLSearchParams(location.search).get('state');
show(['stats', 'records', 'student'].includes(state) ? state : 'prepare');
