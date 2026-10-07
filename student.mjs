import { questions } from './services/question-data.mjs';
import { responseParts } from './services/teaching-session.mjs';
import { escape } from './services/selection-export.mjs';
const root=document.querySelector('#content');
const question=questions.find(q=>q.id===new URLSearchParams(location.search).get('question'));
if(question){
 const response=responseParts(question);
 const options=response.options.map(option=>`<label class="answer-option"><input type="radio" name="response" value="${escape(option.value)}"><span>${option.html}</span></label>`).join('');
 const control=response.kind==='written'?'<label class="field"><span>填写答案</span><textarea name="written-response" rows="4"></textarea></label>':response.kind==='unavailable'?'<p class="notice">选项待核对</p>':`<fieldset class="response"><legend>${response.kind==='judgment'?'选择判断':'选择选项'}</legend>${options}</fieldset>`;
 root.innerHTML=`<div class="heading student-heading"><h1 tabindex="-1">当前题目</h1><span class="state">未开放作答</span></div><article class="question" data-question="${question.id}"><header class="question-header"><span>${escape(question.type)}</span><span class="metadata">${escape(question.groupName)} · 原题 ${question.sourceNumber}</span>${question.needsReview?'<span class="metadata">待核对</span>':''}</header><div class="question-body">${response.stem}</div></article>${control}<div class="student-actions"><p id="choice-state" role="status" aria-live="polite">${response.kind==='written'?'尚未填写':response.kind==='unavailable'?'':'尚未选择'}</p><button class="primary" id="submit" disabled>提交答案</button></div>`;
 root.classList.add('enter');
 root.addEventListener('change',event=>{
  if(event.target.name!=='response')return;
  for(const row of root.querySelectorAll('.answer-option'))row.classList.toggle('selected',row.contains(event.target));
  const state=document.querySelector('#choice-state');state.textContent='已选择 '+event.target.value;
  state.classList.remove('choice-feedback');void state.offsetWidth;state.classList.add('choice-feedback');
 });
 root.addEventListener('input',event=>{
  if(event.target.name==='written-response')document.querySelector('#choice-state').textContent=event.target.value?'已填写':'尚未填写';
 });
}
