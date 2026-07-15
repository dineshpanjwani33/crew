# Crew

A focused slice of the Crew mobile experience: a high-performance travel discovery feed paired with an AI chat assistant in a bottom sheet.


## Requirements

- Node.js 20+
- Expo Go app on your phone, or Android/iOS simulator

## Setup

```bash
cd crew-app
npm install
npx expo start
```

Then press `i` for iOS simulator, `a` for Android emulator, or scan the QR code with Expo Go.

## Project Structure

```
crew-app/
├── app/                  # Expo Router route files (thin wrappers)
│   ├── _layout.tsx       # Root layout (navigation shell)
│   └── index.tsx         # Default route → Home
├── navigation/           # Route constants, screen options, nav types
├── screens/              # Screen UI components (Home, etc.)
├── components/           # Reusable UI (feed cards, bottom sheet, perf overlay)
├── constants/            # Theme tokens, colors, spacing
├── data/                 # Mock JSON travel bundles
├── hooks/                # Custom hooks (performance monitor, mock AI)
├── store/                # State management (chat history, sheet state)
└── types/                # TypeScript interfaces
```

## Tech Stack

| Area | Choice | Why |
|---|---|---|
| Framework | Expo SDK 57 | Assignment requires Expo v54+ |
| Navigation | Expo Router | File-based routing, assignment requirement |
| List | FlatList | Built-in virtualization; FlashList noted as future optimization |
| State | Zustand | Lightweight chat history + sheet state with minimal re-renders |
| Bottom sheet | @gorhom/bottom-sheet | Snap points, gesture-driven, Reanimated-powered |
| Images | expo-image | Caching, placeholders, explicit dimensions |

## Build Progress

- [x] **Step 1** — Expo project scaffold + folder structure
- [x] **Step 2** — Mock JSON data (100+ travel bundles)
- [x] **Step 3** — Feed card + FlatList virtualization
- [x] **Step 4** — Expandable card details section
- [x] **Step 5** — Performance overlay (FPS, frame drops, p50/p95)
- [x] **Step 6** — AI bottom sheet + mock chat streaming
- [x] **Step 7** — Polish, PERFORMANCE.md (demo video pending)

## Performance

See [PERFORMANCE.md](./PERFORMANCE.md) for methodology, FlatList tuning, overlay metrics, and benchmark instructions.

## Known Limitations

- Images use simple Picsum seed URLs — may not load on corporate VPN; test on unrestricted network or mobile data
- FlatList used instead of FlashList; documented upgrade path in [PERFORMANCE.md](./PERFORMANCE.md)
- Demo video not yet recorded — see benchmark steps in PERFORMANCE.md

## License

MIT
