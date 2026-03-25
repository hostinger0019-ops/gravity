#!/bin/bash
# =============================================================================
# GPU Server Setup Script for Voice AI Services
# =============================================================================
# 
# This script sets up Kokoro TTS and Whisper ASR on a Vast.ai GPU server.
# Run this after SSH into a fresh GPU instance.
#
# Usage:
#   chmod +x gpu_setup.sh
#   ./gpu_setup.sh
#
# After setup, start services with:
#   ./start_services.sh
#
# SSH tunnel from local machine:
#   ssh -p <PORT> root@<IP> -L 8001:localhost:8001 -L 8003:localhost:8003
# =============================================================================

set -e  # Exit on error

echo "=========================================="
echo "GPU Server Setup for Voice AI Services"
echo "=========================================="
echo ""

# Check if running on GPU
if command -v nvidia-smi &> /dev/null; then
    echo "✅ GPU detected:"
    nvidia-smi --query-gpu=name,memory.total --format=csv,noheader
else
    echo "⚠️  Warning: nvidia-smi not found. GPU may not be available."
fi

echo ""
echo "[1/4] Installing system dependencies..."
apt-get update -qq
apt-get install -y -qq ffmpeg libsndfile1 python3-pip git curl > /dev/null 2>&1
echo "✅ System dependencies installed"

echo ""
echo "[2/4] Installing Python packages..."
pip install --quiet --upgrade pip
pip install --quiet torch torchaudio --index-url https://download.pytorch.org/whl/cu121
pip install --quiet kokoro soundfile numpy fastapi uvicorn python-multipart
pip install --quiet faster-whisper  # For ASR
echo "✅ Python packages installed"

echo ""
echo "[3/4] Creating TTS server..."
cat > /root/tts_server.py << 'TTSEOF'
#!/usr/bin/env python3
"""
Kokoro TTS Server - GPU Accelerated Text-to-Speech
Runs on port 8001

Endpoints:
  POST /v1/audio/speech - OpenAI-compatible TTS
  POST /synthesize      - Simple TTS endpoint
  GET  /v1/voices       - List available voices
  GET  /health          - Health check
"""
import os
os.environ['CUDA_VISIBLE_DEVICES'] = '0'

from fastapi import FastAPI, HTTPException
from fastapi.responses import Response
from pydantic import BaseModel
import soundfile as sf
import numpy as np
import io
import torch
import time
from concurrent.futures import ThreadPoolExecutor

app = FastAPI(title="Kokoro TTS Server")
executor = ThreadPoolExecutor(max_workers=4)

# Global model
model = None
voices = {}

print("Loading Kokoro model...")
load_start = time.time()
try:
    from kokoro import KPipeline
    model = KPipeline(lang_code='a')
    print(f"✅ Kokoro loaded in {time.time() - load_start:.1f}s")
except Exception as e:
    print(f"❌ Failed to load Kokoro: {e}")

# Preload voices
VOICE_LIST = [
    "af_bella", "af_nicole", "af_sarah", "af_sky",
    "am_adam", "am_michael", "bf_emma", "bf_isabella",
    "bm_george", "bm_lewis"
]

class SpeechRequest(BaseModel):
    input: str
    voice: str = "af_bella"
    speed: float = 1.0

class SynthRequest(BaseModel):
    text: str
    voice: str = "af_bella"
    speed: float = 1.0

def generate_audio(text: str, voice: str, speed: float = 1.0) -> bytes:
    if model is None:
        raise HTTPException(503, "Model not loaded")
    
    start = time.time()
    samples = []
    for _, _, audio in model(text, voice=voice, speed=speed):
        samples.append(audio)
    
    if not samples:
        raise HTTPException(500, "No audio generated")
    
    audio = np.concatenate(samples)
    buffer = io.BytesIO()
    sf.write(buffer, audio, 24000, format='WAV')
    print(f"TTS: {len(text)} chars in {time.time()-start:.2f}s -> {len(buffer.getvalue())} bytes")
    return buffer.getvalue()

@app.post("/v1/audio/speech")
async def create_speech(req: SpeechRequest):
    audio = generate_audio(req.input, req.voice, req.speed)
    return Response(content=audio, media_type="audio/wav")

@app.post("/synthesize")
async def synthesize(req: SynthRequest):
    audio = generate_audio(req.text, req.voice, req.speed)
    return Response(content=audio, media_type="audio/wav")

@app.get("/v1/voices")
async def list_voices():
    return {"voices": [{"voice_id": v, "name": v} for v in VOICE_LIST]}

@app.get("/health")
async def health():
    return {"status": "healthy" if model else "not loaded", "gpu": torch.cuda.is_available()}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
