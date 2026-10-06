'use strict';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const partyMeta={Ap:{name:'Arbeiderpartiet',color:'#df3e46',logo:'ap.png'},H:{name:'Høyre',color:'#2678be',logo:'hoyre.png'},Frp:{name:'Frp',color:'#253c73',logo:'frp.png'},SV:{name:'SV',color:'#be3653',logo:'sv.png'},Sp:{name:'Sp',color:'#299755',logo:'sp-symbol.png'},KrF:{name:'KrF',color:'#e9ae22',logo:'krf.png'},V:{name:'Venstre',color:'#007d82',logo:'v-symbol.svg'},MDG:{name:'MDG',color:'#63932d',logo:'mdg.svg'},R:{name:'Rødt',color:'#a82329',logo:'r.svg'},INP:{name:'INP',color:'#7e8796'},Pp:{name:'Pp',color:'#697686'},Andre:{name:'Andre',color:'#8993a3'}};
const keys=['Ap','H','Frp','SV','Sp','KrF','V','MDG','R','INP','Pp','Andre'];
const labels={Ap:'Ap',H:'Høyre',Frp:'Frp',SV:'SV',Sp:'Sp',KrF:'KrF',V:'Venstre',MDG:'MDG',R:'Rødt',INP:'INP',Pp:'Pp',Andre:'Andre'};
const partyFull={Ap:'Arbeiderpartiet',H:'Høyre',Frp:'Fremskrittspartiet',SV:'Sosialistisk Venstreparti',Sp:'Senterpartiet',KrF:'Kristelig Folkeparti',V:'Venstre',MDG:'Miljøpartiet De Grønne',R:'Rødt',INP:'Industri- og Næringspartiet',Pp:'Pensjonistpartiet',Andre:'Andre'};
const countyLeaders={
 '42':{mayor:['Arne Thomassen','H','assets/candidates/arne-thomassen.jpg'],deputy:['Rune André Sørveit Frustøl','KrF','assets/candidates/rune-andre-sorveit-frustol.jpg']},
 '32':{mayor:['Trine-Lise Østlund Blime','H','assets/candidates/trine-lise-ostlund-blime.jpg'],deputy:['Ole Jacob Johansen','Frp']},
 '33':{mayor:['Tore Opdal Hansen','H'],deputy:['Lavrans Kierulf','Frp']},
 '56':{mayor:['Hans-Jacob Bønå','H'],deputy:['Heidi Holmgren','Sp']},
 '34':{mayor:['Thomas Breen','Ap'],deputy:['Hanne Alstrup Velure','H']},
 '15':{mayor:['Anders Riise','H'],deputy:['Anne Marie Fiksdal','Frp']},
 '18':{mayor:['Eivind Holst','H','assets/candidates/eivind-holst.jpg'],deputy:['Linda Helen Haukland','KrF','assets/candidates/linda-helen-haukland.jpg']},
 '03':{mayor:['Anne Lindboe','H'],deputy:['Julianne Ofstad','Frp']},
 '11':{mayor:['Ole Ueland','H','assets/candidates/ole-ueland.jpg'],deputy:['Svein Erik Indbjo','Frp','assets/candidates/svein-erik-indbjo.jpg']},
 '40':{mayor:['Terje Riis-Johansen','Sp','assets/candidates/terje-riis-johansen.jpg'],deputy:['Hilde Alice Vågslid','Ap']},
 '55':{mayor:['Benjamin Furuly','H','assets/candidates/benjamin-furuly.jpg'],deputy:['Eirik Losnegaard Mevik','Ap','assets/candidates/eirik-losnegaard-mevik.jpg']},
 '50':{mayor:['Tomas Iver Hallem','Sp','assets/candidates/tomas-iver-hallem.jpg'],deputy:['Pål Sæther Eiden','H']},
 '39':{mayor:['Anne Strømøy','H'],deputy:['Ellen Eriksen','Frp']},
 '46':{mayor:['Jon Askeland','Sp', 'assets/candidates/jon-askeland.jpg'],deputy:['Stian Jean Opedal Davies','Ap','assets/candidates/stian-davies.jpg']},
 '31':{mayor:['Sindre Martinsen Evje','Ap'],deputy:['Anette Lindahl Raakil','Sp']}
};
const fmt=v=>Number(v||0).toLocaleString('nb-NO',{minimumFractionDigits:1,maximumFractionDigits:1}).replace('.',',')+' %';
const logo=p=>p?.logo?`<img src="assets/logos/${p.logo}" alt="${esc(p.name)}">`:`<span class="local">A</span>`;

