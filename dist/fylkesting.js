'use strict';

function initCountyMap(){
 const map=L.map('county-map',{zoomControl:false,scrollWheelZoom:false,doubleClickZoom:false,dragging:false,keyboard:false,boxZoom:false,touchZoom:false,attributionControl:true});
 L.tileLayer('https://cache.kartverket.no/v1/wmts/1.0.0/toporaster/default/webmercator/{z}/{y}/{x}.png',{
  maxZoom:18,
  attribution:'© <a href="https://www.kartverket.no/" target="_blank" rel="noopener">Kartverket</a>'
 }).addTo(map);
 map.setView([61.05,5.85],6,{animate:false});
 setTimeout(()=>map.invalidateSize(),0);
}

initCountyMap().catch(error=>{
 console.error(error);
 const container=document.querySelector('#county-map');
 container.innerHTML='<p class="county-map-fallback">Kartet kunne ikke lastes akkurat nå.</p>';
});
