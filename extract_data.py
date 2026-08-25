!pip install catboost

import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns

sns.set_theme(style="whitegrid")
plt.rcParams["figure.figsize"] = (10, 5)

data = pd.read_csv("mls_matches.csv", parse_dates=["date"])
data["date"] = data["date"].dt.tz_localize(None)
data.head()

print(data.shape)
print(data["season"].value_counts().sort_index())

east = ["Atlanta United", "CF Montréal", "Charlotte FC", "Chicago Fire", "Columbus Crew",
        "DC United", "FC Cincinnati", "Inter Miami CF", "Nashville SC", "New England Revolution",
        "New York City FC", "New York Red Bulls", "Orlando City SC", "Philadelphia Union", "Toronto FC"]

west = ["Austin FC", "Colorado Rapids", "FC Dallas", "Houston Dynamo", "LA Galaxy",
        "Los Angeles FC", "Minnesota United", "Portland Timbers", "Real Salt Lake", "San Diego FC",
        "San Jose Earthquakes", "Seattle Sounders FC", "Sporting Kansas City", "St.Louis City",
        "Vancouver Whitecaps"]

conference = {}
for team in east:
    conference[team] = "East"
for team in west:
    conference[team] = "West"

len(conference)

data["result"] = "D"
data.loc[data["home_goals"] > data["away_goals"], "result"] = "H"
data.loc[data["home_goals"] < data["away_goals"], "result"] = "A"

data["result"].value_counts()

data["result"].value_counts(normalize=True).plot(kind="bar", color="#2a9d8f", rot=0)
plt.title("Match outcomes")
plt.xlabel("Result")
plt.ylabel("Frequency")
plt.show()

home = data.copy()
home["team"] = data["home_team"]
home["opponent"] = data["away_team"]
home["is_home"] = 1
home["goals_for"] = data["home_goals"]
home["goals_against"] = data["away_goals"]

away = data.copy()
away["team"] = data["away_team"]
away["opponent"] = data["home_team"]
away["is_home"] = 0
away["goals_for"] = data["away_goals"]
away["goals_against"] = data["home_goals"]

games = pd.concat([home, away], ignore_index=True)
games.shape

games.head()

games["points"] = 1
games.loc[games["goals_for"] > games["goals_against"], "points"] = 3
games.loc[games["goals_for"] < games["goals_against"], "points"] = 0

games["conference"] = games["team"].map(conference)
games = games.sort_values(["team", "date"]).reset_index(drop=True)
games.head()

games = games.sort_values(["team", "date"])

games["ppg_5"] = games.groupby("team")["points"].shift(1).rolling(5, min_periods=1).mean()
games["ppg_10"] = games.groupby("team")["points"].shift(1).rolling(10, min_periods=1).mean()

games.head(10)

games["won"] = (games["points"] == 3).astype(int)
games["win_rate_10"] = games.groupby("team")["won"].shift(1).rolling(10, min_periods=1).mean()

games.head(10)

games["goals_for_5"] = games.groupby("team")["goals_for"].shift(1).rolling(5, min_periods=1).mean()
games["goals_against_5"] = games.groupby("team")["goals_against"].shift(1).rolling(5, min_periods=1).mean()

games.head(10)

games["home_points"] = games["points"].where(games["is_home"] == 1)
games["away_points"] = games["points"].where(games["is_home"] == 0)

games["home_ppg"] = games.groupby("team")["home_points"].shift(1).expanding().mean().reset_index(level=0, drop=True)
games["away_ppg"] = games.groupby("team")["away_points"].shift(1).expanding().mean().reset_index(level=0, drop=True)

games["home_ppg"] = games.groupby("team")["home_ppg"].ffill()
games["away_ppg"] = games.groupby("team")["away_ppg"].ffill()
games[["home_ppg", "away_ppg"]] = games[["home_ppg", "away_ppg"]].fillna(1.3)

games.head(10)

games = games.sort_values(["season", "team", "date"])

# Shift points to avoid data leakage
games["season_points"] = games.groupby(["season", "team"])["points"].shift(1)
games["season_points"] = games["season_points"].fillna(0)

# Cumsum within each group to keep points separated by team and season
games["season_points"] = games.groupby(["season", "team"])["season_points"].cumsum()

games.head(10)

games["position"] = np.nan

