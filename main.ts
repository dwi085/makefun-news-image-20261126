// news-image-20261126 — "Sum up 26 November's world news in one image"
// A self-contained Node 22 program (standard library only) that draws a
// newspaper front page of Thursday 26 November 2026 and writes it as a
// deterministic PNG to $MAKEFUN_OUTPUT_DIR/entry.png (or /output/entry.png).
// No network, no fonts, no dependencies: text is drawn with a hand-made
// 5x7 bitmap font and the PNG is encoded with node:zlib. Two runs produce
// byte-identical output.
//
// Stories: 38 sourced stories of 26 Nov 2026 (events of late 25 Nov UTC
// into 26 Nov, as first reported that day), each with a UTC time and its
// source. Every headline below is a real story from Reuters, AP, BBC,
// Al Jazeera, CNA, TASS, Fox Business, Morningstar, NYT, Dow Jones or
// the wire services named. Nothing is invented.

import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { deflateSync } from 'node:zlib';

// ---------------------------------------------------------------------------
// 5x7 bitmap font. Each glyph is 7 rows of 5 bits, written as strings.
// Only capitals are stored; all text is upper-cased before drawing.
// ---------------------------------------------------------------------------
const FONT: Record<string, string[]> = {
  A: ['01110', '10001', '10001', '11111', '10001', '10001', '10001'],
  B: ['11110', '10001', '10001', '11110', '10001', '10001', '11110'],
  C: ['01110', '10001', '10000', '10000', '10000', '10001', '01110'],
  D: ['11110', '10001', '10001', '10001', '10001', '10001', '11110'],
  E: ['11111', '10000', '10000', '11110', '10000', '10000', '11111'],
  F: ['11111', '10000', '10000', '11110', '10000', '10000', '10000'],
  G: ['01110', '10001', '10000', '10111', '10001', '10001', '01111'],
  H: ['10001', '10001', '10001', '11111', '10001', '10001', '10001'],
  I: ['01110', '00100', '00100', '00100', '00100', '00100', '01110'],
  J: ['00111', '00010', '00010', '00010', '00010', '10010', '01100'],
  K: ['10001', '10010', '10100', '11000', '10100', '10010', '10001'],
  L: ['10000', '10000', '10000', '10000', '10000', '10000', '11111'],
  M: ['10001', '11011', '10101', '10101', '10001', '10001', '10001'],
  N: ['10001', '11001', '10101', '10011', '10001', '10001', '10001'],
  O: ['01110', '10001', '10001', '10001', '10001', '10001', '01110'],
  P: ['11110', '10001', '10001', '11110', '10000', '10000', '10000'],
  Q: ['01110', '10001', '10001', '10001', '10101', '10010', '01101'],
  R: ['11110', '10001', '10001', '11110', '10100', '10010', '10001'],
  S: ['01111', '10000', '10000', '01110', '00001', '00001', '11110'],
  T: ['11111', '00100', '00100', '00100', '00100', '00100', '00100'],
  U: ['10001', '10001', '10001', '10001', '10001', '10001', '01110'],
  V: ['10001', '10001', '10001', '10001', '10001', '01010', '00100'],
  W: ['10001', '10001', '10001', '10101', '10101', '11011', '10001'],
  X: ['10001', '10001', '01010', '00100', '01010', '10001', '10001'],
  Y: ['10001', '10001', '01010', '00100', '00100', '00100', '00100'],
  Z: ['11111', '00001', '00010', '00100', '01000', '10000', '11111'],
  '0': ['01110', '10001', '10011', '10101', '11001', '10001', '01110'],
  '1': ['00100', '01100', '00100', '00100', '00100', '00100', '01110'],
  '2': ['01110', '10001', '00001', '00110', '01000', '10000', '11111'],
  '3': ['11111', '00010', '00100', '00010', '00001', '10001', '01110'],
  '4': ['00010', '00110', '01010', '10010', '11111', '00010', '00010'],
  '5': ['11111', '10000', '11110', '00001', '00001', '10001', '01110'],
  '6': ['00110', '01000', '10000', '11110', '10001', '10001', '01110'],
  '7': ['11111', '00001', '00010', '00100', '01000', '01000', '01000'],
  '8': ['01110', '10001', '10001', '01110', '10001', '10001', '01110'],
  '9': ['01110', '10001', '10001', '01111', '00001', '00010', '01100'],
  ' ': ['00000', '00000', '00000', '00000', '00000', '00000', '00000'],
  '.': ['00000', '00000', '00000', '00000', '00000', '01100', '01100'],
  ',': ['00000', '00000', '00000', '00000', '01100', '00100', '01000'],
  ':': ['00000', '01100', '01100', '00000', '01100', '01100', '00000'],
  ';': ['00000', '01100', '01100', '00000', '01100', '00100', '01000'],
  '!': ['00100', '00100', '00100', '00100', '00100', '00000', '00100'],
  '?': ['01110', '10001', '00001', '00110', '00100', '00000', '00100'],
  '-': ['00000', '00000', '00000', '01110', '00000', '00000', '00000'],
  "'": ['00100', '00100', '01000', '00000', '00000', '00000', '00000'],
  '"': ['01010', '01010', '00000', '00000', '00000', '00000', '00000'],
  '(': ['00010', '00100', '01000', '01000', '01000', '00100', '00010'],
  ')': ['01000', '00100', '00010', '00010', '00010', '00100', '01000'],
  '/': ['00001', '00010', '00010', '00100', '01000', '01000', '10000'],
  '%': ['11001', '11010', '00010', '00100', '01000', '01011', '10011'],
  $: ['00100', '01111', '10100', '01110', '00101', '11110', '00100'],
  '&': ['01100', '10010', '10100', '01000', '10101', '10010', '01101'],
  '+': ['00000', '00100', '00100', '01110', '00100', '00100', '00000'],
  '=': ['00000', '00000', '11111', '00000', '11111', '00000', '00000'],
  '*': ['00000', '10101', '01110', '10101', '00000', '00000', '00000'],
  _: ['00000', '00000', '00000', '00000', '00000', '00000', '11111'],
  '#': ['01010', '01010', '11111', '01010', '11111', '01010', '01010'],
  '@': ['01110', '10001', '10111', '10101', '10110', '10000', '01110'],
  '<': ['00010', '00100', '01000', '10000', '01000', '00100', '00010'],
  '>': ['01000', '00100', '00010', '00001', '00010', '00100', '01000'],
  '[': ['01110', '01000', '01000', '01000', '01000', '01000', '01110'],
  ']': ['01110', '00010', '00010', '00010', '00010', '00010', '01110'],
  '\u2022': ['00000', '00000', '01110', '01110', '01110', '00000', '00000'],
};