async function init(){
 const [counties,geo,elections,polls]=await Promise.all(['counties.json','counties.geojson','county-elections-2023.json','county-polls.json'].map(async f=>{const r=await fetch('data/'+f+'?v=county-national-3');if(!r.ok)throw new Error('Data kunne ikke lastes');return r.json()}));
 const byCode=new Map(counties.map(c=>[c.code,c]));let selected='46';
 const countySelect=document.querySelector('#county-select');countySelect.innerHTML=counties.slice().sort((a,b)=>a.name.localeCompare(b.name,'nb')).map(c=>`<option value="${c.code}">${esc(c.name)}</option>`).join('');countySelect.value=selected;
 const map=L.map('county-map',{zoomControl:true,scrollWheelZoom:true,dragging:true,attributionControl:true});L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors'}).addTo(map);
 const layers=new Map();const boundsByCode=new Map();
const boundary=L.geoJSON(geo,{style:f=>{const c=byCode.get(f.properties.countyCode);const color=partyMeta[c?.party]?.color||'#8993a3';return {color:'transparent',weight:0,fillColor:color,fillOpacity:.3}},onEachFeature:(f,l)=>{const code=f.properties.countyCode;layers.set(f.properties.countyCode,(layers.get(code)||[]).concat(l));const old=boundsByCode.get(code);boundsByCode.set(code,old?old.extend(l.getBounds()):l.getBounds());l.on('click',()=>selectCounty(code,true));}}).addTo(map);
 function fitCounty(code,zoomToCounty=false){
  const countyBounds=boundsByCode.get(code);
  const northCodes=new Set(['50','18','55','56']);
  if(zoomToCounty&&countyBounds){
   const south=!northCodes.has(code);
   map.fitBounds(countyBounds,{padding:south?[38,38]:[70,70],maxZoom:south?8:6,animate:false});
   return;
  }
  /* Keep the selected county in the detail panel while showing a useful
     regional context in the map. The tall map card works best with two
     broad views instead of zooming all the way into one county. */
  const regionalBounds=code==='50'
   ? [[60.7,2.0],[67.2,21.0]]
   : northCodes.has(code)
   ? [[63.5,8.5],[71.5,31.5]]
   : [[57.8,4.5],[65.0,17.5]];
  map.fitBounds(regionalBounds,{padding:[4,4],maxZoom:8,animate:false});
  map.setZoom(Math.min(map.getZoom()+1,9),{animate:false});
  if(!northCodes.has(code))map.panBy([-90,0],{animate:false});
 }
 function renderMarkers(){for(const c of counties){const p=partyMeta[c.party]||partyMeta.Andre;const marker=L.marker([c.point[1],c.point[0]],{icon:L.divIcon({className:'county-marker',html:`<span class="county-marker-inner" title="${esc(c.name)}">${logo(p)}</span>`,iconSize:[42,42],iconAnchor:[21,21]}),keyboard:true}).addTo(map);marker.on('click',()=>selectCounty(c.code,true));}}
 function renderResult(code){const e=elections[code];const rows=e?keys.map(k=>{const r=e.rows[k];if(!r||(!r.value&&!r.seats))return '';const p=partyMeta[k]||partyMeta.Andre;return `<div class="county-result-row" style="--party:${p.color};--value:${(r.value/Math.max(...keys.map(x=>e.rows[x]?.value||0))*100).toFixed(1)}%"><span>${labels[k]}</span><i><b></b></i><strong>${fmt(r.value)}</strong><em>${r.seats||0}</em></div>`}).join(''):'<p class="county-no-data">Valgresultat ikke tilgjengelig.</p>';document.querySelector('#county-result-column').innerHTML=`<div class="county-section-heading"><div><p class="county-kicker">FYLKESTINGSVALGET</p><h2>Valgresultat 2023</h2></div></div><div class="county-result-bars"><div class="county-result-head"><span>Parti</span><span></span><span>Prosent</span><span>Mandater</span></div>${rows}<div class="county-result-total"><span>Totalt</span><strong>${e?.totalSeats||'–'}</strong></div></div><a class="county-source" href="https://www.valg.no/valg/2023/fy" target="_blank" rel="noopener">Se valgresultatene hos Valgdirektoratet ↗</a>`;}
 function renderPoll(code){const p=polls[code];if(!p){document.querySelector('#county-poll-column').innerHTML=`<div class="county-section-heading"><div><p class="county-kicker">FYLKESTINGSMÅLING</p><h2>Siste måling</h2></div></div><div class="county-empty-poll"><div class="county-empty-symbol">▂ ▅ ▃</div><h3>Ingen måling registrert i 2026</h3><p>Vi fant ingen fylkestingsmåling fra 2026 for ${esc(byCode.get(code).name)} hos Poll of polls.</p><a href="https://www.pollofpolls.no/?cmd=Maling&amp;filter=fylke" target="_blank" rel="noopener">Se alle fylkestingsmålinger ↗</a></div>`;return;}const max=Math.max(...Object.values(p.values));const rows=keys.map(k=>p.values[k]===undefined?'':`<div class="county-result-row" style="--party:${(partyMeta[k]||partyMeta.Andre).color};--value:${(p.values[k]/max*100).toFixed(1)}%"><span>${labels[k]}</span><i><b></b></i><strong>${fmt(p.values[k])}</strong><em>${p.seats?.[k]??'–'}</em></div>`).join('');const total=Object.values(p.seats||{}).reduce((a,b)=>a+(Number(b)||0),0);document.querySelector('#county-poll-column').innerHTML=`<div class="county-section-heading"><div><p class="county-kicker">FYLKESTINGSMÅLING</p><h2>Siste måling</h2></div></div><div class="county-result-bars"><div class="county-result-head"><span>Parti</span><span></span><span>Prosent</span><span>Mandater</span></div>${rows}<div class="county-result-total"><span>${esc(p.date)} · ${esc(p.client)}</span><strong>${total}</strong></div></div><a class="county-source" href="${esc(p.source)}" target="_blank" rel="noopener">Se målingen hos Poll of polls ↗</a>`;}
 function renderDetail(code){const c=byCode.get(code);const data=countyLeaders[code];const person=(entry,label,extraClass='')=>{const [name,partyKey,photo]=entry;const p=partyMeta[partyKey]||partyMeta.Andre;const photoMarkup=photo?`<div class="county-leader-photo"><img class="county-leader-photo-image ${extraClass}" src="${photo}" alt="${esc(name)}"></div>`:`<div class="county-leader-photo county-leader-photo-placeholder"><span>${esc(name.split(' ').map(part=>part[0]).slice(0,2).join(''))}</span></div>`;return `<article class="county-mayor-person">${photoMarkup}<div class="county-leader-info"><div class="county-mayor-logo">${logo(p)}</div><small>${label}</small><strong>${esc(name)}</strong><span>${partyFull[partyKey]||p.name}</span></div></article>`};const leaders=data?`<div class="county-leaders">${person(data.mayor,'Fylkesordfører','county-leader-photo-jon')}${person(data.deputy,'Fylkesvaraordfører','county-leader-photo-stian')}</div>`:`<div class="county-empty-poll"><h3>Fylkesordfører</h3><p>Opplysninger om fylkesordfører kommer.</p></div>`;document.querySelector('#county-detail-card').innerHTML=`<p class="county-kicker">FYLKE</p><h2>${esc(c.name)}</h2>${leaders}`;const candidateSection=document.querySelector('#county-candidates');candidateSection.hidden=false;candidateSection.querySelector('.candidate-kicker, .county-kicker').textContent=c.name.toUpperCase();if(code!=='46'){const candidateParties=['Ap','H','Frp','SV','Sp','KrF','V','MDG','R'];candidateSection.querySelector('.county-candidate-grid').innerHTML=candidateParties.map(k=>{const p=partyMeta[k];return `<article class="county-candidate"><div class="county-candidate-party">${logo(p)}<span>${p.name}</span></div><div class="county-candidate-placeholder" style="--party:${p.color}"><span>${labels[k]}</span><small>Bilde kommer</small></div><h3>Toppkandidat ikke lagt inn ennå</h3></article>`}).join('');}}
 function selectCounty(code,zoomToCounty=false){if(!byCode.has(code))return;selected=code;countySelect.value=code;renderPoll(code);renderResult(code);renderDetail(code);fitCounty(code,zoomToCounty);}
 renderMarkers();selectCounty(selected);setTimeout(()=>map.invalidateSize(),0);countySelect.addEventListener('change',()=>selectCounty(countySelect.value,true));
}
init().catch(error=>{console.error(error);document.querySelector('#county-map').innerHTML='<p class="county-map-fallback">Kartet kunne ikke lastes akkurat nå.</p>';});











