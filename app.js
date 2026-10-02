const CDN = "https://cdn.jsdelivr.net/gh/workinwithai-create/PreEight@main/public/samples";
const HUB = "https://workinwithai.com";
const STEPS = 16;
const CALL = 4;
const REPLY = 4;
const recipes = [
  { id:"brass-answer", name:"Brass answer", blurb:"Trumpet answers a fifth up. Nylon sits." },
  { id:"violin-echo", name:"Violin echo", blurb:"Violin holds the third under the call." },
  { id:"piano-fill", name:"Piano fill", blurb:"Grand fills the holes. No new chorus." },
  { id:"bass-walk", name:"Bass walk", blurb:"Upright walks 1–2–3–5 while the call rests." },
  { id:"kit-chatter", name:"Kit chatter", blurb:"Ghost snare and hats. The phrase is the drums." },
  { id:"nylon-counter", name:"Nylon counter", blurb:"Nylon answers a different figure, not a copy." },
  { id:"stop-answer", name:"Stop and answer", blurb:"Bar 4 is air. Brass lands on bar 6." },
  { id:"octave-drop", name:"Octave drop", blurb:"Bass drops. Piano answers low." }
];
function bar(symbol, piano, guitar, bass, lead){ return { symbol, piano, guitar, bass, lead }; }
const grooves = [
  { id:"night", name:"Night Call", bpm:96, key:"A minor",
    call:[bar("Am",[45,48,52,57],[45,52,57],33,69),bar("F",[41,45,48,53],[41,48,53],41,65),bar("C",[48,52,55,60],[48,52,55],36,67),bar("G",[43,47,50,55],[43,47,50],31,67)],
    reply:[bar("Am",[45,48,52,57],[45,52,57],33,76),bar("F",[41,45,48,53],[41,48,53],41,72),bar("E",[40,44,47,52],[40,47,52],28,71),bar("Am",[45,48,52,57],[45,52,57],33,69)] },
  { id:"porch", name:"Porch Answer", bpm:88, key:"E major",
    call:[bar("E",[40,44,47,52],[40,47,52],28,64),bar("B",[35,39,42,47],[35,42,47],23,66),bar("C#m",[44,47,51,56],[44,51,56],32,68),bar("A",[33,37,40,45],[33,40,45],33,64)],
    reply:[bar("E",[40,44,47,52],[40,47,52],28,71),bar("A",[33,37,40,45],[33,40,45],33,69),bar("B",[35,39,42,47],[35,42,47],23,71),bar("E",[40,44,47,52],[40,47,52],28,64)] },
  { id:"radio", name:"Radio Reply", bpm:108, key:"D minor",
    call:[bar("Dm",[38,41,45,50],[38,45,50],26,62),bar("Bb",[34,38,41,46],[34,41,46],34,65),bar("F",[41,45,48,53],[41,48,53],29,65),bar("C",[36,40,43,48],[36,43,48],24,67)],
    reply:[bar("Dm",[38,41,45,50],[38,45,50],26,74),bar("Gm",[43,46,50,55],[43,50,55],31,70),bar("A",[33,37,40,45],[33,40,45],33,69),bar("Dm",[38,41,45,50],[38,45,50],26,62)] }
];
const state = { groove: grooves[0], recipe: recipes[0], playing:false, bar:0, mode:null, license: { signedIn:false, hasBundle:false, reason:"unchecked" } };
let ctx, bus, buffers = {};
const FILES = [
  ["kick","drums/kick.mp3",36],["snare","drums/snare.mp3",38],["hat","drums/hihat.mp3",42],["crash","drums/crash.mp3",49],
  ["pC3","piano/C3.mp3",48],["pC4","piano/C4.mp3",60],["pA3","piano/A3.mp3",57],
  ["bE1","bass/E1.mp3",28],["bA1","bass/A1.mp3",33],["bC2","bass/C2.mp3",36],
  ["gE2","guitar/E2.mp3",40],["gA2","guitar/A2.mp3",45],["gE3","guitar/E3.mp3",52],
  ["tC4","trumpet/C4.mp3",60],["vA3","violin/A3.mp3",57]
];

function entitled() { return state.license.signedIn && state.license.hasBundle; }

