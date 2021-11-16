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

// for use in unified map style, this allows to avoid a pointess duplications
function unifiedMapStyleSegmentForSymbolicStepRepresentation() {
  const stepGenerationExplanation = [
    { key: "area:highway", value: "steps", purpose: "area of steps, for an automatic generation of a symbolic representation" },
    { key: "highway", value: "steps", purpose: "detecting upper/lower side of steps, for an automatic generation of a symbolic representation" },
    { key: "incline", value: "up", purpose: "detecting upper/lower side of steps, for an automatic generation of a symbolic representation" },
    { key: "incline", value: "down", purpose: "detecting upper/lower side of steps, for an automatic generation of a symbolic representation" },
  ];
  return [
    {
      area_color: "#400080",
      description: "step segment, part of a symbolic steps representation - automatically generated (the lowest one, 4th from the top)",
      automatically_generated_using: stepGenerationExplanation,
      matches: [{ key: "lunar_assembler_step_segment", value: "0" }],
    },
    {
      area_color: "magenta",
      description: "step segment, part of a symbolic steps representation - automatically generated (2nd from the bottom, 3rd from the top)",
      automatically_generated_using: stepGenerationExplanation,
      matches: [{ key: "lunar_assembler_step_segment", value: "1" }],
    },
    {
      area_color: "#ff0000",
      description: "step segment, part of symbolic steps representation - automatically generated (3rd from the bottom, 2nd from the top)",
      automatically_generated_using: stepGenerationExplanation,
      matches: [{ key: "lunar_assembler_step_segment", value: "2" }],
    },
    {
      area_color: "#D33F6A",
      description: "step segment - automatically generated - automatically generated (4th from the bottom, the highest one)",
      automatically_generated_using: stepGenerationExplanation,
      matches: [{ key: "lunar_assembler_step_segment", value: "3" }],
    },
  ];
}

function programaticallyGenerateSymbolicStepParts(dataGeojson) {
  var pointsInSteps = dataToListOfPositionOfStepsNodes(dataGeojson);
  var i = dataGeojson.features.length;
  var generatedFeatures = [];
  while (i--) {
    var feature = dataGeojson.features[i];
    const link = "https://www.openstreetmap.org/" + feature.id;
    if (feature.properties["area:highway"] != "steps") {
      continue;
    }
    const rings = feature.geometry.coordinates.length;
    if (rings != 1) {
      showError(
        "untested for polygons with holes. And it seems that it should be represented as two highway=steps and two area:highway anyway. See " +
          link +
          "\nIf OSM data is correct and output is broken, please report to https://github.com/matkoniecz/lunar_assembler/issues"
      );
    }
    var newFeaturesForAdding = buildAreasSplittingStepAreaIntoSymbolicSteps(feature, pointsInSteps);
    if (newFeaturesForAdding != null) {
      k = newFeaturesForAdding.length;
      while (k--) {
        generatedFeatures.push(newFeaturesForAdding[k]);
      }
    }
  }
  i = generatedFeatures.length;
  while (i--) {
    dataGeojson.features.push(generatedFeatures[i]);
  }
  return dataGeojson;
}

////////////////////////////////////////////
// steps processing
function dataToListOfPositionOfStepsNodes(geojson) {
  // TODO: document is the first on list lower or higher
  pointsInSteps = [];
  var i = geojson.features.length;
  while (i--) {
    var feature = geojson.features[i];
    const link = "https://www.openstreetmap.org/" + feature.id;
    if (feature.properties["highway"] == "steps") {
      if (feature.properties["area"] == "yes" || feature.properties["type"] === "multipolygon") {
        showFatalError("steps mapped as an area should use area:highway=steps tagging, " + link + " needs fixing");
      } else if (feature.geometry.type != "LineString") {
        showFatalError("Unexpected geometry for steps, expected a LineString, got " + feature.geometry.type + " " + link + " needs fixing");
      } else {
        var k = feature.geometry.coordinates.length;
        if (feature.properties["incline"] == "down") {
          // reverse order (assumes incline=up to be default)
          index = 0;
          while (index < k) {
            pointsInSteps.push(feature.geometry.coordinates[index]);
            index += 1;
          }
        } else {
          while (k--) {
            pointsInSteps.push(feature.geometry.coordinates[k]);
          }
        }
      }
    }
  }
  return pointsInSteps;
}

