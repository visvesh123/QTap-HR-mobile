"""
Mahindra University Campus Hub — Backend E2E Tests
Covers: auth, multi-punch attendance toggle, today/history/stats/geofences,
admin dashboard, mess list.
"""
import os
import time
import pytest
import requests
from datetime import datetime, timezone

BASE_URL = os.environ.get("EXPO_PUBLIC_BACKEND_URL", "").rstrip("/")
if not BASE_URL:
    # Fallback: read from frontend env file for local convenience
    raise RuntimeError("EXPO_PUBLIC_BACKEND_URL must be set in environment")

API = f"{BASE_URL}/api"

DEMO_ACCOUNTS = [
    ("student@mahindrauniversity.edu.in",  "student123",  "student"),
    ("student2@mahindrauniversity.edu.in", "student123",  "student"),
    ("faculty@mahindrauniversity.edu.in",  "faculty123",  "staff"),
    ("librarian@mahindrauniversity.edu.in","librarian123","staff"),
    ("warden@mahindrauniversity.edu.in",   "warden123",   "staff"),
    ("security@mahindrauniversity.edu.in", "security123", "staff"),
    ("exam@mahindrauniversity.edu.in",     "exam123",     "staff"),
    ("admin@mahindrauniversity.edu.in",    "admin123",    "admin"),
]


@pytest.fixture(scope="session")
def session():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


def _login(session, email, password):
    r = session.post(f"{API}/auth/login", json={"email": email, "password": password}, timeout=20)
    return r


@pytest.fixture(scope="session")
def faculty_token(session):
    r = _login(session, "faculty@mahindrauniversity.edu.in", "faculty123")
    assert r.status_code == 200, f"faculty login failed: {r.status_code} {r.text}"
    return r.json()["token"]


@pytest.fixture(scope="session")
def admin_token(session):
    r = _login(session, "admin@mahindrauniversity.edu.in", "admin123")
    assert r.status_code == 200, f"admin login failed: {r.status_code} {r.text}"
    return r.json()["token"]


def auth(tok):
    return {"Authorization": f"Bearer {tok}", "Content-Type": "application/json"}


# ---------- AUTH ----------
class TestAuth:
    @pytest.mark.parametrize("email,pwd,role", DEMO_ACCOUNTS)
    def test_login_all_demo_accounts(self, session, email, pwd, role):
        r = _login(session, email, pwd)
        assert r.status_code == 200, f"{email}: {r.status_code} {r.text}"
        data = r.json()
        assert "token" in data and isinstance(data["token"], str)
        assert "user" in data
        u = data["user"]
        assert u["email"] == email
        assert "role" in u

    def test_login_wrong_password(self, session):
        r = _login(session, "faculty@mahindrauniversity.edu.in", "wrong-password")
        assert r.status_code in (400, 401, 403), f"expected auth failure, got {r.status_code}"

    def test_auth_me(self, session, faculty_token):
        r = session.get(f"{API}/auth/me", headers=auth(faculty_token), timeout=15)
        assert r.status_code == 200, r.text
        u = r.json()
        assert u["email"] == "faculty@mahindrauniversity.edu.in"
        assert "role" in u and "name" in u
        # Ensure no Mongo _id leaks
        assert "_id" not in u

    def test_auth_me_no_token(self, session):
        r = session.get(f"{API}/auth/me", timeout=10)
        assert r.status_code in (401, 403)


