#!/bin/zsh
cd "$(dirname "$0")"
python3 update.py

# Garante que o daemon do pm2 está vivo antes de subir o backend
if command -v pm2 >/dev/null 2>&1; then
  pm2 ping >/dev/null 2>&1 || pm2 resurrect >/dev/null 2>&1
fi

python3 server.py
