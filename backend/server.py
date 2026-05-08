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
    {"email": "student@univ.edu", "password": "student123", "name": "Aarav Sharma", "role": "student", "department": "Computer Science", "student_id": "CS2023001"},
    {"email": "student2@univ.edu", "password": "student123", "name": "Diya Patel", "role": "student", "department": "Mechanical", "student_id": "ME2023045"},
    {"email": "faculty@univ.edu", "password": "faculty123", "name": "Dr. Rajesh Kumar", "role": "staff", "department": "Faculty - Computer Science", "employee_id": "FAC1023"},
    {"email": "librarian@univ.edu", "password": "librarian123", "name": "Mrs. Anita Nair", "role": "staff", "department": "Library", "employee_id": "LIB204"},
    {"email": "warden@univ.edu", "password": "warden123", "name": "Mr. Vikram Singh", "role": "staff", "department": "Hostel", "employee_id": "HOS101"},
    {"email": "security@univ.edu", "password": "security123", "name": "Mr. Ramesh Kale", "role": "staff", "department": "Security", "employee_id": "SEC011"},
    {"email": "exam@univ.edu", "password": "exam123", "name": "Dr. Kavita Joshi", "role": "staff", "department": "Examination Cell", "employee_id": "EXM002"},
    {"email": "admin@univ.edu", "password": "admin123", "name": "Prof. Suresh Mehta", "role": "admin", "department": "Administration", "employee_id": "ADM001"},
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
        {"role": "student", "email": "student@univ.edu", "password": "student123", "name": "Aarav Sharma"},
        {"role": "staff", "email": "faculty@univ.edu", "password": "faculty123", "name": "Dr. Rajesh Kumar (Faculty)"},
        {"role": "staff", "email": "librarian@univ.edu", "password": "librarian123", "name": "Mrs. Anita Nair (Librarian)"},
        {"role": "staff", "email": "warden@univ.edu", "password": "warden123", "name": "Mr. Vikram Singh (Warden)"},
        {"role": "staff", "email": "security@univ.edu", "password": "security123", "name": "Mr. Ramesh Kale (Security)"},
        {"role": "staff", "email": "exam@univ.edu", "password": "exam123", "name": "Dr. Kavita Joshi (Exam Cell)"},
        {"role": "admin", "email": "admin@univ.edu", "password": "admin123", "name": "Prof. Suresh Mehta"},
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
CAMPUS_LAT = 19.0760
CAMPUS_LON = 72.8777

def haversine_m(lat1, lon1, lat2, lon2):
    from math import radians, sin, cos, sqrt, atan2
    R = 6371000
    p1, p2 = radians(lat1), radians(lat2)
    dlat = radians(lat2 - lat1)
    dlon = radians(lon2 - lon1)
    a = sin(dlat/2)**2 + cos(p1)*cos(p2)*sin(dlon/2)**2
    return 2*R*atan2(sqrt(a), sqrt(1-a))

@api.post("/attendance/check")
async def attendance_check(body: AttendanceCheckIn, user: dict = Depends(get_current_user)):
    distance = haversine_m(body.latitude, body.longitude, CAMPUS_LAT, CAMPUS_LON)
    on_campus = distance <= 5000  # 5km demo radius (campus area)
    rec = {
        "id": str(uuid.uuid4()),
        "user_id": user["id"],
        "name": user["name"],
        "type": body.type,
        "lat": body.latitude,
        "lon": body.longitude,
        "distance_m": round(distance, 1),
        "on_campus": on_campus,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
    await db.attendance.insert_one({**rec})
    rec.pop("_id", None)
    return rec

@api.get("/attendance/history")
async def attendance_history(user: dict = Depends(get_current_user)):
    cursor = db.attendance.find({"user_id": user["id"]}, {"_id": 0}).sort("timestamp", -1).limit(30)
    return await cursor.to_list(30)

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
