import { questions, groups } from "./services/question-data.mjs";
import { GroupStore, importSelection } from "./services/question-groups.mjs";
import { escape } from "./services/selection-export.mjs";

const VERSION =
  "7d59f241b01a852f46a0ea8876f0dcaae25c4c99906ccce371d387ce6029fd5a";
const $ = (s) => document.querySelector(s);
const byId = new Map(questions.map((q) => [q.id, q]));
let storage;
try {
  storage = window.localStorage;
} catch {
  /* Storage can be denied by browser policy. */
}
const bank = new GroupStore(storage, questions, VERSION);
const copy = (value) => ({ ...value, ids: [...value.ids] });
let saved = bank.groups;
const imported = importSelection(storage, questions, VERSION);
let legacyError = !bank.draft && !saved.length && !imported.ok;
let draft = bank.draft
  ? copy(bank.draft)
  : saved.length
    ? copy(saved[saved.length - 1])
    : imported.draft;
const sameAsSaved = () => {
  const group = saved.find((g) => g.id === draft.id);
  return (
    !!group &&
    group.name === draft.name &&
    group.questionVersion === draft.questionVersion &&
    JSON.stringify(group.ids) === JSON.stringify(draft.ids)
  );
};
let dirty = !sameAsSaved(),
  prepared = false,
  pending = null,
  pickerPage = 1;
$("#picker-knowledge").innerHTML =
  '<option value="">全部知识点</option>' +
  groups
    .map((g) => `<option value="${escape(g.id)}">${escape(g.name)}</option>`)
    .join("");
