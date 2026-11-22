// A camera is bolted to the top wall and sweeps its vision cone back and
// forth across the hall. Smoke blinds it: while disabled is above zero it
// sees nothing and its cone goes dark.

import { CAMERA } from '../core/config.js';

export function createCamera(x, y, minAngle, maxAngle) {
  return {
    x,
    y,
    minAngle,
    maxAngle,
    angle: (minAngle + maxAngle) / 2,
    sweep: 1,
    disabled: 0,
    radius: 10,
  };
}

export function updateCamera(camera, step) {
  if (camera.disabled > 0) {
    camera.disabled -= step;
    return;
  }
  camera.angle += camera.sweep * CAMERA.sweepSpeed * step;
  if (camera.angle >= camera.maxAngle) {
    camera.angle = camera.maxAngle;
    camera.sweep = -1;
  } else if (camera.angle <= camera.minAngle) {
    camera.angle = camera.minAngle;
    camera.sweep = 1;
  }
}
