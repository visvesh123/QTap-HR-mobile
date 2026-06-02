from dotenv import load_dotenv
from pathlib import Path
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

import os
import uuid
import logging
import bcrypt
import jwt
from datetime import datetime, timezone, timedelta
from typing import List, Optional, Literal
from fastapi import FastAPI, APIRouter, HTTPException, Depends, Request
from fastapi.security import HTTPBearer
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field, EmailStr

# ---------- DB ----------
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

JWT_SECRET = os.environ['JWT_SECRET']
JWT_ALGO = "HS256"

app = FastAPI(title="Campus Hub API")
api = APIRouter(prefix="/api")

# ---------- Auth helpers ----------
def hash_pw(pw: str) -> str:
    return bcrypt.hashpw(pw.encode(), bcrypt.gensalt()).decode()

def verify_pw(pw: str, h: str) -> bool:
    try:
        return bcrypt.checkpw(pw.encode(), h.encode())
    except Exception:
        return False

def create_token(uid: str, email: str, role: str, dept: Optional[str] = None) -> str:
    payload = {
        "sub": uid, "email": email, "role": role, "dept": dept,
        "exp": datetime.now(timezone.utc) + timedelta(days=7),
        "type": "access"
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGO)

bearer = HTTPBearer(auto_error=False)

async def get_current_user(request: Request) -> dict:
    auth = request.headers.get("Authorization", "")
    token = auth[7:] if auth.startswith("Bearer ") else None
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGO])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")
    user = await db.users.find_one({"id": payload["sub"]}, {"_id": 0, "password_hash": 0})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user

# ---------- Models ----------
class UserOut(BaseModel):
    id: str
    email: str
    name: str
    role: str
    department: Optional[str] = None
    student_id: Optional[str] = None
    employee_id: Optional[str] = None
    avatar: Optional[str] = None

class LoginIn(BaseModel):
    email: EmailStr
    password: str
    role: Optional[str] = None  # used for role gate validation

class AuthOut(BaseModel):
    token: str
    user: UserOut

class VisitorRequest(BaseModel):
    id: Optional[str] = None
    visitor_name: str
    visitor_phone: str
    purpose: str
    visit_date: str
    host_id: Optional[str] = None
    host_name: Optional[str] = None
    status: Optional[str] = "approved"
    qr_code: Optional[str] = None
    created_at: Optional[str] = None

class AttendanceCheckIn(BaseModel):
    latitude: float
    longitude: float
    type: str  # "in" or "out"
    accuracy_m: Optional[float] = None
    selfie_b64: Optional[str] = None     # base64 selfie image (we just store hash for demo)
    attendance_type: Optional[str] = "office"  # office | wfh | client_visit | field
    geofence_id: Optional[str] = None
    is_mock_location: Optional[bool] = False

class Complaint(BaseModel):
    id: Optional[str] = None
    title: str
    category: str
    description: str
    status: Optional[str] = "open"
    created_at: Optional[str] = None

class EventRegister(BaseModel):
    event_id: str

class SOSAlert(BaseModel):
    location: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    message: Optional[str] = None

class CommunicationOut(BaseModel):
    id: str
    title: str
    message: str
    type: str
    audience: str
    created_at: str

# ---------- Seeders ----------
SEED_USERS = [
    {"email": "student@mahindrauniversity.edu.in", "password": "student123", "name": "Aarav Sharma", "role": "student", "department": "Computer Science", "student_id": "MU23BTECS001"},
    {"email": "student2@mahindrauniversity.edu.in", "password": "student123", "name": "Diya Patel", "role": "student", "department": "Mechanical", "student_id": "MU23BTEME045"},
    {"email": "faculty@mahindrauniversity.edu.in", "password": "faculty123", "name": "Dr. Rajesh Kumar", "role": "staff", "department": "Faculty - Computer Science", "employee_id": "MU-FAC1023"},
    {"email": "librarian@mahindrauniversity.edu.in", "password": "librarian123", "name": "Mrs. Anita Nair", "role": "staff", "department": "Library", "employee_id": "MU-LIB204"},
    {"email": "warden@mahindrauniversity.edu.in", "password": "warden123", "name": "Mr. Vikram Singh", "role": "staff", "department": "Hostel", "employee_id": "MU-HOS101"},
    {"email": "security@mahindrauniversity.edu.in", "password": "security123", "name": "Mr. Ramesh Kale", "role": "staff", "department": "Security", "employee_id": "MU-SEC011"},
    {"email": "exam@mahindrauniversity.edu.in", "password": "exam123", "name": "Dr. Kavita Joshi", "role": "staff", "department": "Examination Cell", "employee_id": "MU-EXM002"},
    {"email": "admin@mahindrauniversity.edu.in", "password": "admin123", "name": "Prof. Suresh Mehta", "role": "admin", "department": "Administration", "employee_id": "MU-ADM001"},
    # Additional staff (non-demo accounts) to make the HR portal feel realistic
    {"email": "priya.iyer@mahindrauniversity.edu.in",     "password": "demo123", "name": "Dr. Priya Iyer",       "role": "staff", "department": "Faculty - Computer Science", "employee_id": "MU-FAC1024"},
    {"email": "arjun.menon@mahindrauniversity.edu.in",    "password": "demo123", "name": "Dr. Arjun Menon",     "role": "staff", "department": "Faculty - ECE",             "employee_id": "MU-FAC2011"},
    {"email": "neha.kapoor@mahindrauniversity.edu.in",    "password": "demo123", "name": "Prof. Neha Kapoor",   "role": "staff", "department": "Faculty - ECE",             "employee_id": "MU-FAC2012"},
    {"email": "manish.gupta@mahindrauniversity.edu.in",   "password": "demo123", "name": "Dr. Manish Gupta",    "role": "staff", "department": "Faculty - Mechanical",      "employee_id": "MU-FAC3007"},
    {"email": "sneha.rao@mahindrauniversity.edu.in",      "password": "demo123", "name": "Prof. Sneha Rao",     "role": "staff", "department": "Faculty - Mechanical",      "employee_id": "MU-FAC3008"},
    {"email": "kavya.balan@mahindrauniversity.edu.in",    "password": "demo123", "name": "Ms. Kavya Balan",     "role": "staff", "department": "Library",                   "employee_id": "MU-LIB205"},
    {"email": "ravi.kumar@mahindrauniversity.edu.in",     "password": "demo123", "name": "Mr. Ravi Kumar",      "role": "staff", "department": "IT Helpdesk",               "employee_id": "MU-ITH101"},
    {"email": "deepa.shetty@mahindrauniversity.edu.in",   "password": "demo123", "name": "Ms. Deepa Shetty",    "role": "staff", "department": "Admissions",               "employee_id": "MU-ADM042"},
    {"email": "sunil.pillai@mahindrauniversity.edu.in",   "password": "demo123", "name": "Mr. Sunil Pillai",    "role": "staff", "department": "Finance",                   "employee_id": "MU-FIN014"},
    {"email": "anjali.deshmukh@mahindrauniversity.edu.in","password": "demo123", "name": "Ms. Anjali Deshmukh", "role": "staff", "department": "Hostel",                    "employee_id": "MU-HOS102"},
    {"email": "rakesh.bhat@mahindrauniversity.edu.in",    "password": "demo123", "name": "Mr. Rakesh Bhat",     "role": "staff", "department": "Security",                  "employee_id": "MU-SEC012"},
    {"email": "meera.nair@mahindrauniversity.edu.in",     "password": "demo123", "name": "Dr. Meera Nair",      "role": "staff", "department": "Examination Cell",         "employee_id": "MU-EXM003"},
    {"email": "amit.jain@mahindrauniversity.edu.in",      "password": "demo123", "name": "Dr. Amit Jain",       "role": "staff", "department": "Faculty - Computer Science", "employee_id": "MU-FAC1025"},
]