for season in games["season"].unique():
    for conf in ["East", "West"]:
        block = games[(games["season"] == season) & (games["conference"] == conf)]
        table = block.pivot_table(index="date", columns="team", values="season_points", aggfunc="last")
        table = table.ffill()
        ranks = table.rank(axis=1, ascending=False, method="min")
        for team in ranks.columns:
            rows = block[block["team"] == team]
            games.loc[rows.index, "position"] = ranks[team].reindex(rows["date"]).values

games["position"] = games["position"].fillna(8)

games.head(10)

rating = {}
for team in games["team"].unique():
    rating[team] = 1500

data = data.sort_values("date").reset_index(drop=True)
data["home_elo"] = 0.0
data["away_elo"] = 0.0

data.head(10)

for i in data.index:
    home_team = data.at[i, "home_team"]
    away_team = data.at[i, "away_team"]

    home_rating = rating[home_team]
    away_rating = rating[away_team]

    data.at[i, "home_elo"] = home_rating
    data.at[i, "away_elo"] = away_rating

    expected_home = 1 / (1 + 10 ** (-((home_rating + 60 - away_rating) / 400)))

    if data.at[i, "home_goals"] > data.at[i, "away_goals"]:
        actual_home = 1.0
    elif data.at[i, "home_goals"] == data.at[i, "away_goals"]:
        actual_home = 0.5
    else:
        actual_home = 0.0

    margin = abs(data.at[i, "home_goals"] - data.at[i, "away_goals"])
    change = 20 * np.log(margin + 1) * (actual_home - expected_home)

    rating[home_team] = home_rating + change
    rating[away_team] = away_rating - change

data.head(10)

current_elo = pd.Series(rating).sort_values(ascending=False)
current_elo.head(10).round(0)

feature_names = ["ppg_5", "ppg_10", "win_rate_10", "goals_for_5", "goals_against_5",
                 "home_ppg", "away_ppg", "season_points", "position"]

home_side = games[games["is_home"] == 1].copy()
away_side = games[games["is_home"] == 0].copy()

home_side = home_side[["date", "team", "opponent"] + feature_names]
away_side = away_side[["date", "team"] + feature_names]

home_side = home_side.rename(columns={"team": "home_team", "opponent": "away_team"})
away_side = away_side.rename(columns={"team": "away_team"})

for name in feature_names:
    home_side = home_side.rename(columns={name: name + "_home"})
    away_side = away_side.rename(columns={name: name + "_away"})

matches = home_side.merge(away_side, on=["date", "away_team"])

matches.head()

matches = matches.merge(
    data[["date", "home_team", "away_team", "season", "result", "home_elo", "away_elo"]],
    on=["date", "home_team", "away_team"])

matches.shape

matches.head(10)

for name in feature_names:
    matches[name + "_diff"] = matches[name + "_home"] - matches[name + "_away"]

matches["elo_diff"] = matches["home_elo"] - matches["away_elo"]

features = [name + "_diff" for name in feature_names] + ["elo_diff", "home_elo", "away_elo"]
print(len(features), "features")
features

matches.shape

matches = matches.dropna(subset=features + ["result"]).reset_index(drop=True)
matches.shape

train = matches[matches["season"] < 2025]
test = matches[matches["season"] == 2025]

X_train = train[features]
y_train = train["result"]
X_test = test[features]
y_test = test["result"]

print(X_train.shape, X_test.shape)

from sklearn.preprocessing import StandardScaler

scaler = StandardScaler()
X_train_scaled = scaler.fit_transform(X_train)
X_test_scaled = scaler.transform(X_test)

baseline = (y_test == "H").mean()
print("Always guess home win:", round(baseline, 3))

from sklearn.linear_model import LogisticRegression

logistic = LogisticRegression(max_iter=2000, C=0.5)
logistic.fit(X_train_scaled, y_train)

from sklearn.ensemble import RandomForestClassifier

forest = RandomForestClassifier(n_estimators=400, max_depth=8, min_samples_leaf=20, random_state=42)
forest.fit(X_train, y_train)

from sklearn.ensemble import GradientBoostingClassifier

boosting = GradientBoostingClassifier(max_depth=3, learning_rate=0.05, n_estimators=300, random_state=42)
boosting.fit(X_train, y_train)

from catboost import CatBoostClassifier

cat = CatBoostClassifier(max_depth=3, learning_rate=0.01, n_estimators=500, random_state=42)
cat.fit(X_train, y_train)

from sklearn.metrics import accuracy_score, log_loss

results = []
results.append(["Logistic Regression",
                accuracy_score(y_test, logistic.predict(X_test_scaled)),
                log_loss(y_test, logistic.predict_proba(X_test_scaled))])