function storeDraft() {
  const result = bank.saveDraft(draft);
  if (!result.ok) $("#notice").textContent = "保存失败，修改已保留，请重试。";
  return result.ok;
}
function markDirty() {
  dirty = !sameAsSaved();
  prepared = false;
  $("#notice").textContent = "";
  storeDraft();
  renderSummary();
  renderGroups();
}
function questionRow(id, index) {
  const q = byId.get(id);
  return `<article class="question" data-question="${id}"><div class="question-head"><span class="sequence">${String(index + 1).padStart(2, "0")}</span><span class="type">${q.type}</span><span>${q.groupName}</span><span>原题 ${q.sourceNumber}</span>${q.needsReview ? '<span class="review">待核对</span>' : ""}</div><div class="question-text">${q.parts[0]}</div>${q.parts.length > 1 ? `<details><summary>查看完整题目</summary><div class="question-text">${q.parts.slice(1).join("")}</div></details>` : ""}<div class="question-foot"><button data-move="up" data-id="${id}" aria-label="上移第${index + 1}题" ${index === 0 ? "disabled" : ""}>↑ 上移</button><button data-move="down" data-id="${id}" aria-label="下移第${index + 1}题" ${index === draft.ids.length - 1 ? "disabled" : ""}>↓ 下移</button><button class="danger" data-remove="${id}" aria-label="移除第${index + 1}题">移除</button></div></article>`;
}
function renderGroups() {
  $("#group-count").textContent = saved.length;
  $("#group-list").innerHTML = saved.length
    ? saved
        .map(
          (g) =>
            `<button data-group="${escape(g.id)}" class="${g.id === draft.id ? "active" : ""}" ${g.id === draft.id ? 'aria-current="true"' : ""}><strong>${escape(g.name)}</strong><small>${g.ids.length} 道题${g.id === draft.id && dirty ? " · 未保存" : ""}</small></button>`,
        )
        .join("")
    : '<div class="empty-groups">尚无选题组</div>';
}
function renderSummary() {
  const selected = draft.ids.map((id) => byId.get(id)).filter(Boolean),
    usable = bank.isUsable(draft) && !legacyError;
  $("#total-count").textContent = draft.ids.length;
  for (const [type, id] of [
    ["单选", "single-count"],
    ["判断", "judge-count"],
    ["填空", "fill-count"],
  ])
    $("#" + id).textContent = selected.filter((q) => q.type === type).length;
  $("#editor-count").textContent = draft.ids.length;
  $("#knowledge-list").innerHTML =
    [...new Set(selected.map((q) => q.groupName))]
      .map((name) => `<li>${escape(name)}</li>`)
      .join("") || "<li>尚未添加题目</li>";
  $("#saved-state").textContent = dirty ? "未保存" : "已保存";
  $("#saved-state").classList.toggle("unsaved", dirty);
  $("#save").disabled = !dirty || !selected.length || !usable || bank.readError;
  $("#prepare").disabled =
    dirty || !selected.length || !usable || bank.readError;
  $("#nav-prepare").disabled = $("#prepare").disabled;
  $("#group-name").disabled = !usable;
  $("#add-question").disabled = !usable;
  $("#prepare").textContent = prepared ? "返回选题编辑" : "准备课堂";
  $("#prepare-state").textContent = prepared ? "待开课" : "未开课";
  $("#prepare-title").textContent = prepared
    ? draft.name || "课堂准备"
    : "课堂准备";
  $("#prepare-description").textContent = prepared
    ? "题目顺序已确认"
    : "选择并保存本次课堂题目";
  $("#open-class").hidden = !prepared;
  $("#nav-groups").setAttribute("aria-current", prepared ? "false" : "page");
  $("#nav-prepare").setAttribute("aria-current", prepared ? "page" : "false");
  $("#page-title").textContent = prepared ? "课堂准备" : "选题组";
  if (!usable || bank.readError || bank.draftError)
    $("#notice").textContent = "选题组读取失败，请重试。";
}
function renderList(changed) {
  if (!bank.isUsable(draft) || legacyError) {
    $("#question-list").innerHTML =
      '<div class="empty-editor"><h3>选题组读取失败，请重试。</h3></div>';
    renderSummary();
    return;
  }
  const openIds = [...document.querySelectorAll(".question details[open]")].map(
    (d) => d.closest("[data-question]").dataset.question,
  );
  $("#question-list").innerHTML = draft.ids.length
    ? draft.ids.map(questionRow).join("")
    : '<div class="empty-editor"><h3>还没有题目</h3><button data-open-picker>添加题目</button></div>';
  for (const id of openIds) {
    const d = $(`[data-question="${id}"] details`);
    if (d) d.open = true;
  }
  if (changed) {
    const row = $(`[data-question="${changed}"]`);
    if (row) row.classList.add("changed");
  }
  renderSummary();
}
function renderAll() {
  $("#group-name").value = draft.name;
  renderGroups();
  renderList();
}
function perform(action) {
  legacyError = false;
  if (action === "new") {
    draft = { id: null, name: "", ids: [], questionVersion: VERSION };
    dirty = true;
  } else {
    const g = saved.find((g) => g.id === action);
    if (!g) return;
    draft = copy(g);
    dirty = false;
  }
  prepared = false;
  $("#notice").textContent = "";
  $("#discard-confirm").hidden = true;
  pending = null;
  storeDraft();
  renderAll();
  $("#group-name").focus();
}
function requestChange(action) {
  if (dirty && (draft.name || draft.ids.length)) {
    pending = action;
    $("#discard-confirm").hidden = false;
    $("#discard-confirm").scrollIntoView({ block: "nearest" });
  } else perform(action);
}
function save() {
  if (!draft.name.trim()) {
    $("#notice").textContent = "请输入选题组名称。";
    $("#group-name").focus();
    return;
  }
  const result = bank.save(draft);
  if (!result.ok) {
    $("#notice").textContent = "保存失败，修改已保留，请重试。";
    return;
  }
  saved = bank.groups;
  draft = copy(result.group);
  dirty = false;
  $("#group-name").value = draft.name;
  const persisted = storeDraft();
  if (persisted) $("#notice").textContent = "已保存选题组";
  renderGroups();
  renderSummary();
}
function prepare() {
  if (dirty || !draft.ids.length) return;
  prepared = !prepared;
  renderSummary();
  $("#prepare-status").classList.add("changed");
}
function openPicker() {
  pickerPage = 1;
  $("#picker-backdrop").hidden = false;
  document.body.style.overflow = "hidden";
  renderPicker();
  $("#picker-search").focus();
}
function closePicker() {
  $("#picker-backdrop").hidden = true;
  document.body.style.overflow = "";
  $("#add-question").focus();
}
function filtered() {
  const term = $("#picker-search").value.trim();
  return questions.filter(
    (q) =>
      (!$("#picker-knowledge").value ||
        q.groupId === $("#picker-knowledge").value) &&
      (!$("#picker-type").value || q.type === $("#picker-type").value) &&
      (!term || q.searchText.includes(term) || q.id.includes(term)),
  );
}
function renderPicker() {
  const result = filtered(),
    pages = Math.max(1, Math.ceil(result.length / 4));
  pickerPage = Math.min(pickerPage, pages);
  $("#picker-results").innerHTML = result.length
    ? result
        .slice((pickerPage - 1) * 4, pickerPage * 4)
        .map(
          (q) =>
            `<article class="picker-row"><div class="question-head"><span class="type">${q.type}</span><span>${q.groupName}</span><span>原题 ${q.sourceNumber}</span>${q.needsReview ? '<span class="review">待核对</span>' : ""}</div><div class="question-text">${q.parts[0]}</div><details class="question"><summary>查看完整题目</summary><div class="question-text">${q.parts.slice(1).join("")}</div></details><div class="question-foot"><button data-add="${q.id}" ${draft.ids.includes(q.id) ? "disabled" : ""}>${draft.ids.includes(q.id) ? "已添加" : "添加到选题组"}</button></div></article>`,
        )
        .join("")
    : '<div class="picker-empty">没有符合条件的题目</div>';
  $("#picker-page").textContent =
    `${result.length} 道题 · ${pickerPage} / ${pages}`;
  $("#picker-prev").disabled = pickerPage === 1;
  $("#picker-next").disabled = pickerPage === pages;
}
$("#group-name").addEventListener("input", (e) => {
  draft.name = e.target.value;
  markDirty();
});
document.addEventListener("click", (e) => {
  const b = e.target.closest("button");
  if (!b || b.disabled) return;
  if (b.dataset.remove) {
    draft.ids = draft.ids.filter((id) => id !== b.dataset.remove);
    markDirty();
    renderList();
    $("#add-question").focus();
  } else if (b.dataset.move) {
    const i = draft.ids.indexOf(b.dataset.id),
      j = i + (b.dataset.move === "up" ? -1 : 1);
    if (j >= 0 && j < draft.ids.length) {
      [draft.ids[i], draft.ids[j]] = [draft.ids[j], draft.ids[i]];
      markDirty();
      renderList(b.dataset.id);
      $(`[data-id="${b.dataset.id}"][data-move="${b.dataset.move}"]`).focus();
    }
  } else if (b.dataset.group) requestChange(b.dataset.group);
  else if (b.hasAttribute("data-open-picker")) openPicker();
  else if (b.dataset.add && !draft.ids.includes(b.dataset.add)) {
    draft.ids.push(b.dataset.add);
    markDirty();
    renderList(b.dataset.add);
    renderPicker();
    const feedback = $(`[data-add="${b.dataset.add}"]`);
    if (feedback) {
      feedback.classList.add("changed");
      feedback.focus();
    }
  }
});
$("#new-group").addEventListener("click", () => requestChange("new"));
$("#discard").addEventListener("click", () => perform(pending));
$("#keep").addEventListener("click", () => {
  $("#discard-confirm").hidden = true;
  pending = null;
});
$("#save").addEventListener("click", save);
$("#prepare").addEventListener("click", prepare);
$("#nav-prepare").addEventListener("click", () => {
  if (!prepared) prepare();
});
$("#nav-groups").addEventListener("click", () => {
  if (prepared) prepare();
});
$("#close-picker").addEventListener("click", closePicker);
$("#picker-prev").addEventListener("click", () => {
  pickerPage--;
  renderPicker();
  $(".picker").scrollTop = 0;
});
$("#picker-next").addEventListener("click", () => {
  pickerPage++;
  renderPicker();
  $(".picker").scrollTop = 0;
});
for (const selector of ["#picker-search", "#picker-knowledge", "#picker-type"])
  $(selector).addEventListener("input", () => {
    pickerPage = 1;
    renderPicker();
  });
$("#picker-backdrop").addEventListener("click", (e) => {
  if (e.target.id === "picker-backdrop") closePicker();
});
document.addEventListener("keydown", (e) => {
  if ($("#picker-backdrop").hidden) return;
  if (e.key === "Escape") {
    closePicker();
    return;
  }
  if (e.key === "Tab") {
    const nodes = [
      ...$(".picker").querySelectorAll(
        "button:not(:disabled),input,select,summary",
      ),
    ].filter((el) => el.getClientRects().length);
    const first = nodes[0],
      last = nodes[nodes.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }
});
renderAll();
Promise.all(
  [...document.images].map((img) => img.decode().catch(() => {})),
).then(() => {
  document.body.classList.add("initial");
  setTimeout(() => document.body.classList.remove("initial"), 650);
});
