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
function laserRoadAreaMapStyle() {
  var mapStyle = {
    paintOrder(feature) {
      // higher values: more on top

      var valueRangeForOneLayer = 10000;
      var layer = 0;
      if (feature.properties["layer"] != null) {
        /* 
        ignore layer tag on buildings and similar 
        to discourage tagging for renderer
        note that undeground buildings are later skipped
        */
        if (
          feature.properties["building"] == null &&
          (feature.properties["natural"] == null || feature.properties["natural"] == "water") &&
          feature.properties["landuse"] == null &&
          feature.properties["leisure"] == null
        ) {
          layer = feature.properties["layer"];
        }
      }

      if (railwayLinearValuesArray().includes(feature.properties["railway"])) {
        var priority = 0.99;
        return valueRangeForOneLayer * priority + valueRangeForOneLayer * layer;
      }
      if (feature.properties["zebra_crossing_bar_generated_by_lunar_assembler"] != undefined) {
        var priority = 0.58;
        return valueRangeForOneLayer * priority + valueRangeForOneLayer * layer;
      }
      if (feature.properties["lunar_assembler_cloned_for_pattern_fill"] != undefined) {
        var priority = 0.48;
        return valueRangeForOneLayer * priority + valueRangeForOneLayer * layer;
      }

      if (feature.properties["lunar_assembler_step_segment"] != null) {
        var priority = 0.44;
        return valueRangeForOneLayer * priority + valueRangeForOneLayer * layer;
      }

      // further standard layering, even if most is not applicable
      // TODO: prune it? delete it? put water/buildings on top to
      // make mistakes more noticeable?
      if (railwayLinearValuesArray().includes(feature.properties["railway"])) {
        var priority = 0.4;
        return valueRangeForOneLayer * priority + valueRangeForOneLayer * layer;
      }
      if (feature.properties["area:highway"] != null) {
        var priority = 0.36;
        return valueRangeForOneLayer * priority + valueRangeForOneLayer * layer;
      }
      if (feature.properties["building"] != null && feature.properties["location"] != "underground") {
        var priority = 0.32;
        return valueRangeForOneLayer * priority + valueRangeForOneLayer * layer;
      }
      if (feature.properties["barrier"] != null) {
        var priority = 0.28;
        return valueRangeForOneLayer * priority + valueRangeForOneLayer * layer;
      }
      if (feature.properties["highway"] != null) {
        var priority = 0.24;
        return valueRangeForOneLayer * priority + valueRangeForOneLayer * layer;
      }
      if (feature.properties["man_made"] === "bridge") {
        var priority = 0.16;
        return valueRangeForOneLayer * priority + valueRangeForOneLayer * layer;
      }
      if (feature.properties["waterway"] != null) {
        /* render waterway lines under bridge areas */
        var priority = 0.12;
        return valueRangeForOneLayer * priority + valueRangeForOneLayer * layer;
      }
      if (feature.properties["natural"] === "water" || feature.properties["waterway"] === "riverbank") {
        // render natural=wood below natural=water
        var priority = 0.08;
        return valueRangeForOneLayer * priority + valueRangeForOneLayer * layer;
      }
      if (feature.properties["natural"] === "bare_rock") {
        // render natural=wood below natural=bare_rock
        // render water rather than underwater rocks
        var priority = 0.04;
        return valueRangeForOneLayer * priority + valueRangeForOneLayer * layer;
      }
      if (feature.properties["leisure"] != null) {
        // render leisure=park below natural=water or natural=wood
        // but above landuse=residential
        var priority = 0.03;
        return valueRangeForOneLayer * priority + valueRangeForOneLayer * layer;
      }
      if (feature.properties["landuse"] != null) {
        //better higher and trigger layering problems quickly that have something failing ONLY in parks
        var priority = 0.02;
        return valueRangeForOneLayer * priority + valueRangeForOneLayer * layer;
      }
      return valueRangeForOneLayer * layer;
    },

    unifiedStyling() {
      returned = [];
      var i = pedestrianWaysValuesArray().length;
      while (i--) {
        value = pedestrianWaysValuesArray()[i];
        if (value == "steps") {
          continue;
        }
        returned.push({
          area_color: "green",
          description: "area of a pedestrian way (linear representation must be also present! Using only area representation is invalid!)",
          matches: [{ key: "area:highway", value: value }],
        });
      }

      returned.push({
            area_color: "green",
            description: "pedestrian square (using it for sidewalk areas is invalid!)",
            matches: [
              [
                { key: "highway", value: "pedestrian" },
                { key: "area", value: "yes", role: "supplementary_obvious_filter" },
              ],
              [
                { key: "highway", value: "pedestrian" },
                { key: "type", value: "multipolygon", role: "supplementary_obvious_filter" },
              ],
            ],
      });
      returned.push({
            area_color: "yellow",
            description: "pedestrian crossing through a road (area used in addition to area representing road)",
            matches: [{ key: "area:highway", value: "crossing" }],
      });
      returned.push({
        area_color: "#004754", // color #27 in LightBurn, clearly visible on the map, rendered on top
        description: "bar on a pedestrian, to produce pattern distinguishing it from sidewalks by touch",
        automatically_generated_using: [{ key: "footway", value: "crossing", purpose: "detecting crossings" }],
        matches: [{ key: "zebra_crossing_bar_generated_by_lunar_assembler", value: "yes" }],
      });

      returned.push({
          area_color: "orange",
          description: "area representation of steps (used in addition to linear highway=steps)",
          matches: [{ key: "area:highway", value: "steps" }],
        }
      );
      returned.push(...unifiedMapStyleSegmentForSymbolicStepRepresentation());
      returned.push({
            area_color: "black",
            description: "buildings",
            matches: [{ key: "building" }],
      });
      returned.push({
            area_color: "#00FFFF",
            description: "water - pattern, part expected to be engraved",
            matches: [
              [
                { key: "natural", value: "water" },
                { key: "lunar_assembler_cloned_for_pattern_fill", value: "yes", role: "supplementary_obvious_filter" },
              ],
              [
                { key: "waterway", value: "riverbank" },
                { key: "lunar_assembler_cloned_for_pattern_fill", value: "yes", role: "supplementary_obvious_filter" },
              ],
            ],
        });
        returned.push({
            area_color: "blue",
            description: "water - entire area, expected to be cut at outline to separate element for easier painting (or used solely for orientation)",
            matches: [
              { key: "natural", value: "water" },
              { key: "waterway", value: "riverbank" },
            ],
      });
      var i = motorizedRoadValuesArray().length;
      while (i--) {
        value = motorizedRoadValuesArray()[i];
        returned.push({
          area_color: "#808080",
          description: "area of a motorized road - pattern, part expected to be engraved",
          matches: [
            [
              { key: "area:highway", value: value },
              { key: "lunar_assembler_cloned_for_pattern_fill", value: "yes", role: "supplementary_obvious_filter" },
            ],
          ],
        });
      }
      var i = motorizedRoadValuesArray().length;
      while (i--) {
        value = motorizedRoadValuesArray()[i];
        returned.push({
          area_color: "#B4B4B4",
          description: "area of a motorized road (linear representation must be also present! Using only area representation is invalid!)",
          matches: [{ key: "area:highway", value: value }],
        });
      }

      returned.push(
        ...[
          {
            area_color: "#808080",
            description: "road area of a taxi stop (used in addition to amenity=taxi) - pattern, part expected to be engraved",
            matches: [
              [
                { key: "area:highway", value: "taxi_stop" },
                { key: "lunar_assembler_cloned_for_pattern_fill", value: "yes", role: "supplementary_obvious_filter" },
              ],
            ],
          },
          {
            area_color: "#B4B4B4",
            description: "road area of a taxi stop (used in addition to amenity=taxi)",
            matches: [{ key: "area:highway", value: "taxi_stop" }],
          },
          {
            area_color: "#808080",
            description: "road area of a bus stop - pattern, part expected to be engraved",
            matches: [
              [
                { key: "area:highway", value: "bus_stop" },
                { key: "lunar_assembler_cloned_for_pattern_fill", value: "yes", role: "supplementary_obvious_filter" },
              ],
            ],
          },
          {
            area_color: "#B4B4B4",
            description: "road area of a bus stop (used in addition to highway=bus_stop)",
            matches: [{ key: "area:highway", value: "bus_stop" }],
          },
          {
            area_color: "#808080",
            description: "road area of a cycleway - pattern, part expected to be engraved",
            matches: [
              [
                { key: "area:highway", value: "cycleway" },
                { key: "lunar_assembler_cloned_for_pattern_fill", value: "yes", role: "supplementary_obvious_filter" },
              ],
            ],
          },
          {
            area_color: "#B4B4B4",
            description: "road area of a cycleway (used in addition to highway=bus_stop)",
            matches: [{ key: "area:highway", value: "cycleway" }],
          },
        ]
      );

      var i = railwayLinearValuesArray().length;
      while (i--) {
        value = railwayLinearValuesArray()[i];
        returned.push({
          line_color: "black",
          line_width: 2,
          description: "linear representation of a single railway track",
          matches: [{ key: "railway", value: value }],
        });
      }
      return returned;
    },

    fillColoring(feature) {
      console.log(feature);
      if (["Point"].includes(feature.geometry.type)) {
        //no rendering of points, for start size seems to randomly differ
        // and leaves ugly circles - see building=* nodes
        return "none";
      }
      return getMatchFromUnifiedStyling(feature, "area_color", mapStyle.unifiedStyling());
    },

    strokeColoring(feature) {
      if (["Point"].includes(feature.geometry.type)) {
        //no rendering of points, for start size seems to randomly differ
        // and leaves ugly circles - see building=* nodes
        return "none";
      }
      return getMatchFromUnifiedStyling(feature, "line_color", mapStyle.unifiedStyling());
    },

    strokeWidth(feature) {
      return getMatchFromUnifiedStyling(feature, "line_width", mapStyle.unifiedStyling());
    },

    mergeIntoGroup(feature) {
      // note that points and lines are not being merged!
      // only areas (including multipolygins) can be merged for now
      // please open an issue if you need it, it increaes chance of implementation a bit
      // or open pull request with an implementation
      if (
        motorizedRoadValuesArray().includes(feature.properties["area:highway"]) ||
        feature.properties["area:highway"] === "cycleway" ||
        feature.properties["area:highway"] === "bus_stop" ||
        feature.properties["area:highway"] === "taxi_stop"
      ) {
        return "area:highway_carriageway_layer";
      }
      if (
        ["footway", "pedestrian", "path"].includes(feature.properties["area:highway"]) ||
        (feature.properties["highway"] == "pedestrian" && (feature.properties["area"] === "yes" || feature.properties["type"] === "multipolygon"))
      ) {
        return "area:highway_footway";
      }
      // hack for https://www.openstreetmap.org/way/660168838
      if (["way/660168838", "way/655408390", "way/655029668"].includes(feature.id)) {
        feature.properties["area:highway"] = "footway"; //otherwise entire footway areas can gen area:highway=steps!
        return "area:highway_footway";
      }

      if (feature.properties["area:highway"] == "cycleway") {
        return "area:highway_cycleway";
      }
      if (feature.properties["building"] != null) {
        return "buildings";
      }
      if (feature.properties["natural"] === "water" || feature.properties["waterway"] === "riverbank") {
        return "water";
      }
      if (feature.properties["man_made"] == "bridge") {
        return "bridge_outline";
      }
      return null;
    },

    name(feature) {
      return feature.properties.name;
    },

    transformGeometryAsInitialStep(dataGeojson, readableBounds) {
      dataGeojson = programaticallyGenerateSymbolicStepParts(dataGeojson);
      return dataGeojson;
    },

    // called after areas were merged, before sorting of areas
    // gets full data and can freely edit it
    transformGeometryAtFinalStep(dataGeojson, readableBounds) {
      var roadArea = findMergeGroupObject(dataGeojson, "area:highway_carriageway_layer");
      var footwayArea = findMergeGroupObject(dataGeojson, "area:highway_footway");
      if(roadArea == undefined && footwayArea == undefined) {
        showFatalError("Neither roads nor footways are mapped here with area:highway, and this map style requires area:highway mapping. Please use another map styly or map area:highway shapes or select a different area.")
      }

      dataGeojson = mapStyle.eraseCrossingAreasFromRoads(dataGeojson);
      dataGeojson = mapStyle.eraseWaterWhereIntersectingBridge(dataGeojson);

      var roadAreasWithCrossing;
      var i = dataGeojson.features.length;
      while (i--) {
        var feature = dataGeojson.features[i];
        if (feature.properties["area:highway"] === "crossing") {
          if(roadAreasWithCrossing == undefined) {
            roadAreasWithCrossing = JSON.parse(JSON.stringify(feature.geometry.coordinates))
          } else {
            roadAreasWithCrossing = polygonClipping.union(feature.geometry.coordinates, roadAreasWithCrossing);
          }
        }
      }
      console.log(roadAreasWithCrossing)
      if(roadAreasWithCrossing == undefined){
        showError("no mapped crossing areas here at all!")
      } else {
        var geometry = mergeArrayOfAreaCoordinatesIntoMultipolygon(roadAreasWithCrossing)
        console.log(geometry)
        generateZebraBarCrossings(dataGeojson, {'type': 'Feature', 'geometry': geometry}) 
      }

      dataGeojson = mapStyle.applyPatternsToCarriagewaysAndWater(dataGeojson);
      return dataGeojson;
    },

    eraseCrossingAreasFromRoads(dataGeojson) {
      var roadArea = findMergeGroupObject(dataGeojson, "area:highway_carriageway_layer");
      if (roadArea === undefined) {
        console.warn("eraseCrossingAreasFromRoads - no road areas");
        return dataGeojson;
      }
      if (!isMultipolygonAsExpected(roadArea)) {
        console.error("following geometry was expected to be a multipolygon but was not:");
        console.error(roadArea);
      }
      var i = dataGeojson.features.length;
      while (i--) {
        var feature = dataGeojson.features[i];
        if (feature.properties["area:highway"] === "crossing") {
          if(feature.geometry.type == 'point') {
            const link = "https://www.openstreetmap.org/" + feature.id;
            showWarning("https://www.openstreetmap.org/" + feature.id + " is a node but has area:highway valid only on areas...");
          } else {
            if(isAreaAsExpected(feature) == false) {
              showFatalError("following geometry was expected to be an area but was not:");
              showFatalError(feature);                
            }
            roadArea.geometry.coordinates = polygonClipping.difference(roadArea.geometry.coordinates, feature.geometry.coordinates);  
          }
        }
      }
      return dataGeojson;
    },

    eraseWaterWhereIntersectingBridge(dataGeojson) {
      var water = findMergeGroupObject(dataGeojson, "water");
      if (water === undefined) {
        // no reason to suspect issues
        // nothing to remove
        return dataGeojson;
      }
      if (!isMultipolygonAsExpected(water)) {
        console.error("following geometry was expected to be multipolygon but was not:");
        console.error(water);
      }

      var bridgeArea = findMergeGroupObject(dataGeojson, "bridge_outline");
      if (bridgeArea === undefined) {
        // no reason to suspect issues
      } else {
        if (!isMultipolygonAsExpected(bridgeArea)) {
          console.error("following geometry was expected to be multipolygon but was not:");
          console.error(bridgeArea);
        }
        water.geometry.coordinates = polygonClipping.difference(water.geometry.coordinates, bridgeArea.geometry.coordinates);
      }

      var footwayArea = findMergeGroupObject(dataGeojson, "area:highway_footway");
      if (footwayArea === undefined) {
        // no reason to suspect issues
      } else {
        if (!isMultipolygonAsExpected(footwayArea)) {
          console.error("following geometry was expected to be multipolygon but was not:");
          console.error(footwayArea);
        }
        water.geometry.coordinates = polygonClipping.difference(water.geometry.coordinates, footwayArea.geometry.coordinates);
      }

      return dataGeojson;
    },

    applyPatternsToCarriagewaysAndWater(dataGeojson) {
      // applied pattern is set of square holes, regularly spaced in a grid
      // it is intended to be used in a laser cutter that will burn are outside such exempt holes, producing a clear pattern
      // repeating pattern on grid of size 1m seems to work well, with hole 40cm sized and burned are 60cm wide
      // in created pattern it was 1mm for hole and 1.5 mm for space between giles

      // Returns BBox bbox extent in [minX, minY, maxX, maxY] order
      bbox = turf.bbox(dataGeojson);
      var minLongitude = bbox[0];
      var minLatitude = bbox[1];
      var maxLongitude = bbox[2];
      var maxLatitude = bbox[3];

      var from_horizontal = turf.point([minLongitude, minLatitude]);
      var to_horizontal = turf.point([maxLongitude, minLatitude]);
      var distanceHorizontalInMeters = turf.distance(from_horizontal, to_horizontal, { units: "meters" });
      var distanceHorizontalInDegrees = maxLongitude - minLongitude;
      var metersInDegreeHorizontal = distanceHorizontalInMeters / distanceHorizontalInDegrees;

      var from_vertical = turf.point([minLongitude, minLatitude]);
      var to_vertical = turf.point([minLongitude, maxLatitude]);
      var distanceVerticalInMeters = turf.distance(from_vertical, to_vertical, { units: "meters" });
      var distanceVerticalInDegrees = maxLatitude - minLatitude;
      var metersInDegreeVertical = distanceVerticalInMeters / distanceVerticalInDegrees;

      const roadHoleSizeInMeters = 0.3;
      const holeVerticalInMeters = roadHoleSizeInMeters;
      const holeHorizontalInMeters = roadHoleSizeInMeters;
      const roadSpaceBetweenInMeters = 0.45;
      const spaceVerticalInMeters = roadSpaceBetweenInMeters;
      const spaceHorizontalInMeters = roadSpaceBetweenInMeters;

      // for density consideration see notes in applyPatternsToCarriagewaysAndWater in laser_neighbourhood_map_style file
      const waterSpaceBetweenRowsInMeters = 0.3;
      const waterRowSizeInMeters = 0.3;

      // generate pattern for road surface by intersecting it with a prepared pattern
      var i = dataGeojson.features.length;
      while (i--) {
        var feature = dataGeojson.features[i];
        if (feature.properties["lunar_assembler_merge_group"] == "water") {
          var generated = intersectGeometryWithHorizontalStripes(feature, waterRowSizeInMeters / metersInDegreeHorizontal, waterSpaceBetweenRowsInMeters / metersInDegreeHorizontal);
          generated.properties["lunar_assembler_cloned_for_pattern_fill"] = "yes";
          dataGeojson.features.push(generated); // added at the end, and iterating from end to 0 so will not trigger infinite loop
        }
        //console.warn(feature.properties["lunar_assembler_merge_group"]);
        if (feature.properties["lunar_assembler_merge_group"] == "area:highway_carriageway_layer") {
          var generated = intersectGeometryWithPlaneHavingRectangularHoles(
            feature,
            holeVerticalInMeters / metersInDegreeVertical,
            holeHorizontalInMeters / metersInDegreeHorizontal,
            spaceVerticalInMeters / metersInDegreeVertical,
            spaceHorizontalInMeters / metersInDegreeHorizontal
          );
          generated.properties["lunar_assembler_cloned_for_pattern_fill"] = "yes";
          dataGeojson.features.push(generated); // added at the end, and iterating from end to 0 so will not trigger infinite loop
        }
      }
      return dataGeojson;
    },
  };
  return mapStyle;
}
