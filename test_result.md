#====================================================================================================
# START - Testing Protocol - DO NOT EDIT OR REMOVE THIS SECTION
#====================================================================================================

# THIS SECTION CONTAINS CRITICAL TESTING INSTRUCTIONS FOR BOTH AGENTS
# BOTH MAIN_AGENT AND TESTING_AGENT MUST PRESERVE THIS ENTIRE BLOCK

# Communication Protocol:
# If the `testing_agent` is available, main agent should delegate all testing tasks to it.
#
# You have access to a file called `test_result.md`. This file contains the complete testing state
# and history, and is the primary means of communication between main and the testing agent.
#
# Main and testing agents must follow this exact format to maintain testing data. 
# The testing data must be entered in yaml format Below is the data structure:
# 
## user_problem_statement: {problem_statement}
## backend:
##   - task: "Task name"
##     implemented: true
##     working: true  # or false or "NA"
##     file: "file_path.py"
##     stuck_count: 0
##     priority: "high"  # or "medium" or "low"
##     needs_retesting: false
##     status_history:
##         -working: true  # or false or "NA"
##         -agent: "main"  # or "testing" or "user"
##         -comment: "Detailed comment about status"
##
## frontend:
##   - task: "Task name"
##     implemented: true
##     working: true  # or false or "NA"
##     file: "file_path.js"
##     stuck_count: 0
##     priority: "high"  # or "medium" or "low"
##     needs_retesting: false
##     status_history:
##         -working: true  # or false or "NA"
##         -agent: "main"  # or "testing" or "user"
##         -comment: "Detailed comment about status"
##
## metadata:
##   created_by: "main_agent"
##   version: "1.0"
##   test_sequence: 0
##   run_ui: false
##
## test_plan:
##   current_focus:
##     - "Task name 1"
##     - "Task name 2"
##   stuck_tasks:
##     - "Task name with persistent issues"
##   test_all: false
##   test_priority: "high_first"  # or "sequential" or "stuck_first"
##
## agent_communication:
##     -agent: "main"  # or "testing" or "user"
##     -message: "Communication message between agents"

# Protocol Guidelines for Main agent
#
# 1. Update Test Result File Before Testing:
#    - Main agent must always update the `test_result.md` file before calling the testing agent
#    - Add implementation details to the status_history
#    - Set `needs_retesting` to true for tasks that need testing
#    - Update the `test_plan` section to guide testing priorities
#    - Add a message to `agent_communication` explaining what you've done
#
# 2. Incorporate User Feedback:
#    - When a user provides feedback that something is or isn't working, add this information to the relevant task's status_history
#    - Update the working status based on user feedback
#    - If a user reports an issue with a task that was marked as working, increment the stuck_count
#    - Whenever user reports issue in the app, if we have testing agent and task_result.md file so find the appropriate task for that and append in status_history of that task to contain the user concern and problem as well 
#
# 3. Track Stuck Tasks:
#    - Monitor which tasks have high stuck_count values or where you are fixing same issue again and again, analyze that when you read task_result.md
#    - For persistent issues, use websearch tool to find solutions
#    - Pay special attention to tasks in the stuck_tasks list
#    - When you fix an issue with a stuck task, don't reset the stuck_count until the testing agent confirms it's working
#
# 4. Provide Context to Testing Agent:
#    - When calling the testing agent, provide clear instructions about:
#      - Which tasks need testing (reference the test_plan)
#      - Any authentication details or configuration needed
#      - Specific test scenarios to focus on
#      - Any known issues or edge cases to verify
#
# 5. Call the testing agent with specific instructions referring to test_result.md
#
# IMPORTANT: Main agent must ALWAYS update test_result.md BEFORE calling the testing agent, as it relies on this file to understand what to test next.

#====================================================================================================
# END - Testing Protocol - DO NOT EDIT OR REMOVE THIS SECTION
#====================================================================================================



#====================================================================================================
# Testing Data - Main Agent and testing sub agent both should log testing data below this section
#====================================================================================================

