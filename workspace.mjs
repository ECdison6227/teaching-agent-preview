import { questions, groups } from "./services/question-data.mjs";
import { GroupStore, importSelection } from "./services/question-groups.mjs";
import {
  PreparationStore,
  resolvePreparation,
} from "./services/classroom-preparation.mjs";
import { escape } from "./services/selection-export.mjs";

const VERSION =
  "7d59f241b01a852f46a0ea8876f0dcaae25c4c99906ccce371d387ce6029fd5a";
const $ = (s) => document.querySelector(s);
const byId = new Map(questions.map((q) => [q.id, q]));
let storage;
try {
  storage = window.localStorage;
} catch {
  /* Browser policy can deny storage. */
}
const bank = new GroupStore(storage, questions, VERSION);
const preparation = new PreparationStore(storage);
const copy = (value) => ({ ...value, ids: [...value.ids] });
const imported = importSelection(storage, questions, VERSION);
let legacyError = !bank.draft && !bank.groups.length && !imported.ok;
let draft = bank.draft
  ? copy(bank.draft)
  : bank.groups.length
    ? copy(bank.groups.at(-1))
    : imported.draft;
const today = new Date();
let lesson = preparation.current
  ? { ...preparation.current }
  : {
      name: "",
      date: [
        today.getFullYear(),
        String(today.getMonth() + 1).padStart(2, "0"),
        String(today.getDate()).padStart(2, "0"),
      ].join("-"),
      groupId: null,
    };
let pending = null,
  bankPage = 1;
const sameAsSaved = () => {
  const saved = bank.groups.find((g) => g.id === draft.id);
  return (
    !!saved &&
    saved.name === draft.name &&
    saved.questionVersion === draft.questionVersion &&
    JSON.stringify(saved.ids) === JSON.stringify(draft.ids)
  );
};
const editingUsable = () =>
  !bank.readError && !bank.draftError && !legacyError && bank.isUsable(draft);
$("#knowledge").innerHTML =
  '<option value="">全部知识点</option>' +
  groups
    .map((g) => `<option value="${escape(g.id)}">${escape(g.name)}</option>`)
    .join("");

