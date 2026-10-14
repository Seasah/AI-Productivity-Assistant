import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { useEffect } from "react";
import { toast } from "sonner";
import { Eraser } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { authHeaders } from "@/lib/auth";
import { Conversation, ConversationContent, ConversationEmptyState, ConversationScrollButton } from "@/components/ai-elements/conversation";
import { Message, MessageContent, MessageResponse } from "@/components/ai-elements/message";
import { PromptInput, PromptInputFooter, PromptInputSubmit, PromptInputTextarea } from "@/components/ai-elements/prompt-input";
import { Shimmer } from "@/components/ai-elements/shimmer";
import { Button } from "@/components/ui/button";
import { AiDisclaimer } from "@/components/app/common";
import logo from "@/assets/logo.png";

export const Route = createFileRoute("/_app/assistant/$threadId")({ component: ThreadPage });

function ThreadPage() {
  const { threadId } = Route.useParams();
  const { data, isLoading, error } = useQuery({
    queryKey: ["messages", threadId],
    queryFn: async () => {
      const { data, error } = await supabase.from("messages").select("ui_id,role,parts").eq("thread_id", threadId).order("created_at");
      if (error) throw error;
      return data.map((m) => ({ id: m.ui_id, role: m.role, parts: m.parts })) as unknown as UIMessage[];
    },
    staleTime: Infinity,
  });
  if (error) return <p className="p-6 text-sm text-destructive">Could not load this conversation.</p>;
  if (isLoading || !data) return <div className="flex-1" />;
  return <ChatWindow key={threadId} threadId={threadId} initial={data} />;
}

const PROMPTS = [
  "Help me organize today's poultry farm activities.",
  "Draft an email to a poultry feed supplier.",
  "Summarize these meeting notes.",
  "Create a weekly administrative work plan.",
];

function ChatWindow({ threadId, initial }: { threadId: string; initial: UIMessage[] }) {
  const qc = useQueryClient();
  const { messages, sendMessage, status, stop, setMessages } = useChat({
    id: threadId,
    messages: initial,
    transport: new DefaultChatTransport({ api: "/api/chat", body: { threadId }, headers: authHeaders }),
    onError: (e) => {
      let msg = e.message;
      try { msg = JSON.parse(e.message).error ?? msg; } catch { /* plain text */ }
      toast.error(msg || "The AI service could not respond.");
    },
    onFinish: () => {
      qc.invalidateQueries({ queryKey: ["threads"] });
      qc.setQueryData(["messages", threadId], undefined);
    },
  });
  const busy = status === "submitted" || status === "streaming";

  useEffect(() => {
    document.querySelector<HTMLTextAreaElement>("textarea[name=message]")?.focus();
  }, [status]);

  const clear = async () => {
    const { error } = await supabase.from("messages").delete().eq("thread_id", threadId);
    if (error) return toast.error("Could not clear the conversation.");
    setMessages([]);
    qc.removeQueries({ queryKey: ["messages", threadId] });
  };

  return (
    <>
      <div className="flex items-center justify-between border-b px-4 py-2">
        <span className="text-sm font-semibold text-primary">Malibongwe Assistant</span>
        <Button variant="ghost" size="sm" onClick={clear} disabled={busy || messages.length === 0}><Eraser /> Clear conversation</Button>
      </div>
      <Conversation className="flex-1">
        <ConversationContent>
          {messages.length === 0 ? (
            <ConversationEmptyState>
              <img src={logo} alt="" width={200} height={100} className="h-16 w-auto" />
              <p className="max-w-sm text-sm text-muted-foreground">Ask about admin work, communications, planning or poultry business concepts.</p>
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                {PROMPTS.map((p) => (
                  <button key={p} onClick={() => sendMessage({ text: p })} className="rounded-lg border bg-card px-3 py-2 text-left text-sm hover:border-gold">{p}</button>
                ))}
              </div>
            </ConversationEmptyState>
          ) : (
            messages.map((m) => (
              <Message key={m.id} from={m.role}>
                <MessageContent>
                  {m.parts.map((p, i) => (p.type === "text" ? (m.role === "assistant" ? <MessageResponse key={i}>{p.text}</MessageResponse> : <span key={i} className="whitespace-pre-wrap">{p.text}</span>) : null))}
                </MessageContent>
              </Message>
            ))
          )}
          {status === "submitted" && <Shimmer>Thinking…</Shimmer>}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>
      <div className="space-y-2 border-t p-3">
        <PromptInput onSubmit={({ text }) => { if (text.trim() && !busy) sendMessage({ text }); }}>
          <PromptInputTextarea name="message" placeholder="Ask the Malibongwe assistant…" autoFocus />
          <PromptInputFooter className="justify-end">
            <PromptInputSubmit status={status} onStop={stop} />
          </PromptInputFooter>
        </PromptInput>
        <AiDisclaimer />
      </div>
    </>
  );
}
