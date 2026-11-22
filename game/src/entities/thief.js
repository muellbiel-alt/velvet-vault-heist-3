// The thief: a circle that walks, sneaks, throws coins and pops smoke.
// Movement slides along furniture through the room's moveCircle helper, so
// the thief never sticks to a corner.

import { THIEF } from '../core/config.js';
import { moveCircle } from '../world/room.js';

export function createThief(room) {
  return {
    x: room.entry.x,
    y: room.entry.y,
    radius: THIEF.radius,
    facing: -Math.PI / 2,
    sneaking: false,
    moving: false,
    coins: THIEF.coins,
    smokes: THIEF.smokes,
    hasDiamond: false,
    goldTaken: 0,
  };
}

export function updateThief(thief, room, move, sneaking, step) {
  thief.sneaking = sneaking;
  thief.moving = move.x !== 0 || move.y !== 0;
  if (thief.moving) {
    thief.facing = Math.atan2(move.y, move.x);
    const speed = sneaking ? THIEF.sneakSpeed : THIEF.walkSpeed;
    const next = moveCircle(room, thief.x, thief.y, thief.radius, move.x * speed * step, move.y * speed * step);
    thief.x = next.x;
    thief.y = next.y;
  }
}

// Toss a coin toward a point, clamped to the thief's throwing reach. Returns
// the coin (with a ringing timer) or null when no coin is left.
export function throwCoin(thief, target) {
  if (thief.coins <= 0) return null;
  thief.coins -= 1;
  const dx = target.x - thief.x;
  const dy = target.y - thief.y;
  const dist = Math.hypot(dx, dy) || 1;
  const reach = Math.min(dist, THIEF.coinThrowRange);
  return {
    x: thief.x + (dx / dist) * reach,
    y: thief.y + (dy / dist) * reach,
    timer: 6,
    ring: 0,
  };
}

// Spend a smoke bomb. Returns true when one was left to spend.
export function useSmoke(thief) {
  if (thief.smokes <= 0) return false;
  thief.smokes -= 1;
  return true;
}
