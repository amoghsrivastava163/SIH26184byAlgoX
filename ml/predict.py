from pathlib import Path
import joblib
from .train import FEATURES
def score(features:dict):
    package=joblib.load(Path(__file__).parent/"artifacts"/"rf-v1.joblib")
    probability=package["model"].predict_proba([[features[k] for k in FEATURES]])[0][1]
    return {"probability":float(probability),"risk_score":round(probability*100),"model":"RF-v1.0"}
