// Staged scenes for the screenshots. Each shot builds a moment of a real
// night from the seeded world, then freezes it: the same shot and seed always
// show the same frame, so the screenshots are reproducible.

import { stepWorld } from './world/state.js';

// Run the world forward with no input so the patrols settle into natural
// positions before a shot stages its moment.
function settle(world, seconds) {
  const steps = Math.round(seconds * 60);
  for (let i = 0; i < steps; i++) {
    stepWorld(world, { x: 0, y: 0 }, false, 1 / 60, null, false, null);
  }
}

export function applyShot(world, shot) {
  if (shot === 'start') {
    // The title frame: the night as it begins, thief at the entry door, the
    // hall, its guards and the diamond all in view.
    return;
  }
  if (shot === 'play') {
    // Four seconds in, the thief sneaking behind the long left display case
    // while a guard's cone sweeps past. Alarm still at zero.
    settle(world, 4);
    world.thief.x = 320;
    world.thief.y = 425;
    world.thief.facing = -Math.PI / 2;
    world.thief.sneaking = true;
    return;
  }
  if (shot === 'alert') {
    // Nine seconds in, the thief caught in the open inside a guard's cone:
    // alarm at 55%, the SPOTTED banner up, the guards about to give chase.
    settle(world, 9);
    const guard = world.guards[0];
    guard.x = 500;
    guard.y = 210;
    guard.facing = 0;
    guard.pause = 2;
    world.thief.x = 620;
    world.thief.y = 210;
    world.thief.facing = Math.PI;
    world.alarm.value = 55;
    world.alarm.peak = 55;
    world.seen = true;
    world.seenByCamera = false;
    return;
  }
  if (shot === 'end') {
    // The getaway: diamond taken, both gold bars in the bag, out the far
    // door in 19 seconds with a peak alarm of 21% — a clean night.
    settle(world, 19);
    world.thief.hasDiamond = true;
    world.thief.goldTaken = 2;
    for (const bar of world.room.goldBars) bar.taken = true;
    world.thief.x = world.room.exit.x;
    world.thief.y = world.room.exit.y;
    world.thief.facing = Math.PI / 2;
    world.time = 19;
    world.alarm.value = 12;
    world.alarm.peak = 21;
    world.score = 1000 + 500 + Math.round((120 - 19) * 5) + Math.round((100 - 21) * 10);
    world.status = 'won';
    return;
  }
}
