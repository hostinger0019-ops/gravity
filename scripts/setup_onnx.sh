#!/bin/bash
set -e

echo "Installing ONNX dependencies..."
pip3 install kokoro-onnx onnxruntime-gpu huggingface_hub

echo "Downloading Model and Voices..."

# 1. Download voices.json (Verified source: NeuML)
echo "Fetching voices.json..."
wget -O voices.json https://huggingface.co/NeuML/kokoro-base-onnx/resolve/main/voices.json || \
wget -O voices.json https://raw.githubusercontent.com/remsky/Kokoro-FastAPI/main/voices.json || \
echo "Failed to download voices.json"

# 2. Download ONNX Model
# Try onnx-community first (standard location for ONNX port)
echo "Fetching ONNX model..."
wget -O kokoro-v0_19.onnx https://huggingface.co/onnx-community/Kokoro-82M-v1.0-ONNX/resolve/main/onnx/model.onnx || \
wget -O kokoro-v0_19.onnx https://huggingface.co/hexgrad/Kokoro-82M/resolve/main/kokoro-v0_19.onnx || \
echo "Failed to download model"

# Verify files size
ls -lh voices.json kokoro-v0_19.onnx

echo "Setup ONNX complete."
