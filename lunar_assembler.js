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

// TODO eliminate this global variables
const predictedTimeInSeconds = 35;
var completed = false;
var doneInPercents = 0;
const timeBetweenUpdatesInSeconds = 0.1;
const updateCount = predictedTimeInSeconds / timeBetweenUpdatesInSeconds;
const incrementOnUpdateBy = 100 / updateCount;
let progressBar;
let handleOfProgressBarAnimation;

// TODO handle config in a better way
var logOutputIdConfig;

function initializeLunarAssembler({
  mapStyles,
  mapDivId,
  downloadTriggerId,
  progressBarId,
  mapOutputHolderId,
  logOutputId,
  lat,
  lon,
  zoom,
} = {}) {
  //document.getElementById(logOutputId).innerHTML = "Hello world!"
  initializeSelectorMap(mapStyles, mapDivId, lat, lon, zoom, downloadTriggerId, mapOutputHolderId);
  initilizeDownloadButton(downloadTriggerId, mapOutputHolderId);
  progressBar = document.getElementById(progressBarId);
  logOutputIdConfig = logOutputId;
}

function showFatalError(message) {
  showError(message);
  alert(message);
}

function showError(message) {
  console.error(message);
  document.getElementById(logOutputIdConfig).innerHTML += '<p class="logged error">' + message + "</p>";
}

function showWarning(message) {
  console.warn(message);
  document.getElementById(logOutputIdConfig).innerHTML += '<p class="logged warning">' + message + "</p>";
}

function reportBugMessage() {
  return " this is a bug, please report to https://github.com/matkoniecz/lunar_assembler/issues";
}

function reportBugMessageButGeodataMayBeWrong() {
  return " something went wrong. If OpenStreetMap data is correct here, then this is a bug, please report to https://github.com/matkoniecz/lunar_assembler/issues";
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
  if (doneInPercents >= 100) {
    doneInPercents = 100;
  }
  progressBar.value = doneInPercents;
}

function markAsCompleted() {
  setProgressValue(100);
  completed = true;
}

function markAsFailed() {
  clearInterval(handleOfProgressBarAnimation); // terminates
  setProgressValue(0);
}

function startShowingProgress() {
  doneInPercents = 0;
  completed = false;
  handleOfProgressBarAnimation = setInterval(() => {
    if (completed) {
      clearInterval(handleOfProgressBarAnimation); // terminates
    } else {
      var progress = doneInPercents + incrementOnUpdateBy;
      if (progress > 95) {
        progress = 10;
      }
      setProgressValue(progress);
    }
  }, timeBetweenUpdatesInSeconds * 1000);
}

// end of progress bar fun
//////////////////////////////////////////////////////////////////////////////////////////

function initializeSelectorMap(
  mapStyles,
  mapDivId,
  lat,
  lon,
  zoom,
  downloadTriggerId,
  mapOutputHolderId
) {
  var map = L.map(mapDivId).setView([lat, lon], zoom);
  var mapLink = '<a href="https://openstreetmap.org">OpenStreetMap</a>';
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "&copy; " + mapLink + " Contributors",
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
      circlemarker: false,
    },
  });
  map.addControl(drawControl);

  map.on("draw:created", function (e) {
    var type = e.layerType,
      layer = e.layer;
    corners = layer.getLatLngs();

    drawnItems.addLayer(layer);

    var bounds = layer.getBounds();
    var readableBounds = { west: bounds.getWest(), south: bounds.getSouth(), east: bounds.getEast(), north: bounds.getNorth() };
    handleTriggerFromGUI(readableBounds, downloadTriggerId, mapOutputHolderId, mapStyles[0]); // TODO handle passing more than one map style!
  });

  var queryString = location.search;
  let params = new URLSearchParams(queryString);
  if (params.get("rerun_query") == "yes") {
    // parameters (technically still GUI, right) requested running query immediately
    const bounds = JSON.parse(params.get("bounds"));
    const centerLat = (bounds["north"] + bounds["south"]) / 2;
    const centerLon = (bounds["east"] + bounds["west"]) / 2;
    map.panTo(new L.LatLng(centerLat, centerLon));
    handleTriggerFromGUI(bounds, downloadTriggerId, mapOutputHolderId, mapStyles[0]);
  }
}

function initilizeDownloadButton(downloadTriggerId, mapOutputHolderId) {
  d3.select("#" + downloadTriggerId).on("click", function () {
    download("generated.svg", document.getElementById(idOfGeneratedMap()).outerHTML);
  });
}

