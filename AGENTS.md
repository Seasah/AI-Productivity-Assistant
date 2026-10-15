<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- AI calls go through TanStack server routes `src/routes/api/chat.ts` (streaming chat, persists to threads/messages) and `src/routes/api/generate.ts` (one-shot text tools); both verify the caller's bearer token and use a user-scoped client so RLS applies.
- Signed-in pages live under the pathless `_app` layout, which guards on the client session; all user data is read with the browser client under owner-only RLS.
