import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Plus, Eye, Trash2, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { PageHeader } from "@/components/app/common";

export const Route = createFileRoute("/_app/resources")({
  head: () => ({
    meta: [
      { title: "Business Resources — Malibongwe Poultries" },
      { name: "description", content: "Private library of documents, templates and AI-generated content." },
      { property: "og:title", content: "Business Resources — Malibongwe Poultries" },
      { property: "og:description", content: "Private library of business documents." },
    ],
  }),
  component: ResourcesPage,
});

const CATS = ["Notes", "Template", "Document", "Email", "Meeting summary", "Research"];

function ResourcesPage() {
  const qc = useQueryClient();
  const { data = [], isLoading } = useQuery({
    queryKey: ["resources"],
    queryFn: async () => {
      const { data, error } = await supabase.from("resources").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("all");
  const [view, setView] = useState<Tables<"resources"> | null>(null);
  const [adding, setAdding] = useState(false);
  const [f, setF] = useState({ title: "", category: "Notes", description: "", content: "" });

  const shown = data.filter((r) => (cat === "all" || r.category === cat) && `${r.title} ${r.description ?? ""} ${r.content ?? ""}`.toLowerCase().includes(q.toLowerCase()));
  const add = async () => {
    if (!f.title.trim()) { toast.error("Title is required."); return; }
    const { error } = await supabase.from("resources").insert(f);
    if (error) { toast.error("Could not save."); return; }
    toast.success("Resource saved"); setAdding(false); setF({ title: "", category: "Notes", description: "", content: "" });
    qc.invalidateQueries({ queryKey: ["resources"] });
  };
  const del = async (id: string) => {
    if (!confirm("Delete this resource permanently?")) return;
    const { error } = await supabase.from("resources").delete().eq("id", id);
    if (error) { toast.error("Could not delete."); return; }
    qc.invalidateQueries({ queryKey: ["resources"] });
  };

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader title="Business Resources" subtitle="Only you can see the resources saved to your account." />
      <div className="mb-4 flex flex-wrap gap-2">
        <div className="relative min-w-56 flex-1"><Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" /><Input className="pl-9" placeholder="Search resources…" value={q} onChange={(e) => setQ(e.target.value)} /></div>
        <Select value={cat} onValueChange={setCat}><SelectTrigger className="w-44"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All categories</SelectItem>{CATS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select>
        <Button onClick={() => setAdding(true)}><Plus /> Add resource</Button>
      </div>
      <div className="card-soft overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted text-left text-muted-foreground"><tr><th className="p-3">Title</th><th className="p-3">Category</th><th className="p-3">Created</th><th className="p-3">Description</th><th className="p-3" /></tr></thead>
          <tbody className="divide-y">
            {isLoading ? <tr><td className="p-6 text-muted-foreground" colSpan={5}>Loading…</td></tr> : shown.length === 0 ? (
              <tr><td className="p-10 text-center text-muted-foreground" colSpan={5}>No resources yet. Save AI results or add your own notes and templates.</td></tr>
            ) : shown.map((r) => (
              <tr key={r.id}>
                <td className="p-3 font-semibold">{r.title}</td>
                <td className="p-3"><Badge variant="secondary">{r.category}</Badge></td>
                <td className="p-3 whitespace-nowrap text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</td>
                <td className="max-w-xs truncate p-3 text-muted-foreground">{r.description || r.content?.slice(0, 80)}</td>
                <td className="whitespace-nowrap p-3 text-right">
                  <Button size="icon" variant="ghost" aria-label="View" onClick={() => setView(r)}><Eye /></Button>
                  <Button size="icon" variant="ghost" aria-label="Delete" onClick={() => del(r.id)}><Trash2 /></Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Dialog open={!!view} onOpenChange={(o) => !o && setView(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>{view?.title}</DialogTitle><DialogDescription>{view?.category} · {view && new Date(view.created_at).toLocaleString()}</DialogDescription></DialogHeader>
          <pre className="max-h-[60vh] overflow-auto whitespace-pre-wrap rounded-lg bg-muted p-4 font-sans text-sm">{view?.content || view?.description || "No content."}</pre>
          <DialogFooter><Button variant="outline" onClick={() => { navigator.clipboard.writeText(view?.content ?? ""); toast.success("Copied"); }}>Copy</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={adding} onOpenChange={setAdding}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add resource</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1"><Label>Title *</Label><Input value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} /></div>
            <div className="space-y-1"><Label>Category</Label><Select value={f.category} onValueChange={(v) => setF({ ...f, category: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{CATS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-1"><Label>Description</Label><Input value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} /></div>
            <div className="space-y-1"><Label>Content</Label><Textarea rows={8} value={f.content} onChange={(e) => setF({ ...f, content: e.target.value })} /></div>
          </div>
          <DialogFooter><Button onClick={add}>Save</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
