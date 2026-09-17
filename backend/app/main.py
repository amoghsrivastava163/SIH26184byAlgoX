"""CyberCash Predict API: synthetic-data-only investigative decision support."""
from datetime import datetime, timedelta, timezone
from hashlib import sha256
from random import Random
from typing import Literal
import os
import jwt
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
from fastapi import FastAPI, Depends, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel

app = FastAPI(title="CyberCash Predict API", version="1.0.0", description="Synthetic data only. Predictions are probabilistic decision-support signals.")
app.add_middleware(CORSMiddleware, allow_origins=os.getenv("CORS_ORIGINS", "http://localhost:5173").split(","), allow_methods=["*"], allow_headers=["*"])
secret = os.getenv("JWT_SECRET", "development-only-change-me")
auth = HTTPBearer()
rng = Random(26184)
districts = [
    ("Bhopal", 23.2599, 77.4126), ("Indore", 22.7196, 75.8577),
    ("Gwalior", 26.2183, 78.1828), ("Jabalpur", 23.1815, 79.9864),
    ("Ujjain", 23.1765, 75.7885), ("Sagar", 23.8388, 78.7378),
    ("Satna", 24.6005, 80.8322), ("Rewa", 24.5362, 81.3040),
    ("Dewas", 22.9676, 76.0534), ("Ratlam", 23.3315, 75.0367),
    ("Khandwa", 21.8247, 76.3526), ("Shivpuri", 25.4320, 77.6644),
]
zones = [district[0] for district in districts[:8]]
bank_names = ["National Trust", "Civic Bank", "Union Digital", "SecurePay"]
now = datetime.now(timezone.utc)

def risk(score: int) -> str: return "CRITICAL" if score >= 90 else "HIGH" if score >= 75 else "MEDIUM" if score >= 40 else "LOW"
def signals(score: int):
    base=["Recent suspicious transaction activity", "Historical withdrawal pattern", "Spatial proximity to related signals", "Evening activity concentration", "Related case concentration"]
    return base[: 2 + (score >= 75) + (score >= 50)]
atms=[]
for i in range(1, 121):
    score=(i*19+17)%88+8
    district, base_lat, base_lng = districts[(i - 1) % len(districts)]
    offset_lat = ((i * 17) % 11 - 5) * .012
    offset_lng = ((i * 23) % 11 - 5) * .012
    atms.append({"id":f"ATM-{i:03d}","zone":district,"district":district,"bank":bank_names[i%4],"address":f"{district} synthetic operational location {i}", "lat":base_lat+offset_lat,"lng":base_lng+offset_lng,"risk_score":score,"risk_level":risk(score),"window":"02:00 – 04:00" if score>=75 else "14:00 – 17:00" if score>=40 else "09:00 – 12:00","activity":(i*7)%42,"incidents":(i*3)%13,"updated":now.isoformat(),"signals":signals(score)})
