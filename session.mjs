import { questions } from './services/question-data.mjs';
import { loadPrepared, normalizeIndex } from './services/teaching-session.mjs';
import { escape } from './services/selection-export.mjs';
const VERSION='7d59f241b01a852f46a0ea8876f0dcaae25c4c99906ccce371d387ce6029fd5a';
let storage;
try { storage=window.localStorage; } catch { /* Read failure is rendered below. */ }
const prepared=loadPrepared(storage,questions,VERSION);
const root=document.querySelector('#content');
let current=0;
const card=(q)=>`<article class="question" data-question="${q.id}"><header class="question-header"><span class="sequence">${String(current+1).padStart(2,'0')}</span><span>${escape(q.type)}</span><span class="metadata">${escape(q.groupName)} · 原题 ${q.sourceNumber}</span>${q.needsReview?'<span class="metadata">待核对</span>':''}<span class="metadata">未发布</span></header><div class="question-body">${q.parts.join('')}</div></article>`;
function show(focus=false) {
 const [requested,index]=location.hash.slice(1).split('/');
 const view=['reading','entry','statistics'].includes(requested)?requested:'reading';
 current=normalizeIndex(index,prepared.questions?.length ?? 0);
 for(const button of document.querySelectorAll('#teacher-nav button'))button.setAttribute('aria-current',button.dataset.view===view?'page':'false');
 if(!prepared.ok){
  root.innerHTML=`<div class="empty"><h1 tabindex="-1">授课</h1><p>${prepared.reason==='read'?'课堂题目组读取失败，请重试。':'还没有可用的课堂题目组'}</p><a class="link" href="workspace.html#prepare">返回课堂准备 →</a></div>`;
 }else if(view==='reading'){
  const q=prepared.questions[current];
  const details=[prepared.lesson.name,prepared.lesson.date,prepared.group.name].filter(Boolean).map(escape).join(' · ');
  root.innerHTML=`<a class="link" href="workspace.html#prepare">← 课堂准备</a><div class="heading"><div><h1 tabindex="-1">授课</h1><p>${details}</p></div><span class="state">未开课</span></div>${card(q)}<div class="reading-actions"><button data-browse="-1" ${current===0?'disabled':''}>← 上一题</button><span><b class="count">${String(current+1).padStart(2,'0')}</b> / ${String(prepared.questions.length).padStart(2,'0')}</span><button data-browse="1" ${current===prepared.questions.length-1?'disabled':''}>下一题 →</button></div><div class="secondary-actions"><button class="primary" disabled>发布本题</button><a class="link" href="student.html?question=${encodeURIComponent(q.id)}">查看学生界面 →</a></div>`;
 }else if(view==='entry'){
  root.innerHTML='<div class="heading"><h1 tabindex="-1">课堂入口</h1></div><div class="empty"><h2>课堂尚未开启</h2><button class="primary" disabled>生成课堂入口</button></div>';
 }else {
  root.innerHTML=`<div class="heading"><h1 tabindex="-1">本题统计</h1><span>第 <b class="count">${String(current+1).padStart(2,'0')}</b> 题</span></div><div class="empty"><h2>暂无已提交答卷</h2><p>正确率 —</p></div><div class="secondary-actions"><button disabled>导出错题 PDF</button></div>`;
 }
 root.classList.remove('enter');void root.offsetWidth;root.classList.add('enter');
 if(location.hash!==`#${view}/${current}`)history.replaceState(null,'',`#${view}/${current}`);
 window.scrollTo(0,0);
 if(focus)root.querySelector('h1')?.focus({preventScroll:true});
}
function go(view,index=current){history.pushState(null,'',`#${view}/${index}`);show(true);}
document.addEventListener('click',event=>{
 const button=event.target.closest('button');if(!button||button.disabled)return;
 if(button.dataset.view)go(button.dataset.view);
 if(button.dataset.browse && prepared.ok){
  const next=current+Number(button.dataset.browse);
  if(next>=0&&next<prepared.questions.length)go('reading',next);
 }
});
window.addEventListener('popstate',()=>show(true));
window.addEventListener('hashchange',()=>show(true));
show();
