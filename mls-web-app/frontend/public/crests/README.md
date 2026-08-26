# Team crest images

Drop real crest PNGs here, named by each team's `logoSlug` (see
`src/teams/teamData.ts`), e.g. `atlanta-united.png`, `lafc.png`.

The `Crest` component (`src/teams/Crest.tsx`) automatically uses a file here
if present, and falls back to the procedural badge for any team whose file
is missing — no code changes needed, just add the PNG.

Recommended: square, transparent background, at least 256x256px.
