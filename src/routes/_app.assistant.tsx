import { createFileRoute, Link, Outlet, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_app/assistant")({
  head: () => ({
    meta: [
      { title: "AI Assistant — Malibongwe Poultries" },
      { name: "description", content: "Chat with your poultry business productivity assistant." },
      { property: "og:title", content: "AI Assistant — Malibongwe Poultries" },
      { property: "og:description", content: "Chat with your business productivity assistant." },
    ],
  }),
  component: AssistantLayout,
});

export const threadsQuery = {
  queryKey: ["threads"],
  queryFn: async () => {
    const { data, error } = await supabase.from("threads").select("id,title,updated_at").order("updated_at", { ascending: false });
    if (error) throw error;
    return data;
  },
};

export async function createThread() {
  const { data, error } = await supabase.from("threads").insert({}).select("id").single();
  if (error) throw error;
  return data.id;
}

function AssistantLayout() {
  const { data: threads = [] } = useQuery(threadsQuery);
  const navigate = useNavigate();
  const qc = useQueryClient();
  const newThread = async () => {
    try {
      const id = await createThread();
      await qc.invalidateQueries({ queryKey: ["threads"] });
      navigate({ to: "/assistant/$threadId", params: { threadId: id } });
    } catch { toast.error("Could not start a conversation."); }
  };
  const remove = async (id: string) => {
    const { error } = await supabase.from("threads").delete().eq("id", id);
    if (error) return toast.error("Could not delete.");
    await qc.invalidateQueries({ queryKey: ["threads"] });
    navigate({ to: "/assistant" });
  };
  return (
    <div className="mx-auto flex h-[calc(100vh-8rem)] max-w-6xl gap-4">
      <aside className="card-soft hidden w-64 shrink-0 flex-col p-3 md:flex">
        <Button onClick={newThread} className="mb-3"><Plus /> New conversation</Button>
        <div className="flex-1 space-y-1 overflow-y-auto">
          {threads.map((t) => (
            <div key={t.id} className="group flex items-center rounded-lg hover:bg-muted">
              <Link to="/assistant/$threadId" params={{ threadId: t.id }} className="min-w-0 flex-1 truncate px-3 py-2 text-sm" activeProps={{ className: "font-semibold text-primary" }}>
                {t.title}
              </Link>
              <button aria-label="Delete conversation" onClick={() => remove(t.id)} className="p-2 opacity-0 group-hover:opacity-100"><Trash2 className="size-4 text-muted-foreground" /></button>
            </div>
          ))}
          {threads.length === 0 && <p className="px-3 text-xs text-muted-foreground">No conversations yet.</p>}
        </div>
      </aside>
      <div className="card-soft flex min-w-0 flex-1 flex-col"><Outlet /></div>
    </div>
  );
}
