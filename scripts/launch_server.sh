#!/bin/bash
# Kill existing
fuser -k 8004/tcp || true
pkill -f uvicorn || true
pkill -f python || true

# Set limits
ulimit -n 65535

# Ensure directory
cd /workspace

# Run with 1 Uvicorn worker (Internal threading handles concurrency)
# This saves VRAM (only 1 model loaded)
nohup python3 scripts/kokoro_batch_server.py > /workspace/scripts/server.log 2>&1 &

echo "Server launched (Single Process / Multi-Threaded)."
