import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Upload, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { OutputPanel, PageHeader } from "@/components/app/common";
import { useGenerate } from "@/lib/ai";

export const Route = createFileRoute("/_app/meetings")({
  head: () => ({
    meta: [
      { title: "Meeting Notes Summarizer — Malibongwe Poultries" },
      { name: "description", content: "Turn long meeting notes into decisions, action items and deadlines." },
      { property: "og:title", content: "Meeting Notes Summarizer — Malibongwe Poultries" },
      { property: "og:description", content: "Turn long meeting notes into clear summaries." },
    ],
  }),
  component: MeetingsPage,
});

function MeetingsPage() {
  const [notes, setNotes] = useState("");
  const g = useGenerate("meeting");
  const go = () => { if (notes.trim().length < 20) toast.error("Please paste at least a few lines of notes."); else g.run(notes); };
  const upload = async (file?: File) => {
    if (!file) return;
    if (!/\.(txt|md|csv)$/i.test(file.name)) { toast.error("Please upload a .txt, .md or .csv file."); return; }
    setNotes(await file.text());
  };
  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader title="Meeting Notes Summarizer" subtitle="Only what's in your notes is used — nothing is invented." />
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card-soft space-y-4 p-5">
          <Textarea rows={16} placeholder="Paste your meeting notes here…" value={notes} onChange={(e) => setNotes(e.target.value)} />
          <div className="flex flex-wrap gap-2">
            <Button onClick={go} disabled={g.loading}><Wand2 /> {g.loading ? "Summarizing…" : "Summarize"}</Button>
            <Button variant="outline" asChild>
              <label className="cursor-pointer"><Upload /> Upload text file<input type="file" accept=".txt,.md,.csv" className="hidden" onChange={(e) => upload(e.target.files?.[0])} /></label>
            </Button>
          </div>
        </div>
        <OutputPanel
          {...g}
          onRegenerate={go}
          onClear={() => { g.reset(); setNotes(""); }}
          saveTitle={`Meeting summary ${new Date().toLocaleDateString()}`}
          saveCategory="Meeting summary"
          empty="Your summary with overview, decisions, action items and deadlines will appear here."
        />
      </div>
    </div>
  );
}
