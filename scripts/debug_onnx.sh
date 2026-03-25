
import time
import os
import onnxruntime as ort
from kokoro_onnx import Kokoro

print("Initializing Kokoro ONNX...")
start = time.time()
try:
    # Force CPU first to check basic functionality/path
    # os.environ["CUDA_VISIBLE_DEVICES"] = "" 
    # Actually let's try GPU if available
    
    pipeline = Kokoro("kokoro-v0_19.onnx", "voices.bin")
    print(f"Init time: {time.time() - start:.4f}s")
    print(f"Session Providers: {pipeline.session.get_providers()}")
    
    text = "Hello, this is a test of the emergency broadcast system."
    print(f"Synthesizing: '{text}'")
    
    start_inf = time.time()
    audio, sr = pipeline.create(text, voice="af_bella", speed=1.0)
    end_inf = time.time()
    
    print(f"Inference Time: {end_inf - start_inf:.4f}s")
    print(f"Audio len: {len(audio)}")
    
except Exception as e:
    print(f"Error: {e}")
