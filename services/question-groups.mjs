export const GROUPS_KEY = "seu-teacher-groups-v1";
export const DRAFT_KEY = "seu-teacher-group-draft-v1";
const clone = (value) => JSON.parse(JSON.stringify(value));
export function importSelection(storage, questions, version) {
  const draft = { id: null, name: "", ids: [], questionVersion: version };
  try {
    const raw = storage?.getItem("seu-teacher-selection-v1");
    if (raw === null || raw === undefined) return { ok: true, draft };
    const ids = JSON.parse(raw);
    if (!Array.isArray(ids)) return { ok: false, draft };
    draft.ids = [...ids];
    const known = new Set(questions.map((q) => q.id));
    return {
      ok:
        ids.every((id) => typeof id === "string" && known.has(id)) &&
        new Set(ids).size === ids.length,
      draft,
    };
  } catch {
    return { ok: false, draft };
  }
}
const structured = (value) =>
  value &&
  typeof value.name === "string" &&
  value.name.length <= 60 &&
  (value.id === null || typeof value.id === "string") &&
  Array.isArray(value.ids) &&
  value.ids.every((id) => typeof id === "string") &&
  new Set(value.ids).size === value.ids.length &&
  typeof value.questionVersion === "string";

export class GroupStore {
  constructor(storage, questions, version) {
    this.storage = storage;
    this.known = new Set(questions.map((q) => q.id));
    this.version = version;
    this.groups = [];
    this.draft = null;
    this.readError = false;
    this.draftError = false;
    try {
      this.groupRaw = storage?.getItem(GROUPS_KEY) ?? null;
      if (this.groupRaw !== null) {
        const value = JSON.parse(this.groupRaw);
        if (
          value.schema !== 1 ||
          !Array.isArray(value.groups) ||
          value.groups.some(
            (g) => !structured(g) || !g.id || !g.name.trim() || !g.ids.length,
          ) ||
          new Set(value.groups.map((g) => g.id)).size !== value.groups.length
        )
          throw Error("Invalid library");
        this.groups = value.groups;
      }
    } catch {
      this.readError = true;
    }
    try {
      this.draftRaw = storage?.getItem(DRAFT_KEY) ?? null;
      if (this.draftRaw !== null) {
        const value = JSON.parse(this.draftRaw);
        if (value.schema !== 1 || !structured(value.draft))
          throw Error("Invalid draft");
        this.draft = value.draft;
      }
    } catch {
      this.draftError = true;
    }
  }
  isUsable(value) {
    return (
      structured(value) &&
      value.questionVersion === this.version &&
      value.ids.every((id) => this.known.has(id))
    );
  }
  write(key, value, expected) {
    try {
      if (!this.storage || this.storage.getItem(key) !== expected)
        return { ok: false, reason: "conflict" };
      const raw = JSON.stringify(value);
      this.storage.setItem(key, raw);
      if (this.storage.getItem(key) !== raw)
        return { ok: false, reason: "storage" };
      return { ok: true, raw };
    } catch {
      return { ok: false, reason: "storage" };
    }
  }
  normalize(value) {
    if (!value || !Array.isArray(value.ids)) return null;
    const result = {
      ...value,
      ids: [...value.ids],
      questionVersion: value.questionVersion ?? this.version,
    };
    return structured(result) ? result : null;
  }
  save(value) {
    if (this.readError) return { ok: false, reason: "read" };
    const input = this.normalize(value);
    if (!input) return { ok: false, reason: "invalid" };
    const name = input.name.trim();
    if (!this.isUsable(input) || !name || name.length > 60 || !input.ids.length)
      return { ok: false, reason: "invalid" };
    const old = this.groups.find((g) => g.id === input.id);
    if (input.id && !old) return { ok: false, reason: "invalid" };
    const now = new Date().toISOString();
    const group = {
      id: old?.id ?? globalThis.crypto.randomUUID(),
      name,
      ids: [...input.ids],
      questionVersion: input.questionVersion,
      createdAt: old?.createdAt ?? now,
      updatedAt: now,
    };
    const next = old
      ? this.groups.map((g) => (g.id === group.id ? group : g))
      : [...this.groups, group];
    const result = this.write(
      GROUPS_KEY,
      { schema: 1, groups: next },
      this.groupRaw,
    );
    if (!result.ok) return result;
    this.groupRaw = result.raw;
    this.groups = next;
    return { ok: true, group: clone(group) };
  }
  saveDraft(value) {
    if (this.draftError) return { ok: false, reason: "read" };
    const draft = this.normalize(value);
    if (!structured(draft)) return { ok: false, reason: "invalid" };
    const result = this.write(DRAFT_KEY, { schema: 1, draft }, this.draftRaw);
    if (!result.ok) return result;
    this.draftRaw = result.raw;
    this.draft = clone(draft);
    return { ok: true };
  }
}
