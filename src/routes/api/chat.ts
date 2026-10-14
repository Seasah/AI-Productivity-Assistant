import { createFileRoute } from "@tanstack/react-router";
import { convertToModelMessages, type UIMessage } from "ai";
import { createResponsesCall } from "@/server/responses";
import { withLovableAiGatewayRunIdHeader } from "@/server/run-id";
import { GATEWAY, SYSTEM_BASE, getUserClient, jsonError } from "@/server/auth.server";

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const apiKey = process.env.LOVABLE_API_KEY;
        if (!apiKey) return jsonError(503, "The AI service is not configured yet.");
        const auth = await getUserClient(request);
        if (!auth) return jsonError(401, "Please sign in again.");
        const { supabase, userId } = auth;

        const body = (await request.json()) as { threadId?: string; messages?: UIMessage[] };
        const threadId = body.threadId;
        const messages = body.messages ?? [];
        if (!threadId || messages.length === 0) return jsonError(400, "Missing conversation.");

        const { data: thread } = await supabase
          .from("threads")
          .select("id,title")
          .eq("id", threadId)
          .maybeSingle();
        if (!thread) return jsonError(404, "Conversation not found.");

        const last = messages[messages.length - 1];
        if (last.role === "user") {
          const { error } = await supabase.from("messages").insert({
            thread_id: threadId,
            user_id: userId,
            ui_id: last.id,
            role: "user",
            parts: last.parts as never,
          });
          if (error) return jsonError(500, "Could not save your message.");
          if (thread.title === "New conversation") {
            const text = last.parts
              .map((p) => (p.type === "text" ? p.text : ""))
              .join(" ")
              .trim();
            await supabase
              .from("threads")
              .update({ title: text.slice(0, 60) || "New conversation", updated_at: new Date().toISOString() })
              .eq("id", threadId);
          } else {
            await supabase.from("threads").update({ updated_at: new Date().toISOString() }).eq("id", threadId);
          }
        }

        const call = createResponsesCall(
          request,
          { ...GATEWAY, apiKey },
          await convertToModelMessages(messages),
          SYSTEM_BASE,
        );
        // Re-create runIdFetch-aware response with persistence
        const response = call.result.toUIMessageStreamResponse({
          originalMessages: messages,
          sendReasoning: true,
          onFinish: async ({ responseMessage }) => {
            const { error } = await supabase.from("messages").insert({
              thread_id: threadId,
              user_id: userId,
              ui_id: responseMessage.id,
              role: "assistant",
              parts: responseMessage.parts as never,
            });
            if (error) console.error("Failed to save assistant message", error);
          },
          onError: (err) => {
            const msg = String((err as Error)?.message ?? err);
            if (msg.includes("429")) return "The AI service is busy. Please try again shortly.";
            if (msg.includes("402")) return "AI credits are used up. Please add credits to continue.";
            return "The AI service had a problem. Please try again.";
          },
        });
        return withLovableAiGatewayRunIdHeader(response, {
          getRunId: () => undefined,
          waitForRunId: async () => undefined,
        });
      },
    },
  },
});
