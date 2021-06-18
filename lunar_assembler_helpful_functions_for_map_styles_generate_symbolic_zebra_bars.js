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

function generateZebraBarCrossings(dataGeojson, roadAreaWithCrossing) {
  // check is roadAreaWithCrossing defined
  crossingLines = listUnifiedCrossingLines(dataGeojson);
  var i = crossingLines.length;
  while (i--) {
    var feature = crossingLines[i];
    // startEndOfActualCrossing is necessary as sometimes footway=crossing is applied between sidewalks, including segment outside road area
    // also, this allows to catch unsupported cases (one footway=crossing across independent crossings or split footway=crossing line)
    // and invalid OpenStreetMap data (like footway=crossing shorter than actual crossing or footway=crossing outside crossings)
    var startEndOfActualCrossing = turf.lineIntersect(roadAreaWithCrossing, feature);
    if (startEndOfActualCrossing.features.length != 2) {
      const link = "https://www.openstreetmap.org/" + feature.id;
      showFatalError(
        link +
          " is unexpectedly crossing with road area not exactly two times but " +
          startEndOfActualCrossing.features.length +
          " times, which is unhandled" +
          reportBugMessageButGeodataMayBeWrong()
      );
    }
    if (startEndOfActualCrossing.features.length < 2) {
      // skipping, generation impossible
      continue;
    }

    // always three strips, change later if needed
    // so
    // 1st empty space
    // 1st strip
    // 2nd empty space
    // 2nd strip
    // 3rd empty space
    // 3rd strip
    // 4th empty space
    //
    // so we need to split distance in 7
    var point1 = startEndOfActualCrossing.features[0].geometry.coordinates;
    var point2 = startEndOfActualCrossing.features[1].geometry.coordinates;
    dataGeojson.features.push(makeBarOfZebraCrossing(roadAreaWithCrossing, point1, point2, 1 / 7, 2 / 7));
    dataGeojson.features.push(makeBarOfZebraCrossing(roadAreaWithCrossing, point1, point2, 3 / 7, 4 / 7));
    dataGeojson.features.push(makeBarOfZebraCrossing(roadAreaWithCrossing, point1, point2, 5 / 7, 6 / 7));
  }
  return dataGeojson;
}

function listUnifiedCrossingLines(dataGeojson) {
  var i = dataGeojson.features.length;
  var crossingLines = [];
  while (i--) {
    var feature = dataGeojson.features[i];
    if (feature.properties["footway"] == "crossing" && feature.properties["area:highway_generated_automatically"] != "yes") {
      crossingLines.push(JSON.parse(JSON.stringify(feature)));
    }
  }
  var oldCount = undefined;
  while (oldCount != crossingLines.length) {
    // lets imagine case
    // aaaa x cccc x bbbb
    // aaaa joins cccc
    // cccc joins bbbb
    // aaaa is not merged with bbbb
    // aaaa is merged with cccc
    // end of a single run is
    // aaaaaaaaa x bbbbb
    //
    // so either smarter algorithm or rerunning is needed
    oldCount = crossingLines.length;
    crossingLines = unifyCrossings(crossingLines);
  }
  return crossingLines;
}

