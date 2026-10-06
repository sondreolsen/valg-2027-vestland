// node scripts/import-election-api.mjs [--cache-dir research/election-audit/api] [--check]
// UTF-8 safe on Windows. --check validates published data without writing it.
import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';

const root = fileURLToPath(new URL('../dist/data/', import.meta.url));
const args = process.argv.slice(2);
const cacheIndex = args.indexOf('--cache-dir');
if (cacheIndex >= 0 && (!args[cacheIndex + 1] || args[cacheIndex + 1].startsWith('--'))) throw new Error('Missing cache directory');
const cache = cacheIndex >= 0 ? args[cacheIndex + 1] : null;
const check = args.includes('--check');
const read = async file => JSON.parse((await fs.readFile(file, 'utf8')).replace(/^\uFEFF/, ''));
const municipalMap = {A:'Ap', H:'H', FRP:'FrP', SP:'Sp', SV:'SV', V:'V', MDG:'MDG', 'R\u00d8DT':'R', KRF:'KrF'};
const countyMap = {...municipalMap, FRP:'Frp', INP:'INP', PP:'Pp'};
// Preserve the existing policy: smaller lists are grouped only in these municipalities.
const grouped = new Set('0301 4601 5001 1103 3201 4204 3301 3203 3205 3107 1108 5501 3907 3207 3105 3905 1508 4003 1804 3103 3222 3909 3118 4203 3209 1149 4626 1106 4001 3411'.split(' '));
const municipalities = await read(path.join(root, 'municipalities.json'));
// Oslo elects a municipal council, not a county council.
const counties = (await read(path.join(root, 'counties.json'))).filter(c => c.code !== '03');

async function get(kind, code, url) {
  let data;
  if (cache) data = await read(path.join(cache, `${kind}-${code}.json`));
  else {
    const response = await fetch(url, {signal: AbortSignal.timeout(30000)});
    if (!response.ok) throw new Error(`${url}: HTTP ${response.status}`);
    data = await response.json();
  }
  assert.equal(data.id.nr, code, `${url}: incorrect area`);
  assert.equal(data.id.valgtype, kind.toUpperCase(), `${url}: incorrect election type`);
  assert.equal(data.id.valgaar, '2023', `${url}: incorrect year`);
  return data;
}

function aggregate(data, mapping, groupOthers) {
  const rows = new Map();
  for (const party of data.partier) {
    const {partikode:code, navn:name} = party.id;
    // Summary rows duplicate individual lists. Blank votes are not party votes.
    if (/^Andre/i.test(code) || /^blanke$/i.test(code) || name === 'Blanke') continue;
    const key = mapping[code] || (groupOthers ? 'Andre' : name);
    const value = party.stemmer.resultat.prosent, seats = party.mandater.resultat.antall;
    assert.ok(Number.isFinite(value) && value >= 0 && value <= 100, `${data.id.nr}/${code}: invalid percentage`);
    assert.ok(Number.isInteger(seats) && seats >= 0, `${data.id.nr}/${code}: invalid seats`);
    const row = rows.get(key) || {value:0, seats:0};
    row.value += value; row.seats += seats; rows.set(key, row);
  }
  const values = [...rows.values()];
  assert.equal(values.reduce((sum, r) => sum + r.seats, 0), data.mandater.antall, `${data.id.nr}: seat total mismatch`);
  assert.ok(Math.abs(values.reduce((sum, r) => sum + r.value, 0) - 100) < 0.01, `${data.id.nr}: percentage total mismatch`);
  return rows;
}

const results = {}, countyResults = {};
const jobs = [
  ...municipalities.map(m => async () => {
    const source = `https://valgresultat.no/api/2023/ko/${m.countyCode}/${m.id}`;
    const data = await get('ko', m.id, source);
    results[m.id] = {name:m.name, source, totalSeats:data.mandater.antall,
      results:[...aggregate(data, municipalMap, grouped.has(m.id))].map(([party, r]) => ({party, percent:Number(r.value.toFixed(2)), seats:r.seats}))};
  }),
  ...counties.map(c => async () => {
    const source = `https://valgresultat.no/api/2023/fy/${c.code}`;
    const data = await get('fy', c.code, source);
    countyResults[c.code] = {totalSeats:data.mandater.antall, source,
      rows:Object.fromEntries([...aggregate(data, countyMap, true)].map(([party, r]) => [party, {value:Number(r.value.toFixed(1)), seats:r.seats}]))};
  })
];
let next = 0;
await Promise.all(Array.from({length:6}, async () => {while (next < jobs.length) await jobs[next++]();}));
// Validate every response before replacing either published file.
for (const [file, data] of [['elections-2023.json', results], ['county-elections-2023.json', countyResults]]) {
  const target = path.join(root, file);
  if (check) assert.deepEqual(await read(target), data, `${file}: published results differ from API`);
  else await fs.writeFile(target, JSON.stringify(Object.fromEntries(Object.entries(data).sort(([a],[b]) => a.localeCompare(b))), null, 2) + '\n');
}
console.log(`${check ? 'Verified' : 'Imported'} ${municipalities.length} municipal elections and ${counties.length} county elections; all seat and percentage totals validated. Oslo has no county election.`);
