// A guard walks a patrol between waypoints, pausing a beat at each end.
// A thrown coin pulls the nearest guard to investigate for a few seconds.
// Once the alarm passes the chase line, the guard runs straight at the thief
// instead of patrolling.

import { GUARD } from '../core/config.js';
import { moveCircle } from '../world/room.js';

export function createGuard(waypoints, phase) {
  return {
    waypoints,
    waypointIndex: 0,
    x: waypoints[0].x,
    y: waypoints[0].y,
    facing: Math.PI / 2,
    pause: phase,
    investigate: null,
    chase: false,
    radius: GUARD.radius,
  };
}

function moveToward(guard, room, tx, ty, speed, step) {
  const dx = tx - guard.x;
  const dy = ty - guard.y;
  const dist = Math.hypot(dx, dy);
  if (dist < 2) return true;
  guard.facing = Math.atan2(dy, dx);
  const next = moveCircle(room, guard.x, guard.y, guard.radius, (dx / dist) * speed * step, (dy / dist) * speed * step);
  guard.x = next.x;
  guard.y = next.y;
  return dist < 6;
}

export function updateGuard(guard, room, step, thief) {
  // A chase overrides everything else while the alarm is high.
  guard.chase = thief !== null;
  if (guard.chase) {
    guard.investigate = null;
    moveToward(guard, room, thief.x, thief.y, GUARD.chaseSpeed, step);
    return;
  }

  // A coin's ring pulls the guard to the spot it heard, then it looks around.
  if (guard.investigate) {
    const arrived = moveToward(guard, room, guard.investigate.x, guard.investigate.y, GUARD.patrolSpeed * 1.4, step);
    guard.investigate.timer -= step;
    if (arrived || guard.investigate.timer <= 0) {
      guard.investigate = null;
      guard.pause = 1.2;
    }
    return;
  }

  if (guard.pause > 0) {
    guard.pause -= step;
    return;
  }
  const target = guard.waypoints[guard.waypointIndex];
  const arrived = moveToward(guard, room, target.x, target.y, GUARD.patrolSpeed, step);
  if (arrived) {
    guard.waypointIndex = (guard.waypointIndex + 1) % guard.waypoints.length;
    guard.pause = 0.8;
  }
}