user_problem_statement: |
  Mahindra University campus management app. LATEST request:
  Single unified login page for ALL users with THREE methods:
  (1) Email/Password, (2) Login with OTP (mock OTP to mobile, code 123456),
  (3) Sign in with Microsoft (MOCK SSO -> demo account). Demo accounts kept,
  collapsed into a "Demo logins" section. Removed the separate role-select screen
  (app now opens directly on /login; role is derived from the account).

backend:
  - task: "Mock OTP login /api/auth/otp/request + /api/auth/otp/verify"
    implemented: true
    working: "NA"
    file: "backend/server.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
        -working: "NA"
        -agent: "main"
        -comment: "MOCK OTP (no real SMS). /otp/request validates 10-digit phone, returns demo_otp=123456 and a masked message. /otp/verify checks code==123456, resolves user by phone (DEMO_PHONES backfilled on seeded users via startup), else falls back to primary student. Returns same {token,user} shape as /auth/login. Verify: faculty phone 9876500010 -> faculty staff; unknown number -> student; wrong code -> 401."

  - task: "Mock Microsoft SSO /api/auth/microsoft"
    implemented: true
    working: "NA"
    file: "backend/server.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
        -working: "NA"
        -agent: "main"
        -comment: "MOCK SSO (no Azure keys). POST {} -> signs into primary student account, returns {token,user}. Optional email param signs into that seeded account."

  - task: "Phone backfill + sparse unique phone index on startup"
    implemented: true
    working: "NA"
    file: "backend/server.py"
    stuck_count: 0
    priority: "medium"
    needs_retesting: true
    status_history:
        -working: "NA"
        -agent: "main"
        -comment: "Idempotent $set of DEMO_PHONES on existing seeded users; create_index phone sparse unique. Sanity: existing 8 demo accounts still login with password."

frontend:
  - task: "Unified single login page (Password + OTP + Microsoft + collapsible Demo logins)"
    implemented: true
    working: "NA"
    file: "frontend/app/login.tsx"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
        -working: "NA"
        -agent: "main"
        -comment: "Rewrote login.tsx. Segmented control Password/OTP (testID method-password, method-otp). Password flow unchanged (email-input, password-input, login-button). OTP flow: phone-input -> send-otp-button -> otp-input -> verify-otp-button (also change-number, resend-otp). Microsoft button (testID microsoft-button) calls mock SSO. Demo logins collapsed behind demo-toggle; expands demo-accounts with demo-go-<email> one-tap cards. Removed role param + back button. Verify all flows land on /(tabs)."

  - task: "Removed role-select; app opens on /login; logout redirects to /login"
    implemented: true
    working: "NA"
    file: "frontend/app/index.tsx, app/(tabs)/profile.tsx, src/components/AdminShell.tsx"
    stuck_count: 0
    priority: "medium"
    needs_retesting: true
    status_history:
        -working: "NA"
        -agent: "main"
        -comment: "index splash now routes unauthenticated users to /login. Profile Sign Out and AdminShell logout redirect to /login. Verify logout returns to the unified login page."
  - task: "Attendance multi-punch /api/attendance/check"
    implemented: true
    working: "NA"
    file: "backend/server.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
        -working: "NA"
        -agent: "main"
        -comment: "Backend already supports multi-punch (no duplicate guard). Just needs verification: faculty user can POST /api/attendance/check with type=in then type=out then type=in again, all accepted when inside geofence + face passes."

  - task: "/api/attendance/today aggregation"
    implemented: true
    working: "NA"
    file: "backend/server.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
        -working: "NA"
        -agent: "main"
        -comment: "Returns first check_in and last check_out for today. Should remain correct after multiple punches."

  - task: "/api/attendance/history for multi-punch derivation"
    implemented: true
    working: "NA"
    file: "backend/server.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
        -working: "NA"
        -agent: "main"
        -comment: "Frontend reads history to derive lastEventToday for multi-punch. History should return events sorted by timestamp desc, with type and accepted fields."

  - task: "Auth /api/auth/login + demo accounts"
    implemented: true
    working: "NA"
    file: "backend/server.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
        -working: "NA"
        -agent: "main"
        -comment: "Sanity verify all 8 demo accounts still log in (student, faculty, librarian, warden, security, exam, admin)."

