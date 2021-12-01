const { debug } = require("console");
var fs = require("fs");

// yes it is hack - if you are aware about a better way let me know
// note that files getting imported must continue working in browser
// change must not require massive restructuring of existing code
eval(fs.readFileSync("../lunar_assembler_helpful_functions_for_map_styles_openstreetmap_tagging_knowledge.js") + "");

console.assert(7 == getTotalKnownLaneCount({ properties: { lanes: "5" } }), "lane tag parsing, assume presence of extra lanes");
console.assert(1 == getTotalKnownLaneCount({ properties: { lanes: "1", 'highway': 'service' } }), "lane tag parsing, do not assume presence of extra lanes for highway=service");
console.assert(5 == getTotalKnownLaneCount({ properties: { lanes: "5", "parking:lane:both": "no" } }), "lane tag parsing");
console.assert(3 == getTotalKnownLaneCount({ properties: { lanes: "1", highway: "tertiary" } }), "lane tag parsing, assume presence of parking lanes");

eval(fs.readFileSync("../lunar_assembler_helpful_functions_for_map_styles_generate_inaccessible_areas.js") + "");

var path = { properties: { highway: "path", bicycle: "designated", foot: "designated" } };
console.assert(isFeatureMakingFreePedestrianMovementPossible(path), "foot-cycle path is passable");
// console.assert(5 == 1, "message");
