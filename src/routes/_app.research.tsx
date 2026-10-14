import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { OutputPanel, PageHeader } from "@/components/app/common";
import { useGenerate } from "@/lib/ai";

export const Route = createFileRoute("/_app/research")({
  head: () => ({
    meta: [
      { title: "AI Research Assistant — Malibongwe Poultries" },
      { name: "description", content: "Summaries, key findings and recommendations on poultry and business topics." },
      { property: "og:title", content: "AI Research Assistant — Malibongwe Poultries" },
      { property: "og:description", content: "Understand business information quickly." },
    ],
  }),
  component: ResearchPage,
});

function ResearchPage() {
  const [topic, setTopic] = useState("");
  const [text, setText] = useState("");
  const g = useGenerate("research");
  const go = () => {
    if (!topic.trim() && !text.trim()) return toast.error("Enter a topic or paste some text.");
    g.run(`Topic: ${topic || "(see text)"}\n\n${text ? `User-supplied text:\n"""${text}"""` : "No text supplied — use general knowledge and say it is unverified."}`);
  };
  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader title="AI Research Assistant" subtitle="Poultry farming, administration, productivity and customer service." />
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card-soft space-y-4 p-5">
          <div className="space-y-2"><Label>Research topic</Label><Input placeholder="e.g. Reducing feed costs for broilers" value={topic} onChange={(e) => setTopic(e.target.value)} /></div>
          <div className="space-y-2"><Label>Article, report or text (optional)</Label><Textarea rows={12} value={text} onChange={(e) => setText(e.target.value)} /></div>
          <p className="text-xs text-muted-foreground">Points from your text are labelled "(from your text)"; the assistant's own ideas are labelled "(AI suggestion)". General knowledge is not independently verified.</p>
          <Button onClick={go} disabled={g.loading}><Wand2 /> {g.loading ? "Researching…" : "Analyse"}</Button>
        </div>
        <OutputPanel
          {...g}
          onRegenerate={go}
          onClear={() => { g.reset(); setTopic(""); setText(""); }}
          saveTitle={`Research: ${topic || "Pasted text"}`}
          saveCategory="Research"
          empty="Your summary, key findings, recommendations and open questions will appear here."
        />
      </div>
    </div>
  );
}
