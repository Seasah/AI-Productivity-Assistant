import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { createThread } from "./_app.assistant";

export const Route = createFileRoute("/_app/assistant/")({ component: PickThread });

function PickThread() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const started = useRef(false);
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    (async () => {
      const { data } = await supabase.from("threads").select("id").order("updated_at", { ascending: false }).limit(1);
      const id = data?.[0]?.id ?? (await createThread());
      await qc.invalidateQueries({ queryKey: ["threads"] });
      navigate({ to: "/assistant/$threadId", params: { threadId: id }, replace: true });
    })();
  }, [navigate, qc]);
  return <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">Opening your assistant…</div>;
}
