import { DemoClassroom } from "./services/demo-classroom.mjs";
import { demoQuestions } from "./services/demo-data.mjs";

const service = new DemoClassroom(demoQuestions);
const workspace = document.querySelector("#workspace");
let selected = new Set(demoQuestions.map((q) => q.id));
let group = "全部";
let type = "全部";
let view = "prepare";
let browserSubmitted = false;
let noticeTimer;
const escape = (value) =>
  String(value).replace(
    /[&<>"']/g,
    (character) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        character
      ],
  );
const questionById = (id) => demoQuestions.find((q) => q.id === id);


function toast(message) {
  clearTimeout(noticeTimer);
  const notice = document.querySelector("#notice");
  notice.textContent = message;
  notice.classList.add("show");
  noticeTimer = setTimeout(() => notice.classList.remove("show"), 4500);
}

function renderPrepare() {
  const options = (items, current) => items.map(item => `<option ${current === item ? "selected" : ""}>${escape(item)}</option>`).join("");
  return `<div class="page-heading"><div><p class="eyebrow">钢筋混凝土梁</p><h1>课前选题</h1><p>按知识点和题型选择本次课堂的题目。</p></div></div><section class="prepare-layout" aria-label="选题工作区"><div><div class="filter-row"><label for="group-filter">知识点<select id="group-filter">${options(["全部", ...new Set(demoQuestions.map(q => q.group))], group)}</select></label><label for="type-filter">题型<select id="type-filter">${options(["全部", ...new Set(demoQuestions.map(q => q.type))], type)}</select></label></div><div class="list-heading"><h2>题目列表</h2></div><div class="question-list" id="question-list">${renderQuestions()}</div></div><aside class="selection-column" aria-label="已选题目"><div class="selection-top"><h2>本次课堂选题</h2><span id="selected-count">${selected.size}</span></div><ol class="selected-items" id="selected-items">${renderSelected()}</ol><button class="primary-button full" id="start-round" type="button" ${selected.size ? "" : "disabled"}>预览这组课堂 →</button><p class="selection-help">查看这组题目的统计与学生答题界面。</p><div class="review-note"><h3>题库整理</h3><p>真实题库 PDF 私下交付。</p></div></aside></section>`;
}

function renderQuestions() {
  return service
    .listQuestions(group, type)
    .map(
      (q) =>
        `<article class="question-card"><input type="checkbox" id="select-${q.id}" data-question="${q.id}" ${selected.has(q.id) ? "checked" : ""}><div><div class="question-meta"><span>${q.id}</span><span>${escape(q.group)}</span><span>${escape(q.type)}</span><span>演示</span></div><label for="select-${q.id}">${escape(q.title)}</label><p class="question-stem">${escape(q.stem)}</p></div></article>`,
    )
    .join("") || '<p class="empty-state">该知识点下没有这一题型。请调整筛选条件，已选题目会保留。</p>';
}

function renderSelected() {
  return selected.size
    ? [...selected]
        .map(
          (id, index) =>
            `<li><span class="number">${String(index + 1).padStart(2, "0")}</span><span>${escape(questionById(id).title)}</span></li>`,
        )
        .join("")
    : "<li>还没有选题，请勾选左侧的示例题。</li>";
}

function ensureRound() {
  if (!service.currentRound) {
    service.createRound([...selected]);
    browserSubmitted = false;
  }
}

function renderStats() {
  ensureRound();
  const report = service.report(service.currentRound.id);
  return `<div class="page-heading"><div><div class="eyebrow">钢筋混凝土梁</div><h1>课堂统计</h1><p>选项分布帮助老师判断，哪个环节值得再讲一次。</p></div><button type="button" class="secondary-button" id="load-sample">加载 48 份示例答卷</button></div><div class="inline-notice">这是本浏览器的统计演示。示例答卷为程序生成，无真实学生、成绩或跨设备同步；这些示例题不设正确答案。</div><section class="metric-grid" aria-label="统计概览"><div class="metric"><div class="metric-label">演示提交</div><div class="metric-value">${report.submissions}<small>份</small></div><p>提交份数，不代表到课人数</p></div><div class="metric"><div class="metric-label">本组题目</div><div class="metric-value">${report.questions.length}<small>道</small></div><p>当前选择的界面示例题</p></div><div class="metric"><div class="metric-label">答题方式</div><div class="metric-value" style="font-family:inherit;font-size:26px">匿名</div><p>演示无需姓名或学号</p></div></section>${report.submissions ? "" : '<div class="empty-state">还没有演示答卷<p>点击“加载 48 份示例答卷”，或切换学生视角完成一次本页提交。</p></div>'}<section class="stats-list" aria-label="选项分布">${report.questions
    .map((result) => {
      const question = questionById(result.id);
      return `<article class="stats-card"><div><small>${question.id} · ${escape(question.group)}</small><h3>${escape(question.title)}</h3><p>${escape(question.stem)}</p><small>统计分母：${result.responses} 份已提交演示答卷</small></div><div class="bar-list">${result.options.map((option) => `<div class="bar-row"><span class="bar-label">${option.id}. ${escape(question.options.find((item) => item.id === option.id).text)}</span><div class="bar-track" aria-hidden="true"><div class="bar-fill" style="width:${option.percent ?? 0}%"></div></div><span class="bar-value">${option.count} 份 · ${option.percent === null ? "—" : option.percent + "%"}</span></div>`).join("")}</div></article>`;
    })
    .join(
      "",
    )}</section><div class="bottom-note"><strong>正式课堂的下一步</strong><span>接入学校服务器后，完善扫码加入、收答截止、统计更新与错题 PDF。当前预览只用于确认界面和操作顺序。</span></div>`;
}

