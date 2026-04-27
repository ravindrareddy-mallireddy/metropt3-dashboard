"""
Flask API for MetroPT-3 model inference.
Runs on port 5050 alongside the Vite dev server.
"""
import os
import sys
import warnings
warnings.filterwarnings('ignore')

from flask import Flask, jsonify, request
from flask_cors import CORS
import joblib
import pandas as pd

app = Flask(__name__)
CORS(app)

BASE = os.environ.get(
    'MODELS_DIR',
    os.path.join(os.path.dirname(__file__), 'saved_models'),
)

startup_warnings = []


def ensure_macos_openmp_runtime():
    """Re-exec early so xgboost sees libomp at process startup on macOS."""
    if sys.platform != 'darwin':
        return

    version_dir = f'python{sys.version_info.major}.{sys.version_info.minor}'
    sklearn_libomp_dir = os.path.join(
        sys.prefix,
        'lib',
        version_dir,
        'site-packages',
        'sklearn',
        '.dylibs',
    )
    libomp_path = os.path.join(sklearn_libomp_dir, 'libomp.dylib')

    if not os.path.exists(libomp_path):
        return

    current = os.environ.get('DYLD_FALLBACK_LIBRARY_PATH', '')
    paths = [p for p in current.split(':') if p]
    if sklearn_libomp_dir in paths:
        return

    argv0 = os.path.abspath(sys.argv[0]) if sys.argv and sys.argv[0] else ''
    running_model_api_script = argv0 == os.path.abspath(__file__)

    os.environ['DYLD_FALLBACK_LIBRARY_PATH'] = ':'.join([sklearn_libomp_dir, *paths])
    if running_model_api_script and os.environ.get('_METROPT3_REEXECED_FOR_XGBOOST') != '1':
        os.environ['_METROPT3_REEXECED_FOR_XGBOOST'] = '1'
        os.execvpe(sys.executable, [sys.executable, *sys.argv], os.environ)


def load_artifact(filename: str):
    return joblib.load(os.path.join(BASE, filename))


def load_optional_artifact(filename: str, label: str):
    try:
        return load_artifact(filename)
    except Exception as exc:  # pragma: no cover - defensive runtime guard
        startup_warnings.append(f'{label} unavailable: {exc}')
        return None


# Load everything once at startup
ensure_macos_openmp_runtime()
features      = load_artifact('features.pkl')
rf_model      = load_artifact('rf_model.pkl')
xgb_model     = load_optional_artifact('xgb_model.pkl', 'XGBoost model')
# rul_model removed — RUL not used in dashboard (MetroPT-3 has no RUL ground truth)
scaler        = load_optional_artifact('scaler.pkl', 'Scaler')
rf_threshold  = float(load_artifact('rf_threshold.pkl'))
xgb_threshold = float(load_artifact('xgb_threshold.pkl'))
sample_input  = load_artifact('sample_input.pkl')

# Feature importances
rf_importances  = dict(zip(features, rf_model.feature_importances_.tolist()))
xgb_importances = (
    dict(zip(features, xgb_model.feature_importances_.tolist()))
    if xgb_model is not None and hasattr(xgb_model, 'feature_importances_')
    else {}
)

# Sensor ranges from sample (for validation)
SENSOR_DEFAULTS = sample_input.iloc[0].to_dict()

def make_input(data: dict) -> pd.DataFrame:
    row = {f: data.get(f, SENSOR_DEFAULTS.get(f, 0.0)) for f in features}
    return pd.DataFrame([row])

@app.get('/api/health')
def health():
    return jsonify({
        'status': 'ok',
        'features': len(features),
        'models': {
            'rf': True,
            'xgb': xgb_model is not None,
        },
        'warnings': startup_warnings,
    })

@app.get('/api/sample')
def get_sample():
    """Return the sample input so frontend can pre-populate fields."""
    return jsonify({
        'values': SENSOR_DEFAULTS,
        'features': features
    })