async function refreshLicense() {
  const el = document.getElementById("license");
  try {
    const res = await fetch(`${HUB}/api/entitlements/me`, { credentials: "include" });
    const data = await res.json();
    state.license = {
      signedIn: !!data.signedIn,
      hasBundle: !!data.hasBundle,
      reason: data.reason || (data.signedIn ? "no-pass" : "login"),
      loginUrl: data.loginUrl || `${HUB}/login`
    };
  } catch (e) {
    state.license = { signedIn:false, hasBundle:false, reason:"hub-unreachable", loginUrl:`${HUB}/login` };
  }
  if (!el) return;
  if (entitled()) el.textContent = "Forge Pass active · reply bounce unlocked";
  else if (state.license.signedIn) el.textContent = "Signed in · Forge Pass required to bounce the reply";
  else el.textContent = "Preview is free · Forge Pass unlocks the WAV bounce";
}

async function startCheckout() {
  const returnTo = location.origin + "/";
  try {
    const res = await fetch(`${HUB}/api/checkout`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lookupKey: "forge-pass-monthly", returnTo })
    });
    const data = await res.json().catch(() => ({}));
    if (data.url) { location.href = data.url; return; }
  } catch (e) { /* fall through to hub login */ }
  const next = encodeURIComponent(returnTo);
  location.href = `${HUB}/login?next=${next}`;
}

