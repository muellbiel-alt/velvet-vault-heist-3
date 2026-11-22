// The renderer: every pixel of the vault hall on a 1280 by 720 canvas.
// The palette is velvet red and gold on deep blue shadow, with danger in
// red and loot in gold and cyan, so safe cover, danger and loot read at a
// glance even shrunk to a contact sheet.

import { CAMERA, GUARD, VIEW_H, VIEW_W } from '../core/config.js';
import { coneRays } from '../systems/vision.js';

const GOLD = '#c9a227';
const GOLD_BRIGHT = '#f2c94c';
const VELVET = '#6e1423';
const VELVET_DARK = '#4a0d18';
const FLOOR = '#131a30';
const FLOOR_ALT = '#0f1526';
const WALL = '#0a0e1c';
const WOOD = '#3a2a1a';
const WOOD_EDGE = '#5a4028';
const STONE = '#2a2f42';
const THIEF_COLOR = '#2dd4a8';
const GUARD_COLOR = '#e05252';
const CAMERA_COLOR = '#f5a623';
const DIAMOND_COLOR = '#7ee7ff';
const SMOKE_COLOR = 'rgba(200, 205, 215, 0.55)';

function alarmColor(value) {
  if (value >= 70) return '#ff4d4d';
  if (value >= 40) return '#ffb020';
  return '#2dd4a8';
}