cases=[{"id":f"CASE-2026-{i:03d}","fraud_type":["UPI impersonation","Investment scam","Remote access fraud"][i%3],"amount":round(32000+i*7931.4,2),"status":["New","Investigating","Escalated","Resolved"][i%4],"priority":["High","Medium","Low"][i%3],"created":(now-timedelta(days=i)).date().isoformat(),"risk_score":(i*13)%75+25,"atm_id":atms[(i*5)%len(atms)]["id"]} for i in range(1,49)]
transactions=[{"id":f"TXN-{i:05d}","timestamp":(now-timedelta(hours=i*3)).isoformat(),"sender":f"ACC-{(i*7)%900:04d}","receiver":f"ACC-{(i*13)%900:04d}","amount":round(500+(i*1793)%180000,2),"suspicious":i%5==0,"risk":risk((i*17)%98+2),"case_id":cases[i%len(cases)]["id"],"atm_id":atms[(i*11)%len(atms)]["id"],"zone":atms[(i*11)%len(atms)]["zone"]} for i in range(1,801)]
alerts=[{"id":f"ALT-{i:03d}","title":"High-risk ATM zone" if i%2 else "Suspicious transaction cluster","zone":zones[i%8],"score":82+(i%15),"window":"19:00 – 22:00","status":"NEW" if i<6 else "ACKNOWLEDGED","created":(now-timedelta(hours=i*4)).isoformat(),"atm_id":atms[i]["id"]} for i in range(1,13)]
complaints=[]
for i in range(1, 37):
    atm = atms[(i * 11) % len(atms)]
    transaction = transactions[(i * 19) % len(transactions)]
    linked_case = cases[(i * 3) % len(cases)]
    complaints.append({
        "id": f"CMP-{1041 + i}", "reference_number": f"CMP-{1041 + i}",
        "reported_at": (now-timedelta(days=i, hours=i % 14)).isoformat(),
        "fraud_type": ["UPI Fraud", "Investment scam", "Remote access fraud", "Impersonation fraud"][i % 4],
        "amount": round(12500 + i * 3675.5, 2), "district": atm["district"],
        "police_station": f"{atm['district']} Cyber Cell", "transaction_id": transaction["id"],
        "bank": atm["bank"], "transaction_time": transaction["timestamp"],
        "transaction_amount": transaction["amount"], "suspected_atm_id": atm["id"],
        "suspected_district": atm["district"], "suspected_time_window": atm["window"],
        "description": "Synthetic complaint record for prototype risk-analysis demonstration.",
        "status": ["NEW", "ACTIVE", "UNDER REVIEW", "ANALYZED", "ESCALATED", "CLOSED"][i % 6],
        "priority": ["LOW", "MEDIUM", "HIGH"][i % 3], "risk_score": atm["risk_score"],
        "created_at": (now-timedelta(days=i)).isoformat(), "updated_at": now.isoformat(),
        "related_transactions": [transaction["id"]], "related_atms": [atm["id"]],
        "related_alerts": [alerts[i % len(alerts)]["id"]], "related_case": linked_case["id"],
        "prediction_id": f"PRED-{atm['id']}", "analysis": None
    })
users={"admin@cybercash.local":("DemoAdmin!2026","Admin"),"investigator@cybercash.local":("DemoInvestigator!2026","Investigator"),"analyst@cybercash.local":("DemoAnalyst!2026","Analyst")}
google_users: dict[str, dict] = {}
notifications: list[dict] = []

class Login(BaseModel): email:str; password:str
class AlertUpdate(BaseModel): status:Literal["NEW","ACKNOWLEDGED","READ"]
class ComplaintCreate(BaseModel):
    reference_number: str
    reported_at: datetime
    fraud_type: str
    amount: float
    district: str
    police_station: str
    transaction_id: str
    bank: str
    transaction_time: datetime
    transaction_amount: float
    suspected_atm_id: str
    suspected_district: str
    suspected_time_window: str
    description: str
    priority: Literal["LOW", "MEDIUM", "HIGH"] = "MEDIUM"
class ComplaintUpdate(BaseModel):
    status: Literal["NEW", "ACTIVE", "UNDER REVIEW", "ANALYZED", "ESCALATED", "CLOSED"] | None = None
    priority: Literal["LOW", "MEDIUM", "HIGH"] | None = None
    description: str | None = None
class GoogleCredential(BaseModel): credential: str
class UserComplaintCreate(BaseModel):
    fraud_type: str; occurred_at: datetime; amount: float; bank: str; transaction_id: str; district: str; description: str
def current_user(c:HTTPAuthorizationCredentials=Depends(auth)):
    try:return jwt.decode(c.credentials,secret,algorithms=["HS256"])
    except jwt.PyJWTError: raise HTTPException(401,"Invalid or expired session")
def require(*roles):
    def check(user=Depends(current_user)):
        if user["role"] not in roles: raise HTTPException(403,"This role cannot access this resource")
        return user
    return check

@app.post("/api/auth/login")
def login(data:Login):
    record=users.get(data.email)
    if not record or data.password!=record[0]: raise HTTPException(401,"Invalid Officer ID or password")
    token=jwt.encode({"sub":data.email,"role":record[1],"exp":now+timedelta(hours=8)},secret,algorithm="HS256")
    return {"access_token":token,"token_type":"bearer","user":{"email":data.email,"role":record[1]}}
