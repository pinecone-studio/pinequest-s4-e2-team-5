// Дуу оролтын дундын хэрэгслүүд — useTutor (/learn) болон useVoiceCapture (/start) хоёул ашиглана.

// Voice Activity Detection — хүн ярьж эхэлсэн/дууссаныг RMS түвшингээр илрүүлнэ.
export class VAD {
  constructor(
    stream,
    { threshold = 0.015, silenceMs = 1200, onSpeechStart, onSpeechEnd },
  ) {
    this.ctx = new AudioContext();
    this.analyser = this.ctx.createAnalyser();
    this.analyser.fftSize = 512;
    const src = this.ctx.createMediaStreamSource(stream);
    src.connect(this.analyser);
    this.data = new Float32Array(this.analyser.fftSize);
    this.threshold = threshold;
    this.silenceMs = silenceMs;
    this.onSpeechStart = onSpeechStart;
    this.onSpeechEnd = onSpeechEnd;
    this.speaking = false;
    this.silenceTimer = null;
    this.stopped = false;
    this._tick();
  }

  _rms() {
    this.analyser.getFloatTimeDomainData(this.data);
    let s = 0;
    for (let i = 0; i < this.data.length; i++) s += this.data[i] ** 2;
    return Math.sqrt(s / this.data.length);
  }

  _tick() {
    if (this.stopped) return;
    const level = this._rms();
    if (level > this.threshold) {
      if (!this.speaking) {
        this.speaking = true;
        this.onSpeechStart?.();
      }
      clearTimeout(this.silenceTimer);
      this.silenceTimer = setTimeout(() => {
        if (this.speaking && !this.stopped) {
          this.speaking = false;
          this.onSpeechEnd?.();
        }
      }, this.silenceMs);
    }
    requestAnimationFrame(() => this._tick());
  }

  destroy() {
    this.stopped = true;
    clearTimeout(this.silenceTimer);
    this.ctx.close().catch(() => {});
  }
}

export function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(blob);
    reader.onload = () => resolve(reader.result.split(",")[1]);
    reader.onerror = reject;
  });
}
