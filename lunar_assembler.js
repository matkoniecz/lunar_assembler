/*
    lunar_assembler - tool for generating SVG files from OpenStreetMap data. Available as a website.
    Copyright (C) 2021 Mateusz Konieczny

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU Affero General Public License as
    published by the Free Software Foundation, under version 3 of the
    License only.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU Affero General Public License for more details.

    You should have received a copy of the GNU Affero General Public License
    along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

const predictedTimeInSeconds = 35;
var completed = false;
var doneInPercents = 0;
const timeBetweenUpdatesInSeconds = 0.1;
const updateCount = predictedTimeInSeconds / timeBetweenUpdatesInSeconds;
const incrementOnUpdateBy = 100 / updateCount;
let progressBar;
let handleOfProgressBarAnimation;

function initializeLunarAssembler({map_div_id, download_trigger_id, progress_bar_id, lat, lon, zoom} = {}) {
  initializeSelectorMap(map_div_id, lat, lon, zoom, download_trigger_id);
  initilizeDownloadButton(download_trigger_id);
  progressBar = document.getElementById(progress_bar_id);
}

//////////////////////////////////////////////////////////////////////////////////////////
// progress bar fun
// TODO:
// not entirely fake as it is based on expected real time
// and not intentionally misleading like for example randomized booking.com displays
//
// it would be nice to have it based on area size - there is probably some relation here

function setProgressValue(newProgress) {
  doneInPercents = newProgress;
  if(doneInPercents >= 100) {
    doneInPercents = 100;
  }
  progressBar.value = doneInPercents;
}

function markAsCompleted(){
  setProgressValue(100);
  completed = true;
}

function markAsFailed(){
  clearInterval(handleOfProgressBarAnimation); // terminates
  setProgressValue(0);
}

function startShowingProgress(){
  doneInPercents = 0;
  completed = false;
  handleOfProgressBarAnimation = setInterval(() => {
  if(completed) {
    clearInterval(handleOfProgressBarAnimation); // terminates
  } else {
    var progress = doneInPercents + incrementOnUpdateBy;
    if (progress > 95) {
      progress = 10;
    }
    setProgressValue(progress)
  }
}, timeBetweenUpdatesInSeconds * 1000);
}

// end of progress bar fun
//////////////////////////////////////////////////////////////////////////////////////////

function initializeSelectorMap(map_div_id, lat, lon, zoom, download_trigger_id) {
  var map = L.map(map_div_id).setView([lat, lon], zoom);
  var mapLink = 
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

  map.on('draw:created', function (e) {
      var type = e.layerType,
          layer = e.layer;
          corners = layer.getLatLngs();

      drawnItems.addLayer(layer);

      handleTriggerFromGUI(layer.getBounds(), download_trigger_id);
  });
}

function initilizeDownloadButton(download_trigger_id){
  d3.select("#" + download_trigger_id).on("click", function(){
    download("generated.svg", document.getElementById(nameOfSVGHolderId()).innerHTML);
  })
}

function nameOfSVGHolderId(){
  return "generated_svg_within";
}
async function handleTriggerFromGUI(bounds, download_trigger_id){
    startShowingProgress();
    let osmJSON = await downloadOpenStreetMapData(bounds) // https://leafletjs.com/reference-1.6.0.html#latlngbounds-getcenter
    if(osmJSON == -1) {
      console.log("FILURE of download!");
      markAsFailed();
      alert("Overpass API refused to provide data. Either selected area was too large, or you exceed usage limit of that free service. Please wait a bit and retry. Overpass API is used to get data from OpenStreetMap for a given area.")
      return;
    }
    let geoJSON = toGeoJSON(osmJSON)
    const width=800;
    const height=600;
    render(bounds.getWest(), bounds.getSouth(), bounds.getEast(), bounds.getNorth(), geoJSON, width, height, mapStyle); //mapStyle is defined in separate .js file, imported here - TODO, pass it here(???? what about multple styles at once?)
    document.getElementById(download_trigger_id).style.display = '';
    document.getElementById('instruction_hidden_after_first_generation').style.display = 'none';
    markAsCompleted();
}

// TODO - there is a function to do this, right?
        function geoJSONPolygonRepresentingBBox(west, south, east, north) {
            return {
              "type": "FeatureCollection",
              "features": [
                {
                  "type": "Feature",
                  "properties": {},
                  "geometry": {
                    "type": "Polygon",
                    "coordinates": [
                      [
                        [
                          west, south,
                        ],
                        [
                          east, south,
                        ],
                        [
                          east, north,
                        ],
                        [
                          west, north,
                        ],
                        [
                          west, south,
                        ]
                      ]
                    ]
                  }
                }
              ]
            }
          }
  
          // downloading OSM data
          async function downloadOpenStreetMapData(bounds){
              // https://leafletjs.com/reference-1.6.0.html#latlngbounds-getcenter
              query = "";
              // note: extra filters will break data in case of some bad/poor/substandard tagging or where someone want this kind of data
              // extra filters are useful to reduce data overload during debugging, often bug is reproducible in their presence
              var extra_filters = "[type!=route][type!=parking_fee][type!=waterway][type!=boundary][boundary!=administrative][boundary!=religious_administration]"
              query += "[out:json][timeout:25];nwr" + extra_filters + "(";
              query += bounds.getSouth();
              query += ","
              query += bounds.getWest();
              query += ","
              query += bounds.getNorth();
              query += ","
              query += bounds.getEast();
              query += ");";
              query += "out body;>;out skel qt;";
              console.log("overpass query in the next line:");
              console.log(query);
  
              const response = await fetch("https://overpass-api.de/api/interpreter", {
                  method: 'POST',
                  headers: {
                      'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                      // considered adding also deployed at ' + window.location.href + ' -
                      // but it may leak private data
                      "User-Agent": 'lunar_assembler SVG generator - please contact Mateusz Konieczny matkoniecz@gmail.com (library author) or website operator if usage is causing any issues',
                  },
                  body: new URLSearchParams({'data': query})
              }).catch(err => {
                alert(err);
                console.log(err.response.data);
                return -1
              });
              if (response.ok) {
                const responseData = response.json();
                const osmJSON = responseData;
                return osmJSON;
              } else {
                return -1 // is there a better way to handle failures? throw exception? From looking at https://stackoverflow.com/a/27724419/4130619 code for that would be even worse
              }
          } 
          function toGeoJSON(osmJSON) {
              let geoJSON = osmtogeojson(osmJSON);
              return geoJSON;
          }
  
  
      // TODO: what kind of geojson is accepted here? will it crash when I pass a point here?
      function rewind(geojson_that_is_7946_compliant_with_right_hand_winding_order) {
        // ARGHHHHHH ARGHHHHHH ARGHHHH
        // https://gis.stackexchange.com/questions/392452/why-d3-js-works-only-with-geojson-violating-right-hand-rule
        // I opened https://github.com/d3/d3-shape/issues/178
        const d3_geojson = { ...geojson_that_is_7946_compliant_with_right_hand_winding_order };
        d3_geojson.features = d3_geojson.features.map(f => {
            //console.log(f);
            return turf.rewind(f, { reverse: true })
          }
        );
        //alert(JSON.stringify(d3_geojson))
        return d3_geojson;
      }
  
  
  function render(west, south, east, north, data_geojson, width, height, mapStyle) {
    data_geojson = clipGeometries(west, south, east, north, data_geojson);
    data_geojson = mergeAsRequestedByMapStyle(data_geojson, mapStyle);
    renderUsingD3(west, south, east, north, data_geojson, width, height, mapStyle);
}

function mergeAsRequestedByMapStyle(data_geojson, mapStyle) {
  var i = data_geojson.features.length;
  var processeedFeatures = [];
  var mergingGroups = {}
  while (i--) {
    var feature = data_geojson.features[i]
    if(feature.geometry.type == "Point" || feature.geometry.type === "MultiPoint") {
      // skipping handling them for now
      // once point rendering will appear something will need to be done with it
      processeedFeatures.push(feature);
    } else if (feature.geometry.type ==  "LineString" || feature.geometry.type == "MultiLineString") {
      // also not supported, lines are not being merged for now
      processeedFeatures.push(feature);
    } else if (feature.geometry.type ==  "Polygon" || feature.geometry.type == "MultiPolygon") {
      const mergeGroup = mapStyle.mergeIntoGroup(feature);
      if(mergeGroup === null) {
        processeedFeatures.push(feature);
      } else {
        if (mergingGroups[mergeGroup] === undefined) {
          mergingGroups[mergeGroup] = [];
        }
        mergingGroups[mergeGroup].push(feature);
      }
    } else {
      processeedFeatures.push(feature);
      console.log("very unexpected " + feature.geometry.type + " appeared in mergeAsRequestedByMapStyle, logging its data <")
      console.log(feature)
      console.log("> LOGGED")
    }
  }
  keys = Object.keys(mergingGroups)
  for(var i=0; i<keys.length; i++) {
    const key = keys[i]
    const forMerging = mergingGroups[key]
    // TODO: how to deal with tag values? I will just take the first object
    var produced = forMerging[0];
    var coordinatesForMerging = []
    for(var k=0; k<forMerging.length; k++) {
      coordinatesForMerging.push(forMerging[k].geometry.coordinates)
    }
    // it is union so output will be nonepty
    // https://github.com/mfogel/polygon-clipping#output
    produced.geometry.type = "MultiPolygon" 
    produced.geometry.coordinates = polygonClipping.union(...coordinatesForMerging)
    processeedFeatures.push(produced)
  }
  data_geojson.features = processeedFeatures;
  return data_geojson;
}

function clipGeometries(west, south, east, north, data_geojson) {
  var bbox = [west, south, east, north];
  var i = data_geojson.features.length;
  var survivingFeatures = [];
  while (i--) {
    // once point rendering will appear something
    // like https://www.npmjs.com/package/@turf/boolean-point-in-polygon
    // will need to be used    
    var feature = data_geojson.features[i];
    if(feature.geometry.type != "Point" && feature.geometry.type != "MultiPoint") {
        feature.geometry = turf.bboxClip(feature.geometry, bbox).geometry;
    }
    var filtered = dropDegenerateGeometrySegments(feature)
    if(filtered != null) {
      survivingFeatures.push(feature);
    }
  }
  data_geojson.features = survivingFeatures;
  return data_geojson;
}

function dropDegenerateGeometrySegments(feature){
  if (feature.geometry.type == "MultiPolygon") {
    // multipolygon may have multiple outer rings
    // in case where some of them are completely outside bounding box, 
    // their geometry part becomes []
    // what crashes further processing
    // following is a real case:
    /*
    {
      "type": "MultiPolygon",
      "coordinates": [
        [],
        [],
        [
          [
            [
              19.88054854391,
              50.08241179037703
            ],
            [
              19.88054854391,
              50.082290158188336
            ],
            [
              19.8806218,
              50.0822914
            ],
            [
              19.8806948,
              50.0823309
            ],
            [
              19.88068365233083,
              50.08241179037703
            ],
            [
              19.88054854391,
              50.08241179037703
            ]
          ]
        ]
      ]
    }
    */
    var survivingGeometryParts = []
    var k = feature.geometry.coordinates.length
    while (k--) {
      var geometryPart = feature.geometry.coordinates[k];
      if (geometryPart.length != 0) /* in js [] != [] */ {
        survivingGeometryParts.push(geometryPart);
      }
    }
    if (survivingGeometryParts.length == 0) {
      return null;
    } else {
      console.log(survivingGeometryParts);
      feature.geometry.coordinates = survivingGeometryParts;
    }
  }
  console.log(feature)
  return feature;
}
  function renderUsingD3(west, south, east, north, data_geojson, width, height, mapStyle) {
      var geoJSONRepresentingBoundaries = geoJSONPolygonRepresentingBBox(west, south, east, north);
      // rewinding is sometimes needed, sometimes not
      // rewinding is sometimes broken in my code (at least in oce case it was borked by my bug in futher processing!), sometimes not
      // see https://gis.stackexchange.com/questions/392452/why-d3-js-works-only-with-geojson-violating-right-hand-rule
      // not sure what is going on here

      console.log("data_geojson in the next line (before d3 rewind):")
      console.log(JSON.stringify(data_geojson))
      var d3_data_geojson = rewind(data_geojson);
      var d3_geoJSONRepresentingBoundaries = rewind(geoJSONRepresentingBoundaries);
      console.log("data_geojson in the next line (after d3 rewind):")
      console.log(JSON.stringify(d3_data_geojson))
  
      var projection = d3.geoMercator().fitSize([width, height], d3_geoJSONRepresentingBoundaries)
  
  
      var geoGenerator = d3.geoPath()
      .projection(projection);
  
      selector = '#' + nameOfSVGHolderId() +' g.generated_map'
      let generated = '<svg height="100%" width="100%" viewBox="0 0 ' + width + ' ' + height + '">' + "\n" + '<g class="generated_map" id="generated_map"></g>' + "\n" + '</svg>'
      document.getElementById(nameOfSVGHolderId()).innerHTML=generated
  
      // turn function returning value (layering order of function)
      // into function taking two features and ordering them
      var compareFunction = makeCompareFunctionForLayering(mapStyle.paintOrder)
      d3_data_geojson.features.sort(compareFunction)
      console.log(d3_data_geojson.features)
      update3Map(geoGenerator, d3_data_geojson, selector, mapStyle);
    }

    function makeCompareFunctionForLayering(paintOrderFunction) {
      // paintOrderFunction takes feature as input and outputs number
      // higher number - more on top
      return function(a, b) {
        // < 0 - First element must be placed before second
        // 0 - Both elements is equal, do not change order.
        // > 0 - Second element must be placed before first.
        // https://stackoverflow.com/a/41121134/4130619

        // if featureFirst should be drawn over featureSecond
        // on top of it, hding it
        // return 1

        return paintOrderFunction(a) - paintOrderFunction(b);
        // TODO to halve calculations it would be possible to map features to values,
        // and sort that values, right? Or maybe not...
      }
    }

    function update3Map(geoGenerator, used_data, selector) {
      var u = d3.select(selector) // should use selector
        .selectAll('path')
        .data(used_data.features);
    
      u.enter()
        .append('path')
        .attr('d', geoGenerator)
        .attr("stroke", mapStyle.strokeColoring)
          .attr("stroke-width", mapStyle.strokeWidth)
          .attr("fill", mapStyle.fillColoring)
          //.attr("name", mapStyle.name) - note that passing name with & breaks SVG (at least more fragile ones) - TODO: fix and reenable or drop that
    }
    
    
      function download(filename, text) {
        var element = document.createElement('a');
        element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
        element.setAttribute('download', filename);
      
        element.style.display = 'none';
        document.body.appendChild(element);
      
        element.click();
      
        document.body.removeChild(element);
      }