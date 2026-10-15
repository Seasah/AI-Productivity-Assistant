import { useState, type ReactNode } from "react";
import { ShieldAlert, Copy, RotateCw, Eraser, Save, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";

export function PageHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-6">
      <h1 className="text-3xl font-semibold">{title}</h1>
      {subtitle && <p className="mt-1 text-muted-foreground">{subtitle}</p>}
    </div>
  );
}

export function AiDisclaimer() {
  return (
    <div className="flex items-start gap-2 rounded-lg border border-gold/60 bg-accent px-3 py-2 text-xs text-accent-foreground">
      <ShieldAlert className="mt-0.5 size-4 shrink-0" />
      <span>AI-generated content may contain errors. Please review and confirm all details before using it.</span>
    </div>
  );
}

export async function saveResource(title: string, category: string, content: string, description?: string) {
  const { error } = await supabase.from("resources").insert({ title, category, content, description: description ?? null });
  if (error) toast.error("Could not save to Business Resources.");
  else toast.success("Saved to Business Resources.");
}

/** Editable AI output with copy / regenerate / clear / save actions. */
export function OutputPanel({
  output, setOutput, loading, error, onRegenerate, onClear, saveTitle, saveCategory, empty,
}: {
  output: string;
  setOutput: (v: string) => void;
  loading: boolean;
  error: string | null;
  onRegenerate: () => void;
  onClear: () => void;
  saveTitle: string;
  saveCategory: string;
  empty: ReactNode;
}) {
  const [saving, setSaving] = useState(false);
  return (
    <div className="card-soft flex flex-col gap-3 p-5">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Result</h2>
        {loading && <Loader2 className="size-4 animate-spin text-primary" />}
      </div>
      {error && <p className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
      {!output && !loading && !error ? (
        <div className="flex min-h-64 items-center justify-center rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
          {empty}
        </div>
      ) : (
        <Textarea
          value={output}
          onChange={(e) => setOutput(e.target.value)}
          className="min-h-80 flex-1 font-sans text-sm leading-relaxed"
          placeholder={loading ? "Generating…" : ""}
        />
      )}
      <AiDisclaimer />
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" disabled={!output} onClick={() => { navigator.clipboard.writeText(output); toast.success("Copied"); }}>
          <Copy /> Copy
        </Button>
        <Button variant="outline" size="sm" disabled={loading} onClick={onRegenerate}>
          <RotateCw /> Regenerate
        </Button>
        <Button variant="outline" size="sm" onClick={onClear}>
          <Eraser /> Clear
        </Button>
        <Button
          size="sm"
          disabled={!output || loading || saving}
          onClick={async () => { setSaving(true); await saveResource(saveTitle, saveCategory, output); setSaving(false); }}
        >
          <Save /> Save to resources
        </Button>
      </div>
    </div>
  );
}