frontend:
  - task: "Claymorphism Login screen redesign"
    implemented: true
    working: "NA"
    file: "frontend/app/login.tsx"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
        -working: "NA"
        -agent: "main"
        -comment: "Rewrote login.tsx using ClayCard, ClayInput, ClayLabel components. Branded crimson/gold palette on warm cream background. Demo cards are clay surfaces with avatar + clay shadow. Verify login still functions for all roles."

  - task: "Claymorphism Home tab visual refresh"
    implemented: true
    working: "NA"
    file: "frontend/app/(tabs)/index.tsx"
    stuck_count: 0
    priority: "medium"
    needs_retesting: true
    status_history:
        -working: "NA"
        -agent: "main"
        -comment: "Updated styles to use clay surfaces, larger radii (clay 26px), pastel quick-action icons. Hero kept brand crimson gradient."

  - task: "Claymorphism Attendance screen + Single toggle button"
    implemented: true
    working: "NA"
    file: "frontend/app/modules/attendance.tsx"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
        -working: "NA"
        -agent: "main"
        -comment: "MAJOR CHANGE: Replaced two side-by-side Check-In/Check-Out buttons with a SINGLE TOGGLE button that switches color and label based on lastEventToday derived from history. Multi-punch: user can check in -> check out -> check in -> check out unlimited times. Hero shows PUNCH count and last punch time. Cards converted to clay style with crimson primary chips for attendance type. Verify: (1) Initial state shows green Check-In, (2) After Check-In completes, button toggles to crimson Check-Out and hero updates to 'Currently checked in · 1 PUNCH'. (3) After Check-Out, button toggles back to green Check-In with 'Re-punch · Welcome back' subtitle. (4) Multi-punch hint visible after first punch."

  - task: "Clay component primitives (ClayCard, ClayButton, ClayInput, ClayLabel, ClayStat)"
    implemented: true
    working: "NA"
    file: "frontend/src/components/Clay.tsx"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
        -working: "NA"
        -agent: "main"
        -comment: "Added ClayInput (inset pressed look) and ClayLabel (uppercase tracked). Verify components render correctly with Platform.select shadows (web uses boxShadow recipes, native uses shadowColor)."

  - task: "Routing & 10 module placeholders sanity"
    implemented: true
    working: "NA"
    file: "frontend/app/modules/*"
    stuck_count: 0
    priority: "medium"
    needs_retesting: true
    status_history:
        -working: "NA"
        -agent: "main"
        -comment: "Inherited pending task from earlier fork — never fully validated E2E. Modules: examinations, library, hostel, gate, wallet, parcel, visitor, events, communication, sos, mess, map, attendance, admin."

  - task: "HR Admin Web Portal (/admin/*)"
    implemented: true
    working: "NA"
    file: "frontend/app/admin/*"
    stuck_count: 0
    priority: "medium"
    needs_retesting: true
    status_history:
        -working: "NA"
        -agent: "main"
        -comment: "Desktop-first admin pages: dashboard, attendance, employees, geofences, reports. Verify each loads with admin credentials."

metadata:
  created_by: "main_agent"
  version: "1.1"
  test_sequence: 1
  run_ui: true

test_plan:
  current_focus:
    - "Claymorphism Attendance screen + Single toggle button"
    - "Claymorphism Login screen redesign"
    - "Attendance multi-punch /api/attendance/check"
    - "/api/attendance/today aggregation"
    - "/api/attendance/history for multi-punch derivation"
    - "Routing & 10 module placeholders sanity"
  stuck_tasks: []
  test_all: false
  test_priority: "high_first"

