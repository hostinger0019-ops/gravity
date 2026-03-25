#!/bin/bash
set -e

# 1. Fix Voices
echo "Downloading voices-v1.0.bin..."
wget -O voices.bin https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/voices-v1.0.bin

# 2. Fix CUDA / ONNX Runtime
echo "Fixing ONNX Runtime..."
pip3 uninstall -y onnxruntime onnxruntime-gpu
pip3 install onnxruntime-gpu

# Check actual installed packages
pip3 list | grep onnxruntime

# Verify CUDA visibility
nvidia-smi

echo "Fix complete."
