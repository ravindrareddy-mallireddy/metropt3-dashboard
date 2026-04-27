#!/bin/zsh
set -euo pipefail

PYTHON_BIN="${PYTHON_BIN:-python3}"

SKLEARN_LIBOMP_DIR="$("$PYTHON_BIN" - <<'PY'
import os
import sys

version_dir = f"python{sys.version_info.major}.{sys.version_info.minor}"
path = os.path.join(
    sys.prefix,
    "lib",
    version_dir,
    "site-packages",
    "sklearn",
    ".dylibs",
)
print(path)
PY
)"

if [ -d "$SKLEARN_LIBOMP_DIR" ]; then
  if [ -n "${DYLD_FALLBACK_LIBRARY_PATH:-}" ]; then
    export DYLD_FALLBACK_LIBRARY_PATH="$SKLEARN_LIBOMP_DIR:$DYLD_FALLBACK_LIBRARY_PATH"
  else
    export DYLD_FALLBACK_LIBRARY_PATH="$SKLEARN_LIBOMP_DIR"
  fi
fi

exec "$PYTHON_BIN" model_api.py