function buildAreasSplittingStepAreaIntoSymbolicSteps(feature, pointsInSteps) {
  // gets feature (area:highway=steps) and list of points in highway=steps
  // returns array of features with extra shapes giving symbolic depiction of steps

  // we can detect connecting nodes. Lets assume simplest case:
  // two nodes where highway=steps are connected, without substantially changing geometry
  // and area:highway has four more nodes for depicting steps geometry
  // so, for given feature we can detect skeleton with two ways forming sides of steps
  // this can be split into parts and form the expected steps
  //
  // it will fail for more complicated steps!
  // unit testing would be useful...
  // write just standalone code for now? not with some testing framework?

  const link = "https://www.openstreetmap.org/" + feature.id;
  var matches = indexesOfPointsWhichAreConnectedToStepsWay(feature, pointsInSteps);
  if (matches === null) {
    showFatalError("unable to build steps pattern for " + link + " - please create an issue at https://github.com/matkoniecz/lunar_assembler/issues if that is unexpected and unwanted");
    return null;
  }
  var nodeCountOnPolygon = feature.geometry.coordinates[0].length;
  expectStepsPolygonCountToBeSixNodes(nodeCountOnPolygon, link);

  var pointBetweenStarts = feature.geometry.coordinates[0][matches[0].indexInObject];
  var pointBetweenEnds = feature.geometry.coordinates[0][matches[0].indexInObject];

  var firstLineStartIndex = (matches[0].indexInObject - 1) % nodeCountOnPolygon;
  var firstLineStart = feature.geometry.coordinates[0][firstLineStartIndex];
  var firstLineEndIndex = (matches[1].indexInObject + 1) % nodeCountOnPolygon;
  var firstLineEnd = feature.geometry.coordinates[0][firstLineEndIndex];

  var secondLineStartIndex = (matches[0].indexInObject + 1) % nodeCountOnPolygon;
  var secondLineStart = feature.geometry.coordinates[0][secondLineStartIndex];
  var secondLineEndIndex = (matches[1].indexInObject - 1) % nodeCountOnPolygon;
  var secondLineEnd = feature.geometry.coordinates[0][secondLineEndIndex];

  return buildAreasSplittingStepAreaIntoSymbolicStepsFromProvidedSkeletonLines(firstLineStart, firstLineEnd, secondLineStart, secondLineEnd, pointBetweenStarts, pointBetweenEnds);
}

function indexOfMatchingPointInArray(point, array) {
  var indexOfMatchingPointInSteps = -1;
  var stepIndex = array.length;
  while (stepIndex--) {
    if (point[0] === array[stepIndex][0] && point[1] === array[stepIndex][1]) {
      indexOfMatchingPointInSteps = stepIndex;
      return stepIndex;
    }
  }
  return -1;
}

function expectStepsPolygonCountToBeSixNodes(nodeCountOnPolygon, link) {
  const expected = 6 + 1; // +1 as a border node is repeated
  if (nodeCountOnPolygon != expected) {
    if (nodeCountOnPolygon > expected) {
      showError(
        "untested for large (" +
          nodeCountOnPolygon +
          " nodes) area:highway=steps geometries with more than 6 nodes. See " +
          link +
          "\nIf OSM data is correct and output is broken, please report to https://github.com/matkoniecz/lunar_assembler/issues"
      );
    } else {
      showFatalError("unexpectedly low node count ( " + nodeCountOnPolygon + "), is highway=steps attached to area:highway=steps? See " + link);
    }
  }
}

