# MetroPT-3 Predictive Maintenance Dashboard

This repo is set up so you can keep the website code on GitHub without committing large model files.

## Deployment Shape

- GitHub stores the app code
- `saved_models/` stays out of Git
- model files are downloaded or mounted at runtime
- the frontend can be deployed separately from the Flask API

If you deploy only the frontend as a static site, it will still need a separately deployed backend for `/api/*`.

## Requirements

- Python 3.9+
- Node.js 18+ or Bun

## Local Setup

### 1. Install Python dependencies

```bash
pip install flask flask-cors scikit-learn xgboost joblib pandas numpy
```

### 2. Install frontend dependencies

```bash
npm install
```

### 3. Provide model files

The repo ignores `saved_models/` on purpose.

Option A: copy your local model files into `saved_models/`

Option B: download them with environment variables and the helper script:

```bash
export FEATURES_URL="https://your-host/features.pkl"
export RF_MODEL_URL="https://your-host/rf_model.pkl"
export RF_THRESHOLD_URL="https://your-host/rf_threshold.pkl"
export SAMPLE_INPUT_URL="https://your-host/sample_input.pkl"
export SCALER_URL="https://your-host/scaler.pkl"
export XGB_MODEL_URL="https://your-host/xgb_model.pkl"
export XGB_THRESHOLD_URL="https://your-host/xgb_threshold.pkl"

bash download_models.sh
```

### 4. Start the Flask API

```bash
python3 model_api.py
```

Runs on `http://127.0.0.1:5050`

Optional:

```bash
MODELS_DIR=/absolute/path/to/models python3 model_api.py
```

### 5. Start the frontend

```bash
npm run dev
```

Opens at `http://localhost:5173`

## GitHub Push Workflow

If your old Git history already contains large model files, GitHub will reject pushes even after adding `.gitignore`.

In that case, start with a fresh history:

```bash
rm -rf .git
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/your-username/metropt3-dashboard.git
git push -u origin main
```

## Pages

- `Predict` lets you adjust sensor values and run RF + XGB predictions
- `Models` shows model evaluation metrics
- `Features` shows feature importance rankings
# metropt3-dashboard
