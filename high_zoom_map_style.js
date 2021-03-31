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
function fillColoring(feature){
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
}


function strokeColoring(feature){
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
    return "none";
  }
  
  function strokeWidth(feature){
    if(["motorway", "motorway_link", "trunk", "trunk_link", "primary", "primary_link",
        "secondary", "secondary_link", "tertiary", "tertiary_link",
        "unclassified", "residential"].includes(feature.properties["highway"])) {
        return 2;
      }
      if(feature.properties["aeroway"] === "runway" ) {
        return 5;
      }
      if(feature.properties["aeroway"] === "taxiway" ) {
        return 2;
      }
      if(["rail", "disused", "tram", "subway", "narrow_gauge", "light_rail", "preserved", "construction", "miniature", "monorail"].includes(feature.properties["railway"])) {
        return 2;
      }
  
    return 1
  }
  
  function deb(feature){
    return feature.properties.name
  }
  