function indexesOfPointsWhichAreConnectedToStepsWay(feature, pointsInSteps) {
  const link = "https://www.openstreetmap.org/" + feature.id;
  if (feature.geometry.type != "Polygon") {
    showFatalError(
      "unsupported for " + feature.geometry.type + "! Skipping, see " + link + "\nIf OSM data is correct and output is broken, please report to https://github.com/matkoniecz/lunar_assembler/issues"
    );
    return null;
  }
  var nodeCountOnPolygon = feature.geometry.coordinates[0].length;
  expectStepsPolygonCountToBeSixNodes(nodeCountOnPolygon, link);
  var nodeIndex = nodeCountOnPolygon;
  var theFirstIntersection = undefined;
  var theSecondIntersection = undefined;
  while (nodeIndex-- > 1) {
    // > 1 is necessary as the last one is repetition of the first one
    const point = feature.geometry.coordinates[0][nodeIndex];

    indexOfMatchingPointInSteps = indexOfMatchingPointInArray(point, pointsInSteps);
    if (indexOfMatchingPointInSteps != -1) {
      if (theFirstIntersection == undefined) {
        theFirstIntersection = { indexInObject: nodeIndex, indexInStepsArray: indexOfMatchingPointInSteps };
      } else if (theSecondIntersection == undefined) {
        theSecondIntersection = { indexInObject: nodeIndex, indexInStepsArray: indexOfMatchingPointInSteps };
      } else {
        showFatalError("more than 2 intersections of area:highway=steps with highway=steps, at " + link + "\nOSM data needs fixing.");
      }
    }
  }
  if (theFirstIntersection == undefined || theSecondIntersection == undefined) {
    showFatalError(
      "expected 2 intersections of area:highway=steps with highway=steps, got less at " +
        link +
        "\nIt can happen when steps area is within range but steps way is outside, special step pattern will not be generated for this steps."
    );
    return null;
  }
  if (theFirstIntersection["indexInStepsArray"] > theSecondIntersection["indexInStepsArray"]) {
    // ensure that steps are going up/down - TODO!!!!
    var swap = theFirstIntersection;
    theFirstIntersection = theSecondIntersection;
    theSecondIntersection = swap;
  }
  return [theFirstIntersection, theSecondIntersection];
}

function buildAreasSplittingStepAreaIntoSymbolicStepsFromProvidedSkeletonLines(firstLineStart, firstLineEnd, secondLineStart, secondLineEnd, pointBetweenStarts, pointBetweenEnds) {
  // gets lines data - one for each side of steps
  // firstLineStart, firstLineEnd
  // secondLineStart, secondLineEnd
  // gets data about extra geometry parts at upper and lower steps boundary
  // pointBetweenStarts, pointBetweenEnds
  //
  // returns array of features with extra shapes giving symbolic depiction of steps
  returned = [];
  // add _part_X tags
  const partCount = 4;
  var partIndex = partCount;
  while (partIndex--) {
    //TODO: what if steps attachment changes geometry?
    //the first and the last line should include also middle nodes...
    ratioOfStartForTop = (partIndex + 1) / partCount;
    ratioOfStartForBottom = partIndex / partCount;
    var cornerOnTopOfTheFirstLine = pointBetweenTwoPoints(firstLineStart, firstLineEnd, ratioOfStartForTop);
    var cornerOnBottomOfTheFirstLine = pointBetweenTwoPoints(firstLineStart, firstLineEnd, ratioOfStartForBottom);

    var cornerOnTopOfTheSecondLine = pointBetweenTwoPoints(secondLineStart, secondLineEnd, ratioOfStartForTop);
    var cornerOnBottomOfTheSecondLine = pointBetweenTwoPoints(secondLineStart, secondLineEnd, ratioOfStartForBottom);

    const coords = [cornerOnTopOfTheFirstLine, cornerOnTopOfTheSecondLine, cornerOnBottomOfTheSecondLine, cornerOnBottomOfTheFirstLine, cornerOnTopOfTheFirstLine];
    const geometry = { type: "Polygon", coordinates: [coords] };
    const generatedFeature = { type: "Feature", properties: { lunar_assembler_step_segment: "" + partIndex }, geometry: geometry };
    returned.push(generatedFeature);

    //winding :( TODO, lets ignore it for now
  }
  return returned;
}

function pointBetweenTwoPoints(start, end, ratioOfStart) {
  return [start[0] * ratioOfStart + end[0] * (1 - ratioOfStart), start[1] * ratioOfStart + end[1] * (1 - ratioOfStart)];
}
