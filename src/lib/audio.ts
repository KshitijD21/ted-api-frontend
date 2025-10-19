// Shared AudioContext to prevent sample rate conflicts
let sharedAudioContext: AudioContext | null = null;

function getSharedAudioContext(): AudioContext {
  if (!sharedAudioContext || sharedAudioContext.state === 'closed') {
    // Use browser's default sample rate to avoid conflicts
    sharedAudioContext = new AudioContext();
  }
  return sharedAudioContext;
}

export function closeSharedAudioContext(): void {
  if (sharedAudioContext && sharedAudioContext.state !== 'closed') {
    sharedAudioContext.close();
    sharedAudioContext = null;
  }
}

/**
 * Audio Recorder for Gemini Live API
 * Records audio at browser's default sample rate and resamples to 16kHz mono PCM
 */
export class AudioRecorder {
  private mediaRecorder: MediaRecorder | null = null;
  private audioContext: AudioContext | null = null;
  private stream: MediaStream | null = null;
  private processor: ScriptProcessorNode | null = null;
  private source: MediaStreamAudioSourceNode | null = null;
  private silentSink: GainNode | null = null;
  private onDataCallback: ((base64Data: string) => void) | null = null;
  private onSilenceCallback: (() => void) | null = null;
  private chunkCounter: number = 0;

  // Silence detection properties optimized for natural human speech
  private silenceThreshold: number = 0.005; // Lower threshold for more sensitive detection
  private silenceTimeout: number = 3000; // 3 seconds - allows for natural pauses and thinking
  private minSpeechDuration: number = 500; // Must speak for at least 0.5s before considering silence
  private silenceTimer: NodeJS.Timeout | null = null;
  private hasSpokenRecently: boolean = false;
  private speechStartTime: number = 0;
  private lastSpeechTime: number = 0;