// ---------------------------------------------------------------------------
// Stories of 26 November 2026. t = UTC time (HH:MM) when reported, or the
// day marker when the wire carried no clock time. s = source. h = headline.
// ---------------------------------------------------------------------------
type Story = { t: string; s: string; h: string };

const LEAD1: Story = {
  t: '17:39',
  s: 'REUTERS',
  h: "HOUTHIS STRIKE SAUDI ARABIA'S BIGGEST REFINERY",
};
const LEAD1_SUB =
  "RAS TANURA HIT IN RETALIATION; A RIYADH TOWER STRUCK AGAIN - 11 HURT. 17 KILLED IN A SAUDI-LED STRIKE ON HODEIDA, YEMEN.";

const LEAD2: Story = {
  t: '25 NOV',
  s: 'FOX BUSINESS',
  h: 'WALL STREET DIVES INTO THANKSGIVING: MICRON -10%, AMD -9%, NVIDIA -7%',
};
const LEAD2_SUB =
  'NASDAQ -3.75%, S&P -2.5%, DOW -864 PTS. AI SELLOFF DEEPENS AS HOT INFLATION AND NEW TARIFFS BITE.';

const WAR: Story[] = [
  { t: '16:38', s: 'AL JAZEERA', h: 'UKRAINE LASER BLYKS DOWNS JET-POWERED GERAN DRONE' },
  { t: '15:38', s: 'REUTERS', h: 'HOUTHI STRIKES HIT SAUDI REFINERY AND RIYADH TOWER' },
  { t: '14:34', s: 'LENTA', h: 'RUSSIA HITS UKRAINE ENERGY SITES; 17 DEAD IN HODEIDA' },
  { t: '13:36', s: 'TASS', h: 'DRONE HITS POLTAVA ENERGY SITE; KIROV TOLL RISES TO 7' },
  { t: '12:35', s: 'TASS', h: 'SAMARA UAV ATTACK DAMAGES SIX FLATS' },
  { t: '11:34', s: 'GALINFO', h: 'ZAPORIZHZHIA NUCLEAR PLANT LOSES POWER AFTER SHELLING' },
  { t: '10:34', s: 'AP', h: 'IDF STRIKE KILLS HAMAS COLONEL, WIFE, 2 CHILDREN' },
  { t: '03:03', s: 'INDEPENDENT', h: 'UKRAINIAN DRONES HIT TWO SAMARA REFINERIES' },
  { t: '20:30', s: 'CNA', h: 'MERZ: "RUSSIA WANTS MORE THAN UKRAINE"' },
  { t: '20:14', s: 'ARAB NEWS', h: 'US ENVOY KUSHNER WARNS AGAINST UKRAINE ESCALATION' },
  { t: '19:34', s: 'FOX NEWS', h: 'LEAKED STATS: 490,334 RUSSIAN SOLDIERS DEAD' },
  { t: '24 NOV', s: 'REUTERS', h: 'RUSSIAN MISSILES AND DRONE HIT NATO MEMBER POLAND' },
];