function persistDraft() {
  const result = bank.saveDraft(draft);
  if (!result.ok)
    $("#save-notice").textContent = "保存失败，修改已保留，请重试。";
  $("#bank-notice").textContent = result.ok
    ? ""
    : "保存失败，修改已保留，请重试。";
  return result.ok;
}
function changed() {
  $("#save-notice").textContent = "";
  persistDraft();
  renderEditorState();
}
function questionCard(id, index, mode = "read") {
  const q = byId.get(id);
  let actions = "";
  if (mode === "edit")
    actions = `<div class="question-actions"><button data-move="up" data-id="${id}" aria-label="上移第${index + 1}题" ${index === 0 ? "disabled" : ""}>↑ 上移</button><button data-move="down" data-id="${id}" aria-label="下移第${index + 1}题" ${index === draft.ids.length - 1 ? "disabled" : ""}>↓ 下移</button><button class="danger" data-remove="${id}" aria-label="移除第${index + 1}题">移除</button></div>`;
  if (mode === "bank")
    actions = `<div class="question-actions"><button class="primary" data-add="${id}" ${draft.ids.includes(id) ? "disabled" : ""}>${draft.ids.includes(id) ? "已在本组" : "添加到本组"}</button></div>`;
  return `<article class="question" data-question="${id}"><div class="question-header">${mode === "bank" ? "" : `<span class="sequence">${String(index + 1).padStart(2, "0")}</span>`}<span>${escape(q.type)}</span><span class="metadata">${escape(q.groupName)}</span><span class="metadata">原题 ${q.sourceNumber}</span>${q.needsReview ? '<span class="metadata">待核对</span>' : ""}</div><div class="question-body">${q.parts.join("")}</div>${actions}</article>`;
}
function renderGroups() {
  $("#library-notice").textContent = bank.readError || bank.draftError
    ? "选题组读取失败，请重试。"
    : "";
  $("#new-group").disabled = bank.readError || bank.draftError;
  $("#group-list").innerHTML = bank.groups.length
    ? bank.groups
        .map(
          (g) =>
            `<article class="group-card"><div><h2 class="group-name">${escape(g.name)}</h2><p><b class="count">${g.ids.length}</b> 道题</p></div><div class="actions"><button data-edit="${escape(g.id)}">编辑题目组</button><button class="primary" data-use="${escape(g.id)}" ${bank.readError || !bank.isUsable(g) ? "disabled" : ""}>用于课堂</button></div></article>`,
        )
        .join("")
    : '<div class="empty">还没有题目组</div>';
}
function renderEditorState() {
  $("#edit-count").textContent = draft.ids.length;
  $("#save-state").textContent = sameAsSaved() ? "已保存" : "未保存";
  $("#save-state").classList.toggle("count", !sameAsSaved());
  $("#save-group").disabled =
    !editingUsable() || sameAsSaved() || !draft.ids.length;
  $("#group-name").disabled = !editingUsable();
  $("#add-question").disabled = !editingUsable();
  if (!editingUsable())
    $("#save-notice").textContent = "选题组读取失败，请重试。";
}
function renderEditor(changedId) {
  $("#group-name").value = draft.name;
  $("#question-list").innerHTML = !editingUsable()
    ? '<div class="empty">选题组读取失败，请重试。</div>'
    : draft.ids.length
      ? draft.ids.map((id, i) => questionCard(id, i, "edit")).join("")
      : '<div class="empty">还没有题目</div>';
  if (changedId)
    $(`#question-list [data-question="${changedId}"]`)?.classList.add(
      "changed",
    );
  renderEditorState();
}
function filtered() {
  const term = $("#search").value.trim();
  return questions.filter(
    (q) =>
      (!$("#knowledge").value || q.groupId === $("#knowledge").value) &&
      (!$("#type").value || q.type === $("#type").value) &&
      (!term || q.searchText.includes(term) || q.id.includes(term)),
  );
}
function renderBank() {
  const result = filtered(),
    pages = Math.max(1, Math.ceil(result.length / 3));
  bankPage = Math.min(bankPage, pages);
  $("#bank-group-name").textContent = draft.name || "未命名题目组";
  $("#bank-selected").textContent = draft.ids.length;
  $("#result-count").textContent = `${result.length} 道题`;
  $("#bank-results").innerHTML = result.length
    ? result
        .slice((bankPage - 1) * 3, bankPage * 3)
        .map((q, i) => questionCard(q.id, i, "bank"))
        .join("")
    : '<div class="empty">没有符合条件的题目</div>';
  $("#page-count").textContent = `${bankPage} / ${pages}`;
  $("#previous").disabled = bankPage === 1;
  $("#next").disabled = bankPage === pages;
}
function renderLessonSummary() {
  const group = resolvePreparation(lesson, bank);
  $("#lesson-summary").hidden = !group;
  $("#view-questions").hidden = !group;
  $("#lesson-summary").innerHTML = group
    ? `<p><strong>${escape(group.name)}</strong></p><b class="count">${group.ids.length}</b> 道题`
    : "";
  $("#start-class").disabled = true;
  if (preparation.readError)
    $("#lesson-notice").textContent = "课堂准备读取失败，请重试。";
  else if (lesson.groupId && !group)
    $("#lesson-notice").textContent = "选题组读取失败，请重试。";
}
function renderPreparation() {
  $("#lesson-name").value = lesson.name;
  $("#lesson-date").value = lesson.date;
  const usable = bank.readError
    ? []
    : bank.groups.filter((g) => bank.isUsable(g));
  let options =
    '<option value="">请选择题目组</option>' +
    usable
      .map((g) => `<option value="${escape(g.id)}">${escape(g.name)}</option>`)
      .join("");
  if (lesson.groupId && !usable.some((g) => g.id === lesson.groupId))
    options += `<option value="${escape(lesson.groupId)}" disabled>选题组读取失败，请重试。</option>`;
  $("#lesson-group").innerHTML = options;
  $("#lesson-group").value = lesson.groupId || "";
  renderLessonSummary();
}
function persistLesson() {
  $("#lesson-notice").textContent = "";
  if (!preparation.save(lesson).ok)
    $("#lesson-notice").textContent = "保存失败，修改已保留，请重试。";
  renderLessonSummary();
}
function renderReview() {
  const group = resolvePreparation(lesson, bank);
  if (!group) return false;
  $("#review-summary").innerHTML =
    `<strong>${escape(group.name)}</strong><span><b class="count">${group.ids.length}</b> 道题</span>${preparation.readError ? "" : '<a class="link" href="session.html">逐题查看 →</a>'}`;
  $("#review-questions").innerHTML = group.ids
    .map((id, i) => questionCard(id, i))
    .join("");
  return true;
}
const views = new Set(["groups", "edit", "bank", "prepare", "review"]);
function show(view, focus = true) {
  if (!views.has(view)) view = "groups";
  if (view === "bank" && !editingUsable()) view = "edit";
  if (view === "review" && !renderReview()) view = "prepare";
  for (const section of document.querySelectorAll(".page")) {
    section.hidden = section.id !== `page-${view}`;
    section.classList.remove("enter");
  }
  const page = $(`#page-${view}`);
  void page.offsetWidth;
  page.classList.add("enter");
  $("#nav-groups").setAttribute(
    "aria-current",
    view === "prepare" || view === "review" ? "false" : "page",
  );
  $("#nav-prepare").setAttribute(
    "aria-current",
    view === "prepare" || view === "review" ? "page" : "false",
  );
  if (view === "groups") renderGroups();
  else if (view === "edit") renderEditor();
  else if (view === "bank") renderBank();
  else if (view === "prepare") renderPreparation();
  if (location.hash !== `#${view}`) history.replaceState(null, "", `#${view}`);
  window.scrollTo(0, 0);
  if (focus) page.querySelector("h1").focus({ preventScroll: true });
}
function go(view) {
  if (location.hash !== `#${view}`) history.pushState(null, "", `#${view}`);
  show(view);
}
function perform(action) {
  const selected = bank.groups.find((g) => g.id === action);
  if (action !== "new" && !selected) return;
  draft =
    action === "new"
      ? { id: null, name: "", ids: [], questionVersion: VERSION }
      : copy(selected);
  legacyError = false;
  pending = null;
  $("#discard-confirm").hidden = true;
  $("#save-notice").textContent = "";
  persistDraft();
  go("edit");
  $("#group-name").focus();
}
function requestChange(action) {
  if (action === draft.id) {
    go("edit");
    return;
  }
  if (!sameAsSaved() && (draft.name || draft.ids.length)) {
    pending = action;
    go("edit");
    $("#discard-confirm").hidden = false;
    $("#keep").focus();
  } else perform(action);
}
function saveGroup() {
  if (!editingUsable()) return;
  if (!draft.name.trim()) {
    $("#save-notice").textContent = "请输入题目组名称。";
    $("#group-name").focus();
    return;
  }
  const result = bank.save(draft);
  if (!result.ok) {
    $("#save-notice").textContent = "保存失败，修改已保留，请重试。";
    return;
  }
  draft = copy(result.group);
  $("#group-name").value = draft.name;
  if (persistDraft()) $("#save-notice").textContent = "已保存题目组";
  renderEditorState();
}
document.addEventListener("click", (e) => {
  const b = e.target.closest("button");
  if (!b || b.disabled) return;
  if (b.dataset.go) {
    go(b.dataset.go);
    return;
  }
  if (b.dataset.edit) {
    requestChange(b.dataset.edit);
    return;
  }
  if (b.dataset.use) {
    lesson.groupId = b.dataset.use;
    persistLesson();
    go("prepare");
    return;
  }
  if (!editingUsable()) return;
  if (b.dataset.add && !draft.ids.includes(b.dataset.add)) {
    draft.ids.push(b.dataset.add);
    changed();
    renderBank();
    $(`#bank-results [data-question="${b.dataset.add}"]`)?.classList.add(
      "changed",
    );
  } else if (b.dataset.remove) {
    draft.ids = draft.ids.filter((id) => id !== b.dataset.remove);
    changed();
    renderEditor();
    $("#add-question").focus();
  } else if (b.dataset.move) {
    const i = draft.ids.indexOf(b.dataset.id),
      j = i + (b.dataset.move === "up" ? -1 : 1);
    if (i < 0 || j < 0 || j >= draft.ids.length) return;
    [draft.ids[i], draft.ids[j]] = [draft.ids[j], draft.ids[i]];
    changed();
    renderEditor(b.dataset.id);
    const next = $(
      `[data-id="${b.dataset.id}"][data-move="${b.dataset.move}"]`,
    );
    if (next && !next.disabled) next.focus();
  }
});
$("#group-name").addEventListener("input", (e) => {
  if (editingUsable()) {
    draft.name = e.target.value;
    changed();
  }
});
$("#new-group").addEventListener("click", () => requestChange("new"));
$("#save-group").addEventListener("click", saveGroup);
$("#keep").addEventListener("click", () => {
  $("#discard-confirm").hidden = true;
  pending = null;
  $("#group-name").focus();
});
$("#discard").addEventListener("click", () => perform(pending));
for (const selector of ["#search", "#knowledge", "#type"])
  $(selector).addEventListener("input", () => {
    bankPage = 1;
    renderBank();
  });
for (const [selector, delta] of [
  ["#previous", -1],
  ["#next", 1],
])
  $(selector).addEventListener("click", () => {
    bankPage += delta;
    renderBank();
    $("#result-count").scrollIntoView({ block: "start" });
  });
for (const [selector, key] of [
  ["#lesson-name", "name"],
  ["#lesson-date", "date"],
])
  $(selector).addEventListener("input", (e) => {
    lesson[key] = e.target.value;
    persistLesson();
  });
$("#lesson-group").addEventListener("change", (e) => {
  lesson.groupId = e.target.value || null;
  persistLesson();
});
$("#view-questions").addEventListener("click", () => {
  if (resolvePreparation(lesson, bank)) go("review");
});
window.addEventListener("popstate", () => show(location.hash.slice(1)));
window.addEventListener("hashchange", () => show(location.hash.slice(1)));
const initial = location.hash.slice(1);
show(
  views.has(initial)
    ? initial
    : !sameAsSaved() && (draft.name || draft.ids.length || legacyError)
      ? "edit"
      : "groups",
  false,
);
