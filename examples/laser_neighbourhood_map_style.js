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
      if (feature.properties["area:highway_extra_size"] != undefined) {
        return -1000 + Math.random();
      }
      // orfder does not really matter, random order may help expose some bugs with overlapping features
      return Math.random();
    },

    fillColoring(feature) {
      if (["Point"].includes(feature.geometry.type)) {
        //no rendering of points, for start size seems to randomly differ
        // and leaves ugly circles - see building=* nodes
        return "none";
      }
      console.log(feature);
      if (feature.properties["lunar_assembler_cloned_for_pattern_fill"] == "yes") {
        return "black";
      }
      if (feature.properties["lunar_assembler_step_segment"] == "0") {
        return "#400080";
      }
      if (feature.properties["lunar_assembler_step_segment"] == "1") {
        return "#ff0000";
      }
      if (feature.properties["lunar_assembler_step_segment"] == "2") {
        return "orange";
      }
      if (feature.properties["lunar_assembler_step_segment"] == "3") {
        return "#FFFF00";
      }
      if (feature.properties["building"] != null) {
        return "#603006";
      }
      if (mapStyle.motorizedRoadValuesArray().includes(feature.properties["area:highway"]) || feature.properties["area:highway"] === "bicycle_crossing") {
        return "gray";
      }

      if (mapStyle.motorizedRoadValuesArray().includes(feature.properties["area:highway_extra_size"]) || feature.properties["area:highway_extra_size"] === "bicycle_crossing") {
        return "#d3d3d3";
      }

      if (
        ["footway", "pedestrian", "path", "steps"].includes(feature.properties["area:highway"]) ||
        (feature.properties["highway"] == "pedestrian" && (feature.properties["area"] === "yes" || feature.properties["type"] === "multipolygon"))
      ) {
        if (feature.properties["footway"] == "crossing") {
          return "yellow";
        }
        return "green";
      }

      if (["footway", "pedestrian", "path", "steps"].includes(feature.properties["area:highway_extra_size"])) {
        if (feature.properties["footway"] == "crossing") {
          return "#eee8aa";
        }
        return "#adff2f";
      }

      if (feature.properties["natural"] === "water" || feature.properties["waterway"] === "riverbank") {
        return "blue";
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
        feature.properties["area:highway"] === "cycleway"
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

      if (["footway", "pedestrian", "path", "steps"].includes(feature.properties["area:highway"]) || (feature.properties["highway"] == "pedestrian" && feature.properties["area"] === "yes")) {
        // hack for https://www.openstreetmap.org/?mlat=50.05267&mlon=19.92927#map=19/50.05267/19.92927
        if (feature.properties["footway"] == "crossing") {
          return "area:highway_crossing";
        }
        return "area:highway_footway";
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
      return null;
    },

    name(feature) {
      return feature.properties.name;
    },

    // called after areas were merged, before sorting of areas
    // gets full data and can freely edit it
    transformGeometryAsInitialStep(data_geojson) {
      data_geojson = mapStyle.generateAreasFromRoadLines(data_geojson);
      return data_geojson;
    },

    // called after areas were merged, before sorting of areas
    // gets full data and can freely edit it
    transformGeometryAtFinalStep(data_geojson) {
      data_geojson = mapStyle.restrictPedestrianCrossingToRoadAreas(data_geojson);
      data_geojson = mapStyle.floodSliversWithFootways(data_geojson);
      data_geojson = mapStyle.eraseFootwayWhereIntersectingRoad(data_geojson);
      data_geojson = mapStyle.eraseFootwayWhereIntersectingBuilding(data_geojson);
      //TODO!!! data_geojson = mapStyle.applyPatternToRoadSurface(data_geojson);
      return data_geojson;
    },

    eraseFootwayWhereIntersectingRoad(data_geojson) {
      var roadArea = mapStyle.findMergeGroupObject(data_geojson, "area:highway_carriageway_layer");
      var footwayArea = mapStyle.findMergeGroupObject(data_geojson, "area:highway_footway");
      if (!mapStyle.isMultipolygonAsExpected(roadArea)) {
        console.log(roadArea);
      }
      if (!mapStyle.isMultipolygonAsExpected(footwayArea)) {
        console.log(footwayArea);
      }
      footwayArea.geometry.coordinates = polygonClipping.difference(footwayArea.geometry.coordinates, roadArea.geometry.coordinates);
      return data_geojson;
    },

    eraseFootwayWhereIntersectingBuilding(data_geojson) {
      var buildingArea = mapStyle.findMergeGroupObject(data_geojson, "buildings");
      var footwayArea = mapStyle.findMergeGroupObject(data_geojson, "area:highway_footway");
      if (!mapStyle.isMultipolygonAsExpected(buildingArea)) {
        console.log(buildingArea);
      }
      if (!mapStyle.isMultipolygonAsExpected(footwayArea)) {
        console.log(footwayArea);
      }
      footwayArea.geometry.coordinates = polygonClipping.difference(footwayArea.geometry.coordinates, buildingArea.geometry.coordinates);
      return data_geojson;
    },

    floodSliversWithFootways(data_geojson) {
      var extraRoadArea = mapStyle.findMergeGroupObject(data_geojson, "area:highway_carriageway_layer_extra_size");
      var footwayArea = mapStyle.findMergeGroupObject(data_geojson, "area:highway_footway");
      var extraFootwayArea = mapStyle.findMergeGroupObject(data_geojson, "area:highway_footway_extra_size");
      if (!mapStyle.isMultipolygonAsExpected(extraRoadArea)) {
        console.log(extraRoadArea);
      }
      if (!mapStyle.isMultipolygonAsExpected(extraFootwayArea)) {
        console.log(extraFootwayArea);
      }
      var intersectedGeometry = polygonClipping.intersection(extraFootwayArea.geometry.coordinates, extraRoadArea.geometry.coordinates);
      footwayArea.geometry.coordinates = polygonClipping.union(footwayArea.geometry.coordinates, intersectedGeometry);
      return data_geojson;
    },

    findMergeGroupObject(data_geojson, code) {
      var i = data_geojson.features.length;
      var found = undefined;
      while (i--) {
        var feature = data_geojson.features[i];
        if (feature.properties["lunar_assembler_merge_group"] == code) {
          if (found != undefined) {
            alert("more than one area of " + code + "type what is unexpected, things may break. This is a bug, please report it on https://github.com/matkoniecz/lunar_assembler/issues");
          }
          found = feature;
        }
      }
      if (found == undefined) {
        alert("failed to find " + code + " - if not expected please report at https://github.com/matkoniecz/lunar_assembler/issues");
      }
      return found;
    },

    restrictPedestrianCrossingToRoadAreas(data_geojson) {
      console.log(data_geojson);
      var roadArea = mapStyle.findMergeGroupObject(data_geojson, "area:highway_carriageway_layer");
      var crossingArea = mapStyle.findMergeGroupObject(data_geojson, "area:highway_crossing");
      if (crossingArea === undefined) {
        alert("no crossing areas (lines with footway=crossing) in range!");
        return data_geojson;
      }
      if (roadArea === undefined) {
        alert("no road areas (lines tagged with a proper highway=*) in range!");
        crossingArea.geometry.coordinates = [];
        return data_geojson;
      }
      crossingArea.geometry.coordinates = polygonClipping.intersection(crossingArea.geometry.coordinates, roadArea.geometry.coordinates);
      return data_geojson;
    },

    isMultipolygonAsExpected(feature) {
      if (feature.geometry.type == "Point" || feature.geometry.type === "MultiPoint") {
        alert("UNEXPECTED " + feature.geometry.type + " in " + JSON.stringify(feature));
        return false;
      } else if (feature.geometry.type == "LineString" || feature.geometry.type == "MultiLineString") {
        alert("UNEXPECTED " + feature.geometry.type + " in " + JSON.stringify(feature));
        return false;
      } else if (feature.geometry.type == "Polygon") {
        alert("UNEXPECTED " + feature.geometry.type + " in " + JSON.stringify(feature));
        return false;
      } else if (feature.geometry.type == "MultiPolygon") {
        return true;
      }
      alert("UNEXPECTED GEOMETRY " + feature.geometry.type);
      return false;
    },

    applyPatternToRoadSurface(data_geojson) {
      // applied pattern is set of square holes, regularly spaced in a grid
      // it is intended to be used in a laser cutter that will burn are outside such exempt holes, producing a clear pattern
      // repeating pattern on grid of size 1m seems to work well, with hole 40cm sized and burned are 60cm wide
      // in created pattern it was 1mm for hole and 1.5 mm for space between giles

      // Returns BBox bbox extent in [minX, minY, maxX, maxY] order
      bbox = turf.bbox(data_geojson);
      alert(JSON.stringify(bbox));
      var from = turf.point([bbox[0], bbox[1]]); // turf.point(longitude, latitude, properties)
      var to = turf.point([bbox[2], bbox[3]]);
      var options = { units: "kilometers" };
      var distance = turf.distance(from, to, options);
      alert(disance);

      const holeSizeInMeters = 0.4;
      const spaceBetweenInMeters = 0.6;

      // generate pattern for road surface by intersecting it with a prepared pattern
      var i = data_geojson.features.length;
      while (i--) {
        var feature = data_geojson.features[i];
        if (feature.properties["lunar_assembler_merge_group"] == "area:highway_carriageway_layer") {
          if (mapStyle.isMultipolygonAsExpected(feature)) {
            cloned = JSON.parse(JSON.stringify(feature));
            cloned.geometry.coordinates = polygonClipping.intersection(cloned.geometry.coordinates, mapStyle.pattern().geometry.coordinates);
            cloned.properties["lunar_assembler_cloned_for_pattern_fill"] = "yes";
            console.log("cloned");
            console.log(cloned);
            console.log("cloned");
            data_geojson.features.push(cloned);
          }
        }
      }
      return data_geojson;
    },

    widthOfRoadGeometryInMeters(feature) {
      if (mapStyle.motorizedRoadValuesArray().includes(feature.properties["highway"])) {
        if (feature.properties["lanes"] != undefined) {
          // in case of lanes==1 it is likely that it is wide anyway due to parking lanes
          // sypporting rhem would allow to drop this exception
          if (feature.properties["lanes"] != 1) {
            return feature.properties["lanes"] * 2.5;
          }
        }
        if (feature.properties["highway"] == "service" && ["driveway", "parking_aisle"].includes(feature.properties["service"])) {
          return 2.0;
        }
        if (feature.properties["highway"] == "service") {
          return 2.0;
        }
        return 5;
      }
      if (feature.properties["highway"] == "footway" || feature.properties["highway"] == "steps" || feature.properties["highway"] == "path" || feature.properties["highway"] == "steps") {
        return 5;
      }
      if (feature.properties["highway"] == "cycleway") {
        return 2;
      }
      return undefined;
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
  };
  return mapStyle;
}
