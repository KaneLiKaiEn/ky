const TARGET_SAMPLE_RATE = 16000;

export class AudioRecorder {
  private mediaStream: MediaStream | null = null;
  private audioContext: AudioContext | null = null;
  private processor: ScriptProcessorNode | null = null;
  private input: MediaStreamAudioSourceNode | null = null;
  private chunks: Float32Array[] = [];
  private sampleCount = 0;

  async start(): Promise<void> {
    try {
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: false,
      });
      this.audioContext = new AudioContext();
      this.input = this.audioContext.createMediaStreamSource(this.mediaStream);
      this.processor = this.audioContext.createScriptProcessor(4096, 1, 1);
      this.chunks = [];
      this.sampleCount = 0;

      this.processor.onaudioprocess = (event) => {
        const source = event.inputBuffer.getChannelData(0);
        const chunk = new Float32Array(source);
        this.chunks.push(chunk);
        this.sampleCount += chunk.length;
      };

      this.input.connect(this.processor);
      this.processor.connect(this.audioContext.destination);
    } catch (error) {
      this.release();
      throw error;
    }
  }

  async stop(): Promise<Blob> {
    const sourceSampleRate = this.audioContext?.sampleRate ?? TARGET_SAMPLE_RATE;
    this.release();

    const samples = this.mergeChunks();
    const resampled = this.resample(
      samples,
      sourceSampleRate,
      TARGET_SAMPLE_RATE,
    );
    return this.createWavBlob(resampled, TARGET_SAMPLE_RATE);
  }

  cancel(): void {
    this.release();
    this.chunks = [];
    this.sampleCount = 0;
  }

  private release(): void {
    this.processor?.disconnect();
    this.input?.disconnect();
    this.mediaStream?.getTracks().forEach((track) => track.stop());
    void this.audioContext?.close();
    this.processor = null;
    this.input = null;
    this.mediaStream = null;
    this.audioContext = null;
  }

  private mergeChunks(): Float32Array {
    const samples = new Float32Array(this.sampleCount);
    let offset = 0;
    for (const chunk of this.chunks) {
      samples.set(chunk, offset);
      offset += chunk.length;
    }
    return samples;
  }

  private resample(
    samples: Float32Array,
    sourceRate: number,
    targetRate: number,
  ): Float32Array {
    if (sourceRate === targetRate || samples.length === 0) return samples;

    const ratio = sourceRate / targetRate;
    const output = new Float32Array(Math.round(samples.length / ratio));
    for (let i = 0; i < output.length; i += 1) {
      const position = i * ratio;
      const left = Math.floor(position);
      const right = Math.min(left + 1, samples.length - 1);
      const weight = position - left;
      output[i] = samples[left] * (1 - weight) + samples[right] * weight;
    }
    return output;
  }

  private createWavBlob(samples: Float32Array, sampleRate: number): Blob {
    const buffer = new ArrayBuffer(44 + samples.length * 2);
    const view = new DataView(buffer);

    const writeString = (offset: number, value: string) => {
      for (let i = 0; i < value.length; i += 1) {
        view.setUint8(offset + i, value.charCodeAt(i));
      }
    };

    writeString(0, "RIFF");
    view.setUint32(4, 36 + samples.length * 2, true);
    writeString(8, "WAVE");
    writeString(12, "fmt ");
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 1, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    writeString(36, "data");
    view.setUint32(40, samples.length * 2, true);

    for (let i = 0; i < samples.length; i += 1) {
      const sample = Math.max(-1, Math.min(1, samples[i]));
      view.setInt16(
        44 + i * 2,
        sample < 0 ? sample * 0x8000 : sample * 0x7fff,
        true,
      );
    }

    return new Blob([view], { type: "audio/wav" });
  }
}
