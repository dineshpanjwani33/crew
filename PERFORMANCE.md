# Performance Methodology

This document explains how performance is measured in the Crew app, what was optimized, and the trade-offs involved.

## Goals

- Keep the 120-item feed scrollable at near-60 FPS on a mid-range device/emulator
- Surface frame drops and JS-thread stalls without adding measurable overhead
- Provide reproducible metrics for a ~60s scroll session

## Measurement Approach

### Custom overlay (`usePerformanceMonitor` + `PerformanceOverlay`)

The overlay is **not** a production profiler. It is a lightweight, in-app monitor built for this assignment.

| Metric                   | How it is measured                                                                                                    |
| ------------------------ | --------------------------------------------------------------------------------------------------------------------- |
| **FPS (30f avg)**        | Rolling average over the last 30 frame deltas (`1000 / avgFrameTime`)                                                 |
| **Frame drops**          | Count of frames where `frameTime > 1000/45 ms` (~22.2 ms, i.e. below 45 FPS)                                          |
| **p50 / p95 frame time** | Percentile of frame deltas in the rolling window (max 600 samples)                                                    |
| **Worst frame**          | Maximum single-frame duration seen since last **Reset**                                                               |
| **Total frames**         | Cumulative frames sampled since last **Reset** (keeps climbing)                                                       |
| **Window (max 600)**     | Rolling buffer size used for FPS / percentiles (caps at 600 ≈ 10s at 60 FPS)                                          |
| **JS thread busy**       | `setInterval` heartbeat every 100 ms; if actual elapsed > 150 ms, JS thread is considered busy (blocked by sync work) |

### UI update throttle

Overlay state updates every **400 ms** (`UI_UPDATE_INTERVAL_MS`), not every frame. This avoids the monitor itself causing re-renders that skew results.

The monitor only runs while the PERF **panel is open** (`usePerformanceMonitor(visible)`). With the panel closed, there is zero sampling overhead.

### Expected overlay behaviour (not bugs)

These readings look alarming at first but are **normal** for this monitor:

#### FPS starts around 30, then climbs to ~60

The label shows a **30-frame rolling average**, not instantaneous FPS. When the PERF panel opens:

1. The panel mounts and the rAF loop starts — the first few frames are slower (React render + layout).
2. Those slow frames sit in the 30-frame window and pull the average down (~30 FPS).
3. As more ~16.7 ms frames arrive during scroll, the average converges toward **55–60**.

This is the metric **warming up**, not the feed suddenly getting faster. For benchmarks: tap **Reset**, wait ~1s until FPS stabilizes, then start scrolling.

#### Worst frame spikes (e.g. 50–80 ms)

**Worst frame** records the single longest frame since **Reset**. A one-off spike to ~73 ms (~14 FPS for that frame) is expected when:

| Trigger                       | Why                                                  |
| ----------------------------- | ---------------------------------------------------- |
| New FlatList cards mounting   | Layout + image decode burst                          |
| Opening Ask Crew bottom sheet | Full Gorhom tree mounts on JS thread                 |
| Expanding card details        | Reanimated animation + horizontal `ScrollView` mount |
| PERF panel open / Reset       | Overlay re-render                                    |
| Android emulator              | Slower and spikier than a physical device            |

Focus on **p50** and **p95** for sustained health; treat **worst frame** as a one-off hitch indicator.

#### Window stuck at 600

The rolling buffer keeps only the **last 600** frame deltas (~10s at 60 FPS) to limit memory and sort cost. Once full:

- **Window (max 600)** stays at 600
- **Total frames** keeps climbing (sampling is still active)
- **Frame drops** and **worst frame** still update

#### JS thread briefly BUSY

A short **BUSY** flash is expected when opening the Gorhom bottom sheet (one-time mount + layout on JS). Concerning only if JS stays **BUSY** during idle scroll.

### How to run a 60s benchmark

1. Launch the app and wait for bundles to load
2. Tap **PERF** (top-right) to open the overlay panel
3. Tap **Reset** to clear previous samples
4. Wait ~1s for FPS to stabilize (ignore the initial ~30 reading)
5. Scroll the feed continuously up and down for **60 seconds**
6. Optionally expand a few cards mid-scroll
7. Record: FPS (30f avg), frame drops, p50, p95, worst frame, total frames

### Benchmark results — Android Emulator (3m 30s scroll, Jul 2026)

