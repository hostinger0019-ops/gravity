# GPU Server Setup Guide

Quick setup guide for deploying voice AI services on Vast.ai or other GPU providers.

## Services

| Service | Port | Description |
|---------|------|-------------|
| **Kokoro TTS** | 8001 | GPU-accelerated text-to-speech |
| **Whisper ASR** | 8003 | GPU-accelerated speech recognition |

## Quick Start

### 1. Rent a GPU Instance
- Go to [Vast.ai](https://vast.ai) or [RunPod](https://runpod.io)
- Recommended: RTX 4090/5090 with 24GB+ VRAM
- OS: Ubuntu with CUDA

### 2. SSH into Instance
```bash
ssh -p <PORT> root@<IP>
```

### 3. Upload and Run Setup Script
From your local machine:
```bash
scp -P <PORT> scripts/gpu_setup.sh root@<IP>:/root/
ssh -p <PORT> root@<IP> "chmod +x /root/gpu_setup.sh && /root/gpu_setup.sh"
```

### 4. Start Services
```bash
ssh -p <PORT> root@<IP> "/root/start_services.sh"
```

### 5. Create SSH Tunnel (on your local machine)
```bash
ssh -p <PORT> root@<IP> -L 8001:localhost:8001 -L 8003:localhost:8003
```

### 6. Update .env.local
```env
KOKORO_TTS_URL=http://localhost:8001
WHISPER_ASR_URL=http://localhost:8003
```

## Verify Services

```bash
# Test TTS
curl http://localhost:8001/health

# Test ASR 
curl http://localhost:8003/health

# List TTS voices
curl http://localhost:8001/v1/voices
```

## Files on GPU Server

| File | Description |
|------|-------------|
| `/root/tts_server.py` | Kokoro TTS server |
| `/root/whisper_server.py` | Whisper ASR server |
| `/root/start_services.sh` | Start all services |
| `/root/stop_services.sh` | Stop all services |
| `/tmp/tts.log` | TTS server logs |
| `/tmp/asr.log` | ASR server logs |

## Current Instance Details
Update these when you change servers:

```
Provider: Vast.ai
GPU: RTX 5090 (32GB VRAM)
SSH: ssh -p 22971 root@199.68.217.31
Tunnel: ssh -p 22971 root@199.68.217.31 -L 8001:localhost:8001 -L 8003:localhost:8003
```

## Troubleshooting

**TTS not generating audio:**
```bash
tail -f /tmp/tts.log
```

**ASR transcription failing:**
```bash
tail -f /tmp/asr.log
```

**Restart services:**
```bash
/root/stop_services.sh
/root/start_services.sh
```

**Check GPU memory:**
```bash
nvidia-smi
```