results.append(["Random Forest",
                accuracy_score(y_test, forest.predict(X_test)),
                log_loss(y_test, forest.predict_proba(X_test))])
results.append(["Gradient Boosting",
                accuracy_score(y_test, boosting.predict(X_test)),
                log_loss(y_test, boosting.predict_proba(X_test))])
results.append(["Catboost",
                accuracy_score(y_test, cat.predict(X_test)),
                log_loss(y_test, cat.predict_proba(X_test))])

results = pd.DataFrame(results, columns=["model", "accuracy", "log_loss"]).sort_values("log_loss")
results

best_name = results.iloc[0]["model"]

if best_name == "Logistic Regression":
    best_model = logistic
    X_test_best = X_test_scaled
elif best_name == "Random Forest":
    best_model = forest
    X_test_best = X_test
elif best_name == "Catboost":
    best_model = cat
    X_test_best = X_test
else:
    best_model = boosting
    X_test_best = X_test

print("Best model:", best_name)

from sklearn.metrics import confusion_matrix

cm = confusion_matrix(y_test, best_model.predict(X_test_best), labels=["H", "D", "A"])

sns.heatmap(cm, annot=True, fmt="d", cmap="Blues", xticklabels=["H", "D", "A"], yticklabels=["H", "D", "A"])
plt.xlabel("Predicted")
plt.ylabel("Actual")
plt.title("Confusion matrix")
plt.show()

forest_importance = pd.Series(forest.feature_importances_, index=features).sort_values()

forest_importance.plot(kind="barh", color="#264653")
plt.title("Feature importance from the Random Forest")
plt.show()

from sklearn.inspection import permutation_importance

perm = permutation_importance(best_model, X_test_best, y_test, n_repeats=30,
                              random_state=42, scoring="neg_log_loss")

perm_importance = pd.Series(perm.importances_mean, index=features).sort_values()
perm_importance.plot(kind="barh", color="#2a9d8f")
plt.title("Permutation importance (higher means more important)")
plt.show()

perm_importance.sort_values(ascending=False).head(8).round(5)

final_scaler = StandardScaler()
X_final_scaled = final_scaler.fit_transform(matches[features])

final_model = LogisticRegression(max_iter=2000, C=0.5)
final_model.fit(X_final_scaled, matches["result"])

latest = games.sort_values("date").groupby("team").tail(1).set_index("team")
latest[["ppg_5", "position", "home_ppg"]].head(30)

display(latest.loc[["Toronto FC", "Nashville SC", "Vancouver Whitecaps"], ["date", "season", "conference", "season_points", "points", "position"]])

season_2026 = games[games["season"] == 2026]
current_points = season_2026.groupby("team")["points"].sum()
current_points.sort_values(ascending=False).head(10)

played = set()
for i in season_2026.index:
    if season_2026.at[i, "is_home"] == 1:
        played.add((season_2026.at[i, "team"], season_2026.at[i, "opponent"]))

fixtures = []
for home_team in conference:
    for away_team in conference:
        if home_team != away_team and conference[home_team] == conference[away_team]:
            if (home_team, away_team) not in played:
                fixtures.append((home_team, away_team))

fixtures = pd.DataFrame(fixtures, columns=["home_team", "away_team"])
print(len(fixtures), "games remaining")

for name in feature_names:
    fixtures[name + "_diff"] = latest.loc[fixtures["home_team"], name].values - latest.loc[fixtures["away_team"], name].values

fixtures["home_elo"] = [rating[t] for t in fixtures["home_team"]]
fixtures["away_elo"] = [rating[t] for t in fixtures["away_team"]]
fixtures["elo_diff"] = fixtures["home_elo"] - fixtures["away_elo"]

X_fixtures_scaled = final_scaler.transform(fixtures[features])
probabilities = final_model.predict_proba(X_fixtures_scaled)
class_order = list(final_model.classes_)

fixtures["p_home"] = probabilities[:, class_order.index("H")]
fixtures["p_draw"] = probabilities[:, class_order.index("D")]
fixtures["p_away"] = probabilities[:, class_order.index("A")]

fixtures[["home_team", "away_team", "p_home", "p_draw", "p_away"]].head().round(3)

fixtures["home_pos"] = fixtures["home_team"].map(latest["position"]).astype(int)
fixtures["away_pos"] = fixtures["away_team"].map(latest["position"]).astype(int)

fixtures = fixtures[["home_team", "home_pos", "away_team", "away_pos", "home_elo", "away_elo", "elo_diff", "p_home", "p_draw", "p_away"]]
fixtures = fixtures.round(3)
fixtures.to_csv("fixtures.csv", index=False)