@app.post('/api/predict')
def predict():
    data = request.json or {}
    X = make_input(data)

    rf_prob = float(rf_model.predict_proba(X)[:, 1][0])
    available_probs = [rf_prob]
    warnings_out = list(startup_warnings)

    if xgb_model is not None:
        xgb_prob = float(xgb_model.predict_proba(X)[:, 1][0])
        xgb_pred = int(xgb_prob >= xgb_threshold)
        available_probs.append(xgb_prob)
    else:
        xgb_prob = rf_prob
        xgb_pred = int(rf_prob >= rf_threshold)
        warnings_out.append(
            'XGBoost prediction unavailable. Install libomp and a compatible xgboost build to enable it.'
        )

    rf_pred  = int(rf_prob  >= rf_threshold)

    # Ensemble averages whichever models are available at runtime.
    ensemble_prob = sum(available_probs) / len(available_probs)
    ensemble_pred = int(ensemble_prob >= 0.5)

    return jsonify({
        'rf': {
            'probability': round(rf_prob, 4),
            'prediction':  rf_pred,
            'threshold':   round(float(rf_threshold), 4),
            'risk_pct':    round(rf_prob * 100, 1)
        },
        'xgb': {
            'probability': round(xgb_prob, 4),
            'prediction':  xgb_pred,
            'threshold':   round(float(xgb_threshold), 4),
            'risk_pct':    round(xgb_prob * 100, 1),
            'available':   xgb_model is not None,
        },
        'ensemble': {
            'probability': round(ensemble_prob, 4),
            'prediction':  ensemble_pred,
            'risk_pct':    round(ensemble_prob * 100, 1),
            'models_used': ['rf', 'xgb'] if xgb_model is not None else ['rf'],
        },
        'failure_imminent': bool(ensemble_pred == 1),
        'warnings': warnings_out,
    })

@app.get('/api/feature-importance')
def feature_importance():
    # Top 10 for RF and XGB
    rf_top  = sorted(rf_importances.items(),  key=lambda x: x[1], reverse=True)[:10]
    xgb_top = sorted(xgb_importances.items(), key=lambda x: x[1], reverse=True)[:10]
    return jsonify({
        'rf':  [{'feature': k, 'importance': round(v, 4)} for k, v in rf_top],
        'xgb': [{'feature': k, 'importance': round(v, 4)} for k, v in xgb_top],
        'warnings': startup_warnings,
    })

@app.get('/api/model-metrics')
def model_metrics():
    return jsonify({
        'models': [
            {'name': 'Random Forest', 'accuracy': 0.9371, 'precision': 0.7521, 'recall': 0.9074, 'f1': 0.8224, 'roc_auc': 0.9771, 'color': '#3b82f6'},
            {'name': 'XGBoost',       'accuracy': 0.9579, 'precision': 0.8929, 'recall': 0.8384, 'f1': 0.8648, 'roc_auc': 0.9711, 'color': '#f59e0b'},
            {'name': 'LSTM',          'accuracy': 0.8291, 'precision': 0.4834, 'recall': 0.6286, 'f1': 0.5465, 'roc_auc': 0.8448, 'color': '#10b981'},
            {'name': 'Transformer',   'accuracy': 0.7978, 'precision': 0.4221, 'recall': 0.6343, 'f1': 0.5068, 'roc_auc': 0.8081, 'color': '#8b5cf6'},
        ],
        'rul': {'mae': 4.3, 'rmse': 6.57, 'r2': 0.6455}
    })

if __name__ == '__main__':
    print(f"✓ Loaded {len(features)} features")
    print(f"✓ RF threshold: {rf_threshold:.4f}")
    if xgb_model is not None:
        print(f"✓ XGB threshold: {xgb_threshold:.4f}")
    else:
        print('! XGBoost unavailable; API will run with Random Forest only')
        for warning in startup_warnings:
            print(f'! {warning}')
    app.run(port=5050, debug=False)