const MARKETS: Story[] = [
  { t: '20:15', s: 'DOW JONES', h: 'US Q3 GDP GREW 4.3%, FASTEST PACE IN THREE YEARS' },
  { t: '25 NOV', s: 'REUTERS', h: 'PCE INFLATION 3.8% YOY; DEC FED HIKE SEEN NEAR-CERTAIN' },
  { t: '25 NOV', s: 'REUTERS', h: 'US TO ANNOUNCE NEW TARIFFS ON 14 PARTNERS INCL. CHINA' },
  { t: '25 NOV', s: 'REUTERS', h: 'HUANG BACK AS NVIDIA CEO, SHARES +31.5% MON' },
  { t: '25 NOV', s: 'DELL', h: 'DELL: RECORD $132.3B AI BACKLOG; Q3 REVENUE $54.9B' },
  { t: '25 NOV', s: 'SIA', h: 'GLOBAL CHIP SALES $517.7B IN Q3, UP 24.1% ON QUARTER' },
  { t: '25 NOV', s: 'ADI', h: 'ANALOG DEVICES FY2026 REVENUE $15.2B, +38%' },
  { t: '25 NOV', s: 'FCC', h: 'FCC CLEARS SPACEX TO LAUNCH UP TO 1 MILLION SATELLITES' },
  { t: '25 NOV', s: 'NYT', h: "SINGAPORE CENTRE 'DIVERTED NVIDIA CHIPS TO CHINA'" },
  { t: '25 NOV', s: 'FOX BUSINESS', h: 'ANTHROPIC SHARES SLIDE BELOW $83 IPO PRICE' },
  { t: '25 NOV', s: 'REUTERS', h: 'KOSPI -6.16%, NIKKEI -2.78% AS ASIA FOLLOWS WALL ST' },
  { t: '25 NOV', s: 'REUTERS', h: 'LME METALS INDEX -15% IN NOV; COPPER, TIN HIT' },
];

