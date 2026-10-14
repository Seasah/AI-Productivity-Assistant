import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CalendarClock, CheckCircle2, ClipboardList, Bot, Mail, NotebookPen, CalendarCheck, MessagesSquare } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import hero from "@/assets/farm-hero.jpg";

export const Route = createFileRoute("/_app/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — Malibongwe Poultries" },
      { name: "description", content: "Overview of tasks, admin work and AI tools for Malibongwe Poultries." },
      { property: "og:title", content: "Dashboard — Malibongwe Poultries" },
      { property: "og:description", content: "Overview of tasks, admin work and AI tools." },
    ],
  }),
  component: Dashboard,
});

const DEMO = [
  { title: "Order layer feed from supplier", kind: "Task", when: "Today" },
  { title: "Email: Follow-up on egg tray delivery", kind: "AI email", when: "Yesterday" },
  { title: "Summary: Weekly staff meeting", kind: "AI summary", when: "2 days ago" },
];

function Dashboard() {
  const today = new Date().toISOString().slice(0, 10);
  const { data } = useQuery({
    queryKey: ["dashboard"],
    queryFn: async () => {
      const [t, r] = await Promise.all([
        supabase.from("tasks").select("id,title,status,due_date,created_at").order("created_at", { ascending: false }),
        supabase.from("resources").select("id,title,category,created_at").order("created_at", { ascending: false }).limit(5),
      ]);
      return { tasks: t.data ?? [], resources: r.data ?? [] };
    },
  });
  const tasks = data?.tasks ?? [];
  const stats = [
    { label: "Tasks due today", value: tasks.filter((t) => t.due_date === today && t.status !== "completed").length, icon: CalendarClock },
    { label: "Completed tasks", value: tasks.filter((t) => t.status === "completed").length, icon: CheckCircle2 },
    { label: "Pending admin tasks", value: tasks.filter((t) => t.status !== "completed").length, icon: ClipboardList },
    { label: "AI tools available", value: 5, icon: Bot },
  ];
  const recent = [
    ...tasks.slice(0, 4).map((t) => ({ title: t.title, kind: "Task", when: new Date(t.created_at).toLocaleDateString(), at: t.created_at })),
    ...(data?.resources ?? []).map((r) => ({ title: r.title, kind: r.category, when: new Date(r.created_at).toLocaleDateString(), at: r.created_at })),
  ].sort((a, b) => b.at.localeCompare(a.at)).slice(0, 6);
  const isDemo = data && recent.length === 0;

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <section className="relative overflow-hidden rounded-2xl">
        <img src={hero} alt="Hens grazing at a poultry farm" width={1600} height={640} className="h-56 w-full object-cover md:h-64" />
        <div className="absolute inset-0 bg-gradient-to-r from-primary/95 via-primary/70 to-transparent" />
        <div className="absolute inset-0 flex flex-col justify-center p-6 md:p-10">
          <h1 className="max-w-lg text-3xl font-semibold text-primary-foreground md:text-4xl">Welcome to Malibongwe Poultries</h1>
          <p className="mt-2 max-w-md text-primary-foreground/90">Your intelligent assistant for smarter poultry business operations.</p>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map(({ label, value, icon: Icon }) => (
          <div key={label} className="card-soft p-5">
            <div className="flex size-10 items-center justify-center rounded-lg bg-gold text-gold-foreground"><Icon className="size-5" /></div>
            <p className="mt-4 font-display text-3xl font-semibold text-primary">{value}</p>
            <p className="text-sm text-muted-foreground">{label}</p>
          </div>
        ))}
      </section>

      <section>
        <h2 className="mb-3 text-xl font-semibold">Quick access</h2>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {[
            { to: "/email", label: "Generate an Email", icon: Mail },
            { to: "/meetings", label: "Summarize Meeting Notes", icon: NotebookPen },
            { to: "/planner", label: "Plan My Day", icon: CalendarCheck },
            { to: "/assistant", label: "Ask AI Assistant", icon: MessagesSquare },
          ].map(({ to, label, icon: Icon }) => (
            <Link key={to} to={to} className="card-soft group flex items-center gap-3 p-4 font-semibold text-primary transition hover:-translate-y-0.5 hover:border-gold">
              <Icon className="size-5 text-primary group-hover:text-gold-foreground" /> {label}
            </Link>
          ))}
        </div>
      </section>

      <section className="card-soft p-5">
        <div className="mb-3 flex items-center gap-2">
          <h2 className="text-xl font-semibold">Recent activity</h2>
          {isDemo && <Badge variant="secondary">Demonstration data</Badge>}
        </div>
        <ul className="divide-y">
          {(isDemo ? DEMO : recent).map((r, i) => (
            <li key={i} className="flex items-center justify-between py-3 text-sm">
              <span className="font-medium">{r.title}</span>
              <span className="flex items-center gap-3 text-muted-foreground"><Badge variant="outline">{r.kind}</Badge>{r.when}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
