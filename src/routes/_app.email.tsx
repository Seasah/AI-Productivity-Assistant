import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { OutputPanel, PageHeader } from "@/components/app/common";
import { useGenerate } from "@/lib/ai";

export const Route = createFileRoute("/_app/email")({
  head: () => ({
    meta: [
      { title: "Smart Email Generator — Malibongwe Poultries" },
      { name: "description", content: "Draft professional business emails for suppliers and customers." },
      { property: "og:title", content: "Smart Email Generator — Malibongwe Poultries" },
      { property: "og:description", content: "Draft professional business emails with AI." },
    ],
  }),
  component: EmailPage,
});

function EmailPage() {
  const [f, setF] = useState({ recipient: "", subject: "", purpose: "", details: "", tone: "Professional" });
  const g = useGenerate("email");
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setF({ ...f, [k]: e.target.value });
  const generate = () => {
    if (!f.recipient.trim() || !f.purpose.trim()) { toast.error("Please add a recipient and the purpose of the email."); return; }
    g.run(`Recipient/audience: ${f.recipient}\nSubject: ${f.subject || "(suggest one)"}\nPurpose: ${f.purpose}\nImportant details: ${f.details || "(none given)"}\nTone: ${f.tone}`);
  };
  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader title="Smart Email Generator" subtitle="Contact suppliers, request quotations, follow up on deliveries and more." />
      <div className="grid gap-6 lg:grid-cols-2">
        <form className="card-soft space-y-4 p-5" onSubmit={(e) => { e.preventDefault(); generate(); }}>
          <div className="space-y-2"><Label>Recipient or audience *</Label><Input placeholder="e.g. Our poultry feed supplier" value={f.recipient} onChange={set("recipient")} /></div>
          <div className="space-y-2"><Label>Subject</Label><Input placeholder="e.g. Quotation request for layer mash" value={f.subject} onChange={set("subject")} /></div>
          <div className="space-y-2"><Label>Purpose *</Label><Textarea rows={3} placeholder="What should this email achieve?" value={f.purpose} onChange={set("purpose")} /></div>
          <div className="space-y-2"><Label>Important details</Label><Textarea rows={4} placeholder="Quantities, dates, order numbers…" value={f.details} onChange={set("details")} /></div>
          <div className="space-y-2">
            <Label>Tone</Label>
            <Select value={f.tone} onValueChange={(v) => setF({ ...f, tone: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{["Formal", "Friendly", "Professional", "Persuasive"].map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <Button type="submit" disabled={g.loading} className="w-full"><Wand2 /> {g.loading ? "Generating…" : "Generate email"}</Button>
        </form>
        <OutputPanel
          {...g}
          onRegenerate={generate}
          onClear={() => { g.reset(); setF({ recipient: "", subject: "", purpose: "", details: "", tone: "Professional" }); }}
          saveTitle={`Email: ${f.subject || f.purpose.slice(0, 50) || "Draft"}`}
          saveCategory="Email"
          empty="Fill in the details and your email draft will appear here. You can edit it before copying."
        />
      </div>
    </div>
  );
}
