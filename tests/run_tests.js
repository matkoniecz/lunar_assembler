var fs = require("fs");

// yes it is hack - if you are aware about a better way let me know
// note that files getting imported must continue working in browser
// change must not require massive restructuring of existing code
eval(fs.readFileSync("../lunar_assembler_helpful_functions_for_map_styles_openstreetmap_tagging_knowledge.js") + "");

console.assert(5 == getTotalKnownLaneCount({'properties': {'lanes': '5'}}), "lane tag parsing");
console.assert(5 == getTotalKnownLaneCount({'properties': {'lanes': '5', 'parking:lane:both': 'no'}}), "lane tag parsing");
// console.assert(5 == 1, "message");