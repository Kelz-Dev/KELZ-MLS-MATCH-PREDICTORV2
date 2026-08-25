from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import pandas as pd
import joblib
import os
import requests

app = FastAPI(title="MLS Prediction API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load Models and Data
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, "mls_model.joblib")
SCALER_PATH = os.path.join(BASE_DIR, "mls_scaler.joblib")
PREDICTION_DATA_PATH = os.path.join(BASE_DIR, "prediction_data.joblib")
SEASON_SIM_PATH = os.path.join(BASE_DIR, "season_simulation_summary.csv")

# We will load these lazily or on startup
model = None
scaler = None
pred_data = None

@app.on_event("startup")
def load_assets():
    global model, scaler, pred_data
    if os.path.exists(MODEL_PATH):
        model = joblib.load(MODEL_PATH)
    if os.path.exists(SCALER_PATH):
        scaler = joblib.load(SCALER_PATH)
    if os.path.exists(PREDICTION_DATA_PATH):
        pred_data = joblib.load(PREDICTION_DATA_PATH)

class MatchRequest(BaseModel):
    home_team: str
    away_team: str

@app.get("/api/standings")
def get_standings():
    API_URL = "https://api.thestatsapi.com/api/football/competitions/comp_9799/seasons/sn_8454787/standings"
    api_key = os.environ.get("STATS_API_KEY")
    if not api_key:
        return {"status": "error", "message": "STATS_API_KEY not set", "data": []}
    HEADERS = {
        "Authorization": f"Bearer {api_key}"
    }

    try:
        r = requests.get(API_URL, headers=HEADERS)
        if r.status_code != 200:
            return {"status": "error", "message": f"API Error: {r.status_code}", "data": []}
            
        api_data = r.json().get("data", [])
        
        global pred_data
        conference_map = pred_data.get('conference', {}) if pred_data else {}
        
        # Map the API response to the format expected by our React frontend
        formatted_data = []
        for item in api_data:
            team_name = item["team"]["name"]
            conf = conference_map.get(team_name)
            if not conf:
                # Try soft matching if exact fails (e.g. CF Montreal)
                for k, v in conference_map.items():
                    if k.replace('', 'e') in team_name or team_name in k.replace('', 'e'):
                        conf = v
                        break
            if not conf:
                conf = "Unknown"
                
            formatted_data.append({
                "team": team_name,
                "points": item["points"],
                "played": item["matches_played"],
                "conference": conf
            })
        
        return {
            "status": "success",
            "message": "Live standings successfully fetched!",
            "data": formatted_data
        }
    except Exception as e:
        return {"status": "error", "message": str(e), "data": []}

@app.get("/api/season_predictions")
def get_season_predictions():
    if not os.path.exists(SEASON_SIM_PATH):
        raise HTTPException(status_code=404, detail="Season simulation data not found")
    
    df = pd.read_csv(SEASON_SIM_PATH)
    df = df.rename(columns={"Unnamed: 0": "Team"})
    # Convert to list of dicts
    data = df.to_dict(orient="records")
    return {"status": "success", "data": data}

@app.post("/api/predict_match")
def predict_match(req: MatchRequest):
    global model, scaler, pred_data
    if model is None or scaler is None or pred_data is None:
        raise HTTPException(status_code=500, detail="Models or prediction data not loaded")
    
    home = req.home_team
    away = req.away_team
    
    latest = pred_data['latest']
    rating = pred_data['rating']
    feature_names = pred_data['feature_names']
    features = pred_data['features']
    conference = pred_data['conference']
    
    if home not in latest.index or away not in latest.index:
        raise HTTPException(status_code=400, detail="Team not found in data")
        
    one_game = {}
    for name in feature_names:
        one_game[name + "_diff"] = latest.loc[home, name] - latest.loc[away, name]
        
    one_game["home_elo"] = rating.get(home, 1500)
    one_game["away_elo"] = rating.get(away, 1500)
    one_game["elo_diff"] = one_game["home_elo"] - one_game["away_elo"]
    
    # Convert to DataFrame to ensure correct column order
    one_game_df = pd.DataFrame([one_game])[features]
    
    X_scaled = scaler.transform(one_game_df)
    
    prediction = model.predict_proba(X_scaled)[0]
    classes = list(model.classes_)
    
    res = {
        "home": round(prediction[classes.index('H')] * 100, 1),
        "draw": round(prediction[classes.index('D')] * 100, 1),
        "away": round(prediction[classes.index('A')] * 100, 1)
    }
    
    return {"status": "success", "prediction": res}

@app.get("/api/teams")
def get_teams():
    global pred_data
    if pred_data is None:
        return {"teams": []}
    latest = pred_data['latest']
    return {"teams": sorted(list(latest.index))}

@app.get("/api/bracket")
def get_bracket():
    """Seed the top-8 per conference by current season points and return
    each team's Elo, seed position, and Cup/Shield odds so the frontend
    can animate the actual playoff bracket."""
    global pred_data
    if pred_data is None:
        raise HTTPException(status_code=500, detail="Prediction data not loaded")

    latest = pred_data['latest']
    rating = pred_data['rating']
    conference = pred_data['conference']

    cup_odds = {}
    shield_odds = {}
    if os.path.exists(SEASON_SIM_PATH):
        df = pd.read_csv(SEASON_SIM_PATH)
        df = df.rename(columns={"Unnamed: 0": "Team"})
        for _, row in df.iterrows():
            cup_odds[row["Team"]] = round(float(row["MLS Cup %"]), 2)
            shield_odds[row["Team"]] = round(float(row["Shield %"]), 2)

    conferences = {}
    for conf in ["East", "West"]:
        teams_in_conf = [t for t in latest.index if conference.get(t) == conf]
        ranked = sorted(teams_in_conf, key=lambda t: latest.loc[t, "season_points"], reverse=True)
        seeds = []
        for i, team in enumerate(ranked[:8]):
            seeds.append({
                "seed": i + 1,
                "team": team,
                "points": round(float(latest.loc[team, "season_points"]), 1),
                "elo": round(float(rating.get(team, 1500)), 1),
                "cupOdds": cup_odds.get(team, 0),
                "shieldOdds": shield_odds.get(team, 0),
            })
        conferences[conf] = seeds

    return {"status": "success", "conferences": conferences}
