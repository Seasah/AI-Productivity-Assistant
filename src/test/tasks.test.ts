import { describe, expect, it } from "vitest";
import { sortTasks } from "@/lib/tasks";

const t = (title: string, o: Partial<{ status: string; due_date: string | null; priority: string; duration_minutes: number | null }>) => ({
  title, status: "pending", due_date: null, priority: "medium", duration_minutes: null, ...o,
});

describe("sortTasks", () => {
  it("puts completed tasks last", () => {
    expect(sortTasks([t("a", { status: "completed", due_date: "2026-01-01" }), t("b", {})]).map((x) => x.title)).toEqual(["b", "a"]);
  });
  it("orders by earliest due date first", () => {
    expect(sortTasks([t("late", { due_date: "2026-05-02" }), t("soon", { due_date: "2026-05-01" })]).map((x) => x.title)).toEqual(["soon", "late"]);
  });
  it("on the same date, high priority comes before low", () => {
    expect(sortTasks([t("low", { due_date: "2026-05-01", priority: "low" }), t("high", { due_date: "2026-05-01", priority: "high" })]).map((x) => x.title)).toEqual(["high", "low"]);
  });
});