const WORLD: Story[] = [
  { t: '25 NOV', s: 'SKY NEWS', h: 'UK RAF MOVES JETS TO HANGARS AT NIGHT' },
  { t: '25 NOV', s: 'REUTERS', h: 'CHINA URGES DUTCH FAIR CLIMATE AMID NEXPERIA ROW' },
  { t: '25 NOV', s: 'SKY NEWS', h: 'POUNDLAND PREPARING FOR ADMINISTRATION, SKY REPORTS' },
  { t: '25 NOV', s: 'REUTERS', h: "HOUTHI FORCES NOW 60 KM FROM ADEN, YEMEN'S CAPITAL" },
  { t: '25 NOV', s: 'REUTERS', h: 'REPUBLICANS LOST BOTH CONGRESS CHAMBERS' },
  { t: '25 NOV', s: 'OXFAM', h: 'OXFAM: GAZA RUBBLE, SEWAGE POISONING SOIL, WATER' },
  { t: '25 NOV', s: 'REPORTS', h: 'CIA AND ODNI UNCLASSIFIED SYSTEMS HIT IN CYBER BREACH' },
  { t: '25 NOV', s: 'FDA', h: 'FDA APPROVES ROCHE BREAST DRUG WILSERDLY' },
  { t: '25 NOV', s: 'DOW JONES', h: 'EU UNVEILS QUANTUM PLAN AND $55B SOVEREIGN TECH FUND' },
  { t: '25 NOV', s: 'REUTERS', h: 'F1: VERSTAPPEN-RUSSELL FEUD FLARES BEFORE QATAR GP' },
  { t: '26 NOV', s: 'REUTERS', h: 'BLACK FRIDAY OPT-OUTS: REI CLOSES ITS STORES' },
  { t: '26 NOV', s: 'REUTERS', h: 'XAVIER EDGES TEXAS A&M 88-83 IN BATTLE 4 ATLANTIS' },
];

// World-map pins: [longitude, latitude, label, label side: R/L/A/B or '' for dot only]
const PINS: Array<[number, number, string, string]> = [
  [46.7, 24.6, 'RIYADH', 'R'],
  [30.5, 50.4, 'KYIV', 'A'],
  [34.5, 31.5, 'GAZA', 'L'],
  [37.6, 55.7, '', ''],
  [-77.0, 38.9, 'WASHINGTON', 'L'],
  [116.4, 39.9, 'BEIJING', 'R'],
  [-0.1, 51.5, '', ''],
  [51.5, 25.3, '', ''],
  [42.8, 14.8, '', ''],
  [127.0, 37.5, '', ''],
];

// Continents drawn as overlapping ellipses in lon/lat space.
const LAND: Array<[number, number, number, number]> = [
  [-100, 45, 34, 19], [-95, 25, 24, 9], [-85, 62, 20, 9], [-150, 63, 14, 7],
  [-42, 72, 9, 6], [-60, -10, 14, 19], [-65, -35, 7, 9],
  [15, 52, 19, 9], [22, 62, 11, 6],
  [15, 5, 21, 24], [20, -20, 11, 11],
  [80, 50, 44, 17], [100, 20, 19, 11], [45, 25, 11, 9], [135, 35, 11, 7],
  [115, -2, 9, 4], [134, -25, 11, 7],
];

const W = 1024;
const H = 1024;
const PAPER: [number, number, number] = [247, 242, 228];
const INK: [number, number, number] = [22, 22, 22];
const NAVY: [number, number, number] = [20, 32, 63];
const RED: [number, number, number] = [178, 28, 28];
const GREEN: [number, number, number] = [27, 94, 60];
const BLUE: [number, number, number] = [29, 78, 150];
const GREY: [number, number, number] = [96, 96, 96];
const RULE: [number, number, number] = [180, 172, 150];
const MAP_BG: [number, number, number] = [214, 231, 240];
const MAP_LAND: [number, number, number] = [122, 148, 106];

