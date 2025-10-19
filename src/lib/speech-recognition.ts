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
   */
  async transcribe(audioBlob: Blob): Promise<string> {
    if (!this.isSupported) {
      throw new Error('Speech recognition not supported');
    }

    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = () => {
        const audio = new Audio(reader.result as string);

        this.recognition.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          console.log('📝 Transcribed:', transcript);
          resolve(transcript);
        };

        this.recognition.onerror = (event: any) => {
          console.error('❌ Transcription error:', event.error);
          reject(new Error(event.error));
        };

        this.recognition.start();
        audio.play();
      };

      reader.readAsDataURL(audioBlob);
    });
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
