// https://github.com/consbio/Leaflet.ZoomBox/issues/15#issuecomment-327156202
//import L from 'leaflet';
declare const L: any;
import 'leaflet';
import 'leaflet-draw/dist/leaflet.draw-src';

import * as d3 from 'd3';

export function initializeLunarAssembler(map_div_id:string, download_trigger_id:string, lat:number, lon:number, zoom:number, caller: (bounds: any, download_id: string) => void) {
  var map = L.map(map_div_id, { drawControl: true }).setView([lat, lon], zoom);
  var mapLink: string = 
      '<a href="https://openstreetmap.org">OpenStreetMap</a>';
  L.tileLayer(
      'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; ' + mapLink + ' Contributors',
      maxZoom: 19,
      }).addTo(map);
  var drawnItems = new L.FeatureGroup();
  map.addLayer(drawnItems);

  var drawControl = new L.Control.Draw({
      draw: {
          polygon: false,
          polyline: false,
          marker: false,
          circle: false,
          circlemarker: false
      }
  });
  map.addControl(drawControl);

  map.on('draw:created', function (e: { propagatedFrom: { getBounds: () => any; }; }) {
      //var corners = layer.getLatLngs();
      drawnItems.addLayer(e.propagatedFrom);
      //handleTriggerFromGUI(e.propagatedFrom.getBounds(), download_trigger_id);
      caller(e.propagatedFrom.getBounds(), download_trigger_id);
  });

  d3.select("#" + download_trigger_id).on("click", function(){
    //download("generated.svg", document.getElementById('generated_svg_within').innerHTML);
  })
}
