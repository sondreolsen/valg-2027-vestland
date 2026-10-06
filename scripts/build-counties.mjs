import fs from 'node:fs';

const root = new URL('../dist/data/', import.meta.url);
const municipalities = JSON.parse(fs.readFileSync(new URL('municipalities.json', root), 'utf8'));
const geo = JSON.parse(fs.readFileSync(new URL('norway.geojson', root), 'utf8'));

const leaders = {
  '03': { name: 'Oslo', party: 'H' }, '11': { name: 'Rogaland', party: 'H' },
  '15': { name: 'Møre og Romsdal', party: 'H' }, '18': { name: 'Nordland', party: 'Ap' },
  '30': { name: 'Viken', party: 'Ap' }, '31': { name: 'Østfold', party: 'Ap' },
  '32': { name: 'Akershus', party: 'H' }, '33': { name: 'Buskerud', party: 'Ap' },
  '34': { name: 'Innlandet', party: 'Ap' }, '38': { name: 'Vestfold og Telemark', party: 'Ap' },
  '39': { name: 'Vestfold', party: 'H' }, '40': { name: 'Telemark', party: 'Ap' },
  '42': { name: 'Agder', party: 'H' }, '46': { name: 'Vestland', party: 'Sp' },
  '50': { name: 'Trøndelag', party: 'Sp' }, '55': { name: 'Troms', party: 'Ap' },
  '56': { name: 'Finnmark', party: 'H' }
};
const current = Object.fromEntries(municipalities.map(m => [m.countyCode, m.countyName]));
const counties = Object.entries(current).map(([code, name]) => {
  const points = municipalities.filter(m => m.countyCode === code).map(m => m.point);
  const point = code === '32' ? [11.10, 60.20] : [points.reduce((a, p) => a + p[0], 0) / points.length, points.reduce((a, p) => a + p[1], 0) / points.length];
  return { code, name, point, party: leaders[code]?.party || 'Andre' };
});
fs.writeFileSync(new URL('counties.json', root), JSON.stringify(counties, null, 2) + '\n');

const features = geo.features.map(feature => {
  const code = String(feature.properties.kommunenummer).slice(0, 2);
  return { ...feature, properties: { countyCode: code, countyName: current[code] || code } };
});
fs.writeFileSync(new URL('counties.geojson', root), JSON.stringify({ type: 'FeatureCollection', features }) + '\n');

// Official election results are maintained by import-election-api.mjs.
// Do not recreate them from manually entered figures when rebuilding geography.

const polls = {
  '39': { date: '1. oktober 2026', client: 'Sentio for Fremskrittspartiet', source: 'https://www.pollofpolls.no/?cmd=Maling&gallupid=5717', values: { Ap: 19.4, H: 23.2, Frp: 29.3, SV: 5.3, Sp: 4.3, KrF: 3.7, V: 2.4, MDG: 6.3, R: 3.6, Andre: 1.9 }, seats: { Ap: 8, H: 10, Frp: 12, SV: 2, Sp: 2, KrF: 2, V: 1, MDG: 3, R: 1, Andre: 0 } },
  '15': { date: '25. september 2026', client: 'Respons Analyse for Sunnmørsposten / Tidens Krav / Romsdals Budstikke', source: 'https://www.pollofpolls.no/?cmd=Maling&gallupid=5711', values: { Ap: 17.3, H: 12.9, Frp: 38.1, SV: 4.7, Sp: 8.2, KrF: 6.3, V: 3.5, MDG: 2.6, R: 5.0, Andre: 1.4 }, seats: { Ap: 8, H: 6, Frp: 19, SV: 2, Sp: 4, KrF: 3, V: 2, MDG: 1, R: 2, Andre: 0 } },
  '50': { date: '14. september 2026', client: 'Norstat for Adresseavisen / NRK', source: 'https://www.pollofpolls.no/?cmd=Maling&gallupid=5695', values: { Ap: 26.1, H: 17.4, Frp: 17.2, SV: 7.2, Sp: 10.5, KrF: 2.8, V: 3.4, MDG: 4.2, R: 8.3, Andre: 3.0 }, seats: { Ap: 16, H: 11, Frp: 10, SV: 4, Sp: 6, KrF: 2, V: 2, MDG: 3, R: 5, Andre: 0 } },
  '18': { date: '12. august 2026', client: 'Norstat for NRK / Avisa Nordland', source: 'https://www.pollofpolls.no/?cmd=Maling&gallupid=5680', values: { Ap: 19.5, H: 16.2, Frp: 29.0, SV: 4.9, Sp: 7.6, KrF: 1.7, V: 2.3, MDG: 4.7, R: 9.9, Andre: 4.2 }, seats: { Ap: 9, H: 7, Frp: 13, SV: 2, Sp: 4, KrF: 1, V: 1, MDG: 2, R: 5, Andre: 1 } }
};
fs.writeFileSync(new URL('county-polls.json', root), JSON.stringify(polls, null, 2) + '\n');


