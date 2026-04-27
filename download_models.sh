#!/usr/bin/env bash

set -euo pipefail

MODELS_DIR="${MODELS_DIR:-saved_models}"

mkdir -p "$MODELS_DIR"

download_if_set() {
  local env_name="$1"
  local filename="$2"
  local url="${!env_name:-}"

  if [ -z "$url" ]; then
    echo "Skipping $filename because $env_name is not set."
    return
  fi

  echo "Downloading $filename"
  curl -L "$url" -o "$MODELS_DIR/$filename"
}

download_if_set FEATURES_URL features.pkl
download_if_set RF_MODEL_URL rf_model.pkl
download_if_set RF_THRESHOLD_URL rf_threshold.pkl
download_if_set SAMPLE_INPUT_URL sample_input.pkl
download_if_set SCALER_URL scaler.pkl
download_if_set XGB_MODEL_URL xgb_model.pkl
download_if_set XGB_THRESHOLD_URL xgb_threshold.pkl

echo "Models available in $MODELS_DIR"
