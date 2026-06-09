# Battle Mode Design

## Goal

Add a lightweight Studio battle mode that compares two provider configurations on the same audio input, so users can inspect transcription quality, detected language, latency, and errors side by side without entering the full Benchmark workspace.

## Scope

Battle mode lives in the main Studio workspace. It does not replace the existing single-provider transcription path, batch queue, history panel, or Benchmark workspace. The normal mode remains the default.

## User Experience

Settings gains a Battle Mode toggle and two provider selectors: Model A and Model B. The selectors reuse the existing provider list and credentials already stored for each provider. In the Studio workspace, enabling battle mode shows a compact comparison panel below the normal result area. Clicking the existing transcribe action runs both selected providers against the current audio file. Results render in two side-by-side columns with provider label, status, elapsed time, detected language, text, and error message if one side fails.

The existing single result stays focused on the active provider. After a battle finishes, the better-looking manual review remains up to the user; the app does not auto-score unless reference text exists, which this workflow does not require.

## Architecture

A small battle helper module creates battle provider configs from the current app settings and selected A/B providers. A battle hook manages per-side status and uses the existing preprocessing, cache, provider registry, and transcription processing helpers. The hook runs the two sides sequentially at first to avoid rate-limit spikes and browser CPU contention from double compression. Each side gets independent success/error state.

## Components

- `services/battleMode.ts`: pure helpers and types for battle targets/results.
- `hooks/useBattleTranscription.ts`: orchestration for running A/B transcription on one file.
- `components/BattleModePanel.tsx`: provider pickers, action state, and side-by-side result cards.
- `hooks/useAppSettings.ts`: persisted battle settings.
- `App.tsx`: wires battle state into the Studio workspace and disables conflicting actions while battle is running.

## Data Flow

1. User enables battle mode and selects Model A and Model B.
2. User uploads/records an audio file.
3. User clicks transcribe.
4. The regular transcribe path is skipped while battle mode is on.
5. The battle hook validates each provider, prepares the same source audio, calls the configured provider, records latency, and stores each side result.
6. UI displays both outputs and errors independently.

## Error Handling

If one side fails readiness checks or provider calls, that side shows an error while the other side continues. Cancel aborts the active side and marks remaining/running sides as cancelled. Battle mode blocks batch queue execution because comparing two models over a queue is a separate, heavier workflow already covered better by Benchmark.

## Testing

Unit tests cover battle config creation, same-provider rejection, initial side state, success result mapping, and error result mapping. Existing provider and transcription tests remain the coverage for actual API adapter behavior.
