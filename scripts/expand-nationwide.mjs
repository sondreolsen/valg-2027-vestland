import fs from 'node:fs';

const root = decodeURIComponent(new URL('../', import.meta.url).pathname).replace(/^\//, '').replaceAll('/', '\\');
const read = (file) => JSON.parse(fs.readFileSync(`${root}${file}`, 'utf8'));
const write = (file, value) => fs.writeFileSync(`${root}${file}`, JSON.stringify(value));

const geo = read('research/norway.geojson');
const old = read('dist/data/municipalities.json');
const oldById = new Map(old.map((m) => [m.id, m]));
const countyNames = {
  '03': 'Oslo', '11': 'Rogaland', '15': 'Møre og Romsdal', '18': 'Nordland',
  '30': 'Viken', '31': 'Østfold', '32': 'Akershus', '33': 'Buskerud',
  '34': 'Innlandet', '38': 'Vestfold', '39': 'Vestfold', '40': 'Telemark',
  '42': 'Agder', '46': 'Vestland', '50': 'Trøndelag', '54': 'Troms', '55': 'Troms', '56': 'Finnmark'
};
const preferredMayors = {
  '0301': ['Anne Lindboe', 'H'], '3004': ['Arne Sekkelsten', 'H'], '3024': ['Lisbeth Hammer Krog', 'H'],
  '3301': ['Kjell Arne Hermansen', 'H'], '3030': ['Kjartan Berland', 'H'], '4204': ['Mathias Bernander', 'H'],
  '5001': ['Kent Ranum', 'H'], '4601': ['Marit Warncke', 'H'], '4631': ['Sara Sekkingstad', 'Sp'],
  '3107': ['Arne Sekkelsten', 'H'], '1103': ['Tormod Wilson Losnedal', 'H'], '3201': ['Lisbeth Hammer Krog', 'H'],
  '5501': ['Gunnar Wilhelmsen', 'Ap'], '1804': ['Odd Emil Ingebrigtsen', 'H'], '1508': ['Monica Molvær', 'H'],
  '3205': ['Kjartan Berland', 'H'], '1108': ['Kenny Rettore', 'H'], '3907': ['Bjørn Ole Gleditsch', 'H'],
  '4003': ['Hedda Foss Five', 'Ap'], '4203': ['Robert Cornels Nordli', 'Ap'], '3403': ['Einar Busterud', 'Andre']
};

function points(coords, out = []) {
  if (typeof coords?.[0] === 'number') out.push(coords);
  else for (const child of coords || []) points(child, out);
  return out;
}

const municipalities = geo.features.map((feature) => {
  const id = String(feature.properties.kommunenummer);
  const existing = oldById.get(id);
  const coords = points(feature.geometry.coordinates);
  const lon = coords.reduce((sum, p) => sum + p[0], 0) / coords.length;
  const lat = coords.reduce((sum, p) => sum + p[1], 0) / coords.length;
  const preferred = preferredMayors[id];
  return {
    id,
    name: feature.properties.kommunenavn,
    countyCode: id.slice(0, 2),
    countyName: countyNames[id.slice(0, 2)] || 'Ukjent fylke',
    mayor: preferred?.[0] || existing?.mayor || 'Ordfører ikke registrert',
    party: preferred?.[1] || existing?.party || 'Andre',
    source: preferred ? '' : existing?.source || '',
    point: [lon, lat],
    note: preferred || existing?.note ? null : 'Ordførernavn må kvalitetssikres før publisering.'
  };
});

write('dist/data/municipalities.json', municipalities);
fs.copyFileSync(`${root}research/norway.geojson`, `${root}dist/data/norway.geojson`);
console.log(`Generated ${municipalities.length} municipalities and nationwide geometry.`);
