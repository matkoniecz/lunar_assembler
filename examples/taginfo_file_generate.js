var fs = require("fs");

// yes it is hack - if you are aware about a better way let me know
// note that files getting imported must continue working in browser
// change must not require massive restructuring of existing code
eval(fs.readFileSync("../lunar_assembler_helpful_functions_for_map_styles_openstreetmap_tagging_knowledge.js") + "");
eval(fs.readFileSync("../lunar_assembler_helpful_functions_for_map_styles_unified_styling_handler.js") + "");
eval(fs.readFileSync("../lunar_assembler_helpful_functions_for_map_styles_generate_symbolic_steps_from_area_highway.js") + "");
eval(fs.readFileSync("general_high_zoom_map_style.js") + "");
eval(fs.readFileSync("laser_road_area_map_style.js") + "");
eval(fs.readFileSync("laser_neighbourhood_map_style.js") + "");

// syntax_documentation: https://wiki.openstreetmap.org/wiki/Taginfo/Projects#Project_Files
function infoDocsJSON(dataURL, projectName, projectDescription, projectDocs, tagList) {
  return {
    data_format: 1,
    data_url: dataURL,
    project: {
      name: projectName,
      description: projectDescription,
      icon_url: "https://mapsaregreat.com/favicon.svg",
      project_url: "https://github.com/matkoniecz/lunar_assembler",
      doc_url: projectDocs,
      contact_name: "Mateusz Konieczny",
      contact_email: "matkoniecz@tutanota.com",
    },
    tags: tagList,
  };
}

function showErrorIfpresent(error) {
  if (error != null) {
    console.error(error);
  }
}

function geenratePrettyJsonString(json) {
  return JSON.stringify(json, null, 2) + "\n";
}
function writeGeneratedTaginfoSummary(taginfoData, filename) {
  fs.writeFile(filename, geenratePrettyJsonString(taginfoData), showErrorIfpresent);
}
var taginfo, filename;

filename = "generated/general_high_zoom_taginfo.json";
taginfo = infoDocsJSON(
  "https://raw.githubusercontent.com/matkoniecz/lunar_assembler/master/examples/" + filename,
  "area:highway included, general map style for SVG maps of zoomed in areas (city and smaller)",
  "Map to produce SVG maps of tiny and small areas - from single crossing to a city. Lunar Assembler map style.",
  "https://mapsaregreat.com/osm_to_svg_in_browser/general_high_zoom",
  generateTaginfoListing(highZoomMapStyle().unifiedStyling())
);
writeGeneratedTaginfoSummary(taginfo, filename);

filename = "generated/laser_road_area_taginfo.json";
taginfo = infoDocsJSON(
  "https://raw.githubusercontent.com/matkoniecz/lunar_assembler/master/examples/" + filename,
  "laser SVG map of a crossing, based on area:highway",
  "Map to produce tactile maps for blind. Generated maps are for use in a laser cutter. Lunar Assembler map style.",
  "https://mapsaregreat.com/osm_to_svg_in_browser/laser_road_area.html",
  generateTaginfoListing(laserRoadAreaMapStyle().unifiedStyling())
);
writeGeneratedTaginfoSummary(taginfo, filename);

filename = "generated/laser_neighbourhood_taginfo.json";
taginfo = infoDocsJSON(
  "https://raw.githubusercontent.com/matkoniecz/lunar_assembler/master/examples/" + filename,
  "laser SVG map of a neighbourhood",
  "Map to produce tactile maps for blind. Generated maps are for use in a laser cutter. Lunar Assembler map style.",
  "https://mapsaregreat.com/osm_to_svg_in_browser/laser_neighbourhood.html",
  generateTaginfoListing(highZoomLaserMapStyle().unifiedStyling())
);
writeGeneratedTaginfoSummary(taginfo, filename);
