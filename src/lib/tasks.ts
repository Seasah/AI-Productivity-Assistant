export type Priority = "high" | "medium" | "low";
const RANK: Record<string, number> = { high: 0, medium: 1, low: 2 };

/** Open tasks first, then earliest due date, then priority, then shortest duration. */
export function sortTasks<T extends { status: string; due_date: string | null; priority: string; duration_minutes: number | null }>(tasks: T[]): T[] {
  return [...tasks].sort((a, b) => {
    const done = Number(a.status === "completed") - Number(b.status === "completed");
    if (done) return done;
    const da = a.due_date ?? "9999-12-31";
    const db = b.due_date ?? "9999-12-31";
    if (da !== db) return da < db ? -1 : 1;
    const p = (RANK[a.priority] ?? 1) - (RANK[b.priority] ?? 1);
    if (p) return p;
    return (a.duration_minutes ?? 9999) - (b.duration_minutes ?? 9999);
  });
}