frontend:
  - task: "Services screen minimalist 3-column tiles (shadow + border fix)"
    implemented: true
    working: "NA"
    file: "frontend/app/(tabs)/services.tsx"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
        -working: "NA"
        -agent: "main"
        -comment: "Redesigned Services tab to a minimalist 3-column white-tile grid (crimson icons, label bottom-left), matching Home palette. USER BUG: tiles showed no shadow/border on web. ROOT CAUSE: tile had overflow:'hidden' which clipped the web box-shadow. FIX: removed overflow:'hidden', added borderWidth:1 borderColor #EEEFF1, and stronger SOFT shadow (web boxShadow dual-layer). Active tiles: service-tile-attendance, service-tile-tickets navigate on press. Upcoming (leave/visitor/mess) are dimmed (opacity 0.55), disabled, with a small pulsing red dot badge. Verify: (1) all 5 tiles render in a 3-col grid with visible border + drop shadow, (2) Mark Attendance tile -> /modules/attendance, (3) Tickets tile -> /modules/tickets, (4) upcoming tiles are non-clickable."

  - task: "Sora font on native (Expo Go iPhone) — fontWeight conflict fix"
    implemented: true
    working: "NA"
    file: "frontend/src/font.ts"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
        -working: "NA"
        -agent: "main"
        -comment: "USER BUG: Sora font not showing in Expo Go on iPhone (renders system font). ROOT CAUSE: native Text.render patch injected a named Sora variant (e.g. 'Sora-ExtraBold') but KEPT the numeric fontWeight (800). On iOS each weight is a separate font family, so 'Sora-ExtraBold' + fontWeight 800 makes iOS look for a bolder face of that variant, fails, and silently falls back to system font. FIX: in applyNativePatch, strip fontWeight from the merged style so the family name alone carries the weight. Web path unchanged (CSS @font-face). Verified web has NO regression (heading computes 'Sora' weight 800, icons still 'ionicons', all tabs render). Native validation requires a real device/Expo Go."

agent_communication:
    -agent: "main"
    -message: |
      NEW (font): Fixed Sora not rendering on native iOS (Expo Go). Only src/font.ts changed — native patch now drops fontWeight when injecting the Sora variant (iOS family+weight conflict). Please run a FRONTEND WEB REGRESSION check only: login via OTP (phone 9059721442, code 123456), then confirm Home, Services, Alerts, Profile, Mess, and Mark Attendance all render correctly, text uses Sora, and ALL icons (bottom tabs, service tiles, etc.) still render as glyphs (NOT missing-glyph boxes / tofu). This guards against the shared font.ts change breaking web. NOTE: the actual iPhone Expo Go fix cannot be validated in browser automation — flag that for the user. No backend changes. Login via OTP: phone 9059721442, code 123456 (mock auth). Then tap the bottom 'Services' tab. Verify the 3-column service tiles render with a visible border line AND drop shadow (this was the reported bug — overflow:hidden was clipping the shadow on web; now fixed). Confirm 'Mark Attendance' (testID service-tile-attendance) navigates to /modules/attendance and 'Tickets' (testID service-tile-tickets) navigates to /modules/tickets. Upcoming tiles (Leaves/Visitors/Mess) should be dimmed and non-clickable. No backend changes. Earlier focus tasks below are stale — only test the Services tiles.
    -message_old: |
      Implemented branded Claymorphism showcase on Login, Home, and Attendance screens.
      Most important behavior change: Attendance now has ONE toggle button (green Check-In or
      crimson Check-Out) driven by lastEventToday derived from /api/attendance/history.
      The button cycles unlimited times (multi-punch). Please:
      1. Run backend tests for /api/attendance/check, /today, /history, /stats, /auth/login.
      2. Run frontend tests focusing on Attendance multi-punch flow:
         a. login as faculty@mahindrauniversity.edu.in / faculty123
         b. open /modules/attendance
         c. verify single big toggle button "Check In" is visible (testID="action-in")
         d. click it → modal opens → click snap-btn → wait 3s → click result-done
         e. verify the button NOW shows "Check Out" (testID="action-out") and hero shows "Currently checked in · 1 PUNCH"
         f. click Check Out → snap → done
         g. verify button toggles BACK to "Check In" (testID="action-in") with subtitle "Re-punch · Welcome back" and hero shows "2 PUNCHES"
         h. repeat once more (in → out) → verify "4 PUNCHES" badge appears in hero
      3. Sanity test that login still works for all 8 demo accounts.
      4. Sanity test that admin can navigate to /admin and see dashboard.
      Demo creds in /app/memory/test_credentials.md
