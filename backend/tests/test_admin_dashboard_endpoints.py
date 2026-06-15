"""Sanity tests for HR Admin Portal endpoints used by /admin dashboard."""
import os
import pytest
import requests

BASE_URL = os.environ.get("EXPO_PUBLIC_BACKEND_URL", "").rstrip("/")
if not BASE_URL:
    raise RuntimeError("EXPO_PUBLIC_BACKEND_URL must be set")
API = f"{BASE_URL}/api"


@pytest.fixture(scope="module")
def admin_token():
    r = requests.post(f"{API}/auth/login",
                      json={"email": "admin@mahindrauniversity.edu.in", "password": "admin123"},
                      timeout=15)
    assert r.status_code == 200, r.text
    return r.json()["token"]


def H(tok):
    return {"Authorization": f"Bearer {tok}", "Content-Type": "application/json"}


class TestAdminDashboardEndpoints:
    def test_admin_dashboard_shape(self, admin_token):
        r = requests.get(f"{API}/admin/dashboard", headers=H(admin_token), timeout=15)
        assert r.status_code == 200
        d = r.json()
        assert isinstance(d, dict)
        # Common keys used by the dashboard UI
        for k in ("total_students",):
            assert k in d, f"missing key {k} in dashboard: {list(d.keys())}"
        # No ObjectId leak
        assert "_id" not in d

    def test_admin_attendance_trend(self, admin_token):
        r = requests.get(f"{API}/admin/attendance/trend", headers=H(admin_token), timeout=15)
        assert r.status_code == 200
        data = r.json()
        assert isinstance(data, list)
        if data:
            assert isinstance(data[0], dict)
            # likely keys: date + present/pct/count
            assert any(k in data[0] for k in ("date", "day", "label"))

    def test_admin_attendance_by_department(self, admin_token):
        r = requests.get(f"{API}/admin/attendance/by-department", headers=H(admin_token), timeout=15)
        assert r.status_code == 200
        data = r.json()
        assert isinstance(data, list)
        if data:
            assert "department" in data[0] or "name" in data[0]

    def test_admin_attendance_today(self, admin_token):
        # Endpoint actually used by frontend api.attendanceAdminToday
        r = requests.get(f"{API}/attendance/admin/today", headers=H(admin_token), timeout=15)
        assert r.status_code == 200
        data = r.json()
        assert isinstance(data, dict)
        assert "summary" in data and "staff" in data
        s = data["summary"]
        for k in ("total", "present", "absent", "late"):
            assert k in s, f"summary missing {k}: {list(s.keys())}"
        assert isinstance(data["staff"], list)

    def test_attendance_history_staff(self):
        # Staff can fetch their own history (used by mobile)
        tok = requests.post(f"{API}/auth/login",
                            json={"email": "faculty@mahindrauniversity.edu.in", "password": "faculty123"},
                            timeout=15).json()["token"]
        r = requests.get(f"{API}/attendance/history", headers=H(tok), timeout=15)
        assert r.status_code == 200
        assert isinstance(r.json(), list)

    def test_attendance_today_staff(self):
        tok = requests.post(f"{API}/auth/login",
                            json={"email": "faculty@mahindrauniversity.edu.in", "password": "faculty123"},
                            timeout=15).json()["token"]
        r = requests.get(f"{API}/attendance/today", headers=H(tok), timeout=15)
        assert r.status_code == 200
        d = r.json()
        assert isinstance(d, dict)
        assert "events" in d