function renderStudent() {
  ensureRound();
  const questions = service.currentRound.questionIds.map(questionById);
  return `<div class="page-heading"><div><div class="eyebrow">钢筋混凝土梁 / 学生视角</div><h1>学生答题</h1><p>老师可以在这里体验同学手机上的答题流程。</p></div></div><div class="student-layout"><section class="student-sheet"><div class="student-sheet-header"><small>课堂答题</small><h2>钢筋混凝土梁</h2><p>课堂示例 · 共 ${questions.length} 题 · 无需姓名学号</p></div><div class="student-form">${browserSubmitted ? `<div class="success-box"><div class="success-icon" aria-hidden="true">✓</div><h3>本页演示提交成功</h3><p>你可以回到课堂统计，查看这次选择的分布。<br>记录仅在这个浏览器页面中有效。</p><button type="button" class="secondary-button" data-view="stats">查看演示统计 →</button></div>` : `<form id="answer-form">${questions.map((q, index) => `<fieldset><legend>${index + 1}. ${escape(q.stem)}</legend>${q.options.map((option) => `<label class="answer-option"><input type="radio" name="${q.id}" value="${option.id}" required><span>${option.id}. ${escape(option.text)}</span></label>`).join("")}</fieldset>`).join("")}<p id="form-error" class="form-error" role="alert"></p><button type="submit" class="primary-button full">提交本页演示答卷<span aria-hidden="true">→</span></button></form>`}</div></section><aside class="student-notes"><h2>答题说明</h2><ol><li>选择选项即可作答，不收集姓名、学号或联系方式。</li><li>提交后明确确认，避免重复点击与不确定等待。</li><li>正式课堂将通过二维码进入；此版本在本页演示，不连接其他设备。</li></ol><div class="review-note"><div><h3>教师评审提示</h3><p>本页只展示答题样式。现成题库按知识点和题型分类，题目 PDF 单独交付。</p></div></div></aside></div>`;
}

function render({ focus = false } = {}) {
  document.querySelectorAll(".primary-nav [data-view]").forEach((button) => {
    if (button.dataset.view === view)
      button.setAttribute("aria-current", "page");
    else button.removeAttribute("aria-current");
  });
  workspace.innerHTML =
    view === "prepare"
      ? renderPrepare()
      : view === "stats"
        ? renderStats()
        : renderStudent();
  if (focus) {
    workspace.focus({ preventScroll: true });
    window.scrollTo({ top: 0 });
  }
}

document.addEventListener("click", (event) => {
  const navigation = event.target.closest("[data-view]");
  if (navigation) {
    if (
      !selected.size &&
      !service.currentRound &&
      navigation.dataset.view !== "prepare"
    )
      return toast("请先选择至少一道示例题。");
    view = navigation.dataset.view;
    render({ focus: true });
  }
  if (event.target.closest("#start-round")) {
    service.createRound([...selected]);
    browserSubmitted = false;
    view = "stats";
    render({ focus: true });
    toast("本浏览器的演示课堂已准备好，可以查看统计或学生视角。");
  }
  if (event.target.closest("#load-sample")) {
    service.loadSample(service.currentRound.id);
    render();
    toast("已加载程序生成的示例答卷。重复加载不会重复计数。");
  }
  if (event.target.closest("#reset-demo")) {
    selected = new Set(demoQuestions.map((q) => q.id));
    group = "全部";
    type = "全部";
    service.createRound([...selected]);
    browserSubmitted = false;
    view = "prepare";
    render({ focus: true });
    toast("本页演示已重置。");
  }
});

document.addEventListener("change", (event) => {
  if (["group-filter", "type-filter"].includes(event.target.id)) {
    if (event.target.id === "group-filter") group = event.target.value;
    else type = event.target.value;
    document.querySelector("#question-list").innerHTML = renderQuestions();
  }
  const id = event.target.dataset.question;
  if (id) {
    if (event.target.checked) selected.add(id);
    else selected.delete(id);
    document.querySelector("#selected-count").textContent = selected.size;
    document.querySelector("#selected-items").innerHTML = renderSelected();
    document.querySelector("#start-round").disabled = !selected.size;
  }
});

document.addEventListener("submit", (event) => {
  if (event.target.id !== "answer-form") return;
  event.preventDefault();
  const answers = Object.fromEntries(new FormData(event.target));
  try {
    service.submit(service.currentRound.id, "this-browser", answers);
    browserSubmitted = true;
    render({ focus: true });
  } catch (error) {
    document.querySelector("#form-error").textContent = error.message;
  }
});

render();
