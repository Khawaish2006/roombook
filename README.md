# RoomBook: Campus Space Booking

A React Native (Expo) app for finding and reserving classrooms, study rooms, seminar halls and labs.
It checks for time-slot conflicts, includes an admin mode, and has three AI features.
Mobile Computing lab project.

## Run it

Requirements: Node 20+ and the **Expo Go** app on your phone (Android or iOS).

```bash
npm install
cp .env.example .env        # then paste your Gemini key (optional, see below)
npx expo start              # scan the QR code with Expo Go
```

Phone and laptop must be on the same Wi-Fi. If they aren't, run `npx expo start --tunnel`.

```bash
npm test            # Jest unit tests (conflict logic, IDs, slots, status, AI sanitiser)
npm run typecheck   # TypeScript
```

### AI key (optional)
1. Get a free key at <https://aistudio.google.com/apikey>.
2. Put it in `.env` as `EXPO_PUBLIC_GEMINI_API_KEY=...`, then restart `npx expo start`.
3. The model name is in `src/config.ts` (`geminiModel`). Change it there if Google retires that model.

**Without a key the app still works.** Every AI feature falls back to a non-AI path, and Profile shows "Fallbacks in use".

## Demo accounts (tap the chips on the login screen)

| Role | Email |
|---|---|
| Student | khushi@college.edu |
| Student | riya@college.edu |
| Admin | admin@college.edu |

On first launch the app seeds 18 rooms and about 25 bookings spread over the past 2 weeks and the next 7 days.
To restore the demo state, use Profile → **Reset demo data**.

## Features

**Student:** dashboard (greeting, quick access, next booking, available now, favourites) · Explore with text search, filter sheet and **AI Smart Search** · room details with today's timeline · month calendar with consecutive multi-slot selection · conflict-checked booking with **Smart Alternatives** · booking ID `RB-YYYYMMDD-NNN` · My Bookings (Upcoming / Completed / Cancelled) · cancel with confirm dialog · favourites · Activity stats with **AI Usage Insight** · local reminders · dark mode.

**Admin:** dashboard (tiles, utilisation today, top 5 rooms this week, today's bookings) · room CRUD with validation · active/maintenance toggle (disabled rooms are hidden from students) · delete blocked when upcoming bookings exist ("Disable instead") · all bookings, filterable by date, room and status, with cancel.

### AI features
| Feature | Where | What the AI does | Fallback |
|---|---|---|---|
| Smart Search | Explore → "✨ Ask RoomBook" | Turns a sentence into filter JSON, which is validated and clamped by `sanitizeParsedQuery`. Results are filtered by **our** conflict logic. | Snackbar, then the manual filter sheet opens |
| Usage Insight | Profile → My activity | Writes 2–3 friendly sentences from **aggregated numbers only** (no names or emails) | Template sentence from the same stats |
| Smart Alternatives | After a booking conflict | Rule-based recommendation heuristic, no API call | n/a (offline by design) |

The AI only interprets or explains. It never decides whether a booking is valid.

## Architecture (for the viva)

```
app/ (screens: UI only, no SQL)
  ↓ hooks/      ViewModels: useRooms, useMyBookings, useFavorites, useStats, useAuth
  ↓ services/   business rules: bookingRules (pure), bookingService, slotService, statusService,
  ↓             alternativesService, statsService, notificationService
  ↓ repositories/  roomRepo, bookingRepo, userRepo, favoriteRepo (all SQL lives here)
  ↓ db/         expo-sqlite: schema, migrations, seed
src/ai/        gemini.ts (fetch + 8 s timeout + errors), parseSearchQuery.ts, usageInsight.ts
```

Key points:
- **Conflict rule:** `aStart < bEnd && bStart < aEnd`. Back-to-back bookings (3–4 and 4–5) are allowed. See `src/services/bookingRules.ts`.
- **Transactional booking:** `createBooking()` runs validation, the room-conflict check, the same-user check and the insert inside a single `withExclusiveTransactionAsync`, so two writes can't take the same slot.
- **Times** are stored as minutes from midnight (15:00 → 900) and dates as `'YYYY-MM-DD'`, which keeps overlap checks simple integer comparisons.
- **Derived status:** "Completed", "Upcoming" and "Starting soon" are computed from the clock and never stored.
- **Reminders:** a local notification is scheduled N minutes before the booking (15/30/60, set in Profile). Its id is kept in AsyncStorage so cancelling a booking also cancels the reminder.

## Manual test checklist
The spec's 14 test cases all map onto the demo data. Some quick ones:
- As **Riya**, open **A-204 → Book now → tomorrow** and tap the red 3:00 PM slot. Khushi holds it, so "Try these instead" appears. The transactional check in `createBooking()` is the backstop if two people race for the same slot.
- As **Khushi**, book any other room tomorrow 3–4 PM. It's rejected with "You already have a booking at this time".
- Book 4–5 PM straight after a 3–4 PM booking. This is allowed (back-to-back).
- Profile → Send test reminder. The notification arrives in 10 s.
- Admin → Rooms → turn A-204 off. It disappears from student Explore, and its detail page shows a banner.
- Turn on airplane mode, then use Smart Search. You get the fallback snackbar and the filters open.

## Notes
- `.npmrc` sets `legacy-peer-deps=true` to get past a react-dom peer conflict from react-native-paper.
- Local notifications work in Expo Go. Remote push isn't used.
- The app targets Android and iOS through Expo Go. Web isn't supported, because exclusive SQLite transactions aren't available there.
