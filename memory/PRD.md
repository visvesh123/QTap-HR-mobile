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

## Changelog (cont.)
- 2026-06-16: **External MU profile integration on OTP login.** After OTP verify, backend calls `https://api-dot-dalmart.el.r.appspot.com/api/v2/profile?phone_number=<phone>` (server-side, httpx, 8s timeout) and:
  - Maps `type` Staff/Student → app role staff/student.
  - Upserts the user in Mongo (keyed by phone; derives email from QID when mail_id is null; new unique sparse `qid` index).
  - BLOCKS login (404/502/504) if the API fails or returns no profile — no silent fallback.
  - Returns enriched user: name, qid, gender, type, phone, designated_locations.
  - Frontend: name flows to all screens via `user.name`; Profile screen shows PROFILE DETAILS card (QID/Type/Gender/Phone); Mark Attendance AUTHORIZED LOCATIONS uses `designated_locations` (falls back to geofences when empty).
  - Files: backend/server.py (otp_verify, _sync_external_profile, _user_public, UserOut), src/auth.tsx (User type), app/(tabs)/profile.tsx, app/modules/attendance.tsx.
  - Tests: backend/tests/test_external_profile_sync.py (5 pass). Note: DEMO_PHONES backfill is now dead code.

## Changelog (cont.)
- 2026-06-16: **Geo-validation Step 1 for Check-In/Out.** New backend proxy `POST /api/attendance/geo-validate` {lat,long,status} → forwards user's QID to `POST {dalmart}/api/v2/attendance/validate/location`. Returns {success,message,venue_id,venue_name,attendance_id,current_state}. Frontend CaptureFlow now: GPS → geo-validate. On success → auto-advance to face rec (shows "You are at <venue_name>"). On failure → red "Location check failed" + API message + Try Again/Cancel; BLOCKS face screen. Files: backend/server.py (GeoValidateIn, attendance_geo_validate), src/api.ts (geoValidate), app/modules/attendance.tsx (LocationStep 4-state UI, fetchLocation gating). Verified block-path live (QT208195 mid-cycle). Face recognition (Step 2) still mocked internally — to be integrated when its API is provided.

## Changelog (cont.)
- 2026-06-16: Geo-validation now calls dalmart DIRECTLY from the frontend (src/api.ts `dalmartGeoValidate`), bypassing FastAPI per user request. CORS on dalmart is open (`access-control-allow-origin: *`). Camera/face screen opens ONLY when response `data.attendance.geo_validation === true` (or `data.status.geo_validation === true`); otherwise blocked with the dalmart message. QID passed from logged-in user (user.qid). Check-In/Out button already dynamic via nextAction (recorded punches). The FastAPI `/api/attendance/geo-validate` proxy + `api.geoValidate` are now unused (kept, harmless). NOTE: dalmart returned a server-side Postgres error "value too long for type character varying(30)" for QT208195 — a dalmart-side bug; success path untestable until fixed/clean state.

## Changelog (cont.)
- 2026-06-17: **Timeline persistence via FastAPI (reversal of the no-storage approach).** Added two backend endpoints (server.py): `POST /api/attendance/timeline` (stores each face-detect punch — status IN/OUT, marked_at UTC, venue, confidence, and the FULL dalmart response in `raw_response`; writes to `db.attendance` with source="dalmart") and `GET /api/attendance/timeline/today` (returns today's check_in_at/check_out_at/venue/work_seconds). Frontend: `applyDalmartPunch` now POSTs each punch to FastAPI (in addition to instant in-memory update), and `reload()` hydrates the Today timeline from `GET /attendance/timeline/today` on screen open — so the timeline now **survives reloads and works cross-device**. IST rendering unchanged (UTC stored, IST displayed). Files: backend/server.py (TimelinePunchIn, attendance_timeline_record, attendance_timeline_today), src/api.ts (timelineRecord, timelineToday), app/modules/attendance.tsx. Also defensively round geo coordinates to 6 decimals in src/api.ts dalmartGeoValidate to avoid overflowing dalmart's varchar(30). Verified end-to-end via curl + live UI (check-in 04:05 UTC → timeline shows 09:35 IST). NOTE: a prior edit accidentally dropped the `@api.get("/attendance/history")` decorator — restored.

## Changelog (cont.)
- 2026-06-16: **Attendance Today tab — two separate buttons + no local storage.** Per user request: (1) **Removed all AsyncStorage** from the attendance flow — today's punch state is now **in-memory only** (resets on app reload/navigation; no persistence). (2) Replaced the single dynamic toggle with **two stacked buttons**: green **Check In** ("Mark your arrival") on top, crimson **Check Out** ("Mark your departure") directly below — both always visible. (3) Status is driven by the button pressed: Check In → `status: 'IN'`, Check Out → `status: 'OUT'`. For BOTH, geo-validate (location) then face-detect APIs are called sequentially (geo success gates the camera/face step). On face success the timeline updates in-memory (check-in time / check-out time, rendered in IST). Files: app/modules/attendance.tsx (removed AsyncStorage import/storageKey/persistence; simplified DToday + applyDalmartPunch to `status`-based; TodayTab renders 2 buttons; verify() drives status from `kind`). Verified: both buttons render on live app, tsc clean.

## Changelog (cont.)
- 2026-06-16: **Attendance Today tab — full dalmart-state-driven punch.** On successful face recognition the ENTIRE dalmart JSON response is persisted on-device (`faceResponse` inside AsyncStorage key `mu_att_<qid>_<date>`). The Check-In/Out button and timeline are now driven purely from the dalmart `current_state`: `CHECKED_IN` → button flips to **Check Out** + sets `checkInAt`; otherwise → **Check In** + sets `checkOutAt`. `face_recognition_marked_at` (UTC) is rendered in **IST (Asia/Kolkata)** on the timeline and result card via a normalize+timeZone formatter (handles naive/Z/offset timestamps). Files: app/modules/attendance.tsx (DToday type, applyDalmartPunch payload, verify current_state mapping, fmtISTTime/fmtISTDate helpers), src/components/AttendanceVisuals.tsx (TodayTimeline IST fmt/toPct). Verified: Today tab renders, IST conversion unit-checked (04:00 UTC → 09:30 IST). Live IN→OUT flip needs a physical device (web has no camera).

## Changelog (cont.)
- 2026-06-16: **Face recognition Step 2 integrated (dalmart).** Camera selfie is POSTed directly (multipart) to `POST {dalmart}/api/v2/attendance/validate/face` with {qid, photo} via `src/api.ts` dalmartFaceValidate (web: base64→Blob; native: {uri,name,type}). On `data.attendance.face_recognition === true`: frontend calls new backend `POST /api/attendance/record-dalmart` {type,marked_at,venue_id,venue_name,confidence,attendance_id,attendance_type} which persists an accepted punch using the dalmart face_recognition_marked_at (UTC) as the timestamp. This drives: (1) Today's Timeline showing the face-recognition time (rendered in device-local = IST on MU phones), (2) Check-In button auto-flipping to Check Out (nextAction from recorded punch). On failure → result shows the dalmart message ("Face not recognized") + Try Again. Verified: record-dalmart + face API via curl, and UI shows CHECK-IN time + "Check Out" button. NOTE: real camera face-match only testable on a physical device with the enrolled face; web has no camera. Old mock api.attendanceCheck path replaced. _attendance_status late/half_day uses UTC hour (minor: status label can be off for IST — display time is correct).
