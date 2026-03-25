#!/bin/bash
set -e

echo "=== AI Stack Setup for 2x RTX 3090 ==="
echo "Starting at $(date)"

# Create directories
mkdir -p /opt/ai-stack/{tts,llm,db,logs}
cd /opt/ai-stack

# Update and install system dependencies
echo "=== Installing system dependencies ==="
apt-get update
apt-get install -y \
    postgresql postgresql-contrib \
    redis-server \
    espeak-ng \
    ffmpeg \
    nginx \
    supervisor \
    screen \
    htop \
    wget \
    curl \
    git

# Start PostgreSQL
echo "=== Setting up PostgreSQL ==="
service postgresql start || true
su - postgres -c "psql -c \"CREATE USER ai_tutor WITH PASSWORD 'ai_tutor_2026';\"" 2>/dev/null || true
su - postgres -c "psql -c \"CREATE DATABASE ai_tutor OWNER ai_tutor;\"" 2>/dev/null || true
su - postgres -c "psql -c \"GRANT ALL PRIVILEGES ON DATABASE ai_tutor TO ai_tutor;\""

# Configure PostgreSQL to accept remote connections
echo "host    all             all             0.0.0.0/0               md5" >> /etc/postgresql/*/main/pg_hba.conf
sed -i "s/#listen_addresses = 'localhost'/listen_addresses = '*'/" /etc/postgresql/*/main/postgresql.conf
service postgresql restart

# Start Redis
echo "=== Setting up Redis ==="
sed -i 's/bind 127.0.0.1/bind 0.0.0.0/' /etc/redis/redis.conf
service redis-server start || true

# Install Python packages
echo "=== Installing Python ML packages ==="
pip install --upgrade pip

# Install PyTorch with CUDA support
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu121

# Install vLLM for LLM serving
pip install vllm

# Install TTS dependencies
pip install \
    kokoro>=0.4.4 \
    transformers>=4.40.0 \
    accelerate \
    huggingface_hub \
    soundfile \
    einops \
    scipy \
    numpy

# Install API server dependencies
pip install \
    fastapi \
    uvicorn[standard] \
    python-multipart \
    psycopg2-binary \
    redis \
    aiohttp

echo "=== Creating TTS server ==="
cat > /opt/ai-stack/tts/kokoro_server.py << 'KOKORO_EOF'
import io
import os
import time
import torch
import numpy as np
import soundfile as sf
from fastapi import FastAPI, Response, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from contextlib import asynccontextmanager

# Set GPU
os.environ["CUDA_VISIBLE_DEVICES"] = "1"  # Use GPU 1 for TTS

pipeline = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    global pipeline
    print("Loading Kokoro TTS model on GPU 1...")
    from kokoro import KPipeline
    pipeline = KPipeline(lang_code='a')
    # Warmup
    for _ in pipeline("Hello world", voice="af_heart"):
        pass
    print("Kokoro TTS ready!")
    yield
    print("Shutting down...")

app = FastAPI(lifespan=lifespan)
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

class TTSRequest(BaseModel):
    text: str
    voice: str = "af_heart"
    speed: float = 1.0

@app.post("/synthesize")
async def synthesize(request: TTSRequest):
    start = time.time()
    try:
        audio_chunks = []
        for _, _, audio in pipeline(request.text, voice=request.voice, speed=request.speed):
            audio_chunks.append(audio)
        
        full_audio = np.concatenate(audio_chunks) if audio_chunks else np.array([])
        
        buffer = io.BytesIO()
        sf.write(buffer, full_audio, 24000, format='WAV')
        buffer.seek(0)
        
        print(f"Kokoro TTS: '{request.text[:50]}...' in {time.time()-start:.2f}s")
        return Response(content=buffer.read(), media_type="audio/wav")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
async def health():
    return {"status": "healthy", "model": "kokoro", "gpu": 1}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
KOKORO_EOF

echo "=== Creating Supervisor config ==="
cat > /etc/supervisor/conf.d/ai-stack.conf << 'SUPERVISOR_EOF'
[program:vllm]
command=python -m vllm.entrypoints.openai.api_server --model Qwen/Qwen2.5-32B-Instruct-AWQ --quantization awq --gpu-memory-utilization 0.85 --max-model-len 8192 --tensor-parallel-size 1 --port 8000 --device cuda:0
directory=/opt/ai-stack/llm
autostart=true
autorestart=true
stderr_logfile=/opt/ai-stack/logs/vllm.err.log
stdout_logfile=/opt/ai-stack/logs/vllm.out.log
environment=CUDA_VISIBLE_DEVICES="0"

[program:kokoro-tts]
command=python /opt/ai-stack/tts/kokoro_server.py
directory=/opt/ai-stack/tts
autostart=true
autorestart=true
stderr_logfile=/opt/ai-stack/logs/kokoro.err.log
stdout_logfile=/opt/ai-stack/logs/kokoro.out.log
environment=CUDA_VISIBLE_DEVICES="1"

[program:postgresql]
command=/usr/lib/postgresql/*/bin/postgres -D /var/lib/postgresql/*/main -c config_file=/etc/postgresql/*/main/postgresql.conf
autostart=true
autorestart=true
user=postgres

[program:redis]
command=redis-server /etc/redis/redis.conf
autostart=true
autorestart=true
SUPERVISOR_EOF

echo "=== Creating Nginx config ==="
cat > /etc/nginx/sites-available/ai-stack << 'NGINX_EOF'
server {
    listen 80;
    server_name _;

    # LLM API (OpenAI-compatible)
    location /v1/ {
        proxy_pass http://127.0.0.1:8000/v1/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_read_timeout 300s;
    }

    # Kokoro TTS
    location /tts/kokoro/ {
        proxy_pass http://127.0.0.1:8001/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
    }

    # Health check
    location /health {
        return 200 'OK';
        add_header Content-Type text/plain;
    }
}
NGINX_EOF

ln -sf /etc/nginx/sites-available/ai-stack /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && service nginx restart

echo "=== Setup complete! ==="
echo "PostgreSQL: localhost:5432 (user: ai_tutor, db: ai_tutor)"
echo "Redis: localhost:6379"
echo "vLLM API: http://localhost:8000/v1/"
echo "Kokoro TTS: http://localhost:8001/"
echo ""
echo "To start all services: supervisorctl reload"
echo "To check status: supervisorctl status"