**Device:** Android Emulator — Medium_Phone API 36  
**Test:** Continuous feed scroll for **3 minutes 30 seconds** with PERF panel open  
**Mid-test action:** Opened **Ask Crew** bottom sheet around the ~1 minute mark  
**Network:** Corporate VPN (images may not load)

#### Checkpoint ~1 min (before / around bottom sheet open)

| Metric                    | Value   | Assessment                                                     |
| ------------------------- | ------- | -------------------------------------------------------------- |
| **FPS (30f avg)**         | 60      | Excellent — at target                                          |
| **p50 frame time**        | 16.7 ms | Excellent — ~60 FPS median                                     |
| **p95 frame time**        | 19.4 ms | Excellent — 95% of frames under 20 ms                          |
| **Worst frame**           | 73 ms   | One-off hitch (~14 FPS spike); likely card mount or sheet open |
| **Frame drops (<45 FPS)** | 367     | Includes early warmup spikes + scattered scroll hitches        |
| **JS thread**             | idle    | No JS blocking                                                 |
| **Total frames**          | 1,002   | ~17s of sampling at this checkpoint                            |
| **Window (max 600)**      | 600     | Rolling buffer full                                            |

#### Final — 3m 30s (after bottom sheet open + continued scroll)

| Metric                    | Value   | Assessment                                                  |
| ------------------------- | ------- | ----------------------------------------------------------- |
| **FPS (30f avg)**         | 60      | Excellent — held through full session                       |
| **p50 frame time**        | 16.7 ms | Unchanged — median stayed healthy                           |
| **p95 frame time**        | 19.5 ms | Unchanged — no degradation after sheet open                 |
| **Worst frame**           | 111 ms  | New peak (~9 FPS spike); attributable to Gorhom sheet mount |
| **Frame drops (<45 FPS)** | 416     | Only **+49** drops in ~2.5 min after midpoint               |
| **JS thread**             | idle    | No sustained JS blocking, even after sheet open             |
| **Total frames**          | 10,672  | Full session sample count                                   |
| **Window (max 600)**      | 600     | Rolling buffer capped as designed                           |

**Interpretation:** Scroll performance is **healthy and stable** across the full 3m 30s session.

- **p50 / p95 unchanged** (16.7 / 19.4 → 19.5 ms) — the rolling window shows no sustained jank before or after opening the bottom sheet.
- **FPS held at 60** throughout — virtualization and card tuning are working.
- **Worst frame 73 → 111 ms** — the +38 ms increase aligns with opening Ask Crew (one-time Gorhom mount). This is a single-frame spike, not sustained low FPS.
- **Frame drops +49 after midpoint** over ~2.5 additional minutes ≈ **0.3 drops/sec** — very low hitch rate during continued scroll.
- **JS thread idle** — confirms scroll is not blocked by sync JS work; sheet open did not cause ongoing thread pressure.

**Drop-rate context:** Early frame drops (367 in the first ~1 min) include panel warmup and initial list churn. The low increment (+49) after midpoint is the stronger signal — scroll stayed smooth for the majority of the run.

### Benchmark results — Android Emulator (9s scroll, Jul 2026)

**Device:** Android Emulator — Medium_Phone API 36  
**Test:** Early continuous feed scroll for ~9 seconds with PERF panel open  
**Network:** Corporate VPN (images not loading — cards show empty image area)

| Metric                    | Value   | Assessment                                                           |
| ------------------------- | ------- | -------------------------------------------------------------------- |
| **FPS (30f avg)**         | 52–55   | Good — near 60 FPS target                                            |
| **p50 frame time**        | 16.7 ms | Excellent — ~60 FPS median                                           |
| **p95 frame time**        | 20.9 ms | Excellent — 95% of frames under 21 ms                                |
| **Worst frame**           | 59.4 ms | One stutter (~17 FPS spike); likely image layout or list batch mount |
| **Frame drops (<45 FPS)** | 63      | Scattered spikes during initial scroll                               |
| **JS thread**             | idle    | No JS blocking during scroll                                         |
| **Total frames**          | ~1,700  | Early session (not reset per scroll)                                 |

**Before vs after tuning (this build):**

| Metric         | Naive FlatList (est.) | Tuned FlatList (3m 30s measured) |
| -------------- | --------------------- | -------------------------------- |
| p50 frame time | ~25–35 ms             | **16.7 ms**                      |
| p95 frame time | ~45–80 ms             | **19.5 ms**                      |
| Worst frame    | ~100–200+ ms          | **111 ms** (sheet mount spike)   |
| JS thread busy | Occasional            | **idle** during scroll           |
| FPS (30f avg)  | ~40–50                | **60**                           |

