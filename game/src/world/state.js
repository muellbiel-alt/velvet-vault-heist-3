// The world: one room, one thief, three guards, two cameras, one alarm
// meter. A fresh world from a seed always replays the same night, so the
// screenshots and the grader's two runs agree.

import { ALARM, CAMERA, GUARD, SCORE } from '../core/config.js';
import { createRandom } from '../core/random.js';
import { createRoom } from './room.js';
import { createThief, throwCoin, updateThief, useSmoke } from '../entities/thief.js';
import { createGuard, updateGuard } from '../entities/guard.js';
import { createCamera, updateCamera } from '../entities/camera.js';
import { detectorSees } from '../systems/vision.js';
import { createAlarm, updateAlarm } from '../systems/alarm.js';

export const EVENT_CAUGHT = 1;
export const EVENT_WON = 2;
export const EVENT_PICKUP = 4;
export const EVENT_DIAMOND = 8;

export function createWorld(seed) {
  const random = createRandom(seed);
  const room = createRoom();
  const state = {
    seed,
    room,
    thief: createThief(room),
    guards: [
      createGuard(
        [
          { x: 380, y: 210 },
          { x: 900, y: 210 },
        ],
        random() * 0.6,
      ),
      createGuard(
        [
          { x: 300, y: 390 },
          { x: 300, y: 600 },
        ],
        random() * 0.6,
      ),
      createGuard(
        [
          { x: 980, y: 390 },
          { x: 980, y: 600 },
        ],
        random() * 0.6,
      ),
    ],
    cameras: [
      // Each camera looks down into the hall and sweeps a narrow arc, so the
      // diamond's pedestal is watched only part of the time and a thief who
      // reads the sweep can cross in the gap.
      createCamera(360, 44, 0.35, 1.35),
      createCamera(920, 44, Math.PI - 1.35, Math.PI - 0.35),
    ],
    alarm: createAlarm(),
    coins: [],
    smokes: [],
    time: 0,
    score: 0,
    status: 'playing',
    seen: false,
    seenByCamera: false,
  };
  return state;
}

export function resetWorld(state) {
  const fresh = createWorld(state.seed);
  for (const key of Object.keys(fresh)) state[key] = fresh[key];
}

function nearestGuard(state, x, y, maxDist) {
  let best = null;
  let bestDist = maxDist;
  for (const guard of state.guards) {
    const dist = Math.hypot(guard.x - x, guard.y - y);
    if (dist < bestDist) {
      bestDist = dist;
      best = guard;
    }
  }
  return best;
}

// One fixed step. `move` is a unit direction (or zero), `sneaking` halves how
// fast the thief is noticed. `coinTarget` is a point to toss a coin at (or
// null); `smoke` spends a smoke bomb. Returns events; the world stops
// changing once it is caught or won.
export function stepWorld(state, move, sneaking, step, coinTarget, smoke, audio) {
  if (state.status !== 'playing') return 0;
  let events = 0;
  state.time += step;

  if (coinTarget) {
    const coin = throwCoin(state.thief, coinTarget);
    if (coin) {
      state.coins.push(coin);
      if (audio) audio.coin();
      const guard = nearestGuard(state, coin.x, coin.y, 280);
      if (guard) guard.investigate = { x: coin.x, y: coin.y, timer: 4 };
    }
  }
  if (smoke) {
    if (useSmoke(state.thief)) {
      if (audio) audio.smoke();
      state.smokes.push({ x: state.thief.x, y: state.thief.y, timer: 1.2 });
      for (const camera of state.cameras) {
        if (Math.hypot(camera.x - state.thief.x, camera.y - state.thief.y) < 320) {
          camera.disabled = CAMERA.disabledSeconds;
        }
      }
    }
  }

  updateThief(state.thief, state.room, move, sneaking, step, audio);
  const chase = state.alarm.value > ALARM.chaseAbove;
  for (const guard of state.guards) {
    updateGuard(guard, state.room, step, chase ? state.thief : null);
  }
  for (const camera of state.cameras) updateCamera(camera, step);
  for (const coin of state.coins) {
    coin.timer -= step;
    coin.ring += step;
  }
  state.coins = state.coins.filter((coin) => coin.timer > 0);
  for (const puff of state.smokes) puff.timer -= step;
  state.smokes = state.smokes.filter((puff) => puff.timer > 0);

  // Who has eyes on the thief right now?
  let seen = false;
  let seenByCamera = false;
  for (const guard of state.guards) {
    if (detectorSees(state.room, guard, GUARD.visionRange, GUARD.halfAngle, state.thief)) {
      seen = true;
      break;
    }
  }
  if (!seen) {
    for (const camera of state.cameras) {
      if (camera.disabled > 0) continue;
      if (detectorSees(state.room, camera, CAMERA.visionRange, CAMERA.halfAngle, state.thief)) {
        seen = true;
        seenByCamera = true;
        break;
      }
    }
  }
  state.seen = seen;
  state.seenByCamera = seenByCamera;

  if (updateAlarm(state.alarm, seen, seenByCamera, sneaking, step, audio)) {
    state.status = 'caught';
    if (audio) audio.caught();
    return EVENT_CAUGHT;
  }
  if (audio) audio.cameraBeep(step);

  // A chasing guard who reaches the thief ends the night at once.
  for (const guard of state.guards) {
    if (guard.chase && Math.hypot(guard.x - state.thief.x, guard.y - state.thief.y) < 24) {
      state.status = 'caught';
      if (audio) audio.caught();
      return EVENT_CAUGHT;
    }
  }

  // Loot: the diamond on its pedestal, then the gold bars on theirs. The
  // pickup radius clears the pedestal's edge with room to spare.
  const thief = state.thief;
  if (!thief.hasDiamond && Math.hypot(thief.x - state.room.diamond.x, thief.y - state.room.diamond.y) < 42) {
    thief.hasDiamond = true;
    state.score += SCORE.diamond;
    events |= EVENT_DIAMOND;
    if (audio) audio.diamond();
  }
  for (const bar of state.room.goldBars) {
    if (!bar.taken && Math.hypot(thief.x - bar.x, thief.y - bar.y) < 40) {
      bar.taken = true;
      thief.goldTaken += 1;
      state.score += SCORE.goldBar;
      events |= EVENT_PICKUP;
      if (audio) audio.pickup();
    }
  }

  // The getaway: reach the exit door carrying the diamond.
  if (thief.hasDiamond && Math.hypot(thief.x - state.room.exit.x, thief.y - state.room.exit.y) < 42) {
    state.status = 'won';
    const timeBonus = Math.max(0, SCORE.timeBonusWindow - state.time) * SCORE.timeBonusPerSecond;
    const stealthBonus = Math.max(0, 100 - state.alarm.peak) * SCORE.stealthBonusPerPoint;
    state.score += Math.round(timeBonus + stealthBonus);
    if (audio) audio.win();
    return events | EVENT_WON;
  }
  return events;
}