async function handleTriggerFromGUI(readableBounds, downloadTriggerId, mapOutputHolderId, mapStyle) {
  startShowingProgress();
  let osmJSON = await downloadOpenStreetMapData(readableBounds); // https://leafletjs.com/reference-1.6.0.html#latlngbounds-getcenter
  if (osmJSON == -1) {
    console.log("FAILURE of download!");
    markAsFailed();
    showFatalError(
      "Overpass API refused to provide data. Either selected area was too large, or you exceed usage limit of that free service. Please wait a bit and retry. Overpass API is used to get data from OpenStreetMap for a given area."
    );
    return;
  }
  let geoJSON = toGeoJSON(osmJSON);
  const width = 800;
  const height = 600;
  render(readableBounds, geoJSON, width, height, mapStyle, mapOutputHolderId);
  document.getElementById(downloadTriggerId).style.display = "";
  document.getElementById("instruction_hidden_after_first_generation").style.display = "none";
  markAsCompleted();
  var generated = '<a href="?rerun_query=yes&bounds=' + encodeURIComponent(JSON.stringify(readableBounds)) + '">link to repeat this query</a>';
  document.getElementById("redo_link_holder").innerHTML = generated;
}

function geoJSONPolygonRepresentingBBox(readableBounds) {
  var west = readableBounds["west"];
  var south = readableBounds["south"];
  var east = readableBounds["east"];
  var north = readableBounds["north"];
  return {
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        properties: {},
        geometry: {
          type: "Polygon",
          coordinates: [
            [
              [west, south],
              [east, south],
              [east, north],
              [west, north],
              [west, south],
            ],
          ],
        },
      },
    ],
  };
}

// downloading OSM data
async function downloadOpenStreetMapData(readableBounds) {
  // https://leafletjs.com/reference-1.6.0.html#latlngbounds-getcenter
  query = "";
  // note: extra filters will break data in case of some bad/poor/substandard tagging or where someone want this kind of data
  // extra filters are useful to reduce data overload during debugging, often bug is reproducible in their presence
  var extra_filters = "[type!=site][type!=route][type!=parking_fee][type!=waterway][type!=boundary][boundary!=administrative][boundary!=religious_administration]";
  query += "[out:json][timeout:25];nwr" + extra_filters + "(";
  query += readableBounds["south"];
  query += ",";
  query += readableBounds["west"];
  query += ",";
  query += readableBounds["north"];
  query += ",";
  query += readableBounds["east"];
  query += ");";
  query += "out body;>;out skel qt;";
  console.log("overpass query in the next line:");
  console.log(query);

  const response = await fetch("https://overpass-api.de/api/interpreter", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
      // considered adding also deployed at ' + window.location.href + ' -
      // but it may leak private data
      "User-Agent": "lunar_assembler SVG generator - please contact Mateusz Konieczny matkoniecz@gmail.com (library author) or website operator if usage is causing any issues",
    },
    body: new URLSearchParams({ data: query }),
  }).catch((err) => {
    showFatalError(err);
    console.log(err.response.data);
    return -1;
  });
  if (response.ok) {
    const responseData = response.json();
    const osmJSON = responseData;
    return osmJSON;
  } else {
    return -1; // is there a better way to handle failures? throw exception? From looking at https://stackoverflow.com/a/27724419/4130619 code for that would be even worse
  }
}
function toGeoJSON(osmJSON) {
  let geoJSON = osmtogeojson(osmJSON);
  return geoJSON;
}

function isMultipolygonAsExpected(feature) {
  if (isAreaAsExpected(feature) == false) {
    return false;
  }
  if (feature.geometry.type == "Polygon") {
    showError("UNEXPECTED " + feature.geometry.type + " in " + JSON.stringify(feature) + reportBugMessage());
    return false;
  }
  return true;
}

function isAreaAsExpected(feature) {
  if (feature == undefined) {
    showError("UNEXPECTED undefined" + " in " + JSON.stringify(feature) + reportBugMessage());
    return false;
  }
  if (feature.geometry.type == "Point" || feature.geometry.type === "MultiPoint") {
    showError("UNEXPECTED " + feature.geometry.type + " in " + JSON.stringify(feature) + +reportBugMessage());
    return false;
  } else if (feature.geometry.type == "LineString" || feature.geometry.type == "MultiLineString") {
    showError("UNEXPECTED " + feature.geometry.type + " in " + JSON.stringify(feature) + +reportBugMessage());
    return false;
  } else if (feature.geometry.type == "Polygon") {
    return true;
  } else if (feature.geometry.type == "MultiPolygon") {
    return true;
  }
  showError("UNEXPECTED GEOMETRY " + feature.geometry.type + reportBugMessage());
  return false;
}
// TODO: what kind of geojson is accepted here? will it crash when I pass a point here?
function rewind(geojson_that_is_7946_compliant_with_right_hand_winding_order) {
  // ARGHHHHHH ARGHHHHHH ARGHHHH
  // https://gis.stackexchange.com/questions/392452/why-d3-js-works-only-with-geojson-violating-right-hand-rule
  // I opened https://github.com/d3/d3-shape/issues/178

  if (geojson_that_is_7946_compliant_with_right_hand_winding_order.length == 1) {
    console.warn("one element! Is spread working as expected? See #68"); // TODO - trigger and debug it
  }

  const d3_geojson = {
    ...geojson_that_is_7946_compliant_with_right_hand_winding_order,
  };
  d3_geojson.features = d3_geojson.features.map((f) => {
    return turf.rewind(f, { reverse: true });
  });
  return d3_geojson;
}

