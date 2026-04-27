import gzip
import json
from pathlib import Path

import joblib


ROOT = Path(__file__).resolve().parents[1]
MODELS = ROOT / "saved_models"
OUT = ROOT / "vercel_artifacts"


def dump_gzip_json(name: str, payload) -> None:
    OUT.mkdir(exist_ok=True)
    with gzip.open(OUT / name, "wt", encoding="utf-8") as fh:
        json.dump(payload, fh, separators=(",", ":"))


def export_forest():
    rf = joblib.load(MODELS / "rf_model.pkl")
    forest = {
        "classes": [int(v) for v in rf.classes_.tolist()],
        "n_features_in": int(rf.n_features_in_),
        "estimators": [],
    }

    for estimator in rf.estimators_:
        tree = estimator.tree_
        forest["estimators"].append(
            {
                "children_left": tree.children_left.tolist(),
                "children_right": tree.children_right.tolist(),
                "feature": tree.feature.tolist(),
                "threshold": tree.threshold.tolist(),
                "value": tree.value[:, 0, :].tolist(),
            }
        )

    dump_gzip_json("rf_forest.json.gz", forest)
    dump_gzip_json("rf_importances.json.gz", rf.feature_importances_.tolist())


def export_metadata():
    features = joblib.load(MODELS / "features.pkl")
    sample = joblib.load(MODELS / "sample_input.pkl")
    rf_threshold = float(joblib.load(MODELS / "rf_threshold.pkl"))

    dump_gzip_json("features.json.gz", list(features))
    dump_gzip_json("sample_input.json.gz", sample.iloc[0].to_dict())
    dump_gzip_json("rf_threshold.json.gz", rf_threshold)


if __name__ == "__main__":
    export_forest()
    export_metadata()
    print("Exported Vercel artifacts to", OUT)
