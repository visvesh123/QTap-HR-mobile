# Campus Hub — Product Requirements

A unified mobile super-app for universities, modeled after the Adani OneApp pattern,
delivering all non-academic services in a single role-based experience for
Students, Staff (multi-dept) and Admin.

## Stakeholders / Roles
- **Student** – academic, library, hostel, events, wallet, parcels, gate pass, alerts, SOS
- **Staff** – Faculty, Librarian, Hostel Warden, Security, Examination Cell (department-scoped tools)
- **Admin** – University-wide oversight, analytics, SOS monitoring

## Implemented Modules (all 10)
1. **Examinations** – Digital hall ticket card with QR, RFID attendance log, exam schedule, instructions, results
2. **Visitor Management** – Faculty pre-approval form, QR pass generation, face-validation note, list
3. **Staff Attendance** – Live geolocation check-in/out, anti-proxy distance check, history
4. **Library** – Book search, issue (Koha-style), my issues, RFID library pass with QR
5. **Hostel** – Allotment card, roommates, facilities, complaints workflow, warden view
6. **Events & Clubs** – Event browser with images, registration, my events, certificates gallery
7. **Campus Communication** – Role-targeted alerts feed, prominent SOS button on every screen
8. **Parcel Management** – Inbox, pickup QR for verification, collect flow
9. **Campus Wallet** – Balance, transactions, reward points, rewards store
10. **Gate Access** – Personal RFID/QR pass card, entry/exit logs (admin/security view)

Plus: Login (role-gated), Splash, Role select, Profile/Settings, Admin Console with live KPIs.

## Tech
- Frontend: Expo SDK 54, expo-router, react-native-reanimated, expo-linear-gradient, expo-location, react-native-qrcode-svg, AsyncStorage
- Backend: FastAPI, MongoDB (motor), bcrypt, PyJWT
- Design: Purple/magenta jewel theme (#7D3ECF), service-tile grids, gradient hero cards, pill tabs

## Smart enhancement (revenue/engagement)
- Campus Wallet + Reward Points + Rewards Store provides a closed-loop transactional layer.
  Universities can monetize via top-up margins, sponsored rewards, and merchant tie-ins; students
  earn points for events/attendance which drives ongoing app engagement.

## Demo accounts
See `/app/memory/test_credentials.md`.

## Changelog
- 2026-06-16: Attendance History redesigned from "weekly streak" to an **Apple-style month calendar** (`/app/frontend/app/modules/attendance.tsx`). Month grid with today highlighted in filled crimson circle, colored status dots per day (Present/Late/WFH/Absent), tappable days with selection ring, prev/next month nav, and a selected-day detail card. Also fixed a render crash from an undefined `WeekStreak` reference.
- Pending: Sora font not applying on web (P0); Leave module native date picker + Admin approval flow (P1).
