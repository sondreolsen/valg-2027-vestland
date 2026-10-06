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

const results = {
  '42': [[17.0,9],[13.1,7],[26.2,13],[3.6,2],[11.7,6],[3.0,1],[2.6,1],[2.8,1],[5.7,3],[5.5,3],[3.7,2],[5.1,1],49],
  '32': [[19.0,10],[11.0,6],[35.6,19],[2.5,1],[2.2,1],[5.4,3],[2.0,1],[3.1,2],[4.3,2],[5.6,3],[2.9,0],51],
  '33': [[21.8,10],[12.8,6],[30.2,15],[3.5,2],[2.5,1],[3.6,2],[1.8,1],[2.9,1],[9.6,5],[5.1,2],[3.6,2],[2.7,0],47],
  '56': [[22.8,8],[11.9,4],[12.2,4],[2.6,1],[2.0,1],[2.0,1],[0,0],[4.8,2],[5.3,2],[6.5,2],[3.1,1],[26.9,9],35],
  '34': [[31.0,18],[9.2,5],[17.0,10],[2.7,2],[2.0,1],[2.9,2],[3.9,2],[3.5,2],[17.0,10],[6.0,3],[3.0,2],57],
  '15': [[16.2,8],[22.0,10],[19.0,9],[5.2,2],[5.4,3],[2.8,1],[0,0],[2.1,1],[9.6,5],[5.6,3],[3.9,2],[8.3,3],47],
  '18': [[24.4,11],[12.7,6],[22.9,11],[5.3,2],[2.4,1],[2.5,1],[1.1,0],[5.5,3],[10.7,5],[7.6,4],[3.2,1],[1.7,0],45],
  '11': [[19.7,10],[14.7,7],[28.0,14],[5.5,3],[8.7,4],[2.6,1],[1.3,0],[3.0,1],[5.9,3],[4.4,2],[3.2,2],[2.9,0],47],
  '40': [[25.1,11],[13.9,6],[19.5,8],[6.7,3],[5.4,2],[3.4,1],[0,0],[5.1,2],[10.0,4],[6.0,3],[2.5,1],[2.4,0],41],
  '55': [[24.1,9],[14.6,6],[18.5,7],[5.8,2],[3.4,1],[3.4,1],[0.9,0],[5.2,2],[7.7,3],[9.7,4],[2.5,1],[4.1,1],37],
  '50': [[27.3,16],[6.6,4],[22.6,14],[3.5,2],[2.5,2],[4.4,3],[3.7,2],[4.1,2],[11.8,7],[8.0,5],[4.0,2],[1.5,0],59],
  '39': [[22.9,10],[13.0,5],[31.6,13],[4.8,2],[3.6,1],[4.1,2],[0,0],[3.7,2],[4.2,2],[5.4,2],[3.6,2],[3.0,0],41],
  '46': [[17.8,12],[12.6,9],[22.8,15],[6.1,4],[4.9,3],[3.9,3],[1.4,1],[3.2,2],[11.0,7],[7.8,5],[4.2,3],[4.1,1],65],
  '31': [[25.0,11],[13.4,6],[27.0,12],[3.5,1],[3.6,2],[3.6,2],[3.4,1],[3.9,2],[7.1,3],[4.9,2],[2.5,1],[2.0,0],43],
  '03': [[18.5,11],[6.0,4],[32.6,20],[1.1,0],[1.7,1],[10.2,6],[0.6,0],[5.8,4],[0.8,0],[10.1,6],[9.1,6],59]
};
const keys = ['Ap','Frp','H','INP','KrF','MDG','Pp','R','Sp','SV','V','Andre'];
const electionData = Object.fromEntries(Object.entries(results).map(([code, values]) => [code, {
  totalSeats: values.at(-1), source: 'https://www.valg.no/valg/2023/fy',
  rows: Object.fromEntries(keys.map((key, i) => [key, { value: values[i][0], seats: values[i][1] }]))
}]));
fs.writeFileSync(new URL('county-elections-2023.json', root), JSON.stringify(electionData, null, 2) + '\n');

const polls = {
  '39': { date: '1. oktober 2026', client: 'Sentio for Fremskrittspartiet', source: 'https://www.pollofpolls.no/?cmd=Maling&gallupid=5717', values: { Ap: 19.4, H: 23.2, Frp: 29.3, SV: 5.3, Sp: 4.3, KrF: 3.7, V: 2.4, MDG: 6.3, R: 3.6, Andre: 1.9 }, seats: { Ap: 8, H: 10, Frp: 12, SV: 2, Sp: 2, KrF: 2, V: 1, MDG: 3, R: 1, Andre: 0 } },
  '15': { date: '25. september 2026', client: 'Respons Analyse for Sunnmørsposten / Tidens Krav / Romsdals Budstikke', source: 'https://www.pollofpolls.no/?cmd=Maling&gallupid=5711', values: { Ap: 17.3, H: 12.9, Frp: 38.1, SV: 4.7, Sp: 8.2, KrF: 6.3, V: 3.5, MDG: 2.6, R: 5.0, Andre: 1.4 }, seats: { Ap: 8, H: 6, Frp: 19, SV: 2, Sp: 4, KrF: 3, V: 2, MDG: 1, R: 2, Andre: 0 } },
  '50': { date: '14. september 2026', client: 'Norstat for Adresseavisen / NRK', source: 'https://www.pollofpolls.no/?cmd=Maling&gallupid=5695', values: { Ap: 26.1, H: 17.4, Frp: 17.2, SV: 7.2, Sp: 10.5, KrF: 2.8, V: 3.4, MDG: 4.2, R: 8.3, Andre: 3.0 }, seats: { Ap: 16, H: 11, Frp: 10, SV: 4, Sp: 6, KrF: 2, V: 2, MDG: 3, R: 5, Andre: 0 } },
  '18': { date: '12. august 2026', client: 'Norstat for NRK / Avisa Nordland', source: 'https://www.pollofpolls.no/?cmd=Maling&gallupid=5680', values: { Ap: 19.5, H: 16.2, Frp: 29.0, SV: 4.9, Sp: 7.6, KrF: 1.7, V: 2.3, MDG: 4.7, R: 9.9, Andre: 4.2 }, seats: { Ap: 9, H: 7, Frp: 13, SV: 2, Sp: 4, KrF: 1, V: 1, MDG: 2, R: 5, Andre: 1 } }
};
fs.writeFileSync(new URL('county-polls.json', root), JSON.stringify(polls, null, 2) + '\n');


