# MetroPT-3 Predictive Maintenance Dashboard

This repo contains the website code and the deployable model files needed by the current dashboard.

## Deployment Shape

- GitHub stores the app code
- the required dashboard model files are included in `saved_models/`
- the unused oversized RUL model was removed
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

### 3. Start the Flask API

```bash
python3 model_api.py
```

Runs on `http://127.0.0.1:5050`

Optional:

```bash
MODELS_DIR=/absolute/path/to/models python3 model_api.py
```

### 4. Start the frontend

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