@app.post("/api/auth/google")
def google_login(data: GoogleCredential):
    client_id = os.getenv("GOOGLE_CLIENT_ID")
    if not client_id: raise HTTPException(503, "Google sign-in is not configured")
    try: identity = id_token.verify_oauth2_token(data.credential, google_requests.Request(), client_id)
    except Exception: raise HTTPException(401, "Google credential verification failed")
    if not identity.get("sub") or not identity.get("email_verified"): raise HTTPException(401, "Verified Google email is required")
    google_sub = identity["sub"]
    account = google_users.get(google_sub)
    if not account:
        account = {"google_sub":google_sub,"email":identity.get("email", ""),"name":identity.get("name", "Citizen"),"profile_picture":identity.get("picture"),"email_verified":True,"role":"USER","created_at":now.isoformat(),"updated_at":now.isoformat()}; google_users[google_sub] = account
    else: account.update({"email":identity.get("email",account["email"]),"name":identity.get("name",account["name"]),"profile_picture":identity.get("picture",account.get("profile_picture")),"updated_at":datetime.now(timezone.utc).isoformat()})
    token=jwt.encode({"sub":google_sub,"role":"USER","name":account["name"],"exp":datetime.now(timezone.utc)+timedelta(hours=8)},secret,algorithm="HS256")
    return {"access_token":token,"token_type":"bearer","user":account}
@app.get("/api/auth/me")
def me(user=Depends(current_user)): return google_users.get(user["sub"], {"email":user["sub"],"role":user["role"],"name":user.get("name",user["role"])})
@app.get("/api/dashboard/summary")
def summary(user=Depends(current_user)):
    return {"active_cases":sum(c["status"] not in ["Resolved","Closed"] for c in cases),"high_risk_zones":len({a["zone"] for a in atms if a["risk_level"]=="HIGH"}),"suspicious_transactions":sum(t["suspicious"] for t in transactions),"active_alerts":sum(a["status"]=="NEW" for a in alerts),"quality":"Model ready · synthetic validation"}
@app.get("/api/atms")
def list_atms(q:str="", level:str="", zone:str="", skip:int=0, limit:int=100, user=Depends(current_user)):
    result=[a for a in atms if (not q or q.lower() in str(a).lower()) and (not level or a["risk_level"]==level) and (not zone or a["zone"]==zone)]
    return {"items":result[skip:skip+min(limit,200)],"total":len(result)}
@app.get("/api/atms/{atm_id}")
def atm(atm_id:str,user=Depends(current_user)):
    value=next((a for a in atms if a["id"]==atm_id),None)
    if not value: raise HTTPException(404,"ATM not found")
    return {**value,"related_cases":cases[:3],"hourly_activity":[{"hour":f"{h:02d}:00","value":(h*9+int(value["id"][-3:]))%26} for h in range(24)],"disclaimer":"Predictions are probabilistic decision-support signals generated from historical and synthetic data. They do not establish that a crime will occur or identify an individual as a criminal."}
@app.get("/api/transactions")
def list_transactions(q:str="", suspicious:bool|None=None, skip:int=0, limit:int=50,user=Depends(current_user)):
    items=[t for t in transactions if (not q or q.lower() in str(t).lower()) and (suspicious is None or t["suspicious"]==suspicious)]
    return {"items":items[skip:skip+min(limit,100)],"total":len(items)}
@app.get("/api/cases")
def list_cases(user=Depends(require("Admin","Investigator","Analyst"))): return {"items":cases}
@app.get("/api/complaints")
def list_complaints(q:str="", status:str="", priority:str="", district:str="", fraud_type:str="", user=Depends(require("Admin","Investigator","Analyst"))):
    items = [c for c in complaints if (not q or q.lower() in str(c).lower()) and (not status or c["status"] == status) and (not priority or c["priority"] == priority) and (not district or c["district"] == district) and (not fraud_type or c["fraud_type"] == fraud_type)]
    return {"items": items, "total": len(items), "dataset": "Synthetic operational dataset"}
@app.get("/api/complaints/{complaint_id}")
def get_complaint(complaint_id:str, user=Depends(require("Admin","Investigator","Analyst"))):
    complaint = next((c for c in complaints if c["id"] == complaint_id), None)
    if not complaint: raise HTTPException(404, "Complaint not found")
    return complaint