async function ensureCtx() {
  if (!ctx) {
    ctx = new AudioContext();
    bus = ctx.createGain(); bus.gain.value = 0.34; bus.connect(ctx.destination);
  }
  if (ctx.state === "suspended") await ctx.resume();
}
async function load() {
  await ensureCtx();
  let n = 0;
  for (const [k, path] of FILES) {
    try {
      const r = await fetch(`${CDN}/${path}`);
      buffers[k] = await ctx.decodeAudioData(await r.arrayBuffer());
    } catch (e) { console.warn(k, e); }
    n++;
    document.getElementById("status").textContent = `Seating chairs ${n}/${FILES.length}`;
  }
  document.getElementById("status").textContent = "Chairs seated · live FluidR3 + kit";
}
function playBuf(name, when, rate, gain, target) {
  const b = buffers[name]; if (!b || !ctx) return;
  const src = ctx.createBufferSource(); src.buffer = b; src.playbackRate.value = rate;
  const g = ctx.createGain(); g.gain.value = gain;
  src.connect(g); g.connect(target || bus); src.start(when);
}
function rateFromMidi(midi, base) { return Math.pow(2, (midi - base) / 12); }
function chordAt(i) { return i < CALL ? state.groove.call[i] : state.groove.reply[i - CALL]; }
function scheduleBar(barIndex, t0, stepDur, target) {
  const ch = chordAt(barIndex);
  const onReply = barIndex >= CALL;
  const rec = state.recipe.id;
  const air = onReply && rec === "stop-answer" && barIndex === CALL;
  for (let s = 0; s < STEPS; s++) {
    const when = t0 + s * stepDur;
    if (air) continue;
    const hatGain = onReply && rec === "kit-chatter" ? 0.12 : 0.06;
    if (s % 2 === 0) playBuf("hat", when, 1, hatGain, target);
    if (s === 0 || (onReply && rec === "kit-chatter" && s === 12)) playBuf("kick", when, 1, 0.62, target);
    if (s === 8 || (onReply && rec === "kit-chatter" && (s === 4 || s === 12))) playBuf("snare", when, 1, s === 8 ? 0.42 : 0.16, target);
    if (s === 0) {
      const bassMidi = rec === "octave-drop" && onReply ? ch.bass - 12 : ch.bass;
      playBuf("bA1", when, rateFromMidi(bassMidi, 33), onReply && rec === "bass-walk" ? 0.62 : 0.42, target);
      if (!(onReply && (rec === "brass-answer" || rec === "violin-echo"))) {
        playBuf("pC4", when, rateFromMidi(ch.piano[2] || 60, 60), rec === "octave-drop" && onReply ? 0.16 : 0.24, target);
        playBuf("pA3", when, rateFromMidi(ch.piano[1] || 57, 57), 0.18, target);
      }
    }
    if (!onReply && (s === 0 || s === 6 || s === 10)) playBuf("gA2", when, rateFromMidi(ch.lead || 64, 45), 0.22, target);
    if (onReply && rec === "nylon-counter" && (s === 2 || s === 8 || s === 14)) playBuf("gE3", when, rateFromMidi((ch.lead || 64) + 7, 52), 0.28, target);
    if (onReply && rec === "brass-answer" && (s === 2 || s === 6 || s === 12)) playBuf("tC4", when, rateFromMidi(ch.lead || 72, 60), 0.32, target);
    if (onReply && rec === "stop-answer" && barIndex === CALL + 2 && (s === 0 || s === 8)) playBuf("tC4", when, rateFromMidi(ch.lead || 71, 60), 0.36, target);
    if (onReply && rec === "violin-echo" && s === 0) playBuf("vA3", when, rateFromMidi((ch.piano[1] || 57) + 12, 57), 0.28, target);
    if (onReply && rec === "piano-fill" && s % 4 === 2) playBuf("pC4", when, rateFromMidi(ch.piano[s % 3] || 60, 60), 0.2, target);
    if (onReply && rec === "bass-walk" && s === 8) playBuf("bC2", when, rateFromMidi(ch.bass + 2, 36), 0.4, target);
    if (onReply && rec === "octave-drop" && s === 4) playBuf("pC3", when, rateFromMidi(ch.piano[0] || 48, 48), 0.3, target);
  }
}
let timer = null;
function stop() { state.playing = false; state.mode = null; if (timer) clearTimeout(timer); timer = null; paintBars(); }
async function play(mode) {
  if (!Object.keys(buffers).length) await load();
  await ensureCtx();
  stop();
  state.playing = true; state.mode = mode;
  const startBar = mode === "eight" ? CALL : 0;
  const endBar = mode === "loop" ? CALL : CALL + REPLY;
  const stepDur = 60 / state.groove.bpm / 4;
  let barIndex = startBar;
  const tick = () => {
    if (!state.playing) return;
    if (barIndex >= endBar) { if (mode === "loop") barIndex = startBar; else { stop(); return; } }
    state.bar = barIndex; paintBars();
    scheduleBar(barIndex, ctx.currentTime + 0.04, stepDur);
    barIndex += 1;
    timer = setTimeout(tick, STEPS * stepDur * 1000);
  };
  tick();
}
function encodeWav(audioBuffer) {
  const chans = audioBuffer.numberOfChannels;
  const rate = audioBuffer.sampleRate;
  const len = audioBuffer.length;
  const bytes = 44 + len * chans * 2;
  const view = new DataView(new ArrayBuffer(bytes));
  const write = (o, s) => { for (let i = 0; i < s.length; i++) view.setUint8(o + i, s.charCodeAt(i)); };
  write(0, "RIFF"); view.setUint32(4, bytes - 8, true); write(8, "WAVE"); write(12, "fmt ");
  view.setUint32(16, 16, true); view.setUint16(20, 1, true); view.setUint16(22, chans, true);
  view.setUint32(24, rate, true); view.setUint32(28, rate * chans * 2, true); view.setUint16(32, chans * 2, true); view.setUint16(34, 16, true);
  write(36, "data"); view.setUint32(40, len * chans * 2, true);
  let off = 44;
  const data = [];
  for (let c = 0; c < chans; c++) data.push(audioBuffer.getChannelData(c));
  for (let i = 0; i < len; i++) {
    for (let c = 0; c < chans; c++) {
      const s = Math.max(-1, Math.min(1, data[c][i]));
      view.setInt16(off, s < 0 ? s * 0x8000 : s * 0x7fff, true); off += 2;
    }
  }
  return new Blob([view], { type: "audio/wav" });
}
async function bounce() {
  if (!entitled()) {
    document.getElementById("status").textContent = "Bounce locked · Forge Pass delivers the license";
    document.getElementById("onboard").showModal();
    return;
  }
  if (!Object.keys(buffers).length) await load();
  const stepDur = 60 / state.groove.bpm / 4;
  const dur = REPLY * STEPS * stepDur + 0.8;
  const offline = new OfflineAudioContext(2, Math.ceil(dur * 44100), 44100);
  const old = ctx; const oldBus = bus;
  ctx = offline; bus = offline.createGain(); bus.gain.value = 0.4; bus.connect(offline.destination);
  for (let i = 0; i < REPLY; i++) scheduleBar(CALL + i, 0.05 + i * STEPS * stepDur, stepDur);
  const rendered = await offline.startRendering();
  ctx = old; bus = oldBus;
  const blob = encodeWav(rendered);
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `ReplyFour-${state.groove.id}-${state.recipe.id}.wav`;
  a.click();
  document.getElementById("status").textContent = "Reply bounced · bars 5–8";
}
function punch() {
  const g = state.groove, r = state.recipe;
  return `ReplyFour punch list\n${g.name} · ${g.bpm} BPM · ${g.key} · ${r.name}\n\nThe problem: the hook is a monologue. Generators reprint the line.\nThe move: ${r.blurb}\n\nCall (bars 1-4)\n${g.call.map((b,i)=>`  ${i+1}. ${b.symbol}`).join("\n")}\n\nReply (bars 5-8) — ${r.name}\n${g.reply.map((b,i)=>`  ${i+5}. ${b.symbol}`).join("\n")}\n\nDo not stack a third on the same line (that is ThirdFour).\nDo not write a post-chorus vamp (that is AfterHook).\nDo not tag the ending (that is TagFour).\nDrop the WAV on bars 5-8. The vocal comes back after the answer.`;
}
function paintGrooves() {
  const el = document.getElementById("grooves"); el.innerHTML = "";
  grooves.forEach(g => {
    const b = document.createElement("button");
    b.className = "card" + (state.groove.id === g.id ? " on" : "");
    b.innerHTML = `<b>${g.name}</b><span>${g.bpm} BPM · ${g.key}</span>`;
    b.onclick = () => { state.groove = g; render(); };
    el.appendChild(b);
  });
}
function paintRecipes() {
  const el = document.getElementById("recipes"); el.innerHTML = "";
  recipes.forEach(r => {
    const b = document.createElement("button");
    b.className = "card" + (state.recipe.id === r.id ? " on" : "");
    b.innerHTML = `<b>${r.name}</b><span>${r.blurb}</span>`;
    b.onclick = () => { state.recipe = r; render(); };
    el.appendChild(b);
  });
}
function paintBars() {
  const el = document.getElementById("bars"); el.innerHTML = "";
  for (let i = 0; i < 8; i++) {
    const ch = chordAt(i);
    const d = document.createElement("div");
    d.className = "bar" + (i >= 4 ? " reply" : "") + (state.playing && state.bar === i ? " active" : "");
    d.innerHTML = `<div class="n">${i + 1} · ${i >= 4 ? "R" : "C"}</div><div class="c">${ch.symbol}</div>`;
    el.appendChild(d);
  }
}
function render() { paintGrooves(); paintRecipes(); paintBars(); document.getElementById("punch").textContent = punch(); }

function inAppBrowser() {
  const ua = navigator.userAgent || "";
  return /Instagram|FBAN|FBAV|Line\/|Twitter|Grok/i.test(ua);
}
function showOnboard(force) {
  const dlg = document.getElementById("onboard");
  const seen = localStorage.getItem("replyfour-onboard") === "1";
  if (inAppBrowser()) document.getElementById("inapp").hidden = false;
  if (force || !seen) dlg.showModal();
}

document.getElementById("playA").onclick = () => play("loop");
document.getElementById("playB").onclick = () => play("cut");
document.getElementById("play8").onclick = () => play("eight");
document.getElementById("stop").onclick = stop;
document.getElementById("bounce").onclick = () => bounce();
document.getElementById("copy").onclick = () => navigator.clipboard.writeText(punch());
document.getElementById("buy").onclick = () => startCheckout();
document.getElementById("sign").onclick = () => { location.href = state.license.loginUrl || `${HUB}/login?next=${encodeURIComponent(location.href)}`; };
document.getElementById("gotit").onclick = () => {
  localStorage.setItem("replyfour-onboard", "1");
  document.getElementById("onboard").close();
};
document.getElementById("help").onclick = () => showOnboard(true);
render();
load();
refreshLicense();
showOnboard(false);
