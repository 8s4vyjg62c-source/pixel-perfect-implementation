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

- Bloom app state lives in `src/lib/bloom/store.ts` behind `useBloom()` (localStorage for the prototype); swap persistence there to add accounts/DB without touching screens.
- Bilan figures are pure functions in `src/lib/bloom/stats.ts` (tested in `src/test/bloom-stats.test.ts`); motivation messages in `motivation.ts` derive only from recorded data — never invent stats.
- Old saved data is upgraded through `migrate()` in the store; add new fields there with defaults so existing users keep their data.