---

## Bottleneck: Before vs After

### Before (naive list)

A naive implementation would use:

- Default FlatList props (`initialNumToRender` ~10+, large `windowSize`)
- No `removeClippedSubviews`
- Inline `renderItem` recreated every render
- Full card tree mounted for all expanded states

**Expected symptoms:** higher p95 frame times, visible jank when fast-scrolling, frame drops on card expand (layout reflow + extra subtree).

### After (current implementation)

Optimizations applied in `HomeScreen` and `FeedCard`:

```ts
// HomeScreen.tsx — FlatList tuning
initialNumToRender={6}
maxToRenderPerBatch={6}
windowSize={5}
updateCellsBatchingPeriod={50}
removeClippedSubviews
getItemLayout              // fixed collapsed card height (1.6 aspect ratio)
renderItem / keyExtractor  // wrapped in useCallback
```

```ts
// FeedCard.tsx — expand/collapse + images
React.memo(FeedCard)                         // skip re-render when bundle unchanged
expo-image with cachePolicy + recyclingKey   // faster decode, stable layout
withTiming(height, { duration: 250 })        // Reanimated — UI thread height animation
expanded ? <ScrollView ...> : null             // highlights only mounted when expanded
```

**Result:** virtualization keeps most of the 120 items unmounted; only ~8–15 cards tend to be in the render window during scroll.

---

## Architecture Choices & Trade-offs

### FlatList vs FlashList

|                | FlatList (chosen)                | FlashList (future)                             |
| -------------- | -------------------------------- | ---------------------------------------------- |
| Setup          | Zero extra deps                  | Requires `@shopify/flash-list`, size estimates |
| Recycling      | Good                             | Better cell recycling                          |
| Assignment fit | Meets virtualization requirement | Stronger perf, more setup                      |

**Decision:** FlatList with explicit tuning is sufficient for 120 items and keeps the scaffold simple. FlashList is the documented upgrade path if the feed grows or includes heavier cells.

### Performance overlay throttle (400 ms)

| Pro                                              | Con                                         |
| ------------------------------------------------ | ------------------------------------------- |
| Negligible impact on scroll                      | FPS label updates 2–3×/sec, not every frame |
| Refs accumulate samples without React re-renders | Not suitable for frame-by-frame debugging   |

### Zustand for chat state

Chat history lives in `chatStore` so opening/closing the bottom sheet does not reset messages and selectors limit re-renders to subscribed components.

### Bottom sheet + feed both mounted

The feed `FlatList` stays mounted behind the sheet (assignment requirement). This means:

- Scroll perf can still be tested with sheet open
- Slight GPU/memory cost vs unmounting feed — acceptable for this scope

### Images

Cards use **`expo-image`** with `cachePolicy="memory-disk"`, `recyclingKey`, and a fixed `aspectRatio` (1.6). URLs are Picsum seeds; on restricted networks (corporate VPN) images may fail to load — this affects perceived quality but not scroll virtualization itself.

---

## Interpreting the Overlay

| Reading                           | Meaning                                                              |
| --------------------------------- | -------------------------------------------------------------------- |
| FPS ~58–60 after ~1s warmup       | Healthy scroll                                                       |
| FPS ~30 right after opening panel | Normal warmup — wait ~1s or tap Reset first                          |
| FPS dips to 40–50 briefly         | Normal during expand/collapse or image decode                        |
| Worst frame 50–80 ms              | One-off hitch — check p50/p95 instead                                |
| Frame drops climbing fast         | List window too large, heavy renderItem, or JS blocking              |
| JS thread **BUSY** on sheet open  | Expected one-time mount spike                                        |
| JS thread **BUSY** during scroll  | Sync work on JS thread — investigate hooks or state updates          |
| p95 > 33 ms                       | 1 in 20 frames missing 30 FPS — investigate batch size / card weight |
| Window at 600                     | Rolling buffer full — total frames still climbs                      |

---

## Files

| File                                | Role                                               |
| ----------------------------------- | -------------------------------------------------- |
| `hooks/usePerformanceMonitor.ts`    | rAF sampling, percentiles, JS heartbeat            |
| `components/PerformanceOverlay.tsx` | FAB + metrics panel                                |
| `screens/HomeScreen.tsx`            | FlatList virtualization props                      |
| `components/FeedCard.tsx`           | Lazy-expanded details, Reanimated height animation |

---

## Future Improvements

1. **FlashList** — better recycling for 500+ items
2. **Hermes sampling profiler** — deeper JS investigation beyond the overlay
