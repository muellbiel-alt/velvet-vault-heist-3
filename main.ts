// Velvet Vault — the hand-in program.
//
// A plain Node 22 script (standard library only) that lives at the root of
// this repository. It gathers the game and its screenshots into the output
// directory and writes the dossier the judge reads, using the kit's vendored
// library. Run it locally with:
//
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
//
// Outside this machine the grader sets the output directory to /output and
// runs this file twice; both runs must write identical bytes.

// Read a JPEG's or PNG's pixel size from its header, without decoding the
// image. JPEGs carry it in the first frame marker (SOF0/SOF2); PNGs carry it
// in the IHDR chunk. Returns {width, height} or null when the file is
// neither.
function imageSize(buffer) {
  if (buffer.length > 24 && buffer[0] === 0x89 && buffer[1] === 0x50) {
    // PNG: 8-byte signature, then the IHDR chunk's width and height.
    return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
  }
  if (buffer.length > 4 && buffer[0] === 0xff && buffer[1] === 0xd8) {
    // JPEG: walk the markers until a frame marker gives the dimensions.
    let offset = 2;
    while (offset + 9 < buffer.length) {
      if (buffer[offset] !== 0xff) break;
      const marker = buffer[offset + 1];
      if (marker === 0xc0 || marker === 0xc2) {
        return { width: buffer.readUInt16BE(offset + 7), height: buffer.readUInt16BE(offset + 5) };
      }
      if (marker === 0xda || marker === 0xd9) break;
      const length = buffer.readUInt16BE(offset + 2);
      offset += 2 + length;
    }
  }
  return null;
}

// The gate refuses a screenshot over 256 KiB, with a long side over 1280 or
// a short side under 480, so check every screenshot before the dossier is
// built and fail loudly here instead of at submission.
function validateScreenshots(dir) {
  const names = readdirSync(dir).filter((name) => !name.startsWith('.')).sort();
  if (names.length < 3 || names.length > 4) {
    throw new Error(`expected 3 or 4 screenshots, found ${names.length}`);
  }
  for (const name of names) {
    const path = join(dir, name);
    const buffer = readFileSync(path);
    if (buffer.length > 262144) {
      throw new Error(`screenshot ${name} is ${buffer.length} bytes, over the 256 KiB cap`);
    }
    const size = imageSize(buffer);
    if (!size) throw new Error(`screenshot ${name} is not a whole JPEG or PNG`);
    const long = Math.max(size.width, size.height);
    const short = Math.min(size.width, size.height);
    if (long > 1280 || short < 480) {
      throw new Error(`screenshot ${name} is ${size.width}x${size.height}, outside 1280 long / 480 short`);
    }
  }
  return names;
}

import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

// The directory this file sits in, so the copy works no matter where the
// process was started from.
const root = fileURLToPath(new URL('.', import.meta.url));

// The grader gives us /output; a local run takes MAKEFUN_OUTPUT_DIR instead.
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(outDir, { recursive: true });

// The whole game, as it is served, and the screenshots the maker took.
cpSync(join(root, 'game'), join(outDir, 'game'), { recursive: true });
mkdirSync(join(outDir, 'screenshots'), { recursive: true });
if (existsSync(join(root, 'screenshots'))) {
  cpSync(join(root, 'screenshots'), join(outDir, 'screenshots'), { recursive: true });
}

// Refuse a bad screenshot here, with its name and size, instead of handing
// the grader an entry its gate would refuse.
validateScreenshots(join(outDir, 'screenshots'));

// The dossier: the game's source and the screenshots, capped so the judge
// can read it. The caps mirror this competition's gate.
const dossier = buildDossier(outDir, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
});
writeFileSync(join(outDir, 'dossier.json'), dossier);
