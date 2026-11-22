// The game loop: a fixed 60 Hz step so a night plays the same on any
// machine, a title screen, and the caught and won screens. With ?shot= in
// the URL the game renders one staged scene and stops, which is how the
// screenshots are taken.

import { createInput, attachInput, readMove, consumePresses } from './core/input.js';
import { createWorld, resetWorld, stepWorld, EVENT_CAUGHT, EVENT_WON } from './world/state.js';
import { createAudio, audioApi } from './audio/synth.js';
import { drawWorld } from './ui/render.js';
import { drawTitle, drawCaught, drawWon } from './ui/screens.js';
import { applyShot } from './shots.js';

const STEP = 1 / 60;

function start() {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  const params = new URLSearchParams(window.location.search);
  const shot = params.get('shot');
  const seed = Number(params.get('seed') ?? 1);

  const world = createWorld(seed);
  const input = createInput();
  attachInput(input, canvas);
  const audioState = createAudio();
  const audio = audioApi(audioState);

  if (shot) {
    // A staged scene for a screenshot: deterministic, one frame, no loop.
    applyShot(world, shot);
    drawWorld(ctx, world);
    if (shot === 'start') drawTitle(ctx);
    if (shot === 'end') drawWon(ctx, world);
    if (world.status === 'caught') drawCaught(ctx, world);
    return;
  }

  let screen = 'title';
  let last = performance.now();
  let acc = 0;

  function frame(now) {
    const elapsed = Math.min(0.1, (now - last) / 1000);
    last = now;
    acc += elapsed;
    while (acc >= STEP) {
      acc -= STEP;
      const presses = consumePresses(input);
      if (presses.mute) audio.toggleMute();
      if (screen === 'title') {
        if (presses.coin || presses.smoke || presses.restart || input.keys.size > 0) {
          audio.unlock();
          screen = 'playing';
        }
        continue;
      }
      if (world.status !== 'playing') {
        if (presses.restart) {
          resetWorld(world);
          screen = 'playing';
        }
        continue;
      }
      const move = readMove(input);
      let coinTarget = null;
      if (presses.coin && world.thief.coins > 0) {
        coinTarget = { x: input.mouse.x, y: input.mouse.y };
      }
      const events = stepWorld(world, move, move.sneaking, STEP, coinTarget, presses.smoke, audio);
      if (events & EVENT_CAUGHT) screen = 'caught';
      if (events & EVENT_WON) screen = 'won';
    }
    drawWorld(ctx, world);
    if (screen === 'title') drawTitle(ctx);
    if (screen === 'caught') drawCaught(ctx, world);
    if (screen === 'won') drawWon(ctx, world);
    requestAnimationFrame(frame);
  }

  requestAnimationFrame(frame);
}

start();