  async requestPermission(): Promise<boolean> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: 16000,
          echoCancellation: true,
          noiseSuppression: true,
        },
      });
      stream.getTracks().forEach(track => track.stop());
      return true;
    } catch (error) {
      console.error('Microphone permission denied:', error);
      return false;
    }
  }

  async start(
    onData: (base64Data: string) => void,
    onSilence?: () => void
  ): Promise<void> {
    this.onDataCallback = onData;
    this.onSilenceCallback = onSilence || null;

    this.stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        channelCount: 1,
        echoCancellation: true,
        noiseSuppression: true,
      },
    });

    // Use shared audio context to prevent sample rate conflicts
    this.audioContext = getSharedAudioContext();
    this.source = this.audioContext.createMediaStreamSource(this.stream);

    // Use ScriptProcessorNode with smaller buffer for lower latency
    this.processor = this.audioContext.createScriptProcessor(2048, 1, 1);

    this.processor.onaudioprocess = (e) => {
      if (this.onDataCallback) {
        const inputData = e.inputBuffer.getChannelData(0);
        const sourceSampleRate = this.audioContext!.sampleRate;

        // Calculate RMS (Root Mean Square) for volume detection
        let rms = 0;
        for (let i = 0; i < inputData.length; i++) {
          rms += inputData[i] * inputData[i];
        }
        rms = Math.sqrt(rms / inputData.length);

        const currentTime = Date.now();
        const isSpeaking = rms > this.silenceThreshold;

        if (isSpeaking) {
          // User is speaking
          if (!this.hasSpokenRecently) {
            // Just started speaking
            this.speechStartTime = currentTime;
            this.hasSpokenRecently = true;
            console.log('🎙️ Speech detected - starting to record');
          }

          this.lastSpeechTime = currentTime;

          // Clear any existing silence timer
          if (this.silenceTimer) {
            clearTimeout(this.silenceTimer);
            this.silenceTimer = null;
          }
        } else if (this.hasSpokenRecently && !this.silenceTimer) {
          // User stopped speaking - but only start silence timer if they spoke long enough
          const speechDuration = currentTime - this.speechStartTime;

          if (speechDuration >= this.minSpeechDuration) {
            // They spoke long enough, start silence countdown
            this.silenceTimer = setTimeout(() => {
              if (this.onSilenceCallback && this.hasSpokenRecently) {
                const totalSpeechTime = this.lastSpeechTime - this.speechStartTime;
                console.log('🔇 Natural pause detected - ending turn');
                console.log('   - Total speech duration:', (totalSpeechTime / 1000).toFixed(2), 'seconds');
                this.onSilenceCallback();
                this.hasSpokenRecently = false;
                this.speechStartTime = 0;
                this.lastSpeechTime = 0;
              }
              this.silenceTimer = null;
            }, this.silenceTimeout);
          } else {
            // They didn't speak long enough, reset and wait for more speech
            console.log('⚡ Brief sound detected, waiting for actual speech...');
            this.hasSpokenRecently = false;
            this.speechStartTime = 0;
          }
        }

        // Add logging (only log every 50th chunk to avoid spam)
        if (!this.chunkCounter) this.chunkCounter = 0;
        this.chunkCounter++;

        if (this.chunkCounter % 50 === 0) {
          const speechStatus = isSpeaking ? '🗣️ Speaking' : '🔇 Silent';
          const speechDuration = this.hasSpokenRecently ?
            ((currentTime - this.speechStartTime) / 1000).toFixed(1) + 's' : '0s';

          console.log('🎤 AUDIO INPUT STATUS:');
          console.log('   - Status:', speechStatus);
          console.log('   - Speech Duration:', speechDuration);
          console.log('   - Audio Level:', rms.toFixed(4));
          console.log('   - Sample Rate:', sourceSampleRate, 'Hz');
        }

        // Resample to 16kHz if needed
        let resampledData: Float32Array;
        if (sourceSampleRate !== 16000) {
          resampledData = this.resampleTo16kHz(inputData, sourceSampleRate);

          if (this.chunkCounter % 50 === 0) {
            console.log('   - Resampled to:', resampledData.length, 'samples');
          }
        } else {
          resampledData = inputData;
        }

        // Normalize audio to prevent clipping
        const normalizedData = this.normalizeAudio(resampledData);

        // Convert Float32 to Int16 PCM
        const int16Data = new Int16Array(normalizedData.length);
        for (let i = 0; i < normalizedData.length; i++) {
          const s = Math.max(-1, Math.min(1, normalizedData[i]));
          int16Data[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
        }

        // Convert to base64
        const base64 = this.arrayBufferToBase64(int16Data.buffer);
        this.onDataCallback(base64);
      }
    };

    this.source.connect(this.processor);
    // Use a zero-gain sink to keep the node graph alive without audible feedback
    this.silentSink = this.audioContext.createGain();
    this.silentSink.gain.value = 0;
    this.processor.connect(this.silentSink);
    this.silentSink.connect(this.audioContext.destination);
  }

  private resampleTo16kHz(inputData: Float32Array, sourceSampleRate: number): Float32Array {
    if (sourceSampleRate === 16000) {
      return inputData;
    }

    // Use Web Audio API's OfflineAudioContext for high-quality resampling
    return this.highQualityResample(inputData, sourceSampleRate, 16000);
  }

  private highQualityResample(inputData: Float32Array, sourceSampleRate: number, targetSampleRate: number): Float32Array {
    // For small sample rate differences or identical rates, use simple resampling
    if (Math.abs(sourceSampleRate - targetSampleRate) < 1000 || sourceSampleRate === targetSampleRate) {
      return this.simpleResample(inputData, sourceSampleRate, targetSampleRate);
    }

    // For real-time processing, we'll use the improved simple resampling
    // OfflineAudioContext is better for non-real-time scenarios
    return this.simpleResample(inputData, sourceSampleRate, targetSampleRate);
  }

  private simpleResample(inputData: Float32Array, sourceSampleRate: number, targetSampleRate: number): Float32Array {
    if (sourceSampleRate === targetSampleRate) {
      return inputData;
    }

    const ratio = sourceSampleRate / targetSampleRate;
    const outputLength = Math.floor(inputData.length / ratio);
    const output = new Float32Array(outputLength);

    // Use sinc interpolation for better quality when downsampling
    if (ratio > 1) {
      // Downsampling - apply anti-aliasing filter
      for (let i = 0; i < outputLength; i++) {
        let sum = 0;
        let weight = 0;
        const center = i * ratio;
        const start = Math.max(0, Math.floor(center - 2));
        const end = Math.min(inputData.length - 1, Math.ceil(center + 2));

        for (let j = start; j <= end; j++) {
          const distance = Math.abs(j - center);
          let w = 1;
          if (distance > 0) {
            // Simple Lanczos-like filter
            w = Math.sin(Math.PI * distance) / (Math.PI * distance);
            if (distance > 1) {
              w *= Math.sin(Math.PI * distance / 2) / (Math.PI * distance / 2);
            }
          }
          sum += inputData[j] * w;
          weight += w;
        }
        output[i] = weight > 0 ? sum / weight : 0;
      }
    } else {
      // Upsampling - use cubic interpolation
      for (let i = 0; i < outputLength; i++) {
        const sourceIndex = i * ratio;
        const index = Math.floor(sourceIndex);
        const fraction = sourceIndex - index;

        if (index + 1 < inputData.length) {
          // Cubic interpolation for smoother upsampling
          const y0 = index > 0 ? inputData[index - 1] : inputData[index];
          const y1 = inputData[index];
          const y2 = inputData[index + 1];
          const y3 = index + 2 < inputData.length ? inputData[index + 2] : inputData[index + 1];

          const a = -0.5 * y0 + 1.5 * y1 - 1.5 * y2 + 0.5 * y3;
          const b = y0 - 2.5 * y1 + 2 * y2 - 0.5 * y3;
          const c = -0.5 * y0 + 0.5 * y2;
          const d = y1;

          output[i] = a * fraction * fraction * fraction + b * fraction * fraction + c * fraction + d;
        } else {
          output[i] = inputData[index];
        }
      }
    }

    return output;
  }

  private normalizeAudio(audioData: Float32Array): Float32Array {
    // Find the peak amplitude
    let maxAmplitude = 0;
    for (let i = 0; i < audioData.length; i++) {
      maxAmplitude = Math.max(maxAmplitude, Math.abs(audioData[i]));
    }

    // If audio is too quiet, apply gentle gain, if too loud, normalize
    const normalized = new Float32Array(audioData.length);
    if (maxAmplitude > 0) {
      let gainFactor = 1;
      if (maxAmplitude > 0.95) {
        // Prevent clipping
        gainFactor = 0.95 / maxAmplitude;
      } else if (maxAmplitude < 0.1) {
        // Boost quiet audio slightly
        gainFactor = Math.min(2.0, 0.3 / maxAmplitude);
      }

      for (let i = 0; i < audioData.length; i++) {
        normalized[i] = audioData[i] * gainFactor;
      }
    } else {
      // Silent audio
      normalized.set(audioData);
    }

    return normalized;
  }

  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  stop(): void {
    // Clear silence timer
    if (this.silenceTimer) {
      clearTimeout(this.silenceTimer);
      this.silenceTimer = null;
    }

    if (this.processor) {
      try { this.processor.disconnect(); } catch {}
      this.processor = null;
    }

    if (this.source) {
      try { this.source.disconnect(); } catch {}
      this.source = null;
    }

    if (this.silentSink) {
      try { this.silentSink.disconnect(); } catch {}
      this.silentSink = null;
    }

    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }

    // Don't close the shared audio context, just clear our reference
    this.audioContext = null;
    this.onDataCallback = null;
    this.onSilenceCallback = null;
    this.hasSpokenRecently = false;
    this.speechStartTime = 0;
    this.lastSpeechTime = 0;
  }

  isRecording(): boolean {
    return this.processor !== null && this.audioContext?.state === 'running';
  }
}

