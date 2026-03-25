@echo off
REM SSH Tunnel to Vast.ai GPU Server (2x RTX 3090)
REM Tunnels: vLLM (8000), Kokoro TTS (8001), SpeechT5 (8002), Whisper ASR (8003), PostgreSQL, Redis

echo Starting SSH tunnel to Vast.ai GPU server...
echo.
echo Tunnels will be created for:
echo   - vLLM API: localhost:8000 -^> GPU:8000
echo   - Kokoro TTS: localhost:8001 -^> GPU:8001
echo   - SpeechT5 TTS: localhost:8002 -^> GPU:8002
echo   - Whisper ASR: localhost:8003 -^> GPU:8003
echo   - PostgreSQL: localhost:5433 -^> GPU:5432
echo   - Redis: localhost:6380 -^> GPU:6379
echo.
echo Press Ctrl+C to stop the tunnel.
echo.

ssh -o StrictHostKeyChecking=no -N ^
    -L 8000:localhost:8000 ^
    -L 8001:localhost:8001 ^
    -L 8002:localhost:8002 ^
    -L 8003:localhost:8003 ^
    -L 5433:localhost:5432 ^
    -L 6380:localhost:6379 ^
    -p 40021 root@115.246.55.147
