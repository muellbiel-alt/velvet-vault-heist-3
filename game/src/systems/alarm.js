// The alarm meter: the night's tension, 0 to 100. It climbs while a cone
// has eyes on the thief and drains while the thief is hidden. Sneaking halves
// the climb. A guard's eyes fill it faster than a camera's. The meter keeps
// its peak, which the stealth bonus pays for at the getaway, and the beep
// rate the audio layer reads.

import { ALARM } from '../core/config.js';

export function createAlarm() {
  return { value: 0, peak: 0 };
}

// Step the meter. `seenByCamera` picks the camera's slower climb over the
// guard's faster one. Hidden, the meter drains; a thief who stays low and
// out of sight while sneaking cools it faster. Returns true when it hits
// the caught line this step.
export function updateAlarm(alarm, seen, seenByCamera, sneaking, step, audio) {
  if (seen) {
    const rate = (seenByCamera ? ALARM.riseCamera : ALARM.riseGuard) * (sneaking ? 0.5 : 1);
    alarm.value = Math.min(ALARM.caughtAt, alarm.value + rate * step);
  } else {
    const drain = sneaking ? ALARM.fallSneaking : ALARM.fall;
    alarm.value = Math.max(0, alarm.value - drain * step);
  }
  if (alarm.value > alarm.peak) alarm.peak = alarm.value;
  if (audio) audio.alarmLevel(alarm.value);
  return alarm.value >= ALARM.caughtAt;
}
