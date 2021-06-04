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
function highZoomLaserMapStyle() {
  var mapStyle = {
    motorizedRoadValuesArray() {
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
      ];
    },

    railwayLinearValuesArray() {
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
    },

    paintOrder(feature) {
      // extra sizes go under to not block main data
      if (feature.properties["generated_traversable_chunk"] != undefined) {
        return -1000;
      }
      if (feature.properties["generated_blocked_chunk"] != undefined) {
        return -900;
      }
      if (feature.properties["native_blocked_chunk"] != undefined) {
        return -900;
      }
      if (feature.properties["area:highway_extra_size"] != undefined || feature.properties["lunar_assembler_merge_group"] == "highway_carriageway_layer") {
        return -800;
      }
      if (feature.properties["lunar_assembler_cloned_for_pattern_fill"] != undefined) {
        return 100; // patterns goes on top of unpatterned fill
      }
      return 0;
    },

    fillColoring(feature) {
      if (["Point"].includes(feature.geometry.type)) {
        //no rendering of points, for start size seems to randomly differ
        // and leaves ugly circles - see building=* nodes
        return "none";
      }
      //console.log(feature);
      if (feature.properties["lunar_assembler_step_segment"] == "0") {
        return "#400080";
      }
      if (feature.properties["lunar_assembler_step_segment"] == "1") {
        return "magenta";
      }
      if (feature.properties["lunar_assembler_step_segment"] == "2") {
        return "#ff0000";
      }
      if (feature.properties["lunar_assembler_step_segment"] == "3") {
        return "#D33F6A";
      }
      if (feature.properties["area:highway"] == "steps") {
        // entire area of steps
        return "orange";
      }

      if (feature.properties["building"] != null) {
        return "#B45A00";
      }
      if (feature.properties["lunar_assembler_merge_group"] == "area:highway_carriageway_layer") {
        if (feature.properties["lunar_assembler_cloned_for_pattern_fill"] == "yes") {
          return "#808080";
        }
        return "#B4B4B4";
      }

      if (mapStyle.motorizedRoadValuesArray().includes(feature.properties["area:highway_extra_size"]) || feature.properties["area:highway_extra_size"] === "bicycle_crossing") {
        //return "#d3d3d3"; // useful for debugging code, confusing in produced map
      }

      if (feature.properties["area:highway_extra_size"] == null) {
        if (
          ["footway", "pedestrian", "path", "steps"].includes(feature.properties["area:highway"]) ||
          (feature.properties["highway"] == "pedestrian" && (feature.properties["area"] === "yes" || feature.properties["type"] === "multipolygon"))
        ) {
          if (feature.properties["footway"] == "crossing") {
            return "yellow";
          }
          return "green";
        }
      }

      if (["footway", "pedestrian", "path", "steps"].includes(feature.properties["area:highway_extra_size"])) {
        if (feature.properties["footway"] == "crossing") {
          //return "#eee8aa";  // useful for debugging code, confusing in produced map
        }
        //return "#adff2f";  // useful for debugging code, confusing in produced map
      }

      if (feature.properties["natural"] === "water" || feature.properties["waterway"] === "riverbank") {
        if (feature.properties["lunar_assembler_cloned_for_pattern_fill"] == "yes") {
          return "#00FFFF";
        }
        return "blue";
      }

      if (feature.properties["generated_barrier_area"] != null) {
        return "#b76b80";
      }
      if (feature.properties["generated_traversable_chunk"] === "yes") {
        //return "#ffcc00"
      }
      if (feature.properties["generated_blocked_chunk"] === "yes" || feature.properties["native_blocked_chunk"] === "yes") {
        return "#808000";
      }
      return "none";
    },

    strokeColoring(feature) {
      if (["Point"].includes(feature.geometry.type)) {
        //no rendering of points, for start size seems to randomly differ
        // and leaves ugly circles - see building=* nodes
        return "none";
      }
      return "none";
    },

    strokeWidth(feature) {
      if (mapStyle.railwayLinearValuesArray().includes(feature.properties["railway"])) {
        return 2;
      }

      return 1;
    },

    mergeIntoGroup(feature) {
      // note that points and lines are not being merged!
      // only areas (including multipolygins) can be merged for now
      // please open an issue if you need it, it increaes chance of implementation a bit
      // or open pull request with an implementation
      if (
        mapStyle.motorizedRoadValuesArray().includes(feature.properties["area:highway"]) ||
        feature.properties["area:highway"] === "bicycle_crossing" ||
        feature.properties["area:highway"] === "cycleway" ||
        feature.properties["amenity"] === "parking_space"
      ) {
        return "area:highway_carriageway_layer";
      }

      if (
        mapStyle.motorizedRoadValuesArray().includes(feature.properties["area:highway_extra_size"]) ||
        feature.properties["area:highway_extra_size"] === "bicycle_crossing" ||
        feature.properties["area:highway_extra_size"] === "cycleway"
      ) {
        return "area:highway_carriageway_layer_extra_size";
      }

      // hack for https://www.openstreetmap.org/?mlat=50.05267&mlon=19.92927#map=19/50.05267/19.92927
      if (["way/941057708", "way/294809233"].includes(feature.id)) {
        return "area:highway_undeground_passage";
      }

      if (feature.properties["area:highway_extra_size"] == null && mapStyle.isSpecialAreaErasingFootway(feature) == false) {
        if (["footway", "pedestrian", "path", "steps"].includes(feature.properties["area:highway"]) || (feature.properties["highway"] == "pedestrian" && feature.properties["area"] === "yes")) {
          // hack for https://www.openstreetmap.org/?mlat=50.05267&mlon=19.92927#map=19/50.05267/19.92927
          if (feature.properties["footway"] == "crossing") {
            return "area:highway_crossing";
          }
          return "area:highway_footway";
        }
      }
      if (["footway", "pedestrian", "path", "steps"].includes(feature.properties["area:highway_extra_size"])) {
        // hack for https://www.openstreetmap.org/?mlat=50.05267&mlon=19.92927#map=19/50.05267/19.92927
        if (feature.properties["footway"] == "crossing") {
          return "area:highway_crossing_extra_size";
        }
        return "area:highway_footway_extra_size";
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
      if (feature.properties["generated_barrier_area"] != null) {
        return "generated_barrier_area";
      }
      if (feature.properties["generated_blocked_chunk"] != null || feature.properties["native_blocked_chunk"] != null) {
        return "generated_blocked_chunk";
      }
      if (feature.properties["generated_traversable_chunk"] != null) {
        return "generated_traversable_chunk";
      }

      if (feature.properties["man_made"] === "bridge") {
        return "bridge_outline";
      }

      return null;
    },

    name(feature) {
      return feature.properties.name;
    },

    // called before merges
    // gets full data and can freely edit it
    transformGeometryAsInitialStep(dataGeojson, readableBounds) {
      dataGeojson = mapStyle.applyManualPatchesAtStart(dataGeojson);

      dataGeojson = programaticallyGenerateSymbolicStepParts(dataGeojson);
      dataGeojson = mapStyle.generateAreasFromBarriers(dataGeojson);
      dataGeojson = mapStyle.generateRestrictedAcccessArea(dataGeojson, readableBounds);
      dataGeojson = mapStyle.generateAreasFromRoadLines(dataGeojson);
      return dataGeojson;
    },

    // called after areas were merged, before sorting of areas
    // gets full data and can freely edit it
    transformGeometryAtFinalStep(dataGeojson, readableBounds) {
      dataGeojson = mapStyle.applyManualPatchesBeforeGeometryErasings(dataGeojson);

      dataGeojson = mapStyle.restrictPedestrianCrossingToRoadAreas(dataGeojson);
      dataGeojson = mapStyle.eraseCrossingAreasFromRoads(dataGeojson);
      dataGeojson = mapStyle.fillAreaNearRoadAndFootwayWithFootway(dataGeojson);
      dataGeojson = mapStyle.eraseFootwayWhereIntersectingRoad(dataGeojson);
      dataGeojson = mapStyle.eraseFootwayWhereIntersectingBuilding(dataGeojson);
      dataGeojson = mapStyle.eraseFootwayWhereIntersectingPrivateArea(dataGeojson);
      dataGeojson = mapStyle.eraseFootwayWhereIntersectingCrossings(dataGeojson);
      dataGeojson = mapStyle.eraseWaterWhereIntersectingBridge(dataGeojson);

      dataGeojson = mapStyle.applyManualPatchesAfterGeometryErasings(dataGeojson);

      dataGeojson = mapStyle.fillSliversAroundFootways(dataGeojson, readableBounds);

      dataGeojson = mapStyle.applyPatternsToCarriagewaysAndWater(dataGeojson);

      return dataGeojson;
    },

    applyManualPatchesAtStart(dataGeojson) {
      var i = dataGeojson.features.length;
      var found = undefined;
      while (i--) {
        var feature = dataGeojson.features[i];
        if (["way/940940433", "way/947218894"].includes(feature.id)) {
          dataGeojson.features.splice(i, 1); // remove matching element
        }
      }
      return dataGeojson;
    },

    applyManualPatchesBeforeGeometryErasings(dataGeojson) {
      dataGeojson = mapStyle.addToFootwayGeometry(
        dataGeojson,
        [
          [
            [19.92633730173111, 50.05211704223168],
            [19.926462024450302, 50.05116981131536],
            [19.92675974965095, 50.05114483861099],
            [19.92772400379181, 50.05176054115375],
            [19.927577823400497, 50.05215320885973],
            [19.92633730173111, 50.05211704223168],
          ],
        ],
        "Rynek Dębnicki"
      );

      dataGeojson = mapStyle.addToFootwayGeometry(
        dataGeojson,
        [
          [
            [19.928049, 50.052813],
            [19.927858, 50.052472],
            [19.928142, 50.052304],
            [19.927998, 50.052141],
            [19.928545, 50.051435],
            [19.928867, 50.051545],
            [19.928395, 50.052685],
            [19.928049, 50.052813],
          ],
        ],
        "Barska i Madalińskiego"
      );

      dataGeojson = mapStyle.addToFootwayGeometry(
        dataGeojson,

        [
          [
            [19.924894273281097, 50.05147421892592],
            [19.924893602728844, 50.051476802291994],
            [19.92478296160698, 50.05144278796076],
            [19.924970716238022, 50.051195645133824],
            [19.925086721777916, 50.05123267358268],
            [19.924894273281097, 50.05147421892592],
          ],
        ],
        "Chodnik przy szkole (przewidziany do przycięcia przez drogę)"
      );

      dataGeojson = mapStyle.addToCarriagewayGeometry(
        dataGeojson,

        [
          [
            [19.925083369016647, 50.05152459453947],
            [19.92500826716423, 50.0516309428833],
            [19.924760162830353, 50.05155688657161],
            [19.924684390425682, 50.051644720789135],
            [19.924636110663414, 50.05162922064479],
            [19.92493651807308, 50.05122578457111],
            [19.924687072634697, 50.051134505074344],
            [19.924774914979935, 50.0510264333702],
            [19.924709871411324, 50.051001030025944],
            [19.92446981370449, 50.050931278401336],
            [19.92448858916759, 50.05089812481584],
            [19.924491941928864, 50.05088865235862],
            [19.924605265259743, 50.05092051425271],
            [19.925128296017643, 50.051073795501566],
            [19.924843981862068, 50.051456565920624],
            [19.925083369016647, 50.05152459453947],
          ],
        ],
        "parking przy szkole"
      );

      return dataGeojson;
    },

    addToCarriagewayGeometry(dataGeojson, new_geometry, identifier) {
      var roadArea = findMergeGroupObject(dataGeojson, "area:highway_carriageway_layer");
      if (roadArea === undefined) {
        // if no footway is defined in the first place it will not be added
        // but it is a manaual hack for manually tweaked area, so...
        //footwayArea.geometry.coordinates = new_geometry; // TODO: this WILL crash!
      } else {
        roadArea.geometry.coordinates = polygonClipping.union(roadArea.geometry.coordinates, new_geometry);
      }
      return dataGeojson;
    },

    addToFootwayGeometry(dataGeojson, new_geometry, identifier) {
      var footwayArea = findMergeGroupObject(dataGeojson, "area:highway_footway");
      if (footwayArea === undefined) {
        // if no footway is defined in the first place it will not be added
        // but it is a manaual hack for manually tweaked area, so...
        //footwayArea.geometry.coordinates = new_geometry; // TODO: this WILL crash!
      } else {
        footwayArea.geometry.coordinates = polygonClipping.union(footwayArea.geometry.coordinates, new_geometry);
      }
      return dataGeojson;
    },

    eraseToFootwayGeometry(dataGeojson, new_geometry, identifier) {
      var footwayArea = findMergeGroupObject(dataGeojson, "area:highway_footway");
      if (footwayArea === undefined) {
        // if no footway is defined in the first place it will not be added
        // but it is a manaual hack for manually tweaked area, so...
        //footwayArea.geometry.coordinates = new_geometry; // TODO: this WILL crash!
      } else {
        footwayArea.geometry.coordinates = polygonClipping.difference(footwayArea.geometry.coordinates, new_geometry);
      }
      return dataGeojson;
    },

    isSpecialAreaErasingFootway(feature){
      // https://www.openstreetmap.org/way/950050124
      // https://www.openstreetmap.org/way/950087102
      // https://www.openstreetmap.org/way/950050122
      if (["way/950050124", "way/950087102", "way/950050122"].includes(feature.id)) {
        return true;
      }
      return false;
    },

    applyManualPatchesAfterGeometryErasings(dataGeojson) {
      var i = dataGeojson.features.length;
      while (i--) {
        var feature = dataGeojson.features[i];
        if (mapStyle.isSpecialAreaErasingFootway(feature)) {
          dataGeojson = mapStyle.eraseToFootwayGeometry(dataGeojson, feature.geometry.coordinates, "make space for display of stairs into crossing below road")
        }
        // https://www.openstreetmap.org/way/950131721
        if (feature.id === "way/950131721") {
          dataGeojson = mapStyle.eraseToFootwayGeometry(dataGeojson, feature.geometry.coordinates, "erase leaking footway termination ( https://www.openstreetmap.org/way/950131721 ) ")
        }
      }

      dataGeojson = mapStyle.eraseToFootwayGeometry(
        dataGeojson,
        [
          [
            [19.925688542425632, 50.051965701819796],
            [19.925660379230976, 50.05202576443014],
            [19.925438091158867, 50.05194094480802],
            [19.9254709482193, 50.05188411127172],
            [19.925688542425632, 50.051965701819796],
          ],
        ],
        "końcówka chodnika przy szkole dla niewidomych, przy przejściu"
      );

      dataGeojson = mapStyle.replaceRoadAndBuildingsByFootwayHere(
        dataGeojson,
        [
          [
            [19.92846697568893, 50.05204384778197],
            [19.929450005292892, 50.052324569417344],
            [19.929436594247818, 50.052346097082314],
            [19.928449541330338, 50.05206020890394],
            [19.92846697568893, 50.05204384778197],
          ],
        ],
        "Powroźnicza, północna strona"
      );
      dataGeojson = mapStyle.replaceRoadAndBuildingsByFootwayHere(
        dataGeojson,
        [
          [
            [19.92953583598137, 50.05228840291845],
            [19.92846831679344, 50.05197237544687],
            [19.92849513888359, 50.05194826427367],
            [19.929559975862503, 50.05226343079614],
            [19.92953583598137, 50.05228840291845],
          ],
        ],
        "Powroźnicza, południowa strona"
      );
      dataGeojson = mapStyle.replaceRoadAndBuildingsByFootwayHere(
        dataGeojson,
        [
          [
            [19.92882639169693, 50.050331065787766],
            [19.92885321378708, 50.050356900057736],
            [19.9271097779274, 50.051457427042976],
            [19.92708295583725, 50.05140145405742],
            [19.92882639169693, 50.050331065787766],
          ],
        ],
        "Różana, północna strona"
      );
      dataGeojson = mapStyle.replaceRoadAndBuildingsByFootwayHere(
        dataGeojson,
        [
          [
            [19.928745925426483, 50.05028198063654],
            [19.926968961954117, 50.05137045360657],
            [19.926917999982834, 50.05134117538459],
            [19.928696304559708, 50.050245812598256],
            [19.928745925426483, 50.05028198063654],
          ],
        ],
        "Różana, południowa strona"
      );
      return dataGeojson;
    },

    replaceRoadAndBuildingsByFootwayHere(dataGeojson, target_geometry, identifier) {
      var buildingArea = findMergeGroupObject(dataGeojson, "buildings");
      if (buildingArea === undefined) {
        //alert("no building areas (areas tagged with a building=*) in range!");
        // no need to repeat warning
      } else {
        buildingArea.geometry.coordinates = polygonClipping.difference(buildingArea.geometry.coordinates, target_geometry);
      }

      var blockedArea = findMergeGroupObject(dataGeojson, "generated_blocked_chunk");
      if (blockedArea === undefined) {
        //alert("no building areas (areas tagged with a building=*) in range!");
        // no need to repeat warning
      } else {
        blockedArea.geometry.coordinates = polygonClipping.difference(blockedArea.geometry.coordinates, target_geometry);
      }

      var roadArea = findMergeGroupObject(dataGeojson, "area:highway_carriageway_layer");
      if (roadArea === undefined) {
        // alert("no road areas (lines tagged with a proper highway=*) in range!");
        // no need to repeat warning
      } else {
        roadArea.geometry.coordinates = polygonClipping.difference(roadArea.geometry.coordinates, target_geometry);
      }

      dataGeojson = mapStyle.addToFootwayGeometry(dataGeojson, target_geometry, identifier);
      return dataGeojson;
    },

    restrictPedestrianCrossingToRoadAreas(dataGeojson) {
      var roadArea = findMergeGroupObject(dataGeojson, "area:highway_carriageway_layer");
      var crossingArea = findMergeGroupObject(dataGeojson, "area:highway_crossing");
      if (crossingArea === undefined) {
        alert("no crossing areas (lines with footway=crossing) in range!");
        return dataGeojson;
      }
      if (roadArea === undefined) {
        alert("no road areas (lines tagged with a proper highway=*) in range!");
        crossingArea.geometry.coordinates = [];
        return dataGeojson;
      }
      crossingArea.geometry.coordinates = polygonClipping.intersection(crossingArea.geometry.coordinates, roadArea.geometry.coordinates);
      return dataGeojson;
    },

    eraseCrossingAreasFromRoads(dataGeojson) {
      var roadArea = findMergeGroupObject(dataGeojson, "area:highway_carriageway_layer");
      var crossingArea = findMergeGroupObject(dataGeojson, "area:highway_crossing");
      if (crossingArea === undefined) {
        alert("no crossing areas (lines with footway=crossing) in range!");
        return dataGeojson;
      }
      if (roadArea === undefined) {
        alert("no road areas (lines tagged with a proper highway=*) in range!");
        return dataGeojson;
      }
      if (!isMultipolygonAsExpected(roadArea)) {
        console.error("following geometry was expected to be multipolygon but was not:");
        console.error(roadArea);
      }
      if (!isMultipolygonAsExpected(crossingArea)) {
        console.error("following geometry was expected to be multipolygon but was not:");
        console.error(crossingArea);
      }
      roadArea.geometry.coordinates = polygonClipping.difference(roadArea.geometry.coordinates, crossingArea.geometry.coordinates);
      return dataGeojson;
    },

    eraseFootwayWhereIntersectingRoad(dataGeojson) {
      var roadArea = findMergeGroupObject(dataGeojson, "area:highway_carriageway_layer");
      var footwayArea = findMergeGroupObject(dataGeojson, "area:highway_footway");
      if (footwayArea === undefined) {
        alert("no footwayArea (highway=footway lines without footway=crossing) in range!");
        return dataGeojson;
      }
      if (roadArea === undefined) {
        //alert("no road areas (lines tagged with a proper highway=*) in range!");
        //will be warned in other cases
        return dataGeojson;
      }
      if (!isMultipolygonAsExpected(roadArea)) {
        console.error("following geometry was expected to be multipolygon but was not:");
        console.error(roadArea);
      }
      if (!isMultipolygonAsExpected(footwayArea)) {
        console.error("following geometry was expected to be multipolygon but was not:");
        console.error(footwayArea);
      }
      footwayArea.geometry.coordinates = polygonClipping.difference(footwayArea.geometry.coordinates, roadArea.geometry.coordinates);
      return dataGeojson;
    },

    eraseFootwayWhereIntersectingBuilding(dataGeojson) {
      var buildingArea = findMergeGroupObject(dataGeojson, "buildings");
      var footwayArea = findMergeGroupObject(dataGeojson, "area:highway_footway");
      if (footwayArea === undefined) {
        //will be warned in other cases
        //alert("no footwayArea (highway=footway lines without footway=crossing) in range!");
        return dataGeojson;
      }
      if (buildingArea === undefined) {
        alert("no building areas (areas tagged with a building=*) in range!");
        return dataGeojson;
      }
      if (!isMultipolygonAsExpected(buildingArea)) {
        console.error("following geometry was expected to be multipolygon but was not:");
        console.error(buildingArea);
      }
      if (!isMultipolygonAsExpected(footwayArea)) {
        console.error("following geometry was expected to be multipolygon but was not:");
        console.error(footwayArea);
      }
      footwayArea.geometry.coordinates = polygonClipping.difference(footwayArea.geometry.coordinates, buildingArea.geometry.coordinates);
      return dataGeojson;
    },

    eraseFootwayWhereIntersectingPrivateArea(dataGeojson) {
      var blockedArea = findMergeGroupObject(dataGeojson, "generated_blocked_chunk");
      var footwayArea = findMergeGroupObject(dataGeojson, "area:highway_footway");
      if (blockedArea === undefined) {
        alert("no blocked areas at all! Is everything really accessible in range? Report error at https://github.com/matkoniecz/lunar_assembler/issues if not ");
        return dataGeojson;
      }
      if (footwayArea === undefined) {
        alert("no footwayArea (highway=footway lines without footway=crossing) in range!");
        return dataGeojson;
      }
      if (!isMultipolygonAsExpected(blockedArea)) {
        console.error("following geometry was expected to be multipolygon but was not:");
        console.error(blockedArea);
      }
      if (!isMultipolygonAsExpected(footwayArea)) {
        console.error("following geometry was expected to be multipolygon but was not:");
        console.error(footwayArea);
      }
      footwayArea.geometry.coordinates = polygonClipping.difference(footwayArea.geometry.coordinates, blockedArea.geometry.coordinates);
      return dataGeojson;
    },

    eraseFootwayWhereIntersectingCrossings(dataGeojson) {
      var crossingArea = findMergeGroupObject(dataGeojson, "area:highway_crossing");
      if (crossingArea === undefined) {
        //alert("no crossing areas (lines with footway=crossing) in range!");
        //will be warned in other cases
        return dataGeojson;
      }
      var footwayArea = findMergeGroupObject(dataGeojson, "area:highway_footway");
      if (footwayArea === undefined) {
        alert("no footwayArea (highway=footway lines without footway=crossing) in range!");
        return dataGeojson;
      }
      if (!isMultipolygonAsExpected(crossingArea)) {
        console.error("following geometry was expected to be multipolygon but was not:");
        console.error(crossingArea);
      }
      if (!isMultipolygonAsExpected(footwayArea)) {
        console.error("following geometry was expected to be multipolygon but was not:");
        console.error(footwayArea);
      }
      footwayArea.geometry.coordinates = polygonClipping.difference(footwayArea.geometry.coordinates, crossingArea.geometry.coordinates);
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

    fillAreaNearRoadAndFootwayWithFootway(dataGeojson) {
      var extraRoadArea = findMergeGroupObject(dataGeojson, "area:highway_carriageway_layer_extra_size");
      var footwayArea = findMergeGroupObject(dataGeojson, "area:highway_footway");
      var extraFootwayArea = findMergeGroupObject(dataGeojson, "area:highway_footway_extra_size");
      if (footwayArea === undefined) {
        alert("no footwayArea (highway=footway lines without footway=crossing) in range!");
        return dataGeojson;
      }
      if (extraRoadArea === undefined) {
        alert("no extraRoadArea in range!");
        return dataGeojson;
      }
      if (extraFootwayArea === undefined) {
        alert("no extraFootwayArea in range!");
        return dataGeojson;
      }
      if (!isMultipolygonAsExpected(extraRoadArea)) {
        console.error("following geometry was expected to be multipolygon but was not:");
        console.error(extraRoadArea);
      }
      if (!isMultipolygonAsExpected(extraFootwayArea)) {
        console.error("following geometry was expected to be multipolygon but was not:");
        console.error(extraFootwayArea);
      }
      var intersectedGeometry = polygonClipping.intersection(extraFootwayArea.geometry.coordinates, extraRoadArea.geometry.coordinates);
      footwayArea.geometry.coordinates = polygonClipping.union(footwayArea.geometry.coordinates, intersectedGeometry);
      return dataGeojson;
    },

    widthOfRoadGeometryInMeters(feature) {
      if (mapStyle.motorizedRoadValuesArray().includes(feature.properties["highway"])) {
        if (feature.properties["lanes"] != undefined) {
          // in case of lanes==1 it is likely that it is wide anyway due to parking lanes
          // supporting them would allow to drop this exception
          if (feature.properties["lanes"] != 1) {
            return feature.properties["lanes"] * 2.5;
          }
        }
        if (feature.properties["highway"] == "service" && ["driveway", "parking_aisle"].includes(feature.properties["service"])) {
          return undefined;
        }
        if (feature.properties["highway"] == "service") {
          return 4.5;
        }
        return 5;
      }
      if (["footway", "pedestrian", "path", "steps", "cycleway"].includes(feature.properties["highway"])) {
        if (mapStyle.isAreaMakingFreePedestrianMovementImpossible(feature)) {
          // closed footway for example - highway=footway access=no
          return undefined;
        }
        return 5;
      }
      return undefined;
    },

    isAccessValueRestrictive(value) {
      if (value == "no") {
        return true;
      }
      if (value == "private") {
        return true;
      }
      if (value == "customers") {
        return true;
      }
      return false;
    },

    isAreaMakingFreePedestrianMovementImpossible(feature) {
      if (feature.properties["generated_barrier_area"] != null) {
        return true;
      }
      if (feature.properties["natural"] == "water" || feature.properties["waterway"] == "riverbank") {
        return true;
      }
      if (feature.properties["building"] != null) {
        return true;
      }
      if (feature.properties["area:highway"] && feature.properties["foot"] == "no") {
        return true;
      }
      if (mapStyle.isAccessValueRestrictive(feature.properties["access"]) && feature.properties["amenity"] != "parking") {
        if (feature.properties["foot"] == null || mapStyle.isAccessValueRestrictive(feature.properties["foot"])) {
          return true;
        }
      }
      return false;
    },

    isFeatureMakingFreePedestrianMovementPossible(feature) {
      if (mapStyle.motorizedRoadValuesArray().includes(feature.properties["highway"]) || ["footway", "pedestrian", "path", "steps", "cycleway"].includes(feature.properties["highway"])) {
        if (mapStyle.isAccessValueRestrictive(feature.properties["foot"])) {
          return false;
        }
        if (feature.properties["highway"] == "motorway" && feature.properties["foot"] == null) {
          // assume no for motorways, but do not discard them completely: some can be walked on foot (yes really)
          return false;
        }
        if (feature.properties["highway"] == "service" && feature.properties["service"] == "driveway") {
          if (feature.properties["foot"] != null && !mapStyle.isAccessValueRestrictive(feature.properties["foot"])) {
            return true;
          }
          if (feature.properties["access"] != null && !mapStyle.isAccessValueRestrictive(feature.properties["access"])) {
            return true;
          }
          return false; // assume false for driveways
        }

        if (!mapStyle.isAccessValueRestrictive(feature.properties["access"]) && !mapStyle.isAccessValueRestrictive(feature.properties["foot"])) {
          return true;
        }
        if (mapStyle.isAccessValueRestrictive(feature.properties["access"])) {
          if (feature.properties["foot"] != null && !mapStyle.isAccessValueRestrictive(feature.properties["foot"])) {
            return true;
          } else {
            return false;
          }
        }
        alert("Should be impossible [isFeatureMakingFreePedestrianMovementPossible for " + JSON.stringify(feature) + "], please report bug to https://github.com/matkoniecz/lunar_assembler");
      }
    },

    boundsToGeojsonGeometry(readableBounds) {
      var entireAreaRing = [
        [readableBounds["east"], readableBounds["south"]],
        [readableBounds["west"], readableBounds["south"]],
        [readableBounds["west"], readableBounds["north"]],
        [readableBounds["east"], readableBounds["north"]],
        [readableBounds["east"], readableBounds["south"]],
      ];
      return [entireAreaRing];
    },

    fillSliversAroundFootways(dataGeojson, readableBounds) {
      var emptyArea = mapStyle.boundsToGeojsonGeometry(readableBounds);
      var footwayArea = findMergeGroupObject(dataGeojson, "area:highway_footway");
      if (footwayArea === undefined) {
        return dataGeojson;
      }
      emptyArea = polygonClipping.difference(emptyArea, footwayArea.geometry.coordinates);

      var roadArea = findMergeGroupObject(dataGeojson, "area:highway_carriageway_layer");
      if (roadArea === undefined) {
        // alert("no road areas (lines tagged with a proper highway=*) in range!");
        // no need to repeat warning
      } else {
        emptyArea = polygonClipping.difference(emptyArea, roadArea.geometry.coordinates);
      }

      var buildingArea = findMergeGroupObject(dataGeojson, "buildings");
      if (buildingArea === undefined) {
        //alert("no building areas (areas tagged with a building=*) in range!");
        // no need to repeat warning
      } else {
        emptyArea = polygonClipping.difference(emptyArea, buildingArea.geometry.coordinates);
      }

      var crossingArea = findMergeGroupObject(dataGeojson, "area:highway_crossing");
      if (crossingArea === undefined) {
        // no need to repeat warning
      } else {
        emptyArea = polygonClipping.difference(emptyArea, crossingArea.geometry.coordinates);
      }

      var blockedArea = findMergeGroupObject(dataGeojson, "generated_blocked_chunk");
      if (blockedArea === undefined) {
        //alert("no building areas (areas tagged with a building=*) in range!");
        // no need to repeat warning
      } else {
        emptyArea = polygonClipping.difference(emptyArea, blockedArea.geometry.coordinates);
      }

      var k = emptyArea.length;
      while (k--) {
        const chunk = {
          type: "Feature",
          geometry: { type: "Polygon", coordinates: emptyArea[k] },
          properties: {},
        };
        console.log("checked area has area of " + turf.area(chunk) + " square meters and");
        if (turf.area(chunk) < 5) {
          console.log("is now being included into footway area");
          // TODO: use
          // turf.lineOverlap(chunk, footwayArea)
          // or similar to merge in only actually adjoining
          // (lineOverlap seemed weird a bit and actual unions would likely should be done later)
          footwayArea.geometry.coordinates = polygonClipping.union(chunk.geometry.coordinates, footwayArea.geometry.coordinates);
        } else {
          console.log("nothing happens");
        }
      }

      return dataGeojson;
    },

    generateRestrictedAcccessArea(geojson, readableBounds) {
      var entireArea = mapStyle.boundsToGeojsonGeometry(readableBounds);
      var freelyTraversableArea = entireArea;
      generated = [];
      featuresGivingAccess = [];
      var i = geojson.features.length;
      while (i--) {
        var feature = geojson.features[i];
        if (mapStyle.isFeatureMakingFreePedestrianMovementPossible(feature)) {
          featuresGivingAccess.push(feature);
        }
        const link = "https://www.openstreetmap.org/" + feature.id;
        if (feature.geometry.type != "Polygon" && feature.geometry.type != "MultiPolygon") {
          continue;
        }
        if (mapStyle.isAreaMakingFreePedestrianMovementImpossible(feature)) {
          var freelyTraversableArea = polygonClipping.difference(freelyTraversableArea, feature.geometry.coordinates);
          if (feature.properties["natural"] != "water" && feature.properties["waterway"] != "riverbank") {
            // water has its own special rendering and does not need this
            var cloned = JSON.parse(JSON.stringify(feature));
            cloned.properties = { native_blocked_chunk: "yes" };
            generated.push(cloned);
          }
        }
      }
      //console.warn(JSON.stringify({ type: "MultiPolygon", coordinates: freelyTraversableArea }));

      var k = freelyTraversableArea.length;
      while (k--) {
        const traversableChunk = {
          type: "Feature",
          geometry: { type: "Polygon", coordinates: freelyTraversableArea[k] },
          properties: {},
        };
        var i = featuresGivingAccess.length;
        while (i--) {
          const accessGivingFeature = featuresGivingAccess[i];

          if (turf.lineIntersect(traversableChunk, accessGivingFeature).features.length != 0) {
            traversableChunk.properties["generated_traversable_chunk"] = "yes";
            break;
          }
        }
        if (traversableChunk.properties["generated_traversable_chunk"] != "yes") {
          traversableChunk.properties["generated_blocked_chunk"] = "yes";
        }
        //alert(JSON.stringify(traversableChunk))
        geojson.features.push(traversableChunk);
      }
      var k = generated.length;
      while (k--) {
        geojson.features.push(generated[k]);
      }
      return geojson;
    },

    generateAreasFromBarriers(geojson) {
      generated = [];
      var i = geojson.features.length;
      while (i--) {
        var feature = geojson.features[i];
        const link = "https://www.openstreetmap.org/" + feature.id;

        if (["fence", "wall", "hedge", "retaining_wall", "hedge_bank", "wire_fence"].includes(feature.properties["barrier"])) {
          var produced = turf.buffer(feature, 0.1 / 1000, { units: "kilometers" });
          var cloned = JSON.parse(JSON.stringify(produced));
          cloned.properties["generated_barrier_area"] = feature.properties["barrier"];
          generated.push(cloned);
        }
      }

      var k = generated.length;
      while (k--) {
        geojson.features.push(generated[k]);
      }
      return geojson;
    },

    generateAreasFromRoadLines(geojson) {
      generated = [];
      var i = geojson.features.length;
      while (i--) {
        var feature = geojson.features[i];
        const link = "https://www.openstreetmap.org/" + feature.id;

        var width = mapStyle.widthOfRoadGeometryInMeters(feature);
        if (width != undefined) {
          {
            //alert(JSON.stringify(turf.buffer(feature, 0.005, {units: 'kilometers'})))
            var produced = turf.buffer(feature, width / 2 / 1000, { units: "kilometers" });
            var cloned = JSON.parse(JSON.stringify(produced));
            cloned.properties["area:highway"] = feature.properties["highway"];
            cloned.properties["area:highway_generated_automatically"] = "yes";
            generated.push(cloned);
          }
          {
            if (feature.properties["service"] != "driveway" && feature.properties["service"] != "parking_aisle") {
              // driveways are not allowed to produce footway halo around them
              if (feature.properties["embankment"] != "yes") {
                // hack, the proper solution would be to have separate groups for ones in embankment and not
                if (feature.properties["tunnel"] != "yes") {
                  // hack for now, likely separate matching group would be better
                  if (["footway", "pedestrian", "path", "steps", "cycleway"].includes(feature.properties["highway"])) {
                    width = width * 0.7;
                  }
                  var produced = turf.buffer(feature, (width / 2 / 1000) * 3 + 1 / 1000, { units: "kilometers" });
                  var cloned = JSON.parse(JSON.stringify(produced));
                  cloned.properties["area:highway_extra_size"] = feature.properties["highway"];
                  cloned.properties["area:highway_generated_automatically"] = "yes";
                  generated.push(cloned);
                }
              }
            }
          }
        }
      }

      var k = generated.length;
      while (k--) {
        geojson.features.push(generated[k]);
      }
      return geojson;
    },

    applyPatternsToCarriagewaysAndWater(dataGeojson) {
      // applied pattern is set of square holes, regularly spaced in a grid
      // it is intended to be used in a laser cutter that will burn are outside such exempt holes, producing a clear pattern
      // repeating pattern on grid of size 1m seems to work well, with hole 40cm sized and burned are 60cm wide
      // in created pattern it was 1mm for hole and 1.5 mm for space between giles

      // Returns BBox bbox extent in [minX, minY, maxX, maxY] order
      var kilometers = { units: "kilometers" };

      bbox = turf.bbox(dataGeojson);
      var minLongitude = bbox[0];
      var minLatitude = bbox[1];
      var maxLongitude = bbox[2];
      var maxLatitude = bbox[3];
      var from = turf.point([bbox[0], bbox[1]]); // turf.point(longitude, latitude, properties)
      var to = turf.point([bbox[2], bbox[3]]);
      var distanceInMeters = turf.distance(from, to, kilometers) * 1000;

      var from_horizontal = turf.point([minLongitude, minLatitude]); // turf.point(longitude, latitude, properties)
      var to_horizontal = turf.point([maxLongitude, minLatitude]);
      var distanceHorizontalInMeters = 1000 * turf.distance(from_horizontal, to_horizontal, kilometers);
      var distanceHorizontalInDegrees = maxLongitude - minLongitude;
      var metersInDegreeHorizontal = distanceHorizontalInMeters / distanceHorizontalInDegrees;

      var from_vertical = turf.point([minLongitude, minLatitude]); // turf.point(longitude, latitude, properties)
      var to_vertical = turf.point([minLongitude, maxLatitude]);
      var distanceVerticalInMeters = 1000 * turf.distance(from_vertical, to_vertical, kilometers);
      var distanceVerticalInDegrees = maxLatitude - minLatitude;
      var metersInDegreeVertical = distanceVerticalInMeters / distanceVerticalInDegrees;

      const roadHoleSizeInMeters = 0.5;
      const holeVerticalInMeters = roadHoleSizeInMeters;
      const holeHorizontalInMeters = roadHoleSizeInMeters;
      const roadSpaceBetweenInMeters = 0.75;
      const spaceVerticalInMeters = roadSpaceBetweenInMeters;
      const spaceHorizontalInMeters = roadSpaceBetweenInMeters;

      const waterSpaceBetweenRowsInMeters = 0.9;
      const waterRowSizeInMeters = 0.9;

      // generate pattern for road surface by intersecting it with a prepared pattern
      var i = dataGeojson.features.length;
      while (i--) {
        var feature = dataGeojson.features[i];
        if (feature.properties["lunar_assembler_merge_group"] == "water") {
          var generated = intersectGeometryWithHorizontalStripes(feature, waterRowSizeInMeters / metersInDegreeHorizontal, waterSpaceBetweenRowsInMeters / metersInDegreeHorizontal);
          generated.properties["lunar_assembler_cloned_for_pattern_fill"] = "yes";
          dataGeojson.features.push(generated); // added at the ned, and iterating from end to 0 so will not trigger infinite loop
        }
        if (feature.properties["lunar_assembler_merge_group"] == "area:highway_carriageway_layer") {
          var generated = intersectGeometryWithPlaneHavingRectangularHoles(
            feature,
            holeVerticalInMeters / metersInDegreeVertical,
            holeHorizontalInMeters / metersInDegreeHorizontal,
            spaceVerticalInMeters / metersInDegreeVertical,
            spaceHorizontalInMeters / metersInDegreeHorizontal
          );
          generated.properties["lunar_assembler_cloned_for_pattern_fill"] = "yes";
          dataGeojson.features.push(generated); // added at the ned, and iterating from end to 0 so will not trigger infinite loop
        }
      }
      return dataGeojson;
    },
  };
  return mapStyle;
}
