import { createFileRoute } from "@tanstack/react-router";
import { createResponsesCall } from "@/server/responses";
import { GATEWAY, SYSTEM_BASE, getUserClient, jsonError } from "@/server/auth.server";

const TOOLS: Record<string, string> = {
  email: `Write a complete, well-structured business email (subject line, greeting, body, sign-off) from Malibongwe Poultries based on the details given. Match the requested tone exactly. Only use facts the user provided; use [placeholders] for anything missing such as names, prices or dates. Output only the email in plain text, starting with "Subject:".`,
  meeting: `Summarize the meeting notes into markdown with these headings: ## Meeting overview, ## Key discussion points, ## Decisions made, ## Action items, ## Responsible persons, ## Deadlines.
Use ONLY information in the notes. If a section has nothing in the notes, write "Not specified in the notes." Never invent names, decisions or dates.`,
  research: `Produce a research brief in markdown with headings: ## Summary, ## Key findings, ## Important points, ## Practical recommendations, ## Questions for further investigation.
If the user pasted text, label points drawn from it with "(from your text)" and your own suggestions with "(AI suggestion)". Never cite sources, studies or statistics you cannot see in the text; state that general knowledge has not been independently verified.`,
  plan: `You will receive the user's task list as JSON. Suggest an organized daily/weekly schedule in markdown, ordered by urgency, importance, deadline and duration. Include a short "## Time-management tips" section. Make clear this is a suggestion and the user decides the final schedule. Do not add tasks the user did not list.`,
};

export const Route = createFileRoute("/api/generate")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const apiKey = process.env.LOVABLE_API_KEY;
        if (!apiKey) return jsonError(503, "The AI service is not configured yet.");
        const auth = await getUserClient(request);
        if (!auth) return jsonError(401, "Please sign in again.");
        const body = (await request.json()) as { tool?: string; input?: string };
        const instructions = body.tool ? TOOLS[body.tool] : undefined;
        if (!instructions || !body.input?.trim()) return jsonError(400, "Please fill in the required details.");
        if (body.input.length > 60000) return jsonError(400, "The text is too long. Please shorten it.");
        const call = createResponsesCall(
          request,
          { ...GATEWAY, apiKey },
          [{ role: "user", content: body.input }],
          `${SYSTEM_BASE}\n\n${instructions}`,
        );
        return call.result.toTextStreamResponse();
      },
    },
  },
});
