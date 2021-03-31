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
paintOrderCompareFunction(featureFirst, featureSecond) {
    // < 0 - First element must be placed before second
    // 0 - Both elements is equal, do not change order.
    // > 0 - Second element must be placed before first.
    // https://stackoverflow.com/a/41121134/4130619

    // if featureFirst should be drawn over featureSecond
    // on top of it, hding it
    // return 1

    return mapStyle.paintOrder(featureFirst) - mapStyle.paintOrder(featureSecond);
    // TODO to halve calculations it would be possible to map features to values,
    // and sort that values, right? Or maybe not...
  },

paintOrder(feature) {
    // higher values: more on top

    // TODO:
    // it WILL fail for: buildings under bridges
    // bridges over bridges
    // water bridges over something
    // undeground buildings and other features undegrounds and in tunnels
    if(feature.properties["area:highway"] != null) {
        return 1000;
    }
    if(feature.properties["building"] != null) {
        return 900;
    }
    if(feature.properties["barrier"] != null) {
        return 850;
    }
    if(feature.properties["waterway"] != null) {
      return 830;
  }
    if(feature.properties["highway"] != null) {
        return 800;
    }
    if(feature.properties["man_made"] === "bridge") {
        return 700;
    }
    if(feature.properties["natural"] === "water" || feature.properties["waterway"] === "riverbank") {
        // render natural=wood below natural=water
        return 1;
    }
    if(feature.properties["leisure"] != null) {
        // render leisure=park below natural=water or natural=wood
        return -2;
    }
    return 0;
},

fillColoring(feature){
    console.log(feature);
    if (["Point"].includes(feature.geometry.type)) {
      //no rendering of points, for start size seems to randomly differ
      // and leaves ugly circles - see building=* areas
      return "none";        
    }

    if(feature.properties["building"] != null) {
      return "black";
    }
    if(["motorway", "motorway_link", "trunk", "trunk_link", "primary", "primary_link",
      "secondary", "secondary_link", "tertiary", "tertiary_link",
      "unclassified", "residential",
      "service", "track", "road"].includes(feature.properties["area:highway"])) {
      return "#555555";
    }
    if(["footway", "pedestrian", "path"].includes(feature.properties["area:highway"]) || (feature.properties["highway"] == "pedestrian" && feature.properties["area"] === "yes")) {
      return "#aaaaaa";
    }
    if(feature.properties["area:highway"] === "cycleway" ) {
      return "#9595b4";
    }
    if(feature.properties["area:highway"] === "bicycle_crossing" ) {
      return "#bea4c1";
    }
    if(feature.properties["area:highway"] === "crossing" ) {
      return "#a06060";
    }  
    if(feature.properties["natural"] === "water" || feature.properties["waterway"] === "riverbank") {
      return "blue";
    }
    if(feature.properties["natural"] === "wood" || feature.properties["landuse"] === "forest")  {
      return "green";
    }
    if(["industrial", "railway"].includes(feature.properties["landuse"])){
        return "#efdfef";
    }
    if(["residential", "highway", "retail", "commercial", "garages"].includes(feature.properties["landuse"]) || ["school", "kidergarten", "university"].includes(feature.properties["amenity"])){
        return "#efefef";
    }
    if(["farmland", "vineyard"].includes(feature.properties["landuse"])){
      return "#eef0d5";
    }
    if(["park", "pitch"].includes(feature.properties["leisure"]) || feature.properties["landuse"] === "village_green") {
      return "#c8facc";
    }
    if(["grass", "allotments", "orchard"].includes(feature.properties["landuse"]) || ["grassland", "meadow"].includes(feature.properties["natural"]) || ["garden"].includes(feature.properties["leisure"])) {
      return "#a2ce8d";
    }
    if(feature.properties["man_made"] === "bridge") {
      return "gray";
    }
    return "none";
},


strokeColoring(feature){
    if(["fence", "wall"].includes(feature.properties["barrier"])) {
        return "black";
    }
    if(["motorway", "motorway_link", "trunk", "trunk_link", "primary", "primary_link",
        "secondary", "secondary_link", "tertiary", "tertiary_link",
        "unclassified", "residential",
        "service", "track", "road"].includes(feature.properties["highway"])) {
        return "#555555";
      }
      if(["footway", "pedestrian", "path", "pedestrian"].includes(feature.properties["highway"])) {
        return "#aaaaaa";
      }
      if(feature.properties["highway"] === "cycleway" ) {
        return "#9595b4";
      }
  
      if(feature.properties["aeroway"] === "runway" ||  feature.properties["aeroway"] === "taxiway" ) {
        return "purple";
      }
  
      if(["rail", "disused", "tram", "subway", "narrow_gauge", "light_rail", "preserved", "construction", "miniature", "monorail"].includes(feature.properties["railway"])) {
        return "black";
      }
      if(feature.properties["waterway"] != null ) {
        return "blue";
      }

      return "none";
  },
  
strokeWidth(feature){
    if(["motorway", "motorway_link", "trunk", "trunk_link", "primary", "primary_link",
        "secondary", "secondary_link", "tertiary", "tertiary_link",
        "unclassified", "residential"].includes(feature.properties["highway"])) {
        return 2;
      }
      if(feature.properties["aeroway"] === "runway" ) {
        return 5;
      }
      if(feature.properties["waterway"] === "river" ) {
        return 10;
      }
      if(feature.properties["waterway"] === "canal" ) {
        return 7;
      }
      if(feature.properties["waterway"] === "stream" ) {
        return 2;
      }
      if(["ditch", "drain"].includes(feature.properties["waterway"] )) {
        return 1;
      }
      if(feature.properties["aeroway"] === "taxiway" ) {
        return 2;
      }
      if(["rail", "disused", "tram", "subway", "narrow_gauge", "light_rail", "preserved", "construction", "miniature", "monorail"].includes(feature.properties["railway"])) {
        return 2;
      }
  
    return 1
  },
  
name(feature){
    return feature.properties.name
  }
}