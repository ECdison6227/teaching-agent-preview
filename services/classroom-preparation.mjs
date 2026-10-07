export const PREPARATION_KEY = "seu-teacher-classroom-preparation-v1";
const copy = (value) => ({
  name: value.name,
  date: value.date,
  groupId: value.groupId,
});
function validDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const leap = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  return (
    year >= 1 &&
    month >= 1 &&
    month <= 12 &&
    day >= 1 &&
    day <=
      [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month - 1]
  );
}
const valid = (value) =>
  value &&
  typeof value.name === "string" &&
  value.name.length <= 60 &&
  typeof value.date === "string" &&
  (value.date === "" || validDate(value.date)) &&
  (value.groupId === null ||
    (typeof value.groupId === "string" && !!value.groupId));

export class PreparationStore {
  constructor(storage) {
    this.storage = storage;
    this.current = null;
    this.readError = false;
    this.raw = null;
    try {
      this.raw = storage?.getItem(PREPARATION_KEY) ?? null;
      if (this.raw !== null) {
        const value = JSON.parse(this.raw);
        if (value.schema !== 1 || !valid(value.preparation))
          throw Error("Invalid preparation");
        this.current = copy(value.preparation);
      }
    } catch {
      this.readError = true;
    }
  }
  save(value) {
    if (this.readError) return { ok: false, reason: "read" };
    if (!valid(value)) return { ok: false, reason: "invalid" };
    const preparation = copy(value);
    try {
      if (!this.storage || this.storage.getItem(PREPARATION_KEY) !== this.raw)
        return { ok: false, reason: "conflict" };
      const raw = JSON.stringify({ schema: 1, preparation });
      this.storage.setItem(PREPARATION_KEY, raw);
      if (this.storage.getItem(PREPARATION_KEY) !== raw)
        return { ok: false, reason: "storage" };
      this.raw = raw;
      this.current = preparation;
      return { ok: true };
    } catch {
      return { ok: false, reason: "storage" };
    }
  }
}
export function resolvePreparation(value, bank) {
  if (!valid(value) || bank.readError) return null;
  const group = bank.groups.find((g) => g.id === value.groupId);
  return group && group.ids.length && bank.isUsable(group)
    ? { ...group, ids: [...group.ids] }
    : null;
}