@app.post("/api/complaints", status_code=201)
def create_complaint(data:ComplaintCreate, user=Depends(require("Admin","Investigator"))):
    if any(c["reference_number"] == data.reference_number for c in complaints): raise HTTPException(409, "Complaint reference already exists")
    atm = next((a for a in atms if a["id"] == data.suspected_atm_id), None)
    if not atm: raise HTTPException(422, "Suspected ATM was not found")
    item = {"id":data.reference_number, **data.model_dump(mode="json"), "status":"NEW", "risk_score":atm["risk_score"], "created_at":now.isoformat(), "updated_at":now.isoformat(), "related_transactions":[data.transaction_id], "related_atms":[data.suspected_atm_id], "related_alerts":[], "related_case":None, "prediction_id":f"PRED-{data.suspected_atm_id}", "analysis":None}
    complaints.insert(0, item); return item
@app.patch("/api/complaints/{complaint_id}")
def update_complaint(complaint_id:str, data:ComplaintUpdate, user=Depends(require("Admin","Investigator"))):
    complaint = next((c for c in complaints if c["id"] == complaint_id), None)
    if not complaint: raise HTTPException(404, "Complaint not found")
    for key, val in data.model_dump(exclude_none=True).items(): complaint[key] = val
    complaint["updated_at"] = datetime.now(timezone.utc).isoformat(); return complaint
@app.post("/api/user/complaints", status_code=201)
def create_user_complaint(data: UserComplaintCreate, user=Depends(require("USER"))):
    if data.amount <= 0: raise HTTPException(422, "Amount must be greater than zero")
    account = google_users.get(user["sub"])
    if not account: raise HTTPException(401, "Citizen session is not recognized")
    reference = f"CMP-{1042 + len(complaints)}"
    item = {"id":reference,"reference_number":reference,"reported_at":datetime.now(timezone.utc).isoformat(),"fraud_type":data.fraud_type,"amount":data.amount,"district":data.district,"police_station":"Citizen online report","transaction_id":data.transaction_id,"bank":data.bank,"transaction_time":data.occurred_at.isoformat(),"transaction_amount":data.amount,"suspected_atm_id":"","suspected_district":data.district,"suspected_time_window":"Not assessed","description":data.description,"status":"SUBMITTED","priority":"MEDIUM","risk_score":None,"created_at":datetime.now(timezone.utc).isoformat(),"updated_at":datetime.now(timezone.utc).isoformat(),"related_transactions":[data.transaction_id],"related_atms":[],"related_alerts":[],"related_case":None,"prediction_id":None,"analysis":None,"owner_google_sub":user["sub"],"reporter_name":account["name"]}
    complaints.insert(0,item)
    notifications.insert(0,{"id":f"NTF-{len(notifications)+1:04d}","notification_type":"NEW_COMPLAINT","title":"New Complaint Registered","message":f"{item['fraud_type']} · ₹{item['amount']:,.0f} · {item['district']}","complaint_id":reference,"recipient_role":"INVESTIGATOR","is_read":False,"created_at":datetime.now(timezone.utc).isoformat()})
    return item
@app.get("/api/user/complaints")
def user_complaints(user=Depends(require("USER"))): return {"items":[c for c in complaints if c.get("owner_google_sub") == user["sub"]]}
@app.get("/api/user/complaints/{complaint_id}")
def user_complaint_detail(complaint_id:str,user=Depends(require("USER"))):
    item=next((c for c in complaints if c["id"]==complaint_id and c.get("owner_google_sub")==user["sub"]),None)
    if not item: raise HTTPException(404,"Complaint not found")
    return {key:value for key,value in item.items() if key not in {"risk_score","analysis","related_atms","related_alerts","related_case","prediction_id","owner_google_sub"}}
@app.get("/api/notifications")
def list_notifications(user=Depends(require("Admin","Investigator"))):
    items=[note for note in notifications if note["recipient_role"] == "INVESTIGATOR"]
    return {"items":items[:50],"unread_count":sum(not note["is_read"] for note in items)}
