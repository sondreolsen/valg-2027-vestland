(() => {
  const photos = {
    'Arne Thomassen':'42-arne.jpg',
    'Rune André Sørveit Frustøl':'42-rune.jpg',
    'Trine-Lise Østlund Blime':'32-trine.jpg',
    'Ole Jacob Johansen':'32-ole-jacob.jpg',
    'Tore Opdal Hansen':'33-tore.jpg',
    'Hans-Jacob Bønå':'56-hans.jpg',
    'Heidi Holmgren':'56-heidi.jpg',
    'Thomas Breen':'34-thomas.jpg',
    'Hanne Alstrup Velure':'34-hanne.jpg',
    'Eivind Holst':'18-eivind.jpg',
    'Linda Helen Haukland':'18-linda.jpg',
    'Ole Ueland':'11-ole.jpg',
    'Svein Erik Indbjo':'11-svein.jpg',
    'Terje Riis-Johansen':'40-terje.jpg',
    'Benjamin Furuly':'55-benjamin.jpg',
    'Eirik Losnegaard Mevik':'55-eirik.jpg',
    'Tomas Iver Hallem':'50-tomas.jpg',
    'Jon Askeland':'46-jon.jpg',
    'Stian Jean Opedal Davies':'46-stian.jpg'
  };
  const update = () => document.querySelectorAll('.county-mayor-person').forEach(person => {
    const name = person.querySelector('.county-leader-info strong')?.textContent.trim();
    const file = photos[name];
    const holder = person.querySelector('.county-leader-photo');
    if (!file || !holder || holder.querySelector('img')?.getAttribute('src')?.endsWith(file)) return;
    holder.innerHTML = `<img class="county-leader-photo-image" src="assets/leaders/${file}" alt="${name}">`;
  });
  new MutationObserver(update).observe(document.body, {childList:true, subtree:true});
  update();
})();
