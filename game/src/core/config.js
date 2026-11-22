// Every number the game tunes lives here, so a balance change is one edit.
// The room is one fixed frame, 1280 by 720, and the thief crosses it from
// the entry door (bottom left) to the getaway door (bottom right).

export const VIEW_W = 1280;
export const VIEW_H = 720;

// The thief walks at 175 px/s and sneaks at half that; sneaking also halves
// how fast the alarm climbs while a cone has eyes on them.
export const THIEF = {
  radius: 14,
  walkSpeed: 175,
  sneakSpeed: 88,
  coins: 3,
  smokes: 2,
  coinThrowRange: 320,
  coinLureRadius: 300,
  smokeRadius: 330,
};

// A guard walks its patrol at 72 px/s and chases at 155 px/s once the alarm
// passes the chase line. Its cone reaches 235 px and opens 34 degrees each
// side of where it faces.
export const GUARD = {
  radius: 15,
  patrolSpeed: 72,
  chaseSpeed: 155,
  visionRange: 235,
  halfAngle: 0.6,
  catchDistance: 26,
  investigateSeconds: 4,
};

// A camera sits on the top wall and sweeps its cone back and forth. Its cone
// reaches 240 px and opens 26 degrees each side of where it points. Smoke
// blinds it for 8 seconds.
export const CAMERA = {
  visionRange: 240,
  halfAngle: 0.45,
  sweepHalfAngle: 0.62,
  sweepSpeed: 0.45,
  disabledSeconds: 8,
};

// The alarm climbs while the thief is seen and drains while hidden. A guard's
// eyes fill it faster than a camera's. Past 55 the guards give chase; at 100
// the night is over. Sneaking while hidden cools the meter faster, so a
// careful thief can recover after a close call instead of only running.
export const ALARM = {
  riseGuard: 50,
  riseCamera: 38,
  fall: 20,
  fallSneaking: 30,
  chaseAbove: 55,
  caughtAt: 100,
};

// What a clean night is worth: the diamond, each gold bar, and the bonuses
// for a fast, quiet escape. The time bonus counts down from a two-minute
// window; the stealth bonus pays for every point of alarm never raised.
export const SCORE = {
  diamond: 1000,
  goldBar: 250,
  timeBonusWindow: 120,
  timeBonusPerSecond: 5,
  stealthBonusPerPoint: 10,
};

// How long a thrown coin stays on the floor ringing, and how long a smoke
// puff hangs in the air.
export const TOOL = {
  coinSeconds: 6,
  smokeSeconds: 1.4,
};