# ---------- ATTENDANCE MULTI-PUNCH (critical) ----------
class TestAttendanceMultiPunch:
    """Send IN, OUT, IN to the same staff user and verify the toggle behavior."""

    @pytest.fixture(scope="class")
    def punches(self, session, faculty_token):
        # Reset history for predictable test? Not strictly required since logic only
        # cares about TODAY events. Still, we record the count before.
        h0 = session.get(f"{API}/attendance/history", headers=auth(faculty_token)).json()
        today_str = datetime.now(timezone.utc).strftime("%Y-%m-%d")
        baseline_today = [e for e in h0 if str(e.get("timestamp", "")).startswith(today_str)]

        results = []
        for kind in ("in", "out", "in"):
            payload = {
                "type": kind,
                "attendance_type": "office",
                "latitude": 17.5234,
                "longitude": 78.3941,
                "accuracy_m": 8,
                "selfie_b64": "placeholder",
                "is_mock_location": False,
            }
            r = session.post(f"{API}/attendance/check", headers=auth(faculty_token), json=payload, timeout=20)
            assert r.status_code == 200, f"check {kind}: {r.status_code} {r.text}"
            results.append(r.json())
            time.sleep(1.2)  # ensure distinct timestamps & ordering
        return {"results": results, "baseline_today": baseline_today, "today_str": today_str}

    def test_all_three_punches_accepted(self, punches):
        for i, rec in enumerate(punches["results"]):
            assert rec.get("accepted") is True, (
                f"punch #{i} ({rec.get('type')}) not accepted: {rec.get('rejection_reason')} face={rec.get('face_score')}"
            )
            assert rec.get("inside_geofence") is True
            assert "id" in rec and "timestamp" in rec
            assert "_id" not in rec  # ObjectId must not leak

    def test_attendance_today_reflects_first_in_and_last_out(self, session, faculty_token, punches):
        r = session.get(f"{API}/attendance/today", headers=auth(faculty_token), timeout=15)
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["check_in"], "today.check_in must exist"
        assert data["check_in"]["type"] == "in" and data["check_in"]["accepted"] is True
        # check_out (last accepted 'out'). In our sequence we did in,out,in -> last out is the middle event
        assert data["check_out"], "today.check_out must exist"
        assert data["check_out"]["type"] == "out" and data["check_out"]["accepted"] is True
        # check_in timestamp should be earliest, check_out timestamp must be after the first in
        assert data["check_in"]["timestamp"] <= data["check_out"]["timestamp"]
        assert isinstance(data.get("events"), list) and len(data["events"]) >= 3

    def test_history_sorted_desc_and_types(self, session, faculty_token):
        r = session.get(f"{API}/attendance/history", headers=auth(faculty_token), timeout=15)
        assert r.status_code == 200
        items = r.json()
        assert isinstance(items, list) and len(items) >= 3
        # Sorted desc
        ts = [it["timestamp"] for it in items]
        assert ts == sorted(ts, reverse=True), "history must be desc by timestamp"
        # Each event has type in {'in','out'}
        for it in items:
            assert it["type"] in ("in", "out")
            assert "_id" not in it

    def test_lastEventToday_logic_matches_frontend(self, session, faculty_token, punches):
        """Mirror frontend logic: lastEventToday should be 'in' after in,out,in sequence,
        which means the NEXT toggle action in UI is 'out' (Check Out)."""
        r = session.get(f"{API}/attendance/history", headers=auth(faculty_token)).json()
        today_str = punches["today_str"]
        today_events = [e for e in r if e.get("accepted") and str(e.get("timestamp", "")).startswith(today_str)]
        today_events.sort(key=lambda x: x["timestamp"], reverse=True)
        assert today_events, "expected today events"
        last = today_events[0]
        assert last["type"] == "in", f"after in,out,in last event must be 'in', got {last['type']}"


# ---------- ATTENDANCE OTHER ENDPOINTS ----------
class TestAttendanceMisc:
    def test_geofences(self, session, faculty_token):
        r = session.get(f"{API}/attendance/geofences", headers=auth(faculty_token), timeout=15)
        assert r.status_code == 200
        fences = r.json()
        assert isinstance(fences, list) and len(fences) >= 1
        for f in fences:
            assert "id" in f and "name" in f and "type" in f

    def test_stats_monthly(self, session, faculty_token):
        r = session.get(f"{API}/attendance/stats", headers=auth(faculty_token), timeout=15)
        assert r.status_code == 200, r.text
        s = r.json()
        # Just sanity-check keys exist
        assert isinstance(s, dict)
        assert any(k in s for k in ("attendance_pct", "present_days", "days"))


# ---------- ADMIN + MESS ----------
class TestAdminAndMess:
    def test_admin_dashboard_admin(self, session, admin_token):
        r = session.get(f"{API}/admin/dashboard", headers=auth(admin_token), timeout=20)
        assert r.status_code == 200, r.text
        assert isinstance(r.json(), dict)

    def test_admin_dashboard_forbidden_for_staff(self, session, faculty_token):
        r = session.get(f"{API}/admin/dashboard", headers=auth(faculty_token), timeout=15)
        assert r.status_code in (401, 403)

    def test_mess_list(self, session, faculty_token):
        r = session.get(f"{API}/mess/list", headers=auth(faculty_token), timeout=15)
        assert r.status_code == 200, r.text
        data = r.json()
        # Could be list or dict-with-list
        if isinstance(data, dict):
            assert any(isinstance(v, list) for v in data.values())
        else:
            assert isinstance(data, list)