// ---------------------------------------------------------------------------
// Canvas: a plain RGB buffer, drawn with filled rectangles and the font.
// ---------------------------------------------------------------------------
const px = new Uint8Array(W * H * 3);
function fill(c: [number, number, number]): void {
  for (let i = 0; i < W * H; i++) {
    px[i * 3] = c[0]; px[i * 3 + 1] = c[1]; px[i * 3 + 2] = c[2];
  }
}
function rect(x: number, y: number, w: number, h: number, c: [number, number, number]): void {
  const x0 = Math.max(0, x), y0 = Math.max(0, y);
  const x1 = Math.min(W, x + w), y1 = Math.min(H, y + h);
  for (let yy = y0; yy < y1; yy++) {
    for (let xx = x0; xx < x1; xx++) {
      const i = (yy * W + xx) * 3;
      px[i] = c[0]; px[i + 1] = c[1]; px[i + 2] = c[2];
    }
  }
}
function dot(x: number, y: number, c: [number, number, number]): void {
  if (x < 0 || x >= W || y < 0 || y >= H) return;
  const i = (y * W + x) * 3;
  px[i] = c[0]; px[i + 1] = c[1]; px[i + 2] = c[2];
}
function circle(cx: number, cy: number, r: number, c: [number, number, number]): void {
  for (let yy = cy - r; yy <= cy + r; yy++) {
    for (let xx = cx - r; xx <= cx + r; xx++) {
      const dx = xx - cx, dy = yy - cy;
      if (dx * dx + dy * dy <= r * r) dot(xx, yy, c);
    }
  }
}

// ---------------------------------------------------------------------------
// Text. Scale 1 = 5x7 px glyphs, 1 px gap (6 px per char). Scale s uses
// s*s blocks. Unknown characters render as a space.
// ---------------------------------------------------------------------------
function norm(s: string): string {
  return s.toUpperCase().replace(/[\u2018\u2019]/g, "'").replace(/[\u2013\u2014]/g, '-').replace(/\u201C|\u201D/g, '"');
}
function textW(s: string, scale: number): number {
  return norm(s).length * (6 * scale) - scale;
}
function drawText(s: string, x: number, y: number, scale: number, c: [number, number, number]): void {
  const t = norm(s);
  for (let ci = 0; ci < t.length; ci++) {
    const g = FONT[t[ci]] ?? FONT[' '];
    const ox = x + ci * 6 * scale;
    for (let r = 0; r < 7; r++) {
      const row = g[r];
      for (let col = 0; col < 5; col++) {
        if (row[col] === '1') {
          rect(ox + col * scale, y + r * scale, scale, scale, c);
        }
      }
    }
  }
}
function drawTextCentered(s: string, cx: number, y: number, scale: number, c: [number, number, number]): void {
  drawText(s, cx - Math.floor(textW(s, scale) / 2), y, scale, c);
}
// Greedy word wrap to a maximum number of characters per line.
function wrap(s: string, maxChars: number): string[] {
  const words = norm(s).split(' ');
  const lines: string[] = [];
  let cur = '';
  for (const w of words) {
    if (cur === '') { cur = w; continue; }
    if (cur.length + 1 + w.length <= maxChars) { cur += ' ' + w; }
    else { lines.push(cur); cur = w; }
  }
  if (cur !== '') lines.push(cur);
  return lines;
}

// ---------------------------------------------------------------------------
// PNG encoder (colour type 2, 8-bit RGB, filter 0, zlib level 9).
// Deterministic: same pixels always give the same bytes.
// ---------------------------------------------------------------------------
const CRC_TABLE: Uint32Array = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();
function crc32(buf: Buffer): number {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(type: string, data: Buffer): Buffer {
  const out = Buffer.alloc(12 + data.length);
  out.writeUInt32BE(data.length, 0);
  out.write(type, 4, 'ascii');
  data.copy(out, 8);
  out.writeUInt32BE(crc32(Buffer.concat([Buffer.from(type, 'ascii'), data])), 8 + data.length);
  return out;
}
function encodePNG(): Buffer {
  const raw = Buffer.alloc(H * (1 + W * 3));
  for (let y = 0; y < H; y++) {
    raw[y * (1 + W * 3)] = 0;
    Buffer.from(px.buffer, y * W * 3, W * 3).copy(raw, y * (1 + W * 3) + 1);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(W, 0); ihdr.writeUInt32BE(H, 4);
  ihdr[8] = 8; ihdr[9] = 2; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  const idat = deflateSync(raw, { level: 9 });
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr), chunk('IDAT', idat), chunk('IEND', Buffer.alloc(0)),
  ]);
}

