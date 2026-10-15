import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AiDisclaimer, PageHeader } from "@/components/app/common";

export const Route = createFileRoute("/_app/settings")({
  head: () => ({
    meta: [
      { title: "Settings — Malibongwe Poultries" },
      { name: "description", content: "Account and privacy settings." },
      { property: "og:title", content: "Settings — Malibongwe Poultries" },
      { property: "og:description", content: "Account and privacy settings." },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const { session } = useAuth();
  const [pw, setPw] = useState("");
  const change = async () => {
    if (pw.length < 6) { toast.error("Password must be at least 6 characters."); return; }
    const { error } = await supabase.auth.updateUser({ password: pw });
    if (error) toast.error(error.message); else { toast.success("Password updated"); setPw(""); }
  };
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader title="Settings" />
      <section className="card-soft space-y-3 p-5">
        <h2 className="text-lg font-semibold">Profile</h2>
        <p className="text-sm">Signed in as <span className="font-semibold">{session?.user.email}</span></p>
      </section>
      <section className="card-soft space-y-3 p-5">
        <h2 className="text-lg font-semibold">Change password</h2>
        <Label htmlFor="pw">New password</Label>
        <Input id="pw" type="password" value={pw} onChange={(e) => setPw(e.target.value)} />
        <Button onClick={change}>Update password</Button>
      </section>
      <section className="card-soft space-y-3 p-5">
        <h2 className="text-lg font-semibold">Privacy & responsible AI</h2>
        <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
          <li>Your tasks, resources and chats are private to your account.</li>
          <li>Avoid pasting ID numbers, banking details or other highly sensitive personal data into AI tools.</li>
          <li>The AI never makes business decisions for you — always review its suggestions.</li>
        </ul>
        <AiDisclaimer />
      </section>
    </div>
  );
}
