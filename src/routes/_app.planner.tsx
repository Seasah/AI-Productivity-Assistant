import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Check, Wand2, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { MessageResponse } from "@/components/ai-elements/message";
import { AiDisclaimer, PageHeader } from "@/components/app/common";
import { useGenerate } from "@/lib/ai";
import { sortTasks, type Priority } from "@/lib/tasks";

export const Route = createFileRoute("/_app/planner")({
  head: () => ({
    meta: [
      { title: "Task Planner — Malibongwe Poultries" },
      { name: "description", content: "Plan daily and weekly farm and admin tasks with AI suggestions." },
      { property: "og:title", content: "Task Planner — Malibongwe Poultries" },
      { property: "og:description", content: "Plan daily and weekly tasks." },
    ],
  }),
  component: PlannerPage,
});

type Task = Tables<"tasks">;
const blank = { title: "", description: "", priority: "medium", status: "pending", due_date: "", duration_minutes: "" };
const PRIO_CLASS: Record<string, string> = { high: "bg-destructive text-destructive-foreground", medium: "bg-gold text-gold-foreground", low: "bg-secondary text-secondary-foreground" };

function PlannerPage() {
  const qc = useQueryClient();
  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ["tasks"],
    queryFn: async () => {
      const { data, error } = await supabase.from("tasks").select("*");
      if (error) throw error;
      return data;
    },
  });
  const [form, setForm] = useState<typeof blank & { id?: string }>(blank);
  const [open, setOpen] = useState(false);
  const [prio, setPrio] = useState("all");
  const [status, setStatus] = useState("all");
  const [view, setView] = useState("day");
  const ai = useGenerate("plan");
  const refresh = () => { qc.invalidateQueries({ queryKey: ["tasks"] }); qc.invalidateQueries({ queryKey: ["dashboard"] }); };

  const save = async () => {
    if (!form.title.trim()) return toast.error("Task name is required.");
    const dur = form.duration_minutes ? Number(form.duration_minutes) : null;
    if (dur !== null && (isNaN(dur) || dur <= 0)) return toast.error("Duration must be a positive number of minutes.");
    const row = { title: form.title.trim(), description: form.description || null, priority: form.priority, status: form.status, due_date: form.due_date || null, duration_minutes: dur };
    const { error } = form.id ? await supabase.from("tasks").update({ ...row, updated_at: new Date().toISOString() }).eq("id", form.id) : await supabase.from("tasks").insert(row);
    if (error) return toast.error("Could not save the task.");
    toast.success(form.id ? "Task updated" : "Task added");
    setOpen(false); refresh();
  };
  const del = async (id: string) => { const { error } = await supabase.from("tasks").delete().eq("id", id); if (error) toast.error("Could not delete."); refresh(); };
  const complete = async (t: Task) => { await supabase.from("tasks").update({ status: t.status === "completed" ? "pending" : "completed" }).eq("id", t.id); refresh(); };

  const today = new Date(); today.setHours(0, 0, 0, 0);
  const weekEnd = new Date(today); weekEnd.setDate(today.getDate() + 7);
  const inView = (t: Task) => {
    if (!t.due_date) return view === "week";
    const d = new Date(t.due_date + "T00:00:00");
    return view === "day" ? d <= today : d < weekEnd;
  };
  const shown = sortTasks(tasks.filter((t) => (prio === "all" || t.priority === prio) && (status === "all" || t.status === status) && inView(t)));

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader title="Task Planner" subtitle="You stay in control — the AI only suggests a schedule." />
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Tabs value={view} onValueChange={setView}><TabsList><TabsTrigger value="day">Today & overdue</TabsTrigger><TabsTrigger value="week">This week</TabsTrigger></TabsList></Tabs>
        <Select value={prio} onValueChange={setPrio}><SelectTrigger className="w-36"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All priorities</SelectItem><SelectItem value="high">High</SelectItem><SelectItem value="medium">Medium</SelectItem><SelectItem value="low">Low</SelectItem></SelectContent></Select>
        <Select value={status} onValueChange={setStatus}><SelectTrigger className="w-36"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All statuses</SelectItem><SelectItem value="pending">Pending</SelectItem><SelectItem value="in_progress">In progress</SelectItem><SelectItem value="completed">Completed</SelectItem></SelectContent></Select>
        <div className="ml-auto flex gap-2">
          <Button variant="outline" disabled={ai.loading || shown.length === 0} onClick={() => ai.run(JSON.stringify({ view, today: today.toISOString().slice(0, 10), tasks: shown.map(({ title, description, priority, status, due_date, duration_minutes }) => ({ title, description, priority, status, due_date, duration_minutes })) }))}>
            {ai.loading ? <Loader2 className="animate-spin" /> : <Wand2 />} Suggest schedule
          </Button>
          <Button onClick={() => { setForm(blank); setOpen(true); }}><Plus /> Add task</Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        <div className="card-soft divide-y">
          {isLoading ? <p className="p-6 text-sm text-muted-foreground">Loading tasks…</p> : shown.length === 0 ? (
            <p className="p-10 text-center text-sm text-muted-foreground">No tasks here yet. Add your first task to start planning.</p>
          ) : shown.map((t) => (
            <div key={t.id} className="flex items-start gap-3 p-4">
              <button onClick={() => complete(t)} aria-label="Mark completed" className={`mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border-2 ${t.status === "completed" ? "border-primary bg-primary text-primary-foreground" : "border-input"}`}>{t.status === "completed" && <Check className="size-3" />}</button>
              <div className="min-w-0 flex-1">
                <p className={`font-semibold ${t.status === "completed" ? "text-muted-foreground line-through" : ""}`}>{t.title}</p>
                {t.description && <p className="text-sm text-muted-foreground">{t.description}</p>}
                <div className="mt-2 flex flex-wrap gap-2 text-xs">
                  <Badge className={PRIO_CLASS[t.priority]}>{t.priority}</Badge>
                  <Badge variant="outline">{t.status.replace("_", " ")}</Badge>
                  {t.due_date && <Badge variant="outline">Due {t.due_date}</Badge>}
                  {t.duration_minutes && <Badge variant="outline">{t.duration_minutes} min</Badge>}
                </div>
              </div>
              <Button size="icon" variant="ghost" aria-label="Edit" onClick={() => { setForm({ id: t.id, title: t.title, description: t.description ?? "", priority: t.priority, status: t.status, due_date: t.due_date ?? "", duration_minutes: t.duration_minutes?.toString() ?? "" }); setOpen(true); }}><Pencil /></Button>
              <Button size="icon" variant="ghost" aria-label="Delete" onClick={() => del(t.id)}><Trash2 /></Button>
            </div>
          ))}
        </div>
        <div className="card-soft space-y-3 p-5">
          <h2 className="text-lg font-semibold">AI schedule suggestion</h2>
          {ai.error && <p className="text-sm text-destructive">{ai.error}</p>}
          {ai.output ? <div className="text-sm"><MessageResponse>{ai.output}</MessageResponse></div> : <p className="text-sm text-muted-foreground">Click "Suggest schedule" to get an ordered plan for the tasks shown.</p>}
          <AiDisclaimer />
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{form.id ? "Edit task" : "Add task"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1"><Label>Task name *</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
            <div className="space-y-1"><Label>Description</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1"><Label>Priority</Label><Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v as Priority })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="high">High</SelectItem><SelectItem value="medium">Medium</SelectItem><SelectItem value="low">Low</SelectItem></SelectContent></Select></div>
              <div className="space-y-1"><Label>Status</Label><Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="pending">Pending</SelectItem><SelectItem value="in_progress">In progress</SelectItem><SelectItem value="completed">Completed</SelectItem></SelectContent></Select></div>
              <div className="space-y-1"><Label>Due date</Label><Input type="date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} /></div>
              <div className="space-y-1"><Label>Duration (minutes)</Label><Input type="number" min={1} value={form.duration_minutes} onChange={(e) => setForm({ ...form, duration_minutes: e.target.value })} /></div>
            </div>
          </div>
          <DialogFooter><Button onClick={save}>Save task</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