SEED_EVENTS = [
    {"id": "evt1", "title": "TechFest 2026", "category": "Tech", "date": "2026-03-15", "venue": "Main Auditorium", "image": "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=600", "description": "Annual technology festival with hackathons, workshops, and guest speakers from industry leaders.", "organizer": "Computer Science Club", "registered": 245},
    {"id": "evt2", "title": "Cultural Night - Rang", "category": "Cultural", "date": "2026-02-28", "venue": "Open Air Theatre", "image": "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=600", "description": "An evening of music, dance, and drama performances by students.", "organizer": "Cultural Committee", "registered": 412},
    {"id": "evt3", "title": "Inter-College Sports Meet", "category": "Sports", "date": "2026-03-05", "venue": "Sports Complex", "image": "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=600", "description": "Compete with the best across athletics, cricket, football, and basketball.", "organizer": "Sports Council", "registered": 178},
    {"id": "evt4", "title": "Entrepreneurship Summit", "category": "Career", "date": "2026-03-22", "venue": "Conference Hall A", "image": "https://images.unsplash.com/photo-1559223607-a43c990c692c?w=600", "description": "Meet successful founders, learn about startup ecosystem, and pitch your ideas.", "organizer": "E-Cell", "registered": 156},
]

SEED_BOOKS = [
    {"id": "bk1", "title": "Introduction to Algorithms", "author": "Cormen, Leiserson", "isbn": "9780262033848", "available": True, "category": "Computer Science", "cover": "https://images.unsplash.com/photo-1532012197267-da84d127e765?w=400"},
    {"id": "bk2", "title": "Clean Code", "author": "Robert C. Martin", "isbn": "9780132350884", "available": False, "category": "Computer Science", "cover": "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400"},
    {"id": "bk3", "title": "The Lean Startup", "author": "Eric Ries", "isbn": "9780307887894", "available": True, "category": "Business", "cover": "https://images.unsplash.com/photo-1589998059171-988d887df646?w=400"},
    {"id": "bk4", "title": "Atomic Habits", "author": "James Clear", "isbn": "9780735211292", "available": True, "category": "Self-Help", "cover": "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=400"},
    {"id": "bk5", "title": "Sapiens", "author": "Yuval Noah Harari", "isbn": "9780062316097", "available": True, "category": "History", "cover": "https://images.unsplash.com/photo-1535905557558-afc4877a26fc?w=400"},
    {"id": "bk6", "title": "Deep Learning", "author": "Ian Goodfellow", "isbn": "9780262035613", "available": False, "category": "Computer Science", "cover": "https://images.unsplash.com/photo-1555949963-aa79dcee981c?w=400"},
]

SEED_PARCELS_FOR_STUDENT = [
    {"id": "pcl1", "tracking": "AMZ892341", "courier": "Amazon", "received_at": "2026-02-10T11:30:00Z", "status": "ready", "from": "Amazon Warehouse", "weight": "0.5kg"},
    {"id": "pcl2", "tracking": "FLP764512", "courier": "Flipkart", "received_at": "2026-02-08T14:20:00Z", "status": "collected", "from": "Flipkart Logistics", "weight": "1.2kg"},
]

SEED_ALERTS = [
    {"id": "alt1", "title": "Library Closure", "message": "Central library will remain closed on Feb 18 for maintenance.", "type": "info", "audience": "all", "created_at": "2026-02-12T09:00:00Z"},
    {"id": "alt2", "title": "Mid-Sem Hall Tickets Released", "message": "Download your hall tickets from the Examinations module. Mid-sems start Feb 25.", "type": "academic", "audience": "students", "created_at": "2026-02-11T16:30:00Z"},
    {"id": "alt3", "title": "Cultural Night Registrations Open", "message": "Register now for Rang 2026. Limited slots available!", "type": "event", "audience": "students", "created_at": "2026-02-10T12:00:00Z"},
    {"id": "alt4", "title": "Hostel Inspection Tomorrow", "message": "All hostel rooms will be inspected on Feb 14 between 10 AM - 1 PM.", "type": "urgent", "audience": "students", "created_at": "2026-02-13T18:00:00Z"},
]

@app.on_event("startup")
async def on_startup():
    await db.users.create_index("email", unique=True)
    await db.users.create_index("id", unique=True)
    # Seed users
    for u in SEED_USERS:
        existing = await db.users.find_one({"email": u["email"]})
        if not existing:
            uid = str(uuid.uuid4())
            doc = {
                "id": uid,
                "email": u["email"],
                "name": u["name"],
                "role": u["role"],
                "department": u.get("department"),
                "student_id": u.get("student_id"),
                "employee_id": u.get("employee_id"),
                "password_hash": hash_pw(u["password"]),
                "avatar": None,
                "wallet_balance": 1500 if u["role"] == "student" else 0,
                "reward_points": 250 if u["role"] == "student" else 0,
                "created_at": datetime.now(timezone.utc).isoformat(),
            }
            await db.users.insert_one(doc)
    # Seed events
    for e in SEED_EVENTS:
        existing = await db.events.find_one({"id": e["id"]})
        if not existing:
            await db.events.insert_one({**e})
    # Seed books
    for b in SEED_BOOKS:
        existing = await db.books.find_one({"id": b["id"]})
        if not existing:
            await db.books.insert_one({**b})
    # Seed alerts
    for a in SEED_ALERTS:
        existing = await db.alerts.find_one({"id": a["id"]})
        if not existing:
            await db.alerts.insert_one({**a})
    # Seed parcels for primary student
    student = await db.users.find_one({"email": "student@univ.edu"})
    if student:
        for p in SEED_PARCELS_FOR_STUDENT:
            existing = await db.parcels.find_one({"id": p["id"]})
            if not existing:
                await db.parcels.insert_one({**p, "user_id": student["id"]})

    # Seed 14 days of synthetic staff attendance (only if collection is empty)
    if await db.attendance.count_documents({}) == 0:
        await _seed_attendance_history()


@api.post("/admin/seed/reset-attendance")
async def admin_reset_attendance(user: dict = Depends(get_current_user)):
    if user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    await db.attendance.delete_many({})
    await _seed_attendance_history()
    return {"ok": True, "records": await db.attendance.count_documents({})}


