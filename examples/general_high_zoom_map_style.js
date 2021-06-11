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
        "busway",
        "bus_stop",
        "taxi_stop",
        "raceway",
        "escape",
      ];
    },

    pedestrianWaysValuesArray() {
      return [
        "footway",
        "path",
        "steps",
        "pedestrian",
        "living_street",
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

      if (mapStyle.railwayLinearValuesArray().includes(feature.properties["railway"])) {
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
      var i = this.motorizedRoadValuesArray().length;
      while (i--) {
        value = this.motorizedRoadValuesArray()[i];
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

      var i = this.railwayLinearValuesArray().length;
      while (i--) {
        value = this.railwayLinearValuesArray()[i];
        returned.push( {
          'line_color': "black",
          'line_width': 2,
          'description': 'linear representation of a single railway track',
          'matches': [
            {'key': 'railway', 'value': value},
          ],
        })
      }

      var i = this.pedestrianWaysValuesArray().length;
      while (i--) {
        value = this.pedestrianWaysValuesArray()[i];
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
          'line_color': "#9595b4",
          'line_width': 1,
          'description': 'linear representation of a cycleway',
          'matches': [
            {'key': 'highway', 'value': 'crossing'},
          ],
        },
        {
          'area_color': "#9595b4",
          'description': 'area of a cycleway (linear representation must be also present! Using only area representation is invalid!)',
          'matches': [
            {'key': 'area:highway', 'value': 'crossing'},
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
          'area_color': "blue",
          'description': 'water',
          'matches': [
            {'key': 'natural', 'value': 'water'},
            {'key': 'waterway', 'value': 'riverbank'},
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
          'line_color': "black",
          'line_width': 1,
          'description': 'raised barrier',
          'matches': [
            {'key': 'barrier', 'value': 'fence'},
            {'key': 'barrier', 'value': 'wall'},
            {'key': 'barrier', 'value': 'guard_rail'},
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

    generateLegendEntry(key, value, rule){
      var url_value = "https://wiki.openstreetmap.org/wiki/Tag:" + encodeURIComponent(key + "=" + value);
      var url_key = "https://wiki.openstreetmap.org/wiki/Key:" + encodeURIComponent(key);

      var linked_key = '<a href="' + url_key + '">' + key + "</a>"
      if(value == undefined) {
        return "<li>" + linked_key  + "=* - " + rule["description"] + "</li>\n"
      } else {
        var linked_value = '<a href="' + url_value + '">' + value + "</a>"
        return "<li>" + linked_key + "=" + linked_value + " - " + rule["description"] + "</li>\n"

      }


    },

    // highZoomMapStyle().generateLegend() in console
    generateLegend(){
      var returned = "<ul>\n"
      const styleRules = mapStyle.unifiedStyling()
      var k = -1;
      while (k+1 < styleRules.length) {
        k++;
        const rule = styleRules[k];
        var i = rule['matches'].length;
        while (i--) {
          const match = rule['matches'][i];
          if(Array.isArray(match)) {
            // multiple rules, all must be matched
            var actualFiters = [];
            var m = match.length;
            while (m--) {
              if(match[m]['role'] === 'supplementary_obvious_filter') {
                continue;
              }
              actualFiters.push(match[m]);
            }
            if(actualFiters.length != 1){
              throw "unsupported to have multiple actual filters!"
            }
            returned += mapStyle.generateLegendEntry(actualFiters[0]['key'], actualFiters[0]['value'], rule)
          } else {
            // single key=* or key=value match
            returned += mapStyle.generateLegendEntry(match['key'], match['value'], rule)
          }
        }
      }
      returned += "</ul>"
      return returned;
    },

    isMatcherMatchingFeature(match, feature){
      if(('value' in match) === false) {
        // matches any key
        if(match["key"] in feature.properties) {
          return true;
        }
      } else if(feature.properties[match["key"]] == match["value"]) {
        return true;
      }
      return false;
    },

    getMatchFromUnifiedStyling(feature, property) {
      const styleRules = mapStyle.unifiedStyling()
      var k = styleRules.length;
      while (k--) {
        const rule = styleRules[k];
        if((property in rule) === false) {
          continue;
        }
        var i = rule['matches'].length;
        while (i--) {
            const match = rule['matches'][i];
            if(Array.isArray(match)) {
              // multiple rules, all must be matched
              var m = match.length;
              var success = true;
              while (m--) {
                if(mapStyle.isMatcherMatchingFeature(match[m], feature) == false) {
                  success = false;
                }
              }
              if(success) {
                return rule[property]
              }

            } else {
              // single key=* or key=value match
              if(mapStyle.isMatcherMatchingFeature(match, feature)) {
                return rule[property]
              }  
            }
          }
      }
      return "none";
    },

    fillColoring(feature) {
      //console.log(feature);
      if (["Point"].includes(feature.geometry.type)) {
        //no rendering of points, for start size seems to randomly differ
        // and leaves ugly circles - see building=* areas
        return "none";
      }

      // more complex rules can be used here in addition - or instead of unified styling

      return mapStyle.getMatchFromUnifiedStyling(feature, 'area_color');
    },

    strokeColoring(feature) {
      if (["Point"].includes(feature.geometry.type)) {
        //no rendering of points, for start size seems to randomly differ
        // and leaves ugly circles - see building=* areas
        return "none";
      }

      // more complex rules can be used here in addition - or instead of unified styling

      return mapStyle.getMatchFromUnifiedStyling(feature, 'line_color');
    },

    strokeWidth(feature) {
      // more complex rules can be used here in addition - or instead of unified styling

      return mapStyle.getMatchFromUnifiedStyling(feature, 'line_width');
    },

    mergeIntoGroup(feature) {
      // note that points and lines are not being merged!
      // only areas (including multipolygins) can be merged for now
      // please open an issue if you need it, it increaes chance of implementation a bit
      // or open pull request with an implementation
      if (mapStyle.motorizedRoadValuesArray().includes(feature.properties["area:highway"])) {
        return "area:highway_carriageway_layer" + feature.properties["layer"];
      }
      if (
        mapStyle.pedestrianWaysValuesArray().includes(feature.properties["area:highway"]) ||
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