function unifyCrossings(crossingLines) {
  // TODO - merge split crossings to prevent warnings above
  var i = -1;
  while (i + 1 < crossingLines.length) {
    i++;
    var k = i;
    while (k + 1 < crossingLines.length) {
      k++;
      var feature = crossingLines[i];
      var possiblyMatching = crossingLines[k];
      const link1 = "https://www.openstreetmap.org/" + feature.id;
      const link2 = "https://www.openstreetmap.org/" + possiblyMatching.id;
      var coordsOfCandidate = possiblyMatching.geometry.coordinates;
      if (isTheSameJSON(feature.geometry.coordinates[0], coordsOfCandidate[0])) {
        feature.geometry.coordinates.reverse();
        coordsOfCandidate.shift();
        feature.geometry.coordinates.push(...coordsOfCandidate);
        crossingLines.splice(k, 1); // remove matching element
        //showFatalError("merge 0-0 " + link1 + " " + link2 + " " + JSON.stringify(feature))
      } else if (isTheSameJSON(feature.geometry.coordinates[0], coordsOfCandidate[coordsOfCandidate.length - 1])) {
        feature.geometry.coordinates.reverse();
        coordsOfCandidate.reverse();
        coordsOfCandidate.shift();
        feature.geometry.coordinates.push(...coordsOfCandidate);
        crossingLines.splice(k, 1); // remove matching element
        //showFatalError("merge 0-last " + link1 + " " + link2 + " " + JSON.stringify(feature))
      } else if (isTheSameJSON(feature.geometry.coordinates[feature.geometry.coordinates.length - 1], coordsOfCandidate[coordsOfCandidate.length - 1])) {
        coordsOfCandidate.reverse();
        coordsOfCandidate.shift();
        feature.geometry.coordinates.push(...coordsOfCandidate);
        crossingLines.splice(k, 1); // remove matching element
        //showFatalError("merge last-last " + link1 + " " + link2 + " " + JSON.stringify(feature))
      } else if (isTheSameJSON(feature.geometry.coordinates[feature.geometry.coordinates.length - 1], coordsOfCandidate[0])) {
        coordsOfCandidate.shift();
        feature.geometry.coordinates.push(...coordsOfCandidate);
        crossingLines.splice(k, 1); // remove matching element
        //showFatalError("merge last-0 " + link1 + " " + link2 + " " + JSON.stringify(feature))
      } else {
        /*
        showError("================")
        showWarning((feature.geometry.coordinates[0] == coordsOfCandidate[0]) )
        showError("-------------------")
        showWarning(feature.geometry.coordinates[0] == coordsOfCandidate[coordsOfCandidate.length - 1])
        showWarning(feature.geometry.coordinates[0][0] == coordsOfCandidate[coordsOfCandidate.length - 1][0])
        showWarning(feature.geometry.coordinates[0][1] == coordsOfCandidate[coordsOfCandidate.length - 1][1])
        showError("-------------------")
        showWarning(feature.geometry.coordinates[feature.geometry.coordinates.length - 1] == coordsOfCandidate[coordsOfCandidate.length - 1])
        showError("-------------------")
        showWarning(feature.geometry.coordinates[feature.geometry.coordinates.length - 1] == coordsOfCandidate[0])
        showError("-------------------")
        showError("")
        showWarning(link1)
        showError(feature.geometry.coordinates[0])
        showError(feature.geometry.coordinates[feature.geometry.coordinates.length - 1])
        showError("")
        showWarning(link2)
        showError(coordsOfCandidate[0])
        showError(coordsOfCandidate[coordsOfCandidate.length - 1])
        showError("================")
        */
      }
    }
  }
  return crossingLines;
}

function isTheSameJSON(pointA, pointB) {
  return JSON.stringify(pointA) === JSON.stringify(pointB);
}

function makeBarOfZebraCrossing(roadAreaWithCrossing, start, end, fractionOfCrossingForBarStart, fractionOfCrossingForBarEnd) {
  var bearingOfCrossing = turf.bearing(start, end);
  var lonDiff = end[0] - start[0];
  var latDiff = end[1] - start[1];

  var startOnCenterline = JSON.parse(JSON.stringify(start));
  startOnCenterline[0] += lonDiff * fractionOfCrossingForBarStart;
  startOnCenterline[1] += latDiff * fractionOfCrossingForBarStart;

  var endOnCenterline = JSON.parse(JSON.stringify(start));
  endOnCenterline[0] += lonDiff * fractionOfCrossingForBarEnd;
  endOnCenterline[1] += latDiff * fractionOfCrossingForBarEnd;

  var distance = 10;
  var options = { units: "meters" };
  var offset1From = turf.destination(startOnCenterline, distance, bearingOfCrossing + 90, options);
  var offset1To = turf.destination(endOnCenterline, distance, bearingOfCrossing + 90, options);

  var offset2From = turf.destination(startOnCenterline, distance, bearingOfCrossing - 90, options);
  var offset2To = turf.destination(endOnCenterline, distance, bearingOfCrossing - 90, options);
  console.log();
  console.log("bar");
  var geometry_of_bar = {
    type: "Polygon",
    coordinates: [[offset1From.geometry.coordinates, offset1To.geometry.coordinates, offset2To.geometry.coordinates, offset2From.geometry.coordinates, offset1From.geometry.coordinates]],
  };
  geometry_of_bar.coordinates = polygonClipping.intersection(geometry_of_bar.coordinates, roadAreaWithCrossing.geometry.coordinates);
  geometry_of_bar.type = "MultiPolygon";
  console.log(geometry_of_bar);
  return { type: "Feature", geometry: geometry_of_bar, properties: { zebra_crossing_bar_generated_by_lunar_assembler: "yes" } };
}

