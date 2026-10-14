import { useCallback, useRef, useState } from "react";
import { authHeaders } from "./auth";

export type GenerateTool = "email" | "meeting" | "research" | "plan";

/** Streams text from the server AI endpoint. */
export function useGenerate(tool: GenerateTool) {
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const run = useCallback(
    async (input: string) => {
      abortRef.current?.abort();
      const ctrl = new AbortController();
      abortRef.current = ctrl;
      setLoading(true);
      setError(null);
      setOutput("");
      try {
        const res = await fetch("/api/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json", ...(await authHeaders()) },
          body: JSON.stringify({ tool, input }),
          signal: ctrl.signal,
        });
        if (!res.ok || !res.body) {
          const j = await res.json().catch(() => ({}));
          throw new Error(
            j.error ??
              (res.status === 429
                ? "The AI service is busy. Please try again shortly."
                : res.status === 402
                  ? "AI credits are used up."
                  : "The AI service could not respond."),
          );
        }
        const reader = res.body.getReader();
        const dec = new TextDecoder();
        let text = "";
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          text += dec.decode(value, { stream: true });
          setOutput(text);
        }
        if (!text.trim()) throw new Error("The AI service returned no content. Please try again.");
      } catch (e) {
        if ((e as Error).name !== "AbortError") setError((e as Error).message);
      } finally {
        setLoading(false);
      }
    },
    [tool],
  );

  const reset = () => {
    abortRef.current?.abort();
    setOutput("");
    setError(null);
  };

  return { output, setOutput, loading, error, run, reset };
}
