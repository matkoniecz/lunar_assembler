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

function intersectGeometryWithHorizontalStripes(feature, stripeSizeInDegrees, distanceBetweenStripesInDegrees) {
  bbox = turf.bbox(feature);
  var minLongitude = bbox[0];
  var minLatitude = bbox[1];
  var maxLongitude = bbox[2];
  var maxLatitude = bbox[3];
  if (!isMultipolygonAsExpected(feature)) {
    return null;
  }
  var collected = [];
  // gathering horizontal stripes
  var minLatitudeForStripe = minLatitude;
  while (minLatitudeForStripe < maxLatitude) {
    var maxLatitudeForStripe = minLatitudeForStripe + stripeSizeInDegrees;
    var stripeRing = [
      [minLongitude, minLatitudeForStripe],
      [maxLongitude, minLatitudeForStripe],
      [maxLongitude, maxLatitudeForStripe],
      [minLongitude, maxLatitudeForStripe],
      [minLongitude, minLatitudeForStripe],
    ];
    var stripe = [stripeRing];
    var intersectedStripe = polygonClipping.intersection(feature.geometry.coordinates, stripe);
    if (intersectedStripe != []) {
      collected.push(intersectedStripe);
    }
    minLatitudeForStripe += stripeSizeInDegrees + distanceBetweenStripesInDegrees;
  }
  if(collected.length == 1) {
    console.warn("one element! Is spread working as expected? See #68") // TODO - trigger and debug it
  }
  var generated = polygonClipping.union(...collected);

  var cloned = JSON.parse(JSON.stringify(feature));
  cloned.geometry.coordinates = generated;
  return cloned;
}

function intersectGeometryWithPlaneHavingRectangularHoles(feature, holeVerticalInDegrees, holeHorizontalInDegrees, spaceVerticalInDegrees, spaceHorizontalInDegrees) {
  bbox = turf.bbox(feature);
  var minLongitude = bbox[0];
  var minLatitude = bbox[1];
  var maxLongitude = bbox[2];
  var maxLatitude = bbox[3];
  if (!isMultipolygonAsExpected(feature)) {
    return null;
  }
  var collected = [];
  // gathering horizontal stripes
  var minLatitudeForStripe = minLatitude;
  while (minLatitudeForStripe < maxLatitude) {
    var maxLatitudeForStripe = minLatitudeForStripe + spaceVerticalInDegrees;
    var stripeRing = [
      [minLongitude, minLatitudeForStripe],
      [maxLongitude, minLatitudeForStripe],
      [maxLongitude, maxLatitudeForStripe],
      [minLongitude, maxLatitudeForStripe],
      [minLongitude, minLatitudeForStripe],
    ];
    var stripe = [stripeRing];
    var intersectedStripe = polygonClipping.intersection(feature.geometry.coordinates, stripe);
    if (intersectedStripe.length > 0) {
      collected.push(intersectedStripe);
    }
    minLatitudeForStripe += spaceVerticalInDegrees + holeVerticalInDegrees;
  }
  if(collected.length == 1) {
    console.warn("one element! Is spread working as expected? See #68") // TODO - trigger and debug it
  }
  // split in pairs due to https://github.com/mfogel/polygon-clipping/issues/118
  var generatedHorizontal = polygonClipping.union(...collected);
  collected = [];

  // gathering vertical stripes
  var minLongitudeForStripe = minLongitude;
  while (minLongitudeForStripe < maxLongitude) {
    var maxLongitudeForStripe = minLongitudeForStripe + spaceHorizontalInDegrees;
    var stripeRing = [
      [minLongitudeForStripe, minLatitude],
      [maxLongitudeForStripe, minLatitude],
      [maxLongitudeForStripe, maxLatitude],
      [minLongitudeForStripe, maxLatitude],
      [minLongitudeForStripe, minLatitude],
    ];
    var stripe = [stripeRing];
    var intersectedStripe = polygonClipping.intersection(feature.geometry.coordinates, stripe);
    if (intersectedStripe.length > 0) {
      collected.push(intersectedStripe);
    }
    minLongitudeForStripe += spaceHorizontalInDegrees + holeHorizontalInDegrees;
  }
  if(collected.length == 1) {
    console.warn("one element! Is spread working as expected? See #68") // TODO - trigger and debug it
  }
  var generatedVertical = polygonClipping.union(...collected);
  var generated = polygonClipping.union(generatedHorizontal, generatedVertical);

  var cloned = JSON.parse(JSON.stringify(feature));
  cloned.geometry.coordinates = generated;
  return cloned;
}