number_of_simulations = 10000
np.random.seed(42)

home_list = list(fixtures["home_team"])
away_list = list(fixtures["away_team"])
p_home_list = list(fixtures["p_home"])
p_draw_list = list(fixtures["p_draw"])

start_points = dict(current_points)

titles = {}
shields = {}
for team in start_points:
    titles[team] = 0
    shields[team] = 0

for sim in range(number_of_simulations):
    points = dict(start_points)

    random_numbers = np.random.random(len(home_list))
    for i in range(len(home_list)):
        r = random_numbers[i]
        if r < p_home_list[i]:
            points[home_list[i]] = points[home_list[i]] + 3
        elif r < p_home_list[i] + p_draw_list[i]:
            points[home_list[i]] = points[home_list[i]] + 1
            points[away_list[i]] = points[away_list[i]] + 1
        else:
            points[away_list[i]] = points[away_list[i]] + 3

    table = sorted(points, key=points.get, reverse=True)
    shields[table[0]] = shields[table[0]] + 1

    finalists = []
    for conf in ["East", "West"]:
        seeds = [t for t in table if conference[t] == conf][:8]
        while len(seeds) > 1:
            winners = []
            for j in range(len(seeds) // 2):
                a = seeds[j]
                b = seeds[len(seeds) - 1 - j]
                p_a = 1 / (1 + 10 ** (-((rating[a] + 40 - rating[b]) / 400)))
                if np.random.random() < p_a:
                    winners.append(a)
                else:
                    winners.append(b)
            seeds = winners
        finalists.append(seeds[0])

    a = finalists[0]
    b = finalists[1]
    p_a = 1 / (1 + 10 ** (-((rating[a] - rating[b]) / 400)))
    if np.random.random() < p_a:
        titles[a] = titles[a] + 1
    else:
        titles[b] = titles[b] + 1

shield_chances = pd.Series(shields) / number_of_simulations * 100
shield_chances = shield_chances.sort_values(ascending=False)
shield_chances.head(10).round(1)

cup_chances = pd.Series(titles) / number_of_simulations * 100
cup_chances = cup_chances.sort_values(ascending=False)
cup_chances.head(10).round(1)

summary = pd.DataFrame({"MLS Cup %": cup_chances, "Shield %": shield_chances}).fillna(0)
summary = summary.sort_values("MLS Cup %", ascending=False)

top12 = summary.head(12).sort_values("MLS Cup %")
top12.plot(kind="barh", color=["#e76f51", "#264653"])
plt.title("Who wins MLS in 2026?")
plt.xlabel("Chance (%)")
plt.show()

summary.head(12).round(1)

home_team = "Los Angeles FC"
away_team = "Seattle Sounders FC"

one_game = {}
for name in feature_names:
    one_game[name + "_diff"] = latest.loc[home_team, name] - latest.loc[away_team, name]

one_game["home_elo"] = rating[home_team]
one_game["away_elo"] = rating[away_team]
one_game["elo_diff"] = rating[home_team] - rating[away_team]

one_game = pd.DataFrame([one_game])[features]

one_game = {}
for name in feature_names:
    one_game[name + "_diff"] = latest.loc[home_team, name] - latest.loc[away_team, name]

one_game["home_elo"] = rating[home_team]
one_game["away_elo"] = rating[away_team]
one_game["elo_diff"] = rating[home_team] - rating[away_team]

one_game = pd.DataFrame([one_game])[features]

X_one_game_scaled = final_scaler.transform(one_game)
prediction = final_model.predict_proba(X_one_game_scaled)[0]
order = list(final_model.classes_)

home_pos = int(latest.loc[home_team, "position"])
home_conf = conference[home_team]
away_pos = int(latest.loc[away_team, "position"])
away_conf = conference[away_team]

print(f"{home_team} ({home_conf}, Pos: {home_pos}) win: {round(prediction[order.index('H')], 3)}")
print(f"Draw: {round(prediction[order.index('D')], 3)}")
print(f"{away_team} ({away_conf}, Pos: {away_pos}) win: {round(prediction[order.index('A')], 3)}")

import joblib

joblib.dump(final_model, 'mls_model.joblib')
joblib.dump(final_scaler, 'mls_scaler.joblib')


summary.to_csv('season_simulation_summary.csv')

print("Saved mls_model.joblib, mls_scaler.joblib, and season_simulation_summary.csv successfully!")