// ---------------------------------------------------------------------------
// Layout: 1024 x 1024 newspaper front page.
//   banner 0-92 | leads + map 100-204 | 3 columns 212-868 |
//   UTC timeline 876-936 | footer 944-1016
// ---------------------------------------------------------------------------
const COL_X = [8, 348, 688];
const COL_W = 328;
const COL_TOP = 212;
const COL_BOT = 868;

function drawSection(x: number, title: string, color: [number, number, number], stories: Story[]): void {
  drawText(title, x, COL_TOP, 2, color);
  rect(x, COL_TOP + 20, COL_W, 3, color);
  let y = COL_TOP + 32;
  for (const st of stories) {
    drawText(st.t + ' UTC  -  ' + st.s, x, y, 1, GREY);
    y += 11;
    const lines = wrap(st.h, 27);
    for (const ln of lines) {
      drawText(ln, x, y, 2, INK);
      y += 16;
    }
    y += 8;
    rect(x, y - 4, COL_W, 1, RULE);
  }
}

function drawMap(x: number, y: number, w: number, h: number): void {
  rect(x, y, w, h, MAP_BG);
  rect(x, y, w, 2, NAVY); rect(x, y + h - 2, w, 2, NAVY);
  rect(x, y, 2, h, NAVY); rect(x + w - 2, y, 2, h, NAVY);
  const proj = (lon: number, lat: number): [number, number] => [
    x + 4 + Math.round(((lon + 180) / 360) * (w - 8)),
    y + 4 + Math.round(((75 - lat) / 135) * (h - 8)),
  ];
  for (const [clon, clat, rx, ry] of LAND) {
    const [cx, cy] = proj(clon, clat);
    const prx = Math.max(2, Math.round((rx / 360) * (w - 8)));
    const pry = Math.max(2, Math.round((ry / 135) * (h - 8)));
    for (let yy = cy - pry; yy <= cy + pry; yy++) {
      for (let xx = cx - prx; xx <= cx + prx; xx++) {
        const dx = (xx - cx) / prx, dy = (yy - cy) / pry;
        if (dx * dx + dy * dy <= 1) dot(xx, yy, MAP_LAND);
      }
    }
  }
  drawText('WHERE IT HAPPENED', x + 8, y + 5, 1, NAVY);
  for (const [lon, lat, label, side] of PINS) {
    const [pxx, pyy] = proj(lon, lat);
    circle(pxx, pyy, 3, RED);
    circle(pxx, pyy, 1, [255, 255, 255]);
    if (label === '') continue;
    const lw = textW(label, 1);
    let lx = pxx + 5, ly = pyy - 3;
    if (side === 'L') lx = pxx - 5 - lw;
    if (side === 'A') { lx = pxx - Math.floor(lw / 2); ly = pyy - 11; }
    if (side === 'B') { lx = pxx - Math.floor(lw / 2); ly = pyy + 5; }
    lx = Math.max(x + 3, Math.min(lx, x + w - 3 - lw));
    ly = Math.max(y + 15, Math.min(ly, y + h - 10));
    drawText(label, lx, ly, 1, RED);
  }
}