function drawFloor(ctx, room) {
  ctx.fillStyle = FLOOR;
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  // A quiet checker so the floor reads as stone, not flat colour.
  ctx.fillStyle = FLOOR_ALT;
  const tile = 80;
  for (let y = 0; y < VIEW_H; y += tile) {
    for (let x = 0; x < VIEW_W; x += tile) {
      if (((x + y) / tile) % 2 === 0) ctx.fillRect(x, y, tile, tile);
    }
  }
  // The red carpet runner down the middle of the hall.
  ctx.fillStyle = VELVET;
  ctx.fillRect(540, 28, 200, VIEW_H - 56);
  ctx.fillStyle = VELVET_DARK;
  ctx.fillRect(540, 28, 200, 10);
  ctx.fillRect(540, VIEW_H - 38, 200, 10);
  ctx.strokeStyle = GOLD;
  ctx.lineWidth = 2;
  ctx.strokeRect(540, 28, 200, VIEW_H - 56);
  // Velvet ropes along the carpet's edges.
  ctx.strokeStyle = '#8e1f2f';
  ctx.lineWidth = 3;
  for (const rope of room.ropes) {
    ctx.beginPath();
    ctx.moveTo(rope.x1, rope.y1);
    ctx.lineTo(rope.x2, rope.y2);
    ctx.stroke();
    ctx.fillStyle = GOLD;
    ctx.beginPath();
    ctx.arc(rope.x1, rope.y1, 5, 0, Math.PI * 2);
    ctx.arc(rope.x2, rope.y2, 5, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawWalls(ctx, room) {
  ctx.fillStyle = WALL;
  ctx.fillRect(0, 0, VIEW_W, 28);
  ctx.fillRect(0, VIEW_H - 28, VIEW_W, 28);
  ctx.fillRect(0, 0, 28, VIEW_H);
  ctx.fillRect(VIEW_W - 28, 0, 28, VIEW_H);
  ctx.strokeStyle = GOLD;
  ctx.lineWidth = 2;
  ctx.strokeRect(28, 28, VIEW_W - 56, VIEW_H - 56);
  // The two doors: entry in green, getaway in gold.
  const door = (x, label, color) => {
    ctx.fillStyle = '#10182e';
    ctx.fillRect(x - 42, VIEW_H - 28, 84, 28);
    ctx.fillStyle = color;
    ctx.font = 'bold 15px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, x, VIEW_H - 13);
  };
  door(room.entry.x, 'IN', THIEF_COLOR);
  door(room.exit.x, 'OUT', GOLD_BRIGHT);
}

function drawFurniture(ctx, room) {
  for (const rect of room.tall) {
    if (rect.kind === 'case') {
      ctx.fillStyle = WOOD;
      ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
      ctx.fillStyle = 'rgba(180, 210, 235, 0.28)';
      ctx.fillRect(rect.x + 6, rect.y + 6, rect.w - 12, rect.h - 12);
      ctx.strokeStyle = WOOD_EDGE;
      ctx.lineWidth = 3;
      ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);
    } else if (rect.kind === 'pillar') {
      ctx.fillStyle = STONE;
      ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
      ctx.fillStyle = GOLD;
      ctx.fillRect(rect.x, rect.y, rect.w, 6);
      ctx.fillRect(rect.x, rect.y + rect.h - 6, rect.w, 6);
    } else {
      // The golden statue.
      ctx.fillStyle = GOLD;
      ctx.beginPath();
      ctx.arc(rect.x + rect.w / 2, rect.y + rect.h / 2, 20, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = GOLD_BRIGHT;
      ctx.beginPath();
      ctx.arc(rect.x + rect.w / 2 - 5, rect.y + rect.h / 2 - 5, 7, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  for (const rect of room.low) {
    ctx.fillStyle = '#1c2438';
    ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
    ctx.strokeStyle = GOLD;
    ctx.lineWidth = 2;
    ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);
  }
}

function drawLoot(ctx, room, thief, time) {
  if (!thief.hasDiamond) {
    const d = room.diamond;
    // The pulse runs on world time, not the wall clock, so a staged scene
    // renders the same sparkle every run.
    const pulse = 1 + Math.sin(time * 2.2) * 0.12;
    ctx.save();
    ctx.translate(d.x, d.y);
    ctx.scale(pulse, pulse);
    ctx.fillStyle = DIAMOND_COLOR;
    ctx.beginPath();
    ctx.moveTo(0, -16);
    ctx.lineTo(12, 0);
    ctx.lineTo(0, 16);
    ctx.lineTo(-12, 0);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(0, -16);
    ctx.lineTo(6, 0);
    ctx.lineTo(0, 16);
    ctx.lineTo(-6, 0);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
  for (const bar of room.goldBars) {
    if (bar.taken) continue;
    ctx.fillStyle = GOLD_BRIGHT;
    ctx.fillRect(bar.x - 11, bar.y - 6, 22, 12);
    ctx.fillStyle = GOLD;
    ctx.fillRect(bar.x - 11, bar.y + 2, 22, 4);
  }
}

function drawCone(ctx, room, watcher, range, halfAngle, color) {
  const rays = coneRays(room, watcher, range, halfAngle);
  const base = watcher.angle ?? watcher.facing;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(watcher.x, watcher.y);
  ctx.lineTo(rays[0].x, rays[0].y);
  const mid = base;
  const midEnd = range;
  let mx = watcher.x + Math.cos(mid) * midEnd;
  let my = watcher.y + Math.sin(mid) * midEnd;
  // Cut the middle ray short at the first tall piece it meets.
  for (let d = 12; d <= range; d += 12) {
    const x = watcher.x + Math.cos(mid) * d;
    const y = watcher.y + Math.sin(mid) * d;
    let blocked = false;
    for (const rect of room.tall) {
      if (x >= rect.x && x <= rect.x + rect.w && y >= rect.y && y <= rect.y + rect.h) {
        blocked = true;
        break;
      }
    }
    if (blocked) {
      mx = watcher.x + Math.cos(mid) * (d - 12);
      my = watcher.y + Math.sin(mid) * (d - 12);
      break;
    }
  }
  ctx.lineTo(mx, my);
  ctx.lineTo(rays[1].x, rays[1].y);
  ctx.closePath();
  ctx.fill();
}

function drawWatchers(ctx, room, state) {
  for (const camera of state.cameras) {
    if (camera.disabled <= 0) {
      drawCone(ctx, room, camera, CAMERA.visionRange, CAMERA.halfAngle, 'rgba(245, 166, 35, 0.26)');
    }
  }
  for (const guard of state.guards) {
    drawCone(ctx, room, guard, GUARD.visionRange, GUARD.halfAngle, 'rgba(224, 82, 82, 0.28)');
  }
  for (const camera of state.cameras) {
    ctx.fillStyle = camera.disabled > 0 ? '#5a5f6e' : CAMERA_COLOR;
    ctx.fillRect(camera.x - 9, camera.y - 7, 18, 14);
    ctx.fillStyle = '#0a0e1c';
    ctx.beginPath();
    ctx.arc(camera.x, camera.y + 2, 4, 0, Math.PI * 2);
    ctx.fill();
  }
  for (const guard of state.guards) {
    ctx.fillStyle = guard.chase ? '#ff2e2e' : GUARD_COLOR;
    ctx.beginPath();
    ctx.arc(guard.x, guard.y, guard.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(guard.x, guard.y);
    ctx.lineTo(guard.x + Math.cos(guard.facing) * (guard.radius + 6), guard.y + Math.sin(guard.facing) * (guard.radius + 6));
    ctx.stroke();
  }
}

function drawThief(ctx, thief) {
  ctx.fillStyle = thief.sneaking ? '#1f9d7a' : THIEF_COLOR;
  ctx.beginPath();
  ctx.arc(thief.x, thief.y, thief.radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#06281f';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(thief.x, thief.y);
  ctx.lineTo(thief.x + Math.cos(thief.facing) * (thief.radius + 5), thief.y + Math.sin(thief.facing) * (thief.radius + 5));
  ctx.stroke();
  if (thief.hasDiamond) {
    ctx.fillStyle = DIAMOND_COLOR;
    ctx.beginPath();
    ctx.moveTo(thief.x, thief.y - 20);
    ctx.lineTo(thief.x + 5, thief.y - 13);
    ctx.lineTo(thief.x, thief.y - 6);
    ctx.lineTo(thief.x - 5, thief.y - 13);
    ctx.closePath();
    ctx.fill();
  }
}

function drawTools(ctx, state) {
  for (const coin of state.coins) {
    const ring = 6 + (coin.ring % 0.6) * 26;
    ctx.strokeStyle = `rgba(242, 201, 76, ${Math.max(0, 0.9 - coin.ring * 0.35)})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(coin.x, coin.y, ring, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = GOLD_BRIGHT;
    ctx.beginPath();
    ctx.arc(coin.x, coin.y, 5, 0, Math.PI * 2);
    ctx.fill();
  }
  for (const puff of state.smokes) {
    ctx.fillStyle = SMOKE_COLOR;
    ctx.beginPath();
    ctx.arc(puff.x, puff.y, 34, 0, Math.PI * 2);
    ctx.arc(puff.x - 20, puff.y + 8, 22, 0, Math.PI * 2);
    ctx.arc(puff.x + 20, puff.y + 6, 24, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawHud(ctx, state) {
  ctx.fillStyle = 'rgba(6, 10, 20, 0.88)';
  ctx.fillRect(0, 0, VIEW_W, 46);
  ctx.fillStyle = GOLD;
  ctx.fillRect(0, 46, VIEW_W, 2);
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';
  ctx.font = 'bold 15px system-ui, sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.fillText('ALARM', 18, 24);
  const barX = 84;
  const barW = 220;
  ctx.fillStyle = '#1c2438';
  ctx.fillRect(barX, 13, barW, 22);
  ctx.fillStyle = alarmColor(state.alarm.value);
  ctx.fillRect(barX, 13, barW * (state.alarm.value / 100), 22);
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 1;
  ctx.strokeRect(barX, 13, barW, 22);
  ctx.fillStyle = '#ffffff';
  ctx.fillText(`${Math.round(state.alarm.value)}%`, barX + barW + 10, 24);
  const loot = (state.thief.hasDiamond ? 1 : 0) + state.thief.goldTaken;
  const totalSeconds = Math.floor(state.time + 1e-6);
  const items = [
    `LOOT ${loot}/3`,
    `COINS ${state.thief.coins}`,
    `SMOKE ${state.thief.smokes}`,
    `TIME ${Math.floor(totalSeconds / 60)}:${String(totalSeconds % 60).padStart(2, '0')}`,
    `SCORE ${state.score}`,
  ];
  ctx.textAlign = 'right';
  let x = VIEW_W - 18;
  for (const item of items) {
    ctx.fillText(item, x, 24);
    x -= ctx.measureText(item).width + 34;
  }
  if (state.seen) {
    ctx.fillStyle = '#ff4d4d';
    ctx.font = 'bold 19px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('SPOTTED — BREAK LINE OF SIGHT', VIEW_W / 2, 78);
  }
}

export function drawWorld(ctx, state) {
  drawFloor(ctx, state.room);
  drawWatchers(ctx, state.room, state);
  drawFurniture(ctx, state.room);
  // Loot sits on its pedestals, so it is drawn after the furniture that
  // carries it — a diamond under its pedestal would never be seen.
  drawLoot(ctx, state.room, state.thief, state.time);
  drawTools(ctx, state);
  drawThief(ctx, state.thief);
  drawHud(ctx, state);
}
