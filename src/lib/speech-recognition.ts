/**
 * Web Speech API Wrapper
 * Replaces Python's speech_recognition library
 */

export class SpeechRecognitionService {
  private recognition: any = null;
  private isSupported: boolean = false;

  constructor() {
    // Check if browser supports Web Speech API
    const SpeechRecognition = (window as any).SpeechRecognition ||
                              (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = false;
      this.recognition.interimResults = false;
      this.recognition.lang = 'en-US';
      this.isSupported = true;
      console.log('✅ Speech Recognition initialized');
    } else {
      console.warn('⚠️ Web Speech API not supported in this browser');
    }
  }

  /**
   * Transcribe audio buffer to text
   * Replaces Python's recognize_google()
   *
   * Note: Web Speech API uses the microphone directly, so we'll use a MediaStream approach
   */
  async transcribe(audioBlob: Blob): Promise<string> {
    if (!this.isSupported) {
      throw new Error('Speech recognition not supported');
    }

    return new Promise((resolve, reject) => {
      let transcriptText = '';
      let hasResult = false;

      this.recognition.onresult = (event: any) => {
        hasResult = true;
        transcriptText = event.results[0][0].transcript;
        console.log('📝 Transcribed:', transcriptText);
      };

      this.recognition.onerror = (event: any) => {
        console.error('❌ Transcription error:', event.error);
        if (!hasResult) {
          reject(new Error(`Transcription failed: ${event.error}`));
        }
      };

      this.recognition.onend = () => {
        if (hasResult) {
          resolve(transcriptText);
        } else {
          reject(new Error('No transcription result'));
        }
      };

      // Create audio element and play it while recognizing
      const reader = new FileReader();
      reader.onload = () => {
        const audio = new Audio(reader.result as string);

        // Start recognition
        this.recognition.start();

        // Play the audio (Web Speech API will pick it up if system audio routing works)
        // Note: This is a limitation of Web Speech API - it primarily works with live mic
        audio.play().catch(err => {
          console.warn('⚠️ Audio playback failed:', err);
          // Still try to get result from recognition
        });

        // Set timeout in case recognition doesn't complete
        setTimeout(() => {
          if (!hasResult) {
            this.recognition.stop();
            reject(new Error('Transcription timeout'));
          }
        }, 10000); // 10 second timeout
      };

      reader.onerror = () => {
        reject(new Error('Failed to read audio blob'));
      };

      reader.readAsDataURL(audioBlob);
    });
  }

  /**
   * Transcribe from live microphone stream
   * This is the more reliable method for Web Speech API
   */
  async transcribeLive(onResult: (text: string, isFinal: boolean) => void): Promise<() => void> {
    if (!this.isSupported) {
      throw new Error('Speech recognition not supported');
    }

    this.recognition.continuous = true;
    this.recognition.interimResults = true;

    this.recognition.onresult = (event: any) => {
      const result = event.results[event.results.length - 1];
      const transcript = result[0].transcript;
      const isFinal = result.isFinal;
      onResult(transcript, isFinal);
    };

    this.recognition.onerror = (event: any) => {
      console.error('❌ Live transcription error:', event.error);
    };

    this.recognition.start();

    // Return stop function
    return () => {
      this.recognition.stop();
      this.recognition.continuous = false;
      this.recognition.interimResults = false;
    };
  }

  /**
   * Alternative: Use Google Cloud Speech-to-Text API
   * More accurate, but requires API key
   */
  async transcribeWithGoogle(audioBlob: Blob, apiKey: string): Promise<string> {
    const reader = new FileReader();

    return new Promise((resolve, reject) => {
      reader.onload = async () => {
        try {
          const base64Audio = (reader.result as string).split(',')[1];

          const response = await fetch(
            `https://speech.googleapis.com/v1/speech:recognize?key=${apiKey}`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                config: {
                  encoding: 'WEBM_OPUS',
                  sampleRateHertz: 16000,
                  languageCode: 'en-US',
                },
                audio: { content: base64Audio }
              })
            }
          );

          const data = await response.json();
          const transcript = data.results?.[0]?.alternatives?.[0]?.transcript || '';

          console.log('📝 Transcribed (Google):', transcript);
          resolve(transcript);
        } catch (error) {
          reject(error);
        }
      };

      reader.readAsDataURL(audioBlob);
    });
  }

  isAvailable(): boolean {
    return this.isSupported;
  }
}
