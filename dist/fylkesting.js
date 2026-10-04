'use strict';

async function initCountyMap(){
 const map=L.map('county-map',{zoomControl:false,scrollWheelZoom:false,doubleClickZoom:false,dragging:false,keyboard:false,boxZoom:false,touchZoom:false,attributionControl:true});
 L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:18,attribution:'© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'}).addTo(map);
 const response=await fetch('data/vestland.geojson');
 if(!response.ok)throw new Error('Kartgrensen kunne ikke lastes');
 const data=await response.json();
 const boundary=L.geoJSON(data,{style:{color:'#0b6970',weight:2,fillColor:'#70d5c6',fillOpacity:.2}}).addTo(map);
 map.fitBounds(boundary.getBounds(),{padding:[22,22],animate:false});
 setTimeout(()=>map.invalidateSize(),0);
}

initCountyMap().catch(error=>{
 console.error(error);
 const container=document.querySelector('#county-map');
 container.innerHTML='<p class="county-map-fallback">Kartet kunne ikke lastes akkurat nå.</p>';
});