function render(readableBounds, dataGeojson, width, height, mapStyle, mapOutputHolderId) {
  if ("transformGeometryAsInitialStep" in mapStyle) {
    dataGeojson = mapStyle.transformGeometryAsInitialStep(dataGeojson, readableBounds);
  }
  validateGeometries(dataGeojson);
  dataGeojson = mergeAsRequestedByMapStyle(dataGeojson, mapStyle);
  if ("transformGeometryAtFinalStep" in mapStyle) {
    dataGeojson = mapStyle.transformGeometryAtFinalStep(dataGeojson, readableBounds);
  }
  dataGeojson = clipGeometries(readableBounds, dataGeojson);
  renderUsingD3(readableBounds, dataGeojson, width, height, mapStyle, mapOutputHolderId);
}

function validateGeometries(dataGeojson) {
  var i = dataGeojson.features.length;
  while (i--) {
    var feature = dataGeojson.features[i];
    if (feature.geometry == undefined) {
      var warning = "broken feature, geometry is missing!";
      showError(warning + JSON.stringify(feature) + reportBugMessage());
      console.warn(warning);
      console.warn(feature);
    }
  }
}

function mergeAsRequestedByMapStyle(dataGeojson, mapStyle) {
  if (("mergeIntoGroup" in mapStyle) == false) {
    return dataGeojson;
  }
  var i = dataGeojson.features.length;
  var processeedFeatures = [];
  var mergingGroups = {};
  while (i--) {
    var feature = dataGeojson.features[i];
    if (feature.geometry.type == "Point" || feature.geometry.type === "MultiPoint") {
      // skipping handling them for now
      // once point rendering will appear something will need to be done with it
      processeedFeatures.push(feature);
    } else if (feature.geometry.type == "LineString" || feature.geometry.type == "MultiLineString") {
      // also not supported, lines are not being merged for now
      processeedFeatures.push(feature);
    } else if (feature.geometry.type == "Polygon" || feature.geometry.type == "MultiPolygon") {
      const mergeGroup = mapStyle.mergeIntoGroup(feature);
      if (mergeGroup === null) {
        processeedFeatures.push(feature);
      } else {
        if (mergingGroups[mergeGroup] === undefined) {
          mergingGroups[mergeGroup] = [];
        }
        mergingGroups[mergeGroup].push(feature);
      }
    } else {
      processeedFeatures.push(feature);
      console.error("very unexpected " + feature.geometry.type + " appeared in mergeAsRequestedByMapStyle, logging its data <");
      console.error(feature);
      console.error("> LOGGED");
    }
  }
  keys = Object.keys(mergingGroups);
  for (var i = 0; i < keys.length; i++) {
    const key = keys[i];
    const forMerging = mergingGroups[key];
    // TODO: how to deal with tag values? I will just take the first object
    var produced = forMerging[0];
    var coordinatesForMerging = [];
    for (var k = 0; k < forMerging.length; k++) {
      if (isAreaAsExpected(forMerging[k]) == false) {
        console.error("================================");
        console.error("expected area, got not area, something want wrong, this is a bug!");
        console.error(forMerging[k]);
        console.error("please report it on https://github.com/matkoniecz/lunar_assembler/issues ");
        console.error("================================");
      }
      coordinatesForMerging.push(forMerging[k].geometry.coordinates);
    }
    // it is union so output will be nonepty
    // https://github.com/mfogel/polygon-clipping#output
    produced.geometry.type = "MultiPolygon";
    if (coordinatesForMerging.length == 1) {
      // adding it fixed crashing on empty areas for laser map style and private/public areas
      // https://github.com/matkoniecz/lunar_assembler/issues/68
      // necessary as ... will go multiple levels deep to decompose single element array
      // for some Godforsaken reason
      produced.geometry.coordinates = polygonClipping.union(coordinatesForMerging);
      // uncomment below code to crash again
      // console.log(coordinatesForMerging)
      // console.log(...coordinatesForMerging)
      //produced.geometry.coordinates = polygonClipping.union(...coordinatesForMerging);
    } else {
      produced.geometry.coordinates = polygonClipping.union(...coordinatesForMerging);
    }
    produced.properties["lunar_assembler_merge_group"] = key;
    processeedFeatures.push(produced);
  }
  dataGeojson.features = processeedFeatures;
  return dataGeojson;
}

