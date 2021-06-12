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
function highZoomMapStyle() {
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
      if (feature.properties["area:highway"] != null) {
        var priority = 0.98;
        return valueRangeForOneLayer * priority + valueRangeForOneLayer * layer;
      }
      if (feature.properties["building"] != null && feature.properties["location"] != "underground") {
        var priority = 0.95;
        return valueRangeForOneLayer * priority + valueRangeForOneLayer * layer;
      }
      if (feature.properties["barrier"] != null) {
        var priority = 0.9;
        return valueRangeForOneLayer * priority + valueRangeForOneLayer * layer;
      }
      if (feature.properties["highway"] != null) {
        var priority = 0.85;
        return valueRangeForOneLayer * priority + valueRangeForOneLayer * layer;
      }
      if (feature.properties["barrier"] != null) {
        var priority = 0.7;
        return valueRangeForOneLayer * priority + valueRangeForOneLayer * layer;
      }
      if (feature.properties["man_made"] === "bridge") {
        var priority = 0.65;
        return valueRangeForOneLayer * priority + valueRangeForOneLayer * layer;
      }
      if (feature.properties["waterway"] != null) {
        /* render waterway lines under bridge areas */
        var priority = 0.6;
        return valueRangeForOneLayer * priority + valueRangeForOneLayer * layer;
      }
      if (feature.properties["natural"] === "water" || feature.properties["waterway"] === "riverbank") {
        // render natural=wood below natural=water
        var priority = 0.1;
        return valueRangeForOneLayer * priority + valueRangeForOneLayer * layer;
      }
      if (feature.properties["natural"] === "bare_rock") {
        // render natural=wood below natural=bare_rock
        // render water rather than underwater rocks
        var priority = 0.05;
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
      returned = []
      var i = motorizedRoadValuesArray().length;
      while (i--) {
        value = motorizedRoadValuesArray()[i];
        returned.push( {
          'area_color': "#555555",
          'description': 'area of a motorized road (linear representation must be also present! Using only area representation is invalid!)',
          'matches': [
            {'key': 'area:highway', 'value': value},
          ],
        })
        returned.push( {
          'line_color': "#555555",
          'line_width': 2,
          'description': 'linear representation of a motorized road',
          'matches': [
            {'key': 'highway', 'value': value},
          ],
        })
      }

      var i = railwayLinearValuesArray().length;
      while (i--) {
        value = railwayLinearValuesArray()[i];
        returned.push( {
          'line_color': "black",
          'line_width': 2,
          'description': 'linear representation of a single railway track',
          'matches': [
            {'key': 'railway', 'value': value},
          ],
        })
      }

      var i = pedestrianWaysValuesArray().length;
      while (i--) {
        value = pedestrianWaysValuesArray()[i];
        returned.push( {
          'area_color': "#aaaaaa",
          'description': 'area of a pedestrian way (linear representation must be also present! Using only area representation is invalid!)',
          'matches': [
            {'key': 'area:highway', 'value': value},
          ],
        })
        returned.push( {
          'line_color': "#aaaaaa",
          'line_width': 1,
          'description': 'linear representation of a pedestrian way',
          'matches': [
            {'key': 'highway', 'value': value},
          ],
        })
      }

      var barriersKeyValue = []
      var i = linearGenerallyImpassableBarrierValuesArray().length;
      while (i--) {
        value = linearGenerallyImpassableBarrierValuesArray()[i];
        barriersKeyValue.push({'key': 'barrier', 'value': value})
      }

      returned.push({
        'line_color': "black",
        'line_width': 1,
        'description': 'linear, generally impassable barrier',
        'matches': barriersKeyValue,
      })

    returned.push(...[
        {
          'area_color': "#aaaaaa",
          'description': 'pedestrian square (using it for sidewalk areas is invalid!)',
          'matches': [
            [
              {'key': 'highway', 'value': 'pedestrian'},
              {'key': 'area', 'value': 'yes', 'role': 'supplementary_obvious_filter'},
            ],
            [
              {'key': 'highway', 'value': 'pedestrian'},
              {'key': 'type', 'value': 'multipolygon', 'role': 'supplementary_obvious_filter'},
            ],
          ],
        },
        {
          'area_color': "#555555",
          'description': 'road area of a taxi stop (used in addition to amenity=taxi)',
          'matches': [
            {'key': 'area:highway', 'value': 'taxi_stop'},
          ],
        },
        {
          'area_color': "#555555",
          'description': 'road area of a bus stop (used in addition to highway=bus_stop)',
          'matches': [
            {'key': 'area:highway', 'value': 'bus_stop'},
          ],
        },
        {
          'line_color': "#9595b4",
          'line_width': 1,
          'description': 'linear representation of a cycleway',
          'matches': [
            {'key': 'highway', 'value': 'cycleway'},
          ],
        },
        {
          'area_color': "#9595b4",
          'description': 'area of a cycleway (linear representation must be also present! Using only area representation is invalid!)',
          'matches': [
            {'key': 'area:highway', 'value': 'cycleway'},
          ],
        },
        {
          'area_color': "#a06060",
          'description': 'pedestrian crossing through a road (area used in addition to area representing road)',
          'matches': [
            {'key': 'area:highway', 'value': 'crossing'},
          ],
        },
        {
          'area_color': "#bea4c1",
          'description': 'bicycle crossing through a road (area used in addition to area representing road)',
          'matches': [
            {'key': 'area:highway', 'value': 'bicycle_crossing'},
          ],
        },
        {
          'area_color': "blue",
          'description': 'water',
          'matches': [
            {'key': 'natural', 'value': 'water'},
            {'key': 'waterway', 'value': 'riverbank'},
          ],
        },
        {
          'line_color': "blue",
          'line_width': 10,
          'description': 'linear representation of a river',
          'matches': [
            {'key': 'waterway', 'value': 'river'},
          ],
        },
        {
          'line_color': "blue",
          'line_width': 7,
          'description': 'linear representation of a canal, assumed to be large',
          'matches': [
            {'key': 'waterway', 'value': 'canal'},
          ],
        },
        {
          'line_color': "blue",
          'line_width': 2,
          'description': 'linear representation of a stream',
          'matches': [
            {'key': 'waterway', 'value': 'stream'},
          ],
        },
        {
          'line_color': "blue",
          'line_width': 1,
          'description': 'linear representation of a ditch/drain',
          'matches': [
            {'key': 'waterway', 'value': 'ditch'},
            {'key': 'waterway', 'value': 'stream'},
          ],
        },
        {
          'area_color': "black",
          'description': 'buildings (all and every building value. Yes - including building=no that has no good reason for use)',
          'matches': [
            {'key': 'building'},
          ],
        },
        {
          'area_color': "green",
          'description': 'tree-covered land',
          'matches': [
            {'key': 'natural', 'value': 'wood'},
            {'key': 'landuse', 'value': 'forest'},
          ],
        },
        {
          'area_color': "#efdfef",
          'description': 'part of general military-industrial land',
          'matches': [
            {'key': 'landuse', 'value': 'industrial'},
            {'key': 'landuse', 'value': 'railway'},
            {'key': 'landuse', 'value': 'quarry'},
            {'key': 'landuse', 'value': 'construction'},
            {'key': 'landuse', 'value': 'military'},
            {'key': 'aeroway', 'value': 'aerodrome'},
          ],
        },
        {
          'area_color': "#efefef",
          'description': 'part of general builtup land',
          'matches': [
            {'key': 'landuse', 'value': 'residential'},
            {'key': 'landuse', 'value': 'highway'},
            {'key': 'landuse', 'value': 'retail'},
            {'key': 'landuse', 'value': 'commercial'},
            {'key': 'landuse', 'value': 'garages'},
            {'key': 'landuse', 'value': 'farmyard'},
            {'key': 'landuse', 'value': 'education'},
            {'key': 'amenity', 'value': 'school'},
            {'key': 'amenity', 'value': 'kidergarten'},
            {'key': 'amenity', 'value': 'university'},
          ],
        },
        {
          'area_color': "#eef0d5",
          'description': 'plants on an agriculture land',
          'matches': [
            {'key': 'landuse', 'value': 'farmland'},
            {'key': 'landuse', 'value': 'vineyard'},
            {'key': 'landuse', 'value': 'orchard'},
          ],
        },
        {
          'area_color': "#c8facc",
          'description': 'recreation land',
          'matches': [
            {'key': 'leisure', 'value': 'park'},
            {'key': 'leisure', 'value': 'pitch'},
            {'key': 'leisure', 'value': 'playground'},
            {'key': 'landuse', 'value': 'village_green'},
          ],
        },
        {
          'area_color': "#a2ce8d",
          'description': 'vegetation that is not agriculture or forest',
          'matches': [
            {'key': 'landuse', 'value': 'grass'},
            {'key': 'landuse', 'value': 'allotments'},
            {'key': 'landuse', 'value': 'meadow'},
            {'key': 'natural', 'value': 'grassland'},
            {'key': 'natural', 'value': 'scrub'},
            {'key': 'natural', 'value': 'heath'},
            {'key': 'leisure', 'value': 'garden'},
          ],
        },
        {
          'area_color': "gray",
          'description': 'bridge outline',
          'matches': [
            {'key': 'man_made', 'value': 'bridge'},
          ],
        },
        {
          'area_color': "#EEE5DC",
          'description': 'bare rock',
          'matches': [
            {'key': 'natural', 'value': 'bare_rock'},
          ],
        },
        {
          'line_color': "purple",
          'line_width': 5,
          'description': 'runway',
          'matches': [
            {'key': 'aeroway', 'value': 'runway'},
          ],
        },
        {
          'line_color': "purple",
          'line_width': 2,
          'description': 'taxiway',
          'matches': [
            {'key': 'aeroway', 'value': 'taxiway'},
          ],
        },
     ])
     return returned
    },

    fillColoring(feature) {
      //console.log(feature);
      if (["Point"].includes(feature.geometry.type)) {
        //no rendering of points, for start size seems to randomly differ
        // and leaves ugly circles - see building=* areas
        return "none";
      }

      // more complex rules can be used here in addition - or instead of unified styling
      return getMatchFromUnifiedStyling(feature, 'area_color', mapStyle.unifiedStyling());
    },

    strokeColoring(feature) {
      if (["Point"].includes(feature.geometry.type)) {
        //no rendering of points, for start size seems to randomly differ
        // and leaves ugly circles - see building=* areas
        return "none";
      }

      // more complex rules can be used here in addition - or instead of unified styling

      return getMatchFromUnifiedStyling(feature, 'line_color', mapStyle.unifiedStyling());
    },

    strokeWidth(feature) {
      // more complex rules can be used here in addition - or instead of unified styling

      return getMatchFromUnifiedStyling(feature, 'line_width', mapStyle.unifiedStyling());
    },

    mergeIntoGroup(feature) {
      // note that points and lines are not being merged!
      // only areas (including multipolygins) can be merged for now
      // please open an issue if you need it, it increaes chance of implementation a bit
      // or open pull request with an implementation
      if (motorizedRoadValuesArray().includes(feature.properties["area:highway"])) {
        return "area:highway_carriageway_layer" + feature.properties["layer"];
      }
      if (
        pedestrianWaysValuesArray().includes(feature.properties["area:highway"]) ||
        (feature.properties["highway"] == "pedestrian" && (feature.properties["area"] === "yes" || feature.properties["type"] === "multipolygon"))
      ) {
        return "area:highway_footway" + feature.properties["layer"];
      }
      if (feature.properties["area:highway"] == "cycleway") {
        return "area:highway_cycleway" + feature.properties["layer"];
      }
      return null;
    },

    name(feature) {
      return feature.properties.name;
    },
  };
  return mapStyle;
}