@app.patch("/api/notifications/read-all")
def read_all_notifications(user=Depends(require("Admin","Investigator"))):
    for note in notifications:
        if note["recipient_role"] == "INVESTIGATOR": note["is_read"] = True
    return {"status":"ok"}
@app.patch("/api/notifications/{notification_id}/read")
def read_notification(notification_id:str,user=Depends(require("Admin","Investigator"))):
    note=next((note for note in notifications if note["id"]==notification_id and note["recipient_role"]=="INVESTIGATOR"),None)
    if not note: raise HTTPException(404,"Notification not found")
    note["is_read"] = True; return note
@app.post("/api/complaints/{complaint_id}/analyze")
def analyze_complaint(complaint_id:str, user=Depends(require("Admin","Investigator","Analyst"))):
    complaint = next((c for c in complaints if c["id"] == complaint_id), None)
    if not complaint: raise HTTPException(404, "Complaint not found")
    same_district = [a for a in atms if a["district"] == complaint["district"]]
    candidates = sorted(same_district or atms, key=lambda a:a["risk_score"], reverse=True)[:4]
    analysis = {"complaint_id":complaint_id, "candidates":[{"atm_id":a["id"], "district":a["district"], "risk_score":a["risk_score"], "risk_level":a["risk_level"], "window":a["window"]} for a in candidates], "risk_factors":[{"name":"Transaction timing", "level":"HIGH" if complaint["priority"] == "HIGH" else "MEDIUM"}, {"name":"Geographic proximity", "level":"HIGH"}, {"name":"Historical activity", "level":"MEDIUM"}, {"name":"Complaint concentration", "level":"MEDIUM"}], "predicted_window":candidates[0]["window"], "notice":"Model-generated risk signal based on synthetic operational data."}
    complaint["analysis"] = analysis; complaint["status"] = "ANALYZED"; complaint["updated_at"] = datetime.now(timezone.utc).isoformat(); return analysis
@app.get("/api/alerts")
def list_alerts(user=Depends(require("Admin","Investigator"))): return {"items":alerts}
@app.patch("/api/alerts/{alert_id}")
def update_alert(alert_id:str,data:AlertUpdate,user=Depends(require("Admin","Investigator"))):
    value=next((a for a in alerts if a["id"]==alert_id),None)
    if not value: raise HTTPException(404,"Alert not found")
    value["status"]=data.status; return value
@app.get("/api/analytics/hourly")
def hourly(user=Depends(current_user)): return [{"hour":f"{i:02d}:00","activity":(i*i+7*i+9)%32+3} for i in range(24)]
@app.get("/api/analytics/zones")
def zone_data(user=Depends(current_user)): return [{"zone":z,"risk":round(sum(a["risk_score"] for a in atms if a["zone"]==z)/15)} for z in zones]
@app.get("/api/predictions")
def predictions(user=Depends(current_user)):
    return {"items":[{"id":f"PRED-{a['id']}","timestamp":a["updated"],"zone":a["zone"],"atm_id":a["id"],"risk_score":a["risk_score"],"risk_level":a["risk_level"],"predicted_window":a["window"],"model_version":"RF-v1.0","signals":a["signals"]} for a in atms]}
@app.post("/api/predictions/run")
def run_predictions(user=Depends(require("Admin","Analyst"))):
    return {"status":"seed predictions refreshed","model_version":"RF-v1.0","count":len(atms),"notice":"Train ml package before production use."}
@app.get("/api/models")
def models(user=Depends(require("Admin","Analyst"))): return {"items":[{"id":"RF-v1.0","algorithm":"Random Forest","trained_at":"Synthetic seed dataset","samples":8000,"precision":None,"recall":None,"f1":None,"roc_auc":None,"status":"Train with python -m ml.train to publish evaluated metrics"}]}
@app.post("/api/reports")
def report(user=Depends(require("Admin","Investigator"))): return {"title":"CyberCash Predict Risk Summary","generated_at":datetime.now(timezone.utc).isoformat(),"high_risk_atms":[a["id"] for a in atms if a["risk_level"]=="HIGH"][:10],"disclaimer":"Synthetic decision-support report; not evidence of criminal conduct."}
