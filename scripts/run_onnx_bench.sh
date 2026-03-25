#!/bin/bash
set -e

# Install Dependencies
pip install kokoro-onnx soundfile onnxruntime-gpu huggingface_hub psutil

# Download Model (FP16 for GPU usually better, but let's try standard first)
python3 -c "
from huggingface_hub import hf_hub_download
hf_hub_download(repo_id='onnx-community/Kokoro-82M-v1.0-ONNX', filename='onnx/model_quantized.onnx', local_dir='.')
hf_hub_download(repo_id='hexgrad/Kokoro-82M', filename='voices.bin', local_dir='.')
"

# Run Benchmark
python3 /workspace/scripts/benchmark_onnx.py
