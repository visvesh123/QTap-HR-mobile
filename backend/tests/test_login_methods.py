"""Tests for unified login page methods: password, OTP (mocked), Microsoft (mocked SSO)."""
import os
import pytest
import requests

BASE_URL = os.environ.get('EXPO_PUBLIC_BACKEND_URL', 'https://uni-attendance-hub-2.preview.emergentagent.com').rstrip('/')


@pytest.fixture(scope="module")
def s():
    sess = requests.Session()
    sess.headers.update({"Content-Type": "application/json"})
    return sess


# ---------- OTP ----------
class TestOtp:
    def test_otp_request_valid(self, s):
        r = s.post(f"{BASE_URL}/api/auth/otp/request", json={"phone": "9876500010"})
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["ok"] is True
        assert data["phone"] == "9876500010"
        assert data["demo_otp"] == "123456"

    def test_otp_request_short_number(self, s):
        r = s.post(f"{BASE_URL}/api/auth/otp/request", json={"phone": "98765"})
        assert r.status_code == 400, r.text

    def test_otp_verify_faculty(self, s):
        r = s.post(f"{BASE_URL}/api/auth/otp/verify", json={"phone": "9876500010", "code": "123456"})
        assert r.status_code == 200, r.text
        data = r.json()
        assert "token" in data and "user" in data
        assert data["user"]["role"] == "staff"
        assert data["user"]["email"] == "faculty@mahindrauniversity.edu.in"

    def test_otp_verify_unknown_phone_blocks_login(self, s):
        # Updated for iteration 4: unknown numbers no longer fall back; they are blocked (404).
        r = s.post(f"{BASE_URL}/api/auth/otp/verify", json={"phone": "1112223334", "code": "123456"})
        assert r.status_code == 404, r.text
        assert "No MU profile found" in r.json().get("detail", "")

    def test_otp_verify_known_faculty_phone_now_external_directory(self, s):
        # The seeded faculty phone 9876500010 is unknown to the external MU directory.
        # External-profile flow blocks login -> 404 (this supersedes the older fallback behaviour).
        r = s.post(f"{BASE_URL}/api/auth/otp/verify", json={"phone": "9876500010", "code": "123456"})
        assert r.status_code == 404, r.text

    def test_otp_verify_wrong_code(self, s):
        r = s.post(f"{BASE_URL}/api/auth/otp/verify", json={"phone": "9876500010", "code": "999999"})
        assert r.status_code == 401, r.text


# ---------- Microsoft mock SSO ----------
class TestMicrosoft:
    def test_microsoft_login_default_student(self, s):
        r = s.post(f"{BASE_URL}/api/auth/microsoft", json={})
        assert r.status_code == 200, r.text
        data = r.json()
        assert "token" in data and "user" in data
        assert data["user"]["email"] == "student@mahindrauniversity.edu.in"
        # Validate token by hitting /auth/me
        token = data["token"]
        me = s.get(f"{BASE_URL}/api/auth/me", headers={"Authorization": f"Bearer {token}"})
        assert me.status_code == 200, me.text
        me_data = me.json()
        assert me_data["email"] == "student@mahindrauniversity.edu.in"


# ---------- Password regression: all 8 demo accounts ----------
DEMO_PWD_ACCOUNTS = [
    ("student@mahindrauniversity.edu.in", "student123", "student"),
    ("student2@mahindrauniversity.edu.in", "student123", "student"),
    ("faculty@mahindrauniversity.edu.in", "faculty123", "staff"),
    ("librarian@mahindrauniversity.edu.in", "librarian123", "staff"),
    ("warden@mahindrauniversity.edu.in", "warden123", "staff"),
    ("security@mahindrauniversity.edu.in", "security123", "staff"),
    ("exam@mahindrauniversity.edu.in", "exam123", "staff"),
    ("admin@mahindrauniversity.edu.in", "admin123", "admin"),
]


@pytest.mark.parametrize("email,password,role", DEMO_PWD_ACCOUNTS)
def test_password_login_regression(s, email, password, role):
    r = s.post(f"{BASE_URL}/api/auth/login", json={"email": email, "password": password})
    assert r.status_code == 200, f"{email} -> {r.text}"
    data = r.json()
    assert data["user"]["email"] == email
    assert data["user"]["role"] == role
