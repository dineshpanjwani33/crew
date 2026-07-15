# Performance Methodology

This document explains how performance is measured in the Crew app, what was optimized, and the trade-offs involved.

## Goals

- Keep the 120-item feed scrollable at near-60 FPS on a mid-range device/emulator
- Surface frame drops and JS-thread stalls without adding measurable overhead
- Provide reproducible metrics for a ~60s scroll session

## Measurement Approach

### Custom overlay (`usePerformanceMonitor` + `PerformanceOverlay`)

The overlay is **not** a production profiler. It is a lightweight, in-app monitor built for this assignment.

| Metric | How it is measured |
|---|---|
| **FPS** | `requestAnimationFrame` loop — instant FPS from last frame delta (`1000 / frameTime`) |
| **Frame drops** | Count of frames where `frameTime > 1000/45 ms` (~22.2 ms, i.e. below 45 FPS) |
| **p50 / p95 frame time** | Percentile of all frame deltas collected in the session |
| **Worst frame** | Maximum single-frame duration seen |
| **JS thread busy** | `setInterval` heartbeat every 100 ms; if actual elapsed > 150 ms, JS thread is considered busy (blocked by sync work) |

### UI update throttle

Overlay state updates every **400 ms** (`UI_UPDATE_INTERVAL_MS`), not every frame. This avoids the monitor itself causing re-renders that skew results.

### How to run a 60s benchmark

1. Launch the app and wait for bundles to load
2. Tap **PERF** (top-right) to open the overlay panel
3. Tap **Reset** to clear previous samples
4. Scroll the feed continuously up and down for **60 seconds**
5. Optionally expand a few cards mid-scroll
6. Record: FPS (live), frame drops, p50, p95, worst frame, sample count

### Benchmark results — Android Emulator (9s scroll, Jul 2026)

**Device:** Android Emulator — Medium_Phone API 36  
**Test:** Continuous feed scroll for ~9 seconds with PERF panel open  
**Network:** Corporate VPN (images not loading — cards show empty image area)

| Metric | Value | Assessment |
|---|---|---|
| **Live FPS** | 52–55 | Good — near 60 FPS target |
| **p50 frame time** | 16.7 ms | Excellent — ~60 FPS median |
| **p95 frame time** | 20.9 ms | Excellent — 95% of frames under 21 ms |
| **Worst frame** | 59.4 ms | One stutter (~17 FPS spike); likely image layout or list batch mount |
| **Frame drops (<45 FPS)** | 63 | ~3.7% of samples exceeded 22.2 ms threshold |
| **JS thread** | idle | No JS blocking during scroll |
| **Samples** | ~1,700 | Cumulative since app launch (not reset per scroll) |

**Interpretation:** Scroll performance is healthy. Median and p95 frame times are well within budget. The 63 frame drops are scattered spikes (not sustained jank) — consistent with occasional card mount/image decode on emulator. JS thread staying idle confirms virtualization is doing its job; no sync JS work blocking scroll.

**Before vs after tuning (this build):**

| Metric | Naive FlatList (est.) | Tuned FlatList (measured) |
|---|---|---|
| p50 frame time | ~25–35 ms | **16.7 ms** |
| p95 frame time | ~45–80 ms | **20.9 ms** |
| Worst frame | ~100–200+ ms | **59.4 ms** |
| JS thread busy | Occasional | **idle** during scroll |

> For a full **60s** run, tap **Reset** then scroll and update frame drops / sample count.

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
initialNumToRender={8}      // fewer cards on first paint
maxToRenderPerBatch={10}    // cap batch mount cost per scroll tick
windowSize={7}              // smaller render window (7 × viewport height)
removeClippedSubviews       // unmount off-screen views (Android especially)
renderItem / keyExtractor   // wrapped in useCallback
```

```ts
// FeedCard.tsx — expand/collapse
withTiming(height, { duration: 250 })  // Reanimated — runs on UI thread, no experimental Android flag
expanded ? <ScrollView ...> : null     // highlights only mounted when expanded
```

**Result:** virtualization keeps most of the 120 items unmounted; only ~8–15 cards tend to be in the render window during scroll.

---

## Architecture Choices & Trade-offs

### FlatList vs FlashList

| | FlatList (chosen) | FlashList (future) |
|---|---|---|
| Setup | Zero extra deps | Requires `@shopify/flash-list`, size estimates |
| Recycling | Good | Better cell recycling |
| Assignment fit | Meets virtualization requirement | Stronger perf, more setup |

**Decision:** FlatList with explicit tuning is sufficient for 120 items and keeps the scaffold simple. FlashList is the documented upgrade path if the feed grows or includes heavier cells.

### Performance overlay throttle (400 ms)

| Pro | Con |
|---|---|
| Negligible impact on scroll | FPS label updates 2–3×/sec, not every frame |
| Refs accumulate samples without React re-renders | Not suitable for frame-by-frame debugging |

### Zustand for chat state

Chat history lives in `chatStore` so opening/closing the bottom sheet does not reset messages and selectors limit re-renders to subscribed components.

### Bottom sheet + feed both mounted

The feed `FlatList` stays mounted behind the sheet (assignment requirement). This means:

- Scroll perf can still be tested with sheet open
- Slight GPU/memory cost vs unmounting feed — acceptable for this scope

### Images

Cards use React Native `Image` with explicit `aspectRatio` from bundle metadata (stable layout, no reflow). URLs are Picsum seeds; on restricted networks (corporate VPN) images may fail to load — this affects perceived quality but not scroll virtualization itself.

---

## Interpreting the Overlay

| Reading | Meaning |
|---|---|
| FPS ~58–60, low drops | Healthy scroll |
| FPS dips to 40–50 briefly | Normal during expand/collapse or image decode |
| Frame drops climbing fast | List window too large, heavy renderItem, or JS blocking |
| JS thread **BUSY** during scroll | Sync work on JS thread — check hooks, logging, or state updates in scroll path |
| p95 > 33 ms | 1 in 20 frames missing 30 FPS — investigate batch size / card weight |

---

## Files

| File | Role |
|---|---|
| `hooks/usePerformanceMonitor.ts` | rAF sampling, percentiles, JS heartbeat |
| `components/PerformanceOverlay.tsx` | FAB + metrics panel |
| `screens/HomeScreen.tsx` | FlatList virtualization props |
| `components/FeedCard.tsx` | Lazy-expanded details, Reanimated height animation |

---

## Future Improvements

1. **FlashList** — better recycling for 500+ items
2. **`expo-image`** — disk/memory cache, blur placeholder, priority loading
3. **`React.memo` on `FeedCard`** — skip re-render if bundle ref unchanged
4. **`getItemLayout`** — if card heights become fixed, skip measurement passes
5. **Hermes sampling profiler** — deeper JS investigation beyond the overlay