async def _seed_attendance_history():
    import random as _r
    staff = await db.users.find({"role": "staff"}, {"_id": 0, "password_hash": 0}).to_list(200)
    if not staff:
        return
    fence_pool = [g for g in GEOFENCES if g["type"] != "wfh" and g["active"]]
    today = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
    docs = []
    for day_offset in range(13, -1, -1):
        d = today - timedelta(days=day_offset)
        is_weekend = d.weekday() >= 5
        for s in staff:
            rng = _r.Random(f"{s['id']}-{d.date().isoformat()}")
            # Skip weekends or with high probability mark off
            if is_weekend and rng.random() < 0.85:
                continue
            # 88% present overall
            present = rng.random() < (0.6 if is_weekend else 0.92)
            if not present:
                continue
            # Decide attendance type
            r = rng.random()
            if r < 0.78:
                att_type = "office"
            elif r < 0.92:
                att_type = "wfh"
            elif r < 0.97:
                att_type = "client_visit"
            else:
                att_type = "field"
            # Pick geofence
            if att_type == "wfh":
                fence = next((g for g in GEOFENCES if g["type"] == "wfh"), None)
                lat, lon = 17.4 + rng.random() * 0.2, 78.3 + rng.random() * 0.2
            elif att_type == "client_visit":
                fence = next((g for g in fence_pool if g["type"] == "client"), fence_pool[0])
                lat = fence["lat"] + (rng.random() - 0.5) * 0.0008
                lon = fence["lon"] + (rng.random() - 0.5) * 0.0008
            else:
                # Main campus most of the time
                fence = fence_pool[0] if rng.random() < 0.85 else rng.choice(fence_pool)
                lat = fence["lat"] + (rng.random() - 0.5) * 0.001
                lon = fence["lon"] + (rng.random() - 0.5) * 0.001
            # Check-in time around 09:15 ± 90 min with some lateness
            base_min = rng.randint(8 * 60 + 30, 9 * 60 + 50)
            jitter = rng.randint(-25, 25)
            in_min = base_min + jitter
            # 12% late
            if rng.random() < 0.12:
                in_min = max(in_min, 9 * 60 + 35) + rng.randint(0, 60)
            ci = d + timedelta(minutes=in_min)
            # Check-out 7.5-9.5 hours later
            out_min = in_min + rng.randint(7 * 60 + 30, 9 * 60 + 30)
            co = d + timedelta(minutes=out_min)
            face_score = round(rng.uniform(0.88, 0.99), 3)
            status = "present"
            if (in_min // 60) > 9 or (in_min // 60 == 9 and in_min % 60 > 30):
                status = "late"
            if in_min > 12 * 60:
                status = "half_day"
            for ev_type, ts in (("in", ci), ("out", co)):
                docs.append({
                    "id": str(uuid.uuid4()),
                    "user_id": s["id"],
                    "name": s["name"],
                    "department": s.get("department"),
                    "type": ev_type,
                    "attendance_type": att_type,
                    "lat": lat,
                    "lon": lon,
                    "accuracy_m": rng.randint(5, 18),
                    "is_mock_location": False,
                    "distance_m": rng.randint(20, 250) if fence and fence["type"] != "wfh" else 0,
                    "geofence_id": fence["id"] if fence else None,
                    "geofence_name": fence["name"] if fence else None,
                    "inside_geofence": True,
                    "face_score": face_score,
                    "face_passed": True,
                    "spoof_detected": False,
                    "accepted": True,
                    "rejection_reason": None,
                    "status": status if ev_type == "in" else None,
                    "timestamp": ts.isoformat(),
                    "on_campus": True,
                })
    if docs:
        await db.attendance.insert_many(docs)
        logging.info(f"Seeded {len(docs)} attendance records for {len(staff)} staff over 14 days.")

# ---------- AUTH ----------
@api.get("/")
async def root():
    return {"message": "Campus Hub API", "version": "1.0"}

@api.post("/auth/login", response_model=AuthOut)
async def login(body: LoginIn):
    email = body.email.lower().strip()
    user = await db.users.find_one({"email": email})
    if not user or not verify_pw(body.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    if body.role and body.role != user["role"]:
        raise HTTPException(status_code=403, detail=f"This account is not registered as {body.role}")
    token = create_token(user["id"], user["email"], user["role"], user.get("department"))
    return {
        "token": token,
        "user": {
            "id": user["id"], "email": user["email"], "name": user["name"],
            "role": user["role"], "department": user.get("department"),
            "student_id": user.get("student_id"), "employee_id": user.get("employee_id"),
            "avatar": user.get("avatar"),
        }
    }

@api.get("/auth/me", response_model=UserOut)
async def me(user: dict = Depends(get_current_user)):
    return {
        "id": user["id"], "email": user["email"], "name": user["name"],
        "role": user["role"], "department": user.get("department"),
        "student_id": user.get("student_id"), "employee_id": user.get("employee_id"),
        "avatar": user.get("avatar"),
    }

@api.get("/auth/demo-accounts")
async def demo_accounts():
    return [
        {"role": "student", "email": "student@mahindrauniversity.edu.in", "password": "student123", "name": "Aarav Sharma"},
        {"role": "staff", "email": "faculty@mahindrauniversity.edu.in", "password": "faculty123", "name": "Dr. Rajesh Kumar (Faculty)"},
        {"role": "staff", "email": "librarian@mahindrauniversity.edu.in", "password": "librarian123", "name": "Mrs. Anita Nair (Librarian)"},
        {"role": "staff", "email": "warden@mahindrauniversity.edu.in", "password": "warden123", "name": "Mr. Vikram Singh (Warden)"},
        {"role": "staff", "email": "security@mahindrauniversity.edu.in", "password": "security123", "name": "Mr. Ramesh Kale (Security)"},
        {"role": "staff", "email": "exam@mahindrauniversity.edu.in", "password": "exam123", "name": "Dr. Kavita Joshi (Exam Cell)"},
        {"role": "admin", "email": "admin@mahindrauniversity.edu.in", "password": "admin123", "name": "Prof. Suresh Mehta"},
    ]

# ---------- EXAMINATIONS ----------
@api.get("/exams/hall-ticket")
async def hall_ticket(user: dict = Depends(get_current_user)):
    return {
        "student_name": user["name"],
        "student_id": user.get("student_id") or user.get("employee_id") or "—",
        "department": user.get("department"),
        "exam_name": "Mid Semester Examination - Spring 2026",
        "exam_dates": "Feb 25 - Mar 5, 2026",
        "ticket_no": f"HT-{user['id'][:6].upper()}",
        "qr_data": f"HALLTICKET|{user['id']}|MIDSEM-2026",
        "subjects": [
            {"code": "CS301", "name": "Data Structures", "date": "2026-02-25", "time": "10:00 AM", "room": "Hall A-201", "seat": "A-12"},
            {"code": "CS302", "name": "Operating Systems", "date": "2026-02-27", "time": "10:00 AM", "room": "Hall B-105", "seat": "B-08"},
            {"code": "CS303", "name": "Database Systems", "date": "2026-03-01", "time": "02:00 PM", "room": "Hall A-201", "seat": "A-12"},
            {"code": "CS304", "name": "Computer Networks", "date": "2026-03-03", "time": "10:00 AM", "room": "Hall C-301", "seat": "C-22"},
            {"code": "MA301", "name": "Discrete Mathematics", "date": "2026-03-05", "time": "02:00 PM", "room": "Hall B-105", "seat": "B-08"},
        ],
        "instructions": [
            "Carry this hall ticket and college ID at all times during exam.",
            "Reach the exam hall 30 minutes before reporting time.",
            "Electronic devices including phones are strictly prohibited.",
            "RFID tap-in is mandatory for attendance recording.",
        ]
    }

@api.get("/exams/attendance-log")
async def exam_attendance(user: dict = Depends(get_current_user)):
    return [
        {"subject": "Data Structures", "date": "2026-02-25", "time": "09:42 AM", "method": "RFID", "status": "present"},
        {"subject": "Operating Systems", "date": "2026-02-27", "time": "09:48 AM", "method": "RFID", "status": "present"},
    ]

@api.get("/exams/results")
async def exam_results(user: dict = Depends(get_current_user)):
    return {
        "semester": "Fall 2025",
        "gpa": 8.7,
        "total_credits": 24,
        "subjects": [
            {"code": "CS201", "name": "Discrete Math", "grade": "A", "credits": 4},
            {"code": "CS202", "name": "Computer Architecture", "grade": "A+", "credits": 4},
            {"code": "CS203", "name": "Programming Lab", "grade": "A", "credits": 4},
            {"code": "CS204", "name": "Linear Algebra", "grade": "B+", "credits": 4},
            {"code": "CS205", "name": "Communication Skills", "grade": "A", "credits": 2},
        ]
    }

# ---------- VISITOR ----------
@api.post("/visitors/request")
async def create_visitor_request(body: VisitorRequest, user: dict = Depends(get_current_user)):
    vid = str(uuid.uuid4())
    qr = f"VISITOR|{vid}|{body.visitor_name}|{body.visit_date}"
    doc = {
        "id": vid,
        "visitor_name": body.visitor_name,
        "visitor_phone": body.visitor_phone,
        "purpose": body.purpose,
        "visit_date": body.visit_date,
        "host_id": user["id"],
        "host_name": user["name"],
        "status": "approved",
        "qr_code": qr,
        "face_validated": False,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.visitor_requests.insert_one(doc)
    doc.pop("_id", None)
    return doc

@api.get("/visitors/list")
async def list_visitors(user: dict = Depends(get_current_user)):
    if user["role"] in ("admin",) or user.get("department") == "Security":
        cursor = db.visitor_requests.find({}, {"_id": 0}).sort("created_at", -1)
    else:
        cursor = db.visitor_requests.find({"host_id": user["id"]}, {"_id": 0}).sort("created_at", -1)
    return await cursor.to_list(100)

# ---------- STAFF ATTENDANCE ----------
# Mahindra University main campus (Bahadurpally, Hyderabad)
GEOFENCES = [
    {
        "id": "mu-main",
        "name": "Mahindra University — Main Campus",
        "address": "Bahadurpally, Hyderabad, Telangana",
        "lat": 17.5234,
        "lon": 78.3941,
        "radius_m": 500,
        "type": "office",
        "active": True,
    },
    {
        "id": "mu-hyd-office",
        "name": "MU Corporate Office — HITEC City",
        "address": "Madhapur, Hyderabad",
        "lat": 17.4474,
        "lon": 78.3762,
        "radius_m": 200,
        "type": "branch",
        "active": True,
    },
    {
        "id": "wfh-zone",
        "name": "Work From Home",
        "address": "Any location with attendance type = WFH",
        "lat": 0.0,
        "lon": 0.0,
        "radius_m": 0,
        "type": "wfh",
        "active": True,
    },
    {
        "id": "mu-research-park",
        "name": "MU Research Park — Genome Valley",
        "address": "Turkapally, Genome Valley, Hyderabad",
        "lat": 17.5430,
        "lon": 78.4071,
        "radius_m": 300,
        "type": "branch",
        "active": True,
    },
    {
        "id": "mu-client-msft",
        "name": "Microsoft Hyderabad — Client Site",
        "address": "Gachibowli IT Hub, Hyderabad",
        "lat": 17.4399,
        "lon": 78.3489,
        "radius_m": 150,
        "type": "client",
        "active": True,
    },
    {
        "id": "mu-secunderabad",
        "name": "MU Outreach Center — Secunderabad",
        "address": "SP Road, Secunderabad",
        "lat": 17.4399,
        "lon": 78.4983,
        "radius_m": 200,
        "type": "office",
        "active": False,
    },
]

def haversine_m(lat1, lon1, lat2, lon2):
    from math import radians, sin, cos, sqrt, atan2
    R = 6371000
    p1, p2 = radians(lat1), radians(lat2)
    dlat = radians(lat2 - lat1)
    dlon = radians(lon2 - lon1)
    a = sin(dlat/2)**2 + cos(p1)*cos(p2)*sin(dlon/2)**2
    return 2*R*atan2(sqrt(a), sqrt(1-a))


def _match_geofence(lat: float, lon: float, attendance_type: str = "office"):
    """Return (matched_fence, distance) — best matching geofence within radius, or None."""
    if attendance_type == "wfh":
        wfh = next((g for g in GEOFENCES if g["type"] == "wfh"), None)
        return wfh, 0.0
    best = None
    best_dist = float("inf")
    for g in GEOFENCES:
        if g["type"] == "wfh" or not g["active"]:
            continue
        d = haversine_m(lat, lon, g["lat"], g["lon"])
        if d <= g["radius_m"] and d < best_dist:
            best = g
            best_dist = d
    if best:
        return best, best_dist
    # No match — return nearest fence with its distance
    nearest = min(
        (g for g in GEOFENCES if g["type"] != "wfh"),
        key=lambda g: haversine_m(lat, lon, g["lat"], g["lon"]),
    )
    return None, haversine_m(lat, lon, nearest["lat"], nearest["lon"])


def _face_match_score(selfie_present: bool) -> dict:
    """Mocked face recognition: returns score, pass/fail, and anti-spoof status."""
    if not selfie_present:
        return {"score": 0.0, "passed": False, "spoof_detected": False, "reason": "no_selfie"}
    # Deterministic-ish "good" score based on time
    seed = int(datetime.now().timestamp()) % 100
    # 92% of the time, succeed at 88-99% match
    if seed < 92:
        score = round(0.88 + (seed % 11) / 100.0, 3)
        return {"score": score, "passed": True, "spoof_detected": False, "reason": "ok"}
    # 5% — low confidence
    if seed < 97:
        return {"score": 0.72, "passed": False, "spoof_detected": False, "reason": "low_confidence"}
    # 3% — spoof
    return {"score": 0.41, "passed": False, "spoof_detected": True, "reason": "spoof_attempt"}


def _attendance_status(check_in_ts: datetime) -> str:
    """Office start at 09:30; >09:31 = late; >12:00 = half-day."""
    t = check_in_ts.hour + check_in_ts.minute / 60.0
    if t > 12.0:
        return "half_day"
    if t > 9.5:
        return "late"
    return "present"


@api.get("/attendance/geofences")
async def list_geofences(user: dict = Depends(get_current_user)):
    return GEOFENCES


@api.post("/attendance/check")
async def attendance_check(body: AttendanceCheckIn, user: dict = Depends(get_current_user)):
    now = datetime.now(timezone.utc)
    fence, distance = _match_geofence(body.latitude, body.longitude, body.attendance_type or "office")
    face = _face_match_score(bool(body.selfie_b64))

    inside = fence is not None
    accepted = (inside and face["passed"] and not body.is_mock_location)
    rejection_reason = None
    if body.is_mock_location:
        rejection_reason = "mock_location_detected"
        accepted = False
    elif not inside:
        rejection_reason = "outside_geofence"
    elif face["spoof_detected"]:
        rejection_reason = "spoof_attempt"
    elif not face["passed"]:
        rejection_reason = "face_mismatch"

    status_label = None
    if body.type == "in" and accepted:
        status_label = _attendance_status(now)

    rec = {
        "id": str(uuid.uuid4()),
        "user_id": user["id"],
        "name": user["name"],
        "department": user.get("department"),
        "type": body.type,                          # in | out
        "attendance_type": body.attendance_type or "office",
        "lat": body.latitude,
        "lon": body.longitude,
        "accuracy_m": body.accuracy_m,
        "is_mock_location": bool(body.is_mock_location),
        "distance_m": round(distance, 1),
        "geofence_id": fence["id"] if fence else None,
        "geofence_name": fence["name"] if fence else None,
        "inside_geofence": inside,
        "face_score": face["score"],
        "face_passed": face["passed"],
        "spoof_detected": face["spoof_detected"],
        "accepted": accepted,
        "rejection_reason": rejection_reason,
        "status": status_label,
        "timestamp": now.isoformat(),
        "on_campus": inside,  # backward-compat
    }
    await db.attendance.insert_one({**rec})
    rec.pop("_id", None)
    return rec


@api.get("/attendance/history")
async def attendance_history(user: dict = Depends(get_current_user)):
    cursor = db.attendance.find({"user_id": user["id"]}, {"_id": 0}).sort("timestamp", -1).limit(60)
    return await cursor.to_list(60)


@api.get("/attendance/today")
async def attendance_today(user: dict = Depends(get_current_user)):
    today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0).isoformat()
    cursor = db.attendance.find(
        {"user_id": user["id"], "timestamp": {"$gte": today_start}},
        {"_id": 0},
    ).sort("timestamp", 1)
    items = await cursor.to_list(100)
    check_in = next((x for x in items if x["type"] == "in" and x.get("accepted")), None)
    check_out = next((x for x in reversed(items) if x["type"] == "out" and x.get("accepted")), None)
    work_seconds = 0
    if check_in and check_out:
        try:
            ci = datetime.fromisoformat(check_in["timestamp"].replace("Z", "+00:00"))
            co = datetime.fromisoformat(check_out["timestamp"].replace("Z", "+00:00"))
            work_seconds = max(0, int((co - ci).total_seconds()))
        except Exception:
            work_seconds = 0
    return {
        "date": today_start[:10],
        "check_in": check_in,
        "check_out": check_out,
        "events": items,
        "work_seconds": work_seconds,
        "status": check_in.get("status") if check_in else "absent",
    }


@api.get("/attendance/stats")
async def attendance_stats(user: dict = Depends(get_current_user)):
    """Monthly aggregates for current month."""
    now = datetime.now(timezone.utc)
    month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0).isoformat()
    cursor = db.attendance.find(
        {"user_id": user["id"], "timestamp": {"$gte": month_start}},
        {"_id": 0},
    ).sort("timestamp", 1)
    items = await cursor.to_list(1000)

    by_day = {}
    for it in items:
        d = it["timestamp"][:10]
        by_day.setdefault(d, []).append(it)

    present_days = 0
    late_days = 0
    half_days = 0
    wfh_days = 0
    total_work_seconds = 0
    failed_face = 0
    spoofs = 0

    for d, evts in by_day.items():
        in_ev = next((x for x in evts if x["type"] == "in" and x.get("accepted")), None)
        out_ev = next((x for x in reversed(evts) if x["type"] == "out" and x.get("accepted")), None)
        if in_ev:
            present_days += 1
            if in_ev.get("status") == "late":
                late_days += 1
            elif in_ev.get("status") == "half_day":
                half_days += 1
            if in_ev.get("attendance_type") == "wfh":
                wfh_days += 1
        if in_ev and out_ev:
            try:
                ci = datetime.fromisoformat(in_ev["timestamp"].replace("Z", "+00:00"))
                co = datetime.fromisoformat(out_ev["timestamp"].replace("Z", "+00:00"))
                total_work_seconds += max(0, int((co - ci).total_seconds()))
            except Exception:
                pass
        for e in evts:
            if e.get("face_passed") is False:
                failed_face += 1
            if e.get("spoof_detected"):
                spoofs += 1

    # Working days so far (Mon-Fri up to today)
    today = now.date()
    working_days = 0
    d = now.replace(day=1).date()
    while d <= today:
        if d.weekday() < 5:
            working_days += 1
        d = d.replace(day=d.day + 1) if d.day < (today.day if today.month == d.month else 31) else d
        if d.month != now.month:
            break
    pct = round((present_days / working_days) * 100, 1) if working_days else 0

    avg_h = round((total_work_seconds / present_days) / 3600, 1) if present_days else 0
    return {
        "month": now.strftime("%B %Y"),
        "working_days_so_far": working_days,
        "present_days": present_days,
        "late_days": late_days,
        "half_days": half_days,
        "wfh_days": wfh_days,
        "absent_days": max(0, working_days - present_days),
        "attendance_pct": pct,
        "total_work_hours": round(total_work_seconds / 3600, 1),
        "avg_work_hours": avg_h,
        "failed_face_verifications": failed_face,
        "spoof_attempts": spoofs,
        "daily": [
            {
                "date": d,
                "check_in": next((x for x in evts if x["type"] == "in" and x.get("accepted")), {}).get("timestamp"),
                "check_out": next((x for x in reversed(evts) if x["type"] == "out" and x.get("accepted")), {}).get("timestamp"),
                "status": next((x for x in evts if x["type"] == "in" and x.get("accepted")), {}).get("status") or "absent",
                "attendance_type": next((x for x in evts if x["type"] == "in" and x.get("accepted")), {}).get("attendance_type"),
            }
            for d, evts in sorted(by_day.items())
        ],
    }


@api.get("/attendance/admin/today")
async def attendance_admin_today(user: dict = Depends(get_current_user)):
    """HR/Admin view — see all staff status for today."""
    if user["role"] not in ("admin", "staff"):
        raise HTTPException(403, "forbidden")
    today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0).isoformat()
    cursor = db.users.find({"role": "staff"}, {"_id": 0, "password": 0})
    staff = await cursor.to_list(500)
    out = []
    present = late = remote = absent = 0
    for s in staff:
        att = await db.attendance.find({"user_id": s["id"], "timestamp": {"$gte": today_start}}).sort("timestamp", 1).to_list(50)
        in_ev = next((x for x in att if x.get("type") == "in" and x.get("accepted")), None)
        out_ev = next((x for x in reversed(att) if x.get("type") == "out" and x.get("accepted")), None)
        status = (in_ev or {}).get("status") or "absent"
        att_type = (in_ev or {}).get("attendance_type") or "—"
        if status == "absent":
            absent += 1
        elif status == "late":
            late += 1
            if att_type == "wfh":
                remote += 1
            else:
                present += 1
        else:
            present += 1
            if att_type == "wfh":
                remote += 1
        out.append({
            "id": s["id"],
            "name": s["name"],
            "department": s.get("department"),
            "employee_id": s.get("employee_id"),
            "status": status,
            "attendance_type": att_type,
            "check_in": (in_ev or {}).get("timestamp"),
            "check_out": (out_ev or {}).get("timestamp"),
            "geofence_name": (in_ev or {}).get("geofence_name"),
        })
    return {
        "summary": {
            "total": len(staff),
            "present": present,
            "absent": absent,
            "late": late,
            "remote": remote,
        },
        "staff": out,
    }

