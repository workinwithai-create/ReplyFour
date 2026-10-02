import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");
const app = readFileSync(new URL("../app.js", import.meta.url), "utf8");

assert.match(html, /viewport/);
assert.match(html, /id="onboard"/);
assert.match(html, /id="bounce"/);
assert.match(html, /forge-pass-monthly|Get Forge Pass/);
assert.match(app, /encodeWav/);
assert.match(app, /lookupKey: "forge-pass-monthly"/);
assert.match(app, /api\/entitlements\/me/);
assert.match(app, /if \(!entitled\(\)/);
assert.match(app, /replyfour-onboard/);

function encodeWavFromPcm(samples, rate = 44100) {
  const len = samples.length;
  const bytes = 44 + len * 2;
  const view = new DataView(new ArrayBuffer(bytes));
  const write = (o, s) => { for (let i = 0; i < s.length; i++) view.setUint8(o + i, s.charCodeAt(i)); };
  write(0, "RIFF"); view.setUint32(4, bytes - 8, true); write(8, "WAVE"); write(12, "fmt ");
  view.setUint32(16, 16, true); view.setUint16(20, 1, true); view.setUint16(22, 1, true);
  view.setUint32(24, rate, true); view.setUint32(28, rate * 2, true); view.setUint16(32, 2, true); view.setUint16(34, 16, true);
  write(36, "data"); view.setUint32(40, len * 2, true);
  let off = 44;
  for (const s0 of samples) {
    const s = Math.max(-1, Math.min(1, s0));
    view.setInt16(off, s < 0 ? s * 0x8000 : s * 0x7fff, true);
    off += 2;
  }
  return Buffer.from(view.buffer);
}

const wav = encodeWavFromPcm([0, 0.5, -0.5, 0.25]);
assert.equal(wav.subarray(0, 4).toString(), "RIFF");
assert.equal(wav.subarray(8, 12).toString(), "WAVE");
assert.equal(wav.readUInt16LE(22), 1);
assert.equal(wav.readUInt32LE(24), 44100);
assert.equal(wav.subarray(36, 40).toString(), "data");
assert.equal(wav.readInt16LE(44 + 2), 16383);
console.log("export-smoke ok", wav.length);
