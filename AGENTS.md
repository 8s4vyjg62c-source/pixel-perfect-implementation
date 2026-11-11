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
- Mon monde derives geographic views from existing projects; optional geography stays on the source record to prevent duplicate personal lists.
- World outlines and country lookup are bundled from Natural Earth; regenerate projected paths from its public-domain country data rather than relying on online tiles.
- Geographic dates represent occurrence/intention or existing plan deadlines, never creation dates; idea and paused statuses must not be automatically interpreted as wishes.
