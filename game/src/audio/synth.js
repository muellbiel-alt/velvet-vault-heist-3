// Procedural sound: every cue is a short WebAudio oscillator, so the game
// ships no audio files at all. The synth starts on the first keypress (a
// browser only lets audio start after a gesture) and stays silent in the
// screenshot runs, where no gesture ever happens.

export function createAudio() {
  return {
    ctx: null,
    muted: false,
    lastBeep: 0,
    alarmLevelValue: 0,
  };
}

function ensure(audio) {
  if (audio.ctx) return audio.ctx;
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    audio.ctx = new Ctx();
  } catch {
    audio.ctx = null;
  }
  return audio.ctx;
}

function tone(audio, freq, dur, type, gain) {
  const ctx = ensure(audio);
  if (!ctx || audio.muted) return;
  const osc = ctx.createOscillator();
  const amp = ctx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  amp.gain.setValueAtTime(gain, ctx.currentTime);
  amp.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
  osc.connect(amp);
  amp.connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + dur);
}

export function audioApi(audio) {
  return {
    unlock() {
      ensure(audio);
    },
    toggleMute() {
      audio.muted = !audio.muted;
      return audio.muted;
    },
    coin() {
      tone(audio, 1180, 0.12, 'sine', 0.12);
    },
    smoke() {
      tone(audio, 320, 0.3, 'triangle', 0.1);
    },
    pickup() {
      tone(audio, 880, 0.1, 'sine', 0.12);
      setTimeout(() => tone(audio, 1320, 0.14, 'sine', 0.12), 70);
    },
    diamond() {
      tone(audio, 1046, 0.12, 'sine', 0.14);
      setTimeout(() => tone(audio, 1318, 0.12, 'sine', 0.14), 90);
      setTimeout(() => tone(audio, 1568, 0.2, 'sine', 0.14), 180);
    },
    win() {
      [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => tone(audio, f, 0.22, 'triangle', 0.14), i * 110));
    },
    caught() {
      tone(audio, 220, 0.5, 'sawtooth', 0.16);
      setTimeout(() => tone(audio, 165, 0.6, 'sawtooth', 0.16), 160);
    },
    alarmLevel(value) {
      audio.alarmLevelValue = value;
    },
    cameraBeep(step) {
      // A soft tick while a camera has the thief in frame, at most twice a
      // second, so the warning is felt rather than heard constantly.
      if (audio.alarmLevelValue < 40) return;
      audio.lastBeep += step;
      if (audio.lastBeep >= 0.5) {
        audio.lastBeep = 0;
        tone(audio, 1560, 0.05, 'square', 0.03);
      }
    },
  };
}
