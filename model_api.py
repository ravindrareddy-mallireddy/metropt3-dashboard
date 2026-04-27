"""
Flask API for MetroPT-3 model inference.
Uses lightweight exported Random Forest artifacts so the backend can run on Vercel.
"""
import gzip
import json
import os

from flask import Flask, jsonify, request
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

ROOT = os.path.dirname(__file__)
ARTIFACTS = os.environ.get("MODELS_DIR", os.path.join(ROOT, "vercel_artifacts"))


def load_gzip_json(filename: str):
    with gzip.open(os.path.join(ARTIFACTS, filename), "rt", encoding="utf-8") as fh:
        return json.load(fh)


features = load_gzip_json("features.json.gz")
rf_threshold = float(load_gzip_json("rf_threshold.json.gz"))
sample_input = load_gzip_json("sample_input.json.gz")
rf_importance_values = load_gzip_json("rf_importances.json.gz")
rf_importances = dict(zip(features, rf_importance_values))
rf_forest = load_gzip_json("rf_forest.json.gz")

startup_warnings = [
    "XGBoost is disabled on Vercel to keep the Python function within bundle size limits.",
]


def make_row(data: dict) -> list[float]:
    return [float(data.get(feature, sample_input.get(feature, 0.0))) for feature in features]


def predict_tree_proba(tree: dict, row: list[float]) -> float:
    node = 0
    children_left = tree["children_left"]
    children_right = tree["children_right"]
    split_features = tree["feature"]
    thresholds = tree["threshold"]
    values = tree["value"]

    while children_left[node] != children_right[node]:
        feature_index = split_features[node]
        threshold = thresholds[node]
        if row[feature_index] <= threshold:
            node = children_left[node]
        else:
            node = children_right[node]

    counts = values[node]
    total = counts[0] + counts[1]
    return counts[1] / total if total else 0.0


def predict_rf_proba(row: list[float]) -> float:
    probs = [predict_tree_proba(tree, row) for tree in rf_forest["estimators"]]
    return sum(probs) / len(probs)


@app.get("/health")
def health():
    return jsonify(
        {
            "status": "ok",
            "features": len(features),
            "models": {
                "rf": True,
                "xgb": False,
            },
            "warnings": startup_warnings,
        }
    )


@app.get("/sample")
def get_sample():
    return jsonify({"values": sample_input, "features": features})


@app.post("/predict")
def predict():
    data = request.json or {}
    row = make_row(data)

    rf_prob = predict_rf_proba(row)
    rf_pred = int(rf_prob >= rf_threshold)

    warnings_out = list(startup_warnings)

    return jsonify(
        {
            "rf": {
                "probability": round(rf_prob, 4),
                "prediction": rf_pred,
                "threshold": round(float(rf_threshold), 4),
                "risk_pct": round(rf_prob * 100, 1),
            },
            "xgb": {
                "probability": round(rf_prob, 4),
                "prediction": rf_pred,
                "threshold": round(float(rf_threshold), 4),
                "risk_pct": round(rf_prob * 100, 1),
                "available": False,
            },
            "ensemble": {
                "probability": round(rf_prob, 4),
                "prediction": rf_pred,
                "risk_pct": round(rf_prob * 100, 1),
                "models_used": ["rf"],
            },
            "failure_imminent": bool(rf_pred == 1),
            "warnings": warnings_out,
        }
    )


@app.get("/feature-importance")
def feature_importance():
    rf_top = sorted(rf_importances.items(), key=lambda item: item[1], reverse=True)[:10]
    return jsonify(
        {
            "rf": [{"feature": key, "importance": round(value, 4)} for key, value in rf_top],
            "xgb": [],
            "warnings": startup_warnings,
        }
    )


@app.get("/model-metrics")
def model_metrics():
    return jsonify(
        {
            "models": [
                {
                    "name": "Random Forest",
                    "accuracy": 0.9371,
                    "precision": 0.7521,
                    "recall": 0.9074,
                    "f1": 0.8224,
                    "roc_auc": 0.9771,
                    "color": "#3b82f6",
                },
                {
                    "name": "XGBoost",
                    "accuracy": 0.9579,
                    "precision": 0.8929,
                    "recall": 0.8384,
                    "f1": 0.8648,
                    "roc_auc": 0.9711,
                    "color": "#f59e0b",
                },
                {
                    "name": "LSTM",
                    "accuracy": 0.8291,
                    "precision": 0.4834,
                    "recall": 0.6286,
                    "f1": 0.5465,
                    "roc_auc": 0.8448,
                    "color": "#10b981",
                },
                {
                    "name": "Transformer",
                    "accuracy": 0.7978,
                    "precision": 0.4221,
                    "recall": 0.6343,
                    "f1": 0.5068,
                    "roc_auc": 0.8081,
                    "color": "#8b5cf6",
                },
            ],
            "rul": {"mae": 4.3, "rmse": 6.57, "r2": 0.6455},
            "warnings": startup_warnings,
        }
    )


if __name__ == "__main__":
    port = int(os.environ.get("PORT", "5050"))
    print(f"Loaded {len(features)} features")
    print(f"RF threshold: {rf_threshold:.4f}")
    print("XGBoost unavailable; API will run with Random Forest only")
    app.run(host="0.0.0.0", port=port, debug=False)
