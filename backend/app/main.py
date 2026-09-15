"""CyberCash Predict API: synthetic-data-only investigative decision support."""
from datetime import datetime, timedelta, timezone
from hashlib import sha256
from random import Random
from typing import Literal
import os
import jwt
from fastapi import FastAPI, Depends, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel

app = FastAPI(title="CyberCash Predict API", version="1.0.0", description="Synthetic data only. Predictions are probabilistic decision-support signals.")
app.add_middleware(CORSMiddleware, allow_origins=os.getenv("CORS_ORIGINS", "http://localhost:5173").split(","), allow_methods=["*"], allow_headers=["*"])
secret = os.getenv("JWT_SECRET", "development-only-change-me")
auth = HTTPBearer()
rng = Random(26184)
zones = [f"Zone {i}" for i in range(1, 9)]
bank_names = ["National Trust", "Civic Bank", "Union Digital", "SecurePay"]
now = datetime.now(timezone.utc)

def risk(score: int) -> str: return "HIGH" if score >= 75 else "MEDIUM" if score >= 40 else "LOW"
def signals(score: int):
    base=["Recent suspicious transaction activity", "Historical withdrawal pattern", "Spatial proximity to related signals", "Evening activity concentration", "Related case concentration"]
    return base[: 2 + (score >= 75) + (score >= 50)]
atms=[]
for i in range(1, 121):
    score=(i*19+17)%88+8
    atms.append({"id":f"ATM-{i:03d}","zone":zones[(i-1)%8],"bank":bank_names[i%4],"address":f"Synthetic location {i}, Bengaluru", "lat":12.91+(i%15)*.008,"lng":77.52+(i//15)*.011,"risk_score":score,"risk_level":risk(score),"window":"19:00 – 22:00" if score>=75 else "14:00 – 17:00" if score>=40 else "09:00 – 12:00","activity":(i*7)%42,"incidents":(i*3)%13,"updated":now.isoformat(),"signals":signals(score)})
cases=[{"id":f"CASE-2026-{i:03d}","fraud_type":["UPI impersonation","Investment scam","Remote access fraud"][i%3],"amount":round(32000+i*7931.4,2),"status":["New","Investigating","Escalated","Resolved"][i%4],"priority":["High","Medium","Low"][i%3],"created":(now-timedelta(days=i)).date().isoformat(),"risk_score":(i*13)%75+25} for i in range(1,49)]
transactions=[{"id":f"TXN-{i:05d}","timestamp":(now-timedelta(hours=i*3)).isoformat(),"sender":f"ACC-{(i*7)%900:04d}","receiver":f"ACC-{(i*13)%900:04d}","amount":round(500+(i*1793)%180000,2),"suspicious":i%5==0,"risk":risk((i*17)%98+2),"case_id":cases[i%len(cases)]["id"],"zone":zones[i%8]} for i in range(1,801)]
alerts=[{"id":f"ALT-{i:03d}","title":"High-risk ATM zone" if i%2 else "Suspicious transaction cluster","zone":zones[i%8],"score":82+(i%15),"window":"19:00 – 22:00","status":"NEW" if i<6 else "ACKNOWLEDGED","created":(now-timedelta(hours=i*4)).isoformat(),"atm_id":atms[i]["id"]} for i in range(1,13)]
users={"admin@cybercash.local":("DemoAdmin!2026","Admin"),"investigator@cybercash.local":("DemoInvestigator!2026","Investigator"),"analyst@cybercash.local":("DemoAnalyst!2026","Analyst")}

class Login(BaseModel): email:str; password:str
class AlertUpdate(BaseModel): status:Literal["NEW","ACKNOWLEDGED","READ"]
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
@app.get("/api/auth/me")
def me(user=Depends(current_user)): return user
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