# ---------- LIBRARY ----------
@api.get("/library/books")
async def list_books(q: Optional[str] = None):
    query = {}
    if q:
        query = {"$or": [{"title": {"$regex": q, "$options": "i"}}, {"author": {"$regex": q, "$options": "i"}}]}
    books = await db.books.find(query, {"_id": 0}).to_list(50)
    return books

@api.post("/library/issue/{book_id}")
async def issue_book(book_id: str, user: dict = Depends(get_current_user)):
    book = await db.books.find_one({"id": book_id})
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")
    if not book.get("available"):
        raise HTTPException(status_code=400, detail="Book not available")
    issue_id = str(uuid.uuid4())
    doc = {
        "id": issue_id, "book_id": book_id, "book_title": book["title"], "user_id": user["id"],
        "issued_at": datetime.now(timezone.utc).isoformat(),
        "due_at": (datetime.now(timezone.utc) + timedelta(days=14)).isoformat(),
        "returned": False,
    }
    await db.book_issues.insert_one({**doc})
    await db.books.update_one({"id": book_id}, {"$set": {"available": False}})
    return doc

@api.get("/library/my-issues")
async def my_issues(user: dict = Depends(get_current_user)):
    cursor = db.book_issues.find({"user_id": user["id"]}, {"_id": 0}).sort("issued_at", -1)
    return await cursor.to_list(50)

