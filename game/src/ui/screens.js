// The screens over the game: a short title, the caught moment and the
// getaway. All three keep the room visible behind them, and the title stays
// to four short lines so the game itself is what the cover shows.

import { VIEW_H, VIEW_W } from '../core/config.js';

function dim(ctx, alpha) {
  ctx.fillStyle = `rgba(5, 8, 16, ${alpha})`;
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
}

function panel(ctx, x, y, w, h) {
  ctx.fillStyle = 'rgba(8, 12, 24, 0.92)';
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = '#c9a227';
  ctx.lineWidth = 2;
  ctx.strokeRect(x, y, w, h);
}

// The title screen: the game's name, what to steal, the two tools, and the
// keys. Four lines, then the room shows through around the panel.
export function drawTitle(ctx) {
  dim(ctx, 0.42);
  const w = 560;
  const h = 236;
  const x = (VIEW_W - w) / 2;
  const y = 120;
  panel(ctx, x, y, w, h);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#f2c94c';
  ctx.font = 'bold 52px system-ui, sans-serif';
  ctx.fillText('VELVET VAULT', VIEW_W / 2, y + 48);
  ctx.fillStyle = '#ffffff';
  ctx.font = '20px system-ui, sans-serif';
  ctx.fillText('Steal the Velvet Diamond. Slip out the far door.', VIEW_W / 2, y + 104);
  ctx.fillStyle = '#c9c9c9';
  ctx.font = '17px system-ui, sans-serif';
  ctx.fillText('WASD move · Shift sneak · Q coin · Space smoke', VIEW_W / 2, y + 146);
  ctx.fillText('Guards chase past 55% alarm. At 100% the night ends.', VIEW_W / 2, y + 178);
  ctx.fillStyle = '#f2c94c';
  ctx.font = 'bold 17px system-ui, sans-serif';
  ctx.fillText('Press any key to begin', VIEW_W / 2, y + 214);
}

// The caught moment: fair, because the alarm and the cones were always
// visible, and the score so far is kept on screen.
export function drawCaught(ctx, state) {
  dim(ctx, 0.55);
  const w = 520;
  const h = 190;
  const x = (VIEW_W - w) / 2;
  const y = (VIEW_H - h) / 2;
  panel(ctx, x, y, w, h);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#ff4d4d';
  ctx.font = 'bold 46px system-ui, sans-serif';
  ctx.fillText('CAUGHT', VIEW_W / 2, y + 52);
  ctx.fillStyle = '#ffffff';
  ctx.font = '20px system-ui, sans-serif';
  ctx.fillText(`The alarm hit 100%. Score ${state.score}.`, VIEW_W / 2, y + 108);
  ctx.fillStyle = '#c9c9c9';
  ctx.font = '17px system-ui, sans-serif';
  ctx.fillText('Press R to try the night again', VIEW_W / 2, y + 150);
}

// The getaway: the diamond, the gold and the bonuses, each on its own line.
export function drawWon(ctx, state) {
  dim(ctx, 0.45);
  const w = 560;
  const h = 260;
  const x = (VIEW_W - w) / 2;
  const y = (VIEW_H - h) / 2;
  panel(ctx, x, y, w, h);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#2dd4a8';
  ctx.font = 'bold 44px system-ui, sans-serif';
  ctx.fillText('CLEAN GETAWAY', VIEW_W / 2, y + 48);
  ctx.fillStyle = '#ffffff';
  ctx.font = '20px system-ui, sans-serif';
  const timeBonus = Math.max(0, 120 - state.time) * 5;
  const stealthBonus = Math.max(0, 100 - state.alarm.peak) * 10;
  ctx.fillText(`Diamond 1000  ·  Gold ${state.thief.goldTaken * 250}`, VIEW_W / 2, y + 104);
  ctx.fillText(`Time bonus ${Math.round(timeBonus)}  ·  Stealth bonus ${Math.round(stealthBonus)}`, VIEW_W / 2, y + 138);
  ctx.fillStyle = '#f2c94c';
  ctx.font = 'bold 26px system-ui, sans-serif';
  ctx.fillText(`SCORE ${state.score}`, VIEW_W / 2, y + 182);
  ctx.fillStyle = '#c9c9c9';
  ctx.font = '17px system-ui, sans-serif';
  ctx.fillText(`Finished in ${Math.floor(state.time)}s · peak alarm ${Math.round(state.alarm.peak)}%`, VIEW_W / 2, y + 218);
  ctx.fillText('Press R to run it again', VIEW_W / 2, y + 242);
}
