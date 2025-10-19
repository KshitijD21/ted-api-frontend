/**
 * Audio utility for voice mode transitions
 */

export class VoiceAudio {
  private static audioContext: AudioContext | null = null;

  static init() {
    if (typeof window !== 'undefined' && !this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  }

  /**
   * Play a welcoming "wake up" sound when voice mode starts
   */
  static async playWelcome() {
    this.init();
    if (!this.audioContext) return;

    const ctx = this.audioContext;
    const now = ctx.currentTime;

    // Create a pleasant rising tone
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    // Rising frequency from C to G (pleasant interval)
    oscillator.frequency.setValueAtTime(261.63, now); // C4
    oscillator.frequency.exponentialRampToValueAtTime(392.0, now + 0.3); // G4

    // Gentle fade in and out
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(0.1, now + 0.05);
    gainNode.gain.linearRampToValueAtTime(0.1, now + 0.25);
    gainNode.gain.linearRampToValueAtTime(0, now + 0.4);

    oscillator.type = 'sine';
    oscillator.start(now);
    oscillator.stop(now + 0.4);
  }

  /**
   * Play a subtle notification sound
   */
  static async playNotification() {
    this.init();
    if (!this.audioContext) return;

    const ctx = this.audioContext;
    const now = ctx.currentTime;

    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.frequency.setValueAtTime(523.25, now); // C5

    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(0.08, now + 0.02);
    gainNode.gain.linearRampToValueAtTime(0, now + 0.15);

    oscillator.type = 'sine';
    oscillator.start(now);
    oscillator.stop(now + 0.15);
  }

  /**
   * Play a "listening" pulse sound
   */
  static async playListeningPulse() {
    this.init();
    if (!this.audioContext) return;

    const ctx = this.audioContext;
    const now = ctx.currentTime;

    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.frequency.setValueAtTime(440, now); // A4

    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(0.05, now + 0.05);
    gainNode.gain.linearRampToValueAtTime(0, now + 0.2);

    oscillator.type = 'sine';
    oscillator.start(now);
    oscillator.stop(now + 0.2);
  }
}
