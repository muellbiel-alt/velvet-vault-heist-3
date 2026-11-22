// Vision: does a watcher (a guard or a camera) see the thief? Three tests,
// cheapest first: the thief must be inside the watcher's range, inside its
// cone, and on a line of sight the room does not block.

import { sightBlocked } from '../world/room.js';

function angleTo(from, to) {
  return Math.atan2(to.y - from.y, to.x - from.x);
}

function angleDiff(a, b) {
  let d = a - b;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
}

// detector has {x, y, angle} (a guard's facing) or {x, y, angle} (a camera's
// sweep angle); target is the thief. Returns true only when all three tests
// pass.
export function detectorSees(room, detector, range, halfAngle, target) {
  const dist = Math.hypot(target.x - detector.x, target.y - detector.y);
  if (dist > range + target.radius) return false;
  const bearing = angleTo(detector, target);
  if (Math.abs(angleDiff(bearing, detector.angle ?? detector.facing)) > halfAngle) return false;
  if (sightBlocked(room, detector.x, detector.y, target.x, target.y)) return false;
  return true;
}

// The cone's far edge for the renderer: the two rays at +/- halfAngle, each
// cut short where a tall piece of furniture blocks it.
export function coneRays(room, detector, range, halfAngle) {
  const base = detector.angle ?? detector.facing;
  const rays = [];
  for (const offset of [-halfAngle, halfAngle]) {
    const angle = base + offset;
    let end = range;
    const step = 12;
    for (let d = step; d <= range; d += step) {
      const x = detector.x + Math.cos(angle) * d;
      const y = detector.y + Math.sin(angle) * d;
      if (sightBlocked(room, detector.x, detector.y, x, y)) {
        end = d - step;
        break;
      }
    }
    rays.push({ x: detector.x + Math.cos(angle) * end, y: detector.y + Math.sin(angle) * end });
  }
  return rays;
}