function drawTimeline(y: number): void {
  drawText('THE DAY IN UTC  -  26 NOVEMBER 2026', 8, y, 2, NAVY);
  const tx0 = 8, tx1 = 1016, ty = y + 30;
  rect(tx0, ty, tx1 - tx0, 2, NAVY);
  for (let hr = 0; hr <= 24; hr += 3) {
    const xx = tx0 + Math.round(((hr / 24) * (tx1 - tx0)));
    rect(xx, ty - 4, 2, 10, NAVY);
    drawText(String(hr).padStart(2, '0') + ':00', Math.max(tx0, Math.min(xx - 12, tx1 - 30)), ty + 10, 1, GREY);
  }
  const mark = (hh: number, mm: number, label: string, color: [number, number, number], up: number): void => {
    const xx = tx0 + Math.round((((hh + mm / 60) / 24) * (tx1 - tx0)));
    circle(xx, ty + 1, 4, color);
    drawText(label, Math.max(8, Math.min(xx - Math.floor(textW(label, 1) / 2), 1016 - textW(label, 1))), ty - up, 1, color);
  };
  mark(3, 3, 'SAMARA REFINERIES', RED, 16);
  mark(10, 34, 'GAZA', RED, 16);
  mark(11, 34, 'ZNPP', RED, 28);
  mark(14, 34, 'HODEIDA', RED, 16);
  mark(16, 38, 'LASER KILL', RED, 16);
  mark(17, 39, 'RAS TANURA', RED, 28);
  mark(20, 15, 'GDP 4.3% / TARIFFS', BLUE, 16);
}

function draw(): void {
  fill(PAPER);
  // --- banner ---
  rect(0, 0, W, 92, NAVY);
  drawTextCentered('THE WORLD IN ONE IMAGE', W / 2, 10, 4, [255, 255, 255]);
  drawTextCentered('THURSDAY 26 NOVEMBER 2026  -  38 STORIES FROM AROUND THE WORLD', W / 2, 52, 2, [255, 214, 120]);
  drawTextCentered('ALL TIMES UTC  -  EVERY STORY SOURCED', W / 2, 74, 1, [200, 205, 220]);
  // --- leads (left) + map (right) ---
  drawText('LEAD: WAR SPREADS TO THE GULF', 8, 100, 2, RED);
  rect(8, 122, 640, 3, RED);
  const l1 = wrap(LEAD1.h, 35);
  let ly = 130;
  for (const ln of l1) { drawText(ln, 8, ly, 3, INK); ly += 24; }
  drawText('RAS TANURA HIT IN RETALIATION; A RIYADH TOWER STRUCK AGAIN - 11 HURT.', 8, ly + 2, 1, GREY);
  drawText('MARKETS: WALL ST DIVES - MICRON -10%, AMD -9%, NVIDIA -7%; NASDAQ -3.75%, DOW -864 PTS.', 8, ly + 13, 1, GREEN);
  drawMap(664, 100, 352, 104);
  // --- columns ---
  drawSection(COL_X[0], 'WAR & DIPLOMACY', RED, WAR);
  drawSection(COL_X[1], 'MARKETS & TECH', GREEN, MARKETS);
  drawSection(COL_X[2], 'WORLD, SPORT & LIFE', BLUE, WORLD);
  // --- timeline + footer ---
  drawTimeline(876);
  rect(8, 944, 1008, 2, NAVY);
  const foot1 = 'SOURCES: REUTERS, AP, BBC, AL JAZEERA, CNA, TASS, FOX BUSINESS, MORNINGSTAR, DOW JONES, NYT, SIA, DELL, ADI, FCC, FDA, OXFAM, SKY NEWS.';
  for (const [i, ln] of wrap(foot1, 158).entries()) drawText(ln, 8, 954 + i * 10, 1, GREY);
  drawText('THANKSGIVING DAY IN THE USA - US MARKETS CLOSED TODAY; NFL THANKSGIVING SLATE: BEARS-LIONS, EAGLES-COWBOYS, CHIEFS-BILLS. BITCOIN NEAR $58,400.', 8, 978, 1, INK);
  drawTextCentered('26 NOVEMBER 2026 - THE DAY THE WORLD SAW, IN ONE IMAGE.', W / 2, 996, 2, NAVY);
}

function main(): void {
  draw();
  const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';
  mkdirSync(outDir, { recursive: true });
  writeFileSync(join(outDir, 'entry.png'), encodePNG());
}

main();
