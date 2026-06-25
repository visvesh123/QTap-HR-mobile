"""Tests for OTP login w/ external MU profile sync (iteration 4)."""
import os
import pytest
import requests

BASE_URL = os.environ.get(
    'EXPO_PUBLIC_BACKEND_URL',
    'https://decoupled-frontend.preview.emergentagent.com'
).rstrip('/')


@pytest.fixture(scope="module")
def s():
    sess = requests.Session()
    sess.headers.update({"Content-Type": "application/json"})
    return sess


class TestOtpExternalProfile:
    """OTP login should now block when no external MU profile is found."""

    def test_otp_verify_known_phone_enriched(self, s):
        r = s.post(f"{BASE_URL}/api/auth/otp/verify",
                   json={"phone": "9133430919", "code": "123456"})
        assert r.status_code == 200, r.text
        data = r.json()
        assert "token" in data and "user" in data
        u = data["user"]
        assert u["name"] == "Rock Star Yash", u
        assert u["role"] == "staff"
        assert u["qid"] == "MUCS272"
        assert u["gender"] == "Male"
        assert u["type"] == "Staff"
        assert u["phone"] == "9133430919"
        assert u.get("designated_locations") == [] or isinstance(u.get("designated_locations"), list)
        # Now verify /auth/me returns same enriched fields
        token = data["token"]
        me = s.get(f"{BASE_URL}/api/auth/me",
                   headers={"Authorization": f"Bearer {token}"})
        assert me.status_code == 200, me.text
        md = me.json()
        assert md["qid"] == "MUCS272"
        assert md["gender"] == "Male"
        assert md["type"] == "Staff"
        assert md["phone"] == "9133430919"
        assert "designated_locations" in md

    def test_otp_verify_unknown_phone_blocks(self, s):
        r = s.post(f"{BASE_URL}/api/auth/otp/verify",
                   json={"phone": "9999999999", "code": "123456"})
        assert r.status_code == 404, r.text
        body = r.json()
        assert "No MU profile found" in body.get("detail", ""), body

    def test_otp_verify_wrong_code_unauthorized(self, s):
        r = s.post(f"{BASE_URL}/api/auth/otp/verify",
                   json={"phone": "9133430919", "code": "000000"})
        assert r.status_code == 401, r.text
        assert "Incorrect OTP" in r.json().get("detail", "")


# Regression: password and Microsoft logins still work
class TestExistingFlowsRegression:
    def test_password_login_faculty(self, s):
        r = s.post(f"{BASE_URL}/api/auth/login",
                   json={"email": "faculty@mahindrauniversity.edu.in",
                         "password": "faculty123"})
        assert r.status_code == 200, r.text
        assert r.json()["user"]["role"] == "staff"

    def test_microsoft_default(self, s):
        r = s.post(f"{BASE_URL}/api/auth/microsoft", json={})
        assert r.status_code == 200, r.text
        assert r.json()["user"]["email"] == "student@mahindrauniversity.edu.in"