TTSEOF
echo "✅ TTS server created at /root/tts_server.py"

echo ""
echo "[4/4] Creating Whisper ASR server..."
cat > /root/whisper_server.py << 'ASREOF'
#!/usr/bin/env python3
"""
Faster-Whisper ASR Server - GPU Accelerated Speech Recognition
Runs on port 8003

Endpoints:
  POST /transcribe - Transcribe audio file
  GET  /health     - Health check
"""
import os
os.environ['CUDA_VISIBLE_DEVICES'] = '0'

from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.responses import JSONResponse
import tempfile
import time

app = FastAPI(title='Faster-Whisper ASR Server')

model = None
print("Loading Faster-Whisper model...")
load_start = time.time()

try:
    from faster_whisper import WhisperModel
    # Use large-v3 for best accuracy, medium for faster speed
    model = WhisperModel("large-v3", device="cuda", compute_type="float16")
    print(f"✅ Whisper large-v3 loaded in {time.time() - load_start:.1f}s")
except Exception as e:
    print(f"⚠️ large-v3 failed, trying medium: {e}")
    try:
        from faster_whisper import WhisperModel
        model = WhisperModel("medium", device="cuda", compute_type="float16")
        print(f"✅ Whisper medium loaded in {time.time() - load_start:.1f}s")
    except Exception as e2:
        print(f"❌ Failed to load Whisper: {e2}")

@app.post("/transcribe")
async def transcribe(audio: UploadFile = File(...), language: str = Form("hi")):
    if model is None:
        raise HTTPException(503, "Model not loaded")
    
    start = time.time()
    audio_bytes = await audio.read()
    
    # Determine file extension
    filename = audio.filename or "audio.webm"
    if "webm" in (audio.content_type or ""):
        ext = ".webm"
    elif "mp4" in (audio.content_type or "") or "m4a" in (audio.content_type or ""):
        ext = ".mp4"
    else:
        ext = ".webm"
    
    with tempfile.NamedTemporaryFile(suffix=ext, delete=False) as tmp:
        tmp.write(audio_bytes)
        tmp_path = tmp.name
    
    try:
        segments, info = model.transcribe(tmp_path, language=language, beam_size=1)
        text = " ".join([seg.text for seg in segments])
        print(f"ASR: {len(audio_bytes)} bytes in {time.time() - start:.2f}s -> '{text[:50]}...'")
        return JSONResponse({
            "text": text.strip(),
            "language": info.language,
            "duration": time.time() - start
        })
    finally:
        try:
            os.unlink(tmp_path)
        except:
            pass

@app.get("/health")
async def health():
    return {"status": "healthy" if model else "not loaded", "model": "faster-whisper"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8003)
ASREOF
echo "✅ Whisper ASR server created at /root/whisper_server.py"

# Create startup script
cat > /root/start_services.sh << 'STARTEOF'
#!/bin/bash
# Start all voice AI services

echo "Starting Kokoro TTS on port 8001..."
nohup python3 /root/tts_server.py > /tmp/tts.log 2>&1 &
echo "TTS PID: $!"

echo "Starting Whisper ASR on port 8003..."
nohup python3 /root/whisper_server.py > /tmp/asr.log 2>&1 &
echo "ASR PID: $!"

echo ""
echo "Services starting. Check logs:"
echo "  tail -f /tmp/tts.log"
echo "  tail -f /tmp/asr.log"
echo ""
echo "Test endpoints:"
echo "  curl http://localhost:8001/health"
echo "  curl http://localhost:8003/health"
STARTEOF
chmod +x /root/start_services.sh

# Create stop script
cat > /root/stop_services.sh << 'STOPEOF'
#!/bin/bash
echo "Stopping services..."
pkill -f tts_server.py 2>/dev/null
pkill -f whisper_server.py 2>/dev/null
echo "Done"
STOPEOF
chmod +x /root/stop_services.sh

echo ""
echo "=========================================="
echo "✅ Setup Complete!"
echo "=========================================="
echo ""
echo "Next steps:"
echo "  1. Start services:    ./start_services.sh"
echo "  2. Check TTS health:  curl http://localhost:8001/health"
echo "  3. Check ASR health:  curl http://localhost:8003/health"
echo ""
echo "From your local machine, create SSH tunnel:"
echo "  ssh -p <PORT> root@<IP> -L 8001:localhost:8001 -L 8003:localhost:8003"
echo ""
echo "Logs:"
echo "  tail -f /tmp/tts.log   # TTS logs"
echo "  tail -f /tmp/asr.log   # ASR logs"
echo ""
