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
        (feature.properties["natural"] == null ||
          feature.properties["natural"] == "water") &&
        feature.properties["landuse"] == null &&
        feature.properties["leisure"] == null
      ) {
        layer = feature.properties["layer"];
      }
    }

    if (
      mapStyle
        .railwayLinearValuesArray()
        .includes(feature.properties["railway"])
    ) {
      var priority = 0.99;
      return valueRangeForOneLayer * priority + valueRangeForOneLayer * layer;
    }
    if (feature.properties["area:highway"] != null) {
      var priority = 0.98;
      return valueRangeForOneLayer * priority + valueRangeForOneLayer * layer;
    }
    if (
      feature.properties["building"] != null &&
      feature.properties["location"] != "underground"
    ) {
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
    if (
      feature.properties["natural"] === "water" ||
      feature.properties["waterway"] === "riverbank"
    ) {
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

  fillColoring(feature) {
    console.log(feature);
    if (["Point"].includes(feature.geometry.type)) {
      //no rendering of points, for start size seems to randomly differ
      // and leaves ugly circles - see building=* areas
      return "none";
    }

    if (feature.properties["building"] != null) {
      return "black";
    }
    if (
      mapStyle
        .motorizedRoadValuesArray()
        .includes(feature.properties["area:highway"])
    ) {
      return "#555555";
    }
    if (
      ["footway", "pedestrian", "path", "steps"].includes(
        feature.properties["area:highway"]
      ) ||
      (feature.properties["highway"] == "pedestrian" &&
        feature.properties["area"] === "yes")
    ) {
      return "#aaaaaa";
    }
    if (feature.properties["area:highway"] === "cycleway") {
      return "#9595b4";
    }
    if (feature.properties["area:highway"] === "bicycle_crossing") {
      return "#bea4c1";
    }
    if (feature.properties["area:highway"] === "crossing") {
      return "#a06060";
    }
    if (
      feature.properties["natural"] === "water" ||
      feature.properties["waterway"] === "riverbank"
    ) {
      return "blue";
    }
    if (
      feature.properties["natural"] === "wood" ||
      feature.properties["landuse"] === "forest"
    ) {
      return "green";
    }
    if (
      ["industrial", "railway", "quarry", "construction", "military"].includes(
        feature.properties["landuse"]
      ) ||
      feature.properties["aeroway"] === "aerodrome"
    ) {
      return "#efdfef";
    }
    if (
      [
        "residential",
        "highway",
        "retail",
        "commercial",
        "garages",
        "farmyard",
      ].includes(feature.properties["landuse"]) ||
      ["school", "kidergarten", "university"].includes(
        feature.properties["amenity"]
      )
    ) {
      return "#efefef";
    }
    if (["farmland", "vineyard"].includes(feature.properties["landuse"])) {
      return "#eef0d5";
    }
    if (
      ["park", "pitch", "playground"].includes(feature.properties["leisure"]) ||
      feature.properties["landuse"] === "village_green"
    ) {
      return "#c8facc";
    }
    if (
      ["grass", "allotments", "orchard", "meadow"].includes(
        feature.properties["landuse"]
      ) ||
      ["grassland", "scrub", "heath"].includes(feature.properties["natural"]) ||
      ["garden"].includes(feature.properties["leisure"])
    ) {
      return "#a2ce8d";
    }
    if (feature.properties["man_made"] === "bridge") {
      return "gray";
    }
    if (feature.properties["natural"] === "bare_rock") {
      return "#EEE5DC";
    }
    return "none";
  },

  strokeColoring(feature) {
    if (["fence", "wall"].includes(feature.properties["barrier"])) {
      return "black";
    }
    if (
      mapStyle
        .motorizedRoadValuesArray()
        .includes(feature.properties["highway"])
    ) {
      return "#555555";
    }
    if (
      ["footway", "pedestrian", "path", "pedestrian"].includes(
        feature.properties["highway"]
      )
    ) {
      return "#aaaaaa";
    }
    if (feature.properties["highway"] === "cycleway") {
      return "#9595b4";
    }

    if (
      feature.properties["aeroway"] === "runway" ||
      feature.properties["aeroway"] === "taxiway"
    ) {
      return "purple";
    }

    if (
      mapStyle
        .railwayLinearValuesArray()
        .includes(feature.properties["railway"])
    ) {
      return "black";
    }
    if (feature.properties["waterway"] != null) {
      return "blue";
    }

    return "none";
  },

  strokeWidth(feature) {
    if (
      mapStyle
        .motorizedRoadValuesArray()
        .includes(feature.properties["highway"])
    ) {
      return 2;
    }
    if (feature.properties["aeroway"] === "runway") {
      return 5;
    }
    if (feature.properties["waterway"] === "river") {
      return 10;
    }
    if (feature.properties["waterway"] === "canal") {
      return 7;
    }
    if (feature.properties["waterway"] === "stream") {
      return 2;
    }
    if (["ditch", "drain"].includes(feature.properties["waterway"])) {
      return 1;
    }
    if (feature.properties["aeroway"] === "taxiway") {
      return 2;
    }
    if (
      mapStyle
        .railwayLinearValuesArray()
        .includes(feature.properties["railway"])
    ) {
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
      mapStyle
        .motorizedRoadValuesArray()
        .includes(feature.properties["area:highway"])
    ) {
      return "area:highway_carriageway";
    }
    if (
      ["footway", "pedestrian", "path", "steps"].includes(
        feature.properties["area:highway"]
      ) ||
      (feature.properties["highway"] == "pedestrian" &&
        feature.properties["area"] === "yes")
    ) {
      return "area:highway_footway";
    }
    if (feature.properties["area:highway"] == "cycleway") {
      return "area:highway_cycleway";
    }
    return null;
  },

  name(feature) {
    return feature.properties.name;
  },
};