# ---------- HOSTEL ----------
@api.get("/hostel/my-room")
async def my_room(user: dict = Depends(get_current_user)):
    if user["role"] != "student":
        return {"hostel": "—", "block": "—", "room": "—", "roommates": []}
    return {
        "hostel": "Sahyadri Boys Hostel",
        "block": "B",
        "floor": 3,
        "room": "B-312",
        "warden": "Mr. Vikram Singh",
        "warden_phone": "+91 98765 43210",
        "roommates": [
            {"name": "Rohan Verma", "year": "3rd Year", "department": "Mechanical"},
            {"name": "Karan Mehra", "year": "3rd Year", "department": "Electrical"},
        ],
        "occupancy": "3 / 3",
        "monthly_rent": "₹4,500",
        "facilities": ["Wi-Fi", "Laundry", "Mess", "24x7 Water", "Common Room"],
    }

@api.post("/hostel/complaint")
async def create_complaint(body: Complaint, user: dict = Depends(get_current_user)):
    cid = str(uuid.uuid4())
    doc = {
        "id": cid, "user_id": user["id"], "user_name": user["name"],
        "title": body.title, "category": body.category, "description": body.description,
        "status": "open", "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.complaints.insert_one({**doc})
    return doc

@api.get("/hostel/complaints")
async def list_complaints(user: dict = Depends(get_current_user)):
    if user.get("department") == "Hostel" or user["role"] == "admin":
        cursor = db.complaints.find({}, {"_id": 0}).sort("created_at", -1)
    else:
        cursor = db.complaints.find({"user_id": user["id"]}, {"_id": 0}).sort("created_at", -1)
    return await cursor.to_list(50)

# ---------- EVENTS ----------
@api.get("/events")
async def list_events():
    events = await db.events.find({}, {"_id": 0}).to_list(50)
    return events

@api.post("/events/register")
async def register_event(body: EventRegister, user: dict = Depends(get_current_user)):
    event = await db.events.find_one({"id": body.event_id})
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    existing = await db.event_registrations.find_one({"event_id": body.event_id, "user_id": user["id"]})
    if existing:
        raise HTTPException(status_code=400, detail="Already registered")
    doc = {
        "id": str(uuid.uuid4()), "event_id": body.event_id, "event_title": event["title"],
        "user_id": user["id"], "user_name": user["name"],
        "registered_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.event_registrations.insert_one({**doc})
    await db.events.update_one({"id": body.event_id}, {"$inc": {"registered": 1}})
    return doc

@api.get("/events/my-registrations")
async def my_registrations(user: dict = Depends(get_current_user)):
    cursor = db.event_registrations.find({"user_id": user["id"]}, {"_id": 0}).sort("registered_at", -1)
    return await cursor.to_list(50)

@api.get("/events/certificates")
async def my_certificates(user: dict = Depends(get_current_user)):
    return [
        {"id": "cert1", "event": "Hackathon Winter 2025", "date": "2025-12-15", "type": "Winner", "issuer": "Computer Science Club"},
        {"id": "cert2", "event": "Cultural Fest 2025", "date": "2025-10-20", "type": "Participant", "issuer": "Cultural Committee"},
        {"id": "cert3", "event": "Coding Marathon 2025", "date": "2025-09-12", "type": "Top 10", "issuer": "Tech Club"},
    ]

# ---------- COMMUNICATION ----------
@api.get("/alerts", response_model=List[CommunicationOut])
async def get_alerts(user: dict = Depends(get_current_user)):
    audience_filter = {"$in": ["all", user["role"] + "s"]}
    cursor = db.alerts.find({"audience": audience_filter}, {"_id": 0}).sort("created_at", -1)
    return await cursor.to_list(50)

@api.post("/sos")
async def trigger_sos(body: SOSAlert, user: dict = Depends(get_current_user)):
    sid = str(uuid.uuid4())
    doc = {
        "id": sid, "user_id": user["id"], "user_name": user["name"], "user_role": user["role"],
        "location": body.location, "lat": body.latitude, "lon": body.longitude,
        "message": body.message or "Emergency assistance needed",
        "status": "active",
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.sos_alerts.insert_one({**doc})
    return {"id": sid, "status": "broadcasted", "message": "Security and emergency contacts have been notified", "eta": "2-3 minutes"}

@api.get("/sos/active")
async def active_sos(user: dict = Depends(get_current_user)):
    if user.get("department") not in ("Security",) and user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Only security/admin can view")
    cursor = db.sos_alerts.find({"status": "active"}, {"_id": 0}).sort("created_at", -1)
    return await cursor.to_list(50)

# ---------- PARCEL ----------
@api.get("/parcels")
async def list_parcels(user: dict = Depends(get_current_user)):
    cursor = db.parcels.find({"user_id": user["id"]}, {"_id": 0}).sort("received_at", -1)
    return await cursor.to_list(50)

@api.post("/parcels/{parcel_id}/collect")
async def collect_parcel(parcel_id: str, user: dict = Depends(get_current_user)):
    p = await db.parcels.find_one({"id": parcel_id, "user_id": user["id"]})
    if not p:
        raise HTTPException(status_code=404, detail="Parcel not found")
    await db.parcels.update_one({"id": parcel_id}, {"$set": {"status": "collected", "collected_at": datetime.now(timezone.utc).isoformat()}})
    return {"status": "collected"}

# ---------- WALLET ----------
@api.get("/wallet")
async def wallet_summary(user: dict = Depends(get_current_user)):
    udoc = await db.users.find_one({"id": user["id"]}, {"_id": 0, "wallet_balance": 1, "reward_points": 1})
    txns = [
        {"id": "t1", "type": "credit", "amount": 500, "description": "Monthly allowance", "date": "2026-02-01T09:00:00Z"},
        {"id": "t2", "type": "debit", "amount": 80, "description": "Cafeteria - Lunch", "date": "2026-02-10T13:30:00Z"},
        {"id": "t3", "type": "debit", "amount": 50, "description": "Library print", "date": "2026-02-08T11:15:00Z"},
        {"id": "t4", "type": "credit", "amount": 100, "description": "Reward points redeemed", "date": "2026-02-05T16:00:00Z"},
        {"id": "t5", "type": "debit", "amount": 200, "description": "Stationery", "date": "2026-02-03T12:45:00Z"},
    ]
    return {
        "balance": udoc.get("wallet_balance", 0),
        "reward_points": udoc.get("reward_points", 0),
        "transactions": txns,
    }

@api.get("/wallet/rewards-store")
async def rewards_store():
    return [
        {"id": "r1", "title": "University Hoodie", "points": 500, "image": "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=400", "stock": 25},
        {"id": "r2", "title": "Coffee Coupon (5x)", "points": 150, "image": "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400", "stock": 100},
        {"id": "r3", "title": "Movie Pass", "points": 300, "image": "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=400", "stock": 50},
        {"id": "r4", "title": "Premium Notebook", "points": 200, "image": "https://images.unsplash.com/photo-1531346878377-a5be20888e57?w=400", "stock": 75},
        {"id": "r5", "title": "University Mug", "points": 250, "image": "https://images.unsplash.com/photo-1572119865084-43c285814d63?w=400", "stock": 40},
        {"id": "r6", "title": "Library Late-Fee Waiver", "points": 100, "image": "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400", "stock": 9999},
    ]

# ---------- GATE ACCESS ----------
@api.get("/gate/logs")
async def gate_logs(user: dict = Depends(get_current_user)):
    if user["role"] == "admin" or user.get("department") == "Security":
        return [
            {"id": "g1", "name": "Aarav Sharma", "role": "student", "type": "entry", "gate": "Main Gate", "time": "2026-02-13T08:42:00Z", "method": "RFID"},
            {"id": "g2", "name": "Dr. Rajesh Kumar", "role": "staff", "type": "entry", "gate": "Faculty Gate", "time": "2026-02-13T08:30:00Z", "method": "RFID"},
            {"id": "g3", "name": "Diya Patel", "role": "student", "type": "exit", "gate": "Main Gate", "time": "2026-02-12T18:15:00Z", "method": "RFID"},
            {"id": "g4", "name": "Visitor: Mr. Sharma", "role": "visitor", "type": "entry", "gate": "Visitor Gate", "time": "2026-02-13T10:05:00Z", "method": "QR + Face"},
            {"id": "g5", "name": "Mr. Ramesh Kale", "role": "staff", "type": "entry", "gate": "Main Gate", "time": "2026-02-13T07:55:00Z", "method": "RFID"},
        ]
    return [
        {"id": "g1", "type": "entry", "gate": "Main Gate", "time": "2026-02-13T08:42:00Z", "method": "RFID"},
        {"id": "g2", "type": "exit", "gate": "Main Gate", "time": "2026-02-12T18:15:00Z", "method": "RFID"},
        {"id": "g3", "type": "entry", "gate": "Main Gate", "time": "2026-02-12T08:30:00Z", "method": "RFID"},
    ]

@api.get("/gate/my-pass")
async def my_pass(user: dict = Depends(get_current_user)):
    return {
        "name": user["name"],
        "id_no": user.get("student_id") or user.get("employee_id") or "—",
        "role": user["role"],
        "department": user.get("department"),
        "qr_data": f"GATEPASS|{user['id']}|{user['role']}",
        "rfid_tag": f"RFID-{user['id'][:8].upper()}",
        "valid_until": "2026-12-31",
    }

# ---------- ADMIN ANALYTICS ----------
@api.get("/admin/dashboard")
async def admin_dashboard(user: dict = Depends(get_current_user)):
    if user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    total_users = await db.users.count_documents({})
    total_students = await db.users.count_documents({"role": "student"})
    total_staff = await db.users.count_documents({"role": "staff"})
    total_visitors = await db.visitor_requests.count_documents({})
    total_complaints = await db.complaints.count_documents({})
    open_complaints = await db.complaints.count_documents({"status": "open"})
    active_sos = await db.sos_alerts.count_documents({"status": "active"})
    return {
        "total_users": total_users,
        "total_students": total_students,
        "total_staff": total_staff,
        "total_visitors": total_visitors,
        "total_complaints": total_complaints,
        "open_complaints": open_complaints,
        "active_sos": active_sos,
        "library_books": await db.books.count_documents({}),
        "books_issued": await db.book_issues.count_documents({"returned": False}),
        "events": await db.events.count_documents({}),
        "event_registrations": await db.event_registrations.count_documents({}),
    }


# ---------- ADMIN: EMPLOYEES ----------
@api.get("/admin/employees")
async def admin_employees(user: dict = Depends(get_current_user), q: Optional[str] = None, role: Optional[str] = None, department: Optional[str] = None):
    if user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    qry: dict = {}
    if role:
        qry["role"] = role
    if department:
        qry["department"] = department
    if q:
        rx = {"$regex": q, "$options": "i"}
        qry["$or"] = [{"name": rx}, {"email": rx}, {"employee_id": rx}, {"student_id": rx}]
    cursor = db.users.find(qry, {"_id": 0, "password": 0}).sort("name", 1)
    return await cursor.to_list(500)


# ---------- ADMIN: ATTENDANCE TREND (last 14 days) ----------
@api.get("/admin/attendance/trend")
async def admin_attendance_trend(user: dict = Depends(get_current_user)):
    if user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    out = []
    today = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
    total_staff = await db.users.count_documents({"role": "staff"})
    for i in range(13, -1, -1):
        d = today - timedelta(days=i)
        d_iso = d.isoformat()
        d_next = (d + timedelta(days=1)).isoformat()
        pipeline = [
            {"$match": {"timestamp": {"$gte": d_iso, "$lt": d_next}, "type": "in", "accepted": True}},
            {"$group": {"_id": "$user_id"}},
        ]
        users = await db.attendance.aggregate(pipeline).to_list(2000)
        present = len(users)
        out.append({
            "date": d.strftime("%Y-%m-%d"),
            "label": d.strftime("%a %d"),
            "present": present,
            "absent": max(0, total_staff - present),
            "total": total_staff,
        })
    return out


# ---------- ADMIN: DEPARTMENT BREAKDOWN ----------
@api.get("/admin/attendance/by-department")
async def admin_attendance_by_dept(user: dict = Depends(get_current_user)):
    if user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0).isoformat()
    pipeline_total = [{"$match": {"role": "staff"}}, {"$group": {"_id": "$department", "count": {"$sum": 1}}}]
    totals = {d["_id"] or "Unassigned": d["count"] for d in await db.users.aggregate(pipeline_total).to_list(100)}
    pipeline_present = [
        {"$match": {"timestamp": {"$gte": today_start}, "type": "in", "accepted": True}},
        {"$group": {"_id": {"u": "$user_id", "d": "$department"}}},
        {"$group": {"_id": "$_id.d", "count": {"$sum": 1}}},
    ]
    present = {d["_id"] or "Unassigned": d["count"] for d in await db.attendance.aggregate(pipeline_present).to_list(100)}
    out = []
    for dept, tot in totals.items():
        p = present.get(dept, 0)
        out.append({
            "department": dept,
            "total": tot,
            "present": p,
            "absent": max(0, tot - p),
            "pct": round((p / tot) * 100, 1) if tot else 0,
        })
    return sorted(out, key=lambda x: -x["pct"])


# ---------- ADMIN: GEOFENCE CRUD (in-memory for demo) ----------
class GeofenceBody(BaseModel):
    name: str
    address: Optional[str] = ""
    lat: float
    lon: float
    radius_m: int = 200
    type: str = "office"  # office | branch | wfh | client
    active: bool = True


@api.post("/admin/geofences")
async def admin_create_geofence(body: GeofenceBody, user: dict = Depends(get_current_user)):
    if user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    g = body.dict()
    g["id"] = f"fence-{uuid.uuid4().hex[:8]}"
    GEOFENCES.append(g)
    return g


@api.put("/admin/geofences/{fid}")
async def admin_update_geofence(fid: str, body: GeofenceBody, user: dict = Depends(get_current_user)):
    if user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    for g in GEOFENCES:
        if g["id"] == fid:
            g.update(body.dict())
            return g
    raise HTTPException(404, "Not found")


@api.delete("/admin/geofences/{fid}")
async def admin_delete_geofence(fid: str, user: dict = Depends(get_current_user)):
    if user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    global GEOFENCES
    before = len(GEOFENCES)
    GEOFENCES = [g for g in GEOFENCES if g["id"] != fid]
    if len(GEOFENCES) == before:
        raise HTTPException(404, "Not found")
    return {"deleted": True}


# ---------- ADMIN: REPORTS ----------
@api.get("/admin/reports/monthly")
async def admin_monthly_report(user: dict = Depends(get_current_user), month: Optional[str] = None):
    """month format: YYYY-MM. Defaults to current month."""
    if user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    now = datetime.now(timezone.utc)
    if month:
        try:
            y, m = month.split("-")
            start = datetime(int(y), int(m), 1, tzinfo=timezone.utc)
        except Exception:
            start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    else:
        start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    next_m = (start.replace(day=28) + timedelta(days=4)).replace(day=1)
    cursor = db.attendance.find(
        {"timestamp": {"$gte": start.isoformat(), "$lt": next_m.isoformat()}, "type": "in", "accepted": True},
        {"_id": 0},
    )
    items = await cursor.to_list(20000)
    # group by user
    by_user: dict = {}
    for it in items:
        u = it["user_id"]
        by_user.setdefault(u, {"name": it.get("name"), "department": it.get("department"), "present": 0, "late": 0, "wfh": 0})
        by_user[u]["present"] += 1
        if it.get("status") == "late":
            by_user[u]["late"] += 1
        if it.get("attendance_type") == "wfh":
            by_user[u]["wfh"] += 1
    return {
        "month": start.strftime("%B %Y"),
        "start": start.isoformat(),
        "rows": [{"user_id": u, **v} for u, v in by_user.items()],
    }

# ---------- mess capacity (live simulated) ----------
import math
import random as _rand

MESSES = [
    {
        "id": "mess_it",
        "name": "IT Mess",
        "location": "Behind IT Block, Phase-1",
        "capacity": 280,
        "distance_m": 120,
        "hours": {"breakfast": "7:30 - 9:30 AM", "lunch": "12:30 - 2:30 PM", "snacks": "5:00 - 6:30 PM", "dinner": "7:30 - 9:30 PM"},
        "menu": {
            "breakfast": ["Idli & Sambar", "Mini Dosa", "Boiled Eggs", "Upma", "Tea / Coffee"],
            "lunch": ["Veg Biryani", "Dal Tadka", "Aloo Gobi", "Curd Rice", "Salad", "Gulab Jamun"],
            "snacks": ["Veg Puff", "Masala Chai", "Bhel Puri"],
            "dinner": ["Roti", "Paneer Butter Masala", "Jeera Rice", "Mixed Veg", "Ice Cream"],
        },
    },
    {
        "id": "mess_dorms",
        "name": "Dorms Mess",
        "location": "Boys Hostel Complex, Block-C",
        "capacity": 420,
        "distance_m": 380,
        "hours": {"breakfast": "7:00 - 9:30 AM", "lunch": "12:30 - 2:30 PM", "snacks": "5:00 - 6:30 PM", "dinner": "7:30 - 10:00 PM"},
        "menu": {
            "breakfast": ["Aloo Paratha", "Poha", "Omelette", "Cornflakes & Milk", "Tea / Coffee"],
            "lunch": ["Chicken Curry", "Veg Pulao", "Dal Makhani", "Mixed Veg", "Roti", "Pickle"],
            "snacks": ["Samosa", "Vada Pav", "Filter Coffee"],
            "dinner": ["Butter Roti", "Egg Curry", "Steamed Rice", "Bhindi Fry", "Sweet Lassi"],
        },
    },
    {
        "id": "mess_phase2",
        "name": "Phase-2 Mess",
        "location": "Girls Hostel Complex, Phase-2",
        "capacity": 320,
        "distance_m": 540,
        "hours": {"breakfast": "7:30 - 9:30 AM", "lunch": "12:30 - 2:30 PM", "snacks": "5:00 - 6:30 PM", "dinner": "7:30 - 9:30 PM"},
        "menu": {
            "breakfast": ["Masala Dosa", "Pongal", "Boiled Eggs", "Fruits", "Tea / Coffee"],
            "lunch": ["Hyderabadi Biryani", "Dal Fry", "Bhindi Masala", "Raita", "Salad", "Kheer"],
            "snacks": ["Pav Bhaji", "Cold Coffee", "Cookies"],
            "dinner": ["Tandoori Roti", "Veg Kofta", "Steamed Rice", "Aloo Methi", "Gulab Jamun"],
        },
    },
]


def _current_meal(now: datetime) -> str:
    h, m = now.hour, now.minute
    t = h + m / 60.0
    if 7.0 <= t < 9.75:
        return "breakfast"
    if 12.25 <= t < 14.75:
        return "lunch"
    if 17.0 <= t < 18.75:
        return "snacks"
    if 19.25 <= t < 22.0:
        return "dinner"
    return "closed"


def _next_meal(now: datetime) -> str:
    t = now.hour + now.minute / 60.0
    if t < 7.0: return "breakfast"
    if t < 12.25: return "lunch"
    if t < 17.0: return "snacks"
    if t < 19.25: return "dinner"
    return "breakfast"  # next day


def _peak_factor(now: datetime, mess_id: str) -> float:
    """Returns 0..1 occupancy factor based on time-of-day with mess-specific bias."""
    h = now.hour + now.minute / 60.0
    # bell curves around meal peaks (height tuned so peak ~ 0.6-0.85 by mess)
    peaks = [(8.25, 0.55), (13.25, 0.85), (17.75, 0.35), (20.25, 0.7)]
    val = 0.04  # baseline (cleaning / staff)
    for center, height in peaks:
        sigma = 0.55
        val += height * math.exp(-((h - center) ** 2) / (2 * sigma * sigma))
    # mess-specific bias
    bias = {"mess_it": 0.78, "mess_dorms": 1.1, "mess_phase2": 0.9}.get(mess_id, 1.0)
    val = min(0.95, val * bias)
    # add small jitter that changes every ~minute
    seed = int(now.timestamp() // 60) + sum(ord(c) for c in mess_id)
    rng = _rand.Random(seed)
    val = max(0.0, min(0.97, val + rng.uniform(-0.06, 0.06)))
    return val


def _status_for(occ_pct: float, meal: str) -> dict:
    if meal == "closed":
        return {"label": "Closed", "color": "#94A3B8", "tone": "muted"}
    if occ_pct < 30:
        return {"label": "Almost Empty", "color": "#10B981", "tone": "good"}
    if occ_pct < 60:
        return {"label": "Comfortable", "color": "#22C55E", "tone": "good"}
    if occ_pct < 80:
        return {"label": "Crowded", "color": "#F59E0B", "tone": "warn"}
    if occ_pct < 95:
        return {"label": "Very Crowded", "color": "#EF4444", "tone": "bad"}
    return {"label": "Packed — Wait", "color": "#B71429", "tone": "bad"}


@api.get("/mess/list")
async def mess_list(demo: Optional[str] = None):
    """Returns live mess capacity. Pass ?demo=breakfast|lunch|snacks|dinner to force a meal preview."""
    now = datetime.now()
    forced_meal = demo if demo in ("breakfast", "lunch", "snacks", "dinner") else None
    meal = forced_meal or _current_meal(now)
    next_m = _next_meal(now)
    out = []
    for m in MESSES:
        if meal == "closed":
            current = int(round(m["capacity"] * 0.04))  # cleaning / staff present
            occ_pct = round((current / m["capacity"]) * 100, 1)
        else:
            # If demo forced, simulate that meal's peak by shifting "now" to the peak hour
            if forced_meal:
                peak_centers = {"breakfast": 8.25, "lunch": 13.25, "snacks": 17.75, "dinner": 20.25}
                fake = now.replace(hour=int(peak_centers[forced_meal]),
                                   minute=int((peak_centers[forced_meal] % 1) * 60))
                factor = _peak_factor(fake, m["id"])
            else:
                factor = _peak_factor(now, m["id"])
            current = int(round(m["capacity"] * factor))
            occ_pct = round((current / m["capacity"]) * 100, 1)
        wait_minutes = 0
        if occ_pct >= 95:
            wait_minutes = 12
        elif occ_pct >= 80:
            wait_minutes = 6
        elif occ_pct >= 60:
            wait_minutes = 2
        display_meal = meal if meal != "closed" else next_m
        out.append({
            **m,
            "current": current,
            "occupancy_pct": occ_pct,
            "current_meal": meal,
            "next_meal": next_m,
            "display_meal": display_meal,
            "today_menu": m["menu"].get(display_meal, []),
            "next_meal_hours": m["hours"].get(next_m, ""),
            "status": _status_for(occ_pct, meal),
            "wait_minutes": wait_minutes,
            "updated_at": now.isoformat() + "Z",
        })
    open_ones = [x for x in out if x["current_meal"] != "closed"]
    if open_ones:
        rec = min(open_ones, key=lambda x: x["occupancy_pct"])
        for x in out:
            x["recommended"] = (x["id"] == rec["id"])
    else:
        for x in out:
            x["recommended"] = False
    return {"meal": meal, "next_meal": next_m, "server_time": now.isoformat() + "Z", "messes": out}


# ---------- mount ----------
app.include_router(api)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown():
    client.close()
