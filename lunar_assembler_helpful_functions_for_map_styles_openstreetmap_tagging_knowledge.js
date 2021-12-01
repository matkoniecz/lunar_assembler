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

function motorizedRoadValuesArray() {
  return [
    "motorway",
    "motorway_link",
    "trunk",
    "trunk_link",
    "primary",
    "primary_link",
    "secondary",
    "secondary_link",
    "tertiary",
    "tertiary_link",
    "unclassified",
    "residential",
    "service",
    "track",
    "road",
    "busway",
    "raceway",
    "escape",
    "living_street",
  ];
}

function railwayLinearValuesArray() {
  return [
    "rail",
    "disused",
    "tram",
    "subway",
    "narrow_gauge",
    "light_rail",
    "preserved",
    "construction",
    "miniature",
    "monorail",
  ];
}

function pedestrianWaysValuesArray() {
  return [
    "footway",
    "path",
    "steps",
    "pedestrian",
  ];
}

function linearGenerallyImpassableBarrierValuesArray() {
  // kerb intentionally skipped
  return ["fence", "wall", "hedge", "retaining_wall", "hedge_bank", "wire_fence", "city_wall", "guard_rail", "haha"];
}

function widthsOfParkingLanes() {
  return {
    parallel: 3,
    diagonal: 5,
    perpendicular: 6.5,
    marked: 3, // may be also perpendicular or diagonal but that info is lost...
    no_parking: 0,
    no_stopping: 0,
    fire_lane: 0,
    no: 0,
    // separate - ???
  };
}

function isSimplePositiveInteger(str) {
  // https://stackoverflow.com/questions/10834796/validate-that-a-string-is-a-positive-integer
  // I believe that this snippet is below threshold of originality
  var n = Math.floor(Number(str));
  return n !== Infinity && String(n) === str && n > 0;
}

function getDrivingLaneCount(feature) {
  if (feature.properties["lanes"] == undefined) {
    return undefined;
  }
  if (!isSimplePositiveInteger(feature.properties["lanes"])) {
    showError("Unexpected lane format lanes=" + feature.properties["lanes"] + " in " + JSON.stringify(feature) + reportBugMessage());
    return undefined;
  }
  return Number(feature.properties["lanes"]);
}

function getParkingLaneWidthInLaneEquivalentForGivenSide(side, feature) {
  var matchingCodeToWidthInMeters = widthsOfParkingLanes();
  var value = undefined;
  if (feature.properties["parking:lane:both"] != undefined) {
    value = feature.properties["parking:lane:both"];
  }
  if (feature.properties["parking:lane:" + side] != undefined) {
    if (value != undefined) {
      showError("both parking:lane:both and parking:lane:" + side + " set for " + JSON.stringify(feature) + reportBugMessage());
    }
    value = feature.properties["parking:lane:" + side];
  }
  if (value == undefined) {
    return undefined;
  }
  if (value in matchingCodeToWidthInMeters) {
    return matchingCodeToWidthInMeters[value];
  } else {
    showError("unexpected unhandled code " + value + " for " + side + " parking lane in " + JSON.stringify(feature) + reportBugMessage());
    return undefined;
  }
}

function getParkingLaneWidthInLaneEquivalent(feature) {
  /*
  there is parallel, diagonal and perpendicular parking
  the width varies between them
  */
  var left = getParkingLaneWidthInLaneEquivalentForGivenSide("left", feature);
  var right = getParkingLaneWidthInLaneEquivalentForGivenSide("right", feature);
  if (left == undefined || right == undefined) {
    if (left == undefined && right == undefined) {
      return undefined;
    } else {
      // assume that in such case user tagged known sides
      if (left == undefined) {
        left = 0;
      }
      if (right == undefined) {
        right = 0;
      }
    }
  }
  return (left + right) / 3;
}

function getTotalKnownLaneCount(feature) {
  var drivingLanes = getDrivingLaneCount(feature);
  var parkingLanes = getParkingLaneWidthInLaneEquivalent(feature);
  if (drivingLanes == undefined && parkingLanes == undefined) {
    return undefined;
  }
  if (drivingLanes != undefined && parkingLanes != undefined) {
    return drivingLanes + parkingLanes;
  }
  if (drivingLanes != undefined) {
    if(feature.properties['highway'] == 'service') {
      //do not assume that it means that no parking lanes are tagged
      return drivingLanes;
    }
    // assume that it means that no parking lanes are tagged
    return drivingLanes + 2;
  }
  if (parkingLanes != undefined) {
    // I assume that it will happen on minor city roads
    return parkingLanes + 1;
  }
  showFatalError("This should never happen, getTotalKnownLaneCount failed");
}

function creditsForLaneWidthInMapStyle(automatically_generated_using_array) {
  automatically_generated_using_array.push({ key: "lanes", purpose: "estimating road width" });
  for (const tag_key of ["parking:lane:both", "parking:lane:left", "parking:lane:right"]) {
    for (const [tag_value, _width_of_parking_lane] of Object.entries(widthsOfParkingLanes())) {
      automatically_generated_using_array.push({ key: tag_key, value: tag_value, purpose: "estimating road width" });
    }
  }
  automatically_generated_using_array.push({ key: "oneway", value: "yes", purpose: "estimating road width" });
  automatically_generated_using_array.push({ key: "oneway", value: "-1", purpose: "estimating road width" });
  return automatically_generated_using_array;
}
