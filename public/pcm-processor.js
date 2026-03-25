// PCM Audio Worklet Processor
// Captures 512-sample chunks of int16 PCM at native sample rate
class PCMProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.buffer = new Float32Array(512);
    this.bufferIndex = 0;
  }

  process(inputs, outputs, parameters) {
    const input = inputs[0];
    if (!input || !input[0]) return true;

    const channelData = input[0]; // mono channel

    for (let i = 0; i < channelData.length; i++) {
      this.buffer[this.bufferIndex++] = channelData[i];

      if (this.bufferIndex >= 512) {
        // Convert float32 to int16
        const int16 = new Int16Array(512);
        for (let j = 0; j < 512; j++) {
          int16[j] = Math.max(-32768, Math.min(32767, Math.round(this.buffer[j] * 32767)));
        }
        // Post to main thread
        this.port.postMessage(int16.buffer, [int16.buffer]);
        this.buffer = new Float32Array(512);
        this.bufferIndex = 0;
      }
    }
    return true;
  }
}

registerProcessor('pcm-processor', PCMProcessor);