// for searching: crop
function clipGeometries(readableBounds, dataGeojson) {
  var west = readableBounds["west"];
  var south = readableBounds["south"];
  var east = readableBounds["east"];
  var north = readableBounds["north"];
  var bbox = [west, south, east, north];
  var i = dataGeojson.features.length;
  var survivingFeatures = [];
  while (i--) {
    // once point rendering will appear something
    // like https://www.npmjs.com/package/@turf/boolean-point-in-polygon
    // will need to be used
    var feature = dataGeojson.features[i];
    if (feature.geometry.type != "Point" && feature.geometry.type != "MultiPoint") {
      feature.geometry = turf.bboxClip(feature.geometry, bbox).geometry;
    }
    var filtered = dropDegenerateGeometrySegments(feature);
    if (filtered != null) {
      survivingFeatures.push(feature);
    }
  }
  dataGeojson.features = survivingFeatures;
  return dataGeojson;
}

function dropDegenerateGeometrySegments(feature) {
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
    var survivingGeometryParts = [];
    var k = feature.geometry.coordinates.length;
    while (k--) {
      var geometryPart = feature.geometry.coordinates[k];
      if (geometryPart.length != 0) {
        /* in js [] != [] */ survivingGeometryParts.push(geometryPart);
      }
    }
    if (survivingGeometryParts.length == 0) {
      return null;
    } else {
      feature.geometry.coordinates = survivingGeometryParts;
    }
  }
  return feature;
}
function renderUsingD3(readableBounds, dataGeojson, width, height, mapStyle, mapOutputHolderId) {
  var geoJSONRepresentingBoundaries = geoJSONPolygonRepresentingBBox(readableBounds);
  // rewinding is sometimes needed, sometimes not
  // rewinding is sometimes broken in my code (at least in oce case it was borked by my bug in futher processing!), sometimes not
  // see https://gis.stackexchange.com/questions/392452/why-d3-js-works-only-with-geojson-violating-right-hand-rule
  // not sure what is going on here

  console.log("dataGeojson in the next line (before d3 rewind):");
  console.log(JSON.stringify(dataGeojson));
  var d3_dataGeojson = rewind(dataGeojson);
  var d3_geoJSONRepresentingBoundaries = rewind(geoJSONRepresentingBoundaries);
  console.log("dataGeojson in the next line (after d3 rewind):");
  console.log(JSON.stringify(d3_dataGeojson));

  var projection = d3
    .geoMercator()
    .fitSize([width, height], d3_geoJSONRepresentingBoundaries);

  var geoGenerator = d3.geoPath().projection(projection);

  selector = "#" + mapOutputHolderId + " svg";
  let generated =
    '<svg xmlns="http://www.w3.org/2000/svg" id="' + idOfGeneratedMap() + '" height="100%" width="100%" viewBox="0 0 ' +
    width +
    " " +
    height +
    '">' +
    "\n" +
    "</svg>" +
    "\n" +
    '<div id="redo_link_holder"><div/>';
  document.getElementById(mapOutputHolderId).innerHTML = generated;

  // turn function returning value (layering order of function)
  // into function taking two features and ordering them
  var compareFunction = makeCompareFunctionForLayering(mapStyle.paintOrder);
  d3_dataGeojson.features.sort(compareFunction);
  console.log(d3_dataGeojson.features);
  update3Map(geoGenerator, d3_dataGeojson, selector, mapStyle);
}

function idOfGeneratedMap() {
  return "mapGeneratedFromOpenStreetMap data";
}
function makeCompareFunctionForLayering(paintOrderFunction) {
  // paintOrderFunction takes feature as input and outputs number
  // higher number - more on top
  return function (a, b) {
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
  };
}

function update3Map(geoGenerator, used_data, selector, mapStyle) {
  var u = d3
    .select(selector)
    .selectAll("path")
    .data(used_data.features);

  u.enter()
    .append("path")
    .attr("d", geoGenerator)
    .attr("stroke", mapStyle.strokeColoring)
    .attr("stroke-width", mapStyle.strokeWidth)
    .attr("fill", mapStyle.fillColoring);
  //.attr("name", mapStyle.name) - note that passing name with & breaks SVG (at least more fragile ones) - TODO: fix and reenable or drop that
}

function download(filename, text) {
  var element = document.createElement("a");
  element.setAttribute("href", "data:text/plain;charset=utf-8," + encodeURIComponent(text));
  element.setAttribute("download", filename);

  element.style.display = "none";
  document.body.appendChild(element);

  element.click();

  document.body.removeChild(element);
}
