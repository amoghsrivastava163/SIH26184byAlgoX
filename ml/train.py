"""Train an actual deterministic baseline and Random Forest model on synthetic data."""
from pathlib import Path
import json
import joblib
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import precision_recall_fscore_support, roc_auc_score
from sklearn.model_selection import train_test_split

FEATURES=["amount","recent_activity","historical_incidents","distance_km","hour","weekend","mule_risk","zone_risk"]
def synthetic_dataset(n=8000,seed=26184):
    r=np.random.default_rng(seed); x=np.column_stack([r.lognormal(9.2,1,n),r.poisson(8,n),r.poisson(4,n),r.exponential(2,n),r.integers(0,24,n),r.integers(0,2,n),r.uniform(0,1,n),r.uniform(0,1,n)])
    logit=-5+.000025*x[:,0]+.13*x[:,1]+.11*x[:,2]-.22*x[:,3]+.5*(x[:,4]>=18)+1.2*x[:,6]+.9*x[:,7]
    y=r.binomial(1,1/(1+np.exp(-logit))); return x,y
def main():
    x,y=synthetic_dataset(); xt,xv,yt,yv=train_test_split(x,y,test_size=.25,random_state=26184,stratify=y)
    models={"logistic":LogisticRegression(max_iter=2000,class_weight="balanced"),"random_forest":RandomForestClassifier(n_estimators=180,max_depth=12,min_samples_leaf=4,class_weight="balanced",random_state=26184,n_jobs=-1)}
    evaluations={}
    for name,model in models.items():
        model.fit(xt,yt); p=model.predict_proba(xv)[:,1]; pred=(p>=.5).astype(int); pr,re,f1,_=precision_recall_fscore_support(yv,pred,average="binary",zero_division=0)
        evaluations[name]={"precision":round(float(pr),4),"recall":round(float(re),4),"f1":round(float(f1),4),"roc_auc":round(float(roc_auc_score(yv,p)),4)}
    out=Path(__file__).parent/"artifacts";out.mkdir(exist_ok=True); joblib.dump({"model":models["random_forest"],"features":FEATURES,"metrics":evaluations["random_forest"]},out/"rf-v1.joblib"); (out/"metrics.json").write_text(json.dumps(evaluations,indent=2))
    print(json.dumps(evaluations,indent=2))
if __name__=="__main__": main()
