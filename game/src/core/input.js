// Keyboard state for the game. WASD or the arrow keys move; holding Shift
// sneaks. Q throws a coin at the mouse, Space or F pops smoke, R restarts a
// finished night, and M mutes the synth. The game reads this once per fixed
// step, so a key held across frames moves the thief smoothly.

const MOVE_KEYS = {
  KeyW: [0, -1],
  ArrowUp: [0, -1],
  KeyS: [0, 1],
  ArrowDown: [0, 1],
  KeyA: [-1, 0],
  ArrowLeft: [-1, 0],
  KeyD: [1, 0],
  ArrowRight: [1, 0],
};

export function createInput() {
  return {
    keys: new Set(),
    mouse: { x: 0, y: 0, clicked: false },
    coinPressed: false,
    smokePressed: false,
    restartPressed: false,
    mutePressed: false,
  };
}

export function attachInput(input, element) {
  window.addEventListener('keydown', (event) => {
    if (MOVE_KEYS[event.key]) input.keys.add(event.key);
    if (event.key === 'ShiftLeft' || event.key === 'ShiftRight') input.keys.add('Shift');
    if (event.key === 'q' || event.key === 'Q') input.coinPressed = true;
    if (event.key === ' ' || event.key === 'f' || event.key === 'F') input.smokePressed = true;
    if (event.key === 'r' || event.key === 'R') input.restartPressed = true;
    if (event.key === 'm' || event.key === 'M') input.mutePressed = true;
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(event.key)) {
      event.preventDefault();
    }
  });
  window.addEventListener('keyup', (event) => {
    input.keys.delete(event.key);
    if (event.key === 'ShiftLeft' || event.key === 'ShiftRight') input.keys.delete('Shift');
  });
  element.addEventListener('mousemove', (event) => {
    const rect = element.getBoundingClientRect();
    input.mouse.x = (event.clientX - rect.left) * (element.width / rect.width);
    input.mouse.y = (event.clientY - rect.top) * (element.height / rect.height);
  });
  element.addEventListener('mousedown', (event) => {
    const rect = element.getBoundingClientRect();
    input.mouse.x = (event.clientX - rect.left) * (element.width / rect.width);
    input.mouse.y = (event.clientY - rect.top) * (element.height / rect.height);
    input.mouse.clicked = true;
    input.coinPressed = true;
  });
  window.addEventListener('blur', () => input.keys.clear());
}

// The move direction for this step, normalised, plus whether the thief is
// sneaking. Returns {x, y, sneaking} with x and y in [-1, 1].
export function readMove(input) {
  let x = 0;
  let y = 0;
  for (const key of input.keys) {
    const dir = MOVE_KEYS[key];
    if (dir) {
      x += dir[0];
      y += dir[1];
    }
  }
  const length = Math.hypot(x, y);
  if (length > 0) {
    x /= length;
    y /= length;
  }
  return { x, y, sneaking: input.keys.has('Shift') };
}

// One-shot presses are consumed after the step that reads them, so a single
// keypress throws one coin and pops one smoke.
export function consumePresses(input) {
  const pressed = {
    coin: input.coinPressed || input.mouse.clicked,
    smoke: input.smokePressed,
    restart: input.restartPressed,
    mute: input.mutePressed,
  };
  input.coinPressed = false;
  input.smokePressed = false;
  input.restartPressed = false;
  input.mutePressed = false;
  input.mouse.clicked = false;
  return pressed;
}