/**
 * Audio Player for Gemini Live API
 * Plays 24kHz Int16 PCM audio received from Gemini, resampling as needed
 */
export class AudioPlayer {
  private audioContext: AudioContext | null = null;
  // We schedule many short sources back-to-back; keep track of all to stop/cleanup
  private playingNodes: AudioBufferSourceNode[] = [];
  private isPlaying = false;
  private onEndedCallback: (() => void) | null = null;

  // Playback rate for human-friendly speech (1.0 = normal, 0.8 = slower, 1.2 = faster)
  private playbackRate: number = 0.9; // Slightly slower for better comprehension

  // Queueing state to ensure gapless playback
  // Next absolute time (AudioContext time) at which to start the next chunk
  private nextStartTime = 0;
  // Lead-in buffer to absorb jitter before starting playback
  private jitterBufferSeconds = 0.2;

  /**
   * Play base64-encoded 24kHz Int16 PCM audio from Gemini
   */
  async playBase64Audio(base64Audio: string, onEnded?: () => void): Promise<void> {
    if (onEnded) {
      this.onEndedCallback = onEnded;
    }

    if (!this.audioContext) {
      this.audioContext = getSharedAudioContext();
    }
    // Ensure context is running (autoplay policies may suspend it)
    if (this.audioContext.state === 'suspended') {
      try { await this.audioContext.resume(); } catch {}
    }

    try {
      // Decode and prepare buffer for scheduling
      console.log('🎵 PLAYBACK CHUNK');
      console.log('   - Input base64 length:', base64Audio.length);

      // Decode base64 to binary
      const binary = atob(base64Audio);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }

      console.log('   - Binary bytes:', bytes.length);

      // Convert Int16 to Float32 for Web Audio API
      const int16Array = new Int16Array(bytes.buffer);
      const float32Array = new Float32Array(int16Array.length);
      for (let i = 0; i < int16Array.length; i++) {
        float32Array[i] = int16Array[i] / 32768.0;
      }

      console.log('   - Int16 samples:', int16Array.length);
      console.log('   - Float32 samples:', float32Array.length);

      const contextSampleRate = this.audioContext.sampleRate;
      const geminiSampleRate = 24000;

      // Calculate original duration BEFORE resampling
      const originalDuration = float32Array.length / geminiSampleRate;
      console.log('   - Gemini sample rate: 24000 Hz');
      console.log('   - Context sample rate:', contextSampleRate, 'Hz');
      console.log('   - Original duration:', originalDuration.toFixed(3), 'seconds');

      // ✅ CORRECT FIX: Resample the data to match context sample rate
      let finalAudioData: Float32Array;
      if (contextSampleRate !== geminiSampleRate) {
        finalAudioData = this.resampleFrom24kHz(float32Array, contextSampleRate);
        console.log('   - Resampled to:', finalAudioData.length, 'samples');
      } else {
        finalAudioData = float32Array;
        console.log('   - No resampling needed');
      }

      // Verify the duration is preserved
      const finalDuration = finalAudioData.length / contextSampleRate;
      console.log('   - Final duration:', finalDuration.toFixed(3), 'seconds');
      console.log('   - Duration match:', Math.abs(originalDuration - finalDuration) < 0.01 ? '✅' : '❌');

      // Normalize audio
      const normalizedAudio = this.normalizePlaybackAudio(finalAudioData);

      // Create audio buffer at the context's sample rate
      // The sample count is already correct because we resampled
      const audioBuffer = this.audioContext.createBuffer(
        1, // mono
        normalizedAudio.length,
        contextSampleRate
      );
      audioBuffer.getChannelData(0).set(normalizedAudio);

      console.log('   - Buffer created: ', audioBuffer.length, 'samples at', audioBuffer.sampleRate, 'Hz');
      console.log('   - Buffer duration:', audioBuffer.duration.toFixed(3), 'seconds');

      // Prepare a new source and schedule it in the queue (do NOT stop previous sources)
      const src = this.audioContext.createBufferSource();
      src.buffer = audioBuffer;
      src.playbackRate.setValueAtTime(this.playbackRate, this.audioContext.currentTime);
      src.connect(this.audioContext.destination);

      const now = this.audioContext.currentTime;
      // Initialize the queue start time if needed, with a small jitter buffer
      if (this.nextStartTime < now + 0.005) {
        this.nextStartTime = now + this.jitterBufferSeconds;
      }

      const scheduledStart = this.nextStartTime;
      const scheduledChunkDuration = audioBuffer.duration / this.playbackRate;
      this.nextStartTime += scheduledChunkDuration;

      // Keep track of active nodes for proper cleanup
      this.playingNodes.push(src);
      src.onended = () => {
        // Remove from active list
        this.playingNodes = this.playingNodes.filter(n => n !== src);
        // If nothing remains, mark not playing and notify
        if (this.playingNodes.length === 0) {
          this.isPlaying = false;
          const actualDuration = audioBuffer.duration / this.playbackRate;
          console.log('🎵 QUEUE DRAINED, last chunk duration:', actualDuration.toFixed(3), 's');
          this.onEndedCallback?.();
          this.onEndedCallback = null;
        }
      };

      // Schedule start for seamless playback
      src.start(scheduledStart);
      this.isPlaying = true;
      console.log(
        `🎵 Queued ${scheduledChunkDuration.toFixed(3)}s @ ${scheduledStart.toFixed(3)}s (ctx now ${now.toFixed(3)}s, rate ${this.playbackRate}x)`
      );
    } catch (error) {
      console.error('❌ Error playing audio:', error);
      this.isPlaying = false;
      throw error;
    }
  }

  private resampleFrom24kHz(inputData: Float32Array, targetSampleRate: number): Float32Array {
    if (targetSampleRate === 24000) {
      return inputData;
    }

    console.log('🔄 RESAMPLING: 24000 Hz → ', targetSampleRate, 'Hz');

    // Special case for 48kHz (exact 2x upsampling)
    if (targetSampleRate === 48000) {
      const outputLength = inputData.length * 2;
      const output = new Float32Array(outputLength);

      // Linear interpolation for 2x upsampling
      for (let i = 0; i < inputData.length - 1; i++) {
        output[i * 2] = inputData[i];
        output[i * 2 + 1] = (inputData[i] + inputData[i + 1]) / 2;
      }
      // Handle last sample
      output[outputLength - 2] = inputData[inputData.length - 1];
      output[outputLength - 1] = inputData[inputData.length - 1];

      console.log('   - Input samples:', inputData.length);
      console.log('   - Output samples:', output.length);
      console.log('   - Ratio:', (output.length / inputData.length).toFixed(2), 'x');

      return output;
    }

    // For other sample rates, use high-quality resampling
    return this.highQualityResamplePlayback(inputData, 24000, targetSampleRate);
  }

  private highQualityResamplePlayback(inputData: Float32Array, sourceSampleRate: number, targetSampleRate: number): Float32Array {
    if (sourceSampleRate === targetSampleRate) {
      return inputData;
    }

    const ratio = sourceSampleRate / targetSampleRate;
    const outputLength = Math.ceil(inputData.length / ratio);
    const output = new Float32Array(outputLength);

    if (ratio > 1) {
      // Downsampling: apply anti-aliasing filter
      const filterRadius = 2;
      for (let i = 0; i < outputLength; i++) {
        let sum = 0;
        let weightSum = 0;
        const center = i * ratio;
        const start = Math.max(0, Math.floor(center - filterRadius));
        const end = Math.min(inputData.length - 1, Math.ceil(center + filterRadius));

        for (let j = start; j <= end; j++) {
          const distance = Math.abs(j - center);
          let weight = 1;

          if (distance > 0 && distance <= filterRadius) {
            // Lanczos windowed sinc filter
            const x = Math.PI * distance;
            const windowX = Math.PI * distance / filterRadius;
            weight = (Math.sin(x) / x) * (Math.sin(windowX) / windowX);
          } else if (distance > filterRadius) {
            weight = 0;
          }

          sum += inputData[j] * weight;
          weightSum += weight;
        }

        output[i] = weightSum > 0 ? sum / weightSum : 0;
      }
    } else {
      // Upsampling: use cubic interpolation
      for (let i = 0; i < outputLength; i++) {
        const sourceIndex = i * ratio;
        const index = Math.floor(sourceIndex);
        const fraction = sourceIndex - index;

        if (index >= inputData.length - 1) {
          output[i] = inputData[inputData.length - 1];
        } else if (index <= 0) {
          output[i] = inputData[0];
        } else {
          // Cubic hermite interpolation for smooth upsampling
          const y0 = index > 0 ? inputData[index - 1] : inputData[0];
          const y1 = inputData[index];
          const y2 = index + 1 < inputData.length ? inputData[index + 1] : inputData[inputData.length - 1];
          const y3 = index + 2 < inputData.length ? inputData[index + 2] : inputData[inputData.length - 1];

          const a = -0.5 * y0 + 1.5 * y1 - 1.5 * y2 + 0.5 * y3;
          const b = y0 - 2.5 * y1 + 2 * y2 - 0.5 * y3;
          const c = -0.5 * y0 + 0.5 * y2;
          const d = y1;

          output[i] = a * fraction * fraction * fraction + b * fraction * fraction + c * fraction + d;
        }
      }
    }

    return output;
  }

  private simpleResample(inputData: Float32Array, sourceSampleRate: number, targetSampleRate: number): Float32Array {
    if (sourceSampleRate === targetSampleRate) {
      return inputData;
    }

    const ratio = sourceSampleRate / targetSampleRate;
    const outputLength = Math.floor(inputData.length / ratio);
    const output = new Float32Array(outputLength);

    // Use sinc interpolation for better quality when downsampling
    if (ratio > 1) {
      // Downsampling - apply anti-aliasing filter
      for (let i = 0; i < outputLength; i++) {
        let sum = 0;
        let weight = 0;
        const center = i * ratio;
        const start = Math.max(0, Math.floor(center - 2));
        const end = Math.min(inputData.length - 1, Math.ceil(center + 2));

        for (let j = start; j <= end; j++) {
          const distance = Math.abs(j - center);
          let w = 1;
          if (distance > 0) {
            // Simple Lanczos-like filter
            w = Math.sin(Math.PI * distance) / (Math.PI * distance);
            if (distance > 1) {
              w *= Math.sin(Math.PI * distance / 2) / (Math.PI * distance / 2);
            }
          }
          sum += inputData[j] * w;
          weight += w;
        }
        output[i] = weight > 0 ? sum / weight : 0;
      }
    } else {
      // Upsampling - use cubic interpolation
      for (let i = 0; i < outputLength; i++) {
        const sourceIndex = i * ratio;
        const index = Math.floor(sourceIndex);
        const fraction = sourceIndex - index;

        if (index + 1 < inputData.length) {
          // Cubic interpolation for smoother upsampling
          const y0 = index > 0 ? inputData[index - 1] : inputData[index];
          const y1 = inputData[index];
          const y2 = inputData[index + 1];
          const y3 = index + 2 < inputData.length ? inputData[index + 2] : inputData[index + 1];

          const a = -0.5 * y0 + 1.5 * y1 - 1.5 * y2 + 0.5 * y3;
          const b = y0 - 2.5 * y1 + 2 * y2 - 0.5 * y3;
          const c = -0.5 * y0 + 0.5 * y2;
          const d = y1;

          output[i] = a * fraction * fraction * fraction + b * fraction * fraction + c * fraction + d;
        } else {
          output[i] = inputData[index];
        }
      }
    }

    return output;
  }

  private normalizePlaybackAudio(audioData: Float32Array): Float32Array {
    // Find the peak amplitude
    let maxAmplitude = 0;
    for (let i = 0; i < audioData.length; i++) {
      maxAmplitude = Math.max(maxAmplitude, Math.abs(audioData[i]));
    }

    const normalized = new Float32Array(audioData.length);
    if (maxAmplitude > 0) {
      // For playback, be more conservative with normalization
      let gainFactor = 1;
      if (maxAmplitude > 0.9) {
        // Prevent clipping with some headroom
        gainFactor = 0.8 / maxAmplitude;
      } else if (maxAmplitude < 0.05) {
        // Boost very quiet audio
        gainFactor = Math.min(3.0, 0.2 / maxAmplitude);
      }

      for (let i = 0; i < audioData.length; i++) {
        normalized[i] = Math.max(-0.95, Math.min(0.95, audioData[i] * gainFactor));
      }
    } else {
      normalized.set(audioData);
    }

    return normalized;
  }

  stop(): void {
    // Stop all scheduled/playing nodes
    if (this.playingNodes.length) {
      for (const node of this.playingNodes) {
        try {
          node.stop();
        } catch {
          // ignore
        }
      }
    }
    this.playingNodes = [];
    this.nextStartTime = 0;
    this.isPlaying = false;
    this.onEndedCallback = null;
  }

  getIsPlaying(): boolean {
    return this.isPlaying;
  }

  cleanup(): void {
    this.stop();
    // Don't close the shared audio context, just clear our reference
    this.audioContext = null;
  }

  /**
   * Set playback rate for speech (1.0 = normal, 0.8 = slower, 1.2 = faster)
   * Optimal range for speech: 0.7-1.1
   */
  setPlaybackRate(rate: number): void {
    this.playbackRate = Math.max(0.5, Math.min(2.0, rate));
    console.log('🎚️ Playback rate set to:', this.playbackRate);
  }

  getPlaybackRate(): number {
    return this.playbackRate;
  }
}